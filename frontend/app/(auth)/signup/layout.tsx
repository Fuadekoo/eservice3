import type { Metadata } from "next";
import type { ReactNode } from "react";

import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Create an Account",
  description:
    "Register with your phone number to apply for government services online and track every request from one place.",
  path: "/signup",
});

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return children;
}
