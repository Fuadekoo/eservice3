/**
 * Sorting permissions into the groups shown on the role forms.
 *
 * Permissions in this system are `subject:action` — `service:update`,
 * `page:manager:staff`. The grouping the role forms used to do split on `.`
 * and `_` and mapped prefixes belonging to a different product entirely
 * (inventory, suppliers, bank accounts), so nothing ever matched and all 121
 * permissions landed in a single "Miscellaneous" heap.
 */

/** Only the fields grouping needs; the real Permission type is wider. */
export type GroupablePermission = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
};

export type PermissionGroup = {
  /** Heading shown on the accordion. */
  name: string;
  permissions: GroupablePermission[];
};

/**
 * Subject prefix to the heading it belongs under.
 *
 * Several subjects share a heading on purpose — roles and permissions are one
 * subject to the person granting them, not two.
 */
const SUBJECT_GROUPS: Record<string, string> = {
  user: "User Accounts",
  staff: "Staff",
  profile: "User Accounts",

  role: "Security & Access",
  permission: "Security & Access",
  audit_logs: "Security & Access",
  otp: "Security & Access",

  office: "Offices",
  configuration: "Offices",
  availability: "Offices",

  service: "Services",
  request: "Service Requests",
  appointment: "Appointments",
  feedback: "Feedback",

  report: "Reports",
  dashboard: "Dashboards",

  gallery: "Content",
  about: "Content",
  language: "Content",

  administration: "System",
  file: "System",
  sms: "System",
  notification: "System",
};

/** `page:<role>:<thing>` — the heading names whose dashboard it is. */
const PAGE_ROLE_GROUPS: Record<string, string> = {
  admin: "Pages — Administrator",
  manager: "Pages — Manager",
  staff: "Pages — Staff",
  customer: "Pages — Customer",
};

/** "request-management" → "Request Management" */
function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** The heading a single permission belongs under. */
export function groupNameFor(permission: GroupablePermission): string {
  const identifier = permission.code || permission.name || "";
  const [subject, second] = identifier.split(":");

  if (!subject) return "Other";

  // Page permissions are the bulk of the list and are only meaningful per
  // dashboard, so they split by role rather than piling up under one heading.
  if (subject === "page") {
    return PAGE_ROLE_GROUPS[second ?? ""] ?? "Pages";
  }

  return SUBJECT_GROUPS[subject] ?? titleCase(subject);
}

/**
 * Headings in the order they should appear.
 *
 * Not alphabetical: the groups someone reaches for most come first, and the
 * page permissions — a third of the list, and the least often changed — sink
 * to the bottom. Anything unrecognised sorts alphabetically after these.
 */
const GROUP_ORDER = [
  "User Accounts",
  "Staff",
  "Security & Access",
  "Offices",
  "Services",
  "Service Requests",
  "Appointments",
  "Feedback",
  "Reports",
  "Dashboards",
  "Content",
  "System",
  "Pages — Administrator",
  "Pages — Manager",
  "Pages — Staff",
  "Pages — Customer",
  "Pages",
  "Other",
];

/** Permissions bucketed into ordered groups, each sorted by name. */
export function groupPermissions<T extends GroupablePermission>(
  permissions: T[],
): { name: string; permissions: T[] }[] {
  const buckets = new Map<string, T[]>();

  for (const permission of permissions) {
    const group = groupNameFor(permission);
    const bucket = buckets.get(group);
    if (bucket) bucket.push(permission);
    else buckets.set(group, [permission]);
  }

  const rank = (name: string) => {
    const index = GROUP_ORDER.indexOf(name);
    return index === -1 ? GROUP_ORDER.length : index;
  };

  return [...buckets.entries()]
    .map(([name, group]) => ({
      name,
      permissions: [...group].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
}

/**
 * Whether a permission matches a search term.
 *
 * Matches the label, the description and the code, so both "Update service"
 * and "service:update" find the same row — people who know the codes search by
 * them, and everyone else searches by what the checkbox says.
 */
export function permissionMatches(
  permission: GroupablePermission,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    permission.name,
    permission.description ?? "",
    permission.code,
    // So "user create" finds "user:create" without the colon.
    permission.code.replace(/[:_-]+/g, " "),
  ]
    .join(" ")
    .toLowerCase();

  // Every word must appear somewhere, so extra words narrow rather than widen.
  return needle.split(/\s+/).every((word) => haystack.includes(word));
}
