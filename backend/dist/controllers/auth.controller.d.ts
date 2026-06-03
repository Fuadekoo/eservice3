import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
export declare function login(req: Request, res: Response): Promise<Response | void>;
export declare function getCurrentUser(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function updateProfile(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function changePassword(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function verifyLoginTwoFactor(req: Request, res: Response): Promise<Response | void>;
export declare function registerCustomer(req: Request, res: Response): Promise<Response | void>;
export declare function getUserSessions(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function logout(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function revokeSession(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function revokeOtherSessions(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function getTwoFactorStatus(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function beginTwoFactorSetup(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function verifyTwoFactorSetup(req: AuthRequest, res: Response): Promise<Response | void>;
export declare function disableTwoFactor(req: AuthRequest, res: Response): Promise<Response | void>;
//# sourceMappingURL=auth.controller.d.ts.map