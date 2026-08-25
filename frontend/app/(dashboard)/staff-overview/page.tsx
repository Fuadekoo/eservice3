"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  User,
  XCircle,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageLayout } from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import {
  useRequestStore,
  type ServiceRequest,
} from "@/lib/stores/request-store";
import { OVERVIEW_ROLES } from "@/lib/role-overview";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

type RequestStatus = "pending" | "processing" | "approved" | "rejected";

function getRequestStatus(request: ServiceRequest): RequestStatus {
  if (
    request.statusbystaff === "rejected" ||
    request.statusbyadmin === "rejected"
  ) {
    return "rejected";
  }

  if (
    request.statusbystaff === "approved" &&
    request.statusbyadmin === "approved"
  ) {
    return "approved";
  }

  if (request.statusbystaff === "approved") {
    return "processing";
  }

  return "pending";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function displayName(user?: { username?: string; phoneNumber?: string }) {
  return user?.username || user?.phoneNumber || "Customer";
}

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; badge: string; dot: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    dot: "bg-amber-500",
    icon: Clock,
  },
  processing: {
    label: "Manager Review",
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    dot: "bg-blue-500",
    icon: Activity,
  },
  approved: {
    label: "Approved",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    badge: "bg-red-500/10 text-red-600 border-red-500/20",
    dot: "bg-red-500",
    icon: XCircle,
  },
};

export default function StaffOverviewPage() {
  return (
    <ProtectedRoute
      allowedRoles={OVERVIEW_ROLES.staff}
      redirectTo="/dashboard"
      showError={false}
    >
      <StaffOverviewContent />
    </ProtectedRoute>
  );
}

