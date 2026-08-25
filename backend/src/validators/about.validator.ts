import { z, type ZodError } from "zod";
import { containsTypedCode } from "../utils/sanitize-html.js";

export const createAboutSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  image: z.string().trim().min(1, "Image is required."),
  description: z
    .string()
    .trim()
    .optional()
    .nullable()
    // The editor refuses code too, but that check runs in the browser and can
    // simply be skipped. This is the copy that actually holds.
    .refine((value) => !containsTypedCode(value), {
      message: "Remove the code from the content before saving.",
    }),
});

export const updateAboutSchema = createAboutSchema.partial();

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
