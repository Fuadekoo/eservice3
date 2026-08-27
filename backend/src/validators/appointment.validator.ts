import { z } from "zod";

/**
 * An appointment date that has not already passed.
 *
 * Compared at day granularity rather than to the instant: a slot earlier
 * today is still today's business, and the client sends midnight UTC for the
 * chosen day anyway. Only a date before today is refused.
 *
 * The pickers disable past days, but `min` on an input is advisory — it is
 * absent from a direct API call and does not survive a typed value — so the
 * rule is enforced here as well.
 */
const futureDateField = z
  .string()
  .datetime("Invalid date format.")
  .refine(
    (value) => {
      const chosen = new Date(value);
      if (Number.isNaN(chosen.getTime())) return false;
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return chosen.getTime() >= startOfToday.getTime();
    },
    { message: "The appointment date cannot be in the past." },
  );

/**
 * Create appointment validator
 */
export const createAppointmentSchema = z.object({
  requestId: z.string().trim().min(1, "Request ID is required."),
  date: futureDateField,
  time: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

/**
 * Update appointment validator
 */
export const updateAppointmentSchema = z.object({
  // Rescheduling is subject to the same rule as booking.
  date: futureDateField.optional(),
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
