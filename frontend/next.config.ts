import path from "node:path";
import type { NextConfig } from "next";

const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Origin of the API, when it is not same-origin.
 *
 * Behind the reverse proxy `NEXT_PUBLIC_API_BASE_URL` is the path `/back-api`,
 * so `'self'` already covers it. Pointed at an absolute URL — local development
 * against :4000, or a split deployment — that origin has to be named or the
 * browser blocks every request the page makes.
 */
function apiOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configured || configured.startsWith("/")) return null;
  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

/**
 * Content Security Policy.
 *
 * `script-src` allows inline script, which is not what one would choose: it
 * means CSP is not what stops an injected `<script>` from running. The reason
 * is that 40 of this app's 42 pages are prerendered at build time, so there is
 * no request in which to mint the per-request nonce a strict policy needs — a
 * nonce would simply be absent and every script on those pages would be
 * blocked. (Adding a nonce *and* 'unsafe-inline' is not a middle ground
 * either: browsers ignore 'unsafe-inline' as soon as a nonce is present.)
 *
 * Script injection is therefore held off by the layers that do work here: the
 * API rejects request bodies containing script, React escapes everything it
 * renders, and the one place that renders stored HTML runs it through a tag
 * allowlist first.
 *
 * What this policy still buys, and none of it is theoretical:
 *   - no script may be loaded from another origin
 *   - no plugin content at all (`object-src 'none'`)
 *   - an injected `<base>` cannot re-point every relative URL (`base-uri`)
 *   - forms cannot post credentials to another host (`form-action`)
 *   - the site cannot be framed for clickjacking (`frame-ancestors`)
 *
 * To get the strict version, the pages would have to render dynamically; that
 * is a deliberate performance trade, not something to switch on quietly.
 */
function contentSecurityPolicy(): string {
  const api = apiOrigin();

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'unsafe-eval' is needed by the dev-mode React refresh runtime only.
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(IS_DEV ? ["'unsafe-eval'"] : []),
    ],
    // Inline styles cannot execute script; several components set style={{…}}.
    "style-src": ["'self'", "'unsafe-inline'"],
    // Uploads stream through the same-origin /api/uploads route; dicebear
    // matches the remotePatterns above.
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://api.dicebear.com",
      ...(api ? [api] : []),
    ],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      ...(api ? [api] : []),
      // The dev server pushes HMR updates over a websocket.
      ...(IS_DEV ? ["ws:", "wss:"] : []),
    ],
    // The PDF viewer frames a blob: URL; how-to-apply embeds a YouTube video.
    "frame-src": [
      "'self'",
      "blob:",
      "https://www.youtube.com",
      "https://www.youtube-nocookie.com",
    ],
    "media-src": ["'self'", "blob:", "data:"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  // Deliberately no `upgrade-insecure-requests`: the service is reachable over
  // plain HTTP and that directive would rewrite every request to https.

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/7.x/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "4000",
        pathname: "/uploads/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Baseline security headers for every response.
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy() },
          // Stops the browser guessing a response is script/HTML when the
          // Content-Type says otherwise — the defence that keeps an uploaded
          // file from being executed as a page.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Clickjacking. Modern browsers use the CSP frame-ancestors
          // directive; this covers the ones that do not.
          { key: "X-Frame-Options", value: "DENY" },
          // Never leak a dashboard URL (which can contain record ids) to a
          // third-party site the user clicks through to.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Hardware and background APIs this app never uses.
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), interest-cohort=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
      {
        // Without no-cache the browser can sit on a stale worker for up to 24h.
        // Service-Worker-Allowed lets /sw.js control the whole origin.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Content-Type", value: "application/manifest+json" },
        ],
      },
    ];
  },
};

export default nextConfig;
