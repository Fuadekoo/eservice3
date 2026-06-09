"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Search,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Building2,
  X,
  Calendar,
  CalendarDays,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useReportStore, type Report } from "@/lib/stores/report-store";
import { useOfficeStore } from "@/lib/stores/office-store";
import { PageLayout } from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  ReportStatusBadge,
  ReportViewDialog,
} from "@/components/dashboard/report-shared";
import { canReviewReport } from "@/lib/report-utils";
import { useTranslation } from "@/lib/i18n";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ReportManagementPage() {
  const { t } = useTranslation();
  const {
    reports,
    isLoading,
    pagination,
    fetchReports,
    fetchReportById,
    approveReport,
    rejectReport,
  } = useReportStore();
  const { offices, fetchOffices } = useOfficeStore();

  const now = new Date();
  const [search, setSearch] = useState("");
  const [officeFilter, setOfficeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState(String(now.getMonth() + 1));
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()));
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewInitialTab, setViewInitialTab] = useState<"details" | "files">(
    "details",
  );
  const [actioning, setActioning] = useState<string | null>(null);

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

  const load = useCallback(() => {
    fetchReports({
      scope: "inbox",
      page,
      pageSize,
      search: search || undefined,
      officeId: officeFilter !== "all" ? officeFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      month: monthFilter !== "all" ? Number(monthFilter) : undefined,
      year: yearFilter !== "all" ? Number(yearFilter) : undefined,
    });
  }, [
    page,
    pageSize,
    search,
    officeFilter,
    statusFilter,
    monthFilter,
    yearFilter,
    fetchReports,
  ]);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  useEffect(() => {
    setPage(1);
  }, [search, officeFilter, statusFilter, monthFilter, yearFilter, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReview(report: Report, action: "approve" | "reject") {
    if (actioning) return;
    setActioning(report.id);
    try {
      if (action === "approve") {
        await approveReport(report.id);
        toast.success(t("Monthly report approved"));
      } else {
        await rejectReport(report.id);
        toast.success(t("Monthly report rejected"));
      }
      load();
      if (viewReport?.id === report.id) {
        const updated = await fetchReportById(report.id);
        setViewReport(updated);
      }
    } catch {
      toast.error(t("Failed to update report"));
    } finally {
      setActioning(null);
    }
  }

  const totalPages = pagination?.totalPages ?? 1;
  const totalCount = pagination?.total ?? reports.length;
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <PageLayout
      title={t("Report Management")}
      description={t(
        "Review monthly reports submitted by office managers. Approve or reject each submission.",
      )}
      icon={FileText}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={isLoading}
          className="gap-2 rounded-xl"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          {t("Refresh")}
        </Button>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("Search reports or sender...")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Select value={officeFilter} onValueChange={setOfficeFilter}>
          <SelectTrigger className="w-[180px] rounded-xl">
            <Building2 className="size-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t("All offices")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Offices")}</SelectItem>
            {offices.map((office) => (
              <SelectItem key={office.id} value={office.id}>
                {office.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] rounded-xl">
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

        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-36 rounded-xl">
            <CalendarDays className="size-4 mr-2 text-muted-foreground shrink-0" />
            <SelectValue placeholder={t("Month")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Months")}</SelectItem>
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((name, index) => (
              <SelectItem key={name} value={String(index + 1)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[110px] rounded-xl">
            <SelectValue placeholder={t("Year")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Years")}</SelectItem>
            {Array.from({ length: 5 }, (_, index) => now.getFullYear() - index).map(
              (year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>

        <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
          <SelectTrigger className="w-[110px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="25">25 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-4 pl-6">{t("Report")}</TableHead>
                <TableHead className="py-4">{t("Manager")}</TableHead>
                <TableHead className="py-4">{t("Office")}</TableHead>
                <TableHead className="py-4 text-center">{t("Status")}</TableHead>
                <TableHead className="py-4">{t("Submitted")}</TableHead>
                <TableHead className="py-4 pr-6 text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="size-8 opacity-30" />
                      <span>{t("No manager reports waiting for review")}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow
                    key={report.id}
                    className="group hover:bg-muted/30 transition-all border-border/50"
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="max-w-[220px]">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">
                          {report.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                          {report.description}
                        </p>
                        {report.filesCount > 0 && (
                          <p className="text-[10px] text-primary mt-0.5">
                            PDF attached
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm font-medium">
                        {report.sender?.username ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm text-muted-foreground">
                        {report.office?.name ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <ReportStatusBadge status={report.receiverStatus} />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="size-3.5 shrink-0" />
                        {formatDate(report.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(report.files[0] || report.filesCount > 0) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-full text-red-600 hover:text-red-700 hover:bg-red-500/10"
                            title={t("View PDF")}
                            onClick={() => openReportView(report, "files")}
                          >
                            <FileText className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full"
                          title={t("View report")}
                          onClick={() => openReportView(report, "details")}
                        >
                          <Eye className="size-4" />
                        </Button>
                        {canReviewReport(report.receiverStatus) && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                              title={t("Approve")}
                              disabled={actioning === report.id}
                              onClick={() => handleReview(report, "approve")}
                            >
                              {actioning === report.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="size-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-full text-red-600 hover:text-red-700 hover:bg-red-500/10"
                              title={t("Reject")}
                              disabled={actioning === report.id}
                              onClick={() => handleReview(report, "reject")}
                            >
                              <XCircle className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-sm text-muted-foreground">
          <span>
            {t("Showing")} {from} {t("to")} {to} {t("of")} {totalCount}{" "}
            {t("reports")}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-xl"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-3 py-1 text-sm font-medium">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-xl"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <ReportViewDialog
        report={viewReport}
        open={viewOpen}
        isLoading={viewLoading}
        initialTab={viewInitialTab}
        onClose={closeReportView}
        footer={
          viewReport && canReviewReport(viewReport.receiverStatus) ? (
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                disabled={actioning === viewReport.id}
                onClick={() => handleReview(viewReport, "reject")}
              >
                {actioning === viewReport.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="size-4 mr-1.5" />
                    {t("Reject")}
                  </>
                )}
              </Button>
              <Button
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={actioning === viewReport.id}
                onClick={() => handleReview(viewReport, "approve")}
              >
                {actioning === viewReport.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="size-4 mr-1.5" />
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
