import type { Metadata } from "next";
import type { ReactNode } from "react";

import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "How to Apply",
  description:
    "Five steps from creating an account to tracking your request: find the service you need, check its requirements and processing time, upload your documents and follow the decision.",
  path: "/how-to-apply",
});

export default function HowToApplyLayout({ children }: { children: ReactNode }) {
  return children;
}
