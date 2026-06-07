"use client";

import Image from "next/image";
import { Eye, Pencil, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import type { Gallery } from "@/lib/stores/gallery-store";

import { getUploadUrl } from "@/lib/axios";

interface GalleryCardProps {
  gallery: Gallery;
  onView: (gallery: Gallery) => void;
  onEdit: (gallery: Gallery) => void;
  onDelete: (id: string) => void;
}

export function GalleryCard({
  gallery,
  onView,
  onEdit,
  onDelete,
}: GalleryCardProps) {
  const imageCount = gallery.images?.length || 0;
  const mainImage = gallery.images?.[0]?.filename;

  return (
    <Card className="overflow-hidden bg-card border border-border group hover:shadow-lg transition-all duration-300 rounded-2xl">
      <CardContent className="p-0">
        <div className="relative overflow-hidden bg-muted rounded-t-2xl aspect-[16/9]">
          {mainImage ? (
            <Image
              src={getUploadUrl(mainImage)}
              alt={gallery.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="size-full flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="size-12 mb-2 opacity-20" />
              <span className="text-sm font-medium">No images</span>
            </div>
          )}
          {imageCount > 1 && (
            <Badge
              variant="secondary"
              className="absolute top-3 right-3 bg-black/60 text-white border-none backdrop-blur-md hover:bg-black/70"
            >
              +{imageCount - 1} more
            </Badge>
          )}
        </div>
      </CardContent>

      <CardContent className="p-5 space-y-1.5">
        <h3 className="font-bold text-foreground text-lg truncate tracking-tight">
          {gallery.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 h-10 leading-relaxed">
          {gallery.description || "No description provided for this collection."}
        </p>
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground/60 flex items-center gap-1.5">
          <ImageIcon className="size-3" />
          {imageCount} {imageCount === 1 ? "image" : "images"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onView(gallery)}
            className="size-9 rounded-xl hover:scale-105 transition-transform"
            title="View Images"
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => onEdit(gallery)}
            className="size-9 rounded-xl hover:scale-105 transition-transform"
            title="Edit Gallery"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onDelete(gallery.id)}
            className="size-9 rounded-xl hover:scale-105 transition-transform shadow-sm"
            title="Delete Gallery"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
