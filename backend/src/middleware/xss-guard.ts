import type { Request, Response, NextFunction } from "express";

/**
 * Global input guard against stored/reflected XSS (OWASP A03 – Injection).
 *
 * Runs on every API request after the body parsers. It walks the request body
 * (and query string) recursively and rejects the request with `400
 * ValidationError` as soon as any string value contains a script / HTML
 * injection payload. Because it sits in front of every route, no controller can
 * accidentally persist a `<script>`, an inline event handler, or a
 * `javascript:` URL — the settings forms, testimonials, chat, and every other
 * input field are covered by this single control.
 *
 * The patterns are intentionally scoped to genuine attack vectors (tags and
 * handlers) rather than bare angle brackets, so legitimate plain text such as
 * "a < b", "<3", or "1 > 0" is still accepted. Fields that must forbid angle
 * brackets entirely (e.g. testimonials) keep their own stricter Zod rules on
 * top of this baseline.
 */

// Each pattern requires an actual HTML tag / handler / dangerous URI, so normal
// prose with stray comparison operators is not flagged.
const XSS_PATTERNS: RegExp[] = [
  // Opening or closing dangerous elements: <script>, </script>, <iframe …, etc.
  /<\s*\/?\s*(script|iframe|object|embed|svg|math|link|meta|base|form|style|applet|frame|frameset|marquee|template|noscript)\b/i,
  // Any tag carrying an inline event handler, e.g. <img src=x onerror=…>.
  // "/" is an attribute separator in HTML, so <img/onerror=…> must match too.
  /<[a-z!][^>]*[\s/]on\w+\s*=/i,
  // Any tag whose attribute value uses a script-bearing URI scheme.
  /<[a-z][^>]*\b(?:href|src|action|formaction|xlink:href|data)\s*=\s*["'`]?\s*(?:javascript|vbscript|data\s*:\s*text\/html)/i,
  // Naked script/vbscript URI (covers cases parsed outside a tag).
  /\b(?:javascript|vbscript)\s*:[^\s]*\(/i,
];

/**
 * Secret fields are hashed or signed and never rendered as HTML, so a payload
 * here can't execute. They are skipped so that a password like "<script!>x" is
 * rejected by the password policy rather than by an XSS error the user can't
 * make sense of.
 */
const SKIPPED_KEYS = new Set([
  "password",
  "newPassword",
  "oldPassword",
  "currentPassword",
  "confirmPassword",
  "token",
  "refreshToken",
  "accessToken",
]);

function containsScript(value: string): boolean {
  return XSS_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Recursively scan a value for a script payload, returning the dotted path of
 * the first offending field (or null when the value is clean).
 */
function findScript(value: unknown, path: string): string | null {
  if (typeof value === "string") {
    return containsScript(value) ? path || "body" : null;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = findScript(value[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (SKIPPED_KEYS.has(key)) continue;
      const hit = findScript(child, path ? `${path}.${key}` : key);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * The URL as the application will read it. Route params are filled in by the
 * router, which runs after this middleware, so the path is scanned instead —
 * a payload in `/requests/<script>…` is in the path either way. Percent-
 * encoding is undone first so `%3Cscript%3E` cannot slip past.
 */
function decodedPath(req: Request): string {
  const raw = req.originalUrl || req.url || "";
  try {
    return decodeURIComponent(raw);
  } catch {
    // Malformed encoding: fall back to the raw form rather than throwing, so a
    // broken URL is still scanned instead of skipping the check entirely.
    return raw;
  }
}

/**
 * Second pass for `multipart/form-data` routes.
 *
 * `xssGuard` runs once, after the JSON body parsers — but a multipart body is
 * only parsed by multer inside the route, so at that point `req.body` is still
 * empty and any text field travelling alongside the file goes unchecked. Mount
 * this straight after the multer middleware on any route that accepts one.
 */
export function xssGuardMultipart(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  xssGuard(req, res, next);
}

export function xssGuard(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const offending =
    findScript(req.body, "") ??
    findScript(req.query, "") ??
    (containsScript(decodedPath(req)) ? "url" : null);

  if (offending) {
    res.status(400).json({
      error: "ValidationError",
      message: "One or more fields are invalid.",
      details: [
        {
          path: offending,
          message: "Scripts and HTML tags are not allowed.",
        },
      ],
    });
    return;
  }

  next();
}
