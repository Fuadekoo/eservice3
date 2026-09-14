import { z } from "zod";
import { containsTypedCode } from "../utils/sanitize-html.js";

export const createAdministrationSchema = z.object({
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

export const updateAdministrationSchema = createAdministrationSchema.partial();

/**
 * Build a validation error the client can actually display.
 *
 * Re-exported from one shared implementation so every endpoint reports a
 * failure in the same shape — see src/utils/validation-error.ts for why the
 * per-validator copies had to go.
 */
export {
  buildValidationError,
  type ValidationErrorPayload,
} from "../utils/validation-error.js";
