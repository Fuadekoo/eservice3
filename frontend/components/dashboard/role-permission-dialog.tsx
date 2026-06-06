"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import {
  useSecurityStore,
  type Role,
  type Permission,
} from "@/lib/stores/security-store";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface RolePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId: string | null;
  onSuccess: () => void;
}

export function RolePermissionDialog({
  open,
  onOpenChange,
  roleId,
  onSuccess,
}: RolePermissionDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [role, setRole] = React.useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissionCodes] = React.useState<
    string[]
  >([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const { roles, permissions, fetchPermissions, updateRole } =
    useSecurityStore();

  React.useEffect(() => {
    if (open && roleId) {
      void loadData();
    }
  }, [open, roleId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchPermissions();
      const roleData = roles.find((r) => r.id === roleId) ?? null;
      setRole(roleData);
      setSelectedPermissionCodes(
        roleData?.permissions?.map((p) => p.code) ?? [],
      );
    } catch (error) {
      console.error("Error loading permissions:", error);
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!roleId) return;

    setSaving(true);
    try {
      await updateRole(roleId, {
        permissions: selectedPermissions,
      });

      toast.success("Role permissions updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (code: string) => {
    setSelectedPermissionCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((p) => {
      const groupName = (p.code ?? "").split(".")[0] || "General";
      const formattedGroup =
        groupName.charAt(0).toUpperCase() + groupName.slice(1);
      if (!groups[formattedGroup]) groups[formattedGroup] = [];
      groups[formattedGroup].push(p);
    });
    return groups;
  }, [permissions]);

  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return groupedPermissions;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, Permission[]> = {};

    Object.entries(groupedPermissions).forEach(([group, perms]) => {
      const matches = perms.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          group.toLowerCase().includes(query),
      );
      if (matches.length > 0) filtered[group] = matches;
    });

    return filtered;
  }, [groupedPermissions, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Edit Role Permissions: {role?.name || "..."}
          </DialogTitle>
          <DialogDescription>
            Select the modules and actions this role should have access to.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading permissions...
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {Object.entries(filteredGroups).map(([group, perms]) => (
                <div key={group} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">
                      {group}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium h-5"
                    >
                      {perms.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map((permission) => (
                      <div
                        key={permission.id}
                        className={`flex items-start space-x-3 space-y-0 rounded-lg border p-3 cursor-pointer transition-colors ${
                          selectedPermissions.includes(permission.code)
                            ? "bg-primary/10 border-primary/30"
                            : "hover:bg-muted/60 border-border"
                        }`}
                        onClick={() => togglePermission(permission.code)}
                      >
                        <Checkbox
                          checked={selectedPermissions.includes(
                            permission.code,
                          )}
                          onCheckedChange={() =>
                            togglePermission(permission.code)
                          }
                          className="mt-0.5"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label className="text-sm font-medium leading-none cursor-pointer">
                            {permission.name}
                          </label>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {permission.code}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(filteredGroups).length === 0 && (
                <div className="py-10 text-center text-muted-foreground">
                  No permissions found matching your search.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-2 bg-muted/40 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            className="gap-2 min-w-[120px]"
            onClick={handleSubmit}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
