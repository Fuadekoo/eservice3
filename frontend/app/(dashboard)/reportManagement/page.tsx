"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Search,
  Eye,
  CheckCircle2,
  Archive,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Building2,
  X,
  User,
  Phone,
  Calendar,
  Paperclip,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { useReportStore, type Report, type ReportStatus } from "@/lib/stores/report-store";
import { useOfficeStore } from "@/lib/stores/office-store";
import { PageLayout } from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ReportStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none",
  },
  sent: {
    label: "Sent",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none",
  },
  received: {
    label: "Received",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none",
  },
  read: {
    label: "Read",
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-none",
  },
  archived: {
    label: "Archived",
    className: "bg-gray-500/10 text-gray-500 border-none",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <Badge className={`${cfg.className} px-3 py-1 text-[10px] font-bold uppercase rounded-full`}>
      {cfg.label}
    </Badge>
  );
}

function parseReportSections(description: string) {
  const sections: { title: string; content: string }[] = [];
  const parts = description.split(/^## /m).filter(Boolean);
  for (const part of parts) {
    const newline = part.indexOf("\n");
    if (newline === -1) continue;
    const title = part.slice(0, newline).trim();
    const content = part.slice(newline + 1).trim();
    if (title && content) sections.push({ title, content });
  }
  return sections;
}

// ── View Dialog ───────────────────────────────────────────────────────────────
function ReportViewDialog({
  report,
  open,
  onClose,
}: {
  report: Report | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!report) return null;
  const sections = parseReportSections(report.description);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="size-5 text-primary" />
            {report.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Meta row */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="size-3.5" />
              <span className="font-medium text-foreground">{report.sender?.username ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-3.5" />
              <span>{report.sender?.phoneNumber ?? "—"}</span>
            </div>
            {report.office && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="size-3.5" />
                <span>{report.office.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-3.5" />
              <span>{formatDate(report.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={report.receiverStatus} />
            {report.filesCount > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Paperclip className="size-3" />
                {report.filesCount} file{report.filesCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <hr className="border-border" />

          {sections.length > 0 ? (
            sections.map((s) => (
              <div key={s.title} className="space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {s.content}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {report.description}
            </p>
          )}

          {report.files.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-foreground">Attachments</h4>
              <div className="space-y-1">
                {report.files.map((f) => (
                  <a
                    key={f.id}
                    href={f.filepath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Paperclip className="size-3" />
                    {f.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportManagementPage() {
  const { reports, isLoading, pagination, fetchReports, updateReportStatus } = useReportStore();
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
  const [actioning, setActioning] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchReports({
      page,
      pageSize,
      search: search || undefined,
      officeId: officeFilter !== "all" ? officeFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      month: monthFilter !== "all" ? Number(monthFilter) : undefined,
      year: yearFilter !== "all" ? Number(yearFilter) : undefined,
    });
  }, [page, pageSize, search, officeFilter, statusFilter, monthFilter, yearFilter, fetchReports]);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  useEffect(() => {
    setPage(1);
  }, [search, officeFilter, statusFilter, monthFilter, yearFilter, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkReceived(report: Report) {
    if (actioning) return;
    setActioning(report.id);
    try {
      await updateReportStatus(report.id, "received");
      toast.success("Report marked as received");
    } catch {
      toast.error("Failed to update report status");
    } finally {
      setActioning(null);
    }
  }

  async function handleArchive(report: Report) {
    if (actioning) return;
    setActioning(report.id);
    try {
      await updateReportStatus(report.id, "archived");
      toast.success("Report archived");
    } catch {
      toast.error("Failed to archive report");
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
      title="Report Management"
      description="Review and manage monthly reports submitted by office managers"
      icon={FileText}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {/* ── Filters ───────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search reports, sender…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
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
          <SelectTrigger className="w-[180px]">
            <Building2 className="size-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All offices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Offices</SelectItem>
            {offices.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        {/* Month picker */}
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-35">
            <CalendarDays className="size-4 mr-2 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {["January","February","March","April","May","June","July","August","September","October","November","December"].map((name, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year picker */}
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
          <SelectTrigger className="w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="25">25 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-4 pl-6 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                  Report Name
                </TableHead>
                <TableHead className="py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                  Sent By
                </TableHead>
                <TableHead className="py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                  Office
                </TableHead>
                <TableHead className="py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-center">
                  Files
                </TableHead>
                <TableHead className="py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-center">
                  Status
                </TableHead>
                <TableHead className="py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                  Received Date
                </TableHead>
                <TableHead className="py-4 pr-6 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="size-8 opacity-30" />
                      <span>No reports found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow
                    key={report.id}
                    className="group hover:bg-muted/30 transition-all border-border/50"
                  >
                    {/* Report Name + description excerpt */}
                    <TableCell className="pl-6 py-4">
                      <div className="max-w-[200px]">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">
                          {report.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                          {report.description.replace(/^## .+$/gm, "").trim().slice(0, 80)}
                        </p>
                      </div>
                    </TableCell>

                    {/* Sent By */}
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">
                          {report.sender?.username ?? "—"}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Phone className="size-3" />
                          {report.sender?.phoneNumber ?? "—"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Office */}
                    <TableCell className="py-4">
                      {report.office ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Building2 className="size-3.5 text-primary/60 shrink-0" />
                          <span className="line-clamp-1">{report.office.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    {/* Files */}
                    <TableCell className="py-4 text-center">
                      {report.filesCount > 0 ? (
                        <Badge className="bg-primary/10 text-primary border-none px-2 py-0.5 text-[10px] font-bold rounded-full gap-1">
                          <Paperclip className="size-3" />
                          {report.filesCount}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-4 text-center">
                      <StatusBadge status={report.receiverStatus} />
                    </TableCell>

                    {/* Received Date */}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="size-3.5 text-primary/60 shrink-0" />
                        {formatDate(report.createdAt)}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Mark received */}
                        {report.receiverStatus !== "received" &&
                          report.receiverStatus !== "archived" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-full text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                              title="Mark as received"
                              disabled={actioning === report.id}
                              onClick={() => handleMarkReceived(report)}
                            >
                              {actioning === report.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="size-4" />
                              )}
                            </Button>
                          )}

                        {/* Archive */}
                        {report.receiverStatus !== "archived" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-full text-muted-foreground hover:text-orange-600 hover:bg-orange-500/10 transition-colors"
                            title="Archive"
                            disabled={actioning === report.id}
                            onClick={() => handleArchive(report)}
                          >
                            <Archive className="size-4" />
                          </Button>
                        )}

                        {/* View */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="View report"
                          onClick={() => setViewReport(report)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Pagination ────────────────────────────────────── */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-sm text-muted-foreground">
          <span>
            Showing {from} to {to} of {totalCount} report{totalCount !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-3 py-1 text-sm font-medium">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── View dialog ───────────────────────────────────── */}
      <ReportViewDialog
        report={viewReport}
        open={!!viewReport}
        onClose={() => setViewReport(null)}
      />
    </PageLayout>
  );
}
