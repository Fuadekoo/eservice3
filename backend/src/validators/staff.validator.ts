import { z, type ZodError } from "zod";
import {
  ETHIOPIAN_MOBILE_PHONE_MESSAGE,
  normalizeEthiopianMobilePhone,
} from "../utils/phone.js";

const phoneField = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .refine((value) => normalizeEthiopianMobilePhone(value) !== null, {
    message: ETHIOPIAN_MOBILE_PHONE_MESSAGE,
  })
  .transform((value) => normalizeEthiopianMobilePhone(value) ?? value)
  .optional();

/**
 * Create staff — phone and role are cross-validated via superRefine.
 * Accept both `phone` and `phoneNumber` for frontend compatibility.
 */
export const createStaffSchema = z
  .object({
    username: z.string().trim().min(1, "Username is required."),
    firstName: z.string().trim().min(1, "First name is required.").optional(),
    fatherName: z.string().trim().min(1, "Father name is required.").optional(),
    lastName: z.string().trim().min(1, "Last name is required.").optional(),
    name: z.string().trim().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    status: z
      .enum(["ACTIVE", "INACTIVE", "PENDING", "BLOCKED"])
      .optional()
      .default("ACTIVE"),
    phone: phoneField,
    phoneNumber: phoneField,
    password: z.string().min(6, "Password must be at least 6 characters."),
    roleId: z.string().trim().min(1).optional(),
    roleName: z.string().trim().min(1).optional(),
    officeId: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
    phoneVerified: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.phone && !value.phoneNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number is required.",
        path: ["phoneNumber"],
      });
    }
    if (!value.roleId && !value.roleName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either roleId or roleName is required.",
        path: ["roleId"],
      });
    }
  });

/**
 * Update staff — all fields optional; at least one must be provided.
 */
export const updateStaffSchema = z
  .object({
    username: z.string().trim().min(1, "Username is required.").optional(),
    firstName: z.string().trim().min(1, "First name is required.").optional(),
    fatherName: z.string().trim().min(1, "Father name is required.").optional(),
    lastName: z.string().trim().min(1, "Last name is required.").optional(),
    name: z.string().trim().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "BLOCKED"]).optional(),
    phone: phoneField,
    phoneNumber: phoneField,
    password: z
      .string()
      .min(6, "Password must be at least 6 characters.")
      .optional(),
    roleId: z.string().trim().min(1).optional(),
    roleName: z.string().trim().min(1).optional(),
    officeId: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
    phoneVerified: z.boolean().optional(),
  })
  .refine(
    (value) =>
      Object.values(value).some((entry) => entry !== undefined && entry !== ""),
    {
      message: "Provide at least one field to update.",
      path: [],
    },
  );

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

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
