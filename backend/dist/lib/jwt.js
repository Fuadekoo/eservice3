import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN_SECONDS, JWT_SECRET } from "../config/session.js";
/**
 * Generate a JWT token for a user
 */
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        // Seconds, derived from SESSION_ABSOLUTE_TIMEOUT so the token and the
        // session row behind it always agree about when the session ended.
        expiresIn: JWT_EXPIRES_IN_SECONDS,
    });
}
/**
 * Verify and decode a JWT token
 */
export function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        throw new Error("Invalid or expired token");
    }
}
/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader) {
    if (!authHeader) {
        return null;
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return null;
    }
    return parts[1] ?? null;
}
//# sourceMappingURL=jwt.js.map