/**
 * Which permissions each dashboard page needs.
 *
 * This is the frontend half of RBAC and exists purely so people are not shown
 * pages they cannot use. It is NOT a security boundary: permissions live in
 * localStorage, which the person sitting at the browser can edit freely. Every
 * rule here has a matching guard on the API — that is what actually protects
 * the data. See backend/src/routes/*.route.ts.
 *
 * Rules:
 *  - A path listed with permissions grants access if the user holds ANY of them.
 *  - A path listed with an empty array is open to any signed-in user.
 *  - A path that is NOT listed is DENIED. New pages are locked until their
 *    access is declared here on purpose, so forgetting to add an entry fails
 *    closed rather than open.
 *  - Dynamic segments are written as `[param]` and match one path segment.
 */
export const PAGE_ACCESS: Record<string, string[]> = {
  // ── Always available to a signed-in user ─────────────────────────────────
  "/dashboard": [],
  "/profile": [],
  "/settings": [],
  "/notifications": [],

  // ── Role landing pages ───────────────────────────────────────────────────
  "/admin-overview": ["page:admin:overview", "dashboard:admin"],
  "/manager-overview": ["page:manager:overview", "dashboard:manager"],
  "/staff-overview": ["page:staff:overview", "dashboard:staff"],
  "/customer-overview": ["page:customer:overview", "dashboard:customer"],

  // ── Customer self-service ────────────────────────────────────────────────
  "/apply-service": ["page:customer:apply-service", "request:create"],
  "/requests": ["page:customer:request", "request:read"],
  "/appointments": [
    "page:customer:appointment",
    "page:staff:appointment",
    "page:manager:appointment",
    "appointment:read",
  ],
  "/feedback": ["page:customer:feedback", "feedback:read"],

  // ── Work queues ──────────────────────────────────────────────────────────
  "/requestManagement": [
    "page:admin:request-management",
    "page:manager:request-management",
    "page:staff:request-management",
    "request:view-all",
  ],
  "/report": ["page:staff:report", "page:manager:report", "report:read"],
  "/reportManagement": [
    "page:admin:report",
    "page:manager:report",
    "report:view-all",
  ],

  // ── Office administration ────────────────────────────────────────────────
  "/offices": ["page:admin:office", "office:manage"],
  "/offices/[id]": ["page:admin:office", "office:manage"],
  "/offices/my": ["page:admin:my-office", "office:configure"],
  "/availability": ["page:manager:availability", "office:configure"],
  "/configuration": ["page:manager:configuration", "configuration:read"],

  // ── Services and staff ───────────────────────────────────────────────────
  "/services": [
    "page:manager:services",
    "page:staff:service-management",
    "service:manage",
  ],
  "/staff": ["page:manager:staff", "staff:read"],

  // ── User and access administration ───────────────────────────────────────
  "/users": ["page:admin:user-management", "user:read"],
  "/security/roles": ["page:admin:roles", "role:read"],
  "/security/roles/new": ["page:admin:roles", "role:create"],
  "/security/roles/[roleId]/edit": ["page:admin:roles", "role:update"],
  "/security/permissions": ["page:admin:permissions", "permission:read"],
  "/security/permissions/new": ["page:admin:permissions", "permission:manage"],
  "/security/permissions/[permissionId]/edit": [
    "page:admin:permissions",
    "permission:manage",
  ],
  "/security/audit-logs": ["page:admin:audit-logs", "audit_logs.view"],

  // ── Content administration ───────────────────────────────────────────────
  "/gallery-management": ["page:admin:gallery", "gallery:manage"],
  "/about-management": ["page:admin:about", "about:manage"],
  "/languages": ["page:admin:languages", "language:read"],
  "/languages/overview": ["page:admin:languages", "language:read"],
};

/**
 * Resolve a concrete pathname to its declared permissions.
 *
 * Returns `undefined` when the page is not declared at all, which callers must
 * treat as "denied" — the default-closed half of the contract above.
 */
export function resolvePageAccess(pathname: string): string[] | undefined {
  const path = normalizePath(pathname);

  const exact = PAGE_ACCESS[path];
  if (exact) return exact;

  const segments = path.split("/").filter(Boolean);
  for (const [pattern, permissions] of Object.entries(PAGE_ACCESS)) {
    if (matchesPattern(pattern, segments)) return permissions;
  }

  return undefined;
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/** `[param]` matches exactly one segment; every other segment is literal. */
function matchesPattern(pattern: string, segments: string[]): boolean {
  const patternSegments = pattern.split("/").filter(Boolean);
  if (patternSegments.length !== segments.length) return false;

  return patternSegments.every((patternSegment, index) => {
    if (patternSegment.startsWith("[") && patternSegment.endsWith("]")) {
      return Boolean(segments[index]);
    }
    return patternSegment === segments[index];
  });
}
