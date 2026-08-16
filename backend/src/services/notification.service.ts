import { prisma } from "../lib/db.js";
import { sendPushToUser, type PushPayload } from "./push.service.js";

/**
 * Notification service — the one way anything in this codebase tells a person
 * something happened.
 *
 * Every notification is persisted first and pushed second. That order is the
 * whole design: a push is a best-effort tap on the shoulder that a locked
 * phone, a revoked permission, or an offline device can swallow silently, so
 * the durable inbox row is what actually guarantees the message is seen. The
 * bell in the dashboard reads the rows; the push only shortens the wait.
 *
 * Callers never await these functions for correctness — see `dispatch()`.
 */

/** Categories the UI knows how to draw an icon and a colour for. */
export type NotificationKind =
  | "request"
  | "request_approved"
  | "request_rejected"
  | "appointment"
  | "appointment_approved"
  | "appointment_cancelled"
  | "appointment_reminder"
  | "report"
  | "feedback"
  | "system";

export interface NotifyInput {
  userId: string;
  title: string;
  body: string;
  /** In-app destination for a click. Relative path, e.g. `/requests`. */
  url?: string;
  icon?: string | null;
  kind?: NotificationKind;
  /**
   * Stable identifier for the source event, e.g. `request:abc123:approved`.
   * Unique per user, so the same event processed twice — a retried handler, a
   * double-clicked approve button — cannot produce two notifications.
   */
  dedupeKey?: string;
}

/** Prisma's unique-constraint violation. */
function isDuplicateError(error: unknown): boolean {
  return (error as { code?: string })?.code === "P2002";
}

/**
 * Record a notification and push it to the user's devices.
 *
 * Resolves to the created row, or null when the event was already recorded
 * (deduped) or the write failed. Never throws.
 */
export async function notify(input: NotifyInput) {
  const {
    userId,
    title,
    body,
    url = "/",
    icon = null,
    kind = "system",
    dedupeKey,
  } = input;

  if (!userId) return null;

  let notification;
  try {
    notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        url,
        icon,
        kind,
        dedupeKey: dedupeKey ?? null,
      },
    });
  } catch (error) {
    if (isDuplicateError(error)) {
      // Already told them. Not an error — the guard did its job.
      return null;
    }
    console.error("[Notify] Failed to record notification:", error);
    return null;
  }

  const payload: PushPayload = {
    id: notification.id,
    title,
    body,
    url,
    icon,
    kind,
    createdAt: notification.createdAt.toISOString(),
    // Collapse on the subject, not the event: a request that moves from
    // "approved by staff" to "approved by manager" should replace its own
    // tray entry rather than stack a second one under it.
    tag: dedupeKey ? dedupeKey.split(":").slice(0, 2).join(":") : notification.id,
  };

  const result = await sendPushToUser(userId, payload);

  if (result.sent > 0) {
    await prisma.notification
      .update({
        where: { id: notification.id },
        data: { pushedAt: new Date() },
      })
      .catch(() => {
        /* Delivery bookkeeping — the inbox row is already safe. */
      });
  }

  return notification;
}

/**
 * Notify several people about one event. Recipient ids are deduplicated, so a
 * manager who is also the assigned staff member hears about it once.
 *
 * `dedupeKey` is shared across recipients — that is fine, because the unique
 * constraint is on (userId, dedupeKey).
 */
export async function notifyMany(
  userIds: Array<string | null | undefined>,
  input: Omit<NotifyInput, "userId">,
) {
  const recipients = [...new Set(userIds.filter((id): id is string => !!id))];

  const results = await Promise.all(
    recipients.map((userId) => notify({ ...input, userId })),
  );

  return results.filter((row): row is NonNullable<typeof row> => row !== null);
}

/**
 * Fire a notification without making the caller wait for it.
 *
 * Controllers use this so a slow push service can never delay — or fail — the
 * HTTP response for the action that triggered it. Approving a request must
 * succeed even when every push endpoint on earth is down.
 */
export function dispatch(task: Promise<unknown>): void {
  void task.catch((error) =>
    console.error("[Notify] Background notification failed:", error),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inbox queries
// ─────────────────────────────────────────────────────────────────────────────

export interface ListNotificationsOptions {
  userId: string;
  skip: number;
  take: number;
  /** Restrict to notifications the user has not opened yet. */
  unreadOnly?: boolean;
  kind?: string;
}

export async function listNotifications(options: ListNotificationsOptions) {
  const { userId, skip, take, unreadOnly, kind } = options;

  const where = {
    userId,
    ...(unreadOnly ? { readAt: null } : {}),
    ...(kind ? { kind } : {}),
  };

  const [items, totalItems, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return { items, totalItems, unreadCount };
}

export function countUnread(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

/**
 * Mark one notification read. Scoped by userId so an id guessed from another
 * account is a no-op rather than a cross-account write.
 */
export async function markRead(
  userId: string,
  notificationId: string,
): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}

export async function markAllRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}

export async function deleteNotification(
  userId: string,
  notificationId: string,
): Promise<number> {
  const result = await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });
  return result.count;
}

/** Clear the whole inbox for a user. */
export async function clearNotifications(userId: string): Promise<number> {
  const result = await prisma.notification.deleteMany({ where: { userId } });
  return result.count;
}
