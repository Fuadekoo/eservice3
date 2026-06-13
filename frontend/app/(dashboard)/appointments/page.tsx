"use client";

import React from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  MapPin,
  Loader2,
  RefreshCw,
  Eye,
  Edit3,
  LayoutGrid,
  List,
  CalendarDays,
  User,
  ChevronRight,
  CheckCheck,
  Paperclip,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import { axiosInstance } from "@/lib/axios";
import { useSession } from "@/hooks/use-session";
import { usePagination } from "@/hooks/use-pagination";
import { PageLayout, type PageTab } from "@/components/dashboard/page-layout";
import { PaginationFooter } from "@/components/dashboard/pagination-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PdfViewerModal } from "@/components/ui/pdf-viewer-modal";

// ── Types ──────────────────────────────────────────────────────────────────────
type FileData = { id: string; name: string; filepath: string; description?: string | null };

type Appointment = {
  id: string;
  date: string;
  time?: string | null;
  status: string;
  notes?: string | null;
  user?: { id: string; username: string; phoneNumber: string };
  approveStaff?: { id: string; user: { id: string; username: string; phoneNumber: string } } | null;
  request?: {
    id: string;
    statusbystaff: string;
    statusbyadmin: string;
    fileData?: FileData[];
    service?: {
      id: string;
      name: string;
      description?: string;
      office?: { id: string; name: string; address: string; roomNumber: string };
    };
  };
  createdAt?: string;
  updatedAt?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
type AptStatus = "pending" | "approved" | "completed" | "rejected" | "cancelled";

const STATUS_CFG: Record<string, { label: string; icon: React.ElementType; badge: string; dot: string; bg: string }> = {
  pending:   { label: "Pending",   icon: Clock,         badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",     dot: "bg-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/20" },
  approved:  { label: "Confirmed", icon: CheckCircle,   badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
  completed: { label: "Completed", icon: CheckCheck,    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",        dot: "bg-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/20" },
  rejected:  { label: "Rejected",  icon: XCircle,       badge: "bg-red-500/10 text-red-600 border-red-500/20",           dot: "bg-red-500",     bg: "bg-red-50 dark:bg-red-950/20" },
  cancelled: { label: "Cancelled", icon: AlertCircle,   badge: "bg-gray-500/10 text-gray-500 border-gray-500/20",        dot: "bg-gray-400",    bg: "bg-gray-50 dark:bg-gray-950/20" },
};

function getStatusCfg(status: string) {
  return STATUS_CFG[status] ?? STATUS_CFG.pending;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusCfg(status);
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("font-semibold text-xs gap-1.5", cfg.badge)}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isUpcoming(iso: string) { return new Date(iso) >= new Date(); }
function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

const TABS = [
  { label: "All",       value: "" },
  { label: "Upcoming",  value: "upcoming" },
  { label: "Today",     value: "today" },
  { label: "Pending",   value: "pending" },
  { label: "Confirmed", value: "approved" },
  { label: "Completed", value: "completed" },
  { label: "Past",      value: "past" },
];

function filterAppointments(list: Appointment[], tab: string, search: string) {
  let filtered = list;
  if (tab === "upcoming")  filtered = list.filter(a => isUpcoming(a.date) && a.status !== "cancelled" && a.status !== "rejected");
  else if (tab === "today")  filtered = list.filter(a => isToday(a.date));
  else if (tab === "past")   filtered = list.filter(a => !isUpcoming(a.date));
  else if (tab)              filtered = list.filter(a => a.status === tab);

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(a =>
      a.request?.service?.name?.toLowerCase().includes(q) ||
      a.request?.service?.office?.name?.toLowerCase().includes(q)
    );
  }
  return filtered;
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AppointmentsPage() {
  const { isPending: isSessionPending } = useSession();

  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [isLoading, setIsLoading]       = React.useState(true);
  const [tab, setTab]                   = React.useState("");
  const [search, setSearch]             = React.useState("");
  const [view, setView]                 = React.useState<"card" | "table">("card");

  const [detailApt, setDetailApt]       = React.useState<Appointment | null>(null);
  const [editApt, setEditApt]           = React.useState<Appointment | null>(null);
  const [editForm, setEditForm]         = React.useState({ date: "", time: "", notes: "" });
  const [isSaving, setIsSaving]         = React.useState(false);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Interceptor unwraps → body = { success, data: [] }
      const body = (await axiosInstance.get("/appointments")) as unknown as {
        data: Appointment[];
      };
      setAppointments(body.data ?? []);
    } catch (err) {
      if (axios.isCancel(err) || (err as any)?.code === "ERR_CANCELED") return;
      toast.error("Failed to load appointments.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isSessionPending) return;
    void load();
  }, [isSessionPending, load]);

  const stats = React.useMemo(() => ({
    total:     appointments.length,
    upcoming:  appointments.filter(a => isUpcoming(a.date) && !["cancelled","rejected"].includes(a.status)).length,
    today:     appointments.filter(a => isToday(a.date)).length,
    confirmed: appointments.filter(a => a.status === "approved").length,
    completed: appointments.filter(a => a.status === "completed").length,
    pending:   appointments.filter(a => a.status === "pending").length,
  }), [appointments]);

  const displayed = React.useMemo(
    () => filterAppointments(appointments, tab, search),
    [appointments, tab, search]
  );

  const aptPagination = usePagination(displayed, { initialPageSize: 10 });

  React.useEffect(() => {
    aptPagination.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search]);

  const openEdit = (apt: Appointment) => {
    setEditApt(apt);
    setEditForm({
      date:  apt.date?.split("T")[0] ?? "",
      time:  apt.time ?? "",
      notes: apt.notes ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editApt) return;
    if (!editForm.date) { toast.error("Please select a date."); return; }
    setIsSaving(true);
    try {
      await axiosInstance.patch(`/appointments/${editApt.id}`, {
        date:  new Date(editForm.date).toISOString(),
        time:  editForm.time || undefined,
        notes: editForm.notes || undefined,
      });
      toast.success("Appointment updated.");
      setEditApt(null);
      void load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update appointment.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: PageTab[] = TABS.map(t => ({
    label: t.label,
    value: t.value,
    badge: t.value === "today" && stats.today > 0 ? stats.today : undefined
  }));

  return (
    <PageLayout
      title="My Appointments"
      description="View and manage your scheduled service appointments"
      icon={CalendarDays}
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
      actions={
        <Button variant="outline" onClick={load} className="h-10 rounded-xl shrink-0" disabled={isLoading}>
          <RefreshCw className={cn("mr-2 size-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: "Total",     value: stats.total,     icon: Calendar,      color: "text-primary",     bg: "bg-primary/10" },
            { label: "Upcoming",  value: stats.upcoming,  icon: ChevronRight,  color: "text-violet-600",  bg: "bg-violet-500/10" },
            { label: "Today",     value: stats.today,     icon: CalendarDays,  color: "text-orange-600",  bg: "bg-orange-500/10" },
            { label: "Pending",   value: stats.pending,   icon: Clock,         color: "text-amber-600",   bg: "bg-amber-500/10" },
            { label: "Confirmed", value: stats.confirmed, icon: CheckCircle,   color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { label: "Completed", value: stats.completed, icon: CheckCheck,    color: "text-blue-600",    bg: "bg-blue-500/10" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-none shadow-sm ring-1 ring-border/50 bg-card/50">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className={cn("size-8 rounded-lg mx-auto mb-2 flex items-center justify-center", bg)}>
                  <Icon className={cn("size-4", color)} />
                </div>
                <p className="text-xl font-black leading-none">{value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search service or office..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl w-52"
            />
          </div>
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-xl p-1 border border-border/50">
            <Button variant={view === "card" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-lg" onClick={() => setView("card")}>
              <LayoutGrid className="size-4" />
            </Button>
            <Button variant={view === "table" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-lg" onClick={() => setView("table")}>
              <List className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState tab={tab} search={search} />
      ) : view === "card" ? (
        <CardGrid apts={aptPagination.paginatedData} onView={setDetailApt} onEdit={openEdit} />
      ) : (
        <TableView apts={aptPagination.paginatedData} onView={setDetailApt} onEdit={openEdit} />
      )}

      {/* Pagination */}
      {displayed.length > 0 && !isLoading && (
        <PaginationFooter
          currentPage={aptPagination.currentPage}
          pageSize={aptPagination.pageSize}
          totalPages={aptPagination.totalPages}
          totalItems={aptPagination.totalItems}
          startIndex={aptPagination.startIndex}
          endIndex={aptPagination.endIndex}
          onPageChange={aptPagination.setPage}
          onPageSizeChange={aptPagination.setPageSize}
          canGoNext={aptPagination.canGoNext}
          canGoPrevious={aptPagination.canGoPrevious}
          itemLabel="appointments"
        />
      )}

      {/* Detail Dialog */}
      <AptDetailDialog apt={detailApt} onClose={() => setDetailApt(null)} />

      {/* Edit/Reschedule Dialog */}
      <Dialog open={!!editApt} onOpenChange={o => !o && setEditApt(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 gap-0 overflow-hidden">
          {editApt && (
            <>
              <div className="bg-primary px-6 py-5">
                <DialogHeader>
                  <DialogTitle className="text-white font-black text-lg">Reschedule Appointment</DialogTitle>
                  <p className="text-primary-foreground/70 text-sm mt-0.5">{editApt.request?.service?.name}</p>
                </DialogHeader>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold">New Date <span className="text-destructive">*</span></label>
                  <Input
                    type="date"
                    value={editForm.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold">Preferred Time</label>
                  <Input
                    type="time"
                    value={editForm.time}
                    onChange={e => setEditForm(p => ({ ...p, time: e.target.value }))}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold">Notes (optional)</label>
                  <textarea
                    value={editForm.notes}
                    onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    rows={3}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Separator />
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-xl h-11 font-bold" onClick={() => setEditApt(null)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button className="flex-1 rounded-xl h-11 font-bold" onClick={handleSaveEdit} disabled={isSaving}>
                    {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle className="size-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyState({ tab, search }: { tab: string; search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-border text-center">
      <div className="p-4 rounded-full bg-muted/30 mb-4">
        <CalendarDays className="size-10 text-muted-foreground/30" />
      </div>
      <p className="font-bold text-lg">No appointments found</p>
      <p className="text-sm text-muted-foreground mt-1">
        {search || tab
          ? "Try adjusting your filters."
          : "Appointments are created once your service request is approved."}
      </p>
    </div>
  );
}

// ── Card Grid ─────────────────────────────────────────────────────────────────
function CardGrid({ apts, onView, onEdit }: { apts: Appointment[]; onView: (a: Appointment) => void; onEdit: (a: Appointment) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {apts.map(apt => {
        const cfg = getStatusCfg(apt.status);
        const canEdit = apt.status === "pending";
        const aptDate = new Date(apt.date);
        const upcoming = isUpcoming(apt.date);
        const today = isToday(apt.date);

        return (
          <Card key={apt.id} className="border-none shadow-sm ring-1 ring-border/50 hover:ring-primary/20 hover:shadow-md transition-all duration-200 bg-card/60 group overflow-hidden">
            {/* Top color bar */}
            <div className={cn("h-1 w-full", cfg.dot)} />

            <CardHeader className="p-5 pb-0">
              <div className="flex items-start gap-3">
                {/* Date block */}
                <div className={cn(
                  "size-14 rounded-xl flex flex-col items-center justify-center shrink-0 border",
                  today ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-foreground"
                )}>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {aptDate.toLocaleDateString("en-US", { month: "short" })}
                  </p>
                  <p className="text-2xl font-black leading-none">{aptDate.getDate()}</p>
                  <p className="text-[9px] font-bold opacity-60">
                    {aptDate.toLocaleDateString("en-US", { year: "2-digit" })}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {apt.request?.service?.name ?? "Appointment"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Building2 className="size-3 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {apt.request?.service?.office?.name ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              {/* Time + location */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                {apt.time && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5 text-primary/70" /> {apt.time}
                  </span>
                )}
                {apt.request?.service?.office?.roomNumber && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 text-primary/70" />
                    Room {apt.request.service.office.roomNumber}
                  </span>
                )}
                {today && (
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 font-black px-1.5 py-0">
                    TODAY
                  </Badge>
                )}
                {upcoming && !today && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground font-semibold px-1.5 py-0">
                    Upcoming
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Status row */}
              <div className="flex items-center justify-between">
                <StatusBadge status={apt.status} />
                {apt.approveStaff && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="size-3" /> {apt.approveStaff.user.username}
                  </span>
                )}
              </div>

              {apt.notes && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2 line-clamp-2">
                  {apt.notes}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="flex-1 h-9 rounded-xl text-xs font-bold gap-1.5" onClick={() => onView(apt)}>
                  <Eye className="size-3.5" /> Details
                </Button>
                {canEdit && (
                  <Button size="sm" variant="outline" className="flex-1 h-9 rounded-xl text-xs font-bold gap-1.5 text-primary border-primary/30 hover:bg-primary/5" onClick={() => onEdit(apt)}>
                    <Edit3 className="size-3.5" /> Reschedule
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Table View ─────────────────────────────────────────────────────────────────
function TableView({ apts, onView, onEdit }: { apts: Appointment[]; onView: (a: Appointment) => void; onEdit: (a: Appointment) => void }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              {["Service", "Office", "Date", "Time", "Room", "Status", "Actions"].map(h => (
                <th key={h} className="px-5 py-3.5 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground first:pl-5 last:text-right last:pr-5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apts.map(apt => {
              const cfg = getStatusCfg(apt.status);
              const canEdit = apt.status === "pending";
              const today = isToday(apt.date);

              return (
                <tr key={apt.id} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("size-2 rounded-full shrink-0", cfg.dot)} />
                      <div>
                        <p className="font-semibold line-clamp-1">{apt.request?.service?.name ?? "—"}</p>
                        {today && <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 mt-0.5 px-1 py-0">TODAY</Badge>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-muted-foreground line-clamp-1">{apt.request?.service?.office?.name ?? "—"}</p>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                    {fmtDate(apt.date)}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {apt.time ? (
                      <span className="flex items-center gap-1"><Clock className="size-3.5" />{apt.time}</span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {apt.request?.service?.office?.roomNumber ? `Room ${apt.request.service.office.roomNumber}` : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={apt.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => onView(apt)} title="View details">
                        <Eye className="size-4" />
                      </Button>
                      {canEdit && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10" onClick={() => onEdit(apt)} title="Reschedule">
                          <Edit3 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Detail Dialog ──────────────────────────────────────────────────────────────
function AptDetailDialog({ apt, onClose }: { apt: Appointment | null; onClose: () => void }) {
  const [viewingFile, setViewingFile] = React.useState<FileData | null>(null);

  if (!apt) return null;
  const cfg = getStatusCfg(apt.status);
  const Icon = cfg.icon;
  const today = isToday(apt.date);
  const upcoming = isUpcoming(apt.date);
  const files = apt.request?.fileData ?? [];

  return (
    <>
      <Dialog open={!!apt} onOpenChange={o => !o && onClose()}>
        <DialogContent className="max-w-lg rounded-2xl p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-white font-black text-xl leading-snug">
                {apt.request?.service?.name ?? "Appointment"}
              </DialogTitle>
              <p className="text-primary-foreground/70 text-sm mt-0.5 flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                {apt.request?.service?.office?.name ?? "—"}
              </p>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Status + date highlight */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={cn("font-bold text-sm gap-1.5 px-3 py-1", cfg.badge)}>
                <Icon className="size-4" /> {cfg.label}
              </Badge>
              <div className="flex gap-2">
                {today && <Badge className="bg-primary text-primary-foreground font-black text-xs">TODAY</Badge>}
                {upcoming && !today && <Badge variant="outline" className="text-muted-foreground text-xs">Upcoming</Badge>}
              </div>
            </div>

            {/* Date / time card */}
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 flex items-center gap-4">
              <div className="size-16 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                <p className="text-xs font-bold text-primary uppercase">
                  {new Date(apt.date).toLocaleDateString("en-US", { month: "short" })}
                </p>
                <p className="text-3xl font-black text-primary leading-none">{new Date(apt.date).getDate()}</p>
                <p className="text-xs text-primary/70">{new Date(apt.date).getFullYear()}</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-base">{fmtDate(apt.date)}</p>
                {apt.time && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-4 text-primary" /> {apt.time}
                  </p>
                )}
                {apt.request?.service?.office?.roomNumber && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4 text-primary" /> Room {apt.request.service.office.roomNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Office info */}
            {apt.request?.service?.office && (
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Office Details</p>
                <div className="space-y-1.5 text-sm">
                  <p className="font-semibold">{apt.request.service.office.name}</p>
                  {apt.request.service.office.address && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" /> {apt.request.service.office.address}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Request pipeline */}
            {apt.request && (
              <div className="rounded-xl border border-border p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Related Request</p>
                <div className="space-y-2">
                  {[
                    { label: "Staff Review",   status: apt.request.statusbystaff },
                    { label: "Manager Review", status: apt.request.statusbyadmin },
                  ].map(({ label, status }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold",
                          status === "approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                          status === "rejected" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                          "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}
                      >
                        {status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submitted Documents */}
            {files.length > 0 && (
              <div className="rounded-xl border border-border p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Paperclip className="size-3.5" />
                  Submitted Documents ({files.length})
                </p>
                <div className="space-y-2">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => setViewingFile(file)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group text-left"
                    >
                      <div className="size-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <FileText className="size-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                          {file.name}
                        </p>
                        {file.description && (
                          <p className="text-xs text-muted-foreground truncate">{file.description}</p>
                        )}
                      </div>
                      <Eye className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Approver */}
            {apt.approveStaff && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Confirmed By</p>
                <div className="flex items-center gap-2 text-sm">
                  <div className="size-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <User className="size-3.5 text-emerald-600" />
                  </div>
                  <span className="font-semibold">{apt.approveStaff.user.username}</span>
                  <span className="text-muted-foreground text-xs">{apt.approveStaff.user.phoneNumber}</span>
                </div>
              </div>
            )}

            {/* Notes */}
            {apt.notes && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Notes</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{apt.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal for selected file */}
      {viewingFile && (
        <PdfViewerModal
          open={!!viewingFile}
          onOpenChange={(o) => !o && setViewingFile(null)}
          fileId=""
          fileName={viewingFile.name}
          filepath={viewingFile.filepath}
        />
      )}
    </>
  );
}
