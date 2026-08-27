"use client";

import * as React from "react";
import { Save, User, Phone, Upload, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { axiosInstance, getUploadUrl } from "@/lib/axios";
import { uploadFileOnly } from "@/lib/file-upload";
import {
  PHONE_FORMAT_MESSAGE,
  normalizeEthiopianMobilePhone,
} from "@/lib/phone";
import { useTranslation } from "@/lib/i18n";

// ─── Types ───────────────────────────────────────────────────────────────────

type ProfileForm = {
  firstName: string;
  fatherName: string;
  /** Persisted as the User `lastName` column (grandfather's name). */
  lastName: string;
  username: string;
  phoneNumber: string;
  gender: string;
  /** Uploaded image filename, or empty. */
  image: string;
};

const defaultProfile: ProfileForm = {
  firstName: "",
  fatherName: "",
  lastName: "",
  username: "",
  phoneNumber: "",
  gender: "",
  image: "",
};

function toProfile(raw: Record<string, unknown>): ProfileForm {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const nameParts = str(raw.name).split(" ");
  return {
    firstName: str(raw.firstName) || nameParts[0] || "",
    fatherName: str(raw.fatherName) || nameParts[1] || "",
    lastName: str(raw.lastName) || nameParts[2] || "",
    username: str(raw.username),
    phoneNumber: str(raw.phoneNumber) || str(raw.phone),
    gender: str(raw.gender),
    image: str(raw.image),
  };
}

function unwrap<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function syncCachedUser(user: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const cachedRaw = localStorage.getItem("user");
    const cached = cachedRaw ? JSON.parse(cachedRaw) : {};
    localStorage.setItem("user", JSON.stringify({ ...cached, ...user }));
    window.dispatchEvent(new Event("profile-updated"));
  } catch {
    /* ignore cache write errors */
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Fields that must hold a real value — never null, empty, or whitespace-only. */
const REQUIRED_FIELDS = [
  { key: "firstName", message: "First name is required." },
  { key: "fatherName", message: "Father's name is required." },
  { key: "lastName", message: "Grandfather's name is required." },
  { key: "username", message: "Username is required." },
] as const;

type FieldErrors = Partial<Record<keyof ProfileForm, string>>;

function validateProfile(profile: ProfileForm): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of REQUIRED_FIELDS) {
    if (!profile[field.key].trim()) errors[field.key] = field.message;
  }
  return errors;
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  icon: Icon,
  label,
  error,
  children,
}: {
  icon?: React.ElementType;
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80">
        {Icon && <Icon className="size-3.5 text-foreground/60" />}
        {label}
      </p>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// ─── ProfileTab ───────────────────────────────────────────────────────────────

export function ProfileTab() {
  const { t } = useTranslation();

  const [profile, setProfile] = React.useState<ProfileForm>(defaultProfile);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  // Phone-change (OTP) dialog state.
  const [phoneDialogOpen, setPhoneDialogOpen] = React.useState(false);
  const [phoneStep, setPhoneStep] = React.useState<"input" | "otp">("input");
  const [newPhone, setNewPhone] = React.useState("");
  const [otpCode, setOtpCode] = React.useState("");
  const [phoneError, setPhoneError] = React.useState("");
  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);

  // Seed from the locally cached user for an instant paint, then refresh from
  // the server so the form reflects the persisted profile.
  React.useEffect(() => {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        setProfile(toProfile(JSON.parse(raw) as Record<string, unknown>));
      } catch {
        /* keep defaults */
      }
    }

    let cancelled = false;
    void (async () => {
      try {
        const response = await axiosInstance.get("/auth/me");
        const payload = unwrap<{ user?: Record<string, unknown> }>(response);
        if (!cancelled && payload?.user) {
          setProfile(toProfile(payload.user));
        }
      } catch {
        /* fall back to cached values */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const set = (field: keyof ProfileForm, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }));
    // Clear the field's error as soon as the user starts correcting it.
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const initials =
    [profile.firstName, profile.fatherName]
      .map((s) => s[0] ?? "")
      .join("")
      .toUpperCase() || "US";

  const avatarSrc = profile.image ? getUploadUrl(profile.image) : undefined;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so re-selecting the same file fires onChange again.
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("Please choose an image file"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("Image must be 5 MB or smaller"));
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadFileOnly(file);
      set("image", uploaded.filename);
      toast.success(t("Photo uploaded. Click Save Changes to apply."));
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to upload photo"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    // A name may never be cleared: block the request rather than persisting a
    // blank, and surface the reason next to each offending field.
    const errors = validateProfile(profile);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(t("Please fill in all required fields"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Phone is intentionally excluded here — it can only change via OTP.
      const response = await axiosInstance.put("/auth/profile", {
        firstName: profile.firstName.trim(),
        fatherName: profile.fatherName.trim(),
        lastName: profile.lastName.trim(),
        username: profile.username.trim(),
        gender: profile.gender || undefined,
        image: profile.image,
      });

      const payload = unwrap<{ user?: Record<string, unknown> }>(response);
      const updated = payload?.user ? toProfile(payload.user) : profile;
      setProfile(updated);
      syncCachedUser(payload?.user ?? {});
      toast.success(t("Profile updated successfully"));
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update profile"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Phone change (OTP) ─────────────────────────────────────────────────────

  const openPhoneDialog = () => {
    setNewPhone("");
    setOtpCode("");
    setPhoneError("");
    setPhoneStep("input");
    setPhoneDialogOpen(true);
  };

  const handleSendPhoneOtp = async () => {
    const normalized = normalizeEthiopianMobilePhone(newPhone);
    if (!normalized) {
      setPhoneError(PHONE_FORMAT_MESSAGE);
      return;
    }
    if (normalized === profile.phoneNumber) {
      setPhoneError("This is already your current phone number.");
      return;
    }

    setPhoneError("");
    setIsSendingOtp(true);
    try {
      await axiosInstance.post("/auth/profile/phone/request-otp", {
        phone: normalized,
      });
      setOtpCode("");
      setPhoneStep("otp");
      toast.success(t("Verification code sent to the new number."));
    } catch (error) {
      const message = getErrorMessage(error, "Failed to send verification code");
      setPhoneError(message);
      toast.error(message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (otpCode.length !== 6) {
      setPhoneError("Enter the 6-digit code sent to your new number.");
      return;
    }

    setPhoneError("");
    setIsVerifyingOtp(true);
    try {
      const response = await axiosInstance.post("/auth/profile/phone/verify", {
        otp: otpCode,
      });
      const payload = unwrap<{ user?: Record<string, unknown> }>(response);
      const nextPhone =
        (typeof payload?.user?.phoneNumber === "string"
          ? payload.user.phoneNumber
          : undefined) ??
        normalizeEthiopianMobilePhone(newPhone) ??
        newPhone;

      setProfile((p) => ({ ...p, phoneNumber: nextPhone }));
      syncCachedUser({
        ...(payload?.user ?? {}),
        phoneNumber: nextPhone,
        phone: nextPhone,
      });
      setPhoneDialogOpen(false);
      toast.success(t("Phone number updated successfully"));
    } catch (error) {
      const message = getErrorMessage(error, "Failed to verify the code");
      setPhoneError(message);
      toast.error(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const busy = isSubmitting || isUploading;

  return (
    <Card className="rounded-3xl border shadow-none p-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          {t("Profile Information")}
        </CardTitle>
        <CardDescription>{t("Update your personal information")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-8 pt-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="-mt-6" />
          <Avatar className="size-28 text-xl">
            <AvatarImage src={avatarSrc} alt={profile.firstName} />
            <AvatarFallback className="bg-muted text-foreground/80 font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          <label
            htmlFor="photo-upload"
            className="flex cursor-pointer items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors aria-disabled:pointer-events-none aria-disabled:opacity-60"
            aria-disabled={busy}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {isUploading ? t("Uploading...") : t("Upload Photo")}
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={busy}
            />
          </label>
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2 max-w-6xl mx-auto">
          <Field
            icon={User}
            label={t("First Name")}
            error={fieldErrors.firstName ? t(fieldErrors.firstName) : undefined}
          >
            <Input
              value={profile.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder={t("First name")}
              disabled={busy}
              aria-invalid={Boolean(fieldErrors.firstName)}
              required
            />
          </Field>

          <Field
            icon={User}
            label={t("Father's Name")}
            error={
              fieldErrors.fatherName ? t(fieldErrors.fatherName) : undefined
            }
          >
            <Input
              value={profile.fatherName}
              onChange={(e) => set("fatherName", e.target.value)}
              placeholder={t("Father's name")}
              disabled={busy}
              aria-invalid={Boolean(fieldErrors.fatherName)}
              required
            />
          </Field>

          <Field
            icon={User}
            label={t("Grandfather's Name")}
            error={fieldErrors.lastName ? t(fieldErrors.lastName) : undefined}
          >
            <Input
              value={profile.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder={t("Grandfather's name")}
              disabled={busy}
              aria-invalid={Boolean(fieldErrors.lastName)}
              required
            />
          </Field>

          <Field
            label={t("Username")}
            error={fieldErrors.username ? t(fieldErrors.username) : undefined}
          >
            <Input
              value={profile.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder={t("Enter username")}
              disabled={busy}
              aria-invalid={Boolean(fieldErrors.username)}
              required
            />
          </Field>

          <Field icon={Phone} label={t("Phone Number")}>
            <div className="flex gap-2">
              <Input
                type="tel"
                value={profile.phoneNumber}
                readOnly
                placeholder={t("No phone number")}
                className="bg-muted/40"
              />
              <Button
                type="button"
                variant="outline"
                onClick={openPhoneDialog}
                disabled={busy}
                className="shrink-0"
              >
                {t("Change")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Changing your phone number requires SMS verification.")}
            </p>
          </Field>

          <Field label={t("Gender")}>
            <Select
              value={profile.gender}
              onValueChange={(v) => set("gender", v)}
              disabled={busy}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("Select gender")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">{t("Male")}</SelectItem>
                <SelectItem value="FEMALE">{t("Female")}</SelectItem>
                <SelectItem value="OTHER">{t("Other")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={busy}
            className="rounded-full px-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("Saving...")}
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                {t("Save Changes")}
              </>
            )}
          </Button>
        </div>
      </CardContent>

      {/* Phone change dialog */}
      <Dialog
        open={phoneDialogOpen}
        onOpenChange={(open) => {
          if (isSendingOtp || isVerifyingOtp) return;
          setPhoneDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" />
              {t("Change phone number")}
            </DialogTitle>
            <DialogDescription>
              {phoneStep === "input"
                ? t("Enter your new phone number. We'll send a 6-digit code to confirm it's yours.")
                : t("Enter the 6-digit code we sent to {phone}.", {
                    phone: normalizeEthiopianMobilePhone(newPhone) || newPhone,
                  })}
            </DialogDescription>
          </DialogHeader>

          {phoneStep === "input" ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <Input
                  type="tel"
                  autoFocus
                  value={newPhone}
                  onChange={(e) => {
                    setNewPhone(e.target.value);
                    setPhoneError("");
                  }}
                  placeholder="0912345678 or 251912345678"
                  aria-invalid={Boolean(phoneError)}
                  disabled={isSendingOtp}
                />
                {phoneError ? (
                  <p className="text-xs font-medium text-destructive">
                    {phoneError}
                  </p>
                ) : null}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setPhoneDialogOpen(false)}
                  disabled={isSendingOtp}
                >
                  {t("Cancel")}
                </Button>
                <Button
                  onClick={() => void handleSendPhoneOtp()}
                  disabled={isSendingOtp || !newPhone.trim()}
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {t("Sending...")}
                    </>
                  ) : (
                    t("Send Code")
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(v) => {
                    setOtpCode(v);
                    setPhoneError("");
                  }}
                  disabled={isVerifyingOtp}
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
                {phoneError ? (
                  <p className="text-xs font-medium text-destructive">
                    {phoneError}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="link"
                  className="px-0"
                  onClick={() => void handleSendPhoneOtp()}
                  disabled={isSendingOtp || isVerifyingOtp}
                >
                  {t("Resend code")}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setPhoneStep("input")}
                    disabled={isVerifyingOtp}
                  >
                    {t("Back")}
                  </Button>
                  <Button
                    onClick={() => void handleVerifyPhoneOtp()}
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        {t("Verifying...")}
                      </>
                    ) : (
                      t("Verify & Update")
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
