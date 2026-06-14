"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useOfficeStore, type Office } from "@/lib/stores/office-store";
import { useTranslation } from "@/lib/i18n";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PHONE_FORMAT_MESSAGE,
  normalizeEthiopianMobilePhone,
} from "@/lib/phone";

function getErrorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}

const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || normalizeEthiopianMobilePhone(value), {
    message: PHONE_FORMAT_MESSAGE,
  })
  .optional();

const officeSchema = z.object({
  name: z.string().min(2, "Name is required"),
  subdomain: z
    .string()
    .trim()
    .min(2, "Subdomain is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Subdomain must use lowercase letters, numbers, and hyphens only",
    ),
  roomNumber: z.string().min(1, "Room number is required"),
  address: z.string().min(2, "Address is required"),
  phoneNumber: optionalPhoneSchema,
  slogan: z.string().optional(),
  logo: z.string().optional(),
  description: z.string().optional(),
  status: z.boolean(),
});

type OfficeFormValues = z.infer<typeof officeSchema>;

interface OfficeCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  office?: Office | null;
}

export function OfficeCreateDialog({
  open,
  onOpenChange,
  office,
}: OfficeCreateDialogProps) {
  const { t } = useTranslation();
  const { createOffice, updateOffice } = useOfficeStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<OfficeFormValues>({
    resolver: zodResolver(officeSchema),
    defaultValues: {
      name: office?.name || "",
      subdomain: office?.subdomain || "",
      roomNumber: office?.roomNumber || "",
      address: office?.address || "",
      phoneNumber: office?.phoneNumber || "",
      slogan: office?.slogan || "",
      logo: office?.logo || "",
      description: office?.description || "",
      status: office?.status ?? true,
    },
  });

  React.useEffect(() => {
    if (office) {
      form.reset({
        name: office.name,
        subdomain: office.subdomain,
        roomNumber: office.roomNumber,
        address: office.address || "",
        phoneNumber: office.phoneNumber || "",
        slogan: office.slogan || "",
        logo: office.logo || "",
        description: office.description || "",
        status: office.status,
      });
    } else {
      form.reset({
        name: "",
        subdomain: "",
        roomNumber: "",
        address: "",
        phoneNumber: "",
        slogan: "",
        logo: "",
        description: "",
        status: true,
      });
    }
  }, [office, form]);

  const onSubmit = async (values: OfficeFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        subdomain: values.subdomain.trim().toLowerCase(),
        roomNumber: values.roomNumber.trim(),
        address: values.address.trim(),
        phoneNumber: values.phoneNumber?.trim()
          ? (normalizeEthiopianMobilePhone(values.phoneNumber) ??
            values.phoneNumber.trim())
          : undefined,
        slogan: values.slogan?.trim() || undefined,
        logo: values.logo?.trim() || undefined,
        status: values.status,
      };

      if (office) {
        await updateOffice(office.id, payload);
        toast.success(t("Office updated successfully"));
      } else {
        await createOffice(payload);
        toast.success(t("Office created successfully"));
      }
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || t("An error occurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {office ? t("Edit Office") : t("New Office")}
          </DialogTitle>
          <DialogDescription>
            {t("Fill in the details below to save the office information.")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Office Name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("e.g. Finance Office")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subdomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Subdomain")}</FormLabel>
                    <FormControl>
                      <Input placeholder="finance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Room Number")}</FormLabel>
                    <FormControl>
                      <Input placeholder="001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Phone Number")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0912345678 or 251912345678"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Address")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("Street, City")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slogan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Slogan")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("Your mission...")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("Detailed office description...")}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 transition-all hover:bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-bold">
                        {t("Office Status")}
                      </FormLabel>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {field.value
                          ? t("This office will be visible and active for citizens.")
                          : t("This office will be hidden and inactive for citizens.")}
                      </p>
                    </div>

                    <div className="flex items-center p-1 bg-muted/40 rounded-xl border border-border/50 w-fit shadow-inner">
                      <button
                        type="button"
                        onClick={() => field.value && field.onChange(false)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-200",
                          !field.value
                            ? "bg-white text-destructive shadow-sm scale-100"
                            : "text-muted-foreground/40 hover:text-muted-foreground scale-95",
                        )}
                      >
                        {t("Inactive")}
                      </button>
                      <button
                        type="button"
                        onClick={() => !field.value && field.onChange(true)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-200",
                          field.value
                            ? "bg-blue-600 text-white shadow-sm scale-100"
                            : "text-muted-foreground/40 hover:text-muted-foreground scale-95",
                        )}
                      >
                        {t("Active")}
                      </button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {office ? t("Save Changes") : t("Create Office")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
