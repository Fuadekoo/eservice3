import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
export declare function listUsers(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=user.controller.d.ts.map