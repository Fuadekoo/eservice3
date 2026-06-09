"use client";

import React, { useEffect } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogOut } from "lucide-react";
import { isAuthenticated, logout } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useLanguagesStore } from "@/lib/stores/languages-store";
import { GuestNav, GuestMobileNav } from "@/components/guest/guest-nav";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loadTranslations } = useLanguagesStore();

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  return (
    <div className="relative h-dvh overflow-auto">
      <Header />
      <div className="container mx-auto px-4 md:px-6 pb-2 md:hidden">
        <GuestMobileNav />
      </div>
      <main className="min-h-dvh">{children}</main>
      <Footer />
    </div>
  );
}

function Header() {
  const router = useRouter();
  const authenticated = isAuthenticated();
  const { getTranslationForKey } = useLanguagesStore();

  const handleLogout = () => {
    logout();
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 md:px-6 h-16 flex gap-4 items-center">
        <Logo collapsable />
        <div className="flex-1 flex justify-center">
          <GuestNav />
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <LanguageToggle />
          <Separator orientation="vertical" className="h-6" />
          <ThemeToggle />
          <Separator orientation="vertical" className="h-6" />
          {authenticated ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full hidden sm:flex"
                asChild
              >
                <Link href="/dashboard">
                  {getTranslationForKey("Dashboard")}
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 size-4" />
                <span className="hidden xs:inline">
                  {getTranslationForKey("Logout")}
                </span>
              </Button>
            </div>
          ) : (
            <Button size="sm" className="rounded-full px-6" asChild>
              <Link href="/signin">{getTranslationForKey("Sign In")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { getTranslationForKey } = useLanguagesStore();

  return (
    <footer className=" p-5 border-t text-sm text-muted-foreground bg-linear-to-b from-foreground/10 via-transparent to-transparent ">
      <div className="md:px-5 py-5 flex md:items-center gap-2 max-md:flex-col ">
        <Logo className="grayscale" small />
        <div className="flex-1 flex flex-wrap items-center gap-5 justify-center">
          <Link href="/">{getTranslationForKey("Home")}</Link>
          <Link href="/about">{getTranslationForKey("About")}</Link>
          <Link href="/how-to-apply">
            {getTranslationForKey("How to Apply")}
          </Link>
          <Link href="/terms-of-service">
            {getTranslationForKey("Terms of Service")}
          </Link>
          <Link href="/privacy-policy">
            {getTranslationForKey("Privacy Policy")}
          </Link>
        </div>
      </div>
      <div className="md:px-5 py-5 border-t flex items-center max-md:flex-col ">
        <p className="flex-1 text-center ">
          {getTranslationForKey("Designed and Developed by")}{" "}
          <Link
            href="https://fuadabdurahman.tech"
            target="_blank"
            className="text-blue-800 "
          >
            Fuad Abdurahman
          </Link>
        </p>
        <Separator orientation="vertical" className="max-h-6" />
        <p className="flex-1 text-center ">
          &copy; {new Date().getFullYear()}{" "}
          {getTranslationForKey("All rights reserved")}
        </p>
      </div>
    </footer>
  );
}
