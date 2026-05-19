import { Prisma } from "../lib/prisma-client.js";
import { hash } from "bcryptjs";

/**
 * Legacy status values accepted by the helper and mapped to `isActive`.
 */
export type UserStatusInput = "ACTIVE" | "INACTIVE" | "PENDING" | "BLOCKED";

/**
 * User input type for creating/updating users.
 * The helper accepts a few legacy aliases (`phone`, `status`) and normalizes them
 * to the current Prisma `User` model shape.
 */
export type UserInput = {
  id?: string;
  username?: string;
  phone?: string;
  phoneNumber?: string;
  password?: string | null;
  roleId?: string | null;
  isActive?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  status?: UserStatusInput;
  name?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
};

/**
 * Coerce a value to a nullable string
 */
export function coerceNullableString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return String(value);
}

/**
 * Coerce a value to a non-empty string (throws if empty)
 */
export function coerceRequiredString(
  value: unknown,
  fieldName: string,
): string {
  const normalized = coerceNullableString(value);
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }
  return normalized;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.trim().length === 0) {
    throw new Error("Password cannot be empty");
  }
  return await hash(password, 10);
}

/**
 * Normalize phone input to the current `phoneNumber` field.
 */
function getNormalizedPhoneNumber(
  payload: Pick<UserInput, "phone" | "phoneNumber">,
): string | null {
  return coerceNullableString(payload.phoneNumber ?? payload.phone);
}

/**
 * Resolve the active flag from either the current field or a legacy status value.
 */
function resolveIsActive(
  payload: Pick<UserInput, "isActive" | "status">,
): boolean | undefined {
  if (payload.isActive !== undefined) {
    return payload.isActive;
  }
  if (payload.status === undefined) {
    return undefined;
  }
  return payload.status === "ACTIVE";
}

/**
 * Build user create data with hashed password
 */
export async function buildUserCreateData(
  payload: UserInput,
): Promise<Prisma.UserUncheckedCreateInput> {
  const username = coerceRequiredString(payload.username, "username");
  const phoneNumber = coerceRequiredString(
    getNormalizedPhoneNumber(payload),
    "phone number",
  );
  const password = coerceRequiredString(payload.password, "password");

  const data: Prisma.UserUncheckedCreateInput = {
    ...(payload.id !== undefined ? { id: coerceRequiredString(payload.id, "id") } : {}),
    username,
    phoneNumber,
    password: await hashPassword(password),
  };

  if (payload.roleId !== undefined) {
    data.roleId = coerceNullableString(payload.roleId);
  }

  const isActive = resolveIsActive(payload);
  if (isActive !== undefined) {
    data.isActive = isActive;
  }

  if (payload.phoneVerified !== undefined) {
    data.phoneVerified = payload.phoneVerified;
  }

  if (payload.twoFactorEnabled !== undefined) {
    data.twoFactorEnabled = payload.twoFactorEnabled;
  }

  if (payload.twoFactorSecret !== undefined) {
    data.twoFactorSecret = coerceNullableString(payload.twoFactorSecret);
  }

  return data;
}

/**
 * Build user update data with optional password hashing
 */
export async function buildUserUpdateData(
  payload: UserInput,
): Promise<Prisma.UserUncheckedUpdateInput> {
  const data: Prisma.UserUncheckedUpdateInput = {};

  if (payload.username !== undefined) {
    data.username = coerceRequiredString(payload.username, "username");
  }

  if (payload.phone !== undefined || payload.phoneNumber !== undefined) {
    data.phoneNumber = coerceRequiredString(
      getNormalizedPhoneNumber(payload),
      "phone number",
    );
  }

  if (payload.roleId !== undefined) {
    data.roleId = coerceNullableString(payload.roleId);
  }

  const isActive = resolveIsActive(payload);
  if (isActive !== undefined) {
    data.isActive = isActive;
  }

  if (payload.phoneVerified !== undefined) {
    data.phoneVerified = payload.phoneVerified;
  }

  if (payload.twoFactorEnabled !== undefined) {
    data.twoFactorEnabled = payload.twoFactorEnabled;
  }

  if (payload.twoFactorSecret !== undefined) {
    data.twoFactorSecret = coerceNullableString(payload.twoFactorSecret);
  }

  if (payload.password !== undefined) {
    data.password = await hashPassword(
      coerceRequiredString(payload.password, "password"),
    );
  }

  return data;
}

/**
 * Sync user account (create or update)
 * Useful for upsert operations
 */
export async function syncUser(
  tx: Prisma.TransactionClient,
  params: {
    userId?: string; // If provided, will update; otherwise, will create
    payload: UserInput;
  },
): Promise<void> {
  if (params.userId) {
    // Update existing user
    const updateData = await buildUserUpdateData(params.payload);
    await tx.user.update({
      where: { id: params.userId },
      data: updateData,
    });
  } else {
    // Create new user
    const createData = await buildUserCreateData(params.payload);
    await tx.user.create({ data: createData });
  }
}

/**
 * Validate phone number format (basic validation)
 */
export function validatePhone(phone: string): boolean {
  // Basic phone validation - adjust regex based on your requirements
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

/**
 * Validate username format
 */
export function validateUsername(username: string): boolean {
  // Username: 3-30 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }
  if (password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }
  // Optional: Add more strength requirements
  // if (!/[A-Z]/.test(password)) {
  //   errors.push("Password must contain at least one uppercase letter");
  // }
  // if (!/[a-z]/.test(password)) {
  //   errors.push("Password must contain at least one lowercase letter");
  // }
  // if (!/[0-9]/.test(password)) {
  //   errors.push("Password must contain at least one number");
  // }

  return {
    valid: errors.length === 0,
    errors,
  };
}
