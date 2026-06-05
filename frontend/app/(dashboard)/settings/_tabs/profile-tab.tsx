"use client";

import * as React from "react";
import {
  Save,
  User,
  Mail,
  Phone,
  Calendar,
  Upload,
  Loader2,
} from "lucide-react";
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

// ─── Types ───────────────────────────────────────────────────────────────────

type ProfileForm = {
  firstName: string;
  fatherName: string;
  grandfatherName: string;
  email: string;
  username: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  image: string;
};

const defaultProfile: ProfileForm = {
  firstName: "",
  fatherName: "",
  grandfatherName: "",
  email: "",
  username: "",
  phoneNumber: "",
  gender: "",
  dateOfBirth: "",
  image: "",
};

function toProfile(raw: Record<string, unknown>): ProfileForm {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  // Try to parse name into firstName/fatherName/grandfatherName
  const nameParts = str(raw.name).split(" ");
  return {
    firstName: str(raw.firstName) || nameParts[0] || "",
    fatherName: str(raw.fatherName) || nameParts[1] || "",
    grandfatherName: str(raw.grandfatherName) || nameParts[2] || "",
    email: str(raw.email),
    username: str(raw.username),
    phoneNumber: str(raw.phoneNumber) || str(raw.phone),
    gender: str(raw.gender),
    dateOfBirth: str(raw.dateOfBirth),
    image: str(raw.image),
  };
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      setProfile(toProfile(parsed));
    } catch {
      /* keep defaults */
    }
  }, []);

  const set = (field: keyof ProfileForm, value: string) =>
    setProfile((p) => ({ ...p, [field]: value }));

  const initials =
    [profile.firstName, profile.fatherName]
      .map((s) => s[0] ?? "")
      .join("")
      .toUpperCase() || "MH";

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => set("image", reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const stored = {
        ...profile,
        name: `${profile.firstName} ${profile.fatherName} ${profile.grandfatherName}`.trim(),
      };
      localStorage.setItem("user", JSON.stringify(stored));
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <AvatarImage src={profile.image} alt={profile.firstName} />
            <AvatarFallback className="bg-muted text-foreground/80 font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          <label
            htmlFor="photo-upload"
            className="flex cursor-pointer items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
          >
            <Upload className="size-4" />
            Upload Photo
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </Field>

          <Field icon={User} label="Father's Name">
            <Input
              value={profile.fatherName}
              onChange={(e) => set("fatherName", e.target.value)}
              placeholder="Father's name"
              disabled={isSubmitting}
            />
          </Field>

          <Field icon={User} label="Grandfather's Name">
            <Input
              value={profile.grandfatherName}
              onChange={(e) => set("grandfatherName", e.target.value)}
              placeholder="Grandfather's name"
              disabled={isSubmitting}
            />
          </Field>

          <Field icon={Mail} label="Email">
            <Input
              type="email"
              value={profile.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="email@example.com"
              disabled={isSubmitting}
            />
          </Field>

          <Field label="Username">
            <Input
              value={profile.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="Enter username"
              disabled={isSubmitting}
            />
          </Field>

          <Field icon={Phone} label="Phone Number">
            <Input
              type="tel"
              value={profile.phoneNumber}
              onChange={(e) => set("phoneNumber", e.target.value)}
              placeholder="Enter phone number"
              disabled={isSubmitting}
            />
          </Field>

          <Field label="Gender">
            <Select
              value={profile.gender}
              onValueChange={(v) => set("gender", v)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field icon={Calendar} label="Date of Birth">
            <Input
              type="date"
              value={profile.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              disabled={isSubmitting}
            />
          </Field>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
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
