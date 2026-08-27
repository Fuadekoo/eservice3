"use client";

import * as React from "react";
import { Building2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useIdentity } from "@/lib/hooks/use-identity";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Compact role + office pills for the dashboard top bar.
 *
 * Both pills truncate rather than grow, so a long office name never widens the
 * header — the full value stays reachable via the title tooltip and the profile
 * page.
 */
export function UserIdentityBadges({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { roleName, officeName } = useIdentity();

  // Nothing to show until the session has been read from storage.
  if (!roleName && !officeName) return null;

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      {roleName ? (
        <Badge
          variant="secondary"
          className="max-w-36 gap-1.5 capitalize"
          title={`${t("Role")}: ${t(roleName)}`}
        >
          <ShieldCheck aria-hidden className="text-primary" />
          <span className="truncate">{t(roleName)}</span>
        </Badge>
      ) : null}
      {officeName ? (
        <Badge
          variant="outline"
          className="max-w-56 gap-1.5"
          title={`${t("Office")}: ${t(officeName)}`}
        >
          <Building2 aria-hidden className="text-muted-foreground" />
          <span className="truncate">{t(officeName)}</span>
        </Badge>
      ) : null}
    </div>
  );
}

/**
 * Stacked role + office rows for narrow surfaces (the avatar dropdown), where
 * the top-bar pills are hidden. Always renders both rows so the absence of an
 * assignment is stated rather than left ambiguous.
 */
export function UserIdentityRows({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { roleName, officeName } = useIdentity();

  return (
    <div className={cn("space-y-1.5", className)}>
      <IdentityRow
        icon={ShieldCheck}
        label={t("Role")}
        value={roleName ? t(roleName) : t("No role assigned")}
        muted={!roleName}
        capitalize={Boolean(roleName)}
      />
      <IdentityRow
        icon={Building2}
        label={t("Office")}
        value={officeName ? t(officeName) : t("No office assigned")}
        muted={!officeName}
      />
    </div>
  );
}

function IdentityRow({
  icon: Icon,
  label,
  value,
  muted,
  capitalize,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  muted?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon aria-hidden className="mt-px size-3.5 shrink-0 text-primary" />
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-right font-medium",
          capitalize && "capitalize",
          muted ? "text-muted-foreground italic" : "text-foreground",
        )}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Role + assigned office tiles for the profile view. These mirror the session
 * and are not editable here, so they read as facts rather than form fields.
 */
export function UserIdentitySummary({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { roleName, officeName } = useIdentity();

  return (
    <div
      className={cn(
        "grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2",
        className,
      )}
    >
      <SummaryTile
        icon={ShieldCheck}
        label={t("Role")}
        value={roleName ? t(roleName) : t("No role assigned")}
        muted={!roleName}
        capitalize={Boolean(roleName)}
      />
      <SummaryTile
        icon={Building2}
        label={t("Assigned Office")}
        value={officeName ? t(officeName) : t("No office assigned")}
        muted={!officeName}
      />
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  muted,
  capitalize,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  muted?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon aria-hidden className="size-4 text-primary" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "block truncate text-sm font-semibold",
            capitalize && "capitalize",
            muted ? "font-normal italic text-muted-foreground" : "text-foreground",
          )}
          title={value}
        >
          {value}
        </span>
      </span>
    </div>
  );
}
