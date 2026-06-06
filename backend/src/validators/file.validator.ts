import { z, type ZodError } from "zod";

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
 * Build validation error from Zod error.
 */
export function buildValidationError(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    result[path || "general"] = issue.message;
  });
  return result;
}
