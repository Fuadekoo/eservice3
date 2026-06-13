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
import { PageLayout } from "@/components/dashboard/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type OfficeItem = {
  id: string;
  name: string;
  status: boolean;
  _count?: { service: number; staffs: number; requests?: number; appointments?: number };
};

type SliceItem = { name: string; value: number; color: string };

type Overview = {
  offices: OfficeItem[];
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function getReqOverall(r: any): string {
  if (r.statusbystaff === "rejected" || r.statusbyadmin === "rejected") return "Rejected";
  if (r.statusbystaff === "approved" && r.statusbyadmin === "approved") return "Approved";
  if (r.statusbystaff === "approved") return "Processing";
  return "Pending";
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminOverviewPage() {
  const { isPending: isSessionPending } = useSession();
  const [overview, setOverview] = React.useState<Overview | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatedAt, setUpdatedAt] = React.useState<Date | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [offRes, staffRes, usersRes, reqRes, aptRes] = await Promise.allSettled([
        axiosInstance.get("/offices"),
        axiosInstance.get("/staff", { params: { pageSize: 500 } }),
        axiosInstance.get("/users", { params: { page: 1, pageSize: 1 } }),
        axiosInstance.get("/requests", { params: { pageSize: 500 } }),
        axiosInstance.get("/appointments"),
      ]);

      const offices: OfficeItem[] = (settled(offRes) as any)?.data ?? [];
      const staffList: any[] = (settled(staffRes) as any)?.data ?? [];
      const totalUsers: number = (settled(usersRes) as any)?.pagination?.total ?? 0;
      const reqList: any[] = (settled(reqRes) as any)?.data ?? [];
      const aptList: any[] = (settled(aptRes) as any)?.data ?? [];

      // Prefer _count totals from offices (accurate DB aggregates)
      const totalServices = offices.reduce((s, o) => s + (o._count?.service ?? 0), 0);
      const totalStaff = offices.reduce((s, o) => s + (o._count?.staffs ?? 0), 0) || staffList.length;
      const totalRequests = offices.reduce((s, o) => s + (o._count?.requests ?? 0), 0) || reqList.length;
      const totalAppointments = offices.reduce((s, o) => s + (o._count?.appointments ?? 0), 0) || aptList.length;

      // Staff status slices
      const staffStatus: SliceItem[] = [
        { name: "Active",   value: staffList.filter(s => s.status === "ACTIVE").length,   color: "#10b981" },
        { name: "Inactive", value: staffList.filter(s => s.status === "INACTIVE").length, color: "#6b7280" },
        { name: "Pending",  value: staffList.filter(s => s.status === "PENDING").length,  color: "#f59e0b" },
        { name: "Blocked",  value: staffList.filter(s => s.status === "BLOCKED").length,  color: "#ef4444" },
      ].filter(s => s.value > 0);

      // Request status slices
      const reqCount = { Pending: 0, Processing: 0, Approved: 0, Rejected: 0 };
      reqList.forEach(r => { (reqCount as any)[getReqOverall(r)]++; });
      const requestStatus: SliceItem[] = [
        { name: "Pending",    value: reqCount.Pending,    color: "#f59e0b" },
        { name: "Processing", value: reqCount.Processing, color: "#3b82f6" },
        { name: "Approved",   value: reqCount.Approved,   color: "#10b981" },
        { name: "Rejected",   value: reqCount.Rejected,   color: "#ef4444" },
      ].filter(s => s.value > 0);

      // Appointment status slices
      const aptCount: Record<string, number> = {};
      aptList.forEach(a => { aptCount[a.status] = (aptCount[a.status] ?? 0) + 1; });
      const aptColors: Record<string, string> = { pending: "#f59e0b", approved: "#10b981", completed: "#3b82f6", rejected: "#ef4444", cancelled: "#6b7280" };
      const aptLabels: Record<string, string> = { pending: "Pending", approved: "Confirmed", completed: "Completed", rejected: "Rejected", cancelled: "Cancelled" };
      const appointmentStatus: SliceItem[] = Object.entries(aptCount).map(([k, v]) => ({
        name: aptLabels[k] ?? k, value: v, color: aptColors[k] ?? "#6b7280",
      }));

      // Office bar chart – top 8 by request volume
      const officeChart = offices
        .filter(o => o._count)
        .sort((a, b) => (b._count?.requests ?? 0) - (a._count?.requests ?? 0))
        .slice(0, 8)
        .map(o => ({
          name: o.name.length > 18 ? o.name.slice(0, 16) + "…" : o.name,
          services: o._count?.service ?? 0,
          staff: o._count?.staffs ?? 0,
          requests: o._count?.requests ?? 0,
        }));

      setOverview({ offices, totalUsers, totalStaff, totalServices, totalRequests, totalAppointments, staffStatus, requestStatus, appointmentStatus, officeChart });
      setUpdatedAt(new Date());
    } catch {
      toast.error("Failed to load overview data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isSessionPending) return;
    void load();
  }, [isSessionPending, load]);

  return (
    <PageLayout
      title="Admin Overview"
      description="Real-time system analytics and performance at a glance"
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
      {isLoading && !overview ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading analytics…</p>
        </div>
      ) : overview ? (
        <div className="space-y-6">

          {/* ── KPI Cards ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Offices",      value: overview.offices.length,       icon: Building2,  color: "text-violet-600",  bg: "bg-violet-500/10",  border: "border-violet-500/20" },
              { label: "Staff",        value: overview.totalStaff,            icon: UserCheck,  color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { label: "Users",        value: overview.totalUsers,            icon: Users,      color: "text-blue-600",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
              { label: "Services",     value: overview.totalServices,         icon: Layers,     color: "text-orange-600",  bg: "bg-orange-500/10",  border: "border-orange-500/20" },
              { label: "Requests",     value: overview.totalRequests,         icon: FileText,   color: "text-pink-600",    bg: "bg-pink-500/10",    border: "border-pink-500/20" },
              { label: "Appointments", value: overview.totalAppointments,     icon: Calendar,   color: "text-cyan-600",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20" },
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
              title="Request Status"
              icon={<FileText className="size-4 text-pink-600" />}
              slices={overview.requestStatus}
              empty="No requests yet"
            />
            <DonutCard
              title="Staff Status"
              icon={<UserCheck className="size-4 text-emerald-600" />}
              slices={overview.staffStatus}
              empty="No staff data"
            />
            <DonutCard
              title="Appointment Status"
              icon={<Calendar className="size-4 text-cyan-600" />}
              slices={overview.appointmentStatus}
              empty="No appointments yet"
            />
          </div>

          {/* ── Office Performance Bar Chart ─────────────────────────────── */}
          {overview.officeChart.length > 0 && (
            <Card className="border shadow-sm ring-0 bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="size-4 text-violet-600" />
                  Office Performance
                  <span className="text-xs text-muted-foreground font-normal ml-1">— Services · Staff · Requests</span>
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
                Office Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      {["Office", "Status", "Services", "Staff", "Requests", "Appointments"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground first:pl-6">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overview.offices.map((office, i) => (
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
                            {office.status ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <StatCell value={office._count?.service ?? 0} color="text-orange-600" />
                        <StatCell value={office._count?.staffs ?? 0} color="text-emerald-600" />
                        <StatCell value={office._count?.requests ?? 0} color="text-pink-600" />
                        <StatCell value={office._count?.appointments ?? 0} color="text-cyan-600" />
                      </tr>
                    ))}
                    {overview.offices.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">
                          No offices found
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
  const total = slices.reduce((s, i) => s + i.value, 0);
  return (
    <Card className="border shadow-sm ring-0 bg-card/50 border-border/50">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          {icon} {title}
          {total > 0 && <span className="ml-auto text-xs text-muted-foreground font-normal">{total} total</span>}
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
                formatter={(v: any, n: any) => [`${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`, n]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="space-y-2 mt-1">
          {slices.map(s => (
            <div key={s.name} className="flex items-center gap-2 text-xs">
              <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-muted-foreground flex-1">{s.name}</span>
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
