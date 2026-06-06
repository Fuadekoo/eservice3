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
          error?.message || "Failed to load services for this staff member",
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
      toast.error(error?.message || "Failed to update service assignments");
    } finally {
      setIsSaving(false);
    }
  };

  const assignedCount = selectedIds.size;
  const totalCount = data?.services.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden rounded-2xl border-border bg-card">
        {/* Header */}
        <div className="relative overflow-hidden">
          {/* Gradient accent bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20">
                <GraduationCap className="size-5 text-violet-500" />
              </div>
              <div className="flex flex-col gap-1">
                <DialogTitle className="text-lg font-bold text-foreground">
                  Assign Services
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {staffName ? (
                    <>
                      Managing services for{" "}
                      <span className="font-semibold text-foreground">
                        {staffName}
                      </span>
                    </>
                  ) : (
                    "Select services to assign to this staff member"
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <div className="size-12 rounded-full border-2 border-violet-500/20 animate-pulse" />
              <Loader2 className="size-6 text-violet-500 animate-spin absolute top-3 left-3" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Loading services…
            </p>
          </div>
        ) : data && data.services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="flex items-center justify-center size-14 rounded-full bg-muted/50">
              <Briefcase className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              No Services Available
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-[280px]">
              There are no services in{" "}
              <span className="font-medium">{data.officeName}</span>. Create
              services first before assigning them.
            </p>
          </div>
        ) : (
          <>
            {/* Stats + Search Bar */}
            <div className="px-6 pb-3 space-y-3">
              {/* Stats Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-600 dark:text-violet-400 border-none gap-1"
                  >
                    <Sparkles className="size-3" />
                    {assignedCount} / {totalCount} assigned
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <span className="text-muted-foreground/40">|</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search services…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 rounded-xl bg-muted/50 border-border text-sm focus:ring-violet-500/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Services List */}
            <ScrollArea className="h-[320px] px-6">
              <div className="space-y-1.5 pb-4">
                {filteredServices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Search className="size-5 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      No services match &quot;{searchQuery}&quot;
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
                        className={`
                          w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200
                          hover:bg-muted/60 group cursor-pointer
                          ${
                            isChecked
                              ? "bg-violet-500/5 border border-violet-500/20 hover:bg-violet-500/10"
                              : "bg-transparent border border-transparent hover:border-border"
                          }
                        `}
                      >
                        <div className="pt-0.5">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleService(service.id)}
                            className="data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-semibold truncate transition-colors ${
                                isChecked
                                  ? "text-violet-700 dark:text-violet-300"
                                  : "text-foreground"
                              }`}
                            >
                              {service.name}
                            </span>
                            {isChecked && (
                              <CheckCircle2 className="size-3.5 text-violet-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {service.description}
                          </p>
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/70">
                            <Clock className="size-3" />
                            <span>{service.timeToTake}</span>
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
          <DialogFooter className="p-4 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between w-full gap-3">
              <p className="text-xs text-muted-foreground">
                {hasChanges ? (
                  <span className="text-amber-500 font-medium">
                    • Unsaved changes
                  </span>
                ) : (
                  <span className="text-emerald-500 font-medium">
                    ✓ All changes saved
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl h-9 px-4 text-sm font-medium"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="rounded-xl h-9 px-6 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4 mr-2" />
                      Save Assignments
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
