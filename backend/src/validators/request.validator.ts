import { z, type ZodError } from "zod";

/**
 * File data schema
 */
const fileDataSchema = z.object({
  name: z.string().trim().min(1, "File name is required."),
  filepath: z.string().trim().min(1, "File path is required."),
  description: z.string().trim().optional(),
});

/**
 * Create request validator
 */
export const createRequestSchema = z.object({
  serviceId: z.string().trim().min(1, "Service ID is required."),
  currentAddress: z.string().trim().min(1, "Current address is required."),
  date: z.string().datetime("Invalid date format."),
  notes: z.string().trim().optional(),
  files: z.array(fileDataSchema).optional().default([]),
});

/**
 * Update request validator
 */
export const updateRequestSchema = z.object({
  currentAddress: z
    .string()
    .trim()
    .min(1, "Current address is required.")
    .optional(),
  date: z.string().datetime("Invalid date format.").optional(),
  notes: z.string().trim().optional().nullable(),
  files: z.array(fileDataSchema).optional(),
});

/**
 * Approve request by staff validator
 */
export const approveRequestByStaffSchema = z.object({
  staffId: z.string().trim().min(1, "Staff ID is required."),
  notes: z.string().trim().optional(),
});

/**
 * Approve request by admin/manager validator
 */
export const approveRequestByAdminSchema = z.object({
  approverId: z.string().trim().min(1, "Approver ID is required."),
  notes: z.string().trim().optional(),
});

/**
 * Reject request validator
 */
export const rejectRequestSchema = z.object({
  rejectionReason: z.string().trim().min(1, "Rejection reason is required."),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
export type ApproveRequestByStaffInput = z.infer<
  typeof approveRequestByStaffSchema
>;
export type ApproveRequestByAdminInput = z.infer<
  typeof approveRequestByAdminSchema
>;
export type RejectRequestInput = z.infer<typeof rejectRequestSchema>;

/**
 * Build validation error from Zod error
 */
export function buildValidationError(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    result[path || "general"] = issue.message;
  });
  return result;
}
