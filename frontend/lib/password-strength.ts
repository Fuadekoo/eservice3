import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordCriteriaResult = {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};

export function checkPasswordCriteria(password: string): PasswordCriteriaResult {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  colorClass: string;
  textClass: string;
} {
  if (!password) {
    return { score: 0, label: "", colorClass: "", textClass: "" };
  }

  const criteria = checkPasswordCriteria(password);
  const met = Object.values(criteria).filter(Boolean).length;

  if (met <= 1) {
    return { score: 1, label: "Weak", colorClass: "bg-red-500", textClass: "text-red-500" };
  }
  if (met === 2) {
    return { score: 2, label: "Fair", colorClass: "bg-orange-500", textClass: "text-orange-500" };
  }
  if (met <= 4) {
    return { score: 3, label: "Good", colorClass: "bg-yellow-500", textClass: "text-yellow-600" };
  }
  return { score: 4, label: "Strong", colorClass: "bg-green-500", textClass: "text-green-600" };
}

export const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, "Password must be less than 128 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

export const optionalStrongPasswordSchema = strongPasswordSchema
  .optional()
  .or(z.literal(""));
