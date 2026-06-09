"use client";

import Link from "next/link";
import {
  BookOpen,
  ExternalLink,
  PlayCircle,
  ArrowRight,
  Video,
} from "lucide-react";
import { GuestPageHero } from "@/components/guest/guest-page-hero";
import { Button } from "@/components/ui/button";
import { useLanguagesStore } from "@/lib/stores/languages-store";
import {
  HOW_TO_APPLY_STEPS,
  TUTORIAL_VIDEO_URL,
  getYouTubeEmbedUrl,
} from "@/lib/config/how-to-apply";

export default function HowToApplyPage() {
  const { getTranslationForKey: t } = useLanguagesStore();
  const embedUrl = getYouTubeEmbedUrl(TUTORIAL_VIDEO_URL);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <GuestPageHero
        icon={BookOpen}
        title={t("How to Apply")}
        description={t(
          "A simple step-by-step guide to applying for government services through East Shoa E-Service.",
        )}
      />

      <main className="container mx-auto px-4 py-16 md:py-24 space-y-20">
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-black tracking-tight">
              {t("Step-by-Step Guide")}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t(
                "Follow these steps from account creation to submitting your service request.",
              )}
            </p>
          </div>

          <ol className="grid gap-6 max-w-4xl mx-auto">
            {HOW_TO_APPLY_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.step}
                  className="flex gap-5 sm:gap-6 rounded-[1.5rem] border border-border bg-card p-6 sm:p-8 shadow-sm"
                >
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20">
                      {item.step}
                    </div>
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="size-5 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                      {t(item.titleKey)}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t(item.descriptionKey)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto">
              <Video className="size-7 text-red-500" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              {t("Video Tutorial")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t(
                "Watch this short tutorial to see the full application process in action.",
              )}
            </p>
          </div>

          {embedUrl ? (
            <div className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-[1.5rem] border border-border shadow-xl bg-black">
                <iframe
                  src={embedUrl}
                  title={t("How to apply tutorial video")}
                  className="absolute inset-0 size-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="flex justify-center">
                <Button variant="outline" className="rounded-xl font-bold" asChild>
                  <a
                    href={TUTORIAL_VIDEO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 size-4" />
                    {t("Open on YouTube")}
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border-2 border-dashed border-muted/30 bg-muted/5 p-10 md:p-14 text-center space-y-4">
              <PlayCircle className="size-16 text-muted-foreground/30 mx-auto" />
              <p className="text-lg font-bold text-muted-foreground">
                {t("Video tutorial coming soon.")}
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {t(
                  "An administrator can add a YouTube link by setting NEXT_PUBLIC_TUTORIAL_VIDEO_URL in the environment.",
                )}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-[2rem] bg-[#0047FF] text-white p-8 md:p-12 text-center space-y-6 max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            {t("Start Your Application")}
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto text-lg">
            {t(
              "Create an account or sign in, then browse services and apply online in minutes.",
            )}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="rounded-xl px-8 h-12 font-bold bg-white text-[#0047FF] hover:bg-white/90"
              asChild
            >
              <Link href="/signup">
                {t("Create Account")}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl px-8 h-12 font-bold border-white/30 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/">{t("Browse Services")}</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
