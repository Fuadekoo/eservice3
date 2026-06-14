"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
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
import { PageLayout } from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
  description?: string | null;
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
      (s.description ?? "").toLowerCase().includes(serviceSearch.toLowerCase()),
  );
  const selectedServiceCount =
    selectedOffice?._count?.service ?? selectedOffice?.service?.length ?? 0;
  const selectedStaffCount = selectedOffice?._count?.staffs ?? 0;

  return (
    <PageLayout
      title={selectedOffice ? selectedOffice.name : "Apply for Service"}
      description={
        selectedOffice
          ? "Choose a service and submit your application"
          : "Choose an office, review available services, and submit a request"
      }
      icon={selectedOffice ? Building2 : FileText}
      actions={
        selectedOffice ? (
          <Button
            variant="outline"
            onClick={() => setSelectedOffice(null)}
            className="h-10 rounded-xl font-semibold"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to offices
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">

      {/* ── OFFICE GRID ── */}
      {!selectedOffice && (
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold">Find the right office</p>
              <p className="text-xs text-muted-foreground">
                {filteredOffices.length} of {offices.length} offices available
              </p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search offices..."
                value={officeSearch}
                onChange={(e) => setOfficeSearch(e.target.value)}
                className="h-10 rounded-xl pl-9"
              />
            </div>
          </div>

          {loadingOffices ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-52 animate-pulse rounded-xl border border-border/60 bg-muted/40"
                />
              ))}
            </div>
          ) : filteredOffices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-24 text-center">
              <Building2 className="mb-3 size-12 text-muted-foreground/30" />
              <p className="font-bold">No offices found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different office name.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredOffices.map((office) => (
                <button
                  key={office.id}
                  type="button"
                  onClick={() => handleSelectOffice(office.id)}
                  disabled={isFetchingOffice}
                  className="group flex min-h-52 flex-col overflow-hidden rounded-xl border border-border/60 bg-card text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md disabled:pointer-events-none disabled:opacity-60"
                >
                  <div className="h-1 w-full bg-primary/30 transition-colors group-hover:bg-primary" />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40 transition-colors group-hover:border-primary/30">
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
                        <h3 className="line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-primary">
                          {office.name}
                        </h3>
                        {office.address && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            <span className="line-clamp-1">{office.address}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="font-semibold">
                        {office._count?.service ?? office.service?.length ?? 0} services
                      </Badge>
                      {office._count?.staffs !== undefined && (
                        <Badge variant="outline" className="font-semibold">
                          {office._count.staffs} staff
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4 flex-1 border-t border-border/50 pt-4">
                      {office.service && office.service.length > 0 ? (
                        <div className="space-y-1.5">
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
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Open this office to view available services.
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-primary">
                      <span>Select office</span>
                      <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
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
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="space-y-4">
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-background">
                        {selectedOffice.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getUploadUrl(selectedOffice.logo)}
                            alt={selectedOffice.name}
                            className="size-full object-contain p-1.5"
                          />
                        ) : (
                          <Building2 className="size-7 text-primary/60" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-black">{selectedOffice.name}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Badge variant="secondary" className="font-semibold">
                            {selectedServiceCount} services
                          </Badge>
                          <Badge variant="outline" className="font-semibold">
                            {selectedStaffCount} staff
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search services..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="h-10 rounded-xl pl-9"
                      />
                    </div>
                  </div>
                </div>

                {filteredServices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-20 text-center">
                    <FileText className="mb-3 size-10 text-muted-foreground/30" />
                    <p className="font-bold">No services found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
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
              </div>

              <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                  <SectionLabel title="Office Details" icon={Building2} />
                  <div className="mt-4 space-y-3">
                    {selectedOffice.address && (
                      <InfoTile
                        icon={MapPin}
                        label="Address"
                        value={selectedOffice.address}
                      />
                    )}
                    {selectedOffice.phoneNumber && (
                      <InfoTile
                        icon={Info}
                        label="Phone"
                        value={selectedOffice.phoneNumber}
                      />
                    )}
                    {selectedOffice.roomNumber && (
                      <InfoTile
                        icon={MapPin}
                        label="Room"
                        value={`Room ${selectedOffice.roomNumber}`}
                      />
                    )}
                  </div>
                </div>

                {weeklySchedule && (
                  <AvailabilityBanner
                    schedule={weeklySchedule}
                    slotDuration={slotDuration}
                  />
                )}
              </div>
            </div>
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
                    <DialogDescription className="text-primary-foreground/70 text-sm mt-0.5">
                      {selectedOffice?.name}
                    </DialogDescription>
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
        <DialogContent className="w-[95vw] gap-0 overflow-hidden rounded-xl p-0 sm:max-w-6xl">
          {applyService && (
            <div className="flex max-h-[92vh] flex-col">
              <div className="shrink-0 border-b border-border/60 bg-primary px-6 py-5 text-primary-foreground sm:px-8">
                <div className="flex flex-col gap-4 pr-10 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black leading-tight text-primary-foreground sm:text-2xl">
                        Apply for Service
                      </DialogTitle>
                      <DialogDescription className="sr-only">
                        Submit an application for {applyService.name} at{" "}
                        {selectedOffice?.name ?? "the selected office"}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex max-w-full items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white/90">
                        <FileText className="size-3.5 shrink-0" />
                        <span className="truncate">{applyService.name}</span>
                      </span>
                      <span className="inline-flex max-w-full items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white/90">
                        <Building2 className="size-3.5 shrink-0" />
                        <span className="truncate">
                          {selectedOffice?.name ?? "Office"}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Badge className="border-white/20 bg-white/15 px-3 py-2 font-semibold text-white">
                      {uploadedFiles.length} file
                      {uploadedFiles.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* ── Two-column body ── */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
                {/* LEFT — Service info, availability, requirements */}
                <div className="border-b border-border/50 bg-muted/25 md:w-2/5 md:border-b-0 md:border-r">
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
                <div className="overflow-y-auto bg-background md:w-3/5">
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
                          <Textarea
                            placeholder="Add any additional notes or information..."
                            value={form.notes}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, notes: e.target.value }))
                            }
                            rows={3}
                            className="min-h-24 resize-none rounded-xl bg-background"
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
                          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 py-8 transition-all",
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
                              className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"
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
                    <div className="flex flex-col-reverse gap-3 pb-1 sm:flex-row">
                      <Button
                        variant="outline"
                        className="h-11 flex-1 rounded-xl font-bold"
                        onClick={() => setApplyService(null)}
                        disabled={isSubmitting || isUploading}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="h-11 flex-[2] rounded-xl text-sm font-black"
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
    </PageLayout>
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
    <div className="group rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="size-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold leading-snug transition-colors group-hover:text-primary">
            {service.name}
          </p>
          {service.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {service.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {service.timeToTake}
            </span>
            {service.requirements && service.requirements.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-700">
                <CheckCircle2 className="size-3" />
                {service.requirements.length} requirements
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:flex-col md:flex-row">
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-xl px-3 text-xs font-semibold"
            onClick={onDetail}
          >
            Details
          </Button>
          <Button
            size="sm"
            className="h-9 rounded-xl font-semibold px-4 text-xs"
            onClick={onApply}
          >
            <Send className="size-3 mr-1.5" /> Apply
          </Button>
        </div>
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
