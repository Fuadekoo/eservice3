import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
export declare function login(req: Request, res: Response): Promise<Response | void>;
export declare function getCurrentUser(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function updateProfile(req: AuthRequest, res: Response): Promise<Response | void>;
/**
 * Step 1 of changing the signed-in user's phone number: validate the new
 * number, then send a one-time code to it by SMS. The number is only persisted
 * after the code is confirmed (see confirmPhoneChange).
 */
export declare function requestPhoneChangeOtp(req: AuthRequest, res: Response): Promise<Response | void>;
/**
 * Step 2 of changing the phone number: confirm the OTP and persist the pending
 * new phone number.
 */
export declare function confirmPhoneChange(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function changePassword(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function verifyLoginTwoFactor(req: Request, res: Response): Promise<Response | void>;
export declare function requestRegistrationOtp(req: Request, res: Response): Promise<Response | void>;
export declare function verifyRegistrationOtp(req: Request, res: Response): Promise<Response | void>;
export declare function registerCustomer(req: Request, res: Response): Promise<Response | void>;
export declare function getUserSessions(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function logout(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function revokeSession(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function revokeOtherSessions(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function getTwoFactorStatus(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function beginTwoFactorSetup(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function verifyTwoFactorSetup(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function disableTwoFactor(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function requestPasswordReset(req: Request, res: Response): Promise<Response | void>;
export declare function verifyPasswordResetOtp(req: Request, res: Response): Promise<Response | void>;
export declare function resetPassword(req: Request, res: Response): Promise<Response | void>;
//# sourceMappingURL=auth.controller.d.ts.map