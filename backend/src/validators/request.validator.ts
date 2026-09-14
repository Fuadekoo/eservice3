import { z } from "zod";
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

/**
 * Fold one or more duplicate applications into a surviving one.
 *
 * Capped at twenty per call: a legitimate duplicate set is two or three, and a
 * larger number is far more likely to be a mis-selected page of the table than
 * a real intention.
 */
export const mergeRequestSchema = z.object({
  duplicateIds: z
    .array(z.string().trim().min(1, "A request id is required."))
    .min(1, "Select at least one duplicate request to merge.")
    .max(20, "At most 20 requests can be merged at once.")
    // The same id twice would re-point its files and close it twice over.
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "The same request was listed more than once.",
    }),
  note: z.string().trim().max(500, "Keep the note under 500 characters.").optional(),
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
 * Build a validation error the client can actually display.
 *
 * Re-exported from one shared implementation so every endpoint reports a
 * failure in the same shape — see src/utils/validation-error.ts for why the
 * per-validator copies had to go.
 */
export {
  buildValidationError,
  type ValidationErrorPayload,
} from "../utils/validation-error.js";
