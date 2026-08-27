"use client";

import React from "react";
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
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

import { axiosInstance } from "@/lib/axios";
import { useSession } from "@/hooks/use-session";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageLayout } from "@/components/dashboard/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OVERVIEW_ROLES } from "@/lib/role-overview";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

// ── Types ────────────────────────────────────────────────────────────
type OfficeRow = {
  id: string;
  name: string;
  status: boolean;
  services: number;
  staff: number;
  requests: number;
  appointments: number;
};

type SliceItem = { name: string; value: number; color: string };

type Overview = {
  offices: OfficeRow[];
  totalUsers: number;
  totalStaff: number;
  totalServices: number;
  totalRequests: number;
  totalAppointments: number;
  staffStatus: SliceItem[];
  requestStatus: SliceItem[];
  appointmentStatus: SliceItem[];
  officeChart: { name: string; services: number; staff: number; requests: number }[];
};

/** Shape returned by GET /offices/stats — every figure aggregated in the DB. */
type StatsPayload = {
  totals: {
    offices: number;
    users: number;
    staff: number;
    services: number;
    requests: number;
    appointments: number;
  };
  staffStatus: Record<string, number>;
  requestStatus: { pending: number; processing: number; approved: number; rejected: number };
  appointmentStatus: Record<string, number>;
  offices: OfficeRow[];
};

// ── Helpers ────────────────────────────────────────────────────────────
function getReqOverall(r: any): string {
  if (r.statusbystaff === "rejected" || r.statusbyadmin === "rejected") return "Rejected";
  if (r.statusbystaff === "approved" && r.statusbyadmin === "approved") return "Approved";
  if (r.statusbystaff === "approved") return "Processing";
  return "Pending";
}

function settled<T>(r: PromiseSettledResult<T>): T | null {
  return r.status === "fulfilled" ? r.value : null;
}

const STAFF_STATUS_META: { key: string; name: string; color: string }[] = [
  { key: "ACTIVE",   name: "Active",   color: "#10b981" },
  { key: "INACTIVE", name: "Inactive", color: "#6b7280" },
  { key: "PENDING",  name: "Pending",  color: "#f59e0b" },
  { key: "BLOCKED",  name: "Blocked",  color: "#ef4444" },
];

const APT_STATUS_META: Record<string, { name: string; color: string }> = {
  pending:   { name: "Pending",   color: "#f59e0b" },
  approved:  { name: "Confirmed", color: "#10b981" },
  completed: { name: "Completed", color: "#3b82f6" },
  rejected:  { name: "Rejected",  color: "#ef4444" },
  cancelled: { name: "Cancelled", color: "#6b7280" },
};

const REQ_STATUS_META: { key: keyof StatsPayload["requestStatus"]; name: string; color: string }[] = [
  { key: "pending",    name: "Pending",    color: "#f59e0b" },
  { key: "processing", name: "Processing", color: "#3b82f6" },
  { key: "approved",   name: "Approved",   color: "#10b981" },
  { key: "rejected",   name: "Rejected",   color: "#ef4444" },
];

/** Top 8 offices by request volume, for the comparison bars. */
function buildOfficeChart(offices: OfficeRow[]) {
  return [...offices]
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 8)
    .map((o) => ({
      name: o.name.length > 18 ? o.name.slice(0, 16) + "…" : o.name,
      services: o.services,
      staff: o.staff,
      requests: o.requests,
    }));
}

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

// ── Page ────────────────────────────────────────────────────────────
export default function AdminOverviewPage() {
  return (
    <ProtectedRoute
      allowedRoles={OVERVIEW_ROLES.admin}
      redirectTo="/dashboard"
      showError={false}
    >
      <AdminOverviewContent />
    </ProtectedRoute>
  );
}

