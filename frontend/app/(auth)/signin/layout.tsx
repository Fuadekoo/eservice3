import type { Metadata } from "next";
import type { ReactNode } from "react";

import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sign In",
  description:
    "Sign in to follow your applications, respond to requests for documents and manage your appointments.",
  path: "/signin",
});

export default function SignInLayout({ children }: { children: ReactNode }) {
  return children;
}
