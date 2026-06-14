"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  History,
  Inbox,
  LayoutGrid,
  List,
  Loader2,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageLayout, type PageTab } from "@/components/dashboard/page-layout";
import { PaginationFooter } from "@/components/dashboard/pagination-footer";
import {
  ReportStatusBadge,
  ReportViewDialog,
} from "@/components/dashboard/report-shared";
import {
  ReportPdfUpload,
  type ReportPdfFile,
} from "@/components/dashboard/report-pdf-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n";
import {
  REPORT_DESCRIPTION_MAX,
  REPORT_MONTHS,
  buildReportName,
  canReviewReport,
} from "@/lib/report-utils";
import {
  useReportStore,
  type Report,
  type ReportUser,
} from "@/lib/stores/report-store";
import { cn } from "@/lib/utils";

type UserRole = "admin" | "manager" | "staff" | "other";
type ReportTab = "staff" | "sent";
type ReportViewMode = "card" | "table";
type ReportAction = "approve" | "reject";

function resolveRole(roleName?: string): UserRole {
  const role = roleName?.trim().toUpperCase() ?? "";
  if (role === "ADMIN" || role === "ADMINISTRATOR" || role === "SUPERADMIN") {
    return "admin";
  }
  if (role === "MANAGER") return "manager";
  if (role === "STAFF") return "staff";
  return "other";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(name?: string | null) {
  return (name?.trim().charAt(0) || "R").toUpperCase();
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return undefined;
}

export default function ReportPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: sessionData, isPending: isSessionPending } = useSession();
  const role = resolveRole(sessionData?.session?.role?.name);

  const {
    reports,
    isLoading,
    isSubmitting,
    pagination,
    fetchReports,
    fetchReportById,
    createReport,
    deleteReport,
    approveReport,
    rejectReport,
    adminUsers,
    managerUsers,
    fetchAdminUsers,
    fetchManagerUsers,
  } = useReportStore();

  const now = React.useMemo(() => new Date(), []);
  const [activeTab, setActiveTab] = React.useState<ReportTab>("staff");
  const [viewMode, setViewMode] = React.useState<ReportViewMode>("table");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth());
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());
  const [recipientId, setRecipientId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [pdfFile, setPdfFile] = React.useState<ReportPdfFile | null>(null);
  const [viewReport, setViewReport] = React.useState<Report | null>(null);
  const [viewLoading, setViewLoading] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [viewInitialTab, setViewInitialTab] = React.useState<
    "details" | "files"
  >("details");
  const [actioningId, setActioningId] = React.useState<string | null>(null);

  const recipients =
    role === "staff"
      ? managerUsers
      : role === "manager"
        ? adminUsers
        : [];

  const effectiveTab: ReportTab = role === "manager" ? activeTab : "sent";
  const effectiveRecipientId = recipients.some((user) => user.id === recipientId)
    ? recipientId
    : (recipients[0]?.id ?? "");
  const currentScope =
    effectiveTab === "sent" || role !== "manager" ? "sent" : "inbox";

  const loadReports = React.useCallback(() => {
    if (isSessionPending || role === "admin") return;
    void fetchReports({
      scope: currentScope,
      page,
      pageSize,
      search: search.trim() || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    });
  }, [
    currentScope,
    fetchReports,
    isSessionPending,
    page,
    pageSize,
    role,
    search,
    statusFilter,
  ]);

  React.useEffect(() => {
    if (isSessionPending) return;
    if (role === "admin") {
      router.replace("/reportManagement");
    }
  }, [isSessionPending, role, router]);

  React.useEffect(() => {
    if (isSessionPending || role === "admin") return;
    void fetchAdminUsers();
    void fetchManagerUsers();
  }, [fetchAdminUsers, fetchManagerUsers, isSessionPending, role]);

  React.useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function openReportView(
    report: Report,
    tab: "details" | "files" = "details",
  ) {
    setViewInitialTab(tab);
    setViewOpen(true);
    setViewReport(report);
    setViewLoading(true);
    try {
      const fullReport = await fetchReportById(report.id);
      setViewReport(fullReport);
    } catch {
      toast.error(t("Failed to load report details"));
      setViewOpen(false);
      setViewReport(null);
    } finally {
      setViewLoading(false);
    }
  }

  function closeReportView() {
    setViewOpen(false);
    setViewReport(null);
    setViewLoading(false);
  }

  async function handleSubmit() {
    const trimmed = description.trim();
    if (!trimmed) {
      toast.error(t("Please add a short description"));
      return;
    }
    if (trimmed.length > REPORT_DESCRIPTION_MAX) {
      toast.error(
        t(`Description must be ${REPORT_DESCRIPTION_MAX} characters or fewer`),
      );
      return;
    }
    if (!effectiveRecipientId) {
      toast.error(t("Please select a recipient"));
      return;
    }
    if (!pdfFile) {
      toast.error(t("Please upload a PDF report file"));
      return;
    }

    const reportRole = role === "staff" ? "staff" : "manager";

    try {
      await createReport({
        name: buildReportName(reportRole, selectedMonth, selectedYear),
        description: trimmed,
        reportSentTo: effectiveRecipientId,
        files: [{ name: pdfFile.name, filepath: pdfFile.filepath }],
      });
      toast.success(t("Report submitted successfully"));
      setDescription("");
      setPdfFile(null);
      setSendOpen(false);
      setActiveTab("sent");
      setPage(1);
      void fetchReports({ scope: "sent", page: 1, pageSize });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) ?? t("Failed to submit report"));
    }
  }

  async function handleDelete(report: Report) {
    if (!confirm(t("Delete this report? This action cannot be undone."))) return;
    try {
      await deleteReport(report.id);
      toast.success(t("Report deleted"));
      loadReports();
    } catch {
      toast.error(t("Failed to delete report"));
    }
  }

  async function handleReview(report: Report, action: ReportAction) {
    if (actioningId) return;
    setActioningId(report.id);
    try {
      if (action === "approve") {
        await approveReport(report.id);
        toast.success(t("Report approved"));
      } else {
        await rejectReport(report.id);
        toast.success(t("Report rejected"));
      }
      loadReports();
      if (viewReport?.id === report.id) {
        const updated = await fetchReportById(report.id);
        setViewReport(updated);
      }
    } catch {
      toast.error(t("Failed to update report"));
    } finally {
      setActioningId(null);
    }
  }

  if (isSessionPending || role === "admin") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const isStaffTab = effectiveTab === "staff" && role === "manager";
  const totalCount = pagination?.total ?? reports.length;
  const totalPages = pagination?.totalPages ?? 1;
  const pendingCount = reports.filter((report) =>
    canReviewReport(report.receiverStatus),
  ).length;

  const tabs: PageTab[] = [
    ...(role === "manager"
      ? [
          {
            label: t("Staff Reports"),
            value: "staff",
            badge: isStaffTab && pendingCount > 0 ? pendingCount : undefined,
          },
        ]
      : []),
    {
      label: t("Sent Reports"),
      value: "sent",
      badge: effectiveTab === "sent" && totalCount > 0 ? totalCount : undefined,
    },
  ];

  const pageTitle = role === "staff" ? t("Staff Report") : t("Reports");
  const pageDescription =
    role === "manager"
      ? t("Review staff submissions and send monthly reports to administration.")
      : t("Send staff reports to your office manager and track your submissions.");

  return (
    <PageLayout
      title={pageTitle}
      description={pageDescription}
      icon={FileText}
      tabs={tabs}
      activeTab={effectiveTab}
      onTabChange={(value) => {
        setActiveTab(value as ReportTab);
        setPage(1);
      }}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {effectiveTab === "sent" && (
            <Button
              onClick={() => setSendOpen(true)}
              className="h-10 rounded-xl px-4 font-bold shadow-lg shadow-primary/20"
            >
              <Plus className="size-4" />
              {t("Send Report")}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={loadReports}
            disabled={isLoading}
            className="h-10 rounded-xl"
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            {t("Refresh")}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <ReportSummaryCards
          reports={reports}
          isStaffTab={isStaffTab}
          totalCount={totalCount}
          t={t}
        />

        <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={
                  isStaffTab
                    ? t("Search staff reports...")
                    : t("Search sent reports...")
                }
                className="h-10 rounded-xl border-none bg-background pl-9 pr-9 ring-1 ring-border/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={t("Clear search")}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-full rounded-xl sm:w-[180px]">
                <SelectValue placeholder={t("All statuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Statuses")}</SelectItem>
                <SelectItem value="pending">{t("Pending Review")}</SelectItem>
                <SelectItem value="read">{t("Under Review")}</SelectItem>
                <SelectItem value="approved">{t("Approved")}</SelectItem>
                <SelectItem value="rejected">{t("Rejected")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-fit items-center gap-1 rounded-xl border border-border/50 bg-background p-1">
            <Button
              type="button"
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => setViewMode("card")}
              title={t("Card view")}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => setViewMode("table")}
              title={t("Table view")}
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : reports.length === 0 ? (
          <ReportEmptyState
            activeTab={effectiveTab}
            role={role}
            hasFilters={Boolean(search.trim()) || statusFilter !== "all"}
            onSend={() => setSendOpen(true)}
            t={t}
          />
        ) : viewMode === "table" ? (
          <ReportTable
            reports={reports}
            isStaffTab={isStaffTab}
            actioningId={actioningId}
            onView={openReportView}
            onReview={handleReview}
            onDelete={handleDelete}
            t={t}
          />
        ) : (
          <ReportCards
            reports={reports}
            isStaffTab={isStaffTab}
            actioningId={actioningId}
            onView={openReportView}
            onReview={handleReview}
            onDelete={handleDelete}
            t={t}
          />
        )}

        {totalCount > 0 && !isLoading && (
          <PaginationFooter
            currentPage={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={totalCount}
            startIndex={(page - 1) * pageSize}
            endIndex={Math.min(page * pageSize, totalCount)}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            canGoNext={page < totalPages}
            canGoPrevious={page > 1}
            itemLabel={t("reports")}
          />
        )}
      </div>

      <SendReportDialog
        open={sendOpen}
        role={role}
        recipients={recipients}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        recipientId={effectiveRecipientId}
        description={description}
        pdfFile={pdfFile}
        isSubmitting={isSubmitting}
        onOpenChange={setSendOpen}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onRecipientChange={setRecipientId}
        onDescriptionChange={setDescription}
        onPdfChange={setPdfFile}
        onSubmit={handleSubmit}
        t={t}
      />

      <ReportViewDialog
        report={viewReport}
        open={viewOpen}
        isLoading={viewLoading}
        initialTab={viewInitialTab}
        onClose={closeReportView}
        footer={
          viewReport && isStaffTab && canReviewReport(viewReport.receiverStatus) ? (
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                disabled={actioningId === viewReport.id}
                onClick={() => handleReview(viewReport, "reject")}
              >
                {actioningId === viewReport.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="size-4" />
                    {t("Reject")}
                  </>
                )}
              </Button>
              <Button
                className="flex-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={actioningId === viewReport.id}
                onClick={() => handleReview(viewReport, "approve")}
              >
                {actioningId === viewReport.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    {t("Approve")}
                  </>
                )}
              </Button>
            </div>
          ) : null
        }
      />
    </PageLayout>
  );
}