function AdminOverviewContent() {
  const { t } = useTranslation();

  const { isPending: isSessionPending } = useSession();
  const [overview, setOverview] = React.useState<Overview | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatedAt, setUpdatedAt] = React.useState<Date | null>(null);

  /**
   * Preferred path: one aggregated call. Counts come straight out of the
   * database, so nothing depends on how many rows a paginated list happened to
   * return, and offices whose denormalised `officeId` column was never written
   * still report the work they actually own.
   */
  const loadFromStats = React.useCallback(async (): Promise<Overview> => {
    const body = (await axiosInstance.get("/offices/stats")) as unknown as {
      data: StatsPayload;
    };
    const stats = body?.data;
    if (!stats?.totals) throw new Error("Malformed stats payload");

    const offices = stats.offices ?? [];

    return {
      offices,
      totalUsers: stats.totals.users,
      totalStaff: stats.totals.staff,
      totalServices: stats.totals.services,
      totalRequests: stats.totals.requests,
      totalAppointments: stats.totals.appointments,
      staffStatus: STAFF_STATUS_META.map(({ key, name, color }) => ({
        name,
        value: stats.staffStatus?.[key] ?? 0,
        color,
      })).filter((s) => s.value > 0),
      requestStatus: REQ_STATUS_META.map(({ key, name, color }) => ({
        name,
        value: stats.requestStatus?.[key] ?? 0,
        color,
      })).filter((s) => s.value > 0),
      appointmentStatus: Object.entries(stats.appointmentStatus ?? {})
        .map(([key, value]) => ({
          name: APT_STATUS_META[key]?.name ?? key,
          value,
          color: APT_STATUS_META[key]?.color ?? "#6b7280",
        }))
        .filter((s) => s.value > 0),
      officeChart: buildOfficeChart(offices),
    };
  }, []);

  /**
   * Fallback for a backend without /offices/stats: derive the same figures from
   * the individual list endpoints. Totals take the largest of the signals
   * available — a relation count of 0 must never win over a list that clearly
   * holds rows, which is what the old `a || b` chain allowed.
   */
  const loadFromLists = React.useCallback(async (): Promise<Overview> => {
    const [offRes, staffRes, usersRes, reqRes, aptRes] = await Promise.allSettled([
      axiosInstance.get("/offices"),
      axiosInstance.get("/staff", { params: { pageSize: 500 } }),
      axiosInstance.get("/users", { params: { page: 1, pageSize: 1 } }),
      axiosInstance.get("/requests", { params: { pageSize: 500 } }),
      axiosInstance.get("/appointments"),
    ]);

    const rawOffices: any[] = (settled(offRes) as any)?.data ?? [];
    const staffList: any[] = (settled(staffRes) as any)?.data ?? [];
    const totalUsers: number = (settled(usersRes) as any)?.pagination?.total ?? 0;
    const reqBody = settled(reqRes) as any;
    const reqList: any[] = reqBody?.data ?? [];
    const aptList: any[] = (settled(aptRes) as any)?.data ?? [];

    const offices: OfficeRow[] = rawOffices.map((o) => ({
      id: o.id,
      name: o.name,
      status: !!o.status,
      services: o._count?.service ?? 0,
      staff: o._count?.staffs ?? 0,
      requests: o._count?.requests ?? 0,
      appointments: o._count?.appointments ?? 0,
    }));

    const sum = (key: "services" | "staff" | "requests" | "appointments") =>
      offices.reduce((acc, o) => acc + (o[key] ?? 0), 0);

    // `pagination.total` is the server's own count and outranks the single page
    // of rows we were handed; the relation sums are the last resort.
    const totalRequests = Math.max(
      reqBody?.pagination?.total ?? 0,
      reqList.length,
      sum("requests"),
    );
    const totalAppointments = Math.max(aptList.length, sum("appointments"));

    const staffCount: Record<string, number> = {};
    staffList.forEach((s) => {
      const key = String(s.status ?? "ACTIVE");
      staffCount[key] = (staffCount[key] ?? 0) + 1;
    });

    const reqCount: Record<string, number> = { Pending: 0, Processing: 0, Approved: 0, Rejected: 0 };
    reqList.forEach((r) => {
      reqCount[getReqOverall(r)]++;
    });

    const aptCount: Record<string, number> = {};
    aptList.forEach((a) => {
      aptCount[a.status] = (aptCount[a.status] ?? 0) + 1;
    });

    return {
      offices,
      totalUsers,
      totalStaff: Math.max(staffList.length, sum("staff")),
      totalServices: sum("services"),
      totalRequests,
      totalAppointments,
      staffStatus: STAFF_STATUS_META.map(({ key, name, color }) => ({
        name,
        value: staffCount[key] ?? 0,
        color,
      })).filter((s) => s.value > 0),
      requestStatus: REQ_STATUS_META.map(({ name, color }) => ({
        name,
        value: reqCount[name] ?? 0,
        color,
      })).filter((s) => s.value > 0),
      appointmentStatus: Object.entries(aptCount)
        .map(([key, value]) => ({
          name: APT_STATUS_META[key]?.name ?? key,
          value,
          color: APT_STATUS_META[key]?.color ?? "#6b7280",
        }))
        .filter((s) => s.value > 0),
      officeChart: buildOfficeChart(offices),
    };
  }, []);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      let next: Overview;
      try {
        next = await loadFromStats();
      } catch {
        next = await loadFromLists();
      }
      setOverview(next);
      setUpdatedAt(new Date());
    } catch {
      toast.error(t("Failed to load overview data"));
    } finally {
      setIsLoading(false);
    }
  }, [loadFromStats, loadFromLists, t]);

  React.useEffect(() => {
    if (isSessionPending) return;
    void load();
  }, [isSessionPending, load]);

  return (
    <PageLayout
      title={t("Admin Overview")}
      description={t("Real-time system analytics and performance at a glance")}
      icon={LayoutDashboard}
      actions={
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {t("Updated")} {updatedAt.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" onClick={load} disabled={isLoading} className="h-10 rounded-xl gap-2">
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            {t("Refresh")}
          </Button>
        </div>
      }
    >
      {isLoading && !overview ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("Loading analytics…")}</p>
        </div>
      ) : overview ? (
        <div className="space-y-6">

          {/* ── KPI Cards ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: t("Offices"),      value: overview.offices.length,       icon: Building2,  color: "text-violet-600",  bg: "bg-violet-500/10",  border: "border-violet-500/20" },
              { label: t("Staff"),        value: overview.totalStaff,            icon: UserCheck,  color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { label: t("Users"),        value: overview.totalUsers,            icon: Users,      color: "text-blue-600",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
              { label: t("Services"),     value: overview.totalServices,         icon: Layers,     color: "text-orange-600",  bg: "bg-orange-500/10",  border: "border-orange-500/20" },
              { label: t("Requests"),     value: overview.totalRequests,         icon: FileText,   color: "text-pink-600",    bg: "bg-pink-500/10",    border: "border-pink-500/20" },
              { label: t("Appointments"), value: overview.totalAppointments,     icon: Calendar,   color: "text-cyan-600",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20" },
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

          {/* ── Donut Charts Row ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DonutCard
              title={t("Request Status")}
              icon={<FileText className="size-4 text-pink-600" />}
              slices={overview.requestStatus}
              empty={t("No requests yet")}
            />
            <DonutCard
              title={t("Staff Status")}
              icon={<UserCheck className="size-4 text-emerald-600" />}
              slices={overview.staffStatus}
              empty={t("No staff data")}
            />
            <DonutCard
              title={t("Appointment Status")}
              icon={<Calendar className="size-4 text-cyan-600" />}
              slices={overview.appointmentStatus}
              empty={t("No appointments yet")}
            />
          </div>

          {/* ── Office Performance Bar Chart ─────────────────────────────── */}
          {overview.officeChart.length > 0 && (
            <Card className="border shadow-sm ring-0 bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="size-4 text-violet-600" />
                  {t("Office Performance")}
                  <span className="text-xs text-muted-foreground font-normal ml-1">{t("— Services · Staff · Requests")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={overview.officeChart} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="services" name="Services"  fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="staff"    name="Staff"     fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="requests" name="Requests"  fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* ── Offices Breakdown Table ──────────────────────────────────── */}
          <Card className="border shadow-sm ring-0 bg-card/50 border-border/50 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="size-4 text-violet-600" />
                {t("Office Breakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      {["Office", "Status", "Services", "Staff", "Requests", "Appointments"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground first:pl-6">
                          {t(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overview.offices.map((office) => (
                      <tr key={office.id} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-4 pl-6">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                              <Building2 className="size-4 text-violet-600" />
                            </div>
                            <span className="font-semibold line-clamp-1">{office.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="outline" className={cn("text-xs font-semibold", office.status ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20")}>
                            {office.status ? t("Active") : t("Inactive")}
                          </Badge>
                        </td>
                        <StatCell value={office.services} color="text-orange-600" />
                        <StatCell value={office.staff} color="text-emerald-600" />
                        <StatCell value={office.requests} color="text-pink-600" />
                        <StatCell value={office.appointments} color="text-cyan-600" />
                      </tr>
                    ))}
                    {overview.offices.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">
                          {t("No offices found")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      ) : null}
    </PageLayout>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function DonutCard({ title, icon, slices, empty }: { title: string; icon: React.ReactNode; slices: SliceItem[]; empty: string }) {
  const { t } = useTranslation();

  const total = slices.reduce((s, i) => s + i.value, 0);
  return (
    <Card className="border shadow-sm ring-0 bg-card/50 border-border/50">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          {icon} {title}
          {total > 0 && <span className="ml-auto text-xs text-muted-foreground font-normal">{total} {t("total")}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {slices.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground/40 text-sm">{empty}</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={slices} cx="50%" cy="50%" innerRadius={52} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {slices.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: any, n: any) => [`${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`, t(String(n))]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="space-y-2 mt-1">
          {slices.map(s => (
            <div key={s.name} className="flex items-center gap-2 text-xs">
              <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-muted-foreground flex-1">{t(s.name)}</span>
              <span className="font-bold tabular-nums">{s.value}</span>
              {total > 0 && <span className="text-muted-foreground/60 w-8 text-right">{Math.round((s.value / total) * 100)}%</span>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCell({ value, color }: { value: number; color: string }) {
  return (
    <td className="px-5 py-4">
      <span className={cn("font-bold tabular-nums", value > 0 ? color : "text-muted-foreground/40")}>
        {value.toLocaleString()}
      </span>
    </td>
  );
}
