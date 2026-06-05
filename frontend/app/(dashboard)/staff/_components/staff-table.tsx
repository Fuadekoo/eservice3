"use client";

import * as React from "react";
import {
  MoreVertical,
  Phone,
  CheckCircle2,
  XCircle,
  Shield,
  Edit,
  Trash2,
  Eye,
  GraduationCap,
  Plus,
  RotateCw,
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
import type { StaffMember } from "@/lib/stores/staff-store";

interface StaffTableProps {
  staff: StaffMember[];
  onEdit: (member: StaffMember) => void;
  onDelete: (id: string) => void;
}

export function StaffTable({ staff, onEdit, onDelete }: StaffTableProps) {
  const getInitials = (username?: string, fallbackName?: string) => {
    const source = (username || fallbackName || "?").trim();
    return source.substring(0, 1).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none flex items-center gap-1 mx-auto w-fit px-3 py-1 text-[10px] font-bold uppercase rounded-full">
            <CheckCircle2 className="size-3" />
            Active
          </Badge>
        );
      case "INACTIVE":
        return (
          <Badge className="bg-gray-500/10 text-gray-500 border-none flex items-center gap-1 mx-auto w-fit px-3 py-1 text-[10px] font-bold uppercase rounded-full">
            <XCircle className="size-3" />
            Inactive
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none flex items-center gap-1 mx-auto w-fit px-3 py-1 text-[10px] font-bold uppercase rounded-full">
            <RotateCw className="size-3 animate-spin" />
            Pending
          </Badge>
        );
      case "BLOCKED":
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-none flex items-center gap-1 mx-auto w-fit px-3 py-1 text-[10px] font-bold uppercase rounded-full">
            <XCircle className="size-3" />
            Blocked
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[300px] py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider pl-6">
                Staff Member
              </TableHead>
              <TableHead className="py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                Contact
              </TableHead>
              <TableHead className="py-4 font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                Role
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
            {staff.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  No staff members found.
                </TableCell>
              </TableRow>
            ) : (
              staff.map((member) => (
                <TableRow
                  key={member.id}
                  className="group hover:bg-muted/30 transition-all border-border/50"
                >
                  <TableCell className="pl-6 py-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-11 border-2 border-background shadow-sm">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {getInitials(member.username, member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {member.name}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
                            ID-{member.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className="text-[11px] text-muted-foreground/70 lowercase">
                            {member.username}@e-service.local
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Phone className="size-3 text-primary/60" />
                      <span>{member.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <Badge
                      variant="secondary"
                      className="rounded-full px-3 py-0.5 font-bold border-none text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    >
                      {member.role.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-5">
                    {getStatusBadge(member.status)}
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
                        onClick={() => onEdit(member)}
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
                        onClick={() => onDelete(member.id)}
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
