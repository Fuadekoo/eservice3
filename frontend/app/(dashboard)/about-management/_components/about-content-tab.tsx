"use client";

import * as React from "react";
import { Plus, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAboutStore, type AboutSection } from "@/lib/stores/about-store";
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
import { useTranslation } from "@/lib/i18n";

export function AboutContentTab() {
  const { t } = useTranslation();

  const { sections, isLoading, fetchAbout, deleteAbout } = useAboutStore();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedSection, setSelectedSection] =
    React.useState<AboutSection | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    fetchAbout();
  }, [fetchAbout]);

  const handleEdit = (section: AboutSection) => {
    setSelectedSection(section);
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteAbout(deletingId);
      toast.success(t("About section deleted successfully"));
      setDeletingId(null);
    } catch {
      toast.error(t("Failed to delete about section"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAdd = () => {
    setSelectedSection(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── Section header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="size-4.5" />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {t("About Content")}
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {sections.length > 0
                ? t("{count} section(s) on the public about page", {
                    count: sections.length,
                  })
                : t("Sections shown on the public about page")}
            </p>
          </div>
        </div>

        <Button onClick={handleAdd} className="h-10 rounded-xl font-semibold">
          <Plus className="mr-2 size-4" />
          {t("Add Section")}
        </Button>
      </div>

      {/* ── Content ── */}
      {isLoading && sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <Loader2 className="size-9 animate-spin text-primary" />
          <p className="text-sm font-medium">{t("Loading about sections...")}</p>
        </div>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/30 px-6 py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground/60">
            <FileText className="size-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {t("No sections found")}
          </h3>
          <p className="mt-1 mb-6 max-w-sm text-sm text-muted-foreground">
            {t("Start by adding your first content section.")}
          </p>
          <Button
            onClick={handleAdd}
            variant="outline"
            className="h-10 rounded-xl font-semibold"
          >
            <Plus className="mr-2 size-4" />
            {t("Add Section")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <AboutSectionCard
              key={section.id}
              section={section}
              onEdit={handleEdit}
              onDelete={setDeletingId}
            />
          ))}
        </div>
      )}

      <AboutSectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        section={selectedSection}
      />

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Are you absolutely sure?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This action cannot be undone. This will permanently delete this section.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                // Keep the dialog up until the request settles, so a failure
                // does not look like a success.
                event.preventDefault();
                void confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20"
            >
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
