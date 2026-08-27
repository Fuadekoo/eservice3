"use client";

import * as React from "react";
import {
  Plus,
  Search,
  Layers,
  Loader2,
  FileText,
  Clock,
  Building2,
  MoreVertical,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  Filter,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Users,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { useServiceStore, type Service } from "@/lib/stores/service-store";
import { useTranslation } from "@/lib/i18n";
import { useSession } from "@/lib/auth-client";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ServiceCreateDialog } from "@/components/dashboard/service-create-dialog";
import { PageLayout } from "@/components/dashboard/page-layout";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { PaginationFooter } from "@/components/dashboard/pagination-footer";

export default function ServicesPage() {
  const { t } = useTranslation();
  const { data: sessionData, isPending: isSessionPending } = useSession();
  const {
    services,
    fetchServices,
    deleteService,
    isLoading,
    error,
    pagination,
  } = useServiceStore();

  const [searchQuery, setSearchQuery] = React.useState("");
  // The box updates on every keystroke; the request waits for a pause, so a
  // word costs one query instead of one per letter.
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(
    null,
  );
  const [deletingService, setDeletingService] = React.useState<Service | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  const isAdmin = sessionData?.session?.role?.name?.toUpperCase() === "ADMIN";
  const isManager =
    sessionData?.session?.role?.name?.toUpperCase() === "MANAGER";
  const officeId = sessionData?.session?.officeId;

  React.useEffect(() => {
    if (!isSessionPending) {
      // The store records the failure and the empty state reports it; nothing
      // here can recover from it, so the rejection is absorbed rather than
      // left to surface as an unhandled promise.
      void fetchServices({
        officeId: isAdmin ? undefined : officeId,
        search: debouncedSearch || undefined,
        page: currentPage,
        pageSize,
      }).catch(() => {});
    }
  }, [
    fetchServices,
    officeId,
    isAdmin,
    debouncedSearch,
    isSessionPending,
    currentPage,
    pageSize,
  ]);

  const handleDelete = async () => {
    if (!deletingService) return;
    setIsDeleting(true);
    try {
      await deleteService(deletingService.id);
      toast.success(t("Service deleted successfully"));
      setDeletingService(null);
    } catch (error: any) {
      toast.error(error?.message || t("Failed to delete service"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsCreateOpen(true);
  };

  if (isSessionPending) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageLayout
      title={t("Service Management")}
      description={
        isAdmin
          ? t("Manage all government services across all offices.")
          : t("Manage services provided by your office.")
      }
      icon={Layers}
      actions={
        <Button
          onClick={() => {
            setEditingService(null);
            setIsCreateOpen(true);
          }}
          className="rounded-xl font-bold bg-primary shadow-lg shadow-primary/20 h-10 px-5"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("Create Service")}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Filters & Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/50 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Search services...")}
              className="pl-9 h-11 rounded-xl bg-background border-none ring-1 ring-border/50 focus-visible:ring-primary/50"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Results for a new term start at the beginning. Staying on
                // page 3 while searching asks for the third page of a
                // two-item result and shows "no services found".
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-muted p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-border/50"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading && services.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                className="border-none shadow-sm ring-1 ring-border/50 animate-pulse"
              >
                <CardContent className="h-[200px] bg-muted/20 rounded-2xl" />
              </Card>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
            <div className="rounded-full bg-background p-6 shadow-sm mb-4">
              <Layers className="h-12 w-12 text-primary/20" />
            </div>
            <h3 className="text-xl font-bold">
              {error ? t("Could not load services") : t("No services found")}
            </h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-center">
              {error
                ? error
                : debouncedSearch
                  ? t("Try adjusting your search query.")
                  : t("Start by creating the first service.")}
            </p>
            {!error && !debouncedSearch && (
              <Button
                className="mt-8 rounded-xl font-bold"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("Create First Service")}
              </Button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "transition-opacity duration-150",
              isLoading && "pointer-events-none opacity-60",
            )}
            aria-busy={isLoading}
          >
            {viewMode === "grid" ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onEdit={() => handleEdit(service)}
                    onDelete={() => setDeletingService(service)}
                    isAdmin={isAdmin}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border/50 bg-card overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="p-4 font-bold text-sm whitespace-nowrap">
                        {t("Service Name")}
                      </th>
                      {isAdmin && (
                        <th className="p-4 font-bold text-sm whitespace-nowrap">
                          {t("Office")}
                        </th>
                      )}
                      <th className="p-4 font-bold text-sm whitespace-nowrap">
                        {t("Time")}
                      </th>
                      <th className="p-4 font-bold text-sm whitespace-nowrap">
                        {t("Stats")}
                      </th>
                      <th className="p-4 font-bold text-sm text-right whitespace-nowrap">
                        {t("Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr
                        key={service.id}
                        className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">
                                {service.name}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                                {service.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {service.office?.name}
                            </div>
                          </td>
                        )}
                        <td className="p-4 whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className="bg-muted/50 font-medium"
                          >
                            <Clock className="mr-1.5 h-3.5 w-3.5" />
                            {service.timeToTake}
                          </Badge>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold border-emerald-500/20 text-emerald-600 bg-emerald-500/5"
                            >
                              {service.requirements?.length || 0} {t("Reqs")}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold border-blue-500/20 text-blue-600 bg-blue-500/5"
                            >
                              {service.serviceFors?.length || 0} {t("Target")}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="rounded-xl"
                            >
                              <DropdownMenuItem
                                onClick={() => handleEdit(service)}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" /> {t("Edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeletingService(service)}
                                className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/5"
                              >
                                <Trash2 className="h-4 w-4" /> {t("Delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalItems > 0 && (
          <PaginationFooter
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startIndex={(currentPage - 1) * pageSize}
            endIndex={currentPage * pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            canGoNext={currentPage < pagination.totalPages}
            canGoPrevious={currentPage > 1}
            itemLabel={t("services")}
          />
        )}

        {/* Dialogs */}
        <ServiceCreateDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          service={editingService}
          defaultOfficeId={officeId}
          isAdmin={isAdmin}
        />

        <Sheet
          open={!!deletingService}
          onOpenChange={(open) =>
            !open && !isDeleting && setDeletingService(null)
          }
        >
          <SheetContent
            side="right"
            role="alertdialog"
            // A destructive confirm should require an explicit choice, so keep the
            // click-outside dismissal that AlertDialog gave us for free.
            onPointerDownOutside={(e) => e.preventDefault()}
            className="w-full! max-w-none! gap-0 overflow-hidden bg-background p-0 sm:w-104! sm:rounded-l-2xl"
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 border-b border-border/60 bg-destructive/5 px-5 py-5 pr-14 sm:px-6">
                <SheetHeader className="gap-1.5 p-0">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <AlertTriangle className="size-5" />
                  </span>
                  <SheetTitle className="mt-1 text-lg font-bold">
                    {t("Are you absolutely sure?")}
                  </SheetTitle>
                  <SheetDescription>
                    {t(
                      "This action cannot be undone. This will permanently delete the service and all associated data.",
                    )}
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                {deletingService && (
                  <div className="min-w-0 space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                        <FileText className="size-4 text-destructive" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {t("Service")}
                        </p>
                        <p className="text-sm leading-snug font-bold wrap-break-word">
                          {deletingService.name}
                        </p>
                      </div>
                    </div>
                    {deletingService.office?.name && (
                      <div className="flex min-w-0 items-start gap-3 border-t border-border/50 pt-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Building2 className="size-4 text-muted-foreground" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {t("Office")}
                          </p>
                          <p className="text-sm leading-snug font-bold wrap-break-word">
                            {deletingService.office.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-border/60 bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="h-11 flex-1 rounded-xl font-semibold"
                    onClick={() => setDeletingService(null)}
                    disabled={isDeleting}
                  >
                    {t("Cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-11 flex-1 rounded-xl font-bold"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 size-4" />
                    )}
                    {t("Delete Service")}
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </PageLayout>
  );
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
  isAdmin,
  t,
}: {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
  t: any;
}) {
  return (
    <Card className="group border-none shadow-sm ring-1 ring-border/50 hover:ring-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col h-full">
      <CardHeader className="p-6 pb-2">
        <div className="flex items-start justify-between">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
            <FileText className="h-6 w-6" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Edit className="h-4 w-4" /> {t("Edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/5"
              >
                <Trash2 className="h-4 w-4" /> {t("Delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="mt-4 text-xl font-black group-hover:text-primary transition-colors leading-tight">
          {service.name}
        </CardTitle>
        <CardDescription className="line-clamp-2 min-h-[40px] mt-1 text-sm leading-relaxed">
          {service.description || t("No description available.")}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-4 flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="bg-muted/50 text-muted-foreground border-none font-bold text-[10px] tracking-wider uppercase px-2.5 py-1"
            >
              <Clock className="mr-1.5 h-3 w-3" />
              {service.timeToTake}
            </Badge>
            {isAdmin && (
              <Badge
                variant="outline"
                className="border-primary/20 text-primary bg-primary/5 font-bold text-[10px] tracking-wider uppercase px-2.5 py-1"
              >
                <Building2 className="mr-1.5 h-3 w-3" />
                {service.office?.name}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {t("Requirements")}
              </p>
              <p className="text-sm font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {service.requirements?.length || 0} {t("Items")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {t("Target")}
              </p>
              <p className="text-sm font-bold flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-500" />
                {service.serviceFors?.length || 0} {t("Groups")}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full mt-2 group/btn rounded-xl font-bold hover:bg-primary/5 hover:text-primary border border-transparent hover:border-primary/10"
          onClick={onEdit}
        >
          {t("Manage Service")}
          <ChevronRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
