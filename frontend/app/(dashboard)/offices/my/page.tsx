"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Layers,
  Loader2,
  MapPin,
  Phone,
  Settings,
  TrendingUp,
  Users,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useOfficeStore, type Office } from "@/lib/stores/office-store";
import {
  useMyOfficeStore,
  resolveMainOfficeId,
} from "@/lib/stores/my-office-store";
import { axiosInstance, getUploadUrl } from "@/lib/axios";
import { useTranslation } from "@/lib/i18n";
import { PageLayout } from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type RequestSummary = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  recent: Array<{
    id: string;
    statusbystaff: string;
    statusbyadmin: string;
    createdAt: string;
    service?: { name: string };
    user?: { username: string };
  }>;
};

function getRequestStatus(
  staffStatus: string,
  adminStatus: string,
): "pending" | "approved" | "rejected" {
  if (staffStatus === "rejected" || adminStatus === "rejected") {
    return "rejected";
  }
  if (staffStatus === "approved" && adminStatus === "approved") {
    return "approved";
  }
  return "pending";
}

export default function MyOfficePage() {
  const { t } = useTranslation();
  const { data: sessionData, isPending: isSessionPending } = useSession();
  const session = sessionData?.session;
  const sessionOfficeId =
    session?.officeId || session?.user?.officeId || session?.office?.id;

  const { mainOfficeId, setMainOfficeId } = useMyOfficeStore();
  const { offices, fetchOffices, currentOffice, getOffice, isLoading } =
    useOfficeStore();

  const [requestSummary, setRequestSummary] =
    React.useState<RequestSummary | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = React.useState(false);

  const activeOfficeId = resolveMainOfficeId(sessionOfficeId, mainOfficeId);
  const hasSessionOffice = Boolean(sessionOfficeId);
  const office = currentOffice;

  React.useEffect(() => {
    void fetchOffices();
  }, [fetchOffices]);

  React.useEffect(() => {
    if (!activeOfficeId) return;
    void getOffice(activeOfficeId);
  }, [activeOfficeId, getOffice]);

  React.useEffect(() => {
    if (!activeOfficeId) {
      setRequestSummary(null);
      return;
    }

    const loadAnalytics = async () => {
      setLoadingAnalytics(true);
      try {
        const response = (await axiosInstance.get(
          `/requests?officeId=${activeOfficeId}&page=1&pageSize=100`,
        )) as unknown as {
          data: RequestSummary["recent"];
          pagination?: { total: number };
        };

        const requests = response.data ?? [];
        let pending = 0;
        let approved = 0;
        let rejected = 0;

        for (const request of requests) {
          const status = getRequestStatus(
            request.statusbystaff,
            request.statusbyadmin,
          );
          if (status === "pending") pending += 1;
          if (status === "approved") approved += 1;
          if (status === "rejected") rejected += 1;
        }

        setRequestSummary({
          total: response.pagination?.total ?? requests.length,
          pending,
          approved,
          rejected,
          recent: requests.slice(0, 5),
        });
      } catch {
        setRequestSummary(null);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    void loadAnalytics();
  }, [activeOfficeId]);

  const handleOfficeChange = (officeId: string) => {
    setMainOfficeId(officeId);
  };

  if (isSessionPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeOfficeId) {
    return (
      <PageLayout
        title={t("My Office")}
        description={t(
          "Select your main office to view details and performance analytics.",
        )}
        icon={Briefcase}
      >
        <Card className="max-w-2xl mx-auto border-dashed">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="size-8 text-primary" />
            </div>
            <CardTitle>{t("Choose Your Main Office")}</CardTitle>
            <CardDescription>
              {t(
                "As an administrator, assign yourself a primary office to monitor its services, staff, and requests.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {offices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="font-medium">{t("No offices available yet.")}</p>
                <Button className="mt-4 rounded-xl" asChild>
                  <Link href="/offices">{t("Create an Office")}</Link>
                </Button>
              </div>
            ) : (
              <>
                <Select onValueChange={handleOfficeChange}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder={t("Select an office")} />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground text-center">
                  {t(
                    "Your selection is saved on this device and used for My Office analytics.",
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  if (isLoading && !office) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!office || office.id !== activeOfficeId) {
    return (
      <PageLayout title={t("My Office")} icon={Briefcase}>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
          <AlertCircle className="size-12 opacity-40" />
          <p>{t("Unable to load office details.")}</p>
          {!hasSessionOffice && (
            <Button variant="outline" onClick={() => setMainOfficeId(null)}>
              {t("Choose another office")}
            </Button>
          )}
        </div>
      </PageLayout>
    );
  }

  const stats = [
    {
      label: t("Services"),
      value: office._count?.service ?? 0,
      icon: Layers,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: t("Staff"),
      value: office._count?.staffs ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: t("Requests"),
      value: requestSummary?.total ?? office._count?.requests ?? 0,
      icon: FileText,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: t("Appointments"),
      value: office._count?.appointments ?? 0,
      icon: Calendar,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  return (
    <PageLayout
      title={t("My Office")}
      description={t("Overview and analytics for your assigned office.")}
      icon={Briefcase}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {!hasSessionOffice && offices.length > 1 && (
            <Select value={activeOfficeId} onValueChange={handleOfficeChange}>
              <SelectTrigger className="h-10 w-[220px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {offices.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href={`/offices/${office.id}`}>
              <ExternalLink className="mr-2 size-4" />
              {t("Full Details")}
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="overflow-hidden border-none shadow-sm ring-1 ring-border/50">
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-72 shrink-0 bg-muted/30 p-6 flex flex-col items-center text-center border-b lg:border-b-0 lg:border-r border-border/50">
                <div className="size-24 rounded-2xl bg-background border border-border shadow-sm overflow-hidden mb-4">
                  {office.logo ? (
                    <img
                      src={getUploadUrl(office.logo)}
                      alt={office.name}
                      className="size-full object-contain p-2"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center">
                      <Building2 className="size-10 text-primary/40" />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-black leading-tight">{office.name}</h2>
                {office.slogan && (
                  <p className="text-sm text-muted-foreground italic mt-1">
                    {office.slogan}
                  </p>
                )}
                <Badge
                  className={cn(
                    "mt-3",
                    office.status
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {office.status ? t("Active") : t("Inactive")}
                </Badge>
              </div>

              <div className="flex-1 p-6 grid sm:grid-cols-2 gap-4">
                <InfoItem
                  icon={MapPin}
                  label={t("Address")}
                  value={office.address || t("N/A")}
                />
                <InfoItem
                  icon={Layers}
                  label={t("Room")}
                  value={office.roomNumber || t("N/A")}
                />
                <InfoItem
                  icon={Phone}
                  label={t("Phone")}
                  value={office.phoneNumber || t("N/A")}
                />
                <InfoItem
                  icon={Clock}
                  label={t("Started")}
                  value={format(
                    new Date(office.startedAt || office.createdAt),
                    "MMM d, yyyy",
                  )}
                />
                {office.description && (
                  <div className="sm:col-span-2 pt-2 border-t border-border/50">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      {t("Description")}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {office.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="border-none shadow-sm ring-1 ring-border/50"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={cn("rounded-xl p-2.5", stat.bg)}>
                    <stat.icon className={cn("size-5", stat.color)} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-none shadow-sm ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" />
                {t("Request Analytics")}
              </CardTitle>
              <CardDescription>
                {t("Service request breakdown for this office.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAnalytics ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : requestSummary ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <AnalyticsPill
                      icon={Clock}
                      label={t("Pending")}
                      value={requestSummary.pending}
                      className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                    />
                    <AnalyticsPill
                      icon={CheckCircle2}
                      label={t("Approved")}
                      value={requestSummary.approved}
                      className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                    />
                    <AnalyticsPill
                      icon={XCircle}
                      label={t("Rejected")}
                      value={requestSummary.rejected}
                      className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    />
                  </div>

                  {requestSummary.recent.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-muted-foreground">
                        {t("Recent Requests")}
                      </p>
                      {requestSummary.recent.map((request) => {
                        const status = getRequestStatus(
                          request.statusbystaff,
                          request.statusbyadmin,
                        );
                        return (
                          <div
                            key={request.id}
                            className="flex items-center justify-between gap-4 rounded-xl border border-border/60 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {request.service?.name || t("Service request")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {request.user?.username || t("Customer")} ·{" "}
                                {format(new Date(request.createdAt), "MMM d, yyyy")}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "capitalize shrink-0",
                                status === "approved" &&
                                  "border-emerald-200 text-emerald-700",
                                status === "pending" &&
                                  "border-amber-200 text-amber-700",
                                status === "rejected" &&
                                  "border-red-200 text-red-700",
                              )}
                            >
                              {t(status)}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      {t("No requests yet for this office.")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t("Analytics unavailable.")}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm ring-1 ring-border/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">{t("Quick Actions")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button variant="secondary" className="justify-start rounded-xl" asChild>
                  <Link href={`/offices/${office.id}`}>
                    <Building2 className="mr-2 size-4" />
                    {t("Manage Office")}
                  </Link>
                </Button>
                <Button variant="secondary" className="justify-start rounded-xl" asChild>
                  <Link href="/services">
                    <Layers className="mr-2 size-4" />
                    {t("Services")}
                  </Link>
                </Button>
                <Button variant="secondary" className="justify-start rounded-xl" asChild>
                  <Link href="/staff">
                    <Users className="mr-2 size-4" />
                    {t("Staff")}
                  </Link>
                </Button>
                <Button variant="secondary" className="justify-start rounded-xl" asChild>
                  <Link href="/requests">
                    <FileText className="mr-2 size-4" />
                    {t("Requests")}
                  </Link>
                </Button>
                <Button variant="secondary" className="justify-start rounded-xl" asChild>
                  <Link href="/configuration">
                    <Settings className="mr-2 size-4" />
                    {t("Configuration")}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {office.service && office.service.length > 0 && (
              <Card className="border-none shadow-sm ring-1 ring-border/50">
                <CardHeader>
                  <CardTitle className="text-base">{t("Top Services")}</CardTitle>
                  <CardDescription>
                    {t("Services offered by this office.")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {office.service.slice(0, 5).map((service) => (
                    <div
                      key={service.id}
                      className="rounded-lg border border-border/50 px-3 py-2 text-sm font-medium"
                    >
                      {service.name}
                    </div>
                  ))}
                  {(office._count?.service ?? 0) > 5 && (
                    <Button variant="link" className="px-0" asChild>
                      <Link href={`/offices/${office.id}`}>
                        {t("View all services")}
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-primary/5 p-2 shrink-0">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold break-words">{value}</p>
      </div>
    </div>
  );
}

function AnalyticsPill({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl p-4 text-center", className)}>
      <Icon className="size-5 mx-auto mb-2 opacity-80" />
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide opacity-80">
        {label}
      </p>
    </div>
  );
}
