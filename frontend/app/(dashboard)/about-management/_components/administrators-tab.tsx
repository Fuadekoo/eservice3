"use client";

import * as React from "react";
import { Plus, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAdministrationStore } from "@/lib/stores/administration-store";
import { AdministratorCard } from "./administrator-card";
import { AdministratorDialog } from "./administrator-dialog";
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
import { useTranslation } from "@/lib/i18n";

export function AdministratorsTab() {
  const { t } = useTranslation();

  const {
    sections,
    isLoading,
    fetchAdministration,
    deleteAdministration,
  } = useAdministrationStore();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedAdmin, setSelectedAdmin] = React.useState<any>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchAdministration();
  }, [fetchAdministration]);

  const handleEdit = (admin: any) => {
    setSelectedAdmin(admin);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteAdministration(deletingId);
      toast.success(t("Administrator deleted successfully"));
    } catch (error) {
      toast.error(t("Failed to delete administrator"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = () => {
    setSelectedAdmin(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          {t("Administrators")}
        </h2>
        <Button
          onClick={handleAdd}
          className="bg-primary hover:bg-primary/90 rounded-xl"
        >
          <Plus className="mr-2 size-4" />
          {t("Add Administrator")}
        </Button>
      </div>

      {isLoading && sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="size-10 animate-spin mb-4 text-primary" />
          <p>{t("Loading administrators...")}</p>
        </div>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-800 rounded-3xl bg-[#121212]">
          <div className="size-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
            <Users className="size-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">{t("No administrators found")}</h3>
          <p className="text-gray-500 mb-6">{t("Start by adding your first administrator.")}</p>
          <Button onClick={handleAdd} variant="outline" className="border-gray-700 text-white">
            <Plus className="mr-2 size-4" />
            {t("Add Administrator")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sections.map((admin) => (
            <AdministratorCard
              key={admin.id}
              administrator={admin}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <AdministratorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        administrator={selectedAdmin}
      />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="bg-[#121212] border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Are you absolutely sure?")}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {t("This action cannot be undone. This will permanently delete the administrator and remove their data from our servers.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-800 text-white hover:bg-gray-800">
              {t("Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-[#f05252] hover:bg-[#d94444] text-white"
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
