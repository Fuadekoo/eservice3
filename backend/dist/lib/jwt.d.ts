export interface JWTPayload {
    sessionId: string;
    userId: string;
    username: string;
    phone: string;
    roleId?: string;
    roleName?: string;
    isAdmin?: boolean;
}
/**
 * Generate a JWT token for a user
 */
export declare function generateToken(payload: JWTPayload): string;
/**
 * Verify and decode a JWT token
 */
export declare function verifyToken(token: string): JWTPayload;
/**
 * Extract token from Authorization header
 */
export declare function extractTokenFromHeader(authHeader: string | undefined): string | null;
//# sourceMappingURL=jwt.d.ts.map