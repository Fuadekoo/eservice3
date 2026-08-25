"use client";

import * as React from "react";
import {
  GraduationCap,
  Search,
  CheckCircle2,
  Loader2,
  Briefcase,
  Clock,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { axiosInstance } from "@/lib/axios";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/lib/i18n";

// ─── Types ───────────────────────────────────────────────────────────────────

type ServiceItem = {
  id: string;
  name: string;
  description: string;
  timeToTake: string;
  isAssigned: boolean;
};

type StaffServicesData = {
  staffId: string;
  staffName: string;
  officeId: string;
  officeName: string;
  services: ServiceItem[];
  assignedCount: number;
  totalCount: number;
};

interface AssignServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string | null;
  staffName: string;
  onSuccess?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AssignServicesDialog({
  open,
  onOpenChange,
  staffId,
  staffName,
  onSuccess,
}: AssignServicesDialogProps) {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [data, setData] = React.useState<StaffServicesData | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [initialIds, setInitialIds] = React.useState<Set<string>>(new Set());

  // Fetch services when dialog opens
  React.useEffect(() => {
    if (!open || !staffId) return;

    setSearchQuery("");
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const response = (await axiosInstance.get(
          `/staff/${staffId}/services`,
        )) as unknown as { data: StaffServicesData };

        setData(response.data);
        const assigned = new Set(
          response.data.services
            .filter((s) => s.isAssigned)
            .map((s) => s.id),
        );
        setSelectedIds(assigned);
        setInitialIds(new Set(assigned));
      } catch (error: any) {
        toast.error(
          error?.message || t("Failed to load services for this staff member"),
        );
        onOpenChange(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [open, staffId, onOpenChange]);

  // Filter services by search
  const filteredServices = React.useMemo(() => {
    if (!data) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return data.services;
    return data.services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  // Check if selections changed
  const hasChanges = React.useMemo(() => {
    if (selectedIds.size !== initialIds.size) return true;
    for (const id of selectedIds) {
      if (!initialIds.has(id)) return true;
    }
    return false;
  }, [selectedIds, initialIds]);

  const toggleService = (serviceId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!data) return;
    const allIds = data.services.map((s) => s.id);
    setSelectedIds(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSave = async () => {
    if (!staffId) return;

    setIsSaving(true);
    try {
      await axiosInstance.put(`/staff/${staffId}/services`, {
        serviceIds: Array.from(selectedIds),
      });

      toast.success(
        `Services updated successfully! ${selectedIds.size} service(s) assigned.`,
      );
      setInitialIds(new Set(selectedIds));
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || t("Failed to update service assignments"));
    } finally {
      setIsSaving(false);
    }
  };

  const assignedCount = selectedIds.size;
  const totalCount = data?.services.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 sm:max-w-[600px]"
      >
        {/* Header */}
        <div className="relative flex-none overflow-hidden">
          {/* Gradient accent bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

          <DialogHeader className="p-6 pb-4 pr-14">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                <GraduationCap className="size-5 text-violet-500" />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <DialogTitle className="text-lg font-bold text-foreground">
                  {t("Assign Services")}
                </DialogTitle>
                <DialogDescription className="truncate text-sm text-muted-foreground">
                  {staffName ? (
                    <>
                      {t("Managing services for {name}", { name: staffName })}
                    </>
                  ) : (
                    t("Select services to assign to this staff member")
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Close button */}
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-3 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
              <span className="sr-only">{t("Close")}</span>
            </Button>
          </DialogClose>
        </div>

        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
            <div className="relative">
              <div className="size-12 animate-pulse rounded-full border-2 border-violet-500/20" />
              <Loader2 className="absolute left-3 top-3 size-6 animate-spin text-violet-500" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("Loading services…")}
            </p>
          </div>
        ) : data && data.services.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted/50">
              <Briefcase className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {t("No Services Available")}
            </p>
            <p className="max-w-[280px] text-center text-xs text-muted-foreground">
              {t(
                "There are no services in {office}. Create services first before assigning them.",
                { office: data.officeName },
              )}
            </p>
          </div>
        ) : (
          <>
            {/* Stats + Search Bar */}
            <div className="flex-none space-y-3 px-6 pb-3">
              {/* Stats Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge
                  variant="secondary"
                  className="gap-1 rounded-full border-none bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400"
                >
                  <Sparkles className="size-3" />
                  {assignedCount} / {totalCount} {t("assigned")}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-lg px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    onClick={handleSelectAll}
                  >
                    {t("Select All")}
                  </Button>
                  <span className="text-muted-foreground/40">|</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-lg px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    onClick={handleDeselectAll}
                  >
                    {t("Deselect All")}
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("Search services…")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 rounded-xl border-border bg-muted/50 pl-9 pr-9 text-sm focus:ring-violet-500/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Services List */}
            <ScrollArea className="min-h-0 flex-1 px-6">
              <div className="space-y-1.5 pb-4">
                {filteredServices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10">
                    <Search className="size-5 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {t("No services match “{query}”", { query: searchQuery })}
                    </p>
                  </div>
                ) : (
                  filteredServices.map((service) => {
                    const isChecked = selectedIds.has(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleService(service.id)}
                        className={`group flex w-full cursor-pointer items-start gap-3 rounded-xl p-3 text-left transition-all duration-200 hover:bg-muted/60 ${
                          isChecked
                            ? "border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10"
                            : "border border-transparent bg-transparent hover:border-border"
                        }`}
                      >
                        <div className="pt-0.5">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleService(service.id)}
                            className="data-[state=checked]:border-violet-500 data-[state=checked]:bg-violet-500"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`truncate text-sm font-semibold transition-colors ${
                                isChecked
                                  ? "text-violet-700 dark:text-violet-300"
                                  : "text-foreground"
                              }`}
                            >
                              {service.name}
                            </span>
                            {isChecked && (
                              <CheckCircle2 className="size-3.5 shrink-0 text-violet-500" />
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                            {service.description}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/70">
                            <Clock className="size-3 shrink-0" />
                            <span className="truncate">{service.timeToTake}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Footer */}
        {!isLoading && data && data.services.length > 0 && (
          <DialogFooter className="mx-0 mb-0 flex-none border-t border-border bg-muted/30 p-4">
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
                  className="h-9 rounded-xl px-4 text-sm font-medium"
                  disabled={isSaving}
                >
                  {t("Cancel")}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="h-9 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:from-violet-700 hover:to-indigo-700 active:scale-95 disabled:opacity-50"
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
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
