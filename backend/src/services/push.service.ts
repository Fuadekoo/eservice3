import webpush from "web-push";

import { prisma } from "../lib/db.js";

/**
 * Web Push transport.
 *
 * This module owns exactly one concern: getting an encrypted payload onto a
 * browser's push service and keeping the subscription table honest about which
 * endpoints are still alive. Deciding *what* to say — and recording it in the
 * inbox — belongs to notification.service.ts.
 *
 * Configuration is a VAPID key pair, generated once with `npm run vapid` and
 * held in the environment. Rotating the pair invalidates every stored
 * subscription, because a browser's endpoint is bound to the public key that
 * created it, so treat the keys as long-lived secrets rather than something to
 * regenerate per deploy.
 */

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY?.trim() ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY?.trim() ?? "";

/**
 * RFC 8292 requires a contactable subject so a push service can reach the
 * operator about a misbehaving sender. Must be a `mailto:` or `https:` URI.
 */
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT?.trim() || "mailto:admin@eservice.local";

let configured = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    configured = true;
    console.log("[Push] ✅ Web Push configured (VAPID keys loaded)");
  } catch (error) {
    // A malformed key pair must not take the process down — the rest of the
    // API works fine without push, and every send below degrades to a no-op.
    console.error(
      "[Push] ❌ Invalid VAPID configuration; web push is disabled.",
      error,
    );
  }
} else {
  console.warn(
    "[Push] ⚠️  VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not set — " +
      "notifications will still be saved to the inbox, but nothing is pushed. " +
      "Run `npm run vapid` in backend/ to generate a key pair.",
  );
}

/** Whether pushes can actually be delivered right now. */
export function isPushConfigured(): boolean {
  return configured;
}

/**
 * The public half of the VAPID pair, handed to the browser so it can create a
 * subscription bound to this server. Safe to expose — it is a public key.
 */
export function getVapidPublicKey(): string | null {
  return configured ? VAPID_PUBLIC_KEY : null;
}

/** What the service worker receives, JSON-encoded, inside the push event. */
export interface PushPayload {
  /** Notification row id, so a click can mark exactly this one read. */
  id?: string;
  title: string;
  body: string;
  /** Where a click lands. Relative to the frontend origin. */
  url?: string;
  icon?: string | null;
  kind?: string;
  createdAt?: string;
  /**
   * Collapse key. Two pushes sharing a tag replace one another in the tray
   * rather than stacking — which is what you want when a request's status
   * changes twice in a row.
   */
  tag?: string;
}

export interface SubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Store (or re-point) a browser subscription.
 *
 * Keyed on the endpoint rather than on (user, device): the same browser
 * re-subscribing hands back the same endpoint, and a second row for it would
 * double every notification. An endpoint that moves to a different user — a
 * shared kiosk where someone else signs in — is reassigned, not duplicated.
 */
export async function saveSubscription(
  userId: string,
  subscription: SubscriptionInput,
  userAgent?: string | null,
) {
  const { endpoint, keys } = subscription;

  return prisma.webPushSubscription.upsert({
    where: { endpoint },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId,
      userAgent: userAgent?.slice(0, 512) ?? null,
    },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId,
      userAgent: userAgent?.slice(0, 512) ?? null,
      lastSeenAt: new Date(),
    },
  });
}

/**
 * Drop a subscription on sign-out or when the user turns notifications off.
 * Scoped to the owner so one account cannot unsubscribe another's device.
 */
export async function removeSubscription(
  userId: string,
  endpoint: string,
): Promise<number> {
  const result = await prisma.webPushSubscription.deleteMany({
    where: { endpoint, userId },
  });
  return result.count;
}

/** Every device the user has registered, newest first. */
export async function listSubscriptions(userId: string) {
  return prisma.webPushSubscription.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true,
      endpoint: true,
      userAgent: true,
      createdAt: true,
      lastSeenAt: true,
    },
  });
}

export interface PushResult {
  /** Endpoints that accepted the payload. */
  sent: number;
  /** Endpoints that failed for a reason worth retrying later. */
  failed: number;
  /** Dead endpoints deleted during this send. */
  pruned: number;
}

/**
 * A push service answering 404 or 410 is telling us the subscription is gone
 * for good — the browser was uninstalled, the site data cleared, or the
 * endpoint expired. Anything else (429, 5xx, a timeout) is transient and the
 * row stays put.
 */
function isGoneForever(statusCode: number | undefined): boolean {
  return statusCode === 404 || statusCode === 410;
}

/**
 * Deliver one payload to every device a user owns.
 *
 * Never throws: a failing push service must not fail the HTTP request that
 * triggered it. Callers treat notifications as fire-and-forget.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<PushResult> {
  const result: PushResult = { sent: 0, failed: 0, pruned: 0 };

  if (!configured) return result;

  const subscriptions = await prisma.webPushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return result;

  const body = JSON.stringify(payload);
  const deadEndpoints: string[] = [];
  const liveEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          body,
          {
            // Hold undelivered pushes for a day; past that a status update is
            // stale enough that showing it does more harm than dropping it.
            TTL: 60 * 60 * 24,
            urgency: "normal",
          },
        );
        result.sent += 1;
        liveEndpoints.push(subscription.endpoint);
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;

        if (isGoneForever(statusCode)) {
          deadEndpoints.push(subscription.endpoint);
          result.pruned += 1;
          return;
        }

        result.failed += 1;
        console.error(
          `[Push] Delivery failed (${statusCode ?? "no status"}) for ${subscription.endpoint.slice(0, 60)}…`,
          (error as Error).message,
        );
      }
    }),
  );

  // Housekeeping runs after the fan-out so a slow write can't delay delivery.
  if (deadEndpoints.length > 0) {
    await prisma.webPushSubscription
      .deleteMany({ where: { endpoint: { in: deadEndpoints } } })
      .catch((error) =>
        console.error("[Push] Failed to prune dead subscriptions:", error),
      );
  }

  if (liveEndpoints.length > 0) {
    await prisma.webPushSubscription
      .updateMany({
        where: { endpoint: { in: liveEndpoints } },
        data: { lastSeenAt: new Date() },
      })
      .catch(() => {
        /* Bookkeeping only — a failure here changes nothing for the user. */
      });
  }

  return result;
}

/**
 * Same as sendPushToUser, but across a set of recipients. Duplicate ids are
 * collapsed so a person who is both the assigned staff and the office manager
 * is not notified twice for one event.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<PushResult> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const results = await Promise.all(
    unique.map((userId) => sendPushToUser(userId, payload)),
  );

  return results.reduce<PushResult>(
    (total, item) => ({
      sent: total.sent + item.sent,
      failed: total.failed + item.failed,
      pruned: total.pruned + item.pruned,
    }),
    { sent: 0, failed: 0, pruned: 0 },
  );
}
