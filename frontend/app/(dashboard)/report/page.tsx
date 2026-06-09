"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Send,
  History,
  Calendar,
  RefreshCw,
  Loader2,
  Inbox,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/lib/auth-client";
import { useReportStore } from "@/lib/stores/report-store";
import { PageLayout } from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import {
  REPORT_MONTHS,
  REPORT_DESCRIPTION_MAX,
  buildReportName,
  canReviewReport,
} from "@/lib/report-utils";
import {
  ReportHistoryList,
  ReportStatusBadge,
  ReportViewDialog,
} from "@/components/dashboard/report-shared";
import {
  ReportPdfUpload,
  type ReportPdfFile,
} from "@/components/dashboard/report-pdf-upload";
import { useTranslation } from "@/lib/i18n";

type UserRole = "admin" | "manager" | "staff" | "other";

function resolveRole(roleName?: string): UserRole {
  const role = roleName?.trim().toUpperCase() ?? "";
  if (role === "ADMIN" || role === "ADMINISTRATOR" || role === "SUPERADMIN") {
    return "admin";
  }
  if (role === "MANAGER") return "manager";
  if (role === "STAFF") return "staff";
  return "other";
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

  const now = new Date();
  const [activeTab, setActiveTab] = React.useState<
    "submit" | "inbox" | "history"
  >("submit");
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth());
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());
  const [recipientId, setRecipientId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [pdfFile, setPdfFile] = React.useState<ReportPdfFile | null>(null);
  const [viewReport, setViewReport] = React.useState<(typeof reports)[0] | null>(
    null,
  );
  const [viewLoading, setViewLoading] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [viewInitialTab, setViewInitialTab] = React.useState<
    "details" | "files"
  >("details");
  const [actioningId, setActioningId] = React.useState<string | null>(null);

  const openReportView = async (
    report: (typeof reports)[0],
    tab: "details" | "files" = "details",
  ) => {
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
  };

  const closeReportView = () => {
    setViewOpen(false);
    setViewReport(null);
    setViewLoading(false);
  };

  React.useEffect(() => {
    if (isSessionPending) return;
    if (role === "admin") {
      router.replace("/reportManagement");
    }
  }, [isSessionPending, role, router]);

  React.useEffect(() => {
    if (isSessionPending || role === "admin") return;
    fetchAdminUsers();
    fetchManagerUsers();
  }, [isSessionPending, role, fetchAdminUsers, fetchManagerUsers]);

  React.useEffect(() => {
    if (isSessionPending || role === "admin") return;
    const scope =
      activeTab === "history" ? "sent" : activeTab === "inbox" ? "inbox" : undefined;
    if (scope) {
      fetchReports({ scope, pageSize: 50 });
    }
  }, [activeTab, isSessionPending, role, fetchReports]);

  const recipients =
    role === "staff"
      ? managerUsers
      : role === "manager"
        ? adminUsers
        : [];

  React.useEffect(() => {
    if (recipients.length > 0 && !recipientId) {
      setRecipientId(recipients[0].id);
    }
  }, [recipients, recipientId]);

  const handleSubmit = async () => {
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
    if (!recipientId) {
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
        reportSentTo: recipientId,
        files: [{ name: pdfFile.name, filepath: pdfFile.filepath }],
      });
      toast.success(t("Report submitted successfully"));
      setDescription("");
      setPdfFile(null);
      setActiveTab("history");
      fetchReports({ scope: "sent", pageSize: 50 });
    } catch (err: any) {
      toast.error(err?.message ?? t("Failed to submit report"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("Delete this report? This action cannot be undone."))) return;
    try {
      await deleteReport(id);
      toast.success(t("Report deleted"));
    } catch {
      toast.error(t("Failed to delete report"));
    }
  };

  const handleReview = async (id: string, action: "approve" | "reject") => {
    setActioningId(id);
    try {
      if (action === "approve") {
        await approveReport(id);
        toast.success(t("Report approved"));
      } else {
        await rejectReport(id);
        toast.success(t("Report rejected"));
      }
      fetchReports({ scope: "inbox", pageSize: 50 });
      if (viewReport?.id === id) {
        const updated = await fetchReportById(id);
        setViewReport(updated);
      }
    } catch {
      toast.error(t("Failed to update report"));
    } finally {
      setActioningId(null);
    }
  };

  if (isSessionPending || role === "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const pageTitle =
    role === "staff" ? t("Staff Report") : t("Monthly Report");
  const pageDescription =
    role === "staff"
      ? t("Submit a short description and PDF report to your office manager.")
      : t(
          "Submit your monthly PDF report to administration and review staff submissions.",
        );

  const tabs = [
    { value: "submit" as const, label: t("Submit Report"), icon: Send },
    ...(role === "manager"
      ? [{ value: "inbox" as const, label: t("Staff Reports"), icon: Inbox }]
      : []),
    { value: "history" as const, label: t("Sent Reports"), icon: History },
  ];

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <PageLayout
      title={pageTitle}
      description={pageDescription}
      icon={FileText}
      actions={
        <Button
          variant="outline"
          onClick={() => {
            if (activeTab === "submit") return;
            fetchReports({
              scope: activeTab === "inbox" ? "inbox" : "sent",
              pageSize: 50,
            });
          }}
          className="h-10 rounded-xl"
        >
          <RefreshCw className={cn("mr-2 size-4", isLoading && "animate-spin")} />
          {t("Refresh")}
        </Button>
      }
    >
      <div className="flex gap-0 border-b border-border mb-6 -mt-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
              activeTab === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "submit" && (
        <div className="mx-auto max-w-2xl space-y-5">
          <Card className="border-none shadow-sm ring-1 ring-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                {t("Report Period & Recipient")}
              </CardTitle>
              <CardDescription>
                {t("Choose the reporting period and who should receive this report.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("Month")}</Label>
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_MONTHS.map((month, index) => (
                      <SelectItem key={month} value={String(index)}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("Year")}</Label>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {role === "staff" ? t("Manager") : t("Administrator")}
                </Label>
                <Select value={recipientId} onValueChange={setRecipientId}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue
                      placeholder={
                        role === "staff"
                          ? t("Select manager")
                          : t("Select admin")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {recipients.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        {role === "staff"
                          ? t("No managers found in your office")
                          : t("No administrators found")}
                      </SelectItem>
                    ) : (
                      recipients.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">
                {t("Description")}
                <span className="text-destructive ml-1">*</span>
              </CardTitle>
              <CardDescription>
                {t("A brief summary of what this report covers.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t(
                  "e.g. June activity summary covering completed tasks and key outcomes...",
                )}
                className="min-h-28 rounded-xl resize-none"
                maxLength={REPORT_DESCRIPTION_MAX}
              />
              <p className="text-right text-xs text-muted-foreground">
                {description.length}/{REPORT_DESCRIPTION_MAX}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">
                {t("Report PDF")}
                <span className="text-destructive ml-1">*</span>
              </CardTitle>
              <CardDescription>
                {t("Upload the full report document as a PDF file.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportPdfUpload
                value={pdfFile}
                onChange={setPdfFile}
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !description.trim() ||
              !recipientId ||
              !pdfFile
            }
            size="lg"
            className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("Submitting...")}
              </>
            ) : (
              <>
                <Send className="mr-2 size-4" />
                {t("Submit Report")}
              </>
            )}
          </Button>
        </div>
      )}

      {activeTab === "inbox" && role === "manager" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <ReportHistoryList
              reports={[]}
              emptyTitle={t("No staff reports yet")}
              emptyDescription={t(
                "Reports submitted by your staff will appear here for review.",
              )}
            />
          ) : (
            reports.map((report) => (
              <Card
                key={report.id}
                className="border-none shadow-sm ring-1 ring-border/50 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-foreground">{report.name}</h3>
                      <ReportStatusBadge status={report.receiverStatus} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("From")}{" "}
                      <strong>{report.sender?.username ?? "—"}</strong>
                      {report.office && <> · {report.office.name}</>}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => openReportView(report)}
                    >
                      {t("View")}
                    </Button>
                    {canReviewReport(report.receiverStatus) && (
                      <>
                        <Button
                          size="sm"
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                          disabled={actioningId === report.id}
                          onClick={() => handleReview(report.id, "approve")}
                        >
                          {actioningId === report.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            t("Approve")
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-xl"
                          disabled={actioningId === report.id}
                          onClick={() => handleReview(report.id, "reject")}
                        >
                          {t("Reject")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "history" && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <ReportHistoryList
              reports={reports}
              emptyTitle={t("No reports submitted yet")}
              emptyDescription={t("Your submitted reports will appear here.")}
              onDelete={handleDelete}
            />
          )}
        </>
      )}

      <ReportViewDialog
        report={viewReport}
        open={viewOpen}
        isLoading={viewLoading}
        initialTab={viewInitialTab}
        onClose={closeReportView}
        footer={
          viewReport &&
          role === "manager" &&
          canReviewReport(viewReport.receiverStatus) ? (
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                disabled={actioningId === viewReport.id}
                onClick={() => handleReview(viewReport.id, "reject")}
              >
                <XCircle className="size-4 mr-1.5" />
                {t("Reject")}
              </Button>
              <Button
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={actioningId === viewReport.id}
                onClick={() => handleReview(viewReport.id, "approve")}
              >
                <CheckCircle2 className="size-4 mr-1.5" />
                {t("Approve")}
              </Button>
            </div>
          ) : null
        }
      />
    </PageLayout>
  );
}
