"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Loader2,
  Info,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  ArrowLeft,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useOfficeStore, type Office } from "@/lib/stores/office-store";
import {
  useHomepageStore,
  type HomepageOfficeDetail,
  type HomepageServiceItem,
} from "@/lib/stores/homepage-store";
import { getUploadUrl } from "@/lib/axios";
import { isAuthenticated } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

// ─── Main Component ───────────────────────────────────────────────────────────
export function GovernmentOffices() {
  const { isLoading } = useOfficeStore();
  const offices = useOfficeStore((state) => state.offices);
  const searchQuery = useHomepageStore((state) => state.searchQuery);
  const getFilteredOffices = useHomepageStore((state) => state.getFilteredOffices);
  const {
    selectedOffice,
    isOfficeDialogOpen,
    isFetchingOfficeDetail,
    openOfficeDialog,
    closeOfficeDialog,
  } = useHomepageStore();
  const { t } = useTranslation();

  const activeOffices = React.useMemo(
    () => getFilteredOffices(),
    [getFilteredOffices, offices, searchQuery],
  );

  if (isLoading && activeOffices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-10 animate-spin mb-4 text-primary" />
        <p className="font-medium">{t("Loading government offices...")}</p>
      </div>
    );
  }

  return (
    <section id="offices" className="space-y-10 py-12">
      <div className="flex items-center gap-3">
        <Building2 className="size-8 text-primary" />
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          {t("Government Offices")}{" "}
          <span className="text-primary/70 text-xl font-bold">
            ({activeOffices.length})
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeOffices.map((office) => (
          <OfficeCard
            key={office.id}
            office={office}
            onClick={() => void openOfficeDialog(office)}
            isLoading={isFetchingOfficeDetail}
            t={t}
          />
        ))}
        {activeOffices.length === 0 && (
          <div className="col-span-full py-20 text-center rounded-3xl border-2 border-dashed border-white/10">
            <Building2 className="size-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 font-medium">
              {searchQuery.trim()
                ? t("No offices match your search.")
                : t("No offices found.")}
            </p>
          </div>
        )}
      </div>

      {selectedOffice && (
        <OfficeDialog
          office={selectedOffice}
          open={isOfficeDialogOpen}
          onOpenChange={(open) => {
            if (!open) closeOfficeDialog();
          }}
          t={t}
        />
      )}
    </section>
  );
}

