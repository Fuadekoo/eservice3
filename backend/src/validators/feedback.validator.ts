import { z } from "zod";

/**
 * Create/Update feedback validator
 */
export const createFeedbackSchema = z.object({
  rating: z
    .number()
    .min(1, "Rating must be at least 1.")
    .max(5, "Rating must be at most 5.")
    .int("Rating must be an integer."),
  comment: z.string().trim().optional().nullable(),
});

/**
 * Update feedback validator
 */
export const updateFeedbackSchema = z.object({
  rating: z
    .number()
    .min(1, "Rating must be at least 1.")
    .max(5, "Rating must be at most 5.")
    .int("Rating must be an integer.")
    .optional(),
  comment: z.string().trim().optional().nullable(),
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