function StaffOverviewContent() {
  const { t } = useTranslation();

  const { data: sessionData, isPending: isSessionPending } = useSession();
  const user = sessionData?.session?.user;
  const { requests, isLoading, fetchRequests } = useRequestStore();
  const [updatedAt, setUpdatedAt] = React.useState<Date | null>(null);

  const load = React.useCallback(async () => {
    await fetchRequests({ pageSize: 300 });
    setUpdatedAt(new Date());
  }, [fetchRequests]);

  React.useEffect(() => {
    if (isSessionPending) return;
    void load();
  }, [isSessionPending, load]);

  const stats = React.useMemo(() => {
    const now = new Date();
    const allAppointments = requests.flatMap((request) =>
      (request.appointments ?? []).map((appointment) => ({
        ...appointment,
        request,
      })),
    );
    const upcomingAppointments = allAppointments.filter(
      (appointment) =>
        new Date(appointment.date) >= now &&
        appointment.status !== "cancelled" &&
        appointment.status !== "rejected",
    );

    const todayAppointments = upcomingAppointments.filter((appointment) => {
      const date = new Date(appointment.date);
      return date.toDateString() === now.toDateString();
    });

    return {
      total: requests.length,
      pending: requests.filter(
        (request) => request.statusbystaff === "pending",
      ).length,
      staffApproved: requests.filter(
        (request) =>
          request.statusbystaff === "approved" &&
          request.statusbyadmin === "pending",
      ).length,
      completed: requests.filter(
        (request) => getRequestStatus(request) === "approved",
      ).length,
      rejected: requests.filter(
        (request) => getRequestStatus(request) === "rejected",
      ).length,
      appointments: upcomingAppointments.length,
      todayAppointments: todayAppointments.length,
      recentRequests: [...requests]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 6),
      upcomingAppointments: upcomingAppointments
        .sort(
          (a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime(),
        )
        .slice(0, 5),
    };
  }, [requests]);

  return (
    <PageLayout
      title={t("Staff Overview")}
      description={t("Your assigned service requests and upcoming work")}
      icon={LayoutDashboard}
      actions={
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="hidden text-xs text-muted-foreground sm:block">
              {t("Updated")} {updatedAt.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            onClick={load}
            disabled={isLoading}
            className="h-10 rounded-xl gap-2"
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            {t("Refresh")}
          </Button>
        </div>
      }
    >
      {isSessionPending || isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-32">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("Loading your work...")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-muted-foreground">
                {t("Welcome back")}
              </p>
              <h2 className="text-2xl font-black tracking-tight">
                {user?.name || user?.username || t("Staff Member")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {stats.pending > 0
                  ? t("{count} request(s) need your review.", { count: stats.pending })
                  : t("No pending staff reviews right now.")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label={t("Assigned")}
              value={stats.total}
              icon={FileText}
              color="text-primary"
              bg="bg-primary/10"
            />
            <StatCard
              label={t("Pending")}
              value={stats.pending}
              icon={Clock}
              color="text-amber-600"
              bg="bg-amber-500/10"
            />
            <StatCard
              label={t("Manager Review")}
              value={stats.staffApproved}
              icon={Activity}
              color="text-blue-600"
              bg="bg-blue-500/10"
            />
            <StatCard
              label={t("Completed")}
              value={stats.completed}
              icon={CheckCircle2}
              color="text-emerald-600"
              bg="bg-emerald-500/10"
            />
            <StatCard
              label={t("Rejected")}
              value={stats.rejected}
              icon={XCircle}
              color="text-red-600"
              bg="bg-red-500/10"
            />
            <StatCard
              label={t("Appointments")}
              value={stats.appointments}
              icon={Calendar}
              color="text-violet-600"
              bg="bg-violet-500/10"
              sub={
                stats.todayAppointments > 0
                  ? `${stats.todayAppointments} today`
                  : undefined
              }
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="border-none shadow-sm ring-1 ring-border/50 lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <FileText className="size-4 text-primary" />
                  {t("Recent Assigned Requests")}
                </CardTitle>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl text-xs font-bold"
                >
                  <Link href="/requestManagement">
                    {t("View all")} <ArrowRight className="ml-1 size-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {stats.recentRequests.length === 0 ? (
                  <EmptyState message={t("No assigned requests found.")} />
                ) : (
                  <div className="divide-y divide-border/50">
                    {stats.recentRequests.map((request) => {
                      const status = getRequestStatus(request);
                      const cfg = STATUS_CONFIG[status];
                      const StatusIcon = cfg.icon;

                      return (
                        <div
                          key={request.id}
                          className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/10"
                        >
                          <span
                            className={cn("size-2.5 rounded-full", cfg.dot)}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {request.service?.name ?? t("Service request")}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {t(displayName(request.user))} -{" "}
                              {formatDate(request.createdAt)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 gap-1 text-xs font-semibold",
                              cfg.badge,
                            )}
                          >
                            <StatusIcon className="size-3" />
                            {t(cfg.label)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6 lg:col-span-2">
              <Card className="border-none shadow-sm ring-1 ring-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <Calendar className="size-4 text-violet-600" />
                    {t("Upcoming Appointments")}
                  </CardTitle>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-xl text-xs font-bold"
                  >
                    <Link href="/appointments">
                      {t("All")} <ArrowRight className="ml-1 size-3" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {stats.upcomingAppointments.length === 0 ? (
                    <EmptyState message={t("No upcoming appointments.")} compact />
                  ) : (
                    <div className="divide-y divide-border/50">
                      {stats.upcomingAppointments.map((appointment) => {
                        const date = new Date(appointment.date);
                        const isToday =
                          date.toDateString() === new Date().toDateString();

                        return (
                          <div
                            key={appointment.id}
                            className="flex items-start gap-3 px-5 py-3.5"
                          >
                            <div
                              className={cn(
                                "flex size-10 shrink-0 flex-col items-center justify-center rounded-xl",
                                isToday
                                  ? "bg-violet-600 text-white"
                                  : "bg-violet-500/10 text-violet-700",
                              )}
                            >
                              <span className="text-[10px] font-black uppercase leading-none">
                                {date.toLocaleDateString("en-US", {
                                  month: "short",
                                })}
                              </span>
                              <span className="mt-0.5 text-base font-black leading-none">
                                {date.getDate()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {appointment.request.service?.name ??
                                  t("Appointment")}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {t(displayName(appointment.request.user))}
                                {appointment.time
                                  ? ` - ${appointment.time}`
                                  : ""}
                              </p>
                              {isToday && (
                                <span className="text-[10px] font-bold uppercase tracking-wide text-violet-600">
                                  {t("Today")}
                                </span>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className="shrink-0 text-xs font-semibold"
                            >
                              {appointment.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none bg-primary/5 shadow-sm ring-1 ring-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">
                    {t("Quick Actions")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <QuickAction
                    href="/requestManagement"
                    icon={FileText}
                    label={t("Review Requests")}
                    color="text-primary"
                    bg="bg-primary/10"
                  />
                  <QuickAction
                    href="/appointments"
                    icon={Calendar}
                    label={t("Appointments")}
                    color="text-violet-600"
                    bg="bg-violet-500/10"
                  />
                  <QuickAction
                    href="/requests"
                    icon={Clock}
                    label={t("Request Queue")}
                    color="text-amber-600"
                    bg="bg-amber-500/10"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  sub?: string;
}) {
  return (
    <Card className="border-none bg-card/60 shadow-sm ring-1 ring-border/50">
      <CardContent className="p-4">
        <div className={cn("mb-3 flex size-10 items-center justify-center rounded-xl", bg)}>
          <Icon className={cn("size-5", color)} />
        </div>
        <p className="text-3xl font-black leading-none tabular-nums">{value}</p>
        <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {sub && <p className="mt-0.5 text-xs font-semibold text-primary">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  color,
  bg,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <Button asChild variant="secondary" className="h-10 justify-start rounded-xl">
      <Link href={href}>
        <span className={cn("mr-2 flex size-6 items-center justify-center rounded-lg", bg)}>
          <Icon className={cn("size-3.5", color)} />
        </span>
        {label}
      </Link>
    </Button>
  );
}

function EmptyState({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center text-sm text-muted-foreground",
        compact ? "py-8" : "py-12",
      )}
    >
      <FileText className="mb-3 size-9 text-muted-foreground/20" />
      {message}
    </div>
  );
}
