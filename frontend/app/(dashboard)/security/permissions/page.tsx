"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationFooter } from "@/components/dashboard/pagination-footer";
import { useSecurityStore, type Permission } from "@/lib/stores/security-store";
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
import {
  LayoutGrid,
  List,
  Plus,
  Key,
  Edit2,
  Trash2,
  Search,
  ShieldCheck,
} from "lucide-react";

/** Codes are namespaced with ":" (e.g. "page:admin:roles"); group by the head. */
function groupOf(code: string | null | undefined): string {
  return code?.split(":")[0] || "general";
}

export default function PermissionsPage() {
  const router = useRouter();
  const securityStore = useSecurityStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadPermissions();
  }, []);

  // Any change to the search or page size resets us to the first page so the
  // visible slice always starts from the top of the (re)filtered results.
  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  async function loadPermissions() {
    try {
      await securityStore.fetchPermissions();
    } catch (error) {
      toast.error("Failed to load permissions");
      console.error(error);
    }
  }

  function handleEdit(permission: Permission) {
    router.push(`/security/permissions/${permission.id}/edit`);
  }

  function handleDeleteClick(permission: Permission) {
    setPermissionToDelete(permission);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!permissionToDelete) return;
    try {
      await securityStore.deletePermission(permissionToDelete.id);
      toast.success("Permission deleted successfully");
      await loadPermissions();
      setDeleteDialogOpen(false);
      setPermissionToDelete(null);
    } catch (error) {
      toast.error("Failed to delete permission");
      console.error(error);
    }
  }

  const filteredPermissions = useMemo(() => {
    const q = search.toLowerCase();
    return securityStore.permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.code ?? "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q),
    );
  }, [securityStore.permissions, search]);

  // Client-side pagination: the store already holds the full catalogue, so we
  // slice it here rather than round-tripping to the server for every page.
  const totalItems = filteredPermissions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagedPermissions = filteredPermissions.slice(startIndex, endIndex);

  // Group only the visible page by its "namespace" prefix for the card view.
  const groupedPermissions = pagedPermissions.reduce<Record<string, Permission[]>>(
    (acc, p) => {
      const prefix = groupOf(p.code);
      (acc[prefix] ??= []).push(p);
      return acc;
    },
    {},
  );

  return (
    <ProtectedRoute requiredPermission="permissions.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Permissions</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Granular access permissions provisioned across all system modules.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-muted p-1 rounded-lg shrink-0">
              <Button
                variant={viewMode === "card" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("card")}
                title="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("table")}
                title="Table view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" className="h-9 px-4 flex-1 sm:flex-none" asChild>
              <Link href="/security/permissions/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Permission
              </Link>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code or description…"
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <section>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Permission Catalogue
              </CardTitle>
              <CardDescription>
                {totalItems} permission{totalItems !== 1 ? "s" : ""} defined
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityStore.isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
                  <p className="text-sm">Loading permissions…</p>
                </div>
              ) : totalItems === 0 ? (
                <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                  <Key className="h-12 w-12 opacity-20 mb-4" />
                  <p className="text-sm">
                    {search ? "No permissions match your search." : "No permissions defined yet."}
                  </p>
                </div>
              ) : (
                <>
                  {viewMode === "card" ? (
                    /* Card View - grouped by namespace prefix */
                    <div className="space-y-6">
                      {Object.entries(groupedPermissions).map(([group, perms]) => (
                        <div key={group}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-px flex-1 bg-border" />
                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest px-3">
                              {group}
                            </Badge>
                            <div className="h-px flex-1 bg-border" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {perms.map((permission) => (
                              <Card
                                key={permission.id}
                                className="group overflow-hidden hover:border-primary/50 transition-all"
                              >
                                <CardHeader className="pb-2 pt-4 px-4">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                                      <Key className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-sm truncate">{permission.name}</p>
                                      <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                        {permission.code}
                                      </code>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="px-4 pb-0">
                                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                                    {permission.description || "No description provided."}
                                  </p>
                                </CardContent>
                                <div className="flex border-t mt-3 divide-x">
                                  <Button
                                    variant="ghost"
                                    className="flex-1 h-10 rounded-none text-xs"
                                    onClick={() => handleEdit(permission)}
                                  >
                                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="flex-1 h-10 rounded-none text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/10"
                                    onClick={() => handleDeleteClick(permission)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Table View */
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="font-bold">Code</TableHead>
                            <TableHead className="font-bold">Name</TableHead>
                            <TableHead className="font-bold hidden sm:table-cell">Description</TableHead>
                            <TableHead className="w-[90px] text-right font-bold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagedPermissions.map((permission) => (
                            <TableRow key={permission.id} className="hover:bg-muted/20">
                              <TableCell>
                                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-primary">
                                  {permission.code}
                                </code>
                              </TableCell>
                              <TableCell className="font-semibold text-sm">
                                {permission.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                                {permission.description || "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(permission)}
                                    title="Edit"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick(permission)}
                                    className="text-rose-600 hover:text-rose-700"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className="mt-6">
                    <PaginationFooter
                      currentPage={currentPage}
                      pageSize={pageSize}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      startIndex={startIndex}
                      endIndex={endIndex}
                      onPageChange={setPage}
                      onPageSizeChange={setPageSize}
                      canGoNext={currentPage < totalPages}
                      canGoPrevious={currentPage > 1}
                      itemLabel="permissions"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Permission</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{permissionToDelete?.name}&quot;? This action
                cannot be undone and may break roles that use this permission.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
