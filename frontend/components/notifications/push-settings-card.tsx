"use client";

import * as React from "react";
import {
  Bell,
  BellOff,
  Laptop,
  Loader2,
  Send,
  ShieldAlert,
  Smartphone,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { usePushStore } from "@/lib/stores/push-store";
import { useTranslation } from "@/lib/i18n";

/**
 * Turns a user-agent string into something a person can recognise.
 *
 * Deliberately coarse: the point is to let someone pick their own phone out of
 * a list of three, not to fingerprint the browser.
 */
function describeDevice(userAgent: string | null): {
  label: string;
  isMobile: boolean;
} {
  if (!userAgent) return { label: "Unknown device", isMobile: false };

  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\/|Opera/.test(userAgent)
      ? "Opera"
      : /Chrome\//.test(userAgent)
        ? "Chrome"
        : /Firefox\//.test(userAgent)
          ? "Firefox"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "Browser";

  const platform = /Windows/.test(userAgent)
    ? "Windows"
    : /Android/.test(userAgent)
      ? "Android"
      : /iPhone|iPad|iPod/.test(userAgent)
        ? "iOS"
        : /Mac OS X/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "";

  return {
    label: platform ? `${browser} on ${platform}` : browser,
    isMobile: /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent),
  };
}

/**
 * Browser-notification settings.
 *
 * Push permission is per-browser, not per-account, so this screen has to make
 * two different things visible at once: whether *this* browser is subscribed,
 * and which other devices the account is still delivering to. Conflating them
 * is why "I turned notifications off but still get them on my phone" happens.
 */
export function PushSettingsCard() {
  const { t } = useTranslation();

  const isChecking = usePushStore((state) => state.isChecking);
  const isSupported = usePushStore((state) => state.isSupported);
  const isServerEnabled = usePushStore((state) => state.isServerEnabled);
  const permission = usePushStore((state) => state.permission);
  const isSubscribed = usePushStore((state) => state.isSubscribed);
  const isBusy = usePushStore((state) => state.isBusy);
  const needsHomeScreenInstall = usePushStore(
    (state) => state.needsHomeScreenInstall,
  );

  const devices = usePushStore((state) => state.devices);
  const isLoadingDevices = usePushStore((state) => state.isLoadingDevices);
  const currentEndpoint = usePushStore((state) => state.currentEndpoint);

  const refresh = usePushStore((state) => state.refresh);
  const loadDevices = usePushStore((state) => state.loadDevices);
  const removeDevice = usePushStore((state) => state.removeDevice);
  const toggle = usePushStore((state) => state.toggle);
  const test = usePushStore((state) => state.test);

  React.useEffect(() => {
    void refresh();
    void loadDevices();
  }, [refresh, loadDevices]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Notifications")}</CardTitle>
        <CardDescription>
          {t("Get alerted when a request is reviewed or an appointment is confirmed — even when e-Service is closed.")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── The switch, or the reason there isn't one ──────────── */}
        {isChecking ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("Checking this browser…")}
          </div>
        ) : !isSupported ? (
          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 text-sm">
              <p className="font-medium">
                {t("This browser can't show notifications")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {needsHomeScreenInstall
                  ? t("On iPhone and iPad, add e-Service to your Home Screen first — Safari only allows notifications for installed apps.")
                  : t("Try Chrome, Edge, Firefox, or Safari 16.4 and later.")}
              </p>
            </div>
          </div>
        ) : !isServerEnabled ? (
          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 text-sm">
              <p className="font-medium">{t("Notifications aren't set up yet")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("The server has no push keys configured. Ask an administrator to add them.")}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Label htmlFor="push-toggle" className="text-sm font-medium">
                  {t("Notifications on this device")}
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isSubscribed
                    ? t("This browser will receive alerts.")
                    : t("Turn on to receive alerts in this browser.")}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {isBusy && (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                )}
                <Switch
                  id="push-toggle"
                  checked={isSubscribed}
                  disabled={isBusy || permission === "denied"}
                  onCheckedChange={(checked) => void toggle(checked)}
                />
              </div>
            </div>

            {permission === "denied" && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <BellOff className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-destructive">
                    {t("Blocked in browser settings")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("Open the padlock icon in the address bar, allow notifications for this site, then reload the page.")}
                  </p>
                </div>
              </div>
            )}

            {isSubscribed && (
              <Button
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() => void test()}
              >
                <Send className="mr-2 size-4" />
                {t("Send a test notification")}
              </Button>
            )}
          </>
        )}

        {/* ── Every device this account delivers to ──────────────── */}
        {(devices.length > 0 || isLoadingDevices) && (
          <>
            <Separator />

            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <Bell className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">
                  {t("Devices receiving alerts")}
                </h3>
              </div>

              {isLoadingDevices ? (
                <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  {t("Loading devices…")}
                </div>
              ) : (
                <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
                  {devices.map((device) => {
                    const { label, isMobile } = describeDevice(device.userAgent);
                    const isThisDevice = device.endpoint === currentEndpoint;

                    return (
                      <li
                        key={device.id}
                        className="flex min-w-0 items-center gap-3 p-3"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          {isMobile ? (
                            <Smartphone className="size-4" />
                          ) : (
                            <Laptop className="size-4" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {label}
                            {isThisDevice && (
                              <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                {t("This device")}
                              </span>
                            )}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {t("Added")}{" "}
                            {new Date(device.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${label}`}
                          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => void removeDevice(device)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
