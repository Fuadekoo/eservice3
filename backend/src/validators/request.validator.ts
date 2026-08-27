import { z, type ZodError } from "zod";
import {
  ETHIOPIAN_MOBILE_PHONE_MESSAGE,
  normalizeEthiopianMobilePhone,
} from "../utils/phone.js";
import { requiredNameField } from "../utils/name.js";

/**
 * File data schema
 */
const fileDataSchema = z.object({
  name: z.string().trim().min(1, "File name is required."),
  filepath: z.string().trim().min(1, "File path is required."),
  description: z.string().trim().optional(),
});

/**
 * Create request validator
 */
export const createRequestSchema = z.object({
  serviceId: z.string().trim().min(1, "Service ID is required."),
  currentAddress: z.string().trim().min(1, "Current address is required."),
  date: z.string().datetime("Invalid date format."),
  notes: z.string().trim().optional(),
  files: z.array(fileDataSchema).optional().default([]),
});

/** Who the request is for. `self` is the ordinary case. */
export const BENEFICIARY_TYPES = ["self", "other"] as const;

/**
 * Relationships a dependent may have to the applicant. A closed list keeps the
 * column clean enough to group and report on, which free text would not be.
 */
export const BENEFICIARY_RELATIONSHIPS = [
  "spouse",
  "child",
  "parent",
  "sibling",
  "grandparent",
  "grandchild",
  "guardian",
  "other",
] as const;

const beneficiaryPhoneField = z
  .string()
  .trim()
  .min(1, "Beneficiary phone number is required.")
  .refine((value) => normalizeEthiopianMobilePhone(value) !== null, {
    message: ETHIOPIAN_MOBILE_PHONE_MESSAGE,
  })
  .transform((value) => normalizeEthiopianMobilePhone(value) ?? value);

/**
 * Create a request on behalf of a family member.
 *
 * Same shape as an ordinary request plus the three fields that identify the
 * dependent. The applicant stays the signed-in user — they are who the office
 * deals with — while name/phoneNumber/relationship record who it is actually
 * for. The name uses the same letters-only rule as every other person name.
 */
export const createRequestForOtherSchema = z.object({
  serviceId: z.string().trim().min(1, "Service ID is required."),
  currentAddress: z.string().trim().min(1, "Current address is required."),
  date: z.string().datetime("Invalid date format."),
  name: requiredNameField("Beneficiary name"),
  phoneNumber: beneficiaryPhoneField,
  relationship: z.enum(BENEFICIARY_RELATIONSHIPS, {
    error: "Select how the beneficiary is related to you.",
  }),
  notes: z.string().trim().optional(),
  files: z.array(fileDataSchema).optional().default([]),
});

export type CreateRequestForOtherInput = z.infer<
  typeof createRequestForOtherSchema
>;

/**
 * Update request validator
 */
export const updateRequestSchema = z.object({
  currentAddress: z
    .string()
    .trim()
    .min(1, "Current address is required.")
    .optional(),
  date: z.string().datetime("Invalid date format.").optional(),
  notes: z.string().trim().optional().nullable(),
  files: z.array(fileDataSchema).optional(),
});

/**
 * Approve request by staff validator
 */
export const approveRequestByStaffSchema = z.object({
  staffId: z.string().trim().min(1, "Staff ID is required."),
  notes: z.string().trim().optional(),
});

/**
 * Approve request by admin/manager validator
 */
export const approveRequestByAdminSchema = z.object({
  approverId: z.string().trim().min(1, "Approver ID is required."),
  notes: z.string().trim().optional(),
});

/**
 * Reject request validator
 */
export const rejectRequestSchema = z.object({
  rejectionReason: z.string().trim().min(1, "Rejection reason is required."),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
export type ApproveRequestByStaffInput = z.infer<
  typeof approveRequestByStaffSchema
>;
export type ApproveRequestByAdminInput = z.infer<
  typeof approveRequestByAdminSchema
>;
export type RejectRequestInput = z.infer<typeof rejectRequestSchema>;

/**
 * Build validation error from Zod error
 */
export function buildValidationError(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    result[path || "general"] = issue.message;
  });
  return result;
}
