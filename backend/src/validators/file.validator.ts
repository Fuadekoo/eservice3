import { z } from "zod";

/**
 * Schema for creating a fileData record.
 */
export const createFileSchema = z.object({
  name: z.string().trim().min(1, "File name is required."),
  filepath: z.string().trim().min(1, "File path is required."),
  description: z.string().trim().max(1000, "Description cannot exceed 1000 characters.").optional().nullable(),
  requestForOtherId: z.string().trim().optional().nullable(),
  requestId: z.string().trim().optional().nullable(),
  reportId: z.string().trim().optional().nullable(),
});

export type CreateFileInput = z.infer<typeof createFileSchema>;

/**
 * Schema for updating a fileData record.
 */
export const updateFileSchema = z.object({
  name: z.string().trim().min(1, "File name is required.").optional(),
  filepath: z.string().trim().min(1, "File path is required.").optional(),
  description: z.string().trim().max(1000, "Description cannot exceed 1000 characters.").optional().nullable(),
  requestForOtherId: z.string().trim().optional().nullable(),
  requestId: z.string().trim().optional().nullable(),
  reportId: z.string().trim().optional().nullable(),
}).refine(
  (value) => Object.values(value).some((v) => v !== undefined),
  {
    message: "Provide at least one field to update.",
    path: [],
  }
);

export type UpdateFileInput = z.infer<typeof updateFileSchema>;

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
