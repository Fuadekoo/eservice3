"use client";

import * as React from "react";
import {
  CheckCircle2,
  Loader2,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { axiosInstance } from "@/lib/axios";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useServiceStore,
  staffAssignmentName,
  type Service,
} from "@/lib/stores/service-store";
import { useTranslation } from "@/lib/i18n";

/** One row in the picker — a staff member of the service's office. */
type OfficeStaff = {
  id: string;
  name: string;
  username: string;
  roleName: string;
  isActive: boolean;
  isAssigned: boolean;
};

type ServiceStaffData = {
  serviceId: string;
  officeId: string;
  officeName: string;
  staff: OfficeStaff[];
  assignedCount: number;
  totalCount: number;
};

function getErrorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}

interface AssignServiceStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The service being staffed. `null` while the sheet is closed. */
  service: Service | null;
}

/**
 * Picks which staff members handle a service.
 *
 * The mirror of the staff page's "assign services" sheet, from the other side
 * of the same join. That one replaces a staff member's whole service set in one
 * PUT; here the API is a per-staff add and remove, so only the difference
 * between what was shown and what was chosen is sent.
 */
export function AssignServiceStaffDialog({
  open,
  onOpenChange,
  service,
}: AssignServiceStaffDialogProps) {
  const { t } = useTranslation();
  const { assignStaff, removeStaff } = useServiceStore();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [staff, setStaff] = React.useState<OfficeStaff[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  // What the service is known to have. Seeded when the sheet opens and moved
  // one id at a time as each call succeeds, so a save that dies halfway leaves
  // a baseline describing what actually landed — press Save again and only the
  // remainder is retried, rather than re-adding a staff member the server has
  // already recorded and getting a duplicate-key error for it.
  const [initialIds, setInitialIds] = React.useState<Set<string>>(new Set());

  const officeId = service?.officeId;

  // `service` is the caller's snapshot from the moment the sheet was opened,
  // not a live store value, so its identity holds for the whole session. That
  // is deliberate: a live object would be replaced on every assignment and
  // refire this effect, refetching the roster and wiping the pending selection
  // in the middle of saving it.
  React.useEffect(() => {
    if (!open || !service || !officeId) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        // One call for the roster and who already holds the service. Scoped to
        // the service's own office by the server, which is also the only office
        // an assignment may name.
        const response = (await axiosInstance.get(
          `/services/${service.id}/staff`,
        )) as unknown as { data: ServiceStaffData };

        if (cancelled) return;
        const roster = response.data?.staff ?? [];
        setStaff(roster);
        // Seeded from the server rather than from the list payload, so the
        // baseline is what is true now, not what the page last fetched.
        const assigned = new Set(
          roster.filter((member) => member.isAssigned).map((m) => m.id),
        );
        setInitialIds(assigned);
        setSelectedIds(new Set(assigned));
        // Reset alongside the rows it applies to, so a stale search from the
        // previous service never shows.
        setSearchQuery("");
      } catch (error: unknown) {
        if (cancelled) return;
        toast.error(
          getErrorMessage(error) || t("Failed to load staff for this office"),
        );
        onOpenChange(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, service, officeId, onOpenChange, t]);

  const filtered = React.useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return staff;
    return staff.filter((member) =>
      `${member.name} ${member.username} ${member.roleName}`
        .toLowerCase()
        .includes(needle),
    );
  }, [staff, searchQuery]);

  const added = React.useMemo(
    () => [...selectedIds].filter((id) => !initialIds.has(id)),
    [selectedIds, initialIds],
  );
  const removed = React.useMemo(
    () => [...initialIds].filter((id) => !selectedIds.has(id)),
    [selectedIds, initialIds],
  );
  const hasChanges = added.length > 0 || removed.length > 0;

  const toggle = (staffId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!service || !hasChanges) return;

    setIsSaving(true);
    try {
      // The API takes one staff member per call, so the baseline advances with
      // each success. If a later call fails, what remains is exactly the work
      // still outstanding and Save retries only that.
      for (const staffId of removed) {
        await removeStaff(service.id, staffId);
        setInitialIds((prev) => {
          const next = new Set(prev);
          next.delete(staffId);
          return next;
        });
      }
      for (const staffId of added) {
        await assignStaff(service.id, staffId);
        setInitialIds((prev) => new Set(prev).add(staffId));
      }
      toast.success(t("Staff assignments updated"));
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error) || t("Failed to update staff assignments"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex h-full w-full! max-w-none! flex-col gap-0 overflow-hidden border-border bg-card p-0 sm:w-[92vw]! sm:rounded-l-2xl lg:w-152!"
      >
        <div className="relative flex-none overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-indigo-500" />

          <SheetHeader className="gap-0 p-6 pb-4 pr-14">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Users className="size-5 text-primary" />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <SheetTitle className="text-lg font-bold text-foreground">
                  {t("Assign Staff")}
                </SheetTitle>
                <SheetDescription className="truncate text-sm text-muted-foreground">
                  {service
                    ? t("Who handles {name}", { name: service.name })
                    : t("Select the staff who handle this service")}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-3 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
              <span className="sr-only">{t("Close")}</span>
            </Button>
          </SheetClose>
        </div>

        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              {t("Loading staff…")}
            </p>
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted/50">
              <UserPlus className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {t("No staff in this office")}
            </p>
            <p className="max-w-[280px] text-center text-xs text-muted-foreground">
              {t("Add staff to {office} before assigning them to a service.", {
                office: service?.office?.name ?? "",
              })}
            </p>
          </div>
        ) : (
          <>
            <div className="flex-none space-y-3 px-6 pb-3">
              <Badge
                variant="secondary"
                className="gap-1 rounded-full border-none bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary"
              >
                <CheckCircle2 className="size-3" />
                {selectedIds.size} / {staff.length} {t("assigned")}
              </Badge>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("Search staff…")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 rounded-xl border-border bg-muted/50 pl-9 pr-9 text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Radix renders the viewport's child as `display: table`, which
                sizes to the widest row instead of to the panel — forcing it
                back to a block is what makes `truncate` fire. */}
            <ScrollArea className="min-h-0 w-full flex-1 px-6 [&>[data-slot=scroll-area-viewport]>div]:block!">
              <div className="space-y-1.5 pb-4">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10">
                    <Search className="size-5 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {t("No staff match “{query}”", { query: searchQuery })}
                    </p>
                  </div>
                ) : (
                  filtered.map((member) => {
                    const isChecked = selectedIds.has(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggle(member.id)}
                        className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${
                          isChecked
                            ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
                            : "border-transparent hover:border-border hover:bg-muted/60"
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggle(member.id)}
                        />
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {(member.name || member.username || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-foreground">
                              {member.name || member.username}
                            </span>
                            {/* Deactivated members are shown, not hidden: one
                                may already hold the service, and the way to
                                take it off them is to see them here. */}
                            {!member.isActive && (
                              <Badge
                                variant="secondary"
                                className="shrink-0 rounded-full border-none bg-muted px-1.5 py-0 text-[9px] font-bold uppercase text-muted-foreground"
                              >
                                {t("Inactive")}
                              </Badge>
                            )}
                          </span>
                          <span className="truncate text-[11px] text-muted-foreground">
                            @{member.username}
                          </span>
                        </span>
                        {member.roleName ? (
                          <Badge
                            variant="secondary"
                            className="shrink-0 rounded-full border-none bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400"
                          >
                            {member.roleName}
                          </Badge>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {!isLoading && staff.length > 0 && (
          <SheetFooter className="mx-0 mb-0 flex-none border-t border-border bg-muted/30 p-4">
            <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {hasChanges ? (
                  <span className="font-medium text-amber-500">
                    {t("• Unsaved changes")}
                  </span>
                ) : (
                  <span className="font-medium text-emerald-500">
                    {t("✓ All changes saved")}
                  </span>
                )}
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                  className="h-9 rounded-xl px-4 text-sm font-medium"
                >
                  {t("Cancel")}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="h-9 rounded-xl px-6 text-sm font-semibold"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {t("Saving…")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 size-4" />
                      {t("Save Assignments")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * The assigned staff for a service, or an invitation to assign some.
 *
 * Shown on both the card and the list row, so a service that nobody handles
 * reads as an actionable gap rather than as blank space.
 */
export function ServiceStaffCell({
  service,
  canAssign,
  onAssign,
  className,
}: {
  service: Service;
  canAssign: boolean;
  onAssign: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const assignments = service.staffAssignments ?? [];

  if (assignments.length === 0) {
    if (!canAssign) {
      return (
        <span className={`text-xs italic text-muted-foreground ${className ?? ""}`}>
          {t("Unassigned")}
        </span>
      );
    }
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onAssign}
        title={t("Assign staff")}
        className={`h-8 gap-1.5 rounded-lg border border-dashed border-border px-2.5 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary ${className ?? ""}`}
      >
        <UserPlus className="size-3.5" />
        {t("Assign staff")}
      </Button>
    );
  }

  const names = assignments.map(staffAssignmentName);
  const [first, ...rest] = names;

  return (
    <button
      type="button"
      onClick={canAssign ? onAssign : undefined}
      disabled={!canAssign}
      title={names.join(", ")}
      className={`flex min-w-0 items-center gap-2 rounded-lg text-left transition-colors ${
        canAssign ? "cursor-pointer hover:text-primary" : "cursor-default"
      } ${className ?? ""}`}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
        {first.charAt(0).toUpperCase()}
      </span>
      <span className="truncate text-sm font-semibold">{first}</span>
      {rest.length > 0 ? (
        <Badge
          variant="secondary"
          className="shrink-0 rounded-full border-none bg-muted px-2 py-0 text-[10px] font-bold text-muted-foreground"
        >
          +{rest.length}
        </Badge>
      ) : null}
    </button>
  );
}
