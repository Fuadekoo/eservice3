"use client";

import { type ElementType, useEffect, useState, useCallback } from "react";
import {
  Settings,
  Building2,
  Phone,
  MapPin,
  Hash,
  Globe,
  Loader2,
  Save,
  Power,
} from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/hooks/use-session";
import { axiosInstance } from "@/lib/axios";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  settings: Record<string, unknown>;
};

type FormState = {
  name: string;
  phoneNumber: string;
  roomNumber: string;
  address: string;
  subdomain: string;
  slogan: string;
  status: boolean;
};

function FieldRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start py-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pt-1">
        <Icon className="size-4 shrink-0" />
        {label}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

export default function ConfigurationPage() {
  const { data: sessionData, isPending: isSessionPending } = useSession();
  const officeId = sessionData?.session?.officeId;

  const [office, setOffice] = useState<OfficeData | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    phoneNumber: "",
    roomNumber: "",
    address: "",
    subdomain: "",
    slogan: "",
    status: true,
  });
  const [isDirty, setIsDirty] = useState(false);

  const fetchOffice = useCallback(async (id: string) => {
    setIsFetching(true);
    try {
      const res = (await axiosInstance.get(`/offices/${id}`)) as unknown as {
        data: OfficeData;
      };
      const o = res.data;
      setOffice(o);
      setForm({
        name: o.name ?? "",
        phoneNumber: o.phoneNumber ?? "",
        roomNumber: o.roomNumber ?? "",
        address: o.address ?? "",
        subdomain: o.subdomain ?? "",
        slogan: o.slogan ?? "",
        status: o.status ?? true,
      });
    } catch {
      toast.error("Failed to load office configuration");
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!isSessionPending && officeId) fetchOffice(officeId);
  }, [isSessionPending, officeId, fetchOffice]);

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!officeId) return;
    setIsSaving(true);
    try {
      await axiosInstance.put(`/offices/${officeId}`, {
        name: form.name || undefined,
        phoneNumber: form.phoneNumber || undefined,
        roomNumber: form.roomNumber || undefined,
        address: form.address || undefined,
        subdomain: form.subdomain || undefined,
        slogan: form.slogan || undefined,
        status: form.status,
      });
      toast.success("Office configuration saved");
      setIsDirty(false);
      fetchOffice(officeId);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!office) return;
    setForm({
      name: office.name ?? "",
      phoneNumber: office.phoneNumber ?? "",
      roomNumber: office.roomNumber ?? "",
      address: office.address ?? "",
      subdomain: office.subdomain ?? "",
      slogan: office.slogan ?? "",
      status: office.status ?? true,
    });
    setIsDirty(false);
  };

  if (isFetching || isSessionPending) {
    return (
      <div className="flex items-center justify-center h-72">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!officeId) {
    return (
      <div className="flex items-center justify-center h-72 text-muted-foreground text-sm">
        No office assigned to your account.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-3xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Office Configuration"
          description="Update your office details and settings"
          icon={Settings}
        />
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="h-10 rounded-xl"
            >
              Reset
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="h-10 rounded-xl font-bold shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Office Info Card */}
      <Card className="border-none shadow-sm ring-1 ring-border/50">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Separator className="my-4" />

          <FieldRow icon={Building2} label="Office Name">
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter office name"
              className="rounded-xl h-10"
            />
          </FieldRow>

          <Separator />

          <FieldRow icon={Hash} label="Room Number">
            <Input
              value={form.roomNumber}
              onChange={(e) => handleChange("roomNumber", e.target.value)}
              placeholder="e.g. Room 101"
              className="rounded-xl h-10"
            />
          </FieldRow>

          <Separator />

          <FieldRow icon={Phone} label="Phone Number">
            <Input
              value={form.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              placeholder="+251..."
              className="rounded-xl h-10"
            />
          </FieldRow>

          <Separator />

          <FieldRow icon={MapPin} label="Address">
            <Input
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Office address"
              className="rounded-xl h-10"
            />
          </FieldRow>

          <Separator />

          <FieldRow icon={Globe} label="Subdomain">
            <Input
              value={form.subdomain}
              onChange={(e) => handleChange("subdomain", e.target.value)}
              placeholder="e.g. finance"
              className="rounded-xl h-10"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Used for office identification within the system.
            </p>
          </FieldRow>

          <Separator />

          <FieldRow icon={Settings} label="Slogan">
            <Input
              value={form.slogan}
              onChange={(e) => handleChange("slogan", e.target.value)}
              placeholder="Optional office slogan or tagline"
              className="rounded-xl h-10"
            />
          </FieldRow>

          <Separator />

          <FieldRow icon={Power} label="Office Status">
            <div className="flex items-center p-1 bg-muted/40 rounded-xl border border-border/50 w-fit shadow-inner">
              <button
                type="button"
                onClick={() => form.status && handleChange("status", false)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-black uppercase transition-all duration-200",
                  !form.status
                    ? "bg-white text-destructive shadow-sm scale-100"
                    : "text-muted-foreground/40 hover:text-muted-foreground scale-95",
                )}
              >
                Inactive
              </button>
              <button
                type="button"
                onClick={() => !form.status && handleChange("status", true)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-black uppercase transition-all duration-200",
                  form.status
                    ? "bg-blue-600 text-white shadow-sm scale-100"
                    : "text-muted-foreground/40 hover:text-muted-foreground scale-95",
                )}
              >
                Active
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-medium">
              {form.status
                ? "This office is currently active and visible to citizens. They can browse services and submit requests."
                : "This office is currently inactive. It will be hidden from the public website and no new requests can be submitted."}
            </p>
          </FieldRow>
        </CardContent>
      </Card>

      {/* Read-only info */}
      <Card className="border-none shadow-sm ring-1 ring-border/50 bg-muted/20">
        <CardContent className="p-5 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Office ID
            </p>
            <p className="font-mono text-xs text-foreground/70">
              {office?.id ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Started
            </p>
            <p className="font-medium">
              {office
                ? new Date((office as any).startedAt).toLocaleDateString()
                : "—"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
