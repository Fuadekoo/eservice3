import { z, type ZodError } from "zod";
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
