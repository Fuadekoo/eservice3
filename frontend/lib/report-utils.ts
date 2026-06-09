export const REPORT_MONTHS = [
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
];

export type ReportStatusKey =
  | "pending"
  | "sent"
  | "received"
  | "read"
  | "archived"
  | "approved"
  | "rejected";

export const REPORT_STATUS_CONFIG: Record<
  ReportStatusKey,
  { label: string; bg: string; text: string }
> = {
  pending: {
    label: "Pending Review",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  sent: {
    label: "Submitted",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
  },
  received: {
    label: "Received",
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
  },
  read: {
    label: "Under Review",
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
  },
  archived: {
    label: "Archived",
    bg: "bg-gray-500/10",
    text: "text-gray-500",
  },
};

export function parseReportSections(description: string) {
  const sections: { title: string; content: string }[] = [];
  const raw = description.split(/\n## /);
  raw.forEach((part, index) => {
    const text = index === 0 ? part.replace(/^## /, "") : part;
    const newline = text.indexOf("\n");
    if (newline === -1) return;
    const title = text.substring(0, newline).trim();
    const content = text.substring(newline + 1).trim();
    if (title && content) sections.push({ title, content });
  });
  return sections;
}

export const REPORT_DESCRIPTION_MAX = 500;
export const REPORT_PDF_MAX_BYTES = 10 * 1024 * 1024;

export function buildReportName(role: "staff" | "manager", month: number, year: number) {
  const label = role === "staff" ? "Staff Report" : "Monthly Report";
  return `${label} - ${REPORT_MONTHS[month]} ${year}`;
}

export function getReportFileUrl(filepath: string) {
  if (!filepath) return "";
  if (filepath.startsWith("http")) return filepath;
  return `/api/uploads/${encodeURIComponent(filepath)}`;
}

export function canReviewReport(status: string) {
  return ["pending", "sent", "read"].includes(status);
}
