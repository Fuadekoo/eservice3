import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * PDF report generation for the overview dashboards.
 *
 * Everything here runs in the browser and downloads the finished file
 * directly — no server round trip, no print dialog.
 *
 * ## Why a font is loaded at runtime
 *
 * jsPDF's built-in fonts are Latin-1 only, so Amharic renders as blank boxes
 * with them. This system is trilingual, and a report generated with the
 * interface in Amharic must be readable. Noto Sans Ethiopic covers Ge'ez,
 * Latin, digits and punctuation in one face, so a single embedded font serves
 * all three languages. It is fetched from /fonts on the first report and kept
 * for the rest of the session; 360 KB is not worth putting in the main bundle
 * for a feature most visits never use.
 */

/** Page geometry, in millimetres. A4 portrait. */
const PAGE = { width: 210, height: 297, margin: 14 };
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;

/** Ethiopian government green, matching the dashboard's primary colour. */
const BRAND: [number, number, number] = [4, 120, 87];
const INK: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [107, 114, 128];
const RULE: [number, number, number] = [229, 231, 235];
const ZEBRA: [number, number, number] = [249, 250, 251];

const FONT_FAMILY = "NotoSansEthiopic";
const FONT_FILES = {
  normal: "/fonts/NotoSansEthiopic-Regular.ttf",
  bold: "/fonts/NotoSansEthiopic-Bold.ttf",
} as const;

/** Cached across reports so the second one costs nothing. */
let fontCache: Promise<Record<"normal" | "bold", string>> | null = null;

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // btoa takes a binary string, and spreading a 360 KB array into
  // String.fromCharCode overflows the call stack — so it goes in chunks.
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

