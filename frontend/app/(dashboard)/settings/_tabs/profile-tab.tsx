"use client";

import * as React from "react";
import { Save, User, Phone, Upload, Loader2 } from "lucide-react";
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

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon?: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80">
        {Icon && <Icon className="size-3.5 text-foreground/60" />}
        {label}
      </p>
      {children}
    </div>
  );
}

// ─── ProfileTab ───────────────────────────────────────────────────────────────

export function ProfileTab() {
  const [profile, setProfile] = React.useState<ProfileForm>(defaultProfile);
  const [phoneError, setPhoneError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

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
    if (field === "phoneNumber") setPhoneError("");
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
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5 MB or smaller");
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadFileOnly(file);
      set("image", uploaded.filename);
      toast.success("Photo uploaded. Click Save Changes to apply.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to upload photo"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    const normalizedPhone = profile.phoneNumber.trim()
      ? normalizeEthiopianMobilePhone(profile.phoneNumber)
      : "";

    if (profile.phoneNumber.trim() && !normalizedPhone) {
      setPhoneError(PHONE_FORMAT_MESSAGE);
      toast.error(PHONE_FORMAT_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.put("/auth/profile", {
        firstName: profile.firstName.trim(),
        fatherName: profile.fatherName.trim(),
        lastName: profile.lastName.trim(),
        username: profile.username.trim(),
        gender: profile.gender || undefined,
        image: profile.image,
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      });

      const payload = unwrap<{ user?: Record<string, unknown> }>(response);
      const updated = payload?.user ? toProfile(payload.user) : profile;
      setProfile(updated);

      // Keep the cached user in sync so the header avatar/name update too.
      if (typeof window !== "undefined") {
        const cachedRaw = localStorage.getItem("user");
        const cached = cachedRaw ? JSON.parse(cachedRaw) : {};
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...cached,
            ...(payload?.user ?? {}),
            firstName: updated.firstName,
            fatherName: updated.fatherName,
            lastName: updated.lastName,
            username: updated.username,
            phoneNumber: normalizedPhone || cached.phoneNumber,
            phone: normalizedPhone || cached.phone,
            gender: updated.gender,
            image: updated.image,
            name: [updated.firstName, updated.fatherName, updated.lastName]
              .filter(Boolean)
              .join(" "),
          }),
        );
        window.dispatchEvent(new Event("profile-updated"));
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update profile"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSubmitting || isUploading;

  return (
    <Card className="rounded-3xl border shadow-none p-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Profile Information
        </CardTitle>
        <CardDescription>Update your personal information</CardDescription>
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
            {isUploading ? "Uploading..." : "Upload Photo"}
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
          <Field icon={User} label="First Name">
            <Input
              value={profile.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="First name"
              disabled={busy}
            />
          </Field>

          <Field icon={User} label="Father's Name">
            <Input
              value={profile.fatherName}
              onChange={(e) => set("fatherName", e.target.value)}
              placeholder="Father's name"
              disabled={busy}
            />
          </Field>

          <Field icon={User} label="Grandfather's Name">
            <Input
              value={profile.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder="Grandfather's name"
              disabled={busy}
            />
          </Field>

          <Field label="Username">
            <Input
              value={profile.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="Enter username"
              disabled={busy}
            />
          </Field>

          <Field icon={Phone} label="Phone Number">
            <Input
              type="tel"
              value={profile.phoneNumber}
              onChange={(e) => set("phoneNumber", e.target.value)}
              placeholder="0912345678 or 251912345678"
              disabled={busy}
              aria-invalid={Boolean(phoneError)}
            />
            {phoneError ? (
              <p className="text-xs font-medium text-destructive">
                {phoneError}
              </p>
            ) : null}
          </Field>

          <Field label="Gender">
            <Select
              value={profile.gender}
              onValueChange={(v) => set("gender", v)}
              disabled={busy}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
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
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
