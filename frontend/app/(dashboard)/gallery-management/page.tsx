"use client";

import * as React from "react";
import { Plus, Images, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { useGalleryStore, type Gallery } from "@/lib/stores/gallery-store";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GalleryCard } from "./_components/gallery-card";
import { GalleryDialog } from "./_components/gallery-dialog";
import { ImageManagementDialog } from "./_components/image-management-dialog";
import { PaginationFooter } from "@/components/dashboard/pagination-footer";
import { useTranslation } from "@/lib/i18n";
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

export default function GalleryPage() {
  const { t } = useTranslation();
  const { galleries, isLoading, fetchGalleries, deleteGallery, pagination } =
    useGalleryStore();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(12);
  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = React.useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = React.useState(false);
  const [selectedGallery, setSelectedGallery] = React.useState<Gallery | null>(
    null,
  );
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchGalleries({
      page: currentPage,
      pageSize,
      search: searchQuery || undefined,
    });
  }, [fetchGalleries, currentPage, pageSize, searchQuery]);

  const handleCreate = () => {
    setSelectedGallery(null);
    setIsGalleryDialogOpen(true);
  };

  const handleEdit = (gallery: Gallery) => {
    setSelectedGallery(gallery);
    setIsGalleryDialogOpen(true);
  };

  const handleView = (gallery: Gallery) => {
    setSelectedGallery(gallery);
    setIsImageDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteGallery(deletingId);
      toast.success(t("Gallery deleted successfully"));
    } catch (error) {
      toast.error(t("Failed to delete gallery"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t("Gallery Management")}
          description={t("Manage your gallery collections and images")}
        />
        <Button
          onClick={handleCreate}
          className="bg-primary hover:bg-primary/90 rounded-xl"
        >
          <Plus className="mr-2 size-4" />
          {t("Create Gallery")}
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t("Search galleries...")}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
          className="pl-10 bg-card border-border text-foreground focus:ring-primary rounded-xl"
        />
      </div>

      {isLoading && galleries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-10 animate-spin mb-4 text-primary" />
          <p>{t("Loading galleries...")}</p>
        </div>
      ) : galleries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-3xl bg-card">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Images className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            {searchQuery
              ? t("No galleries match your search")
              : t("No galleries found")}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? t("Try a different search term.")
              : t("Start by creating your first gallery collection.")}
          </p>
          {!searchQuery && (
            <Button
              onClick={handleCreate}
              variant="outline"
              className="border-border text-foreground"
            >
              <Plus className="mr-2 size-4" />
              {t("Create Gallery")}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {galleries.map((gallery) => (
              <GalleryCard
                key={gallery.id}
                gallery={gallery}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>

          {pagination && pagination.total > 0 && (
            <div className="mt-4">
              <PaginationFooter
                currentPage={currentPage}
                pageSize={pageSize}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                startIndex={(currentPage - 1) * pageSize}
                endIndex={currentPage * pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                canGoNext={currentPage < pagination.totalPages}
                canGoPrevious={currentPage > 1}
                itemLabel={t("galleries")}
              />
            </div>
          )}
        </>
      )}

      <GalleryDialog
        open={isGalleryDialogOpen}
        onOpenChange={setIsGalleryDialogOpen}
        gallery={selectedGallery}
      />

      <ImageManagementDialog
        open={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
        gallery={selectedGallery}
      />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Are you absolutely sure?")}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t("This action cannot be undone. This will permanently delete the gallery and all its associated images.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-muted">
              {t("Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