async function loadFonts() {
  if (!fontCache) {
    fontCache = (async () => {
      const [normal, bold] = await Promise.all(
        [FONT_FILES.normal, FONT_FILES.bold].map(async (url) => {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Could not load ${url}`);
          return toBase64(await response.arrayBuffer());
        }),
      );
      return { normal: normal!, bold: bold! };
    })();

    // A failed fetch must not poison every later attempt.
    fontCache.catch(() => {
      fontCache = null;
    });
  }
  return fontCache;
}

// ── Report description ───────────────────────────────────────────────────────

/** One headline figure on the summary strip. */
export type ReportStat = {
  label: string;
  value: string | number;
  /** Optional second line, e.g. "62% of all requests". */
  hint?: string;
};

/** A table of records. Columns are drawn in the order given. */
export type ReportTable = {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  /** Shown in place of the table when there are no rows. */
  emptyMessage?: string;
};

/** A labelled breakdown, drawn as a bar per entry. */
export type ReportBreakdown = {
  title: string;
  items: { label: string; value: number; color?: string }[];
};

export type ReportDocument = {
  /** Headline, e.g. "Office Performance Report". */
  title: string;
  /** The office or account the report covers. */
  subtitle?: string;
  /** Inclusive reporting period. */
  range: { from: Date; to: Date };
  /** Who asked for it — printed in the footer for accountability. */
  generatedBy?: string;
  stats?: ReportStat[];
  breakdowns?: ReportBreakdown[];
  tables?: ReportTable[];
  /** Base filename, without the .pdf extension. */
  fileName: string;
  /** Translator, so the furniture matches the interface language. */
  t?: (key: string) => string;
};

// ── Drawing helpers ──────────────────────────────────────────────────────────

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function hexToRgb(hex?: string): [number, number, number] {
  const fallback: [number, number, number] = BRAND;
  if (!hex) return fallback;
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return fallback;
  const int = parseInt(match[1]!, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/**
 * The masthead: brand bar, title, period, and who generated it.
 *
 * @returns the y coordinate where body content may start.
 */
function drawHeader(doc: jsPDF, report: ReportDocument, t: (k: string) => string) {
  const { margin } = PAGE;

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PAGE.width, 3, "F");

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(17);
  doc.setTextColor(...INK);
  doc.text(report.title, margin, 20);

  let y = 26;
  if (report.subtitle) {
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...BRAND);
    doc.text(report.subtitle, margin, y);
    y += 6;
  }

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `${t("Reporting period")}: ${formatDate(report.range.from)} — ${formatDate(report.range.to)}`,
    margin,
    y,
  );
  y += 4.6;

  const stamp = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const by = report.generatedBy ? ` · ${t("Prepared by")} ${report.generatedBy}` : "";
  doc.text(`${t("Generated")} ${stamp}${by}`, margin, y);
  y += 5;

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.line(margin, y, PAGE.width - margin, y);

  return y + 8;
}

/** Headline figures, laid out four to a row. */
function drawStats(doc: jsPDF, stats: ReportStat[], startY: number) {
  const perRow = 4;
  const gap = 4;
  const cardWidth = (CONTENT_WIDTH - gap * (perRow - 1)) / perRow;
  const cardHeight = 20;
  let y = startY;

  stats.forEach((stat, index) => {
    const column = index % perRow;
    if (column === 0 && index > 0) y += cardHeight + gap;

    const x = PAGE.margin + column * (cardWidth + gap);

    doc.setFillColor(...ZEBRA);
    doc.setDrawColor(...RULE);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD");

    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(stat.label.toUpperCase(), x + 3.5, y + 6, {
      maxWidth: cardWidth - 7,
    });

    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(15);
    doc.setTextColor(...INK);
    doc.text(String(stat.value), x + 3.5, y + 14);

    if (stat.hint) {
      doc.setFont(FONT_FAMILY, "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED);
      doc.text(stat.hint, x + 3.5, y + 17.5, { maxWidth: cardWidth - 7 });
    }
  });

  return y + cardHeight + 10;
}

/** A breakdown as proportional bars — a chart the PDF can draw natively. */
function drawBreakdown(
  doc: jsPDF,
  breakdown: ReportBreakdown,
  startY: number,
  t: (k: string) => string,
) {
  let y = ensureSpace(doc, startY, 18 + breakdown.items.length * 7);

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(breakdown.title, PAGE.margin, y);
  y += 6;

  const total = breakdown.items.reduce((sum, item) => sum + item.value, 0);
  const labelWidth = 52;
  const barWidth = CONTENT_WIDTH - labelWidth - 24;

  if (total === 0) {
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(t("No activity in this period."), PAGE.margin, y + 2);
    return y + 10;
  }

  breakdown.items.forEach((item) => {
    const share = item.value / total;

    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(item.label, PAGE.margin, y + 3, { maxWidth: labelWidth - 3 });

    doc.setFillColor(...RULE);
    doc.roundedRect(PAGE.margin + labelWidth, y, barWidth, 4, 1, 1, "F");

    if (share > 0) {
      doc.setFillColor(...hexToRgb(item.color));
      doc.roundedRect(
        PAGE.margin + labelWidth,
        y,
        Math.max(barWidth * share, 1.5),
        4,
        1,
        1,
        "F",
      );
    }

    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(
      `${item.value}  (${Math.round(share * 100)}%)`,
      PAGE.margin + labelWidth + barWidth + 3,
      y + 3.4,
    );

    y += 7;
  });

  return y + 6;
}

/** Start a new page when `needed` millimetres will not fit below `y`. */
function ensureSpace(doc: jsPDF, y: number, needed: number) {
  if (y + needed > PAGE.height - 20) {
    doc.addPage();
    return PAGE.margin + 6;
  }
  return y;
}

function drawTable(doc: jsPDF, table: ReportTable, startY: number, t: (k: string) => string) {
  let y = ensureSpace(doc, startY, 24);

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(table.title, PAGE.margin, y);
  y += 4;

  if (table.rows.length === 0) {
    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(table.emptyMessage ?? t("Nothing recorded in this period."), PAGE.margin, y + 4);
    return y + 12;
  }

  autoTable(doc, {
    startY: y,
    head: [table.columns],
    body: table.rows.map((row) => row.map((cell) => String(cell ?? "—"))),
    margin: { left: PAGE.margin, right: PAGE.margin },
    styles: {
      font: FONT_FAMILY,
      fontStyle: "normal",
      fontSize: 8.5,
      cellPadding: 2.2,
      textColor: INK,
      lineColor: RULE,
      lineWidth: 0.1,
    },
    headStyles: {
      font: FONT_FAMILY,
      fontStyle: "bold",
      fillColor: BRAND,
      textColor: [255, 255, 255],
      fontSize: 8.5,
    },
    alternateRowStyles: { fillColor: ZEBRA },
    // The table may run past the bottom; autoTable paginates it for us.
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
}

/** Page numbers and provenance, stamped on every page once the body is done. */
function drawFooters(doc: jsPDF, report: ReportDocument, t: (k: string) => string) {
  const total = doc.getNumberOfPages();

  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);

    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin, PAGE.height - 14, PAGE.width - PAGE.margin, PAGE.height - 14);

    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(report.title, PAGE.margin, PAGE.height - 9);
    doc.text(
      `${t("Page")} ${page} / ${total}`,
      PAGE.width - PAGE.margin,
      PAGE.height - 9,
      { align: "right" },
    );
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────

/** A filename that is safe on every filesystem and still readable. */
function safeFileName(name: string, range: { from: Date; to: Date }) {
  // Local calendar date, not toISOString(): east of Greenwich, midnight on
  // the first of the month is still the previous day in UTC, and a filename
  // that names the wrong period is worse than no filename at all.
  const iso = (date: Date) =>
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  const base = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `${base || "report"}_${iso(range.from)}_${iso(range.to)}.pdf`;
}

/**
 * Build the report and hand the finished PDF to the browser as a download.
 *
 * Throws if the embedded font cannot be fetched — the caller reports that
 * rather than silently producing a document with unreadable Amharic.
 */
export async function generatePdfReport(report: ReportDocument): Promise<void> {
  const t = report.t ?? ((key: string) => key);
  const fonts = await loadFonts();

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  doc.addFileToVFS(`${FONT_FAMILY}-normal.ttf`, fonts.normal);
  doc.addFont(`${FONT_FAMILY}-normal.ttf`, FONT_FAMILY, "normal");
  doc.addFileToVFS(`${FONT_FAMILY}-bold.ttf`, fonts.bold);
  doc.addFont(`${FONT_FAMILY}-bold.ttf`, FONT_FAMILY, "bold");
  doc.setFont(FONT_FAMILY, "normal");

  doc.setProperties({
    title: report.title,
    subject: `${formatDate(report.range.from)} — ${formatDate(report.range.to)}`,
    creator: "eService",
  });

  let y = drawHeader(doc, report, t);

  if (report.stats?.length) {
    y = drawStats(doc, report.stats, y);
  }

  for (const breakdown of report.breakdowns ?? []) {
    y = drawBreakdown(doc, breakdown, y, t);
  }

  for (const table of report.tables ?? []) {
    y = drawTable(doc, table, y, t);
  }

  drawFooters(doc, report, t);

  doc.save(safeFileName(report.fileName, report.range));
}
