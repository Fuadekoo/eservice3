"use client";

import { type LucideIcon } from "lucide-react";

type GuestPageHeroProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function GuestPageHero({
  icon: Icon,
  title,
  description,
}: GuestPageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#020617] text-white py-20 md:py-28">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] -left-1/4 w-[70%] h-[70%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] -right-1/4 w-[70%] h-[70%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center max-w-3xl space-y-5">
        <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 mx-auto">
          <Icon className="size-8 text-blue-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-gray-400 font-medium leading-relaxed">
          {description}
        </p>
      </div>
    </section>
  );
}
