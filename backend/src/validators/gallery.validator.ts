import { z } from "zod";

export const createGallerySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  description: z.string().trim().optional().nullable(),
});

export const updateGallerySchema = createGallerySchema.partial();

export const addImageSchema = z.object({
  filename: z.string().trim().min(1, "Filename is required."),
  order: z.number().int().min(0).optional().default(0),
});

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
