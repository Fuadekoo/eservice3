"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";
import {
  getLanguageFromCookie,
  setLanguageCookie,
  type Language,
} from "@/lib/utils/cookies";
import Cookies from "js-cookie";

const languages = [
  {
    code: "or" as Language,
    name: "Afaan Oromo",
    nativeName: "Afaan Oromoo",
  },
  {
    code: "am" as Language,
    name: "Amharic",
    nativeName: "አማርኛ",
  },
  {
    code: "en" as Language,
    name: "English",
    nativeName: "English",
  },
];

export function LanguageGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Do not show language gate on public docs
  const isDocsRoute = pathname?.startsWith("/docs");

  useEffect(() => {
    if (isDocsRoute) return;

    setIsMounted(true);
    // Check if user has already selected a language in cookies
    const cookieLang = getLanguageFromCookie();
    const cookieExists = Cookies.get("eservice-language");

    if (
      !cookieExists ||
      !cookieLang ||
      !languages.some((lang) => lang.code === cookieLang)
    ) {
      // No language cookie set, show the gate
      setIsOpen(true);
    } else {
      // Language already selected, don't show the gate
      setIsOpen(false);
    }
  }, [isDocsRoute]);

  const handleLanguageSelect = (langCode: Language) => {
    // Set language in Zustand store
    setLanguage(langCode);

    // Set cookie
    setLanguageCookie(langCode);

    setIsOpen(false);

    // Redirect to the language-specific URL
    const currentPath = pathname?.replace(/^\/(en|am|or)/, "") || "";
    const newPath =
      currentPath === "/" ? `/${langCode}` : `/${langCode}${currentPath}`;
    router.replace(newPath);
  };

  if (!isMounted) {
    return null;
  }

  if (isDocsRoute) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Globe className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Choose a language?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-6">
          {languages.map((language) => (
            <Button
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className="w-full justify-start h-auto py-4 px-4 text-left hover:bg-accent"
              variant="outline"
            >
              <div className="flex flex-col items-start">
                <span className="font-semibold text-base">
                  {language.nativeName}
                </span>
                <span className="text-sm text-muted-foreground">
                  {language.name}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
