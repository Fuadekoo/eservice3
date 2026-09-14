import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RouteGuard } from "@/components/auth/route-guard";
import { BrandThemeSync } from "@/components/providers/brand-theme-sync";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import type { Metadata } from "next";

/**
 * Nothing behind sign-in should be indexed or previewed. These routes are
 * per-user and often carry record ids in the path, so a crawler that reached
 * one would be indexing a URL that means nothing to anyone else — and a chat
 * client unfurling a pasted dashboard link would show a card for a page the
 * reader cannot open. Applies to every route nested under this layout.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // JWT tokens are stored in localStorage (client-side only)
  // Server-side check is handled by the auth middleware on API calls
  // For client-side protection, the DashboardShell component will handle redirects
  // if the token is missing or invalid

  return (
    <div className="fixed inset-0 h-dvh grid overflow-hidden">
      {/* Reconciles this browser's cached palette with the office's saved one. */}
      <BrandThemeSync />
      <DashboardShell>
        <RouteGuard>{children}</RouteGuard>
      </DashboardShell>
    </div>
  );
}
