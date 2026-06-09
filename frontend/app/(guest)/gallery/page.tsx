"use client";

import React from "react";
import { Images, Loader2 } from "lucide-react";
import { GuestPageHero } from "@/components/guest/guest-page-hero";
import { GuestGalleryCard } from "@/components/guest/guest-gallery-card";
import { GalleryLightbox } from "@/components/guest/gallery-lightbox";
import { useGalleryStore, type Gallery } from "@/lib/stores/gallery-store";
import { useLanguagesStore } from "@/lib/stores/languages-store";

export default function GalleryPage() {
  const { galleries, fetchGalleries, isLoading, pagination } = useGalleryStore();
  const { getTranslationForKey: t } = useLanguagesStore();
  const [selectedGallery, setSelectedGallery] = React.useState<Gallery | null>(
    null,
  );
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

  React.useEffect(() => {
    void fetchGalleries({ pageSize: 24 });
  }, [fetchGalleries]);

  const openGallery = (gallery: Gallery) => {
    setSelectedGallery(gallery);
    setIsLightboxOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <GuestPageHero
        icon={Images}
        title={t("Gallery")}
        description={t(
          "Explore photos and moments from East Shoa government services and community activities.",
        )}
      />

      <main className="container mx-auto px-4 py-16 md:py-20">
        {isLoading && galleries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="size-10 animate-spin mb-4 text-primary" />
            <p className="font-bold">{t("Loading gallery...")}</p>
          </div>
        ) : galleries.length === 0 ? (
          <div className="py-24 text-center rounded-[2rem] border-2 border-dashed border-muted/30 bg-muted/5">
            <Images className="size-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-xl font-bold text-muted-foreground">
              {t("No photos available yet.")}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {galleries.map((gallery) => (
                <GuestGalleryCard
                  key={gallery.id}
                  gallery={gallery}
                  onClick={() => openGallery(gallery)}
                />
              ))}
            </div>

            {pagination && pagination.total > galleries.length && (
              <p className="text-center text-sm text-muted-foreground mt-10">
                {t("Showing")} {galleries.length} {t("of")} {pagination.total}{" "}
                {t("galleries")}
              </p>
            )}
          </>
        )}
      </main>

      <GalleryLightbox
        gallery={selectedGallery}
        open={isLightboxOpen}
        onOpenChange={setIsLightboxOpen}
        imageCounterLabel={(current, total) =>
          `${t("Image")} ${current} ${t("of")} ${total}`
        }
      />
    </div>
  );
}
