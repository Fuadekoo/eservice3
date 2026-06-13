"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { useTranslation } from "@/lib/i18n";

interface PaginationFooterProps {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  itemLabel?: string;
}

export function PaginationFooter({
  currentPage,
  pageSize,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
  canGoNext,
  canGoPrevious,
  itemLabel,
}: PaginationFooterProps) {
  const { t } = useTranslation();
  const resolvedItemLabel = itemLabel ?? t("items");

  return (
    <div className="flex items-center justify-between gap-4 border-t pt-4">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {t("Showing")} {startIndex + 1} {t("to")}{" "}
        {Math.min(endIndex, totalItems)} {t("of")} {totalItems}{" "}
        {resolvedItemLabel}
      </span>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {t("Rows per page")}:
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="default"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!canGoPrevious}
                className="h-9 gap-1 px-2.5"
              >
                <ChevronLeftIcon className="size-4" />
                {t("Previous")}
              </Button>
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
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
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!canGoNext}
                className="h-9 gap-1 px-2.5"
              >
                {t("Next")}
                <ChevronRightIcon className="size-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
