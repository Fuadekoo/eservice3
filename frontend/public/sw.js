/**
 * e-Service service worker.
 *
 * Registered from components/providers/pwa-provider.tsx — production only.
 * Bump CACHE_VERSION whenever the caching strategy below changes; old caches
 * are dropped on activate.
 *
 * Strategy:
 *   navigations      → network first, fall back to cache, then /offline
 *   /_next/static/*  → cache first (content-hashed filenames, safe forever)
 *   images & fonts   → stale-while-revalidate
 *   everything else  → straight to network, never cached
 *
 * API traffic is never cached: responses are per-user and auth-scoped, and a
 * stale request list or profile is worse than an error message.
 *
 * This worker also receives Web Push: see the `push` and `notificationclick`
 * handlers at the bottom.
 */

const CACHE_VERSION = "v2";
const SHELL_CACHE = `eservice-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `eservice-assets-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

// Kept deliberately small — anything that 404s here fails the whole addAll().
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Individual puts so one missing file can't abort the install.
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// Lets the page tell a waiting worker to take over immediately.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") void self.skipWaiting();
});

/** Never cache anything auth- or user-scoped. */
function isPrivatePath(pathname) {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/filedata/")
  );
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    /\.(?:png|jpe?g|svg|gif|webp|avif|ico|woff2?|ttf|otf)$/i.test(pathname)
  );
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (
      (await cache.match(request)) ??
      (await cache.match(OFFLINE_URL)) ??
      Response.error()
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetching = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  if (cached) return cached;
  return (await fetching) ?? Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only same-origin GETs are ours to handle.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isPrivatePath(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   Web Push
   ══════════════════════════════════════════════════════════════════════════ */

const DEFAULT_ICON = "/icons/icon-192.png";
const BADGE_ICON = "/icons/icon-192.png";

/**
 * Per-kind presentation. `requireInteraction` is reserved for outcomes a
 * person has been waiting on — an approval or a rejection stays on screen
 * until acknowledged, while routine "a request came in" traffic auto-dismisses
 * so a busy desk isn't left clearing a wall of notifications.
 */
const KIND_STYLES = {
  request: { requireInteraction: false },
  request_approved: { requireInteraction: true },
  request_rejected: { requireInteraction: true },
  appointment: { requireInteraction: false },
  appointment_approved: { requireInteraction: true },
  appointment_cancelled: { requireInteraction: true },
  appointment_reminder: { requireInteraction: true },
  report: { requireInteraction: false },
  feedback: { requireInteraction: false },
  system: { requireInteraction: false },
};

/**
 * A push with an unreadable body still has to surface something. Silently
 * swallowing it is not an option: browsers may unsubscribe a worker that
 * receives a push and shows no notification.
 */
function parsePushData(event) {
  const fallback = {
    title: "e-Service",
    body: "You have a new notification.",
    url: "/notifications",
    kind: "system",
  };

  if (!event.data) return fallback;

  try {
    const parsed = event.data.json();
    return {
      id: parsed.id,
      title: parsed.title || fallback.title,
      body: parsed.body || fallback.body,
      url: parsed.url || fallback.url,
      icon: parsed.icon || undefined,
      kind: parsed.kind || fallback.kind,
      createdAt: parsed.createdAt,
      tag: parsed.tag,
    };
  } catch {
    // Some push services deliver plain text during testing.
    return { ...fallback, body: event.data.text() || fallback.body };
  }
}

/** Tell every open tab so the bell badge updates without waiting for a poll. */
async function broadcast(message) {
  const clientList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of clientList) {
    client.postMessage(message);
  }
}

self.addEventListener("push", (event) => {
  const data = parsePushData(event);
  const style = KIND_STYLES[data.kind] ?? KIND_STYLES.system;

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || DEFAULT_ICON,
        badge: BADGE_ICON,
        // Same tag replaces rather than stacks, so a request that changes
        // status twice leaves one current entry instead of a stale pair.
        tag: data.tag || data.id || "eservice",
        renotify: Boolean(data.tag || data.id),
        requireInteraction: style.requireInteraction,
        timestamp: data.createdAt ? Date.parse(data.createdAt) : Date.now(),
        data: { url: data.url, id: data.id, kind: data.kind },
        actions: [
          { action: "open", title: "View" },
          { action: "dismiss", title: "Dismiss" },
        ],
      });

      await broadcast({ type: "PUSH_RECEIVED", payload: data });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const { url = "/notifications", id } = event.notification.data ?? {};

  // The id rides along in the query string rather than being marked read from
  // here: the worker has no access to the session token, and this path has to
  // work when the click happens with the app fully closed.
  const target = id
    ? `${url}${url.includes("?") ? "&" : "?"}notification=${encodeURIComponent(id)}`
    : url;

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Reuse a tab that is already on this origin — opening a duplicate
      // window for every notification is how you end up with fifteen.
      for (const client of clientList) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        await client.focus();
        if ("navigate" in client) {
          await client.navigate(target).catch(() => {
            client.postMessage({ type: "NAVIGATE", url: target });
          });
        } else {
          client.postMessage({ type: "NAVIGATE", url: target });
        }
        return;
      }

      await self.clients.openWindow(target);
    })(),
  );
});

self.addEventListener("notificationclose", (event) => {
  const { id } = event.notification.data ?? {};
  if (id) void broadcast({ type: "PUSH_DISMISSED", id });
});

/**
 * Push services rotate endpoints on their own schedule. The worker re-creates
 * the subscription immediately so no push is lost, then asks the page to
 * persist it — the worker itself cannot call the API, which needs the session
 * token held in the page. If no tab is open, the next app load re-syncs.
 */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const applicationServerKey =
        event.oldSubscription?.options?.applicationServerKey;
      if (!applicationServerKey) return;

      try {
        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        await broadcast({
          type: "PUSH_SUBSCRIPTION_CHANGED",
          subscription: subscription.toJSON(),
          oldEndpoint: event.oldSubscription?.endpoint,
        });
      } catch (error) {
        console.error("[SW] Failed to renew push subscription:", error);
      }
    })(),
  );
});
