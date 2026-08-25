"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination as PaginationUI,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface PaginationProps {
  /**
   * Current page number (1-indexed)
   */
  currentPage: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Number of items per page
   */
  rowsPerPage: number;
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
  /**
   * Callback when rows per page changes
   */
  onRowsPerPageChange: (rows: number) => void;
  /**
   * Available rows per page options
   * @default [12, 24, 48, 96]
   */
  rowsPerPageOptions?: number[];
  /**
   * Custom label for rows per page select
   * @default "per page"
   */
  rowsPerPageLabel?: string;
  /**
   * Hide the component when there are no pages
   * @default true
   */
  hideWhenEmpty?: boolean;
  /**
   * Show page info text
   * @default true
   */
  showPageInfo?: boolean;
  /**
   * Custom page info text format
   * @default "Page {currentPage} of {totalPages}"
   */
  pageInfoFormat?: (currentPage: number, totalPages: number) => string;
}

/**
 * Global pagination component for use across all pages
 * Supports page navigation and rows per page selection
 */
export function Pagination({
  currentPage,
  totalPages,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [12, 24, 48, 96],
  rowsPerPageLabel = "per page",
  hideWhenEmpty = true,
  showPageInfo = true,
  pageInfoFormat,
}: PaginationProps) {
  const { t } = useTranslation();

  if (hideWhenEmpty && totalPages === 0) return null;

  const defaultPageInfo = t("Page {current} of {total}", {
    current: currentPage,
    total: totalPages,
  });
  const pageInfo = pageInfoFormat
    ? pageInfoFormat(currentPage, totalPages)
    : defaultPageInfo;
  const resolvedRowsPerPageLabel =
    rowsPerPageLabel === "per page" ? t("per page") : rowsPerPageLabel;

  return (
    <div className="flex flex-wrap gap-4 items-center justify-between border-t pt-4">
      <Select
        value={rowsPerPage.toString()}
        onValueChange={(value) => onRowsPerPageChange(Number(value))}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {rowsPerPageOptions.map((option) => (
            <SelectItem key={option} value={option.toString()}>
              {option} {resolvedRowsPerPageLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showPageInfo && (
        <div className="flex-1 text-center text-sm text-muted-foreground">
          {pageInfo}
        </div>
      )}

      <PaginationUI className="max-w-min">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="ghost"
              size="default"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="gap-1 px-2.5 sm:pl-2.5"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:block">{t("Previous")}</span>
            </Button>
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // Show first page, last page, current page, and pages around current
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <PaginationItem key={page}>
                  <Button
                    variant={currentPage === page ? "outline" : "ghost"}
                    size="icon"
                    onClick={() => onPageChange(page)}
                    className="h-9 w-9"
                  >
                    {page}
                  </Button>
                </PaginationItem>
              );
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return (
                <PaginationItem key={page}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return null;
          })}
          <PaginationItem>
            <Button
              variant="ghost"
              size="default"
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="gap-1 px-2.5 sm:pr-2.5"
            >
              <span className="hidden sm:block">{t("Next")}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </PaginationUI>
    </div>
  );
}
