"use client";

import * as React from "react";
import {
  Copy,
  Lock,
  LogOut,
  Monitor,
  RefreshCw,
  Save,
  Shield,
  ShieldCheck,
  Smartphone,
  TabletSmartphone,
  Trash2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { logout, useSession, type DeviceSessionInfo } from "@/lib/auth-client";
import { axiosInstance } from "@/lib/axios";
import { checkPasswordCriteria } from "@/lib/password-strength";

type TwoFactorStatus = {
  accountName: string;
  digits: number;
  enabled: boolean;
  issuer: string;
  pendingSetup: boolean;
  periodSeconds: number;
};

type TwoFactorSetup = {
  accountName: string;
  digits: number;
  enabled: boolean;
  issuer: string;
  manualEntryKey: string;
  otpauthUri: string;
  pendingSetup: boolean;
  periodSeconds: number;
};

type AccountSessionInfo = DeviceSessionInfo;

type AccountSessionsPayload = {
  sessions: AccountSessionInfo[];
};

function unwrapResponse<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }

  return response as T;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function detectCurrentSession(): string {
  if (typeof window === "undefined") {
    return "Current browser session";
  }

  const userAgent = window.navigator.userAgent;
  const browser = /Edg/.test(userAgent)
    ? "Edge"
    : /Chrome/.test(userAgent)
      ? "Chrome"
      : /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
        ? "Safari"
        : /Firefox/.test(userAgent)
          ? "Firefox"
          : "Browser";

  const platform = /Windows/i.test(userAgent)
    ? "Windows"
    : /Mac OS X/i.test(userAgent)
      ? "macOS"
      : /Android/i.test(userAgent)
        ? "Android"
        : /iPhone|iPad|iPod/i.test(userAgent)
          ? "iPhone"
          : /Linux/i.test(userAgent)
            ? "Linux"
            : "device";

  return `${browser} on ${platform}`;
}

function formatSessionDate(value?: string | Date | null): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString();
}

function getSessionIcon(deviceType?: string | null) {
  switch (deviceType) {
    case "mobile":
      return Smartphone;
    case "tablet":
      return TabletSmartphone;
    default:
      return Monitor;
  }
}

