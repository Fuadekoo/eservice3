import { z, type ZodError } from "zod";

export const createGallerySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  description: z.string().trim().optional().nullable(),
});

export const updateGallerySchema = createGallerySchema.partial();

export const addImageSchema = z.object({
  filename: z.string().trim().min(1, "Filename is required."),
  order: z.number().int().min(0).optional().default(0),
});

export function buildValidationError(error: ZodError) {
  return {
    error: "ValidationError",
    message: "One or more fields are invalid.",
    details: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}
