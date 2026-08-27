import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RouteGuard } from "@/components/auth/route-guard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

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
      <DashboardShell>
        <RouteGuard>{children}</RouteGuard>
      </DashboardShell>
    </div>
  );
}
