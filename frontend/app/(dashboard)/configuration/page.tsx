"use client";

import * as React from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Globe,
  Hash,
  ImageIcon,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { PageLayout } from "@/components/dashboard/page-layout";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { axiosInstance, getUploadUrl } from "@/lib/axios";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  PHONE_FORMAT_MESSAGE,
  normalizeEthiopianMobilePhone,
} from "@/lib/phone";

type OfficeData = {
  id: string;
  name: string;
  phoneNumber: string | null;
  roomNumber: string;
  address: string;
  subdomain: string;
  slogan: string | null;
  logo: string | null;
  status: boolean;
  settings?: Record<string, unknown> | null;
  startedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  _count?: {
    service?: number;
    staffs?: number;
    requests?: number;
    appointments?: number;
  };
};

type FormState = {
  name: string;
  phoneNumber: string;
  roomNumber: string;
  address: string;
  subdomain: string;
  slogan: string;
  logo: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function normalizeForm(office: OfficeData): FormState {
  return {
    name: office.name ?? "",
    phoneNumber: office.phoneNumber ?? "",
    roomNumber: office.roomNumber ?? "",
    address: office.address ?? "",
    subdomain: office.subdomain ?? "",
    slogan: office.slogan ?? "",
    logo: office.logo ?? "",
  };
}

function normalizeSubdomain(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return undefined;
}

function validateForm(form: FormState, t: (key: string) => string): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = t("Office name is required");
  if (!form.roomNumber.trim()) errors.roomNumber = t("Room number is required");
  if (!form.address.trim()) errors.address = t("Address is required");
  if (!form.subdomain.trim()) {
    errors.subdomain = t("Subdomain is required");
  } else if (!/^[a-z0-9-]+$/.test(form.subdomain.trim())) {
    errors.subdomain = t(
      "Subdomain must use lowercase letters, numbers, and hyphens only",
    );
  }
  if (
    form.phoneNumber.trim() &&
    !normalizeEthiopianMobilePhone(form.phoneNumber)
  ) {
    errors.phoneNumber = t(PHONE_FORMAT_MESSAGE);
  }
  return errors;
}

function areFormsEqual(a: FormState, b: FormState) {
  return (
    a.name === b.name &&
    a.phoneNumber === b.phoneNumber &&
    a.roomNumber === b.roomNumber &&
    a.address === b.address &&
    a.subdomain === b.subdomain &&
    a.slogan === b.slogan &&
    a.logo === b.logo
  );
}

function formatOfficeDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function getOfficeData(id: string) {
  const res = (await axiosInstance.get(`/offices/${id}`)) as unknown as {
    data: OfficeData;
  };
  return res.data;
}

