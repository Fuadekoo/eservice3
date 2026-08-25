"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ImageIcon, Loader2, Upload, UserCog, X } from "lucide-react";
import Image from "next/image";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  useAdministrationStore,
  type Administration,
} from "@/lib/stores/administration-store";
import { uploadFileOnly } from "@/lib/file-upload";
import { getUploadUrl } from "@/lib/axios";
import { useTranslation } from "@/lib/i18n";
import { looksLikeTypedCode, toEditorHtml } from "@/lib/rich-text";

const administratorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  image: z.string().min(1, "Image is required"),
  description: z
    .string()
    .optional()
    // Typed-out tags are stored as text and cannot run, but this content is
    // published on a public page — a profile reading "<script>alert(1)</script>"
    // is never what was intended, so it is refused rather than displayed.
    .refine((value) => !looksLikeTypedCode(value), {
      message: "Remove the code from the content before saving.",
    }),
});

type AdministratorFormValues = z.infer<typeof administratorSchema>;

interface AdministratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  administrator?: Administration | null;
}

export function AdministratorDialog({
  open,
  onOpenChange,
  administrator,
}: AdministratorDialogProps) {
  const { t } = useTranslation();

  const { createAdministration, updateAdministration } =
    useAdministrationStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const form = useForm<AdministratorFormValues>({
    resolver: zodResolver(administratorSchema),
    defaultValues: {
      name: "",
      image: "",
      description: "",
    },
  });

  React.useEffect(() => {
    if (administrator) {
      form.reset({
        name: administrator.name,
        image: administrator.image,
        // Records written before the rich-text editor hold plain text.
        description: toEditorHtml(administrator.description),
      });
    } else {
      form.reset({
        name: "",
        image: "",
        description: "",
      });
    }
  }, [administrator, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFileOnly(file);
      // The API might return just the filename or a path.
      // administration-store expects a string for image.
      form.setValue("image", result.filename);
      toast.success(t("Image uploaded successfully"));
    } catch {
      toast.error(t("Failed to upload image"));
    } finally {
      setIsUploading(false);
    }
  };

  const image = form.watch("image");
  const isBusy = isSubmitting || isUploading;
  // Grey the button out as soon as the content is refused, rather than letting
  // the author click and only then find out.
  const hasTypedCode = looksLikeTypedCode(form.watch("description"));

  const onSubmit = async (values: AdministratorFormValues) => {
    setIsSubmitting(true);
    try {
      if (administrator) {
        await updateAdministration(administrator.id, values);
        toast.success(t("Administrator updated successfully"));
      } else {
        await createAdministration(values);
        toast.success(t("Administrator created successfully"));
      }
      onOpenChange(false);
    } catch {
      toast.error(
        administrator
          ? t("Failed to update administrator")
          : t("Failed to create administrator"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        // Closing mid-save would orphan the request and leave the form stale.
        if (!next && isBusy) return;
        onOpenChange(next);
      }}
    >
      <SheetContent
        side="right"
        className="w-full! max-w-none! gap-0 overflow-hidden bg-background p-0 text-foreground sm:w-[94vw]! sm:rounded-l-2xl lg:w-256!"
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex h-full min-h-0 flex-col"
          >
            {/* ── Header ── */}
            <div className="shrink-0 border-b border-border/60 bg-muted/30 px-5 py-4 pr-14 sm:px-6 sm:py-5">
              <SheetHeader className="gap-1 p-0">
                <SheetTitle className="flex items-center gap-2.5 text-lg font-bold sm:text-xl">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UserCog className="size-4" />
                  </span>
                  {administrator
                    ? t("Edit Administrator")
                    : t("Add Administrator")}
                </SheetTitle>
                <SheetDescription className="pl-10.5">
                  {administrator
                    ? t("Update administrator details.")
                    : t("Add a new administrator to the about page.")}
                </SheetDescription>
              </SheetHeader>
            </div>

            {/* ── Scrollable body ──
                Photo and name stay narrow on the left; the profile text gets
                the remaining width. */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-8">
                <div className="space-y-5">
                  <FormField
                    control={form.control}
                    name="image"
                    render={() => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <ImageIcon className="size-3.5 text-primary" />
                          {t("Photo")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative flex aspect-square w-full max-w-56 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted">
                            {image ? (
                              <>
                                <Image
                                  src={getUploadUrl(image)}
                                  alt={t("Preview")}
                                  fill
                                  className="object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    form.setValue("image", "", {
                                      shouldValidate: true,
                                    })
                                  }
                                  aria-label={t("Remove")}
                                  className="absolute top-2 right-2 z-10 rounded-full bg-destructive/80 p-1 transition-colors hover:bg-destructive"
                                >
                                  <X className="size-4 text-white" />
                                </button>
                              </>
                            ) : isUploading ? (
                              <Loader2 className="size-8 animate-spin text-primary" />
                            ) : (
                              <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
                                <Upload className="size-8" />
                                <span className="text-sm font-medium">
                                  {t("Upload Photo")}
                                </span>
                                <span className="text-xs">
                                  {t("Recommended size: 400x400px. PNG, JPG allowed.")}
                                </span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isBusy}
                              aria-label={t("Upload Photo")}
                              className="absolute inset-0 cursor-pointer opacity-0"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Full Name")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("Enter full name")}
                            className="h-11 rounded-xl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="flex min-h-0 flex-col">
                      <FormLabel>{t("Description")}</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isBusy}
                          placeholder={t("Enter description (optional)")}
                          minHeight="22rem"
                          className="rounded-xl"
                        />
                      </FormControl>
                      <FormDescription>
                        {t(
                          "Their role, responsibilities and a short message to citizens.",
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Sticky footer ── */}
            <div className="shrink-0 border-t border-border/60 bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isBusy}
                  className="h-11 flex-1 rounded-xl font-semibold"
                >
                  {t("Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isBusy || hasTypedCode}
                  className="h-11 flex-[2] rounded-xl font-bold"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {administrator ? t("Update") : t("Create")}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
