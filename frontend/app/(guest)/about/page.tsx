"use client";

import React from "react";
import Link from "next/link";
import { Info, Loader2, Users, ArrowRight } from "lucide-react";
import { GuestPageHero } from "@/components/guest/guest-page-hero";
import { Button } from "@/components/ui/button";
import { useAboutStore } from "@/lib/stores/about-store";
import { useAdministrationStore } from "@/lib/stores/administration-store";
import { useLanguagesStore } from "@/lib/stores/languages-store";
import { getUploadUrl } from "@/lib/axios";

export default function AboutPage() {
  const { sections, fetchAbout, isLoading: loadingAbout } = useAboutStore();
  const {
    sections: administrators,
    fetchAdministration,
    isLoading: loadingAdmin,
  } = useAdministrationStore();
  const { getTranslationForKey: t } = useLanguagesStore();

  React.useEffect(() => {
    void fetchAbout();
    void fetchAdministration();
  }, [fetchAbout, fetchAdministration]);

  const isLoading =
    (loadingAbout && sections.length === 0) ||
    (loadingAdmin && administrators.length === 0);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <GuestPageHero
        icon={Info}
        title={t("About Us")}
        description={t(
          "Learn about East Shoa E-Service, our leadership, and the services we provide to the community.",
        )}
      />

      <main className="container mx-auto px-4 py-16 md:py-24 space-y-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="size-10 animate-spin mb-4 text-primary" />
            <p className="font-bold">{t("Loading about content...")}</p>
          </div>
        ) : (
          <>
            {administrators.length > 0 && (
              <section className="space-y-10">
                <div className="flex items-center gap-3">
                  <Users className="size-8 text-primary" />
                  <h2 className="text-3xl font-black tracking-tight">
                    {t("Leadership")}
                  </h2>
                </div>

                <div className="grid gap-8">
                  {administrators.map((admin, index) => (
                    <article
                      key={admin.id}
                      className={`grid lg:grid-cols-2 gap-10 items-center rounded-[2rem] border border-border bg-card p-6 md:p-10 shadow-sm ${
                        index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                      }`}
                    >
                      <div className="relative aspect-[4/5] max-h-[420px] rounded-3xl overflow-hidden border border-border shadow-lg">
                        <img
                          src={getUploadUrl(admin.image)}
                          alt={admin.name}
                          className="size-full object-cover object-top"
                        />
                      </div>
                      <div className="space-y-4">
                        <p className="text-primary font-black uppercase tracking-[0.2em] text-sm">
                          {t("Administration")}
                        </p>
                        <h3 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                          {admin.name}
                        </h3>
                        {admin.description && (
                          <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {admin.description}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {sections.length > 0 ? (
              <section className="space-y-10">
                <div className="flex items-center gap-3">
                  <Info className="size-8 text-primary" />
                  <h2 className="text-3xl font-black tracking-tight">
                    {t("About Our Platform")}
                  </h2>
                </div>

                <div className="grid gap-8">
                  {sections.map((section, index) => (
                    <article
                      key={section.id}
                      className={`grid lg:grid-cols-2 gap-10 items-center rounded-[2rem] border border-border bg-card p-6 md:p-10 shadow-sm ${
                        index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                      }`}
                    >
                      <div className="relative aspect-video rounded-3xl overflow-hidden border border-border shadow-lg">
                        <img
                          src={getUploadUrl(section.image)}
                          alt={section.name}
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                          {section.name}
                        </h3>
                        {section.description ? (
                          <p className="text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {section.description}
                          </p>
                        ) : (
                          <p className="text-muted-foreground italic">
                            {t("No description provided.")}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : (
              !administrators.length && (
                <div className="py-24 text-center rounded-[2rem] border-2 border-dashed border-muted/30 bg-muted/5">
                  <Info className="size-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-xl font-bold text-muted-foreground">
                    {t("About content will be published soon.")}
                  </p>
                </div>
              )
            )}

            <section className="rounded-[2rem] bg-primary/5 border border-primary/10 p-8 md:p-12 text-center space-y-6">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                {t("Ready to get started?")}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                {t(
                  "Follow our step-by-step guide to create an account and apply for government services online.",
                )}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button className="rounded-xl px-8 h-12 font-bold" asChild>
                  <Link href="/how-to-apply">
                    {t("How to Apply")}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl px-8 h-12 font-bold"
                  asChild
                >
                  <Link href="/">{t("Browse Services")}</Link>
                </Button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
