"use client";

import * as React from "react";
import {
  MoreVertical,
  Phone,
  CheckCircle2,
  XCircle,
  Shield,
  Building2,
  Edit,
  Trash2,
  Eye,
  GraduationCap,
  Plus,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/stores/user-store";

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  const getInitials = (username: string) => {
    return username.substring(0, 1).toUpperCase();
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[1200px]">
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[300px] py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider pl-6">
                User Member
              </TableHead>
              <TableHead className="py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                Contact
              </TableHead>
              <TableHead className="py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                Role
              </TableHead>
              <TableHead className="py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                Office
              </TableHead>
              <TableHead className="py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-center">
                Permissions
              </TableHead>
              <TableHead className="py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-center">
                Status
              </TableHead>
              <TableHead className="py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right pr-6">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="group hover:bg-muted/30 transition-all border-border/50"
                >
                  <TableCell className="pl-6 py-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-11 border-2 border-background shadow-sm">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {user.firstName
                            ? `${user.firstName} ${user.lastName || ""}`
                            : user.username}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
                            ID-{user.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className="text-[11px] text-muted-foreground/70 lowercase">
                            @{user.username}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-2">
                      <Phone className="size-3 text-primary/60" />
                      <span className="text-sm text-foreground/80">
                        {user.phoneNumber}
                      </span>
                      {user.phoneVerified && (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[9px] h-4 px-1.5 font-bold uppercase"
                        >
                          Verified
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <Badge
                      variant="secondary"
                      className="rounded-full px-3 py-0.5 font-bold border-none text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    >
                      {user.role?.name || "customer"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-2">
                      {user.staff?.office ? (
                        <>
                          <Building2 className="size-3.5 text-muted-foreground" />
                          <span className="text-sm text-foreground/80 truncate max-w-[150px]">
                            {user.staff.office.name}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No office
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-5">
                    <Badge className="bg-blue-600/10 text-blue-600 dark:text-blue-400 border-none flex items-center gap-1 mx-auto w-fit px-3 py-1 text-[10px] font-bold uppercase">
                      <CheckCircle2 className="size-3" />
                      Full Permissions
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-5">
                    <Badge
                      className={`rounded-full px-3 py-1 text-[10px] font-bold border-none ${
                        user.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-5">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="View"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        onClick={() => onEdit(user)}
                        title="Edit"
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Credentials"
                      >
                        <GraduationCap className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Add"
                      >
                        <Plus className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => onDelete(user.id)}
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