export function SecurityTab() {
  const { data: sessionData } = useSession();
  const currentSession = sessionData?.session?.currentSession;
  const [accountSessions, setAccountSessions] = React.useState<
    AccountSessionInfo[]
  >([]);
  const [disableCode, setDisableCode] = React.useState("");
  const [disablePassword, setDisablePassword] = React.useState("");
  const [isDisablingTwoFactor, setIsDisablingTwoFactor] = React.useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = React.useState(false);
  const [isPreparingTwoFactor, setIsPreparingTwoFactor] = React.useState(false);
  const [isRevokingOtherSessions, setIsRevokingOtherSessions] =
    React.useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = React.useState(true);
  const [isTwoFactorStatusLoading, setIsTwoFactorStatusLoading] =
    React.useState(true);
  const [isVerifyingTwoFactor, setIsVerifyingTwoFactor] = React.useState(false);
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [setupCode, setSetupCode] = React.useState("");
  const [setupData, setSetupData] = React.useState<TwoFactorSetup | null>(null);
  const [showDisableForm, setShowDisableForm] = React.useState(false);
  const [twoFactorStatus, setTwoFactorStatus] =
    React.useState<TwoFactorStatus | null>(null);
  const [revokingSessionId, setRevokingSessionId] = React.useState<
    string | null
  >(null);
  const displayCurrentSession = React.useMemo(
    () =>
      accountSessions.find((session) => session.isCurrent) ?? currentSession,
    [accountSessions, currentSession]
  );
  const otherSessionCount = accountSessions.filter(
    (session) => !session.isCurrent
  ).length;
  const sessionLabel =
    displayCurrentSession?.deviceName?.trim() || detectCurrentSession();
  const sessionLastSeen = formatSessionDate(displayCurrentSession?.lastSeenAt);
  const sessionSignedInAt = formatSessionDate(displayCurrentSession?.createdAt);

  const handlePasswordChange = React.useCallback(
    (field: keyof typeof passwordData, value: string) => {
      setPasswordData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const loadTwoFactorStatus = React.useCallback(async () => {
    setIsTwoFactorStatusLoading(true);
    try {
      const response = await axiosInstance.get("/auth/2fa/status");
      const payload = unwrapResponse<TwoFactorStatus>(response);
      setTwoFactorStatus(payload);

      if (payload.enabled || !payload.pendingSetup) {
        setSetupData(null);
      }

      if (!payload.enabled) {
        setShowDisableForm(false);
        setDisableCode("");
        setDisablePassword("");
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load two-factor status"));
    } finally {
      setIsTwoFactorStatusLoading(false);
    }
  }, []);

  const loadAccountSessions = React.useCallback(async () => {
    setIsSessionsLoading(true);
    try {
      const response = await axiosInstance.get("/auth/sessions");
      const payload = unwrapResponse<AccountSessionsPayload>(response);
      setAccountSessions(payload.sessions || []);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load account sessions"));
    } finally {
      setIsSessionsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadTwoFactorStatus();
    void loadAccountSessions();
  }, [loadAccountSessions, loadTwoFactorStatus]);

  const handlePasswordSubmit = React.useCallback(async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("Current password and new password are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    const criteria = checkPasswordCriteria(passwordData.newPassword);
    const unmet = Object.entries(criteria)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (unmet.length > 0) {
      toast.error("Password is too weak", {
        description:
          "Use 8+ characters with uppercase, lowercase, a number, and a special character.",
      });
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      await axiosInstance.post("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      await loadAccountSessions();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to change password"));
    } finally {
      setIsPasswordSubmitting(false);
    }
  }, [loadAccountSessions, passwordData]);

  const handlePrepareTwoFactor = React.useCallback(async () => {
    setIsPreparingTwoFactor(true);
    try {
      const response = await axiosInstance.post("/auth/2fa/setup");
      const payload = unwrapResponse<TwoFactorSetup>(response);
      setSetupData(payload);
      setSetupCode("");
      setShowDisableForm(false);
      toast.success("Scan the QR code, then enter the 6-digit code to finish setup.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to start two-factor setup"));
    } finally {
      setIsPreparingTwoFactor(false);
    }
  }, []);

  const handleVerifyTwoFactor = React.useCallback(async () => {
    if (setupCode.length !== 6) {
      toast.error("Enter the 6-digit code from your authenticator app");
      return;
    }

    setIsVerifyingTwoFactor(true);
    try {
      await axiosInstance.post("/auth/2fa/verify", {
        code: setupCode,
      });
      toast.success("Two-factor authentication is now enabled");
      setSetupCode("");
      setSetupData(null);
      await loadTwoFactorStatus();
      await loadAccountSessions();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to verify the two-factor code"));
    } finally {
      setIsVerifyingTwoFactor(false);
    }
  }, [loadAccountSessions, loadTwoFactorStatus, setupCode]);

  const handleDisableTwoFactor = React.useCallback(async () => {
    if (!disablePassword) {
      toast.error("Enter your current password to disable two-factor authentication");
      return;
    }

    if (disableCode.length !== 6) {
      toast.error("Enter the current 6-digit code from your authenticator app");
      return;
    }

    setIsDisablingTwoFactor(true);
    try {
      await axiosInstance.post("/auth/2fa/disable", {
        currentPassword: disablePassword,
        code: disableCode,
      });
      toast.success("Two-factor authentication disabled");
      setDisableCode("");
      setDisablePassword("");
      setShowDisableForm(false);
      await loadTwoFactorStatus();
      await loadAccountSessions();
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Failed to disable two-factor authentication")
      );
    } finally {
      setIsDisablingTwoFactor(false);
    }
  }, [disableCode, disablePassword, loadAccountSessions, loadTwoFactorStatus]);

  const handleRevokeSession = React.useCallback(
    async (session: AccountSessionInfo) => {
      if (session.isCurrent) {
        await logout();
        return;
      }

      setRevokingSessionId(session.id);
      try {
        await axiosInstance.delete(`/auth/sessions/${session.id}`);
        toast.success("Session removed successfully");
        await loadAccountSessions();
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Failed to remove session"));
      } finally {
        setRevokingSessionId(null);
      }
    },
    [loadAccountSessions]
  );

  const handleRevokeOtherSessions = React.useCallback(async () => {
    if (otherSessionCount === 0) {
      return;
    }

    setIsRevokingOtherSessions(true);
    try {
      await axiosInstance.post("/auth/sessions/revoke-others");
      toast.success("Other sessions removed successfully");
      await loadAccountSessions();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to remove other sessions"));
    } finally {
      setIsRevokingOtherSessions(false);
    }
  }, [loadAccountSessions, otherSessionCount]);

  const copyManualKey = React.useCallback(async () => {
    if (!setupData?.manualEntryKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(setupData.manualEntryKey);
      toast.success("Manual setup key copied");
    } catch {
      toast.error("Failed to copy the setup key");
    }
  }, [setupData?.manualEntryKey]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <PasswordInput
              id="currentPassword"
              value={passwordData.currentPassword}
              onChange={(event) =>
                handlePasswordChange("currentPassword", event.target.value)
              }
              disabled={isPasswordSubmitting}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <PasswordInput
              id="newPassword"
              showStrength
              value={passwordData.newPassword}
              onChange={(event) =>
                handlePasswordChange("newPassword", event.target.value)
              }
              disabled={isPasswordSubmitting}
              placeholder="Enter new password"
              autoComplete="new-password"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <PasswordInput
              id="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={(event) =>
                handlePasswordChange("confirmPassword", event.target.value)
              }
              disabled={isPasswordSubmitting}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={() => void handlePasswordSubmit()} disabled={isPasswordSubmitting}>
              {isPasswordSubmitting ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Changing...
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Require an authenticator-app code whenever you sign in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isTwoFactorStatusLoading ? (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Spinner className="size-4" />
              <span className="text-sm text-muted-foreground">
                Loading two-factor status...
              </span>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="two-factor-toggle" className="text-base">
                      Two-Factor Authentication
                    </Label>
                    {twoFactorStatus?.enabled ? (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Enabled
                      </span>
                    ) : twoFactorStatus?.pendingSetup ? (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                        Setup in progress
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Account: {twoFactorStatus?.accountName || "This account"}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="two-factor-toggle"
                      checked={Boolean(twoFactorStatus?.enabled)}
                      disabled
                    />
                    <span className="text-sm text-muted-foreground">
                      {twoFactorStatus?.enabled ? "Protected" : "Not protected"}
                    </span>
                  </div>

                  {twoFactorStatus?.enabled ? (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDisableForm((prev) => !prev)}
                    >
                      {showDisableForm ? "Cancel" : "Disable 2FA"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => void handlePrepareTwoFactor()}
                      disabled={isPreparingTwoFactor}
                    >
                      {isPreparingTwoFactor ? (
                        <>
                          <Spinner className="mr-2 size-4" />
                          Preparing...
                        </>
                      ) : twoFactorStatus?.pendingSetup ? (
                        "Resume setup"
                      ) : (
                        "Set up with QR code"
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {twoFactorStatus?.enabled && !showDisableForm && (
                <Alert>
                  <ShieldCheck className="size-4" />
                  <AlertTitle>Two-factor protection is active</AlertTitle>
                  <AlertDescription>
                    New sign-ins must include a valid authenticator code in
                    addition to your password.
                  </AlertDescription>
                </Alert>
              )}

              {setupData && (
                <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="mx-auto rounded-2xl border bg-white p-4 shadow-sm">
                    <QRCodeSVG
                      value={setupData.otpauthUri}
                      size={180}
                      level="M"
                      includeMargin
                    />
                  </div>

                  <div className="space-y-4">
                    <Alert>
                      <Smartphone className="size-4" />
                      <AlertTitle>Finish setup in three steps</AlertTitle>
                      <AlertDescription>
                        1. Open Google Authenticator, Microsoft Authenticator,
                        or another TOTP app.
                        <br />
                        2. Scan this QR code or enter the manual key.
                        <br />
                        3. Enter the current 6-digit code below to enable 2FA.
                      </AlertDescription>
                    </Alert>

                    <div className="rounded-xl border p-4 space-y-3">
                      <div>
                        <Label htmlFor="manualSetupKey">Manual setup key</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Issuer: {setupData.issuer}. Codes refresh every{" "}
                          {setupData.periodSeconds} seconds.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="manualSetupKey"
                          readOnly
                          value={setupData.manualEntryKey}
                          className="font-mono tracking-[0.25em]"
                        />
                        <Button variant="outline" onClick={() => void copyManualKey()}>
                          <Copy className="mr-2 size-4" />
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border p-4">
                      <div>
                        <Label>Verification code</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter the 6-digit code shown for this account.
                        </p>
                      </div>
                      <div className="flex justify-center sm:justify-start">
                        <InputOTP
                          maxLength={6}
                          value={setupCode}
                          onChange={setSetupCode}
                          disabled={isVerifyingTwoFactor}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                          </InputOTPGroup>
                          <InputOTPSeparator />
                          <InputOTPGroup>
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSetupData(null);
                            setSetupCode("");
                          }}
                          disabled={isVerifyingTwoFactor}
                        >
                          Close
                        </Button>
                        <Button
                          onClick={() => void handleVerifyTwoFactor()}
                          disabled={isVerifyingTwoFactor || setupCode.length !== 6}
                        >
                          {isVerifyingTwoFactor ? (
                            <>
                              <Spinner className="mr-2 size-4" />
                              Verifying...
                            </>
                          ) : (
                            "Verify and enable"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showDisableForm && twoFactorStatus?.enabled && (
                <div className="space-y-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  <div className="space-y-1">
                    <h3 className="font-medium">Disable two-factor authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Confirm your password and enter a current authenticator
                      code before 2FA is removed.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="disablePassword">Current Password</Label>
                    <PasswordInput
                      id="disablePassword"
                      value={disablePassword}
                      onChange={(event) => setDisablePassword(event.target.value)}
                      disabled={isDisablingTwoFactor}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Authenticator Code</Label>
                    <div className="flex justify-center sm:justify-start">
                      <InputOTP
                        maxLength={6}
                        value={disableCode}
                        onChange={setDisableCode}
                        disabled={isDisablingTwoFactor}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowDisableForm(false);
                        setDisableCode("");
                        setDisablePassword("");
                      }}
                      disabled={isDisablingTwoFactor}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => void handleDisableTwoFactor()}
                      disabled={
                        isDisablingTwoFactor ||
                        disableCode.length !== 6 ||
                        !disablePassword
                      }
                    >
                      {isDisablingTwoFactor ? (
                        <>
                          <Spinner className="mr-2 size-4" />
                          Disabling...
                        </>
                      ) : (
                        "Disable 2FA"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Session Security
          </CardTitle>
          <CardDescription>
            Review every device signed in to this account and remove any session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border p-4">
            <p className="font-medium">{sessionLabel}</p>
            {(displayCurrentSession?.browser ||
              displayCurrentSession?.operatingSystem) && (
              <p className="text-sm text-muted-foreground mt-1">
                {[
                  displayCurrentSession?.browser,
                  displayCurrentSession?.operatingSystem,
                ]
                  .filter(Boolean)
                  .join(" - ")}
              </p>
            )}
            {displayCurrentSession?.ipAddress && (
              <p className="text-sm text-muted-foreground mt-1">
                IP address: {displayCurrentSession.ipAddress}
              </p>
            )}
            {sessionLastSeen && (
              <p className="text-sm text-muted-foreground mt-1">
                Last active: {sessionLastSeen}
              </p>
            )}
            {sessionSignedInAt && (
              <p className="text-sm text-muted-foreground mt-1">
                Signed in: {sessionSignedInAt}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              This device stays signed in only while its server session exists.
              If this session is removed, this device must sign in again.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                Active sessions ({accountSessions.length})
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                These are all devices currently signed in to this account.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => void loadAccountSessions()}
                disabled={isSessionsLoading}
              >
                {isSessionsLoading ? (
                  <Spinner className="mr-2 size-4" />
                ) : (
                  <RefreshCw className="mr-2 size-4" />
                )}
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleRevokeOtherSessions()}
                disabled={isRevokingOtherSessions || otherSessionCount === 0}
              >
                {isRevokingOtherSessions ? (
                  <Spinner className="mr-2 size-4" />
                ) : (
                  <Trash2 className="mr-2 size-4" />
                )}
                Sign Out Other Devices
              </Button>
            </div>
          </div>

          {isSessionsLoading ? (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Spinner className="size-4" />
              <span className="text-sm text-muted-foreground">
                Loading active sessions...
              </span>
            </div>
          ) : accountSessions.length === 0 ? (
            <Alert>
              <ShieldCheck className="size-4" />
              <AlertTitle>No active sessions found</AlertTitle>
              <AlertDescription>
                No saved login sessions were found for this account.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {accountSessions.map((session) => {
                const SessionIcon = getSessionIcon(session.deviceType);
                const lastSeen = formatSessionDate(session.lastSeenAt);
                const signedIn = formatSessionDate(session.createdAt);
                const isRevoking = revokingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    className="rounded-xl border p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-3">
                        <div className="rounded-full bg-muted p-2">
                          <SessionIcon className="size-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                              {session.deviceName?.trim() || "Unknown device"}
                            </p>
                            {session.isCurrent ? (
                              <Badge variant="success">Current device</Badge>
                            ) : null}
                            {session.deviceType ? (
                              <Badge variant="outline" className="capitalize">
                                {session.deviceType}
                              </Badge>
                            ) : null}
                          </div>

                          {(session.browser || session.operatingSystem) && (
                            <p className="text-sm text-muted-foreground">
                              {[session.browser, session.operatingSystem]
                                .filter(Boolean)
                                .join(" - ")}
                            </p>
                          )}

                          {session.ipAddress && (
                            <p className="text-sm text-muted-foreground">
                              IP address: {session.ipAddress}
                            </p>
                          )}

                          <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-3">
                            {lastSeen ? <span>Last active: {lastSeen}</span> : null}
                            {signedIn ? <span>Signed in: {signedIn}</span> : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        {session.isCurrent ? (
                          <Button
                            variant="outline"
                            onClick={() => void handleRevokeSession(session)}
                          >
                            <LogOut className="mr-2 size-4" />
                            Sign Out This Device
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            onClick={() => void handleRevokeSession(session)}
                            disabled={isRevoking}
                          >
                            {isRevoking ? (
                              <Spinner className="mr-2 size-4" />
                            ) : (
                              <Trash2 className="mr-2 size-4" />
                            )}
                            Remove Session
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
