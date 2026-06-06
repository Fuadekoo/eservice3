"use client";

import React from "react";
import {
  Building2,
  ChevronRight,
  ArrowLeft,
  Search,
  Clock,
  MapPin,
  FileText,
  CheckCircle2,
  Users,
  Loader2,
  Send,
  CalendarIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { axiosInstance } from "@/lib/axios";
import { useOfficeStore } from "@/lib/stores/office-store";
import { useSession } from "@/hooks/use-session";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type Requirement = { id: string; name: string; description?: string | null };
type ServiceFor   = { id: string; name: string; description?: string | null };

type ServiceDetail = {
  id: string;
  name: string;
  description: string;
  timeToTake: string;
  roomNumber?: string | null;
  requirements?: Requirement[];
  serviceFors?: ServiceFor[];
};

type OfficeDetail = {
  id: string;
  name: string;
  logo?: string | null;
  slogan?: string | null;
  address?: string | null;
  roomNumber: string;
  phoneNumber?: string | null;
  _count?: { service: number; staffs: number };
  service?: ServiceDetail[];
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ApplyServicePage() {
  const { offices, fetchOffices, isLoading: loadingOffices } = useOfficeStore();
  const { data: sessionData } = useSession();

  // UI state
  const [officeSearch, setOfficeSearch] = React.useState("");
  const [selectedOffice, setSelectedOffice] = React.useState<OfficeDetail | null>(null);
  const [isFetchingOffice, setIsFetchingOffice] = React.useState(false);
  const [serviceSearch, setServiceSearch] = React.useState("");

  // Apply dialog
  const [applyService, setApplyService] = React.useState<ServiceDetail | null>(null);
  const [form, setForm] = React.useState({ address: "", date: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Service detail dialog
  const [detailService, setDetailService] = React.useState<ServiceDetail | null>(null);

  React.useEffect(() => {
    void fetchOffices();
  }, [fetchOffices]);

  // ── Fetch full office with services ──────────────────────────────────────
  const handleSelectOffice = async (officeId: string) => {
    setIsFetchingOffice(true);
    setServiceSearch("");
    try {
      const res = (await axiosInstance.get(`/offices/${officeId}`)) as unknown as {
        data: OfficeDetail;
      };
      setSelectedOffice(res.data);
    } catch {
      toast.error("Failed to load office services.");
    } finally {
      setIsFetchingOffice(false);
    }
  };

  // ── Submit application ────────────────────────────────────────────────────
  const handleApply = async () => {
    if (!applyService) return;
    if (!form.address.trim()) { toast.error("Please enter your current address."); return; }
    if (!form.date) { toast.error("Please select a preferred date."); return; }

    setIsSubmitting(true);
    try {
      await axiosInstance.post("/requests", {
        serviceId: applyService.id,
        currentAddress: form.address.trim(),
        date: new Date(form.date).toISOString(),
        notes: form.notes.trim() || undefined,
        files: [],
      });
      toast.success("Application submitted successfully!");
      setApplyService(null);
      setForm({ address: "", date: "", notes: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const filteredOffices = offices.filter((o) =>
    o.name.toLowerCase().includes(officeSearch.toLowerCase())
  );

  const filteredServices = (selectedOffice?.service ?? []).filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    s.description.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      {/* Header */}
      {!selectedOffice ? (
        <PageHeader
          title="Apply for Service"
          description="Choose a government office to see available services"
          icon={Building2}
        />
      ) : (
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedOffice(null)}
            className="rounded-xl h-10 w-10 shrink-0"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight truncate">{selectedOffice.name}</h1>
            <p className="text-sm text-muted-foreground">
              {selectedOffice._count?.service ?? selectedOffice.service?.length ?? 0} services available
            </p>
          </div>
        </div>
      )}

      {/* ── OFFICE GRID ── */}
      {!selectedOffice && (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search offices..."
              value={officeSearch}
              onChange={(e) => setOfficeSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl"
            />
          </div>

          {loadingOffices ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          ) : filteredOffices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Building2 className="size-12 text-muted-foreground/30 mb-3" />
              <p className="font-semibold">No offices found</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOffices.map((office) => (
                <button
                  key={office.id}
                  type="button"
                  onClick={() => handleSelectOffice(office.id)}
                  disabled={isFetchingOffice}
                  className="group text-left rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 overflow-hidden"
                >
                  {/* Logo strip */}
                  <div className="h-1.5 w-full bg-primary/20 group-hover:bg-primary/40 transition-colors" />

                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Logo */}
                      <div className="size-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border group-hover:border-primary/30 transition-colors">
                        {office.logo ? (
                          <img src={office.logo} alt={office.name} className="size-full object-contain p-1.5" />
                        ) : (
                          <Building2 className="size-7 text-primary/50" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {office.name}
                        </h3>
                        <Badge variant="secondary" className="mt-1.5 text-xs font-semibold">
                          {office._count?.service ?? 0} services
                        </Badge>
                      </div>

                      <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                    </div>

                    {/* Preview services */}
                    {office.service && office.service.length > 0 && (
                      <div className="mt-4 space-y-1.5 border-t border-border/50 pt-4">
                        {office.service.slice(0, 3).map((s) => (
                          <div key={s.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="size-1.5 rounded-full bg-primary/40 shrink-0" />
                            <span className="line-clamp-1">{s.name}</span>
                          </div>
                        ))}
                        {(office._count?.service ?? 0) > 3 && (
                          <p className="text-xs text-primary/60 font-semibold pl-3.5">
                            +{(office._count?.service ?? 0) - 3} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── SERVICE LIST ── */}
      {selectedOffice && (
        <>
          {isFetchingOffice ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Office info banner */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="size-12 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {selectedOffice.logo ? (
                    <img src={selectedOffice.logo} alt={selectedOffice.name} className="size-full object-contain p-1" />
                  ) : (
                    <Building2 className="size-6 text-primary/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm">{selectedOffice.name}</p>
                  <div className="flex flex-wrap gap-3 mt-0.5">
                    {selectedOffice.address && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {selectedOffice.address}
                      </span>
                    )}
                    {selectedOffice.phoneNumber && (
                      <span className="text-xs text-muted-foreground">{selectedOffice.phoneNumber}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Search services */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="pl-9 h-11 rounded-xl"
                />
              </div>

              {/* Services */}
              {filteredServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-border">
                  <FileText className="size-10 text-muted-foreground/30 mb-3" />
                  <p className="font-semibold">No services found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {serviceSearch ? "Try a different search term." : "This office has no services yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredServices.map((service) => (
                    <ServiceRow
                      key={service.id}
                      service={service}
                      onDetail={() => setDetailService(service)}
                      onApply={() => {
                        setApplyService(service);
                        setForm({ address: "", date: "", notes: "" });
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── SERVICE DETAIL DIALOG ── */}
      <Dialog open={!!detailService} onOpenChange={(o) => !o && setDetailService(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden gap-0">
          {detailService && (
            <>
              <div className="bg-primary px-6 py-5">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl font-black leading-snug">
                    {detailService.name}
                  </DialogTitle>
                </DialogHeader>
              </div>
              <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
                {/* Main info */}
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-black">{detailService.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedOffice?.name}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{detailService.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-5 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Time to take</p>
                        <p className="font-bold">{detailService.timeToTake}</p>
                      </div>
                    </div>
                    {detailService.roomNumber && (
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Room</p>
                          <p className="font-bold">{detailService.roomNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full rounded-xl font-bold h-11"
                    onClick={() => {
                      setDetailService(null);
                      setApplyService(detailService);
                      setForm({ address: "", date: "", notes: "" });
                    }}
                  >
                    <Send className="size-4 mr-2" /> Apply Now
                  </Button>
                </div>

                {/* Requirements */}
                {detailService.requirements && detailService.requirements.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <p className="font-bold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-primary" /> Requirements
                    </p>
                    <ul className="space-y-2.5">
                      {detailService.requirements.map((r) => (
                        <li key={r.id} className="flex items-start gap-2.5">
                          <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold">{r.name}</p>
                            {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Service For */}
                {detailService.serviceFors && detailService.serviceFors.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <p className="font-bold mb-3 flex items-center gap-2">
                      <Users className="size-4 text-primary" /> This Service Is For
                    </p>
                    <ul className="space-y-2.5">
                      {detailService.serviceFors.map((item) => (
                        <li key={item.id} className="flex items-start gap-2.5">
                          <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold">{item.name}</p>
                            {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── APPLY FORM DIALOG ── */}
      <Dialog open={!!applyService} onOpenChange={(o) => !o && setApplyService(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden gap-0">
          {applyService && (
            <>
              <div className="bg-primary px-6 py-5">
                <DialogHeader>
                  <DialogTitle className="text-white font-black text-lg leading-snug">
                    Apply — {applyService.name}
                  </DialogTitle>
                  <p className="text-primary-foreground/70 text-sm mt-0.5">{selectedOffice?.name}</p>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-4">
                {/* Address */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold">
                    Current Address <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Enter your current address"
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold">
                    Preferred Date <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={form.date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                      className="pl-9 h-11 rounded-xl"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold">Notes (optional)</label>
                  <textarea
                    placeholder="Any additional information..."
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-11 font-bold"
                    onClick={() => setApplyService(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 rounded-xl h-11 font-bold"
                    onClick={handleApply}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                      <Send className="size-4 mr-2" />
                    )}
                    Submit Application
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Service Row ────────────────────────────────────────────────────────────────
function ServiceRow({
  service,
  onDetail,
  onApply,
}: {
  service: ServiceDetail;
  onDetail: () => void;
  onApply: () => void;
}) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:bg-muted/20 transition-all group">
      {/* Icon */}
      <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <FileText className="size-5 text-primary" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm group-hover:text-primary transition-colors">{service.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Clock className="size-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">{service.timeToTake}</span>
          {service.requirements && service.requirements.length > 0 && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground">{service.requirements.length} requirements</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          className="h-9 rounded-xl font-bold px-4 text-xs"
          onClick={onApply}
        >
          <Send className="size-3 mr-1.5" /> Apply
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-9 w-9 rounded-xl p-0"
          onClick={onDetail}
          title="View details"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
