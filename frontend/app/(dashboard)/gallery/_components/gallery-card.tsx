"use client";

import Image from "next/image";
import { Eye, Pencil, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import type { Gallery } from "@/lib/stores/gallery-store";

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
    <Card className="overflow-hidden bg-[#121212] border-none group">
      <CardContent className="p-0">
        <div className="relative overflow-hidden bg-[#1e1e1e] rounded-t-xl">
          <AspectRatio ratio={16 / 9}>
            {mainImage ? (
              <Image
                src={`/api/uploads/${mainImage}`}
                alt={gallery.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="size-full flex flex-col items-center justify-center text-gray-600">
                <ImageIcon className="size-12 mb-2" />
                <span className="text-sm">No images</span>
              </div>
            )}
          </AspectRatio>
          {imageCount > 1 && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 bg-black/60 text-white border-none hover:bg-black/70"
            >
              +{imageCount - 1} more
            </Badge>
          )}
        </div>
      </CardContent>

      <CardContent className="p-4 space-y-1">
        <h3 className="font-semibold text-white text-base truncate">
          {gallery.name}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-1 h-5">
          {gallery.description || "No description"}
        </p>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {imageCount} {imageCount === 1 ? "image" : "images"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onView(gallery)}
            className="size-8 bg-[#1e1e1e] border-none text-white hover:bg-gray-800"
            title="View Images"
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onEdit(gallery)}
            className="size-8 bg-[#1e1e1e] border-none text-white hover:bg-gray-800"
            title="Edit Gallery"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon-sm"
            onClick={() => onDelete(gallery.id)}
            className="size-8 bg-[#f05252] hover:bg-[#d94444] border-none"
            title="Delete Gallery"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
