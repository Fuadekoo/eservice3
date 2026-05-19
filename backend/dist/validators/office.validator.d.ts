import { z, type ZodError } from "zod";
/**
 * Office creation schema
 */
export declare const createOfficeSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodLiteral<"">]>;
    logo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    slogan: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        SUSPENDED: "SUSPENDED";
        TRIAL: "TRIAL";
        EXPIRED: "EXPIRED";
    }>>;
}, z.core.$strip>;
/**
 * Office update schema - all fields are optional for partial updates
 */
export declare const updateOfficeSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodLiteral<"">]>;
    logo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    slogan: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        SUSPENDED: "SUSPENDED";
        TRIAL: "TRIAL";
        EXPIRED: "EXPIRED";
    }>>;
}, z.core.$strip>;
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
//# sourceMappingURL=office.validator.d.ts.map