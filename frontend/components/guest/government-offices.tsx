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
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useOfficeStore, type Office } from "@/lib/stores/office-store";
import {
  useHomepageStore,
  type HomepageOfficeDetail,
  type HomepageServiceItem,
} from "@/lib/stores/homepage-store";
import { useLanguagesStore } from "@/lib/stores/languages-store";
import { getUploadUrl } from "@/lib/axios";
import { isAuthenticated } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

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
  const { getTranslationForKey: t } = useLanguagesStore();

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
  t: (k: string) => string;
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
          {office._count?.service ?? 0} {t("tajajila")}
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
              +{(office._count?.service ?? 0) - 3} {t("kan biraa")}
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
  t: (k: string) => string;
}) {
  const selectedService = useHomepageStore((state) => state.selectedService);
  const setSelectedService = useHomepageStore((state) => state.setSelectedService);
  const isLoggedIn = isAuthenticated();

  React.useEffect(() => {
    if (!open) setSelectedService(null);
  }, [open, setSelectedService]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] p-0 gap-0 border-none bg-background text-foreground overflow-hidden rounded-[1.5rem] shadow-2xl">
        <DialogDescription className="sr-only">
          {selectedService
            ? t("Service details and requirements")
            : t("Browse services offered by this office")}
        </DialogDescription>
        {!selectedService ? (
          // ── Service List View ──
          <>
            {/* Blue header */}
            <div className="relative bg-[#0047FF] px-8 py-10 flex items-center gap-5">
              {/* Logo */}
              <div className="size-20 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xl border border-white/10">
                {office.logo ? (
                  <img
                    src={getUploadUrl(office.logo)}
                    alt={office.name}
                    className="size-full object-contain p-2"
                  />
                ) : (
                  <Building2 className="size-10 text-[#0047FF]" />
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold text-white leading-tight">
                  {office.name}
                </DialogTitle>
                <p className="text-white/70 text-sm font-medium mt-1 italic opacity-80">
                  {office.slogan || "Excellence in Public Service"}
                </p>
              </div>

              {/* Close */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full text-white/60 hover:text-white transition-all"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Services Grid/List */}
            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4 bg-[#F8FAFC]">
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
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <Info className="size-16 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-bold text-lg">
                    {t("No services available for this office.")}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          // ── Service Detail View ──
          <ServiceDetailView
            service={selectedService}
            officeName={office.name}
            isLoggedIn={isLoggedIn}
            onBack={() => setSelectedService(null)}
            onClose={() => onOpenChange(false)}
            t={t}
          />
        )}
      </DialogContent>
    </Dialog>
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
  t: (k: string) => string;
}) {
  const applyUrl = isLoggedIn
    ? `/apply-service?serviceId=${service.id}`
    : `/signin?callbackUrl=${encodeURIComponent(`/apply-service?serviceId=${service.id}`)}`;

  return (
    <div
      onClick={onDetail}
      className="flex items-center gap-6 px-6 py-6 bg-white border border-slate-200/60 rounded-2xl hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-slate-900 leading-tight group-hover:text-[#0047FF] transition-colors">
          {service.name}
        </p>
        <p className="text-sm text-slate-400 mt-1 line-clamp-1 font-medium">
          {service.description}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Button
          asChild
          size="sm"
          className="rounded-xl px-6 h-10 font-bold bg-[#0047FF] hover:bg-[#0036C1] text-white shadow-lg shadow-blue-500/20 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <Link href={applyUrl}>{t("Apply Now")}</Link>
        </Button>
        <ChevronRight className="size-5 text-slate-300 group-hover:text-[#0047FF] group-hover:translate-x-1 transition-all" />
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
  onClose,
  t,
}: {
  service: HomepageServiceItem;
  officeName: string;
  isLoggedIn: boolean;
  onBack: () => void;
  onClose: () => void;
  t: (k: string) => string;
}) {
  const applyUrl = isLoggedIn
    ? `/apply-service?serviceId=${service.id}`
    : `/signin?callbackUrl=${encodeURIComponent(`/apply-service?serviceId=${service.id}`)}`;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Blue header */}
      <div className="relative bg-[#0047FF] px-8 py-8">
        <div className="flex items-start gap-4 pr-8">
          <button
            onClick={onBack}
            className="size-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all shrink-0 mt-0.5"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex-1">
            <DialogTitle className="text-lg font-bold text-white leading-tight">
              {service.name}
            </DialogTitle>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full text-white/60 hover:text-white transition-all"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
        {/* Main info card */}
        <div className="rounded-2xl bg-white border border-slate-200/60 p-6 shadow-sm space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
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
