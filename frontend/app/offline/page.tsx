import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline | e-Service",
  description: "You are currently offline.",
};

/**
 * Served by the service worker when a navigation fails and nothing is cached.
 * Must stay fully static — it renders with no network available.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <WifiOff className="size-8" />
      </div>
      <h1 className="text-2xl font-black tracking-tight">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        e-Service needs a connection to load offices and services. Check your
        network and try again.
      </p>
      <p className="text-xs text-muted-foreground/70">
        Pages you already opened may still work.
      </p>
    </main>
  );
}
