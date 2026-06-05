"use client";

import * as React from "react";
import { useOfficeStore, type Office } from "@/lib/stores/office-store";
import { useTranslation } from "@/lib/i18n";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  MoreVertical,
  Building2,
  Users,
  Layers,
  FileText,
  Calendar,
  ExternalLink,
  Edit,
  Trash2,
  Loader2,
  Power,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OfficeCreateDialog } from "@/components/dashboard/office-create-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function OfficesPage() {
  const { t } = useTranslation();
  const { offices, fetchOffices, deleteOffice, updateOffice, isLoading } =
    useOfficeStore();
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [pageSize, setPageSize] = React.useState("20");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingOffice, setEditingOffice] = React.useState<Office | null>(null);
  const [deletingOffice, setDeletingOffice] = React.useState<Office | null>(
    null,
  );

  React.useEffect(() => {
    void fetchOffices();
  }, [fetchOffices]);

  const filteredOffices = offices.filter(
    (office) =>
      office.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      office.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      office.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = async () => {
    if (!deletingOffice) return;
    try {
      await deleteOffice(deletingOffice.id);
      toast.success(t("Office deleted successfully"));
      setDeletingOffice(null);
    } catch (error: any) {
      toast.error(error?.message || t("Failed to delete office"));
    }
  };

  const handleStatusToggle = async (office: Office) => {
    try {
      await updateOffice(office.id, { status: !office.status });
      toast.success(t("Status updated"));
    } catch (error: any) {
      toast.error(error?.message || t("Failed to update status"));
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight">
          {t("Government Offices")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("Create and manage your office locations and information.")}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card/50 p-4 rounded-2xl border border-border/50">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("Search offices by name, address, room...")}
            className="pl-9 h-11 rounded-xl bg-background border-none focus-visible:ring-1 focus-visible:ring-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {t("Per page")}
            </span>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="w-[80px] h-9 rounded-lg border-none bg-background shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border shadow-sm">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="size-8 rounded-md"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="size-8 rounded-md"
              onClick={() => setViewMode("table")}
            >
              <List className="size-4" />
            </Button>
          </div>

          <Button
            className="h-10 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20"
            onClick={() => {
              setEditingOffice(null);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="size-4" />
            {t("New Office")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-10 animate-spin mb-4 text-primary" />
          <p className="font-medium">{t("Loading offices...")}</p>
        </div>
      ) : filteredOffices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl border-border/50 text-muted-foreground">
          <Building2 className="size-12 mb-4 opacity-20" />
          <p className="font-bold">{t("No offices found")}</p>
          <p className="text-sm">{t("Try adjusting your search query.")}</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffices.map((office) => (
            <OfficeCard
              key={office.id}
              office={office}
              onEdit={() => {
                setEditingOffice(office);
                setIsCreateOpen(true);
              }}
              onDelete={() => setDeletingOffice(office)}
              onStatusToggle={() => handleStatusToggle(office)}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">{t("Office")}</TableHead>
                <TableHead>{t("Location")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead className="min-w-[300px]">{t("Stats")}</TableHead>
                <TableHead>{t("Started")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffices.map((office) => (
                <TableRow key={office.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
                        {office.logo ? (
                          <img
                            src={office.logo}
                            alt=""
                            className="size-full object-contain p-1"
                          />
                        ) : (
                          <Building2 className="size-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{office.name}</span>
                        <span className="text-[10px] text-primary font-black uppercase tracking-widest">
                          {office.subdomain}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="size-3" /> {office.address}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Layers className="size-3" /> {t("Room")}:{" "}
                        {office.roomNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={office.status ? "default" : "secondary"}
                      className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
                    >
                      {office.status ? t("Active") : t("Inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <StatMini
                        icon={Layers}
                        value={office._count?.service || 0}
                        label={t("Services")}
                      />
                      <StatMini
                        icon={Users}
                        value={office._count?.staffs || 0}
                        label={t("Staff")}
                      />
                      <StatMini
                        icon={FileText}
                        value={office._count?.requests || 0}
                        label={t("Requests")}
                      />
                      <StatMini
                        icon={Calendar}
                        value={office._count?.appointments || 0}
                        label={t("Appointments")}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    {format(
                      new Date(office.startedAt || office.createdAt),
                      "MMM d, yyyy",
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg"
                        asChild
                      >
                        <Link href={`/offices/${office.id}`}>
                          <ExternalLink className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg"
                        onClick={() => {
                          setEditingOffice(office);
                          setIsCreateOpen(true);
                        }}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingOffice(office)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      <OfficeCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        office={editingOffice}
      />

      <AlertDialog
        open={!!deletingOffice}
        onOpenChange={(open) => !open && setDeletingOffice(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Are you absolutely sure?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This action cannot be undone. This will permanently delete the office and all associated data.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("Delete Office")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OfficeCard({
  office,
  onEdit,
  onDelete,
  onStatusToggle,
  t,
}: {
  office: Office;
  onEdit: () => void;
  onDelete: () => void;
  onStatusToggle: () => void;
  t: any;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-2xl border-border/50 bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col h-full border-none shadow-sm">
      <CardHeader className="p-6 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="size-14 rounded-xl bg-white shadow-inner flex items-center justify-center overflow-hidden border border-border shrink-0">
              {office.logo ? (
                <img
                  src={office.logo}
                  alt=""
                  className="size-full object-contain p-1"
                />
              ) : (
                <Building2 className="size-7 text-primary/40" />
              )}
            </div>
            <div className="flex flex-col pt-0.5">
              <CardTitle className="text-lg font-black leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {office.name}
              </CardTitle>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <MapPin className="size-3 text-primary/60" />
                  <span className="line-clamp-1">{office.address}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Layers className="size-3 text-primary/60" />
                  <span>
                    {t("Room")}: {office.roomNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
              <DropdownMenuItem onClick={onEdit} className="gap-2 font-bold">
                <Edit className="size-4" /> {t("Edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 font-bold text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="size-4" /> {t("Delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-6 flex flex-col flex-1">
        <div className="grid grid-cols-4 gap-2 mb-8">
          <StatBox
            icon={Layers}
            value={office._count?.service || 0}
            label={t("Services")}
          />
          <StatBox
            icon={FileText}
            value={office._count?.requests || 0}
            label={t("Requests")}
          />
          <StatBox
            icon={Calendar}
            value={office._count?.appointments || 0}
            label={t("Appointments")}
          />
          <StatBox
            icon={Users}
            value={office._count?.staffs || 0}
            label={t("Users")}
          />
        </div>

        <div className="mt-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border-none shadow-sm",
                office.status
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {office.status ? t("Active") : t("Inactive")}
            </Badge>

            <div className="flex items-center gap-2">
              <Power
                className={cn(
                  "size-3.5 transition-colors",
                  office.status ? "text-emerald-500" : "text-muted-foreground",
                )}
              />
              <Switch
                checked={office.status}
                onCheckedChange={onStatusToggle}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col text-[10px] text-right">
              <span className="text-muted-foreground uppercase font-black tracking-tighter">
                {t("Started")}:
              </span>
              <span className="font-bold">
                {format(
                  new Date(office.startedAt || office.createdAt),
                  "MMM d, yyyy",
                )}
              </span>
            </div>
            <Link
              href={`/offices/${office.id}`}
              className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors group/link"
            >
              {t("View Details")}
              <ExternalLink className="size-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBox({
  icon: Icon,
  value,
  label,
}: {
  icon: any;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/30 border border-border/20 shadow-inner">
      <Icon className="size-4 mb-1.5 text-muted-foreground/60" />
      <span className="text-sm font-black leading-none mb-1">{value}</span>
      <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60">
        {label}
      </span>
    </div>
  );
}

function StatMini({
  icon: Icon,
  value,
  label,
}: {
  icon: any;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3 text-muted-foreground/40" />
      <span className="text-xs font-bold">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