export default function ConfigurationPage() {
  const { t } = useTranslation();
  const { data: sessionData, isPending: isSessionPending } = useSession();
  const session = sessionData?.session;
  const officeId =
    session?.officeId || session?.user?.officeId || session?.office?.id;

  const [office, setOffice] = React.useState<OfficeData | null>(null);
  const [form, setForm] = React.useState<FormState>({
    name: "",
    phoneNumber: "",
    roomNumber: "",
    address: "",
    subdomain: "",
    slogan: "",
    logo: "",
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isFetching, setIsFetching] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const originalForm = React.useMemo(
    () => (office ? normalizeForm(office) : null),
    [office],
  );
  const isDirty = originalForm ? !areFormsEqual(form, originalForm) : false;
  const previewLogo = form.logo.trim() ? getUploadUrl(form.logo.trim()) : "";

  const fetchOffice = React.useCallback(
    async (id: string) => {
      setIsFetching(true);
      try {
        const nextOffice = await getOfficeData(id);
        setOffice(nextOffice);
        setForm(normalizeForm(nextOffice));
        setErrors({});
      } catch {
        toast.error(t("Failed to load office configuration"));
      } finally {
        setIsFetching(false);
      }
    },
    [t],
  );

  React.useEffect(() => {
    if (isSessionPending || !officeId) return;

    const targetOfficeId = officeId;
    let isCancelled = false;

    async function loadInitialOffice() {
      try {
        const nextOffice = await getOfficeData(targetOfficeId);
        if (isCancelled) return;
        setOffice(nextOffice);
        setForm(normalizeForm(nextOffice));
        setErrors({});
      } catch {
        if (!isCancelled) {
          toast.error(t("Failed to load office configuration"));
        }
      }
    }

    void loadInitialOffice();

    return () => {
      isCancelled = true;
    };
  }, [isSessionPending, officeId, t]);

  function handleChange(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleReset() {
    if (!office) return;
    setForm(normalizeForm(office));
    setErrors({});
  }

  async function handleSave() {
    if (!officeId) return;

    const nextForm = {
      ...form,
      name: form.name.trim(),
      phoneNumber: form.phoneNumber.trim()
        ? (normalizeEthiopianMobilePhone(form.phoneNumber) ??
          form.phoneNumber.trim())
        : "",
      roomNumber: form.roomNumber.trim(),
      address: form.address.trim(),
      subdomain: normalizeSubdomain(form.subdomain),
      slogan: form.slogan.trim(),
      logo: form.logo.trim(),
    };
    const nextErrors = validateForm(nextForm, t);
    setForm(nextForm);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t("Please fix the highlighted fields"));
      return;
    }

    setIsSaving(true);
    try {
      const response = (await axiosInstance.put(`/offices/${officeId}`, {
        name: nextForm.name,
        phoneNumber: nextForm.phoneNumber || null,
        roomNumber: nextForm.roomNumber,
        address: nextForm.address,
        subdomain: nextForm.subdomain,
        slogan: nextForm.slogan || null,
        logo: nextForm.logo || null,
      })) as unknown as { data: OfficeData };

      const updatedOffice = response.data;
      setOffice(updatedOffice);
      setForm(normalizeForm(updatedOffice));
      setErrors({});
      toast.success(t("Office updated successfully"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) ?? t("Failed to save configuration"));
    } finally {
      setIsSaving(false);
    }
  }

  if (isSessionPending || (officeId && !office)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!officeId) {
    return (
      <PageLayout
        title={t("Edit Office")}
        description={t("Configure your assigned office profile.")}
        icon={Settings}
      >
        <Alert className="mx-auto max-w-xl rounded-2xl border-amber-500/20 bg-amber-500/5 p-5">
          <AlertCircle className="size-5 text-amber-600" />
          <AlertTitle>{t("No office assigned")}</AlertTitle>
          <AlertDescription>
            {t("Your manager account is not assigned to an office yet.")}
          </AlertDescription>
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t("Edit Office")}
      description={t("Configure the public profile of your office.")}
      icon={Settings}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-xl"
            disabled={isFetching || isSaving}
            onClick={() => void fetchOffice(officeId)}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            {t("Refresh")}
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-xl"
            disabled={!isDirty || isSaving}
            onClick={handleReset}
          >
            <RotateCcw className="size-4" />
            {t("Reset")}
          </Button>
          <Button
            className="h-10 rounded-xl font-bold shadow-lg shadow-primary/20"
            disabled={!isDirty || isSaving}
            onClick={handleSave}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isSaving ? t("Saving...") : t("Save Changes")}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-none bg-card shadow-sm ring-1 ring-border/50">
            <CardContent className="p-0">
              <div className="bg-muted/30 p-6 text-center">
                <div className="mx-auto mb-4 flex size-28 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                  {previewLogo ? (
                    <img
                      src={previewLogo}
                      alt={form.name || t("Office logo")}
                      className="size-full object-contain p-2"
                    />
                  ) : (
                    <Building2 className="size-12 text-primary/35" />
                  )}
                </div>
                <h2 className="text-xl font-black leading-tight">
                  {form.name || t("Office Name")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {form.slogan || t("Office slogan")}
                </p>
                <Badge
                  className={cn(
                    "mt-4 font-bold",
                    office?.status
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-muted text-muted-foreground hover:bg-muted",
                  )}
                >
                  {office?.status ? t("Active") : t("Inactive")}
                </Badge>
              </div>

              <div className="grid gap-3 p-5 text-sm">
                <PreviewLine
                  icon={MapPin}
                  label={t("Address")}
                  value={form.address || t("Not set")}
                />
                <PreviewLine
                  icon={Hash}
                  label={t("Room")}
                  value={form.roomNumber || t("Not set")}
                />
                <PreviewLine
                  icon={Phone}
                  label={t("Phone")}
                  value={form.phoneNumber || t("Not set")}
                />
                <PreviewLine
                  icon={Globe}
                  label={t("Portal")}
                  value={
                    form.subdomain ? `${form.subdomain}.gov.et` : t("Not set")
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-card/70 shadow-sm ring-1 ring-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Sparkles className="size-4 text-primary" />
                {t("Office Snapshot")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <SnapshotItem
                label={t("Services")}
                value={office?._count?.service ?? 0}
              />
              <SnapshotItem
                label={t("Staff")}
                value={office?._count?.staffs ?? 0}
              />
              <SnapshotItem
                label={t("Requests")}
                value={office?._count?.requests ?? 0}
              />
              <SnapshotItem
                label={t("Started")}
                value={formatOfficeDate(office?.startedAt ?? office?.createdAt)}
              />
            </CardContent>
          </Card>

          {isDirty && (
            <Alert className="rounded-2xl border-primary/20 bg-primary/5 p-4">
              <CheckCircle2 className="size-4 text-primary" />
              <AlertTitle>{t("Unsaved changes")}</AlertTitle>
              <AlertDescription>
                {t("Save your changes to update the office profile.")}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                <Building2 className="size-5 text-primary" />
                {t("Basic Information")}
              </CardTitle>
              <CardDescription>
                {t("Edit the office name, public label, and identity.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <FormField
                  icon={Building2}
                  label={t("Office Name")}
                  error={errors.name}
                >
                  <Input
                    value={form.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    placeholder={t("e.g. Finance Office")}
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(errors.name)}
                  />
                </FormField>

                <FormField
                  icon={Globe}
                  label={t("Subdomain")}
                  error={errors.subdomain}
                  hint={t("Use lowercase letters, numbers, and hyphens.")}
                >
                  <Input
                    value={form.subdomain}
                    onChange={(event) =>
                      handleChange("subdomain", normalizeSubdomain(event.target.value))
                    }
                    placeholder={t("finance")}
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(errors.subdomain)}
                  />
                </FormField>
              </div>

              <FormField icon={Sparkles} label={t("Slogan")}>
                <Input
                  value={form.slogan}
                  onChange={(event) => handleChange("slogan", event.target.value)}
                  placeholder={t("Short public slogan or mission line")}
                  className="h-11 rounded-xl"
                />
              </FormField>

              <FormField
                icon={ImageIcon}
                label={t("Logo")}
                hint={t("Use an uploaded filename or a full image URL.")}
              >
                <Input
                  value={form.logo}
                  onChange={(event) => handleChange("logo", event.target.value)}
                  placeholder="office-logo.png"
                  className="h-11 rounded-xl"
                />
              </FormField>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                <MapPin className="size-5 text-primary" />
                {t("Location & Contact")}
              </CardTitle>
              <CardDescription>
                {t("Keep public contact information accurate for citizens.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <FormField
                  icon={Hash}
                  label={t("Room Number")}
                  error={errors.roomNumber}
                >
                  <Input
                    value={form.roomNumber}
                    onChange={(event) =>
                      handleChange("roomNumber", event.target.value)
                    }
                    placeholder="001"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(errors.roomNumber)}
                  />
                </FormField>

                <FormField
                  icon={Phone}
                  label={t("Phone Number")}
                  error={errors.phoneNumber}
                >
                  <Input
                    value={form.phoneNumber}
                    onChange={(event) =>
                      handleChange("phoneNumber", event.target.value)
                    }
                    placeholder="0912345678 or 251912345678"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(errors.phoneNumber)}
                  />
                </FormField>
              </div>

              <FormField icon={MapPin} label={t("Address")} error={errors.address}>
                <Textarea
                  value={form.address}
                  onChange={(event) => handleChange("address", event.target.value)}
                  placeholder={t("Office address")}
                  className="min-h-24 resize-none rounded-xl"
                  aria-invalid={Boolean(errors.address)}
                />
              </FormField>
            </CardContent>
          </Card>

          <div className="sticky bottom-4 z-10 rounded-2xl border border-border/70 bg-background/95 p-3 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <p className="font-bold">
                  {isDirty ? t("Ready to save changes") : t("No changes yet")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("Last updated")}: {formatOfficeDate(office?.updatedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl sm:flex-none"
                  disabled={!isDirty || isSaving}
                  onClick={handleReset}
                >
                  <RotateCcw className="size-4" />
                  {t("Reset")}
                </Button>
                <Button
                  className="flex-1 rounded-xl font-bold sm:flex-none"
                  disabled={!isDirty || isSaving}
                  onClick={handleSave}
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isSaving ? t("Saving...") : t("Save Changes")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function FormField({
  icon: Icon,
  label,
  children,
  hint,
  error,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-bold">
        <Icon className="size-4 text-primary" />
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function PreviewLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-semibold">{value}</p>
      </div>
    </div>
  );
}

function SnapshotItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-black">{value}</span>
      </div>
      <Separator className="last:hidden" />
    </>
  );
}
