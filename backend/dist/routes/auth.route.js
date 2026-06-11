import { Router } from "express";
import { beginTwoFactorSetup, changePassword, disableTwoFactor, getTwoFactorStatus, login, getCurrentUser, updateProfile, getUserSessions, logout, registerCustomer, requestPasswordReset, resetPassword, revokeOtherSessions, revokeSession, verifyLoginTwoFactor, verifyPasswordResetOtp, verifyTwoFactorSetup, } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { changePasswordLimiter, forgotPasswordLimiter, loginLimiter, otpVerifyLimiter, passwordResetLimiter, registrationLimiter, } from "../middleware/rate-limit.js";
const router = Router();
// Async wrapper for route handlers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res)).catch(next);
    };
};
// Async wrapper for async middleware
const asyncMiddleware = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with phone number and password, returns JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 description: User phone number
 *                 example: "+1234567890"
 *                 minLength: 10
 *                 maxLength: 20
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: "password123"
 *                 minLength: 6
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         username:
 *                           type: string
 *                         phone:
 *                           type: string
 *                     role:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials or account not active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Login endpoint (public, no auth required)
router.post("/login", loginLimiter, asyncHandler(login));
router.post("/login/verify-2fa", loginLimiter, asyncHandler(verifyLoginTwoFactor));
// Public customer registration endpoint
router.post("/register/customer", registrationLimiter, asyncHandler(registerCustomer));
// Forgot password (OTP-based, all public)
router.post("/forgot-password/request", forgotPasswordLimiter, asyncHandler(requestPasswordReset));
router.post("/forgot-password/verify", otpVerifyLimiter, asyncHandler(verifyPasswordResetOtp));
router.post("/forgot-password/reset", passwordResetLimiter, asyncHandler(resetPassword));
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get the currently authenticated user's information including role and permissions
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         username:
 *                           type: string
 *                         phone:
 *                           type: string
 *                     role:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Unauthorized - User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get current user with permissions (requires auth)
router.get("/me", asyncMiddleware(requireAuth), asyncHandler(getCurrentUser));
router.put("/profile", asyncMiddleware(requireAuth), asyncHandler(updateProfile));
router.get("/sessions", asyncMiddleware(requireAuth), asyncHandler(getUserSessions));
router.delete("/sessions/:sessionId", asyncMiddleware(requireAuth), asyncHandler(revokeSession));
router.post("/sessions/revoke-others", asyncMiddleware(requireAuth), asyncHandler(revokeOtherSessions));
router.post("/logout", asyncMiddleware(requireAuth), asyncHandler(logout));
router.post("/change-password", changePasswordLimiter, asyncMiddleware(requireAuth), asyncHandler(changePassword));
router.get("/2fa/status", asyncMiddleware(requireAuth), asyncHandler(getTwoFactorStatus));
router.post("/2fa/setup", asyncMiddleware(requireAuth), asyncHandler(beginTwoFactorSetup));
router.post("/2fa/verify", asyncMiddleware(requireAuth), asyncHandler(verifyTwoFactorSetup));
router.post("/2fa/disable", asyncMiddleware(requireAuth), asyncHandler(disableTwoFactor));
export default router;
//# sourceMappingURL=auth.route.js.map