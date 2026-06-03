import { z, type ZodError } from "zod";

export const createAdministrationSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  image: z.string().trim().min(1, "Image is required."),
  description: z.string().trim().optional().nullable(),
});

export const updateAdministrationSchema = createAdministrationSchema.partial();

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
