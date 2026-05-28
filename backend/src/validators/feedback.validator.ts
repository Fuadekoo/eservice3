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
 * Build validation error from Zod error
 */
export function buildValidationError(
  error: z.ZodError,
): Record<string, string> {
  const result: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    result[path || "general"] = issue.message;
  });
  return result;
}
