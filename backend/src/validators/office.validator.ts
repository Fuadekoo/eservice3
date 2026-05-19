import { z, type ZodError, type ZodIssue } from "zod";

/**
 * Office creation schema
 */
export const createOfficeSchema = z.object({
  name: z.string().trim().min(1, "Office name is required."),
  description: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  logo: z.string().trim().optional().nullable(),
  slogan: z.string().trim().optional().nullable(),
  status: z.enum(["ACTIVE", "SUSPENDED", "TRIAL", "EXPIRED"]).optional(),
});

/**
 * Office update schema - all fields are optional for partial updates
 */
export const updateOfficeSchema = z.object({
  name: z.string().trim().min(1, "Office name is required.").optional(),
  description: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  logo: z.string().trim().optional().nullable(),
  slogan: z.string().trim().optional().nullable(),
  status: z.enum(["ACTIVE", "SUSPENDED", "TRIAL", "EXPIRED"]).optional(),
});

/**
 * Build validation error response
 */
export function buildValidationError(error: ZodError) {
  return {
    error: "ValidationError",
    message: "One or more fields are invalid.",
    details: error.issues.map((issue: ZodIssue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}
