import type { Request } from "express";
import { sessionExpiryReason } from "../config/session.js";
export declare const authSessionSelect: {
    readonly id: true;
    readonly userId: true;
    readonly deviceName: true;
    readonly deviceType: true;
    readonly browser: true;
    readonly operatingSystem: true;
    readonly ipAddress: true;
    readonly userAgent: true;
    readonly lastSeenAt: true;
    readonly expiresAt: true;
    readonly createdAt: true;
    readonly updatedAt: true;
};
export type AuthSessionRecord = Awaited<ReturnType<typeof createAuthSession>>;
export declare function getClientIpAddress(req: Request): string | null;
export declare function createAuthSession(userId: string, req: Request): Promise<{
    id: string;
    deviceName: string | null;
    deviceType: string | null;
    browser: string | null;
    operatingSystem: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    lastSeenAt: Date;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}>;
/**
 * Remove every session that has passed its absolute deadline or been idle for
 * too long.
 *
 * Expiry is enforced on each request regardless — this only stops the table
 * growing without bound, and keeps the "active devices" list in Settings from
 * showing sessions that would be refused if anyone tried to use them.
 */
export declare function deleteExpiredSessions(now?: Date): Promise<number>;
export declare function deleteAuthSession(sessionId: string, userId?: string): Promise<number>;
export declare function listUserAuthSessions(userId: string): Promise<{
    id: string;
    deviceName: string | null;
    deviceType: string | null;
    browser: string | null;
    operatingSystem: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    lastSeenAt: Date;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}[]>;
export declare function revokeOtherUserSessions(userId: string, currentSessionId?: string): Promise<void>;
/**
 * Whether this session may still be used, and why not when it may not.
 *
 * Re-exported from the config so callers have one import for "is this session
 * still good?" rather than reaching past this module for the rule.
 */
export declare const authSessionExpiryReason: typeof sessionExpiryReason;
export declare function touchAuthSession(sessionId: string, lastSeenAt: Date): Promise<void>;
export declare function serializeAuthSession(session: {
    id: string;
    deviceName: string | null;
    deviceType: string | null;
    browser: string | null;
    operatingSystem: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    lastSeenAt: Date;
    expiresAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
} | null | undefined, currentSessionId?: string): {
    isCurrent?: boolean | undefined;
    id: string;
    deviceName: string | null;
    deviceType: string | null;
    browser: string | null;
    operatingSystem: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    lastSeenAt: string;
    expiresAt: string | null;
    idleTimeoutMs: number;
    createdAt: string;
    updatedAt: string;
} | null;
//# sourceMappingURL=auth-session.d.ts.map