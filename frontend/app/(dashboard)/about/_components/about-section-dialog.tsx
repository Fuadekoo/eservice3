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
import { useAboutStore, type AboutSection } from "../_stores/about-store";
import { uploadFileOnly } from "@/lib/file-upload";

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
        image: section.image,
        description: section.description || "",
      });
    } else {
      form.reset({
        name: "",
        image: "",
        description: "",
      });
    }
  }, [section, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFileOnly(file);
      form.setValue("image", result.filename);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: AboutSectionFormValues) => {
    setIsSubmitting(true);
    try {
      if (section) {
        await updateAbout(section.id, values);
        toast.success("About section updated successfully");
      } else {
        await createAbout(values);
        toast.success("About section created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        section
          ? "Failed to update about section"
          : "Failed to create about section"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#121212] text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>
            {section ? "Edit About Section" : "Add About Section"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {section
              ? "Update about section details."
              : "Add a new content section to the about page."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#1e1e1e] border-2 border-dashed border-gray-700 flex items-center justify-center">
                {form.watch("image") ? (
                  <>
                    <Image
                      src={
                        form.watch("image").startsWith("http")
                          ? form.watch("image")
                          : `/api/uploads/${form.watch("image")}`
                      }
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => form.setValue("image", "")}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X className="size-5 text-white" />
                    </button>
                  </>
                ) : isUploading ? (
                  <Loader2 className="size-10 animate-spin text-primary" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Upload className="size-10" />
                    <span className="text-sm">Upload Cover Image</span>
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
              <FormMessage>
                {form.formState.errors.image?.message}
              </FormMessage>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Our Mission"
                      className="bg-[#1e1e1e] border-gray-800 focus:ring-primary"
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
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter content details..."
                      className="bg-[#1e1e1e] border-gray-800 focus:ring-primary min-h-[150px]"
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
                className="bg-transparent border-gray-800 text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {section ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
