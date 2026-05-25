import { z, type ZodError } from "zod";

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

export function buildValidationError(error: ZodError) {
  return {
    error: "ValidationError",
    message: "One or more fields are invalid.",
    details: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}
