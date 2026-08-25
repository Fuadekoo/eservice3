"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";

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
import {
  useAdministrationStore,
  type Administration,
} from "@/lib/stores/administration-store";
import { uploadFileOnly } from "@/lib/file-upload";
import { getUploadUrl } from "@/lib/axios";
import { useTranslation } from "@/lib/i18n";

const administratorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  image: z.string().min(1, "Image is required"),
  description: z.string().optional(),
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
        description: administrator.description || "",
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
    } catch (error) {
      toast.error(t("Failed to upload image"));
    } finally {
      setIsUploading(false);
    }
  };

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
    } catch (error) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card text-foreground border-border">
        <DialogHeader>
          <DialogTitle>
            {administrator ? t("Edit Administrator") : t("Add Administrator")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {administrator
              ? t("Update administrator details.")
              : t("Add a new administrator to the about page.")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative size-32 rounded-xl overflow-hidden bg-muted border-2 border-dashed border-border flex items-center justify-center">
                {form.watch("image") ? (
                  <>
                    <Image
                      src={getUploadUrl(form.watch("image"))}
                      alt={t("Preview")}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => form.setValue("image", "")}
                      className="absolute top-1 right-1 p-1 bg-destructive/80 rounded-full hover:bg-destructive transition-colors"
                    >
                      <X className="size-4 text-white" />
                    </button>
                  </>
                ) : isUploading ? (
                  <Loader2 className="size-8 animate-spin text-primary" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="size-8" />
                    <span className="text-xs">{t("Upload Photo")}</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading || isSubmitting}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <FormMessage>{form.formState.errors.image?.message}</FormMessage>
            </div>

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
                      className="bg-muted border-border focus:ring-primary text-foreground"
                    />
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
                      {...field}
                      placeholder={t("Enter description (optional)")}
                      className="bg-muted border-border focus:ring-primary text-foreground min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-transparent border-border text-foreground hover:bg-muted"
              >
                {t("Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {administrator ? t("Update") : t("Create")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
