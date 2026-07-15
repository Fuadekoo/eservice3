"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuditLogs, type AuditLogRecord } from "@/lib/hooks/use-audit-logs";
import { format } from "date-fns";
import {
  Search,
  Loader2,
  ShieldCheck,
  User,
  Activity,
  Info,
} from "lucide-react";
import { PaginationFooter } from "@/components/dashboard/pagination-footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AuditLogList() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const { logs, pagination, isLoading, error } = useAuditLogs({
    page: currentPage,
    pageSize,
    actor: searchQuery || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
      case "FAILED":
        return "bg-destructive/15 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Track all activities and system events across the platform.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="px-6 py-4 border-b">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by actor..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        <span>Loading audit logs...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-destructive"
                    >
                      {error.message || "Failed to load audit logs"}
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-medium">
                        {format(
                          new Date(log.timestamp),
                          "MMM d, yyyy HH:mm:ss",
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User className="size-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">
                              {log.user?.firstName
                                ? `${log.user.firstName} ${log.user.fatherName || ""}`
                                : log.actor}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                              {log.role || "N/A"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Activity className="size-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {log.action}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground break-all">
                          {log.resource}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`border-none rounded-md px-2 py-0.5 text-[10px] font-bold ${getStatusColor(log.status)}`}
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                            >
                              <Info className="size-4 text-muted-foreground" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <ShieldCheck className="size-5 text-primary" />
                                Audit Log Details
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <DetailItem
                                  label="Timestamp"
                                  value={format(
                                    new Date(log.timestamp),
                                    "PPpp",
                                  )}
                                />
                                <DetailItem
                                  label="Status"
                                  value={log.status}
                                  isBadge
                                  badgeColor={getStatusColor(log.status)}
                                />
                                <DetailItem
                                  label="Actor"
                                  value={
                                    log.user?.firstName
                                      ? `${log.user.firstName} ${log.user.fatherName || ""} (${log.actor})`
                                      : log.actor
                                  }
                                />
                                <DetailItem
                                  label="Role"
                                  value={log.role || "N/A"}
                                />
                                <DetailItem
                                  label="Action"
                                  value={log.action}
                                  className="col-span-2"
                                />
                                <DetailItem
                                  label="Resource"
                                  value={log.resource}
                                  className="col-span-2"
                                  isCode
                                />
                              </div>
                              {log.metadata && (
                                <div className="space-y-1.5">
                                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Metadata
                                  </span>
                                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto border border-border">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {pagination && pagination.total > 0 && (
        <PaginationFooter
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={pagination.total}
          totalPages={pagination.totalPages}
          startIndex={(currentPage - 1) * pageSize}
          endIndex={Math.min(currentPage * pageSize, pagination.total)}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          canGoNext={currentPage < pagination.totalPages}
          canGoPrevious={currentPage > 1}
          itemLabel="logs"
        />
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
  className = "",
  isCode = false,
  isBadge = false,
  badgeColor = "",
}: {
  label: string;
  value: string;
  className?: string;
  isCode?: boolean;
  isBadge?: boolean;
  badgeColor?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <div className="flex items-center">
        {isBadge ? (
          <Badge
            className={`border-none rounded-md px-2 py-0.5 text-[10px] font-bold ${badgeColor}`}
          >
            {value}
          </Badge>
        ) : isCode ? (
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded break-all">
            {value}
          </code>
        ) : (
          <span className="text-sm font-medium">{value}</span>
        )}
      </div>
    </div>
  );
}
