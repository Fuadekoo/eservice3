import { axiosInstance } from "@/lib/axios";

/**
 * Browser-side Web Push plumbing.
 *
 * Three things have to line up before a notification can arrive: the browser
 * supports push, the user has granted permission, and the server holds a copy
 * of this browser's subscription. Any of them can fall out of sync on its own
 * — permission revoked in site settings, subscription expired by the push
 * service, database restored from a backup — so every function here is written
 * to be safe to call repeatedly and reports what it found rather than assuming.
 */

export type PushPermission = "granted" | "denied" | "default" | "unsupported";

/** True when this browser can do Web Push at all (Safari < 16.4 cannot). */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPermission(): PushPermission {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission as PushPermission;
}

/**
 * An iOS home-screen install is the only place iOS grants push. Worth
 * detecting so the UI can say "add e-Service to your Home Screen first"
 * instead of showing a button that silently does nothing.
 */
export function isIosWithoutStandalone(): boolean {
  if (typeof window === "undefined") return false;

  const isIos = /iP(hone|ad|od)/i.test(navigator.userAgent);
  if (!isIos) return false;

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return !standalone;
}

/**
 * VAPID keys travel as URL-safe base64; PushManager wants raw bytes.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);

  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

let cachedPublicKey: string | null | undefined;

/**
 * The server's VAPID public key. Read from the build-time env when present,
 * otherwise fetched once and cached — the value never changes at runtime.
 * Returns null when the server has push disabled, which callers treat as
 * "hide the feature" rather than as an error.
 */
export async function getPublicKey(): Promise<string | null> {
  if (cachedPublicKey !== undefined) return cachedPublicKey;

  const fromEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (fromEnv) {
    cachedPublicKey = fromEnv;
    return cachedPublicKey;
  }

  try {
    const response = await axiosInstance.get("/notifications/push/public-key");
    cachedPublicKey = response?.data?.enabled
      ? (response.data.publicKey as string)
      : null;
  } catch {
    cachedPublicKey = null;
  }

  return cachedPublicKey;
}

/**
 * The active service worker registration.
 *
 * `navigator.serviceWorker.ready` never rejects — it simply waits forever if
 * no worker is registered — so it is raced against a timeout. Hanging here
 * would leave the settings toggle spinning with no explanation.
 */
async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;

  const timeout = new Promise<null>((resolve) =>
    window.setTimeout(() => resolve(null), 8000),
  );

  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

/** This browser's current subscription, if it has one. */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const registration = await getRegistration();
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

/** Hand a subscription to the API so the server can push to it. */
async function persistSubscription(subscription: PushSubscription) {
  await axiosInstance.post(
    "/notifications/push/subscribe",
    subscription.toJSON(),
  );
}

export type SubscribeResult =
  | { status: "subscribed" }
  | { status: "denied" }
  | { status: "unsupported" }
  | { status: "unavailable"; reason: string };

/**
 * Turn notifications on for this browser: ask for permission, create the
 * subscription, and register it server-side.
 *
 * Must be called from a user gesture — browsers reject a permission prompt
 * that no one asked for, and rightly so.
 */
export async function subscribeToPush(): Promise<SubscribeResult> {
  if (!isPushSupported()) return { status: "unsupported" };

  const publicKey = await getPublicKey();
  if (!publicKey) {
    return {
      status: "unavailable",
      reason: "Push notifications are not configured on the server.",
    };
  }

  const registration = await getRegistration();
  if (!registration) {
    return {
      status: "unavailable",
      reason:
        "The service worker is not active yet. Reload the page and try again.",
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  // An existing subscription created under a different VAPID key is
  // undeliverable, so it is replaced rather than reused.
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    const existingKey = existing.options?.applicationServerKey;
    const matches =
      existingKey &&
      btoa(String.fromCharCode(...new Uint8Array(existingKey)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "") === publicKey;

    if (matches) {
      await persistSubscription(existing);
      return { status: "subscribed" };
    }

    await existing.unsubscribe().catch(() => {
      /* Replaced below regardless. */
    });
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  await persistSubscription(subscription);
  return { status: "subscribed" };
}

/**
 * Turn notifications off for this browser only — other devices keep theirs.
 * The server row is dropped first: a subscription the browser has discarded
 * but the server still holds produces pushes nobody ever sees.
 */
export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getCurrentSubscription();
  if (!subscription) return;

  await axiosInstance
    .delete("/notifications/push/subscribe", {
      data: { endpoint: subscription.endpoint },
    })
    .catch(() => {
      /* Best effort — a stale row is pruned on its first failed delivery. */
    });

  await subscription.unsubscribe().catch(() => {
    /* Already gone. */
  });
}

/**
 * Reconcile server state with what this browser actually holds.
 *
 * Called on app load. It only ever re-registers an existing subscription — it
 * never prompts — so it is safe to run unattended on every mount.
 */
export async function syncSubscription(): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== "granted") return false;

  const subscription = await getCurrentSubscription();
  if (!subscription) return false;

  try {
    await persistSubscription(subscription);
    return true;
  } catch {
    return false;
  }
}

/** Ask the server to push a notification back to this account's devices. */
export async function sendTestPush(): Promise<{ sent: number }> {
  const response = await axiosInstance.post("/notifications/push/test");
  return { sent: response?.data?.sent ?? 0 };
}
