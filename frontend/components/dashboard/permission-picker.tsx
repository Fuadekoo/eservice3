"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import {
  groupPermissions,
  permissionMatches,
  type GroupablePermission,
} from "@/lib/permission-groups";
import { cn } from "@/lib/utils";

type PermissionPickerProps = {
  permissions: GroupablePermission[];
  /** Codes currently granted. */
  selected: string[];
  onChange: (codes: string[]) => void;
  /** Disable every control, e.g. while the form is saving. */
  disabled?: boolean;
};

/**
 * Choose a role's permissions: grouped by subject, searchable, with counts.
 *
 * Shared by the create and edit role forms, which previously carried two
 * copies of this markup that had already drifted apart.
 *
 * The search narrows the list rather than reordering it, and every checkbox
 * acts on what is *visible*: ticking a group header while a search is active
 * grants the matches, not the whole group. Acting on hidden rows is how a
 * search box turns into a way to grant permissions by accident.
 */
export function PermissionPicker({
  permissions,
  selected,
  onChange,
  disabled = false,
}: PermissionPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");

  const selectedSet = React.useMemo(() => new Set(selected), [selected]);

  const groups = React.useMemo(() => {
    const matching = permissions.filter((permission) =>
      permissionMatches(permission, query),
    );
    return groupPermissions(matching);
  }, [permissions, query]);

  const visible = React.useMemo(
    () => groups.flatMap((group) => group.permissions),
    [groups],
  );
  const visibleSelected = visible.filter((p) => selectedSet.has(p.code)).length;

  // While searching, every group that still has matches is opened — a hit
  // hidden inside a collapsed group is the same as no hit at all.
  const openGroups = React.useMemo(
    () => groups.map((group) => group.name),
    [groups],
  );

  const setCodes = React.useCallback(
    (codes: string[], granted: boolean) => {
      const next = new Set(selected);
      for (const code of codes) {
        if (granted) next.add(code);
        else next.delete(code);
      }
      onChange([...next]);
    },
    [selected, onChange],
  );

  const allVisibleSelected = visible.length > 0 && visibleSelected === visible.length;
  const someVisibleSelected = visibleSelected > 0 && visibleSelected < visible.length;

  if (permissions.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {t("No permissions available")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30">
      {/* ── Search ── */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={disabled}
            placeholder={t("Search permissions by name or code…")}
            className="h-10 rounded-xl bg-background pl-9 pr-9"
            aria-label={t("Search permissions")}
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 size-7 -translate-y-1/2 rounded-lg"
              onClick={() => setQuery("")}
              aria-label={t("Clear search")}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Select all ── */}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="permission-select-all"
            checked={someVisibleSelected ? "indeterminate" : allVisibleSelected}
            onCheckedChange={(checked) =>
              setCodes(
                visible.map((p) => p.code),
                checked === true,
              )
            }
            disabled={disabled || visible.length === 0}
            aria-label={t("Select all permissions")}
          />
          <Label
            htmlFor="permission-select-all"
            className="cursor-pointer text-sm font-semibold"
          >
            {query ? t("Select all matches") : t("Select All Permissions")}
          </Label>
        </div>
        <Badge variant="outline" className="shrink-0 font-normal">
          {selected.length} / {permissions.length} {t("selected")}
        </Badge>
      </div>

      {/* ── Groups ── */}
      {groups.length === 0 ? (
        <div className="space-y-1 py-10 text-center">
          <p className="text-sm font-medium">{t("No matching permissions")}</p>
          <p className="text-sm text-muted-foreground">
            {t("Try a different word, or search by code such as “service:update”.")}
          </p>
        </div>
      ) : (
        <Accordion
          type="multiple"
          // Keyed on the query so a new search reopens the groups that match.
          key={query}
          defaultValue={openGroups}
          className="w-full px-2 py-1"
        >
          {groups.map((group) => {
            const inGroup = group.permissions.length;
            const chosen = group.permissions.filter((p) =>
              selectedSet.has(p.code),
            ).length;
            const allChosen = chosen === inGroup;
            const someChosen = chosen > 0 && chosen < inGroup;

            return (
              <AccordionItem
                key={group.name}
                value={group.name}
                className="border-none"
              >
                <div className="flex items-center gap-3 px-2">
                  <Checkbox
                    checked={someChosen ? "indeterminate" : allChosen}
                    onCheckedChange={(checked) =>
                      setCodes(
                        group.permissions.map((p) => p.code),
                        checked === true,
                      )
                    }
                    disabled={disabled}
                    aria-label={t("Select {group} permissions", { group: group.name })}
                  />
                  <AccordionTrigger className="flex-1 py-2 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t(group.name)}</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-4 px-1.5 py-0 text-[10px] font-normal",
                          chosen > 0 && "bg-primary/10 text-primary",
                        )}
                      >
                        {chosen}/{inGroup}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                </div>

                <AccordionContent>
                  <div className="grid gap-3 pb-3 pt-1 sm:grid-cols-2">
                    {group.permissions.map((permission) => {
                      const isChecked = selectedSet.has(permission.code);
                      return (
                        <label
                          key={permission.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                            isChecked
                              ? "border-primary/40 bg-primary/5"
                              : "border-border/70 bg-background hover:border-primary/60 hover:bg-muted/50",
                            disabled && "cursor-not-allowed opacity-60",
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              setCodes([permission.code], checked === true)
                            }
                            disabled={disabled}
                            aria-label={permission.name}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium leading-tight">
                              {permission.name}
                            </span>
                            {permission.description && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            )}
                            <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                              {permission.code}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
