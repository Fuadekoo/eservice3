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
 */

const CACHE_VERSION = "v1";
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
