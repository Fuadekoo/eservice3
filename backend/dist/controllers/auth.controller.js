import { Prisma } from "../lib/prisma-client.js";
import { compare, hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { sendSMS } from "../services/sms.service.js";
import { disableTwoFactor as disableTwoFactorHandler, generateTwoFactorSetup as beginTwoFactorSetupHandler, getTwoFactorStatus as getTwoFactorStatusHandler, validateTwoFactorLogin as verifyLoginTwoFactorHandler, verifyAndEnableTwoFactor as verifyTwoFactorSetupHandler, } from "./two-factor.controller.js";
import { createAuthSession, deleteAuthSession, listUserAuthSessions, revokeOtherUserSessions, serializeAuthSession, } from "../lib/auth-session.js";
import { prisma } from "../lib/db.js";
import { generateToken } from "../lib/jwt.js";
import { buildValidationError } from "../validators/security.validator.js";
const loginSchema = z.object({
    phone: z.string().trim().min(1, "Phone number is required."),
    password: z.string().min(1, "Password is required."),
});
const updateProfileSchema = z
    .object({
    username: z.string().trim().min(1, "Username is required.").optional(),
    phone: z.string().trim().min(1, "Phone number is required.").optional(),
})
    .refine((value) => value.username !== undefined || value.phone !== undefined, {
    message: "Provide at least one field to update.",
    path: [],
});
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(6, "New password must be at least 6 characters."),
});
const userAuthInclude = {
    role: {
        include: {
            rolePermissions: {
                include: {
                    permission: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                        },
                    },
                },
            },
        },
    },
    staffs: {
        orderBy: {
            createdAt: "asc",
        },
        take: 1,
        include: {
            office: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    },
};
async function findUserForAuthByPhone(phone) {
    return prisma.user.findFirst({
        where: {
            phoneNumber: phone.trim(),
        },
        include: userAuthInclude,
    });
}
async function findUserForAuthById(userId) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: userAuthInclude,
    });
}
function getPrimaryStaff(user) {
    return user.staffs[0] ?? null;
}
function getPermissions(user) {
    return (user.role?.rolePermissions.map((entry) => entry.permission.code ?? entry.permission.name) ?? []);
}
function buildTokenForUser(user, sessionId) {
    return generateToken({
        sessionId,
        userId: user.id,
        username: user.username,
        phone: user.phoneNumber,
        ...(user.role
            ? {
                roleId: user.role.id,
                roleName: user.role.name,
            }
            : {}),
    });
}
function buildAuthResponse(user, token, session) {
    const primaryStaff = getPrimaryStaff(user);
    const permissions = getPermissions(user);
    return {
        user: {
            id: user.id,
            username: user.username,
            phone: user.phoneNumber,
            phoneNumber: user.phoneNumber,
            isActive: user.isActive,
            phoneVerified: user.phoneVerified,
            roleId: user.roleId ?? null,
            officeId: primaryStaff?.officeId ?? null,
            staffId: primaryStaff?.id ?? null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
        office: primaryStaff?.office
            ? {
                id: primaryStaff.office.id,
                name: primaryStaff.office.name,
            }
            : null,
        role: user.role
            ? {
                id: user.role.id,
                name: user.role.name,
            }
            : null,
        permissions,
        ...(session
            ? { currentSession: serializeAuthSession(session, session.id) }
            : {}),
        ...(token ? { token } : {}),
    };
}
function isDatabaseConnectionError(error) {
    if (!error || typeof error !== "object") {
        return false;
    }
    const maybeError = error;
    return (maybeError.code === "ECONNREFUSED" ||
        maybeError.code === "ETIMEDOUT" ||
        maybeError.code === 45028);
}
function handleControllerError(res, error, fallbackMessage) {
    console.error(`[auth.controller] ${fallbackMessage}:`, error);
    if (isDatabaseConnectionError(error)) {
        return res.status(503).json({
            error: "ServiceUnavailable",
            message: "Database connection failed. Please check your database configuration.",
        });
    }
    return res.status(500).json({
        error: "InternalServerError",
        message: fallbackMessage,
        details: process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
    });
}
function respondNotImplemented(res, feature) {
    return res.status(501).json({
        error: "NotImplemented",
        message: `${feature} is not implemented for the current Prisma schema.`,
    });
}
export async function login(req, res) {
    try {
        const validationResult = loginSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json(buildValidationError(validationResult.error));
        }
        const { phone, password } = validationResult.data;
        const user = await findUserForAuthByPhone(phone);
        if (!user) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Invalid phone number or password",
            });
        }
        if (!user.isActive) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Account is not active",
            });
        }
        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Invalid phone number or password",
            });
        }
        if (user.twoFactorEnabled) {
            return res.status(202).json({
                data: {
                    requiresTwoFactor: true,
                    userId: user.id,
                },
            });
        }
        const session = await createAuthSession(user.id, req);
        const token = buildTokenForUser(user, session.id);
        return res.json({
            data: buildAuthResponse(user, token, session),
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to login");
    }
}
export async function getCurrentUser(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "User not authenticated",
            });
        }
        const user = await findUserForAuthById(req.userId);
        if (!user) {
            return res.status(404).json({
                error: "NotFoundError",
                message: "User not found",
            });
        }
        res.setHeader("Cache-Control", "no-store");
        return res.json({
            data: buildAuthResponse(user),
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to get current user");
    }
}
export async function updateProfile(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "User not authenticated",
            });
        }
        const validationResult = updateProfileSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json(buildValidationError(validationResult.error));
        }
        const { phone, username } = validationResult.data;
        await prisma.user.update({
            where: { id: req.userId },
            data: {
                ...(username !== undefined ? { username } : {}),
                ...(phone !== undefined ? { phoneNumber: phone } : {}),
            },
        });
        const updatedUser = await findUserForAuthById(req.userId);
        if (!updatedUser) {
            return res.status(404).json({
                error: "NotFoundError",
                message: "User not found",
            });
        }
        return res.json({
            data: buildAuthResponse(updatedUser),
            message: "Profile updated successfully",
        });
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return res.status(409).json({
                    error: "ConflictError",
                    message: "Username or phone number is already in use.",
                });
            }
        }
        return handleControllerError(res, error, "Failed to update profile");
    }
}
export async function changePassword(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "User not authenticated",
            });
        }
        const validationResult = changePasswordSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json(buildValidationError(validationResult.error));
        }
        const { currentPassword, newPassword } = validationResult.data;
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                password: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                error: "NotFoundError",
                message: "User not found",
            });
        }
        const isValidPassword = await compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({
                error: "ValidationError",
                message: "Current password is incorrect.",
            });
        }
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: await hash(newPassword, 12),
            },
        });
        return res.json({
            data: {
                success: true,
            },
            message: "Password changed successfully",
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to change password");
    }
}
export async function verifyLoginTwoFactor(req, res) {
    return verifyLoginTwoFactorHandler(req, res);
}
const registerCustomerSchema = z.object({
    firstName: z.string().trim().min(1, "First name is required."),
    fatherName: z.string().trim().min(1, "Father's name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    username: z.string().trim().min(1, "Username is required."),
    phone: z.string().trim().min(1, "Phone number is required."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    officeId: z.string().min(1).optional(),
});
export async function registerCustomer(req, res) {
    try {
        const validationResult = registerCustomerSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json(buildValidationError(validationResult.error));
        }
        const { firstName, fatherName, lastName, username, phone, password, officeId, } = validationResult.data;
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ username: username.trim() }, { phoneNumber: phone.trim() }],
            },
        });
        if (existingUser) {
            return res.status(409).json({
                error: "ConflictError",
                message: "Username or phone number is already in use.",
            });
        }
        // Get Customer role
        const customerRole = await prisma.role.findFirst({
            where: { name: "CUSTOMER" },
        });
        if (!customerRole) {
            return res.status(500).json({
                error: "InternalServerError",
                message: "Customer role not found in the system.",
            });
        }
        // Create user; optionally associate with an office via Staff when officeId is provided
        const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name: `${firstName} ${fatherName} ${lastName}`.trim(),
                    firstName: firstName.trim(),
                    fatherName: fatherName.trim(),
                    lastName: lastName.trim(),
                    username: username.trim(),
                    phoneNumber: phone.trim(),
                    password: await hash(password, 12),
                    roleId: customerRole.id,
                    isActive: true,
                    phoneVerified: false,
                },
            });
            if (officeId) {
                await tx.staff.create({
                    data: {
                        userId: user.id,
                        officeId,
                    },
                });
            }
            return user;
        });
        const userForAuth = await findUserForAuthById(newUser.id);
        if (!userForAuth) {
            throw new Error("Failed to retrieve created user");
        }
        const session = await createAuthSession(userForAuth.id, req);
        const token = buildTokenForUser(userForAuth, session.id);
        return res.status(201).json({
            data: buildAuthResponse(userForAuth, token, session),
            message: "Registration successful",
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to register customer");
    }
}
export async function getUserSessions(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "User not authenticated",
            });
        }
        const sessions = await listUserAuthSessions(req.userId);
        return res.json({
            data: sessions.map((s) => serializeAuthSession(s, req.sessionId)),
            message: "Sessions retrieved successfully",
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to list sessions");
    }
}
export async function logout(req, res) {
    try {
        if (req.sessionId) {
            await deleteAuthSession(req.sessionId);
        }
        return res.json({
            data: { success: true },
            message: "Logged out successfully",
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to logout");
    }
}
export async function revokeSession(req, res) {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({
                error: "ValidationError",
                message: "Session ID is required",
            });
        }
        if (!req.userId) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "User not authenticated",
            });
        }
        const count = await deleteAuthSession(sessionId, req.userId);
        if (count === 0) {
            return res.status(404).json({
                error: "NotFoundError",
                message: "Session not found or does not belong to you",
            });
        }
        return res.json({
            data: { success: true },
            message: "Session revoked successfully",
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to revoke session");
    }
}
export async function revokeOtherSessions(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "User not authenticated",
            });
        }
        await revokeOtherUserSessions(req.userId, req.sessionId);
        return res.json({
            data: { success: true },
            message: "Other sessions revoked successfully",
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to revoke other sessions");
    }
}
export async function getTwoFactorStatus(req, res) {
    return getTwoFactorStatusHandler(req, res);
}
export async function beginTwoFactorSetup(req, res) {
    return beginTwoFactorSetupHandler(req, res);
}
export async function verifyTwoFactorSetup(req, res) {
    return verifyTwoFactorSetupHandler(req, res);
}
export async function disableTwoFactor(req, res) {
    return disableTwoFactorHandler(req, res);
}
const otpStore = new Map();
const resetTokenStore = new Map();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_OTP_ATTEMPTS = 5;
const forgotPasswordStrongPassword = z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be less than 128 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");
function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}
function generateResetToken() {
    return randomBytes(32).toString("hex");
}
export async function requestPasswordReset(req, res) {
    try {
        const { phone } = req.body;
        if (!phone?.trim()) {
            return res.status(400).json({
                error: "ValidationError",
                message: "Phone number is required.",
            });
        }
        const user = await prisma.user.findFirst({
            where: { phoneNumber: phone.trim() },
            select: { id: true, phoneNumber: true, isActive: true },
        });
        // Always return success to prevent phone enumeration attacks,
        // but only send OTP if the account actually exists and is active.
        if (user && user.isActive) {
            const otp = generateOtp();
            otpStore.set(user.phoneNumber, {
                otp,
                expiresAt: Date.now() + OTP_TTL_MS,
                attempts: 0,
            });
            const smsResult = await sendSMS(user.phoneNumber, `Your password reset code is: ${otp}. Valid for 10 minutes. Do not share this code.`);
            if (process.env.NODE_ENV === "development") {
                console.log(`[forgot-password] OTP for ${user.phoneNumber}: ${otp} (SMS: ${smsResult.success ? "sent" : "failed"})`);
            }
        }
        return res.json({
            message: "If an account with that number exists, an OTP has been sent.",
            ...(process.env.NODE_ENV === "development" && user?.isActive
                ? { _devOtp: otpStore.get(user.phoneNumber)?.otp }
                : {}),
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to send password reset OTP");
    }
}
export async function verifyPasswordResetOtp(req, res) {
    try {
        const { phone, otp } = req.body;
        if (!phone?.trim() || !otp?.trim()) {
            return res.status(400).json({
                error: "ValidationError",
                message: "Phone number and OTP are required.",
            });
        }
        const entry = otpStore.get(phone.trim());
        if (!entry) {
            return res.status(400).json({
                error: "InvalidOtp",
                message: "No OTP found for this number. Please request a new code.",
            });
        }
        if (Date.now() > entry.expiresAt) {
            otpStore.delete(phone.trim());
            return res.status(400).json({
                error: "OtpExpired",
                message: "OTP has expired. Please request a new code.",
            });
        }
        entry.attempts += 1;
        if (entry.attempts > MAX_OTP_ATTEMPTS) {
            otpStore.delete(phone.trim());
            return res.status(429).json({
                error: "TooManyAttempts",
                message: "Too many incorrect attempts. Please request a new code.",
            });
        }
        if (entry.otp !== otp.trim()) {
            return res.status(400).json({
                error: "InvalidOtp",
                message: "Incorrect code. Please try again.",
            });
        }
        otpStore.delete(phone.trim());
        const resetToken = generateResetToken();
        resetTokenStore.set(resetToken, {
            phone: phone.trim(),
            expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
        });
        return res.json({
            data: { resetToken },
            message: "OTP verified. You may now reset your password.",
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to verify OTP");
    }
}
export async function resetPassword(req, res) {
    try {
        const { resetToken, newPassword } = req.body;
        if (!resetToken?.trim()) {
            return res.status(400).json({
                error: "ValidationError",
                message: "Reset token is required.",
            });
        }
        const parsed = forgotPasswordStrongPassword.safeParse(newPassword);
        if (!parsed.success) {
            return res.status(400).json({
                error: "ValidationError",
                message: parsed.error.errors[0]?.message ?? "Invalid password.",
            });
        }
        const entry = resetTokenStore.get(resetToken.trim());
        if (!entry) {
            return res.status(400).json({
                error: "InvalidToken",
                message: "Invalid or already used reset token.",
            });
        }
        if (Date.now() > entry.expiresAt) {
            resetTokenStore.delete(resetToken.trim());
            return res.status(400).json({
                error: "TokenExpired",
                message: "Reset token has expired. Please start the process again.",
            });
        }
        const user = await prisma.user.findFirst({
            where: { phoneNumber: entry.phone },
            select: { id: true },
        });
        if (!user) {
            return res.status(404).json({
                error: "NotFound",
                message: "Account not found.",
            });
        }
        await prisma.user.update({
            where: { id: user.id },
            data: { password: await hash(parsed.data, 12) },
        });
        resetTokenStore.delete(resetToken.trim());
        return res.json({
            data: { success: true },
            message: "Password reset successfully. You can now sign in.",
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to reset password");
    }
}
//# sourceMappingURL=auth.controller.js.map