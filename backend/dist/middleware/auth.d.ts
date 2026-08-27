import type { NextFunction, Request, Response } from "express";
import { type AuthSessionRecord } from "../lib/auth-session.js";
type AuthenticatedRole = {
    id: string;
    name: string;
};
type AuthenticatedOffice = {
    id: string;
    name: string;
    status: boolean;
};
type AuthenticatedStaff = {
    id: string;
    officeId: string;
    office?: AuthenticatedOffice | null;
    role?: AuthenticatedRole | null;
};
type AuthenticatedOfficer = {
    id: string;
    companyId: string;
    warehouseId?: string | null;
    roleId: string;
    role: AuthenticatedRole;
    company?: {
        id: string;
        name: string;
    } | null;
};
export interface AuthRequest extends Request {
    authSession?: AuthSessionRecord | null;
    sessionId?: string;
    userId?: string;
    user?: {
        id: string;
        name: string;
        username: string;
        phone: string;
        phoneNumber: string;
        roleId?: string | null;
        roleName?: string | null;
        staff?: AuthenticatedStaff | null;
        officer?: AuthenticatedOfficer | null;
    };
    permissions?: string[];
    isAdmin?: boolean;
    isManager?: boolean;
    isStaff?: boolean;
    isCustomer?: boolean;
}
/**
 * Middleware to require authentication.
 * Verifies the JWT token, validates the backing session, and attaches the
 * authenticated user context to the request.
 */
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response>;
/**
 * Identify the caller when they present a token, and carry on when they do not.
 *
 * For endpoints that serve both the public site and the dashboard. The guest
 * catalogue of services is open to anyone, but a signed-in office user must
 * still be recognised so their view can be scoped to their own office — which
 * is impossible on a route that never reads the token.
 *
 * Never rejects: an absent, malformed or expired token simply leaves the
 * request anonymous. Use requireAuth wherever a caller must be known.
 */
export declare function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function requirePermission(permission: string): (req: AuthRequest, res: Response, next: NextFunction) => void | Response;
export declare function requireAnyPermission(...permissions: string[]): (req: AuthRequest, res: Response, next: NextFunction) => void | Response;
export declare function requireAllPermissions(...permissions: string[]): (req: AuthRequest, res: Response, next: NextFunction) => void | Response;
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response>;
export {};
//# sourceMappingURL=auth.d.ts.map