"use client";

import * as React from "react";
import { FileText, Plus, Search, Clock, ChevronRight } from "lucide-react";
import { useServiceStore } from "@/lib/stores/service-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PaginationFooter } from "@/components/dashboard/pagination-footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n";
import { ServiceCreateDialog } from "@/components/dashboard/service-create-dialog";

interface OfficeServicesTabProps {
  officeId: string;
}

export function OfficeServicesTab({ officeId }: OfficeServicesTabProps) {
  const { t } = useTranslation();
  const { services, pagination, isLoading, fetchServices } = useServiceStore();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isServiceCreateOpen, setIsServiceCreateOpen] = React.useState(false);

  React.useEffect(() => {
    fetchServices({
      officeId,
      page: currentPage,
      pageSize,
      search: searchQuery || undefined,
    });
  }, [officeId, currentPage, pageSize, searchQuery, fetchServices]);

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between space-y-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold sm:text-xl">
                {t("Service Catalog")}
              </CardTitle>
              {pagination && (
                <Badge
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground border-transparent font-medium"
                >
                  {pagination.totalItems} {t("Services")}
                </Badge>
              )}
            </div>
            <CardDescription>
              {t("All public services provided by this office.")}
            </CardDescription>
          </div>
        </div>
        <Button
          size="sm"
          className="shadow-md"
          onClick={() => setIsServiceCreateOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("Add Service")}
        </Button>
      </CardHeader>

      <CardContent className="px-0">
        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t("Search services...")}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="flex min-h-90 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8">
            <div className="rounded-full bg-background p-4 shadow-sm mb-4">
              <FileText className="h-9 w-9 text-primary/40" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {t("No services configured")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs text-center mt-1">
              {t(
                "Start by adding the first service this office provides to citizens.",
              )}
            </p>
            <Button
              variant="outline"
              className="mt-6 border-primary/20 hover:bg-primary/5"
              onClick={() => setIsServiceCreateOpen(true)}
            >
              {t("Create First Service")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.id}
                className="group flex flex-col justify-between gap-4 p-5 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer shadow-sm"
              >
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold group-hover:text-primary transition-colors leading-tight">
                    {service.name}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.description || t("No description provided.")}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className="bg-background/50 font-medium"
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    {service.timeToTake || t("N/A")}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs font-bold hover:text-primary"
                  >
                    {t("Details")}
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.totalItems > 0 && (
          <div className="mt-6">
            <PaginationFooter
              currentPage={currentPage}
              pageSize={pageSize}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              startIndex={(currentPage - 1) * pageSize}
              endIndex={Math.min(currentPage * pageSize, pagination.totalItems)}
              canGoNext={pagination.hasNextPage}
              canGoPrevious={pagination.hasPreviousPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel={t("services")}
            />
          </div>
        )}
      </CardContent>

      <ServiceCreateDialog
        open={isServiceCreateOpen}
        onOpenChange={setIsServiceCreateOpen}
        defaultOfficeId={officeId}
      />
    </Card>
  );
}
