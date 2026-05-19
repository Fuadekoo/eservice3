import { Prisma } from "../lib/prisma-client.js";
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
export declare function coerceNullableString(value: unknown): string | null;
/**
 * Coerce a value to a non-empty string (throws if empty)
 */
export declare function coerceRequiredString(value: unknown, fieldName: string): string;
/**
 * Hash a password using bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Build user create data with hashed password
 */
export declare function buildUserCreateData(payload: UserInput): Promise<Prisma.UserUncheckedCreateInput>;
/**
 * Build user update data with optional password hashing
 */
export declare function buildUserUpdateData(payload: UserInput): Promise<Prisma.UserUncheckedUpdateInput>;
/**
 * Sync user account (create or update)
 * Useful for upsert operations
 */
export declare function syncUser(tx: Prisma.TransactionClient, params: {
    userId?: string;
    payload: UserInput;
}): Promise<void>;
/**
 * Validate phone number format (basic validation)
 */
export declare function validatePhone(phone: string): boolean;
/**
 * Validate username format
 */
export declare function validateUsername(username: string): boolean;
/**
 * Validate password strength
 */
export declare function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=account.d.ts.map