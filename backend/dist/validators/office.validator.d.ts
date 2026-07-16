import { z, type ZodError } from "zod";
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
export declare function buildValidationError(error: ZodError): {
    error: string;
    message: string;
    details: {
        path: string;
        message: string;
    }[];
};
//# sourceMappingURL=office.validator.d.ts.map