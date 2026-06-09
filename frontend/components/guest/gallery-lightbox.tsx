"use client";

import React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUploadUrl } from "@/lib/axios";
import type { Gallery } from "@/lib/stores/gallery-store";

type GalleryLightboxProps = {
  gallery: Gallery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
  imageCounterLabel?: (current: number, total: number) => string;
};

export function GalleryLightbox({
  gallery,
  open,
  onOpenChange,
  initialIndex = 0,
  imageCounterLabel = (current, total) => `Image ${current} of ${total}`,
}: GalleryLightboxProps) {
  const images = gallery?.images ?? [];
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    if (open) setActiveIndex(initialIndex);
  }, [open, initialIndex, gallery?.id]);

  React.useEffect(() => {
    if (!open || images.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setActiveIndex((index) => (index > 0 ? index - 1 : images.length - 1));
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((index) => (index < images.length - 1 ? index + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, images.length]);

  if (!gallery) return null;

  const activeImage = images[activeIndex];
  const hasMultiple = images.length > 1;

  const goToPrevious = () => {
    setActiveIndex((index) => (index > 0 ? index - 1 : images.length - 1));
  };

  const goToNext = () => {
    setActiveIndex((index) => (index < images.length - 1 ? index + 1 : 0));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100vw-1.5rem)] max-w-5xl sm:max-w-5xl p-0 gap-0 overflow-hidden rounded-2xl border-none bg-background shadow-2xl"
      >
        <DialogDescription className="sr-only">
          {gallery.name} image gallery viewer
        </DialogDescription>

        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
          <DialogTitle className="text-lg sm:text-xl font-bold text-foreground leading-snug break-words pr-4">
            {gallery.name}
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {images.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            No images in this gallery.
          </div>
        ) : (
          <>
            <div className="relative bg-black/95 pb-12">
              <div className="relative flex items-center justify-center min-h-[50vh] max-h-[65vh] px-14">
                <img
                  src={getUploadUrl(activeImage.filename)}
                  alt={`${gallery.name} - image ${activeIndex + 1}`}
                  className="max-h-[65vh] w-full object-contain"
                />

                {hasMultiple && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={goToPrevious}
                      className="absolute left-3 top-1/2 -translate-y-1/2 size-11 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                    >
                      <ChevronLeft className="size-6" />
                      <span className="sr-only">Previous image</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={goToNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 size-11 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                    >
                      <ChevronRight className="size-6" />
                      <span className="sr-only">Next image</span>
                    </Button>
                  </>
                )}
              </div>

              {hasMultiple && (
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                  {imageCounterLabel(activeIndex + 1, images.length)}
                </p>
              )}
            </div>

            {hasMultiple && (
              <div className="border-t border-border bg-muted/30 px-4 py-4">
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={cn(
                        "relative size-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                        index === activeIndex
                          ? "border-primary ring-2 ring-primary/30 scale-105"
                          : "border-transparent opacity-70 hover:opacity-100",
                      )}
                    >
                      <img
                        src={getUploadUrl(image.filename)}
                        alt={`${gallery.name} thumbnail ${index + 1}`}
                        className="size-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
