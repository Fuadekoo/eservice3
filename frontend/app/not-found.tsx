"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative h-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Transparent Logo Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <Image
          src="/logo.png"
          alt="Logo"
          width={400}
          height={400}
          className="w-full max-w-md sm:max-w-lg md:max-w-xl h-auto object-contain"
          priority
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8 sm:py-12">
        {/* 404 Number */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-7xl sm:text-9xl md:text-[10rem] lg:text-[12rem] font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent leading-none">
            404
          </h1>
        </div>

        {/* Error Icon */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="relative">
            <AlertCircle className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-primary/20" />
            <AlertCircle className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Title and Description */}
        <div className="mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground">
            Page Not Found
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-2 leading-relaxed">
            Oops! The page you're looking for doesn't exist.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
            It might have been moved, deleted, or the URL might be incorrect.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-10">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto min-w-[140px] sm:min-w-[160px] text-sm sm:text-base"
          >
            <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Go Back
          </Button>
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto min-w-[140px] sm:min-w-[160px] text-sm sm:text-base"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Go Home
            </Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border">
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            Need help? Try these options:
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground"
            >
              <Search className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Search
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground"
            >
              Browse Services
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 sm:top-20 left-4 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/5 rounded-full blur-3xl z-0"></div>
      <div className="absolute bottom-10 sm:bottom-20 right-4 sm:right-10 w-64 h-64 sm:w-96 sm:h-96 bg-secondary/5 rounded-full blur-3xl z-0"></div>
    </div>
  );
}
