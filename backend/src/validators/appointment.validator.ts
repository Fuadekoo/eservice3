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
  // `missed` records a customer who did not turn up. Without it the office had
  // no way to say what happened, and no state to reschedule out of.
  status: z
    .enum(["pending", "approved", "rejected", "completed", "missed"])
    .optional(),
  approveStaffId: z.string().trim().optional(),
  /**
   * Why the slot moved. Shown to the customer alongside the new date, because
   * "your appointment changed" without a reason is the kind of message that
   * generates a phone call.
   */
  rescheduleReason: z
    .string()
    .trim()
    .max(500, "Keep the reason under 500 characters.")
    .optional(),
});

/**
 * Approve appointment validator
 */
export const approveAppointmentSchema = z.object({
  staffId: z.string().trim().min(1, "Staff ID is required."),
  notes: z.string().trim().optional(),
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
