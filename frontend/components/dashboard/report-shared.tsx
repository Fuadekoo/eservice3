"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  FileText,
  User,
  Phone,
  Building2,
  Calendar,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Trash2,
  Download,
  Eye,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PdfViewerModal } from "@/components/ui/pdf-viewer-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  REPORT_STATUS_CONFIG,
  getReportFileUrl,
  type ReportStatusKey,
} from "@/lib/report-utils";
import type { Report } from "@/lib/stores/report-store";
import { useTranslation } from "@/lib/i18n";

export function ReportStatusBadge({ status }: { status: ReportStatusKey }) {
  const cfg = REPORT_STATUS_CONFIG[status] ?? REPORT_STATUS_CONFIG.pending;
  return (
    <Badge
      className={cn(
        "rounded-full text-[10px] font-bold border-none px-3 py-1",
        cfg.bg,
        cfg.text,
      )}
    >
      {cfg.label}
    </Badge>
  );
}

type ReportViewTab = "details" | "files";

export function ReportViewDialog({
  report,
  open,
  onClose,
  isLoading = false,
  initialTab = "details",
  footer,
}: {
  report: Report | null;
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  initialTab?: ReportViewTab;
  footer?: React.ReactNode;
}) {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = React.useState<ReportViewTab>(initialTab);
  const [viewingFile, setViewingFile] = React.useState<{
    id: string;
    name: string;
    filepath: string;
  } | null>(null);

  React.useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setViewingFile(null);
    }
  }, [open, initialTab, report?.id]);

  if (!report && !isLoading) return null;

  const fileCount = report?.files.length ?? 0;
  const tabs: { value: ReportViewTab; label: string; badge?: number }[] = [
    { value: "details", label: t("Details") },
    { value: "files", label: t("Files"), badge: fileCount },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
        <DialogContent className="max-w-xl p-0 gap-0 rounded-2xl overflow-hidden flex flex-col">
          <div className="border-b border-border/60 bg-background shrink-0">
            <div className="px-6 pt-5 pb-0">
              <DialogHeader className="mb-4 space-y-0.5">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </div>
                  {t("Report Details")}
                </DialogTitle>
                <DialogDescription className="pl-10">
                  {t("View detailed information about this report")}
                </DialogDescription>
              </DialogHeader>

              <div
                className="flex -mb-px overflow-x-auto scrollbar-hide"
                role="tablist"
              >
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab.value)}
                      className={cn(
                        "flex items-center gap-2 shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                        isActive
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                      )}
                    >
                      {tab.label}
                      {tab.badge !== undefined && (
                        <span
                          className={cn(
                            "inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold",
                            isActive
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 max-h-[60vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : report ? (
              <>
                {activeTab === "details" && (
                  <div className="space-y-5">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                      <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-lg">
                        {(report.sender?.username || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base leading-tight">
                          {report.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="size-3.5" />
                            {report.sender?.username ?? "—"}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="size-3.5" />
                            {report.sender?.phoneNumber ?? "—"}
                          </span>
                        </div>
                      </div>
                      <ReportStatusBadge status={report.receiverStatus} />
                    </div>

                    <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 px-4 py-3">
                      {report.office && (
                        <div className="flex items-start gap-3 py-2 border-b border-border/40">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-muted-foreground">
                            <Building2 className="size-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              {t("Office")}
                            </p>
                            <p className="text-sm font-semibold">
                              {report.office.name}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3 py-2 border-b border-border/40">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-muted-foreground">
                          <Calendar className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("Submitted")}
                          </p>
                          <p className="text-sm font-semibold">
                            {format(new Date(report.createdAt), "MMMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      {report.receiver && (
                        <div className="flex items-start gap-3 py-2 border-b border-border/40">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-muted-foreground">
                            <User className="size-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              {t("Sent To")}
                            </p>
                            <p className="text-sm font-semibold">
                              {report.receiver.username}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3 py-2">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-muted-foreground">
                          <FileText className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("Description")}
                          </p>
                          <p className="text-sm font-semibold whitespace-pre-wrap leading-relaxed">
                            {report.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "files" && (
                  <div className="space-y-3">
                    {fileCount > 0 ? (
                      report.files.map((file, index) => (
                        <div
                          key={file.id}
                          className="rounded-xl border border-border/50 bg-card p-4 space-y-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                              <FileText className="size-4 text-red-500" />
                            </div>
                            <p className="font-semibold text-sm truncate flex-1">
                              {file.name}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold shrink-0"
                            >
                              {t("PDF")}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{t("File")} {index + 1}</span>
                            <span className="mx-1">·</span>
                            <span>
                              {format(new Date(report.createdAt), "M/d/yyyy")}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 pt-1 border-t border-border/40">
                            <button
                              type="button"
                              onClick={() =>
                                setViewingFile({
                                  id: file.id,
                                  name: file.name,
                                  filepath: file.filepath,
                                })
                              }
                              className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                              <Eye className="size-4" />
                              {t("View")}
                            </button>
                            <a
                              href={getReportFileUrl(file.filepath)}
                              download={file.name}
                              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                              <Download className="size-4" />
                              {t("Download")}
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20">
                        <FileText className="size-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm font-semibold text-muted-foreground">
                          {t("No files attached")}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {t("This report does not include a PDF document")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>

          {footer && !isLoading && (
            <div className="shrink-0 border-t border-border bg-muted/30 px-6 py-4">
              <div className="flex flex-wrap justify-end gap-2">{footer}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PdfViewerModal
        open={!!viewingFile}
        onOpenChange={(value) => !value && setViewingFile(null)}
        fileId={viewingFile?.id}
        filepath={viewingFile?.filepath}
        fileName={viewingFile?.name}
      />
    </>
  );
}

export function ReportHistoryList({
  reports,
  emptyTitle,
  emptyDescription,
  onDelete,
  showRecipient = true,
}: {
  reports: Report[];
  emptyTitle: string;
  emptyDescription: string;
  onDelete?: (id: string) => void;
  showRecipient?: boolean;
}) {
  const { t } = useTranslation();

  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [viewingFile, setViewingFile] = React.useState<{
    id: string;
    name: string;
    filepath: string;
  } | null>(null);

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="p-5 bg-muted rounded-2xl">
          <FileText className="size-10 text-muted-foreground" />
        </div>
        <div>
          <p className="font-bold text-lg text-foreground">{emptyTitle}</p>
          <p className="text-sm text-muted-foreground mt-1">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4">
      {reports.map((report) => {
        const isExpanded = expandedId === report.id;
        const primaryFile = report.files[0] ?? null;

        return (
          <Card
            key={report.id}
            className="border-none shadow-sm ring-1 ring-border/50 overflow-hidden"
          >
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
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {report.description}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t("Submitted")} {format(new Date(report.createdAt), "MMM dd, yyyy")}
                    {showRecipient && report.receiver && (
                      <>
                        {" "}
                        · {t("To:")} <strong>{report.receiver.username}</strong>
                      </>
                    )}
                    {primaryFile && (
                      <>
                        {" "}
                        · <Paperclip className="inline size-3" /> {t("PDF")}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <ReportStatusBadge status={report.receiverStatus} />
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(report.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
                {isExpanded ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {isExpanded && (
              <>
                <Separator />
                <div className="p-5 space-y-4 bg-muted/10">
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {report.description}
                  </p>
                  {primaryFile && (
                    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                          <FileText className="size-4 text-red-500" />
                        </div>
                        <p className="font-semibold text-sm truncate flex-1">
                          {primaryFile.name}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold shrink-0"
                        >
                          {t("PDF")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 pt-1 border-t border-border/40">
                        <button
                          type="button"
                          onClick={() =>
                            setViewingFile({
                              id: primaryFile.id,
                              name: primaryFile.name,
                              filepath: primaryFile.filepath,
                            })
                          }
                          className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <Eye className="size-4" />
                          {t("View")}
                        </button>
                        <a
                          href={getReportFileUrl(primaryFile.filepath)}
                          download={primaryFile.name}
                          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          <Download className="size-4" />
                          {t("Download")}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        );
      })}
    </div>

    <PdfViewerModal
      open={!!viewingFile}
      onOpenChange={(value) => !value && setViewingFile(null)}
      fileId={viewingFile?.id}
      filepath={viewingFile?.filepath}
      fileName={viewingFile?.name}
    />
    </>
  );
}
