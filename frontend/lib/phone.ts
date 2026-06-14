import { z } from "zod";

export const PHONE_FORMAT_MESSAGE =
  "Enter a valid phone number starting with 09 or 2519.";

function compactPhoneInput(input: string): string {
  return input.trim().replace(/[\s\-()]/g, "");
}

export function normalizeEthiopianMobilePhone(input: string): string | null {
  const compact = compactPhoneInput(input);

  if (/^09\d{8}$/.test(compact)) {
    return `251${compact.slice(1)}`;
  }

  if (/^2519\d{8}$/.test(compact)) {
    return compact;
  }

  return null;
}

export function isValidEthiopianMobilePhone(input: string): boolean {
  return normalizeEthiopianMobilePhone(input) !== null;
}

export const ethiopianMobilePhoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .refine(isValidEthiopianMobilePhone, PHONE_FORMAT_MESSAGE);
