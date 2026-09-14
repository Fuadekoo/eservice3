import type { Metadata } from "next";
import type { ReactNode } from "react";

import { pageMetadata } from "@/lib/seo";

/**
 * The page itself is a client component, which cannot export `metadata` — a
 * segment layout is where a "use client" route gets its share card.
 */
export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Who runs this service: the government offices taking applications, the administration behind them, and what each one is responsible for.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
