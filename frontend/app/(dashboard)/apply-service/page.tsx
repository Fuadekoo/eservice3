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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

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
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[25rem] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ApplyServiceContent />
    </React.Suspense>
  );
}

function ApplyServiceContent() {
  const { t } = useTranslation();

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
  const [mobileApplyStep, setMobileApplyStep] = React.useState<
    "details" | "form"
  >("details");
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

  // Open the apply panel, always starting on the first mobile step
  const openApply = React.useCallback((service: ServiceDetail) => {
    setApplyService(service);
    setMobileApplyStep("details");
    setForm({ address: "", date: "", notes: "" });
    setUploadedFiles([]);
  }, []);

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
              openApply(service);
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
  }, [serviceIdParam, offices, openApply]);

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
      toast.error(t("Failed to load office services."));
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
        toast.error(t("Failed to upload {name}.", { name: file.name }));
      }
    }

    setUploadedFiles((prev) => [...prev, ...results]);
    setIsUploading(false);
    if (results.length)
      toast.success(t("{count} file(s) attached.", { count: results.length }));
  };

  const removeFile = (idx: number) =>
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));

  // ── Submit application ────────────────────────────────────────────────────
  const handleApply = async () => {
    if (!applyService) return;
    if (!form.address.trim()) {
      toast.error(t("Please enter your current address."));
      return;
    }
    if (!form.date) {
      toast.error(t("Please select a preferred date."));
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
      toast.success(t("Application submitted successfully!"));
      setApplyService(null);
      setForm({ address: "", date: "", notes: "" });
      setUploadedFiles([]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("Failed to submit application.");
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
      title={selectedOffice ? selectedOffice.name : t("Apply for Service")}
      description={
        selectedOffice
          ? t("Choose a service and submit your application")
          : t("Choose an office, review available services, and submit a request")
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
            {t("Back to offices")}
          </Button>
        ) : undefined
      }
    >
      <div className="w-full min-w-0 space-y-5 overflow-x-hidden sm:space-y-6">
        {/* ── OFFICE GRID ── */}
        {!selectedOffice && (
          <>
            <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
              <div className="min-w-0">
                <p className="text-sm font-bold">{t("Find the right office")}</p>
                <p className="text-xs text-muted-foreground">
                  {filteredOffices.length} of {offices.length} {t("offices available")}
                </p>
              </div>
              <div className="relative w-full min-w-0 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("Search offices...")}
                  value={officeSearch}
                  onChange={(e) => setOfficeSearch(e.target.value)}
                  className="h-10 w-full rounded-xl pl-9"
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
                <p className="font-bold">{t("No offices found")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("Try a different office name.")}
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
                    className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md disabled:pointer-events-none disabled:opacity-60 sm:min-h-52"
                  >
                    <div className="h-1 w-full bg-primary/30 transition-colors group-hover:bg-primary" />
                    <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40 transition-colors group-hover:border-primary/30 sm:size-14">
                          {office.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getUploadUrl(office.logo)}
                              alt={office.name}
                              className="size-full object-contain p-1.5"
                            />
                          ) : (
                            <Building2 className="size-6 text-primary/50 sm:size-7" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-sm font-bold leading-snug wrap-break-word transition-colors group-hover:text-primary sm:text-base">
                            {office.name}
                          </h3>
                          {office.address && (
                            <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="size-3 shrink-0" />
                              <span className="truncate">{office.address}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                        <Badge variant="secondary" className="font-semibold">
                          {office._count?.service ??
                            office.service?.length ??
                            0}{" "}
                          {t("services")}
                        </Badge>
                        {office._count?.staffs !== undefined && (
                          <Badge variant="outline" className="font-semibold">
                            {office._count.staffs} {t("staff")}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 min-w-0 flex-1 border-t border-border/50 pt-3 sm:mt-4 sm:pt-4">
                        {office.service && office.service.length > 0 ? (
                          <div className="space-y-1.5">
                            {office.service.slice(0, 3).map((s) => (
                              <div
                                key={s.id}
                                className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"
                              >
                                <span className="size-1.5 shrink-0 rounded-full bg-primary/40" />
                                <span className="truncate">{s.name}</span>
                              </div>
                            ))}
                            {(office._count?.service ?? 0) > 3 && (
                              <p className="text-xs text-primary/60 font-semibold pl-3.5">
                                +{(office._count?.service ?? 0) - 3} {t("more")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {t("Open this office to view available services.")}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs font-bold text-primary sm:mt-4">
                        <span>{t("Select office")}</span>
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
              <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
                <div className="min-w-0 space-y-4">
                  <div className="min-w-0 rounded-xl border border-primary/15 bg-primary/5 p-3 sm:p-4">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-background sm:size-14">
                          {selectedOffice.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getUploadUrl(selectedOffice.logo)}
                              alt={selectedOffice.name}
                              className="size-full object-contain p-1.5"
                            />
                          ) : (
                            <Building2 className="size-6 text-primary/60 sm:size-7" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-black leading-snug wrap-break-word sm:truncate sm:text-base">
                            {selectedOffice.name}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <Badge
                              variant="secondary"
                              className="font-semibold"
                            >
                              {selectedServiceCount} {t("services")}
                            </Badge>
                            <Badge variant="outline" className="font-semibold">
                              {selectedStaffCount} {t("staff")}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="relative w-full min-w-0 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder={t("Search services...")}
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          className="h-10 w-full rounded-xl pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  {filteredServices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-20 text-center">
                      <FileText className="mb-3 size-10 text-muted-foreground/30" />
                      <p className="font-bold">{t("No services found")}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {serviceSearch
                          ? t("Try a different search term.")
                          : t("This office has no services yet.")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredServices.map((service) => (
                        <ServiceRow
                          key={service.id}
                          service={service}
                          onDetail={() => setDetailService(service)}
                          onApply={() => openApply(service)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
                  <div className="min-w-0 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                    <SectionLabel title={t("Office Details")} icon={Building2} />
                    <div className="mt-4 space-y-3">
                      {selectedOffice.address && (
                        <InfoTile
                          icon={MapPin}
                          label={t("Address")}
                          value={selectedOffice.address}
                        />
                      )}
                      {selectedOffice.phoneNumber && (
                        <InfoTile
                          icon={Info}
                          label={t("Phone")}
                          value={selectedOffice.phoneNumber}
                        />
                      )}
                      {selectedOffice.roomNumber && (
                        <InfoTile
                          icon={MapPin}
                          label={t("Room")}
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

        {/* ── SERVICE DETAIL PANEL (right side sheet) ── */}
        <Sheet
          open={!!detailService}
          onOpenChange={(o) => !o && setDetailService(null)}
        >
          <SheetContent
            side="right"
            showCloseButton={false}
            className="w-full! max-w-none! gap-0 overflow-hidden bg-background p-0 sm:w-[32rem]! sm:rounded-l-2xl"
          >
            {detailService && (
              <div className="flex h-full min-h-0 flex-col">
                {/* ── Header ── */}
                <div className="relative shrink-0 border-b border-border/60 bg-primary px-5 py-4 text-primary-foreground sm:px-6 sm:py-5">
                  <SheetClose className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:size-10">
                    <X className="size-4" />
                    <span className="sr-only">{t("Close")}</span>
                  </SheetClose>

                  <SheetHeader className="gap-0.5 p-0 pr-14">
                    <SheetTitle className="text-lg font-black leading-snug text-primary-foreground sm:text-xl">
                      {detailService.name}
                    </SheetTitle>
                    <SheetDescription className="flex items-center gap-1.5 text-sm text-primary-foreground/75">
                      <Building2 className="size-3.5 shrink-0" />
                      <span className="truncate">{selectedOffice?.name}</span>
                    </SheetDescription>
                  </SheetHeader>
                </div>

                {/* ── Scrollable body ── */}
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
                  {/* Meta tiles */}
                  <div className="grid grid-cols-2 gap-2">
                    <InfoTile
                      icon={Clock}
                      label={t("Time to take")}
                      value={detailService.timeToTake}
                    />
                    {detailService.roomNumber ? (
                      <InfoTile
                        icon={MapPin}
                        label={t("Room")}
                        value={detailService.roomNumber}
                      />
                    ) : (
                      selectedOffice?.address && (
                        <InfoTile
                          icon={MapPin}
                          label={t("Address")}
                          value={selectedOffice.address}
                        />
                      )
                    )}
                  </div>

                  {detailService.description && (
                    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                      <SectionLabel title={t("Description")} icon={FileText} />
                      <p className="mt-2.5 text-sm leading-relaxed text-foreground/80">
                        {detailService.description}
                      </p>
                    </div>
                  )}

                  {detailService.requirements &&
                    detailService.requirements.length > 0 && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
                        <SectionLabel
                          title={t("Required Documents")}
                          icon={CheckCircle2}
                        />
                        <ul className="mt-3 space-y-2.5">
                          {detailService.requirements.map((r) => (
                            <li key={r.id} className="flex items-start gap-2.5">
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold">
                                  {r.name}
                                </p>
                                {r.description && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
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
                      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                        <SectionLabel title={t("This Service Is For")} icon={Users} />
                        <ul className="mt-3 space-y-2.5">
                          {detailService.serviceFors.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-start gap-2.5"
                            >
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold">
                                  {item.name}
                                </p>
                                {item.description && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
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

                {/* ── Sticky action bar ── */}
                <div className="shrink-0 border-t border-border/60 bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="h-12 shrink-0 rounded-xl px-5 font-bold sm:h-11"
                      onClick={() => setDetailService(null)}
                    >
                      {t("Close")}
                    </Button>
                    <Button
                      className="h-12 min-w-0 flex-1 rounded-xl text-sm font-black sm:h-11"
                      onClick={() => {
                        setDetailService(null);
                        openApply(detailService);
                      }}
                    >
                      <Send className="mr-2 size-4" />
                      <span className="truncate">{t("Apply Now")}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* ── APPLY FORM PANEL (right side sheet) ── */}
        <Sheet
          open={!!applyService}
          onOpenChange={(o) => {
            if (!o && !isSubmitting) {
              setApplyService(null);
            }
          }}
        >
          <SheetContent
            side="right"
            showCloseButton={false}
            className="w-full! max-w-none! gap-0 overflow-hidden bg-background p-0 sm:w-[94vw]! sm:rounded-l-2xl lg:w-[64rem]!"
          >
            {applyService && (
              <div className="flex h-full min-h-0 flex-col">
                {/* ── Header ── */}
                <div className="relative shrink-0 border-b border-border/60 bg-primary px-5 py-4 text-primary-foreground sm:px-7 sm:py-5">
                  <SheetClose className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:size-10">
                    <X className="size-4" />
                    <span className="sr-only">{t("Close")}</span>
                  </SheetClose>

                  <SheetHeader className="gap-0 p-0 pr-14">
                    <SheetTitle className="text-lg font-black leading-tight text-primary-foreground sm:text-2xl">
                      {t("Apply for Service")}
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                      {t("Submit an application for {service} at {office}.", {
                        service: applyService.name,
                        office: selectedOffice?.name ?? t("the selected office"),
                      })}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white/90 sm:px-3 sm:py-2 sm:text-sm">
                      <FileText className="size-3.5 shrink-0" />
                      <span className="truncate">{applyService.name}</span>
                    </span>
                    <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white/90 sm:px-3 sm:py-2 sm:text-sm">
                      <Building2 className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {selectedOffice?.name ?? t("Office")}
                      </span>
                    </span>
                    <Badge className="border-white/20 bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white sm:px-3 sm:py-2">
                      {uploadedFiles.length} {t("file")}
                      {uploadedFiles.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>

                {/* ── Mobile step indicator ── */}
                <div className="flex shrink-0 items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-2.5 lg:hidden">
                  {(
                    [
                      { key: "details", label: t("Service info") },
                      { key: "form", label: t("Your details") },
                    ] as const
                  ).map((s, i) => {
                    const active = mobileApplyStep === s.key;
                    const done = mobileApplyStep === "form" && i === 0;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setMobileApplyStep(s.key)}
                        className={cn(
                          "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                          active && "bg-primary/10",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black transition-colors",
                            active || done
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted-foreground/20 text-muted-foreground",
                          )}
                        >
                          {i + 1}
                        </span>
                        <span
                          className={cn(
                            "truncate text-xs font-bold",
                            active ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {s.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* ── Two-column body ── */}
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
                  {/* LEFT — Service info, availability, requirements */}
                  <div
                    className={cn(
                      "min-h-0 flex-1 overflow-y-auto border-border/50 bg-muted/25 lg:w-2/5 lg:flex-none lg:border-r",
                      mobileApplyStep === "form"
                        ? "hidden lg:block"
                        : "block lg:block",
                    )}
                  >
                    <div className="space-y-5 p-5 sm:p-6">
                      {/* Service info tiles */}
                      <div>
                        <SectionLabel
                          step={1}
                          title={t("Service Information")}
                          icon={Info}
                        />
                        <div className="mt-3 space-y-2">
                          <InfoTile
                            icon={FileText}
                            label={t("Service")}
                            value={applyService.name}
                          />
                          <InfoTile
                            icon={Building2}
                            label={t("Office")}
                            value={selectedOffice?.name ?? "—"}
                          />
                          <InfoTile
                            icon={Clock}
                            label={t("Processing Time")}
                            value={applyService.timeToTake}
                          />
                          {applyService.roomNumber && (
                            <InfoTile
                              icon={MapPin}
                              label={t("Room")}
                              value={`Room ${applyService.roomNumber}`}
                            />
                          )}
                          {selectedOffice?.address && (
                            <InfoTile
                              icon={MapPin}
                              label={t("Address")}
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
                            title={t("Office Availability")}
                            icon={CalendarDays}
                          />
                          <div className="mt-3 grid grid-cols-4 gap-1 sm:grid-cols-7">
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
                                      {t("Closed")}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {slotDuration && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                              <Clock className="size-3" /> {t("Slot:")}{" "}
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
                              title={t("Required Documents")}
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
                              title={t("This Service Is For")}
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
                  <div
                    className={cn(
                      "min-h-0 flex-1 overflow-y-auto bg-background lg:w-3/5 lg:flex-none",
                      mobileApplyStep === "details"
                        ? "hidden lg:block"
                        : "block lg:block",
                    )}
                  >
                    <div className="space-y-5 p-5 sm:p-6">
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
                          title={t("Application Details")}
                          icon={CalendarIcon}
                        />
                        <div className="mt-3 space-y-3">
                          {/* Address */}
                          <div className="space-y-1.5">
                            <label className="text-sm font-bold flex items-center gap-1.5">
                              <MapPin className="size-3.5 text-primary" />
                              {t("Current Address")}{" "}
                              <span className="text-destructive ml-0.5">*</span>
                            </label>
                            <Input
                              placeholder={t("Enter your current address")}
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
                              {t("Preferred Date")}{" "}
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
                              {t("Notes")}{" "}
                              <span className="text-muted-foreground font-normal">
                                {t("(Optional)")}
                              </span>
                            </label>
                            <Textarea
                              placeholder={t("Add any additional notes or information...")}
                              value={form.notes}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  notes: e.target.value,
                                }))
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
                        <SectionLabel title={t("Attach Files")} icon={Paperclip} />
                        <p className="text-xs text-muted-foreground mt-1 mb-3">
                          {t("PDF or images · max 10 MB each")}
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
                                ? t("Uploading…")
                                : t("Click to choose files")}
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">
                              {t("PDF, PNG, JPG, WEBP")}
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
                                    {(file.size / 1024).toFixed(0)} {t("KB")}
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

                    </div>
                  </div>
                </div>

                {/* ── Sticky action bar ── */}
                <div className="shrink-0 border-t border-border/60 bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
                  {/* Mobile — step aware */}
                  <div className="flex items-center gap-3 lg:hidden">
                    {mobileApplyStep === "details" ? (
                      <Button
                        className="h-12 w-full rounded-xl text-sm font-black"
                        onClick={() => setMobileApplyStep("form")}
                      >
                        {t("Continue to application")}
                        <ChevronRight className="ml-1.5 size-4" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="h-12 shrink-0 rounded-xl px-4 font-bold"
                          onClick={() => setMobileApplyStep("details")}
                          disabled={isSubmitting}
                        >
                          <ArrowLeft className="size-4" />
                          <span className="sr-only sm:not-sr-only sm:ml-1.5">
                            {t("Back")}
                          </span>
                        </Button>
                        <Button
                          className="h-12 min-w-0 flex-1 rounded-xl text-sm font-black"
                          onClick={handleApply}
                          disabled={isSubmitting || isUploading}
                        >
                          {isSubmitting ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <Send className="mr-2 size-4" />
                          )}
                          <span className="truncate">{t("Submit Application")}</span>
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Desktop */}
                  <div className="hidden items-center gap-3 lg:flex">
                    <Button
                      variant="outline"
                      className="h-11 flex-1 rounded-xl font-bold"
                      onClick={() => setApplyService(null)}
                      disabled={isSubmitting || isUploading}
                    >
                      {t("Cancel")}
                    </Button>
                    <Button
                      className="h-11 flex-[2] rounded-xl text-sm font-black"
                      onClick={handleApply}
                      disabled={isSubmitting || isUploading}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 size-4" />
                      )}
                      {t("Submit Application")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
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
  const { t } = useTranslation();

  return (
    <div className="group min-w-0 rounded-xl border border-border/70 bg-card p-3.5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md sm:p-4">
      <div className="flex min-w-0 gap-3 sm:items-center sm:gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:size-11">
          <FileText className="size-5 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug wrap-break-word transition-colors group-hover:text-primary sm:text-base">
            {service.name}
          </p>
          {service.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground wrap-break-word sm:text-sm">
              {service.description}
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3 shrink-0" />
              {service.timeToTake}
            </span>
            {service.requirements && service.requirements.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-700">
                <CheckCircle2 className="size-3 shrink-0" />
                {service.requirements.length} {t("requirements")}
              </span>
            )}
          </div>
        </div>

        {/* Actions — inline from sm up */}
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-xl px-3 text-xs font-semibold"
            onClick={onDetail}
          >
            {t("Details")}
          </Button>
          <Button
            size="sm"
            className="h-9 rounded-xl px-4 text-xs font-semibold"
            onClick={onApply}
          >
            <Send className="mr-1.5 size-3" /> {t("Apply")}
          </Button>
        </div>
      </div>

      {/* Actions — full-width row on mobile */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
        <Button
          size="sm"
          variant="outline"
          className="h-10 w-full rounded-xl text-xs font-semibold"
          onClick={onDetail}
        >
          {t("Details")}
        </Button>
        <Button
          size="sm"
          className="h-10 w-full rounded-xl text-xs font-semibold"
          onClick={onApply}
        >
          <Send className="mr-1.5 size-3" /> {t("Apply")}
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
  const { t } = useTranslation();

  const activeDays = DAY_NAMES.filter((_, i) => schedule[String(i)]?.enabled);
  if (activeDays.length === 0) return null;

  return (
    <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-primary/70 mb-3 flex items-center gap-1.5">
        <CalendarDays className="size-3.5" /> {t("Office Availability")}
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
          <Clock className="size-3.5" /> {t("Slot duration:")}{" "}
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
    <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-border/40 bg-muted/30 p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold wrap-break-word">{value}</p>
      </div>
    </div>
  );
}
