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
  XCircle,
  Loader2,
  Info,
  Plus,
  LayoutDashboard,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useOfficeStore } from "@/lib/stores/office-store";
import { useTranslation } from "@/lib/i18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function OfficeDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { currentOffice, isLoading, getOffice, error } = useOfficeStore();
  const [isServiceCreateOpen, setIsServiceCreateOpen] = React.useState(false);

  React.useEffect(() => {
    if (id) {
      getOffice(id as string);
    }
  }, [id, getOffice]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
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
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
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
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0 lg:mt-1 self-start sm:self-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col items-center sm:items-start gap-4 sm:flex-row sm:gap-6 text-center sm:text-left">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-border bg-muted shadow-sm sm:h-24 sm:w-24">
              {currentOffice.logo ? (
                <img
                  src={currentOffice.logo}
                  alt={currentOffice.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/5">
                  <Building2 className="h-10 w-10 text-primary/40" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {currentOffice.name}
                </h1>
                <Badge
                  variant={currentOffice.status ? "default" : "secondary"}
                  className={cn(
                    "h-6 px-3 text-[10px] font-bold uppercase tracking-wider",
                    currentOffice.status &&
                      "bg-emerald-500 hover:bg-emerald-600",
                  )}
                >
                  {currentOffice.status ? t("Active") : t("Inactive")}
                </Badge>
              </div>
              <p className="text-base sm:text-lg font-medium text-muted-foreground/80 italic">
                {currentOffice.slogan || t("Government Excellence")}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{currentOffice.address || t("No address")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>{currentOffice.subdomain}.gov.et</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center sm:justify-end gap-3 lg:self-center">
          <Button variant="outline" className="h-10 px-4">
            <Edit className="mr-2 h-4 w-4" />
            {t("Edit")}
          </Button>
          <Button className="h-10 px-6 bg-primary shadow-lg shadow-primary/20">
            <ExternalLink className="mr-2 h-4 w-4" />
            {t("View Portal")}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="overflow-hidden border-none shadow-sm ring-1 ring-border/50 bg-card/50 backdrop-blur-sm"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={cn("rounded-2xl p-3 shadow-inner", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">
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

      {/* Tabs Content */}
      <Tabs defaultValue="overview" className="space-y-8">
        <div className="sticky top-0 z-10 -mx-6 bg-background/80 px-6 py-4 backdrop-blur-md lg:-mx-8 lg:px-8">
          <TabsList className="inline-flex h-12 w-full justify-start gap-2 rounded-xl bg-muted/50 p-1.5 sm:w-auto">
            <TabsTrigger
              value="overview"
              className="rounded-lg px-6 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t("Overview")}
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              className="rounded-lg px-6 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md"
            >
              <Users className="mr-2 h-4 w-4" />
              {t("Staff")}
            </TabsTrigger>
            <TabsTrigger
              value="services"
              className="rounded-lg px-6 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md"
            >
              <FileText className="mr-2 h-4 w-4" />
              {t("Services")}
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-lg px-6 text-sm font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md"
            >
              <Shield className="mr-2 h-4 w-4" />
              {t("Access")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="overview"
          className="mt-0 focus-visible:outline-none"
        >
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <Card className="border-none shadow-sm ring-1 ring-border/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl font-bold">
                      {t("Office Description")}
                    </CardTitle>
                  </div>
                  <CardDescription>
                    {t(
                      "The official purpose and mission of this government entity.",
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {currentOffice.description ||
                        t("No detailed description available for this office.")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 sm:grid-cols-2">
                <Card className="border-none shadow-sm ring-1 ring-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">
                      {t("Contact Details")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">
                      {t("Location Info")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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

            <div className="space-y-8">
              <Card className="border-none shadow-sm ring-1 ring-border/50 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">
                    {t("Operations")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {t("Started Date")}
                      </span>
                    </div>
                    <span className="text-sm font-bold">
                      {currentOffice.startedAt
                        ? format(
                            new Date(currentOffice.startedAt),
                            "MMM dd, yyyy",
                          )
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
                      className="rounded-full"
                    >
                      {currentOffice.status ? t("Online") : t("Offline")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-xl">
                <h3 className="text-lg font-bold mb-2">{t("Quick Actions")}</h3>
                <p className="text-sm text-primary-foreground/80 mb-6">
                  {t("Perform administrative tasks for this office.")}
                </p>
                <div className="grid gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start font-bold"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("New Staff Member")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start font-bold"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {t("Configure Services")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="mt-0 focus-visible:outline-none">
          <OfficeStaffTab officeId={currentOffice.id} />
        </TabsContent>

        <TabsContent
          value="services"
          className="mt-0 focus-visible:outline-none"
        >
          <Card className="border-none shadow-sm ring-1 ring-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xl font-bold">
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
                        <h4 className="text-base font-bold group-hover:text-primary transition-colors leading-tight">
                          {service.name}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {service.description || t("No description provided.")}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
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
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30">
                  <div className="rounded-full bg-background p-4 shadow-sm mb-4">
                    <FileText className="h-10 w-10 text-primary/40" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    {t("No services configured")}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs text-center mt-1">
                    {t(
                      "Start by adding the first service this office provides to citizens.",
                    )}
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
        </TabsContent>

        <TabsContent
          value="security"
          className="mt-0 focus-visible:outline-none"
        >
          <OfficeAccessTab officeId={currentOffice.id} />
        </TabsContent>
      </Tabs>

      <ServiceCreateDialog
        open={isServiceCreateOpen}
        onOpenChange={setIsServiceCreateOpen}
        defaultOfficeId={currentOffice.id}
      />
    </div>
  );
}
