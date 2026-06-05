"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  ArrowRight,
  Loader2,
  Info,
  Clock,
  MapPin,
  CheckCircle2,
  User,
  ArrowLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useOfficeStore, type Office } from "@/lib/stores/office-store";
import { useLanguagesStore } from "@/lib/stores/languages-store";
import { cn } from "@/lib/utils";
import { axiosInstance } from "@/lib/axios";

export function GovernmentOffices() {
  const { offices, fetchOffices, isLoading } = useOfficeStore();
  const { getTranslationForKey: t } = useLanguagesStore();
  const [selectedOffice, setSelectedOffice] = React.useState<Office | null>(null);
  const [isOfficeDialogOpen, setIsOfficeDialogOpen] = React.useState(false);

  React.useEffect(() => {
    void fetchOffices();
  }, [fetchOffices]);

  const handleOfficeClick = async (office: Office) => {
    try {
      const response = await axiosInstance.get(`/offices/${office.id}`) as any;
      setSelectedOffice(response.data.data);
      setIsOfficeDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch office details:", error);
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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Building2 className="size-8 text-primary" />
          {t("Government Office")} ({offices.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offices.map((office) => (
          <OfficeCard 
            key={office.id} 
            office={office} 
            onClick={() => handleOfficeClick(office)}
            t={t}
          />
        ))}
      </div>

      {selectedOffice && (
        <OfficeDetailsDialog
          office={selectedOffice}
          open={isOfficeDialogOpen}
          onOpenChange={setIsOfficeDialogOpen}
          t={t}
        />
      )}
    </section>
  );
}

function OfficeCard({ office, onClick, t }: { office: Office; onClick: () => void; t: any }) {
  return (
    <Card 
      className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border-primary/10 overflow-hidden flex flex-col h-full bg-[#111827] border-none text-white cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="p-6 pb-2">
        <div className="flex items-start gap-4">
          <div className="size-16 rounded-xl bg-white flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-blue-500/50 transition-all shrink-0 shadow-lg">
            {office.logo ? (
              <img src={office.logo} alt={office.name} className="size-full object-contain p-1" />
            ) : (
              <Building2 className="size-8 text-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
               <CardTitle className="text-lg font-bold leading-tight group-hover:text-blue-400 transition-colors line-clamp-2 pr-4 text-blue-100">
                {office.name}
              </CardTitle>
              <ChevronRight className="size-4 text-blue-500/50 group-hover:text-blue-400 transition-colors shrink-0" />
            </div>
            <div className="mt-2 text-xs text-blue-400/80 font-bold uppercase tracking-wider">
              {office._count?.service || 0} {t("services")}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="space-y-2 mb-6 flex-1">
          {office.service?.slice(0, 3).map((s) => (
            <div key={s.id} className="flex items-start gap-2 text-sm text-gray-400">
              <div className="size-1 rounded-full bg-blue-500/40 mt-2 shrink-0" />
              <span className="line-clamp-1">{s.name}</span>
            </div>
          ))}
          {office._count && office._count.service > 3 && (
            <div className="text-xs font-bold text-blue-400/50 pl-3">
              +{office._count.service - 3} {t("more")}
            </div>
          )}
          {(!office.service || office.service.length === 0) && (
            <p className="text-sm text-gray-500 italic">
              {t("No services listed yet.")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OfficeDetailsDialog({ office, open, onOpenChange, t }: { office: any; open: boolean; onOpenChange: (open: boolean) => void; t: any }) {
  const [selectedService, setSelectedService] = React.useState<any>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-[#0f172a] text-white">
        {!selectedService ? (
          <>
            <div className="bg-blue-600 p-8 flex items-center gap-6">
              <div className="size-20 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-2xl">
                {office.logo ? (
                  <img src={office.logo} alt={office.name} className="size-full object-contain p-2" />
                ) : (
                  <Building2 className="size-10 text-blue-600" />
                )}
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                  {office.name}
                </DialogTitle>
                {office.slogan && <p className="text-blue-100/80 font-medium italic">{office.slogan}</p>}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                onClick={() => onOpenChange(false)}
              >
                <X className="size-5" />
              </Button>
            </div>

            <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-4">
              {office.service?.map((service: any) => (
                <div 
                  key={service.id}
                  className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all cursor-pointer shadow-sm"
                  onClick={() => setSelectedService(service)}
                >
                  <div className="space-y-2 flex-1">
                    <h4 className="text-lg font-bold group-hover:text-blue-400 transition-colors leading-tight">
                      {service.name}
                    </h4>
                    <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button className="rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 px-6">
                      {t("Apply Now")}
                    </Button>
                    <ChevronRight className="size-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
              ))}
              {(!office.service || office.service.length === 0) && (
                <div className="text-center py-12 space-y-4">
                   <Info className="size-12 text-gray-600 mx-auto" />
                   <p className="text-gray-400 font-medium">{t("No services available for this office yet.")}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <ServiceDetails 
            service={selectedService} 
            officeName={office.name}
            onBack={() => setSelectedService(null)} 
            t={t} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ServiceDetails({ service, officeName, onBack, t }: { service: any; officeName: string; onBack: () => void; t: any }) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-blue-600 p-8 space-y-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-blue-100 hover:text-white font-bold transition-colors mb-2"
        >
          <ArrowLeft className="size-5" />
          {t("Back to Services")}
        </button>
        <DialogTitle className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
          {service.name}
        </DialogTitle>
      </div>

      <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8">
        {/* Main Info Card */}
        <div className="rounded-3xl bg-white/5 border border-white/5 p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Building2 className="size-32" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{t("Description")}</span>
                <p className="text-gray-300 leading-relaxed font-medium">{service.description}</p>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                    <Clock className="size-3" /> {t("Time to take")}
                  </span>
                  <p className="text-sm font-bold text-white">{service.timeToTake}</p>
                </div>
                {service.roomNumber && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                      <MapPin className="size-3" /> {t("Room")}
                    </span>
                    <p className="text-sm font-bold text-white">{service.roomNumber}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                    <Building2 className="size-3" /> {t("Office")}
                  </span>
                  <p className="text-sm font-bold text-white">{officeName}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <Button size="lg" className="w-full h-14 rounded-2xl font-black text-lg bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/20" asChild>
                <Link href="/signin">{t("Apply Now")}</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Requirements */}
        {service.requirements && service.requirements.length > 0 && (
          <div className="space-y-4">
            <h5 className="text-lg font-black tracking-tight flex items-center gap-2">
              <div className="size-2 rounded-full bg-blue-500" />
              {t("Requirements")}
            </h5>
            <div className="rounded-3xl bg-white/5 border border-white/5 p-8 grid gap-4">
              {service.requirements.map((req: any) => (
                <div key={req.id} className="flex items-start gap-4 group">
                  <div className="size-6 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600/40 transition-colors">
                    <CheckCircle2 className="size-3.5 text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-200">{req.name}</p>
                    {req.description && <p className="text-xs text-gray-500 leading-relaxed">{req.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Service For */}
        {service.serviceFors && service.serviceFors.length > 0 && (
          <div className="space-y-4 pb-8">
            <h5 className="text-lg font-black tracking-tight flex items-center gap-2">
              <div className="size-2 rounded-full bg-blue-500" />
              {t("This Service Is For")}
            </h5>
            <div className="rounded-3xl bg-white/5 border border-white/5 p-8 grid gap-4">
              {service.serviceFors.map((item: any) => (
                <div key={item.id} className="flex items-start gap-4 group">
                  <div className="size-6 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600/40 transition-colors">
                    <User className="size-3.5 text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-200">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
