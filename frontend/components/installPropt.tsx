"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const { t } = useTranslation();

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event): void => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  const onInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-card p-4 text-card-foreground shadow-lg">
      <p className="text-sm">{t("Install this application?")}</p>
      <Button size="sm" className="mt-3" onClick={onInstallClick}>
        {t("Install")}
      </Button>
    </div>
  );
}
