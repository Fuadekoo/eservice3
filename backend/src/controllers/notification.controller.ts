import type { Response } from "express";

import type { AuthRequest } from "../middleware/auth.js";
import {
  parsePaginationParams,
  createPaginatedResponse,
} from "../utils/pagination.js";
import {
  clearNotifications,
  countUnread,
  deleteNotification,
  listNotifications,
  markAllRead,
  markRead,
} from "../services/notification.service.js";
import {
  getVapidPublicKey,
  isPushConfigured,
  listSubscriptions,
  removeSubscription,
  saveSubscription,
  sendPushToUser,
} from "../services/push.service.js";
import { subscribeSchema, buildValidationError } from "../validators/notification.validator.js";

/**
 * Notification + Web Push endpoints.
 *
 * Every route here is scoped to the caller. There is deliberately no
 * "notifications for user X" endpoint — an inbox is personal, and the service
 * layer enforces ownership on every read and write rather than trusting an id
 * from the query string.
 */

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  url: string;
  icon: string | null;
  kind: string;
  createdAt: Date;
  pushedAt: Date | null;
  readAt: Date | null;
};

function formatNotification(notification: NotificationRow) {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    url: notification.url,
    icon: notification.icon,
    kind: notification.kind,
    isRead: notification.readAt !== null,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

/**
 * GET /notifications — the caller's inbox, newest first.
 * Supports `?unreadOnly=true` and `?kind=request`.
 */
export async function getNotifications(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const pagination = parsePaginationParams(req);
  const unreadOnly = req.query.unreadOnly === "true";
  const kind = typeof req.query.kind === "string" ? req.query.kind : undefined;

  const { items, totalItems, unreadCount } = await listNotifications({
    userId,
    skip: pagination.skip,
    take: pagination.take,
    unreadOnly,
    ...(kind ? { kind } : {}),
  });

  const paginated = createPaginatedResponse(
    items.map(formatNotification),
    totalItems,
    pagination,
  );

  return res.status(200).json({
    success: true,
    ...paginated,
    unreadCount,
  });
}

/**
 * GET /notifications/unread-count — polled by the bell badge, so it stays a
 * single indexed COUNT and returns nothing else.
 */
export async function getUnreadCount(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const unreadCount = await countUnread(userId);
  return res.status(200).json({ success: true, data: { unreadCount } });
}

/** PATCH /notifications/:id/read */
export async function readNotification(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const notificationId = req.params.id as string;
  await markRead(userId, notificationId);
  const unreadCount = await countUnread(userId);

  // Idempotent: marking an already-read notification is a success, not a 404.
  return res.status(200).json({ success: true, data: { unreadCount } });
}

/** PATCH /notifications/read-all */
export async function readAllNotifications(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const updated = await markAllRead(userId);
  return res.status(200).json({
    success: true,
    data: { updated, unreadCount: 0 },
    message: `${updated} notification(s) marked as read`,
  });
}

/** DELETE /notifications/:id */
export async function removeNotification(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const deleted = await deleteNotification(userId, req.params.id as string);
  if (deleted === 0) {
    return res
      .status(404)
      .json({ success: false, error: "Notification not found" });
  }

  const unreadCount = await countUnread(userId);
  return res.status(200).json({ success: true, data: { unreadCount } });
}

/** DELETE /notifications — empty the caller's inbox. */
export async function clearAllNotifications(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const deleted = await clearNotifications(userId);
  return res.status(200).json({
    success: true,
    data: { deleted },
    message: `${deleted} notification(s) cleared`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Web Push
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /notifications/push/public-key
 *
 * Unauthenticated on purpose — it is a public key, and the browser needs it
 * before it can build the subscription that the authenticated POST below
 * stores. `enabled: false` lets the UI hide the whole feature cleanly when the
 * server has no VAPID pair configured, instead of failing at permission time.
 */
export async function getPushPublicKey(_req: AuthRequest, res: Response) {
  return res.status(200).json({
    success: true,
    data: {
      enabled: isPushConfigured(),
      publicKey: getVapidPublicKey(),
    },
  });
}

/** POST /notifications/push/subscribe */
export async function subscribeToPush(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  if (!isPushConfigured()) {
    return res.status(503).json({
      success: false,
      error: "Push notifications are not configured on this server",
    });
  }

  const validation = subscribeSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      errors: buildValidationError(validation.error),
    });
  }

  const { endpoint, keys } = validation.data;

  const subscription = await saveSubscription(
    userId,
    { endpoint, keys },
    req.headers["user-agent"] ?? null,
  );

  return res.status(201).json({
    success: true,
    data: { id: subscription.id },
    message: "Push subscription saved",
  });
}

/**
 * DELETE /notifications/push/subscribe
 *
 * Takes the endpoint in the body because a DELETE with a 500-character
 * identifier in the path runs into URL length limits on some proxies.
 */
export async function unsubscribeFromPush(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const endpoint = req.body?.endpoint;
  if (typeof endpoint !== "string" || endpoint.length === 0) {
    return res
      .status(400)
      .json({ success: false, error: "endpoint is required" });
  }

  const removed = await removeSubscription(userId, endpoint);
  return res.status(200).json({
    success: true,
    data: { removed },
    message: removed > 0 ? "Unsubscribed" : "Subscription was already removed",
  });
}

/** GET /notifications/push/devices — the caller's registered browsers. */
export async function getPushDevices(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const devices = await listSubscriptions(userId);
  return res.status(200).json({
    success: true,
    data: devices.map((device) => ({
      id: device.id,
      endpoint: device.endpoint,
      userAgent: device.userAgent,
      createdAt: device.createdAt.toISOString(),
      lastSeenAt: device.lastSeenAt.toISOString(),
    })),
  });
}

/**
 * POST /notifications/push/test
 *
 * Sends a push to the caller's own devices without writing an inbox row —
 * this is a plumbing check, not a real notification. Reports how many
 * endpoints accepted it so a user who enabled notifications on one browser
 * and expects them on another can see the difference.
 */
export async function sendTestPush(req: AuthRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  if (!isPushConfigured()) {
    return res.status(503).json({
      success: false,
      error: "Push notifications are not configured on this server",
    });
  }

  const result = await sendPushToUser(userId, {
    title: "Notifications are working",
    body: "This is a test notification from e-Service.",
    url: "/notifications",
    kind: "system",
    tag: "system:test",
  });

  return res.status(200).json({
    success: true,
    data: result,
    message:
      result.sent > 0
        ? `Test notification sent to ${result.sent} device(s)`
        : "No device accepted the test notification. Enable notifications on this browser first.",
  });
}
