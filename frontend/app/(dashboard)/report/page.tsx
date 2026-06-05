"use client";

import { type ElementType, useEffect, useMemo } from "react";
import {
  BarChart2,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { useRequestStore } from "@/lib/stores/request-store";
import { useSession } from "@/hooks/use-session";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  sub,
}: {
  label: string;
  value: string | number;
  icon: ElementType;
  color: string;
  bg: string;
  sub?: string;
}) {
  return (
    <Card className="border-none shadow-sm ring-1 ring-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn("p-2.5 rounded-xl shrink-0", bg)}>
            <Icon className={cn("size-5", color)} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-black">{value}</p>
          <p className="text-sm font-medium text-foreground mt-1">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportPage() {
  const { isPending: isSessionPending } = useSession();

  const { requests, isLoading, fetchRequests } = useRequestStore();

  useEffect(() => {
    if (isSessionPending) return;
    fetchRequests({ pageSize: 100 }).catch(() =>
      toast.error("Failed to load report data")
    );
  }, [isSessionPending, fetchRequests]);

  const stats = useMemo(() => {
    const total = requests.length;
    const approved = requests.filter(
      (r) => r.statusbystaff === "approved" && r.statusbyadmin === "approved"
    ).length;
    const rejected = requests.filter(
      (r) => r.statusbystaff === "rejected" || r.statusbyadmin === "rejected"
    ).length;
    const pending = requests.filter(
      (r) =>
        r.statusbyadmin === "pending" &&
        r.statusbystaff !== "rejected"
    ).length;
    const staffApproved = requests.filter(
      (r) => r.statusbystaff === "approved" && r.statusbyadmin === "pending"
    ).length;

    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    const now = new Date();
    const thisMonth = requests.filter((r) => {
      const d = new Date(r.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    // Service breakdown
    const serviceMap: Record<string, number> = {};
    requests.forEach((r) => {
      const name = r.service?.name ?? "Unknown";
      serviceMap[name] = (serviceMap[name] ?? 0) + 1;
    });
    const topServices = Object.entries(serviceMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const recent = [...requests]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    return { total, approved, rejected, pending, staffApproved, approvalRate, thisMonth, topServices, recent };
  }, [requests]);

  const refresh = () => {
    fetchRequests({ pageSize: 100 }).catch(() =>
      toast.error("Failed to refresh report data")
    );
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Office Report"
          description="Analytics and performance summary for your office"
          icon={BarChart2}
        />
        <Button variant="outline" onClick={refresh} className="h-10 rounded-xl shrink-0">
          <RefreshCw className={cn("mr-2 size-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-60">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Requests"
              value={stats.total}
              icon={FileText}
              color="text-primary"
              bg="bg-primary/10"
              sub="All time"
            />
            <StatCard
              label="This Month"
              value={stats.thisMonth}
              icon={TrendingUp}
              color="text-blue-600"
              bg="bg-blue-500/10"
              sub={new Date().toLocaleString("default", { month: "long", year: "numeric" })}
            />
            <StatCard
              label="Approval Rate"
              value={`${stats.approvalRate}%`}
              icon={CheckCircle}
              color="text-emerald-600"
              bg="bg-emerald-500/10"
              sub={`${stats.approved} fully approved`}
            />
            <StatCard
              label="Pending Review"
              value={stats.pending}
              icon={Clock}
              color="text-amber-600"
              bg="bg-amber-500/10"
              sub="Awaiting action"
            />
          </div>

          {/* Status Breakdown + Top Services */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Status Breakdown */}
            <Card className="border-none shadow-sm ring-1 ring-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart2 className="size-4 text-primary" />
                  Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Fully Approved", count: stats.approved, color: "bg-emerald-500", textColor: "text-emerald-600" },
                  { label: "Staff Approved (Awaiting Manager)", count: stats.staffApproved, color: "bg-blue-500", textColor: "text-blue-600" },
                  { label: "Pending", count: stats.pending, color: "bg-amber-500", textColor: "text-amber-600" },
                  { label: "Rejected", count: stats.rejected, color: "bg-red-500", textColor: "text-red-600" },
                ].map(({ label, count, color, textColor }) => {
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-muted-foreground">{label}</span>
                        <span className={cn("font-bold", textColor)}>
                          {count} <span className="text-muted-foreground font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Top Services */}
            <Card className="border-none shadow-sm ring-1 ring-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  Top Services by Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No data available</p>
                ) : (
                  <div className="space-y-3">
                    {stats.topServices.map(([name, count], idx) => {
                      const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                      return (
                        <div key={name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium flex items-center gap-2">
                              <span className="size-5 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="truncate max-w-40">{name}</span>
                            </span>
                            <span className="font-bold text-foreground">{count}</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Requests */}
          <Card className="border-none shadow-sm ring-1 ring-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                Recent Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {stats.recent.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground italic">No requests yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/20">
                        <th className="px-6 py-3 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Customer</th>
                        <th className="px-6 py-3 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Service</th>
                        <th className="px-6 py-3 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                        <th className="px-6 py-3 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent.map((req) => {
                        const isApproved =
                          req.statusbystaff === "approved" && req.statusbyadmin === "approved";
                        const isRejected =
                          req.statusbystaff === "rejected" || req.statusbyadmin === "rejected";
                        const status = isApproved ? "approved" : isRejected ? "rejected" : "pending";

                        return (
                          <tr
                            key={req.id}
                            className="border-b border-border/50 last:border-0 hover:bg-muted/10"
                          >
                            <td className="px-6 py-3 font-medium">{req.user?.username}</td>
                            <td className="px-6 py-3 text-muted-foreground">{req.service?.name}</td>
                            <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">
                              {new Date(req.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-6 py-3">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-semibold text-xs",
                                  status === "approved" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                  status === "rejected" && "bg-red-500/10 text-red-600 border-red-500/20",
                                  status === "pending" && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                )}
                              >
                                {status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending"}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
