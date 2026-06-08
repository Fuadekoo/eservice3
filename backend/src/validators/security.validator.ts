import { z, type ZodError, type ZodIssue } from "zod";

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

/**
 * =======================
 * ROLE VALIDATORS
 * =======================
 */
export const createRoleSchema = z.object({
  name: z.string().trim().min(1, "Role name is required."),
  description: z.string().trim().nullable().optional(),
  officeId: z.string().trim().nullable().optional(),
  permissions: z
    .array(z.string().nullable().optional())
    .optional()
    .transform((arr) =>
      arr?.filter((s): s is string => typeof s === "string" && s.length > 0),
    ),
});

export const updateRoleSchema = createRoleSchema.partial().extend({
  name: z.string().trim().min(1, "Role name is required.").optional(),
});

/**
 * =======================
 * PERMISSION VALIDATORS
 * =======================
 */
export const createPermissionSchema = z.object({
  code: z.string().trim().min(1, "Permission code is required."),
  name: z.string().trim().min(1, "Permission name is required."),
  description: z.string().trim().nullable().optional(),
});

export const updatePermissionSchema = createPermissionSchema.partial().extend({
  code: z.string().trim().min(1, "Permission code is required.").optional(),
});

/**
 * =======================
 * AUDIT LOG VALIDATORS
 * =======================
 */
export const createAuditLogSchema = z.object({
  timestamp: z.date().optional(),
  actor: z.string().trim().min(1, "Actor is required."),
  role: z.string().trim().nullable().optional(),
  action: z.string().trim().min(1, "Action is required."),
  resource: z.string().trim().min(1, "Resource is required."),
  status: z.string().trim().min(1, "Status is required."),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  userId: z.string().trim().nullable().optional(),
});

export const updateAuditLogSchema = createAuditLogSchema.partial();

/**
 * =======================
 * PERMISSION SET VALIDATORS (Stub - may not be used in DMS)
 * =======================
 */
export const createPermissionSetSchema = z
  .object({
    name: z.string().trim().min(1, "Permission set name is required."),
    description: z.string().trim().nullable().optional(),
    permissions: z.array(z.string()).optional(),
  })
  .passthrough();

export const updatePermissionSetSchema = createPermissionSetSchema.partial();

/**
 * =======================
 * SECURITY PROGRAM VALIDATORS (Stub - may not be used in DMS)
 * =======================
 */
export const createSecurityProgramSchema = z.object({}).passthrough();
export const updateSecurityProgramSchema = z.object({}).passthrough();

/**
 * =======================
 * SECURITY AUDIT VALIDATORS (Stub - may not be used in DMS)
 * =======================
 */
export const createSecurityAuditSchema = z.object({}).passthrough();
export const updateSecurityAuditSchema = z.object({}).passthrough();

/**
 * =======================
 * SECURITY INCIDENT VALIDATORS (Stub - may not be used in DMS)
 * =======================
 */
export const createSecurityIncidentSchema = z.object({}).passthrough();
export const updateSecurityIncidentSchema = z.object({}).passthrough();

/**
 * =======================
 * SECURITY REMINDER VALIDATORS (Stub - may not be used in DMS)
 * =======================
 */
export const createSecurityReminderSchema = z.object({}).passthrough();
export const updateSecurityReminderSchema = z.object({}).passthrough();

/**
 * =======================
 * PERMISSION CHANGE REQUEST VALIDATORS (Stub - may not be used in DMS)
 * =======================
 */
export const createPermissionChangeRequestSchema = z.object({}).passthrough();
export const updatePermissionChangeRequestSchema = z.object({}).passthrough();
