import jwt from "jsonwebtoken";

import { JWT_EXPIRES_IN_SECONDS, JWT_SECRET } from "../config/session.js";

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
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    // Seconds, derived from SESSION_ABSOLUTE_TIMEOUT so the token and the
    // session row behind it always agree about when the session ended.
    expiresIn: JWT_EXPIRES_IN_SECONDS,
  } as jwt.SignOptions);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader) {
    return null;
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }
  return parts[1] ?? null;
}
