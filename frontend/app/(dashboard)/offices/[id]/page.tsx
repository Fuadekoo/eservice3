"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  Users,
  FileText,
  Shield,
  MapPin,
  Phone,
  Globe,
  Calendar,
  ArrowLeft,
  Edit,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Info,
  Plus,
  LayoutDashboard,
  Clock,
  ChevronRight,
} from "lucide-react";

import { useOfficeStore } from "@/lib/stores/office-store";
import { useTranslation } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfficeStaffTab } from "@/components/dashboard/office-staff-tab";
import { OfficeAccessTab } from "@/components/dashboard/office-access-tab";
import { ServiceCreateDialog } from "@/components/dashboard/service-create-dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type TabValue = "overview" | "staff" | "services" | "security";

export default function OfficeDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { currentOffice, isLoading, getOffice, error } = useOfficeStore();
  const [activeTab, setActiveTab] = React.useState<TabValue>("overview");
  const [isServiceCreateOpen, setIsServiceCreateOpen] = React.useState(false);

  React.useEffect(() => {
    if (id) {
      getOffice(id as string);
    }
  }, [id, getOffice]);

  if (isLoading) {
    return (
      <div className="flex h-100 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {t("Loading office details...")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !currentOffice) {
    return (
      <div className="flex h-100 flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Info className="h-6 w-6" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">{t("Office not found")}</h2>
          <p className="text-sm text-muted-foreground">
            {error || t("The office you are looking for does not exist.")}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("Go Back")}
        </Button>
      </div>
    );
  }

  const tabs: { value: TabValue; label: string; icon: React.ElementType; badge?: number }[] = [
    { value: "overview", label: t("Overview"), icon: LayoutDashboard },
    {
      value: "staff",
      label: t("Staff"),
      icon: Users,
      badge: currentOffice._count?.staffs,
    },
    {
      value: "services",
      label: t("Services"),
      icon: FileText,
      badge: currentOffice._count?.service,
    },
    { value: "security", label: t("Access"), icon: Shield },
  ];

  const stats = [
    {
      label: t("Total Staff"),
      value: currentOffice._count?.staffs || 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: t("Services"),
      value: currentOffice._count?.service || 0,
      icon: FileText,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: t("Requests"),
      value: currentOffice._count?.requests || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: t("Appointments"),
      value: currentOffice._count?.appointments || 0,
      icon: Calendar,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="border-b border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="px-6 lg:px-8 pt-6 pb-0">

          {/* Title row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
            {/* Left: back + logo + meta */}
            <div className="flex items-start gap-4 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="shrink-0 mt-0.5 h-9 w-9"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              {/* Office logo */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                {currentOffice.logo ? (
                  <img
                    src={currentOffice.logo}
                    alt={currentOffice.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/5">
                    <Building2 className="h-7 w-7 text-primary/40" />
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl truncate">
                    {currentOffice.name}
                  </h1>
                  <Badge
                    variant={currentOffice.status ? "default" : "secondary"}
                    className={cn(
                      "h-5 px-2 text-[10px] font-bold uppercase tracking-wider shrink-0",
                      currentOffice.status && "bg-emerald-500 hover:bg-emerald-600",
                    )}
                  >
                    {currentOffice.status ? t("Active") : t("Inactive")}
                  </Badge>
                </div>
                {currentOffice.slogan && (
                  <p className="mt-0.5 text-sm text-muted-foreground italic line-clamp-1">
                    {currentOffice.slogan}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  {currentOffice.address && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {currentOffice.address}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    {currentOffice.subdomain}.gov.et
                  </span>
                </div>
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-2.5 shrink-0 sm:self-start">
              <Button variant="outline" size="sm" className="h-9 px-4">
                <Edit className="mr-2 h-4 w-4" />
                {t("Edit")}
              </Button>
              <Button
                size="sm"
                className="h-9 px-4 bg-primary shadow-md shadow-primary/20"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("View Portal")}
              </Button>
            </div>
          </div>

          {/* ── Tab bar ─────────────────────────────────── */}
          <div
            className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px"
            role="tablist"
            aria-label="Office navigation"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "relative flex items-center gap-2 shrink-0 px-4 py-3 text-sm font-medium transition-all duration-150 border-b-2 whitespace-nowrap",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={cn(
                        "inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold",
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Page Body ───────────────────────────────────── */}
      <div className="flex-1 px-6 lg:px-8 py-6">
        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, i) => (
                <Card
                  key={i}
                  className="overflow-hidden border-none shadow-sm ring-1 ring-border/50 bg-card/50"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className={cn("rounded-xl p-2.5 shadow-inner", stat.bg)}>
                        <stat.icon className={cn("h-5 w-5", stat.color)} />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-0.5">
                          {stat.label}
                        </p>
                        <p className="text-3xl font-black tabular-nums">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Info grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-sm ring-1 ring-border/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg font-bold">
                        {t("Office Description")}
                      </CardTitle>
                    </div>
                    <CardDescription>
                      {t("The official purpose and mission of this government entity.")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {currentOffice.description ||
                        t("No detailed description available for this office.")}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="border-none shadow-sm ring-1 ring-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold">
                        {t("Contact Details")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/5 p-2">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("Phone")}
                          </p>
                          <p className="text-sm font-semibold">
                            {currentOffice.phoneNumber || t("N/A")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/5 p-2">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("Domain")}
                          </p>
                          <p className="text-sm font-semibold">
                            {currentOffice.subdomain}.gov.et
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm ring-1 ring-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold">
                        {t("Location Info")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/5 p-2">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("Address")}
                          </p>
                          <p className="text-sm font-semibold">
                            {currentOffice.address || t("N/A")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/5 p-2">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("Room/Unit")}
                          </p>
                          <p className="text-sm font-semibold">
                            {currentOffice.roomNumber || t("N/A")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-sm ring-1 ring-border/50 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold">
                      {t("Operations")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {t("Started Date")}
                        </span>
                      </div>
                      <span className="text-sm font-bold">
                        {currentOffice.startedAt
                          ? format(new Date(currentOffice.startedAt), "MMM dd, yyyy")
                          : t("N/A")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {t("System Status")}
                        </span>
                      </div>
                      <Badge
                        variant={currentOffice.status ? "default" : "secondary"}
                        className="rounded-full text-xs"
                      >
                        {currentOffice.status ? t("Online") : t("Offline")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <div className="rounded-2xl bg-linear-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg">
                  <h3 className="text-base font-bold mb-1">{t("Quick Actions")}</h3>
                  <p className="text-xs text-primary-foreground/80 mb-4">
                    {t("Perform administrative tasks for this office.")}
                  </p>
                  <div className="grid gap-2.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start font-semibold"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("New Staff Member")}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start font-semibold"
                      onClick={() => setIsServiceCreateOpen(true)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {t("Configure Services")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Staff */}
        {activeTab === "staff" && (
          <OfficeStaffTab officeId={currentOffice.id} />
        )}

        {/* Services */}
        {activeTab === "services" && (
          <Card className="border-none shadow-sm ring-1 ring-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg font-bold">
                  {t("Service Catalog")}
                </CardTitle>
                <CardDescription>
                  {t("All public services provided by this office.")}
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="shadow-md"
                onClick={() => setIsServiceCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("Add Service")}
              </Button>
            </CardHeader>
            <CardContent>
              {currentOffice.service && currentOffice.service.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {currentOffice.service.map((service) => (
                    <div
                      key={service.id}
                      className="group flex flex-col justify-between gap-4 p-5 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer shadow-sm"
                    >
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold group-hover:text-primary transition-colors leading-tight">
                          {service.name}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {service.description || t("No description provided.")}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className="bg-background/50 font-medium"
                        >
                          <Clock className="mr-1 h-3 w-3" />
                          {service.timeToTake || t("N/A")}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-bold hover:text-primary"
                        >
                          {t("Details")}
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-90 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30">
                  <div className="rounded-full bg-background p-4 shadow-sm mb-4">
                    <FileText className="h-9 w-9 text-primary/40" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    {t("No services configured")}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs text-center mt-1">
                    {t("Start by adding the first service this office provides to citizens.")}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6 border-primary/20 hover:bg-primary/5"
                    onClick={() => setIsServiceCreateOpen(true)}
                  >
                    {t("Create First Service")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Access */}
        {activeTab === "security" && (
          <OfficeAccessTab officeId={currentOffice.id} />
        )}
      </div>

      <ServiceCreateDialog
        open={isServiceCreateOpen}
        onOpenChange={setIsServiceCreateOpen}
        defaultOfficeId={currentOffice.id}
      />
    </div>
  );
}
