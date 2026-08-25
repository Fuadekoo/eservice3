"use client";

import { WifiOff } from "lucide-react";

import { useTranslation } from "@/lib/i18n";

/**
 * Served by the service worker when a navigation fails and nothing is cached.
 * Must stay dependency-light — it renders with no network available, so the
 * copy comes from the translation map the store persisted on the last visit
 * and falls back to English when there is nothing stored.
 */
export default function OfflinePage() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <WifiOff className="size-8" />
      </div>
      <h1 className="text-2xl font-black tracking-tight">
        {t("You're offline")}
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t(
          "e-Service needs a connection to load offices and services. Check your network and try again.",
        )}
      </p>
      <p className="text-xs text-muted-foreground/70">
        {t("Pages you already opened may still work.")}
      </p>
    </main>
  );
}
