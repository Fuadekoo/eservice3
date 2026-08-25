"use client";

import { Image as ImageIcon } from "lucide-react";
import { getUploadUrl } from "@/lib/axios";
import type { Gallery } from "@/lib/stores/gallery-store";
import { useTranslation } from "@/lib/i18n";

type GuestGalleryCardProps = {
  gallery: Gallery;
  onClick: () => void;
};

export function GuestGalleryCard({ gallery, onClick }: GuestGalleryCardProps) {
  const { t } = useTranslation();

  const images = gallery.images || [];
  const coverImage = images[0];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col text-left bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {coverImage ? (
          <img
            src={getUploadUrl(coverImage.filename)}
            alt={gallery.name}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="size-full flex flex-col items-center justify-center text-muted-foreground/40">
            <ImageIcon className="size-10 mb-2" />
            <span className="text-xs font-bold uppercase tracking-widest">
              {t("No Images")}
            </span>
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute top-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm border border-white/10">
            +{images.length - 1}
          </div>
        )}
      </div>

      <div className="p-4 space-y-1">
        <h3 className="text-base font-bold text-foreground leading-snug break-words group-hover:text-primary transition-colors">
          {gallery.name}
        </h3>
        {gallery.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {gallery.description}
          </p>
        )}
      </div>
    </button>
  );
}
