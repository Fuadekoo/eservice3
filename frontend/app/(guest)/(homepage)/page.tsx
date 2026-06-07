"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ArrowRight,
  Building2,
  Users,
  Image as ImageIcon,
  Loader2,
  ChevronRight,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useOfficeStore } from "@/lib/stores/office-store";
import { useAdministrationStore } from "@/lib/stores/administration-store";
import { useGalleryStore, type Gallery } from "@/lib/stores/gallery-store";
import { useLanguagesStore } from "@/lib/stores/languages-store";
import { Logo } from "@/components/logo";
import { GovernmentOffices } from "@/components/guest/government-offices";
import { getUploadUrl } from "@/lib/axios";

export default function Page() {
  const { offices, fetchOffices, isLoading: loadingOffices } = useOfficeStore();
  const {
    sections: adminSections,
    fetchAdministration,
    isLoading: loadingAdmin,
  } = useAdministrationStore();
  const {
    galleries,
    fetchGalleries,
    isLoading: loadingGallery,
  } = useGalleryStore();
  const { getTranslationForKey } = useLanguagesStore();

  React.useEffect(() => {
    void fetchAdministration();
    void fetchGalleries();
  }, [fetchAdministration, fetchGalleries]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeroSection getTranslationForKey={getTranslationForKey} />

      <main className="container mx-auto px-4 py-24 space-y-24">
        {/* Offices Section */}
        <GovernmentOffices />

        {/* Administration Section */}
        {loadingAdmin ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-primary/5 rounded-[2rem] border border-primary/10">
            <Loader2 className="size-10 animate-spin mb-4 text-primary" />
            <p className="font-bold">
              {getTranslationForKey("Loading administration...")}
            </p>
          </div>
        ) : adminSections.length > 0 ? (
          <section id="administration" className="space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 text-foreground">
                <Users className="size-8 text-primary" />
                {getTranslationForKey("Administration")}
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center bg-card rounded-[2rem] p-8 md:p-12 border border-border shadow-xl">
              <div className="space-y-8 order-2 lg:order-1">
                <div className="space-y-2">
                  <div className="text-primary font-black uppercase tracking-[0.2em] text-sm">
                    {getTranslationForKey("ADMINISTRATION")}
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                    {adminSections[0].name}
                  </h3>
                </div>

                <div className="space-y-4 relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground pl-2">
                    {getTranslationForKey("Administration Message:")}
                  </div>
                  <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed italic font-medium pl-2">
                    "{adminSections[0].description}"
                  </p>
                </div>

                <div className="pt-6 flex flex-wrap gap-4">
                  <Button
                    className="rounded-xl px-8 h-14 font-bold text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    asChild
                  >
                    <Link href="/about">
                      {getTranslationForKey("Read Full Profile")}
                      <ArrowRight className="ml-2 size-5" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative order-1 lg:order-2 group">
                <div className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative aspect-[4/5] md:aspect-square rounded-3xl overflow-hidden border-8 border-background shadow-2xl shadow-black/20">
                  <img
                    src={getUploadUrl(adminSections[0].image)}
                    alt={adminSections[0].name}
                    className="size-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                    <p className="text-white font-bold text-xl">
                      {adminSections[0].name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="hidden">{/* No administration data found */}</div>
        )}

        {/* Gallery Section */}
        <section id="gallery" className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <ImageIcon className="size-8 text-primary" />
              {getTranslationForKey("Gallery")}
            </h2>
            <Button variant="ghost" className="font-bold rounded-xl" asChild>
              <Link href="/gallery">
                {getTranslationForKey("View All")}
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>

          {loadingGallery ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="size-10 animate-spin mb-4" />
              <p className="font-bold">
                {getTranslationForKey("Loading gallery...")}
              </p>
            </div>
          ) : galleries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {galleries.map((gallery) => (
                <GalleryCard
                  key={gallery.id}
                  gallery={gallery}
                  getTranslationForKey={getTranslationForKey}
                />
              ))}
            </div>
          ) : (
            <div className="col-span-full py-20 text-center border-4 border-dashed rounded-[3rem] border-muted/20 bg-muted/5">
              <ImageIcon className="size-16 text-muted/30 mx-auto mb-6" />
              <p className="text-muted-foreground text-xl font-bold">
                {getTranslationForKey("No photos available yet.")}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function GalleryCard({
  gallery,
  getTranslationForKey,
}: {
  gallery: Gallery;
  getTranslationForKey: (key: string) => string;
}) {
  const images = gallery.images || [];

  return (
    <div className="group flex flex-col bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-300">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {images.length > 0 ? (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000 + Math.random() * 2000,
              }),
            ]}
            className="size-full"
          >
            <CarouselContent className="-ml-0">
              {images.map((image) => (
                <CarouselItem key={image.id} className="pl-0 basis-full">
                  <img
                    src={getUploadUrl(image.filename)}
                    alt={gallery.name}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 && (
              <div className="absolute top-2 right-2 z-10">
                <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">
                  +{images.length - 1}
                </div>
              </div>
            )}
          </Carousel>
        ) : (
          <div className="size-full flex flex-col items-center justify-center text-muted-foreground/30">
            <ImageIcon className="size-10 mb-1" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              No Images
            </p>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-bold text-foreground truncate leading-none">
          {gallery.name}
        </h3>
      </div>
    </div>
  );
}

function HeroSection({
  getTranslationForKey,
}: {
  getTranslationForKey: (key: string) => string;
}) {
  const [search, setSearch] = React.useState("");

  return (
    <section className="relative min-h-[95vh] flex flex-col items-center justify-center text-center overflow-hidden bg-[#020617] text-white pt-20 pb-12 px-4">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] -left-1/4 w-[70%] h-[70%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] -right-1/4 w-[70%] h-[70%] bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <div className="container relative z-10 space-y-10 max-w-4xl mx-auto">
        {/* Emblem/Logo Section */}
        <div className="animate-in fade-in zoom-in duration-1000 flex justify-center">
          <div className="relative size-32 md:size-40 flex items-center justify-center transition-all duration-700 hover:scale-105">
            <div className="relative size-full flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Government Emblem"
                className="size-full object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            {getTranslationForKey("Welcome to East Shoa Services")}
          </h1>
          <p className="text-lg md:text-xl text-gray-400 font-medium max-w-2xl mx-auto">
            {getTranslationForKey(
              "Access government services online, anytime, anywhere",
            )}
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto w-full animate-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="relative group">
            <Input
              placeholder={
                getTranslationForKey("guest.searchOffices") ||
                "Search for offices or services..."
              }
              className="h-14 pl-6 pr-12 rounded-xl bg-white/5 border-white/10 focus:bg-white/10 focus:border-blue-500/50 text-white placeholder:text-gray-500 text-lg transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 size-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
          </div>

          <Button
            size="lg"
            className="mt-6 rounded-xl px-10 h-14 font-bold text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all"
            asChild
          >
            <Link href="/signup">{getTranslationForKey("Get Started")}</Link>
          </Button>
        </div>

        {/* Integrated CTA Card */}
        <div className="mt-16 w-full max-w-2xl mx-auto">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {getTranslationForKey("Need Government Services?")}
              </h2>
              <p className="text-gray-400 font-medium">
                {getTranslationForKey(
                  "Submit your request, then access your service anywhere, anytime.",
                )}
              </p>
            </div>
            <Button
              variant="secondary"
              className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold border-none transition-all"
              asChild
            >
              <Link href="/signin">{getTranslationForKey("Login")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
