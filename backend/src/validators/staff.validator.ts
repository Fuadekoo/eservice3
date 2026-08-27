import { z, type ZodError } from "zod";
import {
  ETHIOPIAN_MOBILE_PHONE_MESSAGE,
  normalizeEthiopianMobilePhone,
} from "../utils/phone.js";

/**
 * A stored name part must never be null, empty, or whitespace-only.
 * `.trim()` runs before `.min(1)`, so "   " is rejected too.
 */
const requiredNameField = (label: string) =>
  z
    .string({ error: label + " is required." })
    .trim()
    .min(1, label + " is required.")
    .max(100, label + " must be 100 characters or fewer.");

/** Same rules, but the field may be omitted entirely (partial updates). */
const optionalNameField = (label: string) =>
  requiredNameField(label).optional();

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
    firstName: requiredNameField("First name"),
    fatherName: requiredNameField("Father name"),
    lastName: requiredNameField("Last name"),
    // Derived from the parts above when omitted; never accepted as blank.
    name: optionalNameField("Name"),
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
    firstName: optionalNameField("First name"),
    fatherName: optionalNameField("Father name"),
    lastName: optionalNameField("Last name"),
    name: optionalNameField("Name"),
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