// ─── Office Card ──────────────────────────────────────────────────────────────
function OfficeCard({
  office,
  onClick,
  isLoading,
  t,
}: {
  office: Office;
  onClick: () => void;
  isLoading: boolean;
  t: (k: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="group text-left w-full rounded-[2rem] bg-card border border-border hover:border-primary/40 hover:bg-accent/50 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl flex flex-col h-full"
    >
      {/* Card Header */}
      <div className="p-6 flex items-center gap-5">
        {/* Logo */}
        <div className="size-20 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-border/50 group-hover:scale-105 transition-transform duration-300">
          {office.logo ? (
            <img
              src={getUploadUrl(office.logo)}
              alt={office.name}
              className="size-full object-contain p-2"
            />
          ) : (
            <Building2 className="size-10 text-primary" />
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">
            {office.name}
          </h3>
        </div>

        <ChevronRight className="size-5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
      </div>

      {/* Service list preview */}
      <div className="px-6 pb-8 space-y-4 flex-1">
        <p className="text-sm font-bold text-muted-foreground">
          {t("{count} services", { count: office._count?.service ?? 0 })}
        </p>

        <div className="space-y-2">
          {office.service?.slice(0, 3).map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-2.5 text-sm text-muted-foreground"
            >
              <span className="text-primary font-bold mt-0.5">•</span>
              <span className="line-clamp-1 leading-relaxed">{s.name}</span>
            </div>
          ))}
          {(office._count?.service ?? 0) > 3 && (
            <p className="text-xs text-primary font-bold pl-3 mt-2">
              +{t("{count} more", { count: (office._count?.service ?? 0) - 3 })}
            </p>
          )}
          {(!office.service || office.service.length === 0) && (
            <p className="text-xs text-muted-foreground/50 italic">
              {t("No services listed.")}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Office Dialog (two-pane: list → detail) ──────────────────────────────────
function OfficeDialog({
  office,
  open,
  onOpenChange,
  t,
}: {
  office: HomepageOfficeDetail;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  t: (k: string, vars?: Record<string, string | number>) => string;
}) {

  const selectedService = useHomepageStore((state) => state.selectedService);
  const setSelectedService = useHomepageStore((state) => state.setSelectedService);
  const isLoggedIn = isAuthenticated();

  React.useEffect(() => {
    if (!open) setSelectedService(null);
  }, [open, setSelectedService]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full! max-w-none! gap-0 overflow-hidden border-none bg-background p-0 text-foreground shadow-2xl sm:w-[92vw]! sm:rounded-l-[1.5rem] lg:w-184!"
      >
        <SheetDescription className="sr-only">
          {selectedService
            ? t("Service details and requirements")
            : t("Browse services offered by this office")}
        </SheetDescription>

        {!selectedService ? (
          // ── Service List View ──
          <div className="flex h-full min-h-0 flex-col">
            {/* Blue header */}
            <div className="relative shrink-0 bg-[#0047FF] px-5 py-6 pr-14 sm:px-8 sm:py-8">
              <div className="flex min-w-0 items-start gap-4 sm:items-center sm:gap-5">
                {/* Logo */}
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white shadow-xl sm:size-20">
                  {office.logo ? (
                    <img
                      src={getUploadUrl(office.logo)}
                      alt={office.name}
                      className="size-full object-contain p-2"
                    />
                  ) : (
                    <Building2 className="size-8 text-[#0047FF] sm:size-10" />
                  )}
                </div>

                {/* Name */}
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-lg leading-snug font-bold wrap-break-word text-white sm:text-2xl">
                    {office.name}
                  </SheetTitle>
                  <p className="mt-1.5 text-sm leading-relaxed font-medium wrap-break-word text-white/70 italic opacity-80 sm:mt-2 sm:text-base">
                    {office.slogan || t("Excellence in Public Service")}
                  </p>
                </div>
              </div>

              {/* Close */}
              <SheetClose className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-white/70 transition-all hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                <X className="size-5" />
                <span className="sr-only">{t("Close")}</span>
              </SheetClose>
            </div>

            {/* Services list */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] p-4 sm:space-y-4 sm:p-6">
              {office.service && office.service.length > 0 ? (
                office.service.map((service) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    isLoggedIn={isLoggedIn}
                    onDetail={() => setSelectedService(service)}
                    t={t}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                  <Info className="mb-4 size-16 text-slate-300" />
                  <p className="text-lg font-bold text-slate-500">
                    {t("No services available for this office.")}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // ── Service Detail View ──
          <ServiceDetailView
            service={selectedService}
            officeName={office.name}
            isLoggedIn={isLoggedIn}
            onBack={() => setSelectedService(null)}
            t={t}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Service Row in list ──────────────────────────────────────────────────────
function ServiceRow({
  service,
  isLoggedIn,
  onDetail,
  t,
}: {
  service: HomepageServiceItem;
  isLoggedIn: boolean;
  onDetail: () => void;
  t: (k: string, vars?: Record<string, string | number>) => string;
}) {
  const applyUrl = isLoggedIn
    ? `/apply-service?serviceId=${service.id}`
    : `/signin?callbackUrl=${encodeURIComponent(`/apply-service?serviceId=${service.id}`)}`;

  return (
    <div
      onClick={onDetail}
      className="flex flex-col gap-4 p-5 sm:p-6 bg-white border border-slate-200/60 rounded-2xl hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="space-y-2">
        <p className="text-lg sm:text-xl font-bold text-slate-900 leading-snug break-words group-hover:text-[#0047FF] transition-colors">
          {service.name}
        </p>
        <p className="text-sm sm:text-base text-slate-500 leading-relaxed break-words whitespace-pre-wrap">
          {service.description}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-slate-100">
        <Button
          asChild
          size="sm"
          className="rounded-xl px-6 h-11 font-bold bg-[#0047FF] hover:bg-[#0036C1] text-white shadow-lg shadow-blue-500/20 text-sm w-full sm:w-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Link href={applyUrl}>{t("Apply Now")}</Link>
        </Button>
        <span className="inline-flex items-center justify-center sm:justify-end gap-1 text-sm font-semibold text-slate-400 group-hover:text-[#0047FF] transition-colors">
          {t("View details")}
          <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </div>
  );
}

// ─── Service Detail View ──────────────────────────────────────────────────────
function ServiceDetailView({
  service,
  officeName,
  isLoggedIn,
  onBack,
  t,
}: {
  service: HomepageServiceItem;
  officeName: string;
  isLoggedIn: boolean;
  onBack: () => void;
  t: (k: string, vars?: Record<string, string | number>) => string;
}) {
  const applyUrl = isLoggedIn
    ? `/apply-service?serviceId=${service.id}`
    : `/signin?callbackUrl=${encodeURIComponent(`/apply-service?serviceId=${service.id}`)}`;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#F8FAFC]">
      {/* Blue header */}
      <div className="relative shrink-0 bg-[#0047FF] px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex min-w-0 items-start gap-3 pr-12 sm:gap-4">
          <button
            onClick={onBack}
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition-all hover:bg-white/20"
          >
            <ArrowLeft className="size-4" />
            <span className="sr-only">{t("Back")}</span>
          </button>
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-base leading-snug font-bold wrap-break-word text-white sm:text-xl">
              {service.name}
            </SheetTitle>
          </div>
        </div>

        <SheetClose className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-white/70 transition-all hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
          <X className="size-5" />
          <span className="sr-only">{t("Close")}</span>
        </SheetClose>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {/* Main info card */}
        <div className="rounded-2xl bg-white border border-slate-200/60 p-5 sm:p-6 shadow-sm space-y-6">
          <div className="space-y-4">
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed break-words whitespace-pre-wrap">
              {service.description}
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 text-slate-600">
                <Clock className="size-5 text-slate-400 shrink-0" />
                <span className="text-sm font-medium">
                  {t("Time to take")}: {service.timeToTake}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <FileText className="size-5 text-slate-400 shrink-0" />
                <span className="text-sm font-medium">
                  {t("Room")}: {service.roomNumber || "001"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Building2 className="size-5 text-slate-400 shrink-0" />
                <span className="text-sm font-medium">
                  {t("Office")}: {officeName}
                </span>
              </div>
            </div>
          </div>

          <Button
            asChild
            className="w-full h-12 rounded-xl font-bold text-base bg-[#0047FF] hover:bg-[#0036C1] text-white shadow-lg shadow-blue-500/20"
          >
            <Link href={applyUrl}>{t("Apply Now")}</Link>
          </Button>
        </div>

        {/* Requirements */}
        {service.requirements && service.requirements.length > 0 && (
          <div className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm">
            <h4 className="text-base font-bold text-slate-900 mb-4">
              {t("Requirements")}
            </h4>
            <ul className="space-y-4">
              {service.requirements.map((req) => (
                <li key={req.id} className="flex items-start gap-3 group">
                  <div className="size-2 rounded-full bg-[#0047FF] mt-2 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 leading-tight">
                      {req.name}
                    </p>
                    {req.description && (
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {req.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
