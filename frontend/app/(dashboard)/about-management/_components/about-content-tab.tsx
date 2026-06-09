"use client";

import * as React from "react";
import { Plus, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAboutStore } from "@/lib/stores/about-store";
import { AboutSectionCard } from "./about-section-card";
import { AboutSectionDialog } from "./about-section-dialog";
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

export function AboutContentTab() {
  const {
    sections,
    isLoading,
    fetchAbout,
    deleteAbout,
  } = useAboutStore();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedSection, setSelectedSection] = React.useState<any>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchAbout();
  }, [fetchAbout]);

  const handleEdit = (section: any) => {
    setSelectedSection(section);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteAbout(deletingId);
      toast.success("About section deleted successfully");
    } catch (error) {
      toast.error("Failed to delete about section");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = () => {
    setSelectedSection(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          About Content
        </h2>
        <Button
          onClick={handleAdd}
          className="bg-primary hover:bg-primary/90 rounded-xl"
        >
          <Plus className="mr-2 size-4" />
          Add Section
        </Button>
      </div>

      {isLoading && sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="size-10 animate-spin mb-4 text-primary" />
          <p>Loading about sections...</p>
        </div>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-800 rounded-3xl bg-[#121212]">
          <div className="size-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
            <FileText className="size-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No sections found</h3>
          <p className="text-gray-500 mb-6">Start by adding your first content section.</p>
          <Button onClick={handleAdd} variant="outline" className="border-gray-700 text-white">
            <Plus className="mr-2 size-4" />
            Add Section
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <AboutSectionCard
              key={section.id}
              section={section}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <AboutSectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        section={selectedSection}
      />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="bg-[#121212] border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete this section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-800 text-white hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-[#f05252] hover:bg-[#d94444] text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
