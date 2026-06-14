"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  LayoutDashboard,
  RefreshCw,
  Building2,
  Users,
  UserCheck,
  Layers,
  FileText,
  Calendar,
  Loader2,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Settings,
  ArrowRight,
  AlertCircle,
  Star,
  TrendingUp,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

import { axiosInstance, getUploadUrl } from "@/lib/axios";
import { useSession } from "@/hooks/use-session";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageLayout } from "@/components/dashboard/page-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OVERVIEW_ROLES } from "@/lib/role-overview";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────
type Office = {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  logo?: string | null;
  slogan?: string | null;
  roomNumber?: string | null;
  phoneNumber?: string | null;
  status: boolean;
  startedAt?: string | null;
  createdAt: string;
  _count?: { service: number; staffs: number; requests?: number; appointments?: number };
  service?: { id: string; name: string }[];
};

type StaffMember = {
  id: string;
  name?: string;
  firstName?: string | null;
  fatherName?: string | null;
  lastName?: string | null;
  status: string;
  role?: { name: string };
};

type Request = {
  id: string;
  statusbystaff: string;
  statusbyadmin: string;
  createdAt: string;
  service?: { name: string };
  user?: { username: string; name?: string };
};

type Appointment = {
  id: string;
  date: string;
  time?: string | null;
  status: string;
  request?: {
    service?: { name: string; office?: { name: string } };
    user?: { username: string };
  };
};

type SliceItem = { name: string; value: number; color: string };

