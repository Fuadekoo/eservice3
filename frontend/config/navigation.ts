import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  Users2,
  Shield,
  ShieldCheck,
  Settings,
  LineChart,
  Globe,
  Building2,
  Calendar,
  MessageSquare,
  Images,
  Clock,
  FilePlus,
  ClipboardList,
  Briefcase,
  Info,
  Grid2X2,
  ClipboardCheck,
} from "lucide-react";

export type NavSubItem = {
  titleKey: string;
  href: string;
  permissions?: string[];
};

export type NavItem = {
  titleKey: string;
  icon: LucideIcon;
  href?: string;
  items?: NavSubItem[];
  roles?: string[];
  permissions?: string[];
};

export type NavSection = {
  labelKey: string;
  items: NavItem[];
};

export const NAVIGATION: NavSection[] = [
  // ── Admin: system-wide management ────────────────────────
  {
    labelKey: "e-service",
    items: [
      {
        titleKey: "Overview",
        icon: LayoutDashboard,
        href: "/dashboard",
        roles: ["ADMIN"],
      },
      {
        titleKey: "Office",
        icon: Building2,
        href: "/offices",
        roles: ["ADMIN"],
      },
      {
        titleKey: "My Office",
        icon: Briefcase,
        href: "/offices/my",
        roles: ["ADMIN"],
      },
      {
        titleKey: "Staff Management",
        icon: Users2,
        href: "/staff",
        roles: ["ADMIN"],
      },
      {
        titleKey: "User Management",
        icon: ShieldCheck,
        href: "/users",
        roles: ["ADMIN"],
      },
      {
        titleKey: "Report",
        icon: LineChart,
        href: "/report",
        roles: ["ADMIN"],
      },
      {
        titleKey: "Report Management",
        icon: ClipboardCheck,
        href: "/reportManagement",
        roles: ["ADMIN"],
      },
      {
        titleKey: "Request Management",
        icon: ClipboardList,
        href: "/requestManagement",
        roles: ["ADMIN"],
      },
      {
        titleKey: "Languages",
        icon: Globe,
        href: "/languages/overview",
        roles: ["ADMIN"],
      },
      {
        titleKey: "Gallery",
        icon: Images,
        href: "/gallery",
        roles: ["ADMIN"],
      },
      {
        titleKey: "About",
        icon: Info,
        href: "/about-management",
        roles: ["ADMIN"],
      },
    ],
  },
  // ── Admin / Manager: office-level operations ───────────────────
  {
    labelKey: "Operations",
    items: [
      {
        titleKey: "Overview",
        icon: Grid2X2,
        href: "/dashboard",
        roles: ["MANAGER"],
      },
      {
        titleKey: "Services",
        icon: Briefcase,
        href: "/services",
        roles: ["MANAGER"],
        permissions: ["service:read"],
      },
      {
        titleKey: "Staff",
        icon: Users2,
        href: "/staff",
        roles: ["MANAGER"],
        permissions: ["staff:read"],
      },
      {
        titleKey: "Request Management",
        icon: FileText,
        href: "/requestManagement",
        roles: ["MANAGER"],
        permissions: ["request:read"],
      },
      {
        titleKey: "Report",
        icon: ClipboardCheck,
        href: "/report",
        roles: ["MANAGER"],
        permissions: ["report:read"],
      },
      {
        titleKey: "Configuration",
        icon: Settings,
        href: "/configuration",
        roles: ["MANAGER"],
        permissions: ["configuration:read"],
      },
      {
        titleKey: "Availability",
        icon: Clock,
        href: "/availability",
        roles: ["MANAGER"],
        permissions: ["office:configure"],
      },
    ],
  },
  // ── Staff: individual work queue ───────────────────────────────
  {
    labelKey: "My Work",
    items: [
      {
        titleKey: "Overview",
        icon: LayoutDashboard,
        href: "/staff-overview",
        roles: ["STAFF"],
      },
      {
        titleKey: "Requests",
        icon: FileText,
        href: "/requests",
        roles: ["STAFF"],
      },
      {
        titleKey: "Request Management",
        icon: ClipboardList,
        href: "/requestManagement",
        roles: ["STAFF"],
      },
      {
        titleKey: "Appointments",
        icon: Calendar,
        href: "/appointments",
        roles: ["STAFF"],
      },
      {
        titleKey: "Availability",
        icon: Clock,
        href: "/availability",
        roles: ["STAFF"],
      },
    ],
  },
  // ── Customer: self-service portal ──────────────────────────────
  {
    labelKey: "Customer Portal",
    items: [
      {
        titleKey: "Home",
        icon: LayoutDashboard,
        href: "/customer-overview",
        roles: ["CUSTOMER"],
      },
      {
        titleKey: "Apply for Service",
        icon: FilePlus,
        href: "/apply-service",
        roles: ["CUSTOMER"],
      },
      {
        titleKey: "My Requests",
        icon: FileText,
        href: "/requests",
        roles: ["CUSTOMER"],
      },
      {
        titleKey: "Appointments",
        icon: Calendar,
        href: "/appointments",
        roles: ["CUSTOMER"],
      },
      {
        titleKey: "Feedback",
        icon: MessageSquare,
        href: "/feedback",
        roles: ["CUSTOMER"],
      },
    ],
  },
  // ── Security: role & permission management ─────────────────────
  {
    labelKey: "Security",
    items: [
      {
        titleKey: "Roles",
        icon: Shield,
        href: "/security/roles",
        permissions: ["roles.view"],
        roles: ["SYSTEM_ADMIN"],
      },
      {
        titleKey: "Permissions",
        icon: ShieldCheck,
        href: "/security/permissions",
        permissions: ["permissions.view"],
        roles: ["SYSTEM_ADMIN"],
      },
      {
        titleKey: "Audit Logs",
        icon: ShieldCheck,
        href: "/security/audit-logs",
        permissions: ["audit_logs.view"],
        roles: ["SYSTEM_ADMIN"],
      },
    ],
  },
];

export type NavigationEntry = {
  titleKey: string;
  href: string;
  parent?: string;
  parentTitleKey?: string;
};

export const NAVIGATION_LOOKUP: Record<string, NavigationEntry> =
  NAVIGATION.reduce(
    (acc, section) => {
      section.items.forEach((item) => {
        if (item.href) {
          acc[item.href] = { titleKey: item.titleKey, href: item.href };
        }

        if (item.items) {
          item.items.forEach((subitem) => {
            acc[subitem.href] = {
              titleKey: subitem.titleKey,
              href: subitem.href,
              parent: item.href,
              parentTitleKey: item.titleKey,
            };
          });
        }
      });

      return acc;
    },
    {} as Record<string, NavigationEntry>,
  );

NAVIGATION_LOOKUP["/"] = { titleKey: "Overview", href: "/" };
NAVIGATION_LOOKUP["/dashboard"] = { titleKey: "Overview", href: "/dashboard" };
NAVIGATION_LOOKUP["/admin-overview"] = {
  titleKey: "Overview",
  href: "/admin-overview",
};
NAVIGATION_LOOKUP["/manager-overview"] = {
  titleKey: "Overview",
  href: "/manager-overview",
};
NAVIGATION_LOOKUP["/staff-overview"] = {
  titleKey: "Overview",
  href: "/staff-overview",
};
NAVIGATION_LOOKUP["/customer-overview"] = {
  titleKey: "Overview",
  href: "/customer-overview",
};

export const BREADCRUMB_ROOT = {
  titleKey: "Overview",
  href: "/dashboard",
};
