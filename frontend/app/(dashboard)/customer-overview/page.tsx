"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Building2,
  Loader2,
  ArrowRight,
  TrendingUp,
  Activity,
  Star,
} from "lucide-react";
import Link from "next/link";

import { useSession } from "@/hooks/use-session";
import { axiosInstance } from "@/lib/axios";
import { useRequestStore, type ServiceRequest } from "@/lib/stores/request-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────
type Appointment = {
  id: string;
  date: string;
  time?: string | null;
  status: string;
  notes?: string | null;
  request: {
    id: string;
    statusbystaff: string;
    statusbyadmin: string;
    service: {
      id: string;
      name: string;
      office: { id: string; name: string; address: string; roomNumber: string };
    };
  };
};

// ── Helpers ──────────────────────────────────────────────────────
function getRequestStatus(req: ServiceRequest): "pending" | "approved" | "rejected" | "partial" {
  if (req.statusbystaff === "rejected" || req.statusbyadmin === "rejected") return "rejected";
  if (req.statusbystaff === "approved" && req.statusbyadmin === "approved") return "approved";
  if (req.statusbystaff === "approved") return "partial";
  return "pending";
}

const STATUS_BADGE: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  partial: { label: "Processing", className: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Activity },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle },
  rejected: { label: "Rejected", className: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? STATUS_BADGE.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("font-semibold text-xs gap-1", cfg.className)}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDatetime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function greet(name?: string) {
  const hour = new Date().getHours();
  const salutation = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${salutation}, ${name}` : salutation;
}

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  sub,
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <Card
      className={cn(
        "border-none shadow-sm ring-1 ring-border/50 bg-card/60 backdrop-blur-sm transition-all duration-200",
        href && "hover:ring-primary/30 hover:shadow-md cursor-pointer"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn("p-2.5 rounded-xl", bg)}>
            <Icon className={cn("size-5", color)} />
          </div>
          {href && <ArrowRight className="size-4 text-muted-foreground/40 mt-1" />}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-black">{value}</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ── Page ─────────────────────────────────────────────────────────
export default function CustomerOverviewPage() {
  const { data: sessionData, isPending: isSessionPending } = useSession();
  const session = sessionData?.session;
  const user = session?.user;

  const { requests, isLoading: isLoadingRequests, fetchRequests } = useRequestStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingApts, setIsLoadingApts] = useState(false);

  useEffect(() => {
    if (isSessionPending) return;
    // Fetch customer's own requests (backend auto-scopes by userId for CUSTOMER role)
    fetchRequests({ pageSize: 100 });

    // Fetch customer's appointments
    setIsLoadingApts(true);
    axiosInstance
      .get("/appointments")
      .then((res: any) => setAppointments(res?.data ?? []))
      .catch(() => setAppointments([]))
      .finally(() => setIsLoadingApts(false));
  }, [isSessionPending, fetchRequests]);

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => getRequestStatus(r) === "pending").length;
    const processing = requests.filter((r) => getRequestStatus(r) === "partial").length;
    const approved = requests.filter((r) => getRequestStatus(r) === "approved").length;
    const rejected = requests.filter((r) => getRequestStatus(r) === "rejected").length;

    const now = new Date();
    const thisMonth = requests.filter((r) => {
      const d = new Date(r.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const upcoming = appointments.filter(
      (a) => new Date(a.date) >= now && a.status !== "cancelled"
    ).length;

    const rated = requests.filter((r) => r.customerSatisfaction?.rating).length;
    const avgRating =
      rated > 0
        ? (
            requests.reduce((sum, r) => sum + (r.customerSatisfaction?.rating ?? 0), 0) / rated
          ).toFixed(1)
        : null;

    const recent = [...requests]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const upcomingApts = [...appointments]
      .filter((a) => new Date(a.date) >= now && a.status !== "cancelled")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);

    return { total, pending, processing, approved, rejected, thisMonth, upcoming, avgRating, recent, upcomingApts };
  }, [requests, appointments]);

  const isLoading = isSessionPending || isLoadingRequests;

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight">
          {isSessionPending ? "Loading…" : greet(user?.name || user?.username)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {stats.pending > 0 && (
            <span className="ml-2 text-amber-600 font-semibold">
              · {stats.pending} request{stats.pending > 1 ? "s" : ""} awaiting review
            </span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-56">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              label="Total Applications"
              value={stats.total}
              icon={FileText}
              color="text-primary"
              bg="bg-primary/10"
              sub="All time"
              href="/requests"
            />
            <StatCard
              label="Pending"
              value={stats.pending}
              icon={Clock}
              color="text-amber-600"
              bg="bg-amber-500/10"
              sub="Awaiting action"
              href="/requests"
            />
            <StatCard
              label="Processing"
              value={stats.processing}
              icon={Activity}
              color="text-blue-600"
              bg="bg-blue-500/10"
              sub="Staff approved"
              href="/requests"
            />
            <StatCard
              label="Approved"
              value={stats.approved}
              icon={CheckCircle}
              color="text-emerald-600"
              bg="bg-emerald-500/10"
              sub="Fully completed"
              href="/requests"
            />
            <StatCard
              label="Appointments"
              value={stats.upcoming}
              icon={Calendar}
              color="text-violet-600"
              bg="bg-violet-500/10"
              sub="Upcoming"
              href="/appointments"
            />
          </div>

          {/* ── This Month Banner ── */}
          {stats.thisMonth > 0 && (
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-primary/5 border border-primary/10">
              <TrendingUp className="size-5 text-primary shrink-0" />
              <p className="text-sm font-medium">
                You submitted{" "}
                <span className="font-black text-primary">{stats.thisMonth}</span>{" "}
                application{stats.thisMonth > 1 ? "s" : ""} this month.
                {stats.avgRating && (
                  <span className="ml-2 text-muted-foreground">
                    Average satisfaction rating:{" "}
                    <span className="font-bold text-amber-500">
                      <Star className="inline size-3.5 mb-0.5" /> {stats.avgRating}/5
                    </span>
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-5">
            {/* ── Recent Requests ── */}
            <Card className="border-none shadow-sm ring-1 ring-border/50 lg:col-span-3">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  Recent Applications
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="h-8 rounded-xl text-xs font-bold">
                  <Link href="/requests">
                    View all <ArrowRight className="ml-1 size-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {stats.recent.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <div className="p-3 rounded-full bg-muted/30 mb-3">
                      <FileText className="size-8 text-muted-foreground/30" />
                    </div>
                    <p className="font-semibold">No applications yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start by applying for a service.
                    </p>
                    <Button asChild className="mt-4 rounded-xl h-9 text-sm font-bold">
                      <Link href="/apply-service">Apply for Service</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {stats.recent.map((req) => {
                      const status = getRequestStatus(req);
                      return (
                        <div
                          key={req.id}
                          className="px-6 py-4 flex items-center gap-4 hover:bg-muted/10 transition-colors"
                        >
                          {/* Status dot */}
                          <div
                            className={cn(
                              "size-2.5 rounded-full shrink-0",
                              status === "approved" && "bg-emerald-500",
                              status === "rejected" && "bg-red-500",
                              status === "partial" && "bg-blue-500",
                              status === "pending" && "bg-amber-500"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{req.service?.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Building2 className="size-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground truncate">
                                {req.service?.office?.name}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 text-right space-y-1">
                            <StatusBadge status={status} />
                            <p className="text-xs text-muted-foreground">{formatDate(req.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Right column: Upcoming Apts + Status Breakdown ── */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Upcoming Appointments */}
              <Card className="border-none shadow-sm ring-1 ring-border/50">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calendar className="size-4 text-primary" />
                    Upcoming Appointments
                  </CardTitle>
                  <Button asChild variant="ghost" size="sm" className="h-8 rounded-xl text-xs font-bold">
                    <Link href="/appointments">
                      All <ArrowRight className="ml-1 size-3" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingApts ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="size-5 animate-spin text-primary" />
                    </div>
                  ) : stats.upcomingApts.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center px-4">
                      <Calendar className="size-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {stats.upcomingApts.map((apt) => (
                        <div key={apt.id} className="px-5 py-3.5 flex items-start gap-3">
                          <div className="size-9 rounded-xl bg-violet-500/10 flex flex-col items-center justify-center shrink-0">
                            <p className="text-xs font-black text-violet-600 leading-none">
                              {new Date(apt.date).toLocaleDateString("en-US", { month: "short" })}
                            </p>
                            <p className="text-base font-black text-violet-700 leading-none mt-0.5">
                              {new Date(apt.date).getDate()}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {apt.request?.service?.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Building2 className="size-3" />
                              {apt.request?.service?.office?.name}
                            </p>
                            {apt.time && (
                              <p className="text-xs text-violet-600 font-semibold mt-0.5">
                                {apt.time}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-semibold shrink-0",
                              apt.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            )}
                          >
                            {apt.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Breakdown */}
              <Card className="border-none shadow-sm ring-1 ring-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="size-4 text-primary" />
                    Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Approved", count: stats.approved, color: "bg-emerald-500", text: "text-emerald-600" },
                    { label: "Processing", count: stats.processing, color: "bg-blue-500", text: "text-blue-600" },
                    { label: "Pending", count: stats.pending, color: "bg-amber-500", text: "text-amber-600" },
                    { label: "Rejected", count: stats.rejected, color: "bg-red-500", text: "text-red-600" },
                  ].map(({ label, count, color, text }) => {
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-muted-foreground">{label}</span>
                          <span className={cn("font-bold", text)}>
                            {count} <span className="text-muted-foreground font-normal">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700", color)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {stats.total === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center py-2">
                      No data yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Apply for Service", href: "/apply-service", icon: FileText, color: "text-primary", bg: "bg-primary/10" },
              { label: "My Requests", href: "/requests", icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
              { label: "Appointments", href: "/appointments", icon: Calendar, color: "text-violet-600", bg: "bg-violet-500/10" },
              { label: "Leave Feedback", href: "/feedback", icon: Star, color: "text-yellow-600", bg: "bg-yellow-500/10" },
            ].map(({ label, href, icon: Icon, color, bg }) => (
              <Link key={href} href={href}>
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-card/50 hover:bg-muted/30 hover:border-primary/20 transition-all cursor-pointer group">
                  <div className={cn("p-2 rounded-xl shrink-0", bg)}>
                    <Icon className={cn("size-4", color)} />
                  </div>
                  <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
