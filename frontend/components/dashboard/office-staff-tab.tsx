"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Mail,
  Phone,
  UserPlus,
  Users,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { useStaffStore } from "@/lib/stores/staff-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { toast } from "sonner";

interface OfficeStaffTabProps {
  officeId: string;
}

export function OfficeStaffTab({ officeId }: OfficeStaffTabProps) {
  const { staff, pagination, isLoading, fetchStaff, deleteStaff } =
    useStaffStore();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    fetchStaff({
      officeId,
      page: currentPage,
      pageSize,
      search: searchQuery || undefined,
    });
  }, [officeId, currentPage, pageSize, searchQuery, fetchStaff]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await deleteStaff(id);
      toast.success("Staff deleted successfully");
      fetchStaff({ officeId, page: currentPage, pageSize });
    } catch (error) {
      toast.error("Failed to delete staff");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0 pb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Users className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold sm:text-xl">
                Office Staff
              </CardTitle>
              {pagination && (
                <Badge
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground border-transparent font-medium"
                >
                  {pagination.totalItems} Members
                </Badge>
              )}
            </div>
            <CardDescription>Current members and their roles</CardDescription>
          </div>
        </div>
        <Button className="gap-2 w-full sm:w-auto">
          <UserPlus className="size-4" />
          Add User
        </Button>
      </CardHeader>

      <CardContent className="px-0">
        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="self-start sm:self-auto"
          >
            <Filter className="size-4" />
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px] font-semibold text-foreground">
                  Staff Name
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Role
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Contact
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  Status
                </TableHead>
                <TableHead className="text-right font-semibold text-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : staff.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No staff members found.
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((member) => (
                  <TableRow
                    key={member.id}
                    className="group hover:bg-muted/40 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 border-2 border-background shadow-sm">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                          />
                          <AvatarFallback className="bg-primary/15 text-primary font-bold">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {member.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            @{member.username}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-full px-3 py-0.5 font-medium border-border text-muted-foreground uppercase text-[10px] tracking-wider"
                      >
                        {member.role?.name || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                          <Mail className="size-3" />
                          <span>{member.username}@e-service.com</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                          <Phone className="size-3" />
                          <span>{member.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold border-none ${
                          member.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 hover:bg-accent hover:shadow-sm border-transparent hover:border-border border"
                          >
                            <MoreHorizontal className="size-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2">
                            <Eye className="size-4" /> View Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Pencil className="size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

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
              itemLabel="members"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
