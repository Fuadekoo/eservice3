import type { Metadata } from "next";
import type { ReactNode } from "react";

import { pageMetadata } from "@/lib/seo";

/**
 * Not indexed: account recovery is a dead end for a search visitor, and a
 * result that drops someone onto a password form is a phishing shape nobody
 * benefits from. It still carries a title and card in case the link is shared.
 */
export const metadata: Metadata = pageMetadata({
  title: "Reset Your Password",
  description: "Recover access to your e-Service account using your phone number.",
  path: "/forget-password",
  index: false,
});

export default function ForgetPasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
