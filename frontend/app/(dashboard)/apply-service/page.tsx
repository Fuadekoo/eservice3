"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Paperclip,
  X,
  CalendarDays,
  Info,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { axiosInstance, getUploadUrl } from "@/lib/axios";
import { useOfficeStore } from "@/lib/stores/office-store";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type Requirement = { id: string; name: string; description?: string | null };
type ServiceFor = { id: string; name: string; description?: string | null };

type ServiceDetail = {
  id: string;
  name: string;
  description: string;
  timeToTake: string;
  roomNumber?: string | null;
  requirements?: Requirement[];
  serviceFors?: ServiceFor[];
};

type DaySchedule = { enabled: boolean; start: string; end: string };

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
  settings?: {
    weeklySchedule?: Record<string, DaySchedule>;
    slotDuration?: number;
    [key: string]: unknown;
  };
  availability?: {
    defaultSchedule?: Record<
      string,
      { start: string; end: string; available?: boolean }
    >;
    slotDuration?: number;
  } | null;
};

type UploadedFile = { name: string; filepath: string; size: number };

// ── Day names ─────────────────────────────────────────────────────────────────
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ApplyServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceIdParam = searchParams.get("serviceId");

  const { offices, fetchOffices, isLoading: loadingOffices } = useOfficeStore();

  const [officeSearch, setOfficeSearch] = React.useState("");
  const [selectedOffice, setSelectedOffice] =
    React.useState<OfficeDetail | null>(null);
  const [isFetchingOffice, setIsFetchingOffice] = React.useState(false);
  const [serviceSearch, setServiceSearch] = React.useState("");

  // Apply dialog
  const [applyService, setApplyService] = React.useState<ServiceDetail | null>(
    null,
  );
  const [form, setForm] = React.useState({ address: "", date: "", notes: "" });
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Service detail dialog
  const [detailService, setDetailService] =
    React.useState<ServiceDetail | null>(null);

  React.useEffect(() => {
    void fetchOffices();
  }, [fetchOffices]);

  // ── Auto-select service from URL ──────────────────────────────────────────
  React.useEffect(() => {
    if (serviceIdParam && offices.length > 0) {
      // Find which office has this service
      const findAndLoad = async () => {
        setIsFetchingOffice(true);
        try {
          // We need to find which office contains this serviceId
          // First, search in the basic offices list if possible
          let targetOfficeId = "";
          for (const office of offices) {
            if (office.service?.some((s) => s.id === serviceIdParam)) {
              targetOfficeId = office.id;
              break;
            }
          }

          // If not found in local list, we might need a dedicated API call or just try loading offices one by one
          // But usually, offices list has services. If not, we'll try the /offices/find-by-service endpoint if it exists
          if (targetOfficeId) {
            const res = (await axiosInstance.get(
              `/offices/${targetOfficeId}`,
            )) as unknown as { data: OfficeDetail };
            setSelectedOffice(res.data);

            const service = res.data.service?.find(
              (s) => s.id === serviceIdParam,
            );
            if (service) {
              setApplyService(service);
            }
          }
        } catch (error) {
          console.error("Error auto-loading service:", error);
        } finally {
          setIsFetchingOffice(false);
        }
      };
      void findAndLoad();
    }
  }, [serviceIdParam, offices]);

  // ── Fetch full office ─────────────────────────────────────────────────────
  const handleSelectOffice = async (officeId: string) => {
    setIsFetchingOffice(true);
    setServiceSearch("");
    try {
      const res = (await axiosInstance.get(
        `/offices/${officeId}`,
      )) as unknown as { data: OfficeDetail };
      setSelectedOffice(res.data);
    } catch {
      toast.error("Failed to load office services.");
    } finally {
      setIsFetchingOffice(false);
    }
  };

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";

    setIsUploading(true);
    const results: UploadedFile[] = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10 MB limit.`);
        continue;
      }
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = (await axiosInstance.post(
          "/files/upload",
          fd,
        )) as unknown as {
          data: { filename: string; originalName: string; size: number };
        };
        results.push({
          name: res.data.originalName,
          filepath: res.data.filename,
          size: res.data.size,
        });
      } catch {
        toast.error(`Failed to upload ${file.name}.`);
      }
    }

    setUploadedFiles((prev) => [...prev, ...results]);
    setIsUploading(false);
    if (results.length) toast.success(`${results.length} file(s) attached.`);
  };

  const removeFile = (idx: number) =>
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));

  // ── Submit application ────────────────────────────────────────────────────
  const handleApply = async () => {
    if (!applyService) return;
    if (!form.address.trim()) {
      toast.error("Please enter your current address.");
      return;
    }
    if (!form.date) {
      toast.error("Please select a preferred date.");
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post("/requests", {
        serviceId: applyService.id,
        currentAddress: form.address.trim(),
        date: new Date(form.date).toISOString(),
        notes: form.notes.trim() || undefined,
        files: uploadedFiles.map(({ name, filepath }) => ({ name, filepath })),
      });
      toast.success("Application submitted successfully!");
      setApplyService(null);
      setForm({ address: "", date: "", notes: "" });
      setUploadedFiles([]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit application.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Availability helpers ──────────────────────────────────────────────────
  const weeklySchedule: Record<string, DaySchedule> | undefined =
    selectedOffice?.settings?.weeklySchedule ??
    (selectedOffice?.availability?.defaultSchedule
      ? Object.fromEntries(
          Object.entries(selectedOffice.availability.defaultSchedule).map(
            ([k, v]) => [
              k,
              { enabled: v.available ?? true, start: v.start, end: v.end },
            ],
          ),
        )
      : undefined);

  const slotDuration =
    selectedOffice?.settings?.slotDuration ??
    selectedOffice?.availability?.slotDuration;

  // ── Derived data ──────────────────────────────────────────────────────────
  const filteredOffices = offices.filter((o) =>
    o.name.toLowerCase().includes(officeSearch.toLowerCase()),
  );
  const filteredServices = (selectedOffice?.service ?? []).filter(
    (s) =>
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(serviceSearch.toLowerCase()),
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      {/* ── Header ── */}
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
            <h1 className="text-xl font-black tracking-tight truncate">
              {selectedOffice.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {selectedOffice._count?.service ??
                selectedOffice.service?.length ??
                0}{" "}
              services available
            </p>
          </div>
        </div>
      )}

      {/* ── OFFICE GRID ── */}
      {!selectedOffice && (
        <>
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
                  <div className="h-1.5 w-full bg-primary/20 group-hover:bg-primary/40 transition-colors" />
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="size-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border group-hover:border-primary/30 transition-colors">
                        {office.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getUploadUrl(office.logo)}
                            alt={office.name}
                            className="size-full object-contain p-1.5"
                          />
                        ) : (
                          <Building2 className="size-7 text-primary/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {office.name}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="mt-1.5 text-xs font-semibold"
                        >
                          {office._count?.service ?? 0} services
                        </Badge>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                    </div>
                    {office.service && office.service.length > 0 && (
                      <div className="mt-4 space-y-1.5 border-t border-border/50 pt-4">
                        {office.service.slice(0, 3).map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
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
              {/* Office banner */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="size-12 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {selectedOffice.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getUploadUrl(selectedOffice.logo)}
                      alt={selectedOffice.name}
                      className="size-full object-contain p-1"
                    />
                  ) : (
                    <Building2 className="size-6 text-primary/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm">{selectedOffice.name}</p>
                  <div className="flex flex-wrap gap-3 mt-0.5">
                    {selectedOffice.address && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {selectedOffice.address}
                      </span>
                    )}
                    {selectedOffice.phoneNumber && (
                      <span className="text-xs text-muted-foreground">
                        {selectedOffice.phoneNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Office availability preview */}
              {weeklySchedule && (
                <AvailabilityBanner
                  schedule={weeklySchedule}
                  slotDuration={slotDuration}
                />
              )}

              {/* Search */}
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
                    {serviceSearch
                      ? "Try a different search term."
                      : "This office has no services yet."}
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
                        setUploadedFiles([]);
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
      <Dialog
        open={!!detailService}
        onOpenChange={(o) => !o && setDetailService(null)}
      >
        <DialogContent className="sm:max-w-xl rounded-2xl p-0 overflow-hidden gap-0">
          {detailService && (
            <>
              <div className="bg-primary px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <DialogHeader>
                    <DialogTitle className="text-white text-xl font-black leading-snug">
                      {detailService.name}
                    </DialogTitle>
                    <p className="text-primary-foreground/70 text-sm mt-0.5">
                      {selectedOffice?.name}
                    </p>
                  </DialogHeader>
                  <DialogClose className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40">
                    <X className="size-4" />
                  </DialogClose>
                </div>
              </div>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-black">{detailService.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedOffice?.name}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Description
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {detailService.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-5 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Time to take
                        </p>
                        <p className="font-bold">{detailService.timeToTake}</p>
                      </div>
                    </div>
                    {detailService.roomNumber && (
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Room</p>
                          <p className="font-bold">
                            {detailService.roomNumber}
                          </p>
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
                      setUploadedFiles([]);
                    }}
                  >
                    <Send className="size-4 mr-2" /> Apply Now
                  </Button>
                </div>
                {detailService.requirements &&
                  detailService.requirements.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-5">
                      <p className="font-bold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-primary" />{" "}
                        Requirements
                      </p>
                      <ul className="space-y-2.5">
                        {detailService.requirements.map((r) => (
                          <li key={r.id} className="flex items-start gap-2.5">
                            <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold">{r.name}</p>
                              {r.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {r.description}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {detailService.serviceFors &&
                  detailService.serviceFors.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-5">
                      <p className="font-bold mb-3 flex items-center gap-2">
                        <Users className="size-4 text-primary" /> This Service
                        Is For
                      </p>
                      <ul className="space-y-2.5">
                        {detailService.serviceFors.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-start gap-2.5"
                          >
                            <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold">
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.description}
                                </p>
                              )}
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
      <Dialog
        open={!!applyService}
        onOpenChange={(o) => {
          if (!o && !isSubmitting) {
            setApplyService(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-6xl w-[95vw] rounded-3xl p-0 overflow-hidden gap-0">
          {applyService && (
            <div className="flex flex-col h-full max-h-[92vh]">
              {/* ── Gradient header ── */}
              <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/80 px-8 py-2 shrink-0">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <DialogHeader>
                      <DialogTitle className="text-white font-black text-2xl leading-tight">
                        Apply for Service
                      </DialogTitle>
                      {/* <p className="text-primary-foreground/80 text-sm mt-1 max-w-2xl">
                        Complete the form below and attach your documents to
                        submit this request.
                      </p> */}
                    </DialogHeader>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white/90">
                        <FileText className="size-3" /> {applyService.name}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white/90">
                        <Building2 className="size-3" />{" "}
                        {selectedOffice?.name ?? "Office"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end">
                    <Badge className="bg-white/15 text-white border-white/20 font-semibold py-2 px-3">
                      {uploadedFiles.length} file
                      {uploadedFiles.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* ── Two-column body ── */}
              <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
                {/* LEFT — Service info, availability, requirements */}
                <div className="md:w-2/5 border-b md:border-b-0 md:border-r border-border/50 bg-slate-50 overflow-y-auto">
                  <div className="p-6 space-y-5">
                    {/* Service info tiles */}
                    <div>
                      <SectionLabel
                        step={1}
                        title="Service Information"
                        icon={Info}
                      />
                      <div className="mt-3 space-y-2">
                        <InfoTile
                          icon={FileText}
                          label="Service"
                          value={applyService.name}
                        />
                        <InfoTile
                          icon={Building2}
                          label="Office"
                          value={selectedOffice?.name ?? "—"}
                        />
                        <InfoTile
                          icon={Clock}
                          label="Processing Time"
                          value={applyService.timeToTake}
                        />
                        {applyService.roomNumber && (
                          <InfoTile
                            icon={MapPin}
                            label="Room"
                            value={`Room ${applyService.roomNumber}`}
                          />
                        )}
                        {selectedOffice?.address && (
                          <InfoTile
                            icon={MapPin}
                            label="Address"
                            value={selectedOffice.address}
                          />
                        )}
                      </div>
                    </div>

                    {/* Office availability */}
                    {weeklySchedule && (
                      <div>
                        <SectionLabel
                          step={2}
                          title="Office Availability"
                          icon={CalendarDays}
                        />
                        <div className="mt-3 grid grid-cols-7 gap-1">
                          {DAY_NAMES.map((name, idx) => {
                            const day = weeklySchedule[String(idx)];
                            const enabled = day?.enabled ?? false;
                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "rounded-lg p-1.5 text-center border transition-all",
                                  enabled
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-muted/40 border-border/30 text-muted-foreground/40",
                                )}
                              >
                                <p className="text-[9px] font-black uppercase leading-none">
                                  {name}
                                </p>
                                {enabled ? (
                                  <p className="text-[8px] mt-1 font-semibold leading-tight opacity-90">
                                    {day.start}
                                    <br />
                                    {day.end}
                                  </p>
                                ) : (
                                  <p className="text-[8px] mt-1 opacity-50">
                                    Closed
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {slotDuration && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                            <Clock className="size-3" /> Slot:{" "}
                            <span className="font-semibold">
                              {slotDuration} min
                            </span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Requirements */}
                    {applyService.requirements &&
                      applyService.requirements.length > 0 && (
                        <div>
                          <SectionLabel
                            step={weeklySchedule ? 3 : 2}
                            title="Required Documents"
                            icon={CheckCircle2}
                          />
                          <div className="mt-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                            <ul className="space-y-2">
                              {applyService.requirements.map((r) => (
                                <li
                                  key={r.id}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <span className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                  <div>
                                    <span className="font-semibold text-foreground">
                                      {r.name}
                                    </span>
                                    {r.description && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {r.description}
                                      </p>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                    {/* Service For */}
                    {applyService.serviceFors &&
                      applyService.serviceFors.length > 0 && (
                        <div>
                          <SectionLabel
                            title="This Service Is For"
                            icon={Users}
                          />
                          <ul className="mt-3 space-y-1.5">
                            {applyService.serviceFors.map((item) => (
                              <li
                                key={item.id}
                                className="flex items-start gap-2 text-sm"
                              >
                                <span className="size-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                                <span className="text-muted-foreground">
                                  {item.name}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>

                {/* RIGHT — Form fields */}
                <div className="md:w-3/5 overflow-y-auto bg-white">
                  <div className="p-6 space-y-5">
                    {/* Application details */}
                    <div>
                      <SectionLabel
                        step={
                          weeklySchedule
                            ? applyService.requirements?.length
                              ? 4
                              : 3
                            : applyService.requirements?.length
                              ? 3
                              : 2
                        }
                        title="Application Details"
                        icon={CalendarIcon}
                      />
                      <div className="mt-3 space-y-3">
                        {/* Address */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-primary" />
                            Current Address{" "}
                            <span className="text-destructive ml-0.5">*</span>
                          </label>
                          <Input
                            placeholder="Enter your current address"
                            value={form.address}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                address: e.target.value,
                              }))
                            }
                            className="h-11 rounded-xl"
                          />
                        </div>

                        {/* Date */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold flex items-center gap-1.5">
                            <CalendarIcon className="size-3.5 text-primary" />
                            Preferred Date{" "}
                            <span className="text-destructive ml-0.5">*</span>
                          </label>
                          <Input
                            type="date"
                            value={form.date}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, date: e.target.value }))
                            }
                            className="h-11 rounded-xl"
                          />
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold flex items-center gap-1.5">
                            <Info className="size-3.5 text-primary" />
                            Notes{" "}
                            <span className="text-muted-foreground font-normal">
                              (Optional)
                            </span>
                          </label>
                          <textarea
                            placeholder="Add any additional notes or information..."
                            value={form.notes}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, notes: e.target.value }))
                            }
                            rows={3}
                            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* File upload */}
                    <div>
                      <SectionLabel title="Attach Files" icon={Paperclip} />
                      <p className="text-xs text-muted-foreground mt-1 mb-3">
                        PDF or images · max 10 MB each
                      </p>

                      <label
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-border cursor-pointer transition-all",
                          "hover:border-primary/50 hover:bg-primary/5",
                          isUploading && "pointer-events-none opacity-60",
                        )}
                      >
                        {isUploading ? (
                          <Loader2 className="size-8 animate-spin text-primary" />
                        ) : (
                          <Upload className="size-8 text-muted-foreground/40" />
                        )}
                        <div className="text-center">
                          <p className="text-sm font-semibold text-muted-foreground">
                            {isUploading
                              ? "Uploading…"
                              : "Click to choose files"}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">
                            PDF, PNG, JPG, WEBP
                          </p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                      </label>

                      {uploadedFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {uploadedFiles.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20"
                            >
                              <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <Paperclip className="size-4 text-emerald-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024).toFixed(0)} KB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="size-7 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Submit actions */}
                    <div className="flex gap-3 pb-1">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl h-12 font-bold"
                        onClick={() => setApplyService(null)}
                        disabled={isSubmitting || isUploading}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-[2] rounded-xl h-12 font-black text-base"
                        onClick={handleApply}
                        disabled={isSubmitting || isUploading}
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
                </div>
              </div>
            </div>
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
    <div className="flex items-center gap-4 p-5 rounded-3xl border border-border/70 bg-white shadow-sm hover:border-primary/30 hover:shadow-lg transition-all duration-200 group">
      <div className="size-11 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0">
        <FileText className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm group-hover:text-primary transition-colors">
          {service.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {service.description}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {service.timeToTake}
          </span>
          {service.requirements && service.requirements.length > 0 && (
            <span className="inline-flex items-center gap-1 text-muted-foreground/80">
              · {service.requirements.length} requirements
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="secondary"
          className="h-9 rounded-xl font-semibold px-4 text-xs"
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

// ── Availability Banner ───────────────────────────────────────────────────────
function AvailabilityBanner({
  schedule,
  slotDuration,
}: {
  schedule: Record<string, DaySchedule>;
  slotDuration?: number;
}) {
  const activeDays = DAY_NAMES.filter((_, i) => schedule[String(i)]?.enabled);
  if (activeDays.length === 0) return null;

  return (
    <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-primary/70 mb-3 flex items-center gap-1.5">
        <CalendarDays className="size-3.5" /> Office Availability
      </p>
      <div className="flex flex-wrap gap-2">
        {DAY_NAMES.map((name, idx) => {
          const day = schedule[String(idx)];
          const enabled = day?.enabled ?? false;
          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border",
                enabled
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground/40 border-border/30",
              )}
            >
              <span>{name}</span>
              {enabled && (
                <span className="opacity-80">
                  {day.start}–{day.end}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {slotDuration && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
          <Clock className="size-3.5" /> Slot duration:{" "}
          <span className="font-semibold">{slotDuration} min</span>
        </p>
      )}
    </div>
  );
}

// ── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({
  step,
  title,
  icon: Icon,
}: {
  step?: number;
  title: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-2">
      {step !== undefined && (
        <div className="size-5 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-[10px] font-black text-primary-foreground">
            {step}
          </span>
        </div>
      )}
      <Icon className="size-3.5 text-primary" />
      <h3 className="font-bold text-xs uppercase tracking-wider text-foreground/80">
        {title}
      </h3>
    </div>
  );
}

// ── Info Tile ─────────────────────────────────────────────────────────────────
function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/40">
      <Icon className="size-4 text-primary mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}
