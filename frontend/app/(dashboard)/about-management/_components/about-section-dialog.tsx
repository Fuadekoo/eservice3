"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FileText, ImageIcon, Loader2, Upload, X } from "lucide-react";
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
import { useAboutStore, type AboutSection } from "@/lib/stores/about-store";
import { uploadFileOnly } from "@/lib/file-upload";
import { getUploadUrl } from "@/lib/axios";
import { useTranslation } from "@/lib/i18n";
import { toEditorHtml } from "@/lib/rich-text";

const aboutSectionSchema = z.object({
  name: z.string().min(2, "Title is required"),
  image: z.string().min(1, "Image is required"),
  description: z.string().optional(),
});

type AboutSectionFormValues = z.infer<typeof aboutSectionSchema>;

interface AboutSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: AboutSection | null;
}

export function AboutSectionDialog({
  open,
  onOpenChange,
  section,
}: AboutSectionDialogProps) {
  const { t } = useTranslation();

  const { createAbout, updateAbout } = useAboutStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const form = useForm<AboutSectionFormValues>({
    resolver: zodResolver(aboutSectionSchema),
    defaultValues: {
      name: "",
      image: "",
      description: "",
    },
  });

  React.useEffect(() => {
    if (section) {
      form.reset({
        name: section.name,
        // Sections written before the rich-text editor hold plain text; convert
        // them so they open laid out the way they display.
        description: toEditorHtml(section.description),
        image: section.image,
      });
    } else {
      form.reset({ name: "", image: "", description: "" });
    }
  }, [section, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFileOnly(file);
      form.setValue("image", result.filename, { shouldValidate: true });
      toast.success(t("Image uploaded successfully"));
    } catch {
      toast.error(t("Failed to upload image"));
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: AboutSectionFormValues) => {
    setIsSubmitting(true);
    try {
      if (section) {
        await updateAbout(section.id, values);
        toast.success(t("About section updated successfully"));
      } else {
        await createAbout(values);
        toast.success(t("About section created successfully"));
      }
      onOpenChange(false);
    } catch {
      toast.error(
        section
          ? t("Failed to update about section")
          : t("Failed to create about section"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const image = form.watch("image");
  const isBusy = isSubmitting || isUploading;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        // Closing mid-save would leave the request orphaned and the form stale.
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
                    <FileText className="size-4" />
                  </span>
                  {section ? t("Edit About Section") : t("Add About Section")}
                </SheetTitle>
                <SheetDescription className="pl-10.5">
                  {section
                    ? t("Update about section details.")
                    : t("Add a new content section to the about page.")}
                </SheetDescription>
              </SheetHeader>
            </div>

            {/* ── Scrollable body ──
                Two columns on wide screens: the cover image and title stay
                narrow on the left while the writing area gets the rest. */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-8">
                {/* ── Left: cover image + title ── */}
                <div className="space-y-5">
                  <FormField
                    control={form.control}
                    name="image"
                    render={() => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <ImageIcon className="size-3.5 text-primary" />
                          {t("Cover Image")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted">
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
                              <Loader2 className="size-9 animate-spin text-primary" />
                            ) : (
                              <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
                                <Upload className="size-8" />
                                <span className="text-sm font-medium">
                                  {t("Upload Cover Image")}
                                </span>
                                <span className="text-xs">
                                  {t("PNG, JPG, WEBP")}
                                </span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isBusy}
                              aria-label={t("Upload Cover Image")}
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
                        <FormLabel>{t("Title")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("e.g. Our Mission")}
                            className="h-11 rounded-xl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ── Right: the writing area ── */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="flex min-h-0 flex-col">
                      <FormLabel>{t("Content")}</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isBusy}
                          placeholder={t("Enter content details...")}
                          minHeight="26rem"
                          className="rounded-xl"
                        />
                      </FormControl>
                      <FormDescription>
                        {t(
                          "Use headings, lists and links to lay the section out the way it should read on the public page.",
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
                  disabled={isBusy}
                  className="h-11 flex-[2] rounded-xl font-bold"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {section ? t("Update") : t("Create")}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
