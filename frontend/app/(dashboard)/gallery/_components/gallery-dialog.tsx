"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Upload, ImageIcon, X, Plus } from "lucide-react";
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
import { useGalleryStore, type Gallery } from "@/lib/stores/gallery-store";
import { uploadFileOnly } from "@/lib/file-upload";

const gallerySchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
});

type GalleryFormValues = z.infer<typeof gallerySchema>;

interface GalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gallery?: Gallery | null;
}

export function GalleryDialog({
  open,
  onOpenChange,
  gallery,
}: GalleryDialogProps) {
  const { createGallery, updateGallery, addImage } = useGalleryStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);

  const form = useForm<GalleryFormValues>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  React.useEffect(() => {
    if (gallery) {
      form.reset({
        name: gallery.name,
        description: gallery.description || "",
      });
      setSelectedFiles([]);
      setPreviews([]);
    } else {
      form.reset({
        name: "",
        description: "",
      });
      setSelectedFiles([]);
      setPreviews([]);
    }
  }, [gallery, form, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 10) {
      toast.error("You can only upload up to 10 images");
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const onSubmit = async (values: GalleryFormValues) => {
    setIsSubmitting(true);
    try {
      let currentGalleryId = gallery?.id;

      if (gallery) {
        await updateGallery(gallery.id, values);
      } else {
        const newGallery = await createGallery(values);
        currentGalleryId = newGallery.id;
      }

      // Upload images if any
      if (currentGalleryId && selectedFiles.length > 0) {
        toast.info(`Uploading ${selectedFiles.length} images...`);
        const uploadPromises = selectedFiles.map(async (file, index) => {
          const result = await uploadFileOnly(file);
          return addImage(currentGalleryId!, {
            filename: result.filename,
            order: (gallery?.images?.length || 0) + index,
          });
        });

        await Promise.all(uploadPromises);
      }

      toast.success(
        gallery ? "Gallery updated" : "Gallery created successfully",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        gallery ? "Failed to update gallery" : "Failed to create gallery",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#0a0a0a] text-white border-gray-800 p-0 overflow-hidden rounded-2xl">
        <div className="p-6 space-y-6">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-xl font-bold">
              {gallery ? "Edit Gallery" : "Create Gallery"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-gray-200">
                      Gallery Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter gallery name"
                        className="bg-[#121212] border-gray-800 focus:ring-primary text-white h-11 rounded-lg"
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
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-gray-200">
                      Description (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter gallery description"
                        className="bg-[#121212] border-gray-800 focus:ring-primary text-white min-h-[120px] rounded-lg resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel className="text-sm font-medium text-gray-200">
                  Images *
                </FormLabel>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {previews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden group"
                    >
                      <Image
                        src={preview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-3 text-white" />
                      </button>
                    </div>
                  ))}

                  {selectedFiles.length < 10 && (
                    <label className="relative aspect-square rounded-xl border-2 border-dashed border-gray-800 bg-[#121212] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800/50 transition-colors">
                      <ImageIcon className="size-6 text-gray-500 mb-1" />
                      <span className="text-[10px] text-gray-400 text-center px-1 leading-tight">
                        Add Images
                        <br />
                        (Multiple)
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
                <p className="text-[11px] text-gray-500">
                  {selectedFiles.length} / 10 images uploaded
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="bg-[#1a1a1a] border-none text-white hover:bg-gray-800 px-6 h-11 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || (!gallery && selectedFiles.length === 0)
                  }
                  className="bg-primary hover:bg-primary/90 px-6 h-11 rounded-xl font-semibold"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {gallery ? "Update Gallery" : "Create Gallery"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
