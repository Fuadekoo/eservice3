"use client";

import * as React from "react";
import { Save, Upload, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/lib/auth-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  useOfficeStore,
  type UpdateOfficePayload,
} from "@/lib/stores/office-store";
import { useTranslation } from "@/lib/i18n";

export function OfficeInfoTab() {
  const { t } = useTranslation();

  const { data: sessionData } = useSession();
  const session = sessionData?.session;
  const isManager =
    session?.role?.name?.toLowerCase() === "manager" || session?.user?.isAdmin;

  const {
    currentOffice: office,
    isLoading,
    error,
    getOffice,
    updateOffice,
    setError,
  } = useOfficeStore();

  const [formData, setFormData] = React.useState<UpdateOfficePayload>({
    name: "",
    address: "",
    logo: "",
    slogan: "",
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const sessionOfficeId =
    session?.officeId || session?.user?.officeId || session?.office?.id;

  React.useEffect(() => {
    if (sessionOfficeId) {
      void getOffice(sessionOfficeId);
    }
  }, [sessionOfficeId, getOffice]);

  React.useEffect(() => {
    if (office) {
      setFormData({
        name: office.name || "",
        address: office.address || "",
        logo: office.logo || "",
        slogan: office.slogan || "",
        description: office.description || "",
      });
    }
  }, [office]);

  const handleInputChange = React.useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = React.useCallback(async () => {
    if (!sessionOfficeId) {
      toast.error(t("Office ID not found in session"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateOffice(sessionOfficeId, formData);
      toast.success(t("Office information saved successfully"));
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t("Failed to save office information");
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionOfficeId, formData, updateOffice, setError]);

  const handleLogoUpload = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleInputChange("logo", base64String);
      };
      reader.readAsDataURL(file);
    },
    [handleInputChange],
  );

  if (isLoading && !office) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner className="mr-2 size-5" />
        {t("Loading office information...")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isManager && (
        <Alert className="bg-amber-50 border-amber-200">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">{t("View Only Mode")}</AlertTitle>
          <AlertDescription className="text-amber-700">
            {t("Only administrators with the")} <strong>{t("Manager")}</strong> {t("role are authorized to modify office details.")}
          </AlertDescription>
        </Alert>
      )}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{t("Something went wrong")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                {t("Office Information")}
                {isManager && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </CardTitle>
              <CardDescription>
                {t("Details about your office and organizational identity")}
              </CardDescription>
            </div>
            {isManager && (
              <Button onClick={handleSubmit} disabled={isSubmitting || !office}>
                <Save className="mr-2 size-4" />
                {isSubmitting ? t("Saving...") : t("Save Changes")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="officeName">{t("Office Name")}</Label>
                  <Input
                    id="officeName"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={isSubmitting || !isManager}
                    placeholder={t("e.g. Adama E-Service Office")}
                    className={!isManager ? "bg-muted cursor-default" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slogan">{t("Office Slogan")}</Label>
                  <Input
                    id="slogan"
                    value={formData.slogan}
                    onChange={(e) =>
                      handleInputChange("slogan", e.target.value)
                    }
                    disabled={isSubmitting || !isManager}
                    placeholder={t("Your office slogan")}
                    className={!isManager ? "bg-muted cursor-default" : ""}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2"></div>

              <div className="space-y-2">
                <Label htmlFor="address">{t("Physical Address")}</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={isSubmitting || !isManager}
                  placeholder="Street, City, Ethiopia"
                  rows={2}
                  className={!isManager ? "bg-muted cursor-default" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("About the Office")}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  disabled={isSubmitting || !isManager}
                  placeholder={t("Detailed description of office services...")}
                  rows={4}
                  className={!isManager ? "bg-muted cursor-default" : ""}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col items-center gap-6 rounded-xl border-2 border-dashed border-border p-8 bg-muted/30">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("Office Logo")}
                </Label>
                {formData.logo ? (
                  <div className="relative group">
                    <img
                      src={formData.logo}
                      alt={t("Office logo")}
                      className="h-40 w-40 rounded-full object-cover border-4 border-white shadow-lg shadow-primary/10 transition-transform group-hover:scale-105"
                    />
                    {isManager && (
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                          <Button variant="secondary" size="sm" asChild>
                            <span>{t("Change")}</span>
                          </Button>
                        </Label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-full border-2 border-border bg-muted/50">
                    <span className="text-sm text-muted-foreground">
                      {t("No logo uploaded")}
                    </span>
                  </div>
                )}

                {isManager && (
                  <div>
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="relative overflow-hidden"
                      >
                        <span>
                          <Upload className="mr-2 size-4" />
                          {t("Update Brand Logo")}
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isSubmitting}
                      className="hidden"
                    />
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground text-center">
                  {t("Recommended size: 400x400px. PNG, JPG allowed.")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
