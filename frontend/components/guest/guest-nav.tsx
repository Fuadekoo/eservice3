"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguagesStore } from "@/lib/stores/languages-store";
import { useTranslation } from "@/lib/i18n";

const NAV_LINKS = [
  { href: "/", labelKey: "Home" },
  { href: "/about", labelKey: "About" },
  { href: "/how-to-apply", labelKey: "How to Apply" },
] as const;

export function GuestNav({ className }: { className?: string }) {
  const { t } = useTranslation();

  const pathname = usePathname();
  const { getTranslationForKey } = useLanguagesStore();

  return (
    <nav
      className={cn(
        "hidden md:flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1",
        className,
      )}
      aria-label={t("Main navigation")}
    >
      {NAV_LINKS.map((link) => {
        const isActive =
          link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/80",
            )}
          >
            {getTranslationForKey(link.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

export function GuestMobileNav({ className }: { className?: string }) {
  const { t } = useTranslation();

  const pathname = usePathname();
  const { getTranslationForKey } = useLanguagesStore();

  return (
    <nav
      className={cn(
        "flex md:hidden items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1",
        className,
      )}
      aria-label={t("Main navigation")}
    >
      {NAV_LINKS.map((link) => {
        const isActive =
          link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold border transition-colors",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:text-foreground",
            )}
          >
            {getTranslationForKey(link.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
