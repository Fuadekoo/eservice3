import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
/**
 * Generate a new TOTP secret and QR code for the authenticated user.
 */
export declare function generateTwoFactorSetup(req: AuthRequest, res: Response): Promise<Response | void>;
/**
 * Verify a TOTP token against the pending secret and enable 2FA.
 */
export declare function verifyAndEnableTwoFactor(req: AuthRequest, res: Response): Promise<Response | void>;
/**
 * Disable 2FA for the authenticated user.
 */
export declare function disableTwoFactor(req: AuthRequest, res: Response): Promise<Response | void>;
/**
 * Get the current 2FA status for the authenticated user.
 */
export declare function getTwoFactorStatus(req: AuthRequest, res: Response): Promise<Response | void>;
/**
 * Validate a TOTP token during login and issue the final JWT.
 */
export declare function validateTwoFactorLogin(req: Request, res: Response): Promise<Response | void>;
//# sourceMappingURL=two-factor.controller.d.ts.map