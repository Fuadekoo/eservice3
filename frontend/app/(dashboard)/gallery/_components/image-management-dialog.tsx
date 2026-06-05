"use client";

import * as React from "react";
import Image from "next/image";
import { Plus, Trash2, X, Loader2, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGalleryStore, type Gallery } from "@/lib/stores/gallery-store";
import { uploadFileOnly } from "@/lib/file-upload";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ImageManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gallery: Gallery | null;
}

export function ImageManagementDialog({
  open,
  onOpenChange,
  gallery,
}: ImageManagementDialogProps) {
  const { addImage, deleteImage, fetchGalleries } = useGalleryStore();
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  if (!gallery) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFileOnly(file);
      await addImage(gallery.id, {
        filename: result.filename,
        order: gallery.images?.length || 0,
      });
      toast.success("Image added to gallery");
      // Refresh galleries to update UI
      await fetchGalleries();
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleDelete = async (imageId: string) => {
    setIsDeleting(imageId);
    try {
      await deleteImage(imageId);
      toast.success("Image deleted");
      await fetchGalleries();
    } catch (error) {
      toast.error("Failed to delete image");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col bg-[#121212] text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>{gallery.name} - Images</DialogTitle>
          <DialogDescription className="text-gray-400">
            Manage images in this collection.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-[300px] py-4">
          {!gallery.images || gallery.images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
              <ImageIcon className="size-12 mb-2 opacity-20" />
              <p>No images in this gallery</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {gallery.images.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl overflow-hidden bg-[#1e1e1e]"
                >
                  <AspectRatio ratio={1 / 1}>
                    <Image
                      src={`/api/uploads/${img.filename}`}
                      alt="Gallery image"
                      fill
                      className="object-cover"
                    />
                  </AspectRatio>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      disabled={isDeleting === img.id}
                      onClick={() => handleDelete(img.id)}
                      className="size-8 rounded-full"
                    >
                      {isDeleting === img.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-6 flex justify-between items-center border-t border-gray-800">
          <p className="text-sm text-gray-500">
            {gallery.images?.length || 0} images total
          </p>
          <div className="relative">
            <Button
              disabled={isUploading}
              className="bg-primary hover:bg-primary/90 rounded-xl"
            >
              {isUploading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              Add Image
            </Button>
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
