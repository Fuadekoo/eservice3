import { z, type ZodError } from "zod";
/**
 * Build validation error response
 */
export declare function buildValidationError(error: ZodError): {
    error: string;
    message: string;
    details: {
        path: string;
        message: string;
    }[];
};
/**
 * =======================
 * ROLE VALIDATORS
 * =======================
 */
export declare const createRoleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    officeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    permissions: z.ZodPipe<z.ZodOptional<z.ZodArray<z.ZodOptional<z.ZodNullable<z.ZodString>>>>, z.ZodTransform<string[] | undefined, (string | null | undefined)[] | undefined>>;
}, z.core.$strip>;
export declare const updateRoleSchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    officeId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    permissions: z.ZodOptional<z.ZodPipe<z.ZodOptional<z.ZodArray<z.ZodOptional<z.ZodNullable<z.ZodString>>>>, z.ZodTransform<string[] | undefined, (string | null | undefined)[] | undefined>>>;
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * =======================
 * PERMISSION VALIDATORS
 * =======================
 */
export declare const createPermissionSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const updatePermissionSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    code: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * =======================
 * AUDIT LOG VALIDATORS
 * =======================
 */
export declare const createAuditLogSchema: z.ZodObject<{
    timestamp: z.ZodOptional<z.ZodDate>;
    actor: z.ZodString;
    role: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    action: z.ZodString;
    resource: z.ZodString;
    status: z.ZodString;
    metadata: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    userId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const updateAuditLogSchema: z.ZodObject<{
    timestamp: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    actor: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    action: z.ZodOptional<z.ZodString>;
    resource: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
    userId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
}, z.core.$strip>;
/**
 * =======================
 * PERMISSION SET VALIDATORS (Stub - may not be used in DMS)
 * =======================
 */
export declare const createPermissionSetSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$loose>;
export declare const updatePermissionSetSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    permissions: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
}, z.core.$loose>;
/**
 * =======================
 * SECURITY PROGRAM VALIDATORS (Stub - may not be used in DMS)
 * =======================
 */
export declare const createSecurityProgramSchema: z.ZodObject<{}, z.core.$loose>;
export declare const updateSecurityProgramSchema: z.ZodObject<{}, z.core.$loose>;
/**
 * =======================
 * SECURITY AUDIT VALIDATORS (Stub - may not be used in DMS)
 * =======================
 */
export declare const createSecurityAuditSchema: z.ZodObject<{}, z.core.$loose>;
export declare const updateSecurityAuditSchema: z.ZodObject<{}, z.core.$loose>;
/**
 * =======================
 * SECURITY INCIDENT VALIDATORS (Stub - may not be used in DMS)
 * =======================
 */
export declare const createSecurityIncidentSchema: z.ZodObject<{}, z.core.$loose>;
export declare const updateSecurityIncidentSchema: z.ZodObject<{}, z.core.$loose>;
/**
 * =======================
 * SECURITY REMINDER VALIDATORS (Stub - may not be used in DMS)
 * =======================
 */
export declare const createSecurityReminderSchema: z.ZodObject<{}, z.core.$loose>;
export declare const updateSecurityReminderSchema: z.ZodObject<{}, z.core.$loose>;
/**
 * =======================
 * PERMISSION CHANGE REQUEST VALIDATORS (Stub - may not be used in DMS)
 * =======================
 */
export declare const createPermissionChangeRequestSchema: z.ZodObject<{}, z.core.$loose>;
export declare const updatePermissionChangeRequestSchema: z.ZodObject<{}, z.core.$loose>;
//# sourceMappingURL=security.validator.d.ts.map