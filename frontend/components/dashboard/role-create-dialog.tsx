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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldPlus } from "lucide-react";
import { useSecurityStore } from "@/lib/stores/security-store";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

interface RoleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officeId: string;
  onSuccess: () => void;
}

export function RoleCreateDialog({
  open,
  onOpenChange,
  officeId,
  onSuccess,
}: RoleCreateDialogProps) {
  const { t } = useTranslation();

  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const { createRole } = useSecurityStore();

  React.useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("Role name is required"));
      return;
    }

    setLoading(true);
    try {
      const result = await createRole({
        name: name.trim(),
        description: description.trim(),
        officeId,
      });

      if (result) {
        toast.success(t("Role created successfully"));
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating role:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldPlus className="size-5 text-primary" />
            {t("Create New Role")}
          </DialogTitle>
          <DialogDescription>
            {t("Define a new role for your business. You can assign permissions after creating it.")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("Role Name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("e.g. Inventory Manager")}
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t("Description (Optional)")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("What can this role do?")}
                className="resize-none"
                rows={3}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t("Cancel")}
            </Button>
            <Button type="submit" className="min-w-[100px]" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("Creating...")}
                </>
              ) : (
                t("Create Role")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