function ReportSummaryCards({
  reports,
  isStaffTab,
  totalCount,
  t,
}: {
  reports: Report[];
  isStaffTab: boolean;
  totalCount: number;
  t: (key: string, defaultValue?: string) => string;
}) {
  const pending = reports.filter((report) =>
    canReviewReport(report.receiverStatus),
  ).length;
  const approved = reports.filter(
    (report) => report.receiverStatus === "approved",
  ).length;
  const rejected = reports.filter(
    (report) => report.receiverStatus === "rejected",
  ).length;

  const items = [
    {
      label: isStaffTab ? t("Staff Reports") : t("Sent Reports"),
      value: totalCount,
      icon: isStaffTab ? Inbox : History,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: t("Pending"),
      value: pending,
      icon: Calendar,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      label: t("Approved"),
      value: approved,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      label: t("Rejected"),
      value: rejected,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, color, bg }) => (
        <Card
          key={label}
          className="border-none bg-card/60 shadow-sm ring-1 ring-border/50"
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                bg,
              )}
            >
              <Icon className={cn("size-5", color)} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black leading-none">{value}</p>
              <p className="mt-1 truncate text-xs font-bold text-muted-foreground">
                {label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReportTable({
  reports,
  isStaffTab,
  actioningId,
  onView,
  onReview,
  onDelete,
  t,
}: {
  reports: Report[];
  isStaffTab: boolean;
  actioningId: string | null;
  onView: (report: Report, tab?: "details" | "files") => void;
  onReview: (report: Report, action: ReportAction) => void;
  onDelete: (report: Report) => void;
  t: (key: string, defaultValue?: string) => string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[280px] py-4 pl-5">
              {t("Report")}
            </TableHead>
            <TableHead className="min-w-[160px] py-4">
              {isStaffTab ? t("Staff") : t("Recipient")}
            </TableHead>
            <TableHead className="min-w-[160px] py-4">{t("Office")}</TableHead>
            <TableHead className="py-4">{t("Status")}</TableHead>
            <TableHead className="min-w-[150px] py-4">
              {isStaffTab ? t("Submitted") : t("Sent")}
            </TableHead>
            <TableHead className="py-4 pr-5 text-right">
              {t("Actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const person = isStaffTab ? report.sender : report.receiver;
            const canReview = isStaffTab && canReviewReport(report.receiverStatus);
            return (
              <TableRow
                key={report.id}
                className="border-border/50 hover:bg-muted/20"
              >
                <TableCell className="py-4 pl-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-bold">
                        {report.name}
                      </p>
                      <p className="mt-0.5 line-clamp-1 max-w-[360px] text-xs text-muted-foreground">
                        {report.description}
                      </p>
                      {report.filesCount > 0 && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-primary">
                          <Paperclip className="size-3" />
                          {t("PDF attached")}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <UserLine user={person} />
                </TableCell>
                <TableCell className="py-4">
                  <span className="text-sm text-muted-foreground">
                    {report.office?.name ?? "-"}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <ReportStatusBadge status={report.receiverStatus} />
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="size-3.5" />
                    {formatDate(report.createdAt)}
                  </div>
                </TableCell>
                <TableCell className="py-4 pr-5">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg"
                      title={t("View report")}
                      onClick={() => onView(report, "details")}
                    >
                      <Eye className="size-4" />
                    </Button>
                    {report.filesCount > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-red-600 hover:bg-red-500/10 hover:text-red-700"
                        title={t("View PDF")}
                        onClick={() => onView(report, "files")}
                      >
                        <FileText className="size-4" />
                      </Button>
                    )}
                    {canReview && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                          title={t("Approve")}
                          disabled={actioningId === report.id}
                          onClick={() => onReview(report, "approve")}
                        >
                          {actioningId === report.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-red-600 hover:bg-red-500/10 hover:text-red-700"
                          title={t("Reject")}
                          disabled={actioningId === report.id}
                          onClick={() => onReview(report, "reject")}
                        >
                          <XCircle className="size-4" />
                        </Button>
                      </>
                    )}
                    {!isStaffTab && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                        title={t("Delete")}
                        onClick={() => onDelete(report)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ReportCards({
  reports,
  isStaffTab,
  actioningId,
  onView,
  onReview,
  onDelete,
  t,
}: {
  reports: Report[];
  isStaffTab: boolean;
  actioningId: string | null;
  onView: (report: Report, tab?: "details" | "files") => void;
  onReview: (report: Report, action: ReportAction) => void;
  onDelete: (report: Report) => void;
  t: (key: string, defaultValue?: string) => string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {reports.map((report) => {
        const person = isStaffTab ? report.sender : report.receiver;
        const canReview = isStaffTab && canReviewReport(report.receiverStatus);

        return (
          <Card
            key={report.id}
            className="group flex h-full flex-col overflow-hidden border-none bg-card/70 shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-primary/25"
          >
            <CardHeader className="p-5 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="line-clamp-2 text-base font-black leading-snug group-hover:text-primary">
                      {report.name}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1.5 text-xs">
                      <Calendar className="size-3.5" />
                      {formatLongDate(report.createdAt)}
                    </CardDescription>
                  </div>
                </div>
                <ReportStatusBadge status={report.receiverStatus} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 p-5 pt-0">
              <p className="line-clamp-3 min-h-[60px] text-sm leading-relaxed text-muted-foreground">
                {report.description}
              </p>

              <div className="grid gap-2 rounded-xl border border-border/50 bg-muted/20 p-3">
                <InfoLine
                  icon={User}
                  label={isStaffTab ? t("From") : t("To")}
                  value={person?.username ?? "-"}
                />
                <InfoLine
                  icon={Building2}
                  label={t("Office")}
                  value={report.office?.name ?? "-"}
                />
                <InfoLine
                  icon={Paperclip}
                  label={t("Files")}
                  value={
                    report.filesCount > 0
                      ? t("PDF attached")
                      : t("No files attached")
                  }
                />
              </div>

              <div className="mt-auto flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="h-9 flex-1 rounded-xl font-bold"
                  onClick={() => onView(report, "details")}
                >
                  <Eye className="size-4" />
                  {t("View")}
                </Button>
                {report.filesCount > 0 && (
                  <Button
                    variant="outline"
                    className="h-9 rounded-xl px-3 text-red-600 hover:bg-red-500/10 hover:text-red-700"
                    onClick={() => onView(report, "files")}
                    title={t("View PDF")}
                  >
                    <FileText className="size-4" />
                  </Button>
                )}
                {canReview && (
                  <>
                    <Button
                      className="h-9 flex-1 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                      disabled={actioningId === report.id}
                      onClick={() => onReview(report, "approve")}
                    >
                      {actioningId === report.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="size-4" />
                          {t("Approve")}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-9 flex-1 rounded-xl font-bold"
                      disabled={actioningId === report.id}
                      onClick={() => onReview(report, "reject")}
                    >
                      <XCircle className="size-4" />
                      {t("Reject")}
                    </Button>
                  </>
                )}
                {!isStaffTab && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(report)}
                    title={t("Delete")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SendReportDialog({
  open,
  role,
  recipients,
  selectedMonth,
  selectedYear,
  recipientId,
  description,
  pdfFile,
  isSubmitting,
  onOpenChange,
  onMonthChange,
  onYearChange,
  onRecipientChange,
  onDescriptionChange,
  onPdfChange,
  onSubmit,
  t,
}: {
  open: boolean;
  role: UserRole;
  recipients: ReportUser[];
  selectedMonth: number;
  selectedYear: number;
  recipientId: string;
  description: string;
  pdfFile: ReportPdfFile | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onRecipientChange: (recipientId: string) => void;
  onDescriptionChange: (description: string) => void;
  onPdfChange: (file: ReportPdfFile | null) => void;
  onSubmit: () => void;
  t: (key: string, defaultValue?: string) => string;
}) {
  const now = new Date();
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const recipientLabel =
    role === "staff" ? t("Manager") : t("Administrator");
  const recipientEmpty =
    role === "staff"
      ? t("No managers found in your office")
      : t("No administrators found");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl gap-0 overflow-hidden rounded-2xl p-0">
        <div className="border-b border-border/60 bg-muted/25 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Send className="size-4" />
              </span>
              {role === "staff"
                ? t("Send Staff Report")
                : t("Send Report to Admin")}
            </DialogTitle>
            <DialogDescription>
              {role === "staff"
                ? t("Submit your report PDF to your office manager.")
                : t("Submit the monthly report PDF to administration.")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[calc(92vh-154px)] space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{t("Month")}</Label>
              <Select
                value={String(selectedMonth)}
                onValueChange={(value) => onMonthChange(Number(value))}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_MONTHS.map((month, index) => (
                    <SelectItem key={month} value={String(index)}>
                      {t(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("Year")}</Label>
              <Select
                value={String(selectedYear)}
                onValueChange={(value) => onYearChange(Number(value))}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{recipientLabel}</Label>
              <Select
                value={recipientId}
                onValueChange={onRecipientChange}
                disabled={recipients.length === 0}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder={recipientLabel} />
                </SelectTrigger>
                <SelectContent>
                  {recipients.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {recipients.length === 0 && (
                <p className="text-xs text-destructive">{recipientEmpty}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>
                {t("Description")}
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <span className="text-xs font-medium text-muted-foreground">
                {description.length}/{REPORT_DESCRIPTION_MAX}
              </span>
            </div>
            <Textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder={t(
                "Write a short summary of completed work, outcomes, and key notes.",
              )}
              className="min-h-32 resize-none rounded-xl"
              maxLength={REPORT_DESCRIPTION_MAX}
            />
          </div>

          <div className="space-y-2">
            <Label>
              {t("Report PDF")}
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <ReportPdfUpload
              value={pdfFile}
              onChange={onPdfChange}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter className="m-0 flex-row justify-end rounded-none px-6 py-4">
          <Button
            variant="outline"
            className="rounded-xl"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            {t("Cancel")}
          </Button>
          <Button
            className="rounded-xl font-bold"
            disabled={
              isSubmitting ||
              recipients.length === 0 ||
              !recipientId ||
              !description.trim() ||
              !pdfFile
            }
            onClick={onSubmit}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {isSubmitting ? t("Submitting...") : t("Send Report")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReportEmptyState({
  activeTab,
  role,
  hasFilters,
  onSend,
  t,
}: {
  activeTab: ReportTab;
  role: UserRole;
  hasFilters: boolean;
  onSend: () => void;
  t: (key: string, defaultValue?: string) => string;
}) {
  const isSent = activeTab === "sent";
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/70 bg-muted/10 px-6 py-20 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border/60">
        {isSent ? (
          <History className="size-8 text-muted-foreground/50" />
        ) : (
          <Inbox className="size-8 text-muted-foreground/50" />
        )}
      </div>
      <p className="text-lg font-black">
        {hasFilters
          ? t("No reports match your filters")
          : isSent
            ? t("No sent reports yet")
            : t("No staff reports yet")}
      </p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {hasFilters
          ? t("Try adjusting the search or status filter.")
          : isSent
            ? role === "staff"
              ? t("Send your first staff report to your office manager.")
              : t("Send your first monthly report to administration.")
            : t("Staff submissions will appear here for review.")}
      </p>
      {isSent && !hasFilters && (
        <Button className="mt-6 rounded-xl font-bold" onClick={onSend}>
          <Plus className="size-4" />
          {t("Send Report")}
        </Button>
      )}
    </div>
  );
}

function UserLine({ user }: { user?: ReportUser | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-black text-muted-foreground">
        {getInitials(user?.username)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{user?.username ?? "-"}</p>
        {user?.phoneNumber && (
          <p className="truncate text-xs text-muted-foreground">
            {user.phoneNumber}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="w-16 shrink-0 text-xs font-bold uppercase text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 truncate font-semibold">{value}</span>
    </div>
  );
}
