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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useOfficeStore, type Office } from "@/lib/stores/office-store";
import { useLanguagesStore } from "@/lib/stores/languages-store";
import { axiosInstance } from "@/lib/axios";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type ServiceItem = {
  id: string;
  name: string;
  description: string;
  timeToTake: string;
  roomNumber?: string | null;
  requirements?: { id: string; name: string; description?: string | null }[];
  serviceFors?: { id: string; name: string; description?: string | null }[];
};

type OfficeDetail = Office & {
  service?: ServiceItem[];
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function GovernmentOffices() {
  const { offices, fetchOffices, isLoading } = useOfficeStore();
  const { getTranslationForKey: t } = useLanguagesStore();
  const [selectedOffice, setSelectedOffice] = React.useState<OfficeDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(false);

  React.useEffect(() => {
    void fetchOffices();
  }, [fetchOffices]);

  const handleOfficeClick = async (office: Office) => {
    setIsFetching(true);
    try {
      // Interceptor unwraps one level → response = { data: office, ... }
      const response = (await axiosInstance.get(`/offices/${office.id}`)) as unknown as {
        data: OfficeDetail;
      };
      setSelectedOffice(response.data);
      setIsDialogOpen(true);
    } catch {
      // Fallback: open with the basic office data we already have
      setSelectedOffice(office as OfficeDetail);
      setIsDialogOpen(true);
    } finally {
      setIsFetching(false);
    }
  };

  if (isLoading && offices.length === 0) {
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
          <span className="text-primary/70 text-xl font-bold">({offices.length})</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offices.map((office) => (
          <OfficeCard
            key={office.id}
            office={office}
            onClick={() => handleOfficeClick(office)}
            isLoading={isFetching}
            t={t}
          />
        ))}
        {offices.length === 0 && (
          <div className="col-span-full py-20 text-center rounded-3xl border-2 border-dashed border-white/10">
            <Building2 className="size-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 font-medium">{t("No offices found.")}</p>
          </div>
        )}
      </div>

      {selectedOffice && (
        <OfficeDialog
          office={selectedOffice}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
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
      className="group text-left w-full rounded-2xl bg-[#0f1629] border border-white/5 hover:border-blue-500/40 hover:bg-[#111d3a] transition-all duration-300 overflow-hidden shadow-lg hover:shadow-blue-500/10 hover:shadow-xl"
    >
      {/* Card Header */}
      <div className="p-6 flex items-start gap-4">
        {/* Logo */}
        <div className="size-16 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-md group-hover:shadow-blue-500/20 transition-shadow">
          {office.logo ? (
            <img src={office.logo} alt={office.name} className="size-full object-contain p-1.5" />
          ) : (
            <Building2 className="size-8 text-blue-600" />
          )}
        </div>

        {/* Name + count */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-blue-100 group-hover:text-blue-300 transition-colors leading-snug line-clamp-2">
            {office.name}
          </h3>
          <p className="mt-1.5 text-xs font-bold text-blue-400/70 uppercase tracking-wider">
            {office._count?.service ?? 0} {t("services")}
          </p>
        </div>

        <ChevronRight className="size-5 text-white/20 group-hover:text-blue-400 transition-colors shrink-0 mt-0.5" />
      </div>

      {/* Service list preview */}
      <div className="px-6 pb-6 space-y-2">
        {office.service?.slice(0, 3).map((s) => (
          <div key={s.id} className="flex items-center gap-2.5 text-sm text-gray-400">
            <span className="size-1.5 rounded-full bg-blue-500/50 shrink-0" />
            <span className="line-clamp-1">{s.name}</span>
          </div>
        ))}
        {(office._count?.service ?? 0) > 3 && (
          <p className="text-xs text-blue-400/50 font-bold pl-4">
            +{(office._count?.service ?? 0) - 3} {t("more")}
          </p>
        )}
        {(!office.service || office.service.length === 0) && (
          <p className="text-xs text-gray-500 italic">{t("No services listed.")}</p>
        )}
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
  office: OfficeDetail;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  t: (k: string) => string;
}) {
  const [selectedService, setSelectedService] = React.useState<ServiceItem | null>(null);

  // Reset selected service when dialog closes
  React.useEffect(() => {
    if (!open) setSelectedService(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 border-none bg-[#0d1117] text-white overflow-hidden rounded-2xl">
        {!selectedService ? (
          // ── Service List View ──
          <>
            {/* Blue header */}
            <div className="relative bg-blue-600 px-8 py-7 flex items-center gap-5">
              {/* Logo */}
              <div className="size-[72px] rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xl">
                {office.logo ? (
                  <img src={office.logo} alt={office.name} className="size-full object-contain p-2" />
                ) : (
                  <Building2 className="size-9 text-blue-600" />
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-black text-white leading-tight">
                  {office.name}
                </DialogTitle>
                {office.slogan && (
                  <p className="text-blue-100/70 text-sm font-medium mt-0.5 italic">{office.slogan}</p>
                )}
              </div>

              {/* Close */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/15 transition-all"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Services */}
            <div className="max-h-[65vh] overflow-y-auto divide-y divide-white/5">
              {office.service && office.service.length > 0 ? (
                office.service.map((service) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    onDetail={() => setSelectedService(service)}
                    t={t}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <Info className="size-10 text-white/20 mb-3" />
                  <p className="text-white/50 font-medium">{t("No services available for this office.")}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          // ── Service Detail View ──
          <ServiceDetailView
            service={selectedService}
            officeName={office.name}
            officeLogo={office.logo}
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
  onDetail,
  t,
}: {
  service: ServiceItem;
  onDetail: () => void;
  t: (k: string) => string;
}) {
  return (
    <div className="flex items-center gap-4 px-7 py-5 hover:bg-white/[0.04] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white leading-snug">{service.name}</p>
        <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{service.description}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          asChild
          size="sm"
          className="rounded-full px-5 h-9 font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <Link href="/signin">{t("Apply Now")}</Link>
        </Button>
        <button
          type="button"
          onClick={onDetail}
          className="size-9 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-all"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Service Detail View ──────────────────────────────────────────────────────
function ServiceDetailView({
  service,
  officeName,
  officeLogo,
  onBack,
  onClose,
  t,
}: {
  service: ServiceItem;
  officeName: string;
  officeLogo?: string | null;
  onBack: () => void;
  onClose: () => void;
  t: (k: string) => string;
}) {
  return (
    <div className="flex flex-col">
      {/* Blue header */}
      <div className="relative bg-blue-600 px-8 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-100 hover:text-white font-semibold text-sm transition-colors mb-3"
        >
          <ArrowLeft className="size-4" />
          {t("Back to Services")}
        </button>
        <DialogTitle className="text-xl font-black text-white leading-snug">
          {service.name}
        </DialogTitle>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/15 transition-all"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[65vh] overflow-y-auto p-6 space-y-4">
        {/* Main service card */}
        <div className="rounded-2xl bg-[#161b27] border border-white/5 p-5">
          {/* Icon + name + office */}
          <div className="flex items-start gap-4 mb-5">
            <div className="size-12 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
              <FileText className="size-6 text-blue-400" />
            </div>
            <div>
              <p className="font-black text-white text-base leading-tight">{service.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 className="size-3.5 text-blue-400/70 shrink-0" />
                <p className="text-sm text-blue-300/70 font-medium">{officeName}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1.5">
              {t("Description")}
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">{service.description}</p>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-5 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t("Time to take")}</p>
                <p className="font-bold text-white">{service.timeToTake}</p>
              </div>
            </div>
            {service.roomNumber && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">{t("Room")}</p>
                  <p className="font-bold text-white">{service.roomNumber}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="size-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{t("Office")}</p>
                <p className="font-bold text-white line-clamp-1 max-w-36">{officeName}</p>
              </div>
            </div>
          </div>

          {/* Apply button */}
          <Button
            asChild
            className="w-full h-11 rounded-xl font-black bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
          >
            <Link href="/signin">{t("Apply Now")}</Link>
          </Button>
        </div>

        {/* Requirements */}
        {service.requirements && service.requirements.length > 0 && (
          <div className="rounded-2xl bg-[#161b27] border border-white/5 p-5">
            <p className="font-bold text-white mb-4">{t("Requirements")}</p>
            <ul className="space-y-3">
              {service.requirements.map((req) => (
                <li key={req.id} className="flex items-start gap-3">
                  <span className="size-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-200">{req.name}</p>
                    {req.description && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{req.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Service For */}
        {service.serviceFors && service.serviceFors.length > 0 && (
          <div className="rounded-2xl bg-[#161b27] border border-white/5 p-5">
            <p className="font-bold text-white mb-4">{t("This Service is For")}</p>
            <ul className="space-y-3">
              {service.serviceFors.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="size-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-200">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
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