type OverviewData = {
  office: Office;
  staff: StaffMember[];
  requests: Request[];
  appointments: Appointment[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function getReqStatus(r: Request): "pending" | "processing" | "approved" | "rejected" {
  if (r.statusbystaff === "rejected" || r.statusbyadmin === "rejected") return "rejected";
  if (r.statusbystaff === "approved" && r.statusbyadmin === "approved") return "approved";
  if (r.statusbystaff === "approved") return "processing";
  return "pending";
}

function staffDisplayName(s: StaffMember): string {
  const parts = [s.firstName, s.fatherName, s.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : s.name || "Staff Member";
}

function settled<T>(r: PromiseSettledResult<T>): T | null {
  return r.status === "fulfilled" ? r.value : null;
}

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

const REQ_STATUS_CONFIG = {
  pending:    { label: "Pending",    color: "#f59e0b", dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  processing: { label: "Processing", color: "#3b82f6", dot: "bg-blue-500",    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  approved:   { label: "Approved",   color: "#10b981", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  rejected:   { label: "Rejected",   color: "#ef4444", dot: "bg-red-500",     badge: "bg-red-500/10 text-red-600 border-red-500/20" },
};

const APT_STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  pending:   { label: "Pending",   badge: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  approved:  { label: "Confirmed", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  completed: { label: "Completed", badge: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  rejected:  { label: "Rejected",  badge: "bg-red-500/10 text-red-600 border-red-500/20" },
  cancelled: { label: "Cancelled", badge: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ManagerOverviewPage() {
  return (
    <ProtectedRoute
      allowedRoles={OVERVIEW_ROLES.manager}
      redirectTo="/dashboard"
      showError={false}
    >
      <ManagerOverviewContent />
    </ProtectedRoute>
  );
}

function ManagerOverviewContent() {
  const { data: sessionData, isPending: isSessionPending } = useSession();
  const session = sessionData?.session;
  const officeId = session?.officeId || session?.user?.officeId;

  const [data, setData] = React.useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatedAt, setUpdatedAt] = React.useState<Date | null>(null);

  const load = React.useCallback(async () => {
    if (!officeId) return;
    setIsLoading(true);
    try {
      const [offRes, staffRes, reqRes, aptRes] = await Promise.allSettled([
        axiosInstance.get(`/offices/${officeId}`),
        axiosInstance.get("/staff", { params: { officeId, pageSize: 300 } }),
        axiosInstance.get("/requests", { params: { officeId, pageSize: 300 } }),
        axiosInstance.get("/appointments", { params: { officeId } }),
      ]);

      const office: Office | null = (settled(offRes) as any) ?? null;
      const staff: StaffMember[] = (settled(staffRes) as any)?.data ?? [];
      const requests: Request[] = (settled(reqRes) as any)?.data ?? [];
      const appointments: Appointment[] = (settled(aptRes) as any)?.data ?? [];

      if (!office) throw new Error("Office not found");

      setData({ office, staff, requests, appointments });
      setUpdatedAt(new Date());
    } catch {
      toast.error("Failed to load overview data");
    } finally {
      setIsLoading(false);
    }
  }, [officeId]);

  React.useEffect(() => {
    if (isSessionPending || !officeId) return;
    void load();
  }, [isSessionPending, officeId, load]);

  // ── No office assigned ───────────────────────────────────────────────────────
  if (!isSessionPending && !officeId) {
    return (
      <PageLayout
        title="Manager Overview"
        description="Your office overview and analytics"
        icon={LayoutDashboard}
      >
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="size-16 rounded-2xl bg-muted/30 flex items-center justify-center">
            <AlertCircle className="size-8 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-bold text-lg">No Office Assigned</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your account is not linked to an office. Please contact an administrator.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Manager Overview"
      description={data?.office.name ? `${data.office.name} — live analytics` : "Real-time office analytics"}
      icon={LayoutDashboard}
      actions={
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Updated {updatedAt.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" onClick={load} disabled={isLoading} className="h-10 rounded-xl gap-2">
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      }
    >
      {isLoading && !data ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading office data…</p>
        </div>
      ) : data ? (
        <OverviewContent data={data} />
      ) : null}
    </PageLayout>
  );
}

// ── Main Content ───────────────────────────────────────────────────────────────
function OverviewContent({ data }: { data: OverviewData }) {
  const { office, staff, requests, appointments } = data;
  const now = new Date();

  // ── Derived stats ────────────────────────────────────────────────────────────
  const activeStaff   = staff.filter(s => s.status === "ACTIVE").length;
  const inactiveStaff = staff.filter(s => s.status === "INACTIVE").length;
  const pendingStaff  = staff.filter(s => s.status === "PENDING").length;
  const blockedStaff  = staff.filter(s => s.status === "BLOCKED").length;

  const reqStats = { pending: 0, processing: 0, approved: 0, rejected: 0 };
  requests.forEach(r => { reqStats[getReqStatus(r)]++; });

  const upcomingApts = appointments
    .filter(a => new Date(a.date) >= now && a.status !== "cancelled" && a.status !== "rejected")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const todayApts = upcomingApts.filter(a => {
    const d = new Date(a.date);
    return d.toDateString() === now.toDateString();
  });

  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const staffSlices: SliceItem[] = [
    { name: "Active",   value: activeStaff,   color: "#10b981" },
    { name: "Inactive", value: inactiveStaff, color: "#6b7280" },
    { name: "Pending",  value: pendingStaff,  color: "#f59e0b" },
    { name: "Blocked",  value: blockedStaff,  color: "#ef4444" },
  ].filter(s => s.value > 0);

  const totalStaff   = staff.length;
  const totalReqs    = requests.length;
  const totalSvcs    = office._count?.service ?? office.service?.length ?? 0;

  return (
    <div className="space-y-6">

      {/* ── Office Identity Card ──────────────────────────────────────────── */}
      <Card className="overflow-hidden border-none shadow-sm ring-1 ring-border/50">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Logo + name column */}
            <div className="lg:w-64 shrink-0 bg-muted/30 p-6 flex flex-col items-center text-center border-b lg:border-b-0 lg:border-r border-border/50">
              <div className="size-20 rounded-2xl bg-background border border-border shadow-sm overflow-hidden mb-4">
                {office.logo ? (
                  <img
                    src={getUploadUrl(office.logo)}
                    alt={office.name}
                    className="size-full object-contain p-2"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center">
                    <Building2 className="size-9 text-primary/40" />
                  </div>
                )}
              </div>
              <h2 className="text-lg font-black leading-tight">{office.name}</h2>
              {office.slogan && (
                <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">{office.slogan}</p>
              )}
              <Badge
                className={cn(
                  "mt-3 font-bold",
                  office.status
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {office.status ? "Active" : "Inactive"}
              </Badge>
            </div>

            {/* Info grid */}
            <div className="flex-1 p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
              {office.address && (
                <OfficeInfoItem icon={MapPin} label="Address" value={office.address} />
              )}
              {office.roomNumber && (
                <OfficeInfoItem icon={Layers} label="Room" value={office.roomNumber} />
              )}
              {office.phoneNumber && (
                <OfficeInfoItem icon={Phone} label="Phone" value={office.phoneNumber} />
              )}
              {(office.startedAt || office.createdAt) && (
                <OfficeInfoItem
                  icon={Clock}
                  label="Operating Since"
                  value={format(new Date(office.startedAt || office.createdAt), "MMM d, yyyy")}
                />
              )}
              {todayApts.length > 0 && (
                <OfficeInfoItem
                  icon={Calendar}
                  label="Today's Appointments"
                  value={`${todayApts.length} scheduled`}
                  valueClass="text-violet-600 font-bold"
                />
              )}
              {reqStats.pending > 0 && (
                <OfficeInfoItem
                  icon={FileText}
                  label="Pending Requests"
                  value={`${reqStats.pending} awaiting review`}
                  valueClass="text-amber-600 font-bold"
                />
              )}
              {office.description && (
                <div className="sm:col-span-2 lg:col-span-3 pt-3 border-t border-border/50">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    Description
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{office.description}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Staff",   value: totalStaff,          icon: Users,        color: "text-blue-600",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
          { label: "Active Staff",  value: activeStaff,          icon: UserCheck,    color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Services",      value: totalSvcs,            icon: Layers,       color: "text-orange-600",  bg: "bg-orange-500/10",  border: "border-orange-500/20" },
          { label: "Total Requests",value: totalReqs,            icon: FileText,     color: "text-pink-600",    bg: "bg-pink-500/10",    border: "border-pink-500/20" },
          { label: "Pending",       value: reqStats.pending,     icon: Clock,        color: "text-amber-600",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
          { label: "Appointments",  value: upcomingApts.length,  icon: Calendar,     color: "text-violet-600",  bg: "bg-violet-500/10",  border: "border-violet-500/20" },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <Card key={label} className={cn("border shadow-sm bg-card/50", border)}>
            <CardContent className="p-5">
              <div className={cn("size-10 rounded-xl flex items-center justify-center mb-3", bg)}>
                <Icon className={cn("size-5", color)} />
              </div>
              <p className="text-3xl font-black leading-none tabular-nums">{value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground font-semibold mt-1.5 uppercase tracking-wide">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Middle row: Recent Requests + Upcoming Appointments ───────────── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Recent Requests */}
        <Card className="lg:col-span-3 border-none shadow-sm ring-1 ring-border/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="size-4 text-pink-600" />
              Recent Requests
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-8 rounded-xl text-xs font-bold">
              <Link href="/requestManagement">
                View all <ArrowRight className="ml-1 size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <FileText className="size-10 text-muted-foreground/20 mb-3" />
                <p className="font-semibold text-sm">No requests yet</p>
                <p className="text-xs text-muted-foreground mt-1">Requests for your office will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentRequests.map(req => {
                  const status = getReqStatus(req);
                  const cfg = REQ_STATUS_CONFIG[status];
                  return (
                    <div key={req.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/10 transition-colors">
                      <div className={cn("size-2.5 rounded-full shrink-0", cfg.dot)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {req.service?.name ?? "Service request"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {req.user?.name || req.user?.username || "Customer"} ·{" "}
                          {format(new Date(req.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn("text-xs font-semibold shrink-0", cfg.badge)}>
                        {cfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Upcoming Appointments */}
          <Card className="border-none shadow-sm ring-1 ring-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="size-4 text-violet-600" />
                Upcoming Appointments
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-8 rounded-xl text-xs font-bold">
                <Link href="/appointments">
                  All <ArrowRight className="ml-1 size-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingApts.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center px-4">
                  <Calendar className="size-8 text-muted-foreground/20 mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {upcomingApts.slice(0, 5).map(apt => {
                    const aptDate = new Date(apt.date);
                    const isToday = aptDate.toDateString() === now.toDateString();
                    const aptCfg = APT_STATUS_CONFIG[apt.status] ?? APT_STATUS_CONFIG.pending;
                    return (
                      <div key={apt.id} className="px-5 py-3 flex items-start gap-3">
                        <div className={cn(
                          "size-10 rounded-xl flex flex-col items-center justify-center shrink-0",
                          isToday ? "bg-violet-500 text-white" : "bg-violet-500/10",
                        )}>
                          <p className={cn("text-[10px] font-black leading-none", isToday ? "text-white" : "text-violet-600")}>
                            {format(aptDate, "MMM")}
                          </p>
                          <p className={cn("text-base font-black leading-none mt-0.5", isToday ? "text-white" : "text-violet-700")}>
                            {aptDate.getDate()}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {apt.request?.service?.name ?? "Appointment"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {apt.request?.user?.username ?? "Customer"}
                            {apt.time ? ` · ${apt.time}` : ""}
                          </p>
                          {isToday && (
                            <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wide">Today</span>
                          )}
                        </div>
                        <Badge variant="outline" className={cn("text-xs font-semibold shrink-0", aptCfg.badge)}>
                          {aptCfg.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-none shadow-sm ring-1 ring-border/50 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {[
                { href: "/requestManagement", icon: FileText,  label: "Manage Requests",   color: "text-pink-600",   bg: "bg-pink-500/10" },
                { href: "/appointments",      icon: Calendar,  label: "Appointments",       color: "text-violet-600", bg: "bg-violet-500/10" },
                { href: "/staff",             icon: Users,     label: "Staff",              color: "text-blue-600",   bg: "bg-blue-500/10" },
                { href: "/services",          icon: Layers,    label: "Services",           color: "text-orange-600", bg: "bg-orange-500/10" },
                { href: "/report",            icon: TrendingUp,label: "Reports",            color: "text-emerald-600",bg: "bg-emerald-500/10" },
                { href: "/configuration",     icon: Settings,  label: "Configuration",      color: "text-gray-600",   bg: "bg-gray-500/10" },
              ].map(({ href, icon: Icon, label, color, bg }) => (
                <Button key={href} variant="secondary" className="justify-start rounded-xl h-9" asChild>
                  <Link href={href}>
                    <div className={cn("size-6 rounded-lg flex items-center justify-center mr-2 shrink-0", bg)}>
                      <Icon className={cn("size-3.5", color)} />
                    </div>
                    {label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Bottom row: Staff status + Request breakdown ───────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Staff Status Donut */}
        <Card className="border-none shadow-sm ring-1 ring-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UserCheck className="size-4 text-emerald-600" />
              Staff Status
              {totalStaff > 0 && (
                <span className="ml-auto text-xs text-muted-foreground font-normal">{totalStaff} total</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {staffSlices.length === 0 ? (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground/40 text-sm">
                No staff data
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={staffSlices}
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {staffSlices.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: any, n: any) => [
                        `${v} (${totalStaff > 0 ? Math.round((v / totalStaff) * 100) : 0}%)`, n,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {staffSlices.map(s => (
                    <div key={s.name} className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-muted-foreground flex-1">{s.name}</span>
                      <span className="font-black tabular-nums">{s.value}</span>
                      {totalStaff > 0 && (
                        <span className="text-muted-foreground/60 w-9 text-right text-xs">
                          {Math.round((s.value / totalStaff) * 100)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active staff list preview */}
            {staff.filter(s => s.status === "ACTIVE").length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Active Staff</p>
                {staff.filter(s => s.status === "ACTIVE").slice(0, 4).map(s => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className="size-7 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <UserCheck className="size-3.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{staffDisplayName(s)}</p>
                      {s.role?.name && <p className="text-[10px] text-muted-foreground">{s.role.name}</p>}
                    </div>
                  </div>
                ))}
                {staff.filter(s => s.status === "ACTIVE").length > 4 && (
                  <Button variant="link" size="sm" className="px-0 h-7 text-xs" asChild>
                    <Link href="/staff">
                      +{staff.filter(s => s.status === "ACTIVE").length - 4} more staff
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Status Breakdown */}
        <Card className="border-none shadow-sm ring-1 ring-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="size-4 text-pink-600" />
              Request Breakdown
              {totalReqs > 0 && (
                <span className="ml-auto text-xs text-muted-foreground font-normal">{totalReqs} total</span>
              )}
            </CardTitle>
            <CardDescription className="text-xs">Status distribution for all office requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalReqs === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <FileText className="size-8 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">No requests yet</p>
              </div>
            ) : (
              <>
                {(["pending", "processing", "approved", "rejected"] as const).map(status => {
                  const cfg  = REQ_STATUS_CONFIG[status];
                  const count = reqStats[status];
                  const pct  = totalReqs > 0 ? Math.round((count / totalReqs) * 100) : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                          <span className="font-medium text-muted-foreground">{cfg.label}</span>
                        </div>
                        <span className="font-bold tabular-nums">
                          {count}
                          <span className="text-muted-foreground font-normal ml-1">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* This month highlight */}
                {(() => {
                  const thisMonth = requests.filter(r => {
                    const d = new Date(r.createdAt);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length;
                  return thisMonth > 0 ? (
                    <div className="flex items-center gap-3 mt-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10">
                      <Star className="size-4 text-primary shrink-0" />
                      <p className="text-xs font-medium">
                        <span className="font-black text-primary">{thisMonth}</span> request{thisMonth > 1 ? "s" : ""} received this month
                      </p>
                    </div>
                  ) : null;
                })()}
              </>
            )}

            {/* Services preview */}
            {office.service && office.service.length > 0 && (
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Office Services</p>
                <div className="flex flex-wrap gap-1.5">
                  {office.service.slice(0, 6).map(s => (
                    <Badge key={s.id} variant="secondary" className="text-xs font-medium rounded-lg">
                      {s.name}
                    </Badge>
                  ))}
                  {totalSvcs > 6 && (
                    <Badge variant="outline" className="text-xs font-medium rounded-lg text-muted-foreground">
                      +{totalSvcs - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function OfficeInfoItem({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-primary/5 p-2 shrink-0">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-semibold break-words", valueClass)}>{value}</p>
      </div>
    </div>
  );
}

// re-export Clock for OfficeInfoItem usage above
function Clock(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
