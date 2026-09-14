import { z } from "zod";
import {
  ETHIOPIAN_MOBILE_PHONE_MESSAGE,
  normalizeEthiopianMobilePhone,
} from "../utils/phone.js";

const optionalOfficePhoneField = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || normalizeEthiopianMobilePhone(value) !== null,
    {
      message: ETHIOPIAN_MOBILE_PHONE_MESSAGE,
    },
  )
  .transform((value) =>
    value === "" ? null : normalizeEthiopianMobilePhone(value),
  )
  .optional()
  .nullable();

export const createOfficeSchema = z.object({
  name: z.string().trim().min(1, "Office name is required."),
  roomNumber: z.string().trim().min(1, "Room number is required."),
  address: z.string().trim().min(1, "Address is required."),
  subdomain: z
    .string()
    .trim()
    .min(1, "Subdomain is required.")
    .regex(
      /^[a-z0-9-]+$/,
      "Subdomain must contain only lowercase letters, numbers, and hyphens.",
    ),
  phoneNumber: optionalOfficePhoneField,
  logo: z.string().trim().optional().nullable(),
  slogan: z.string().trim().optional().nullable(),
  settings: z.any().optional(),
  status: z.boolean().optional(),
});

export const updateOfficeSchema = createOfficeSchema.partial();

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
