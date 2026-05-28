import { z } from "zod";

/**
 * Create appointment validator
 */
export const createAppointmentSchema = z.object({
  requestId: z.string().trim().min(1, "Request ID is required."),
  date: z.string().datetime("Invalid date format."),
  time: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

/**
 * Update appointment validator
 */
export const updateAppointmentSchema = z.object({
  date: z.string().datetime("Invalid date format.").optional(),
  time: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  status: z.enum(["pending", "approved", "rejected", "completed"]).optional(),
  approveStaffId: z.string().trim().optional(),
});

/**
 * Approve appointment validator
 */
export const approveAppointmentSchema = z.object({
  staffId: z.string().trim().min(1, "Staff ID is required."),
  notes: z.string().trim().optional(),
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
