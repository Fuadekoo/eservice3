import { z } from "zod";
export declare const createOfficeSchema: z.ZodObject<{
    name: z.ZodString;
    roomNumber: z.ZodString;
    address: z.ZodString;
    subdomain: z.ZodString;
    phoneNumber: z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string | null, string>>>>;
    logo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    slogan: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    settings: z.ZodOptional<z.ZodAny>;
    status: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateOfficeSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    roomNumber: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    subdomain: z.ZodOptional<z.ZodString>;
    phoneNumber: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string | null, string>>>>>;
    logo: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    slogan: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodAny>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
/**
 * Build a validation error the client can actually display.
 *
 * Re-exported from one shared implementation so every endpoint reports a
 * failure in the same shape — see src/utils/validation-error.ts for why the
 * per-validator copies had to go.
 */
export { buildValidationError, type ValidationErrorPayload, } from "../utils/validation-error.js";
//# sourceMappingURL=office.validator.d.ts.map