import { z } from "zod";

const requirementInputSchema = z.object({
  name: z.string().trim().min(1, "Requirement name is required."),
  description: z.string().trim().optional().nullable(),
});

const serviceForInputSchema = z.object({
  name: z.string().trim().min(1, "Service-for name is required."),
  description: z.string().trim().optional().nullable(),
});

export const createServiceSchema = z.object({
  name: z.string().trim().min(1, "Service name is required."),
  description: z.string().trim().min(1, "Description is required."),
  timeToTake: z.string().trim().min(1, "Time to take is required."),
  officeId: z.string().trim().optional(),
  requirements: z.array(requirementInputSchema).optional(),
  serviceFors: z.array(serviceForInputSchema).optional(),
});

export const updateServiceSchema = z.object({
  name: z.string().trim().min(1, "Service name is required.").optional(),
  description: z.string().trim().min(1, "Description is required.").optional(),
  timeToTake: z.string().trim().min(1, "Time to take is required.").optional(),
  requirements: z.array(requirementInputSchema).optional(),
  serviceFors: z.array(serviceForInputSchema).optional(),
});

export const assignStaffSchema = z.object({
  staffId: z.string().trim().min(1, "Staff ID is required."),
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
