"use client";

import * as React from "react";
import {
  FileText,
  Send,
  History,
  Calendar,
  Award,
  Target,
  AlertTriangle,
  BarChart2,
  TrendingUp,
  RefreshCw,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { useSession } from "@/hooks/use-session";
import { useRequestStore } from "@/lib/stores/request-store";
import { useReportStore } from "@/lib/stores/report-store";
import { PageLayout } from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending:  { label: "Pending",  bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400" },
  sent:     { label: "Sent",     bg: "bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400" },
  received: { label: "Received", bg: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400" },
  read:     { label: "Read",     bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  archived: { label: "Archived", bg: "bg-gray-500/10",    text: "text-gray-500" },
};

function parseReportSections(description: string) {
  const sections: { title: string; content: string }[] = [];
  const raw = description.split(/\n## /);
  raw.forEach((part, i) => {
    const text = i === 0 ? part.replace(/^## /, "") : part;
    const nl = text.indexOf("\n");
    if (nl === -1) return;
    const title = text.substring(0, nl).trim();
    const content = text.substring(nl + 1).trim();
    if (title && content) sections.push({ title, content });
  });
  return sections;
}

export default function ReportPage() {
  const { isPending: isSessionPending } = useSession();
  const { requests, fetchRequests } = useRequestStore();
  const {
    reports, isLoading, isSubmitting,
    fetchReports, createReport, deleteReport,
    adminUsers, fetchAdminUsers,
  } = useReportStore();

  const now = new Date();
  const [activeTab, setActiveTab] = React.useState<"submit" | "history">("submit");
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth());
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());
  const [selectedAdminId, setSelectedAdminId] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const [summary, setSummary] = React.useState("");
  const [achievements, setAchievements] = React.useState("");
  const [challenges, setChallenges] = React.useState("");
  const [nextGoals, setNextGoals] = React.useState("");

  React.useEffect(() => {
    if (isSessionPending) return;
    fetchRequests({ pageSize: 200 }).catch(() => {});
    fetchReports();
    fetchAdminUsers();
  }, [isSessionPending, fetchRequests, fetchReports, fetchAdminUsers]);

  React.useEffect(() => {
    if (adminUsers.length > 0 && !selectedAdminId) {
      setSelectedAdminId(adminUsers[0].id);
    }
  }, [adminUsers, selectedAdminId]);

  const monthStats = React.useMemo(() => {
    const subset = requests.filter((r) => {
      const d = new Date(r.createdAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const total = subset.length;
    const approved = subset.filter(
      (r) => r.statusbystaff === "approved" && r.statusbyadmin === "approved"
    ).length;
    const rejected = subset.filter(
      (r) => r.statusbystaff === "rejected" || r.statusbyadmin === "rejected"
    ).length;
    const pending = total - approved - rejected;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { total, approved, rejected, pending, approvalRate };
  }, [requests, selectedMonth, selectedYear]);

  const handleSubmit = async () => {
    if (!summary.trim()) {
      toast.error("Executive summary is required");
      return;
    }
    if (!selectedAdminId) {
      toast.error("Please select a recipient");
      return;
    }

    const reportName = `Monthly Report - ${MONTHS[selectedMonth]} ${selectedYear}`;
    const parts = [
      `## Executive Summary\n${summary.trim()}`,
      achievements.trim() && `## Key Achievements\n${achievements.trim()}`,
      challenges.trim() && `## Challenges & Issues\n${challenges.trim()}`,
      nextGoals.trim() && `## Goals for Next Month\n${nextGoals.trim()}`,
      `## Statistics\nTotal Requests: ${monthStats.total}\nApproved: ${monthStats.approved}\nRejected: ${monthStats.rejected}\nPending: ${monthStats.pending}\nApproval Rate: ${monthStats.approvalRate}%`,
    ].filter(Boolean);

    try {
      await createReport({
        name: reportName,
        description: parts.join("\n\n"),
        reportSentTo: selectedAdminId,
      });
      toast.success("Monthly report submitted successfully");
      setSummary("");
      setAchievements("");
      setChallenges("");
      setNextGoals("");
      setActiveTab("history");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit report");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this report? This action cannot be undone.")) return;
    try {
      await deleteReport(id);
      toast.success("Report deleted");
    } catch {
      toast.error("Failed to delete report");
    }
  };

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  const tabs = [
    { value: "submit" as const, label: "Submit Report", icon: Send },
    { value: "history" as const, label: "Report History", icon: History, badge: reports.length },
  ];

  return (
    <PageLayout
      title="Monthly Report"
      description="Submit and track your office's monthly performance reports"
      icon={FileText}
      actions={
        <Button
          variant="outline"
          onClick={() => {
            fetchReports();
            fetchRequests({ pageSize: 200 });
          }}
          className="h-10 rounded-xl"
        >
          <RefreshCw className={cn("mr-2 size-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      }
    >
      {/* ── Tab Bar ─────────────────────────────── */}
      <div className="flex gap-0 border-b border-border mb-6 -mt-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold",
                    isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Submit Tab ──────────────────────────── */}
      {activeTab === "submit" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form — 2/3 width */}
          <div className="lg:col-span-2 space-y-5">

            {/* Period & Recipient */}
            <Card className="border-none shadow-sm ring-1 ring-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calendar className="size-4 text-primary" />
                  Report Period & Recipient
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select
                    value={String(selectedMonth)}
                    onValueChange={(v) => setSelectedMonth(parseInt(v))}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={String(selectedYear)}
                    onValueChange={(v) => setSelectedYear(parseInt(v))}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedAdminId}
                    onValueChange={setSelectedAdminId}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {adminUsers.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          No admins found
                        </SelectItem>
                      ) : (
                        adminUsers.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.username}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2.5 px-4 py-3 bg-primary/5 rounded-xl">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Title:{" "}
                    <strong className="text-foreground font-bold">
                      Monthly Report — {MONTHS[selectedMonth]} {selectedYear}
                    </strong>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Executive Summary */}
            <Card className="border-none shadow-sm ring-1 ring-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart2 className="size-4 text-primary" />
                  Executive Summary
                  <span className="text-destructive text-sm">*</span>
                </CardTitle>
                <CardDescription>
                  A brief overview of the month's performance and key activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Summarize the key activities, overall performance, and highlights of the month..."
                  className="min-h-28 rounded-xl resize-none"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5 text-right">
                  {summary.length} characters
                </p>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-none shadow-sm ring-1 ring-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Award className="size-4 text-emerald-600" />
                  Key Achievements
                </CardTitle>
                <CardDescription>
                  Notable successes, completed initiatives, and positive outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="• Increased service processing rate by 15%&#10;• Successfully onboarded 3 new staff members&#10;• Completed digital archive project..."
                  className="min-h-24 rounded-xl resize-none"
                />
              </CardContent>
            </Card>

            {/* Challenges */}
            <Card className="border-none shadow-sm ring-1 ring-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-600" />
                  Challenges &amp; Issues
                </CardTitle>
                <CardDescription>
                  Obstacles encountered and actions taken to resolve them
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="• High volume of requests created processing delays&#10;• System downtime on June 14th affected operations..."
                  className="min-h-24 rounded-xl resize-none"
                />
              </CardContent>
            </Card>

            {/* Goals */}
            <Card className="border-none shadow-sm ring-1 ring-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Target className="size-4 text-blue-600" />
                  Goals for Next Month
                </CardTitle>
                <CardDescription>
                  Planned objectives and priorities for the upcoming month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={nextGoals}
                  onChange={(e) => setNextGoals(e.target.value)}
                  placeholder="• Reduce average processing time to under 3 days&#10;• Complete staff training on new system&#10;• Implement customer feedback system..."
                  className="min-h-24 rounded-xl resize-none"
                />
              </CardContent>
            </Card>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !summary.trim() || !selectedAdminId}
              size="lg"
              className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" />
                  Submit Monthly Report
                </>
              )}
            </Button>
          </div>

          {/* Stats Sidebar — 1/3 width */}
          <div className="space-y-5">
            {/* Month stats */}
            <Card className="border-none shadow-sm ring-1 ring-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  {MONTHS[selectedMonth]} {selectedYear} Stats
                </CardTitle>
                <CardDescription className="text-xs">
                  Auto-included with your report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    label: "Total Requests",
                    value: monthStats.total,
                    icon: FileText,
                    color: "text-foreground",
                    bg: "bg-muted",
                  },
                  {
                    label: "Approved",
                    value: monthStats.approved,
                    icon: CheckCircle2,
                    color: "text-emerald-600",
                    bg: "bg-emerald-500/10",
                  },
                  {
                    label: "Pending",
                    value: monthStats.pending,
                    icon: Clock,
                    color: "text-amber-600",
                    bg: "bg-amber-500/10",
                  },
                  {
                    label: "Rejected",
                    value: monthStats.rejected,
                    icon: XCircle,
                    color: "text-red-600",
                    bg: "bg-red-500/10",
                  },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("p-1 rounded-md", bg)}>
                        <Icon className={cn("size-3", color)} />
                      </span>
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                    <span className={cn("text-sm font-black tabular-nums", color)}>
                      {value}
                    </span>
                  </div>
                ))}

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Approval Rate</span>
                  <span className="text-base font-black text-primary">
                    {monthStats.approvalRate}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${monthStats.approvalRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tips card */}
            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg">
              <h3 className="text-sm font-bold mb-2">Report Guidelines</h3>
              <ul className="space-y-1.5 text-xs text-primary-foreground/85">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold shrink-0">·</span>
                  Submit by the 5th of each month
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold shrink-0">·</span>
                  Executive Summary is required
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold shrink-0">·</span>
                  Statistics are included automatically
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold shrink-0">·</span>
                  Be specific about challenges and plans
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── History Tab ─────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="p-5 bg-muted rounded-2xl">
                <FileText className="size-10 text-muted-foreground" />
              </div>
              <div>
                <p className="font-bold text-lg text-foreground">No reports submitted yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Submit your first monthly report to get started
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setActiveTab("submit")}
                className="rounded-xl"
              >
                <Plus className="mr-2 size-4" />
                Submit First Report
              </Button>
            </div>
          ) : (
            reports.map((report) => {
              const isExpanded = expandedId === report.id;
              const sections = parseReportSections(report.description);
              const cfg = STATUS_CONFIG[report.receiverStatus] ?? STATUS_CONFIG.pending;

              return (
                <Card
                  key={report.id}
                  className="border-none shadow-sm ring-1 ring-border/50 overflow-hidden"
                >
                  {/* Header row */}
                  <div
                    className="flex items-center justify-between gap-4 p-5 cursor-pointer hover:bg-muted/20 transition-colors select-none"
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                        <FileText className="size-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">
                          {report.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Submitted{" "}
                          {format(new Date(report.createdAt), "MMM dd, yyyy")}
                          {report.receiver && (
                            <> · To: <strong>{report.receiver.username}</strong></>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={cn(
                          "rounded-full text-[10px] font-bold border-none px-3 py-1",
                          cfg.bg,
                          cfg.text,
                        )}
                      >
                        {cfg.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(report.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <>
                      <Separator />
                      <div className="p-5 space-y-5 bg-muted/10">
                        {sections.length > 0 ? (
                          sections.map(({ title, content }) => (
                            <div key={title}>
                              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                                {title}
                              </p>
                              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                                {content}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                            {report.description}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}
    </PageLayout>
  );
}
