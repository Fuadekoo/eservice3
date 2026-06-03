import * as QRCode from "qrcode";
import { z } from "zod";
import { createAuthSession, serializeAuthSession, } from "../lib/auth-session.js";
import { prisma } from "../lib/db.js";
import { generateToken } from "../lib/jwt.js";
import { buildTwoFactorOtpAuthUri, decryptTwoFactorSecret, encryptTwoFactorSecret, formatTwoFactorSecret, generateTwoFactorSecret, getTwoFactorAppIssuer, getTwoFactorDefaults, verifyTwoFactorCode, } from "../lib/two-factor.js";
import { buildValidationError } from "../validators/security.validator.js";
const APP_NAME = "MesobE-service ";
const tokenSchema = z.object({
    token: z.string().trim().min(1, "A verification code is required."),
});
const loginTokenSchema = tokenSchema.extend({
    userId: z.string().trim().min(1, "User ID is required."),
});
const loginUserInclude = {
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
async function findTwoFactorLoginUser(userId) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: loginUserInclude,
    });
}
function getPrimaryStaff(user) {
    return user.staffs[0] ?? null;
}
function getPermissions(user) {
    return (user.role?.rolePermissions.map((entry) => entry.permission.code ?? entry.permission.name) ?? []);
}
function buildLoginResponse(user, session, token) {
    const primaryStaff = getPrimaryStaff(user);
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
            twoFactorEnabled: user.twoFactorEnabled,
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
        permissions: getPermissions(user),
        currentSession: serializeAuthSession(session, session.id),
        token,
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
    console.error(`[two-factor.controller] ${fallbackMessage}:`, error);
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
/**
 * Generate a new TOTP secret and QR code for the authenticated user.
 */
export async function generateTwoFactorSetup(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Authentication required",
            });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                twoFactorEnabled: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                error: "NotFound",
                message: "User not found",
            });
        }
        if (user.twoFactorEnabled) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Two-factor authentication is already enabled. Disable it first to reconfigure.",
            });
        }
        const secret = generateTwoFactorSecret();
        const encryptedSecret = encryptTwoFactorSecret(secret);
        const issuer = getTwoFactorAppIssuer() || APP_NAME;
        const otpauthUrl = buildTwoFactorOtpAuthUri({
            secret,
            accountName: user.username,
            issuer,
        });
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
            width: 280,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
        });
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: encryptedSecret,
            },
        });
        return res.json({
            data: {
                accountName: user.username,
                enabled: false,
                issuer,
                manualEntryKey: formatTwoFactorSecret(secret),
                otpauthUrl,
                pendingSetup: true,
                qrCode: qrCodeDataUrl,
                secret,
                ...getTwoFactorDefaults(),
            },
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to generate two-factor setup");
    }
}
/**
 * Verify a TOTP token against the pending secret and enable 2FA.
 */
export async function verifyAndEnableTwoFactor(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Authentication required",
            });
        }
        const validationResult = tokenSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json(buildValidationError(validationResult.error));
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                twoFactorSecret: true,
                twoFactorEnabled: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                error: "NotFound",
                message: "User not found",
            });
        }
        if (user.twoFactorEnabled) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Two-factor authentication is already enabled",
            });
        }
        if (!user.twoFactorSecret) {
            return res.status(400).json({
                error: "BadRequest",
                message: "No two-factor secret found. Please start the setup process first.",
            });
        }
        const secret = decryptTwoFactorSecret(user.twoFactorSecret);
        const isValidCode = verifyTwoFactorCode(secret, validationResult.data.token);
        if (!isValidCode) {
            return res.status(400).json({
                error: "ValidationError",
                message: "Invalid verification code. Please try again with the current code from your authenticator app.",
            });
        }
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true },
        });
        return res.json({
            data: {
                message: "Two-factor authentication has been enabled successfully",
                twoFactorEnabled: true,
            },
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to verify and enable two-factor authentication");
    }
}
/**
 * Disable 2FA for the authenticated user.
 */
export async function disableTwoFactor(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Authentication required",
            });
        }
        const validationResult = tokenSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json(buildValidationError(validationResult.error));
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                twoFactorSecret: true,
                twoFactorEnabled: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                error: "NotFound",
                message: "User not found",
            });
        }
        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Two-factor authentication is not currently enabled",
            });
        }
        const secret = decryptTwoFactorSecret(user.twoFactorSecret);
        const isValidCode = verifyTwoFactorCode(secret, validationResult.data.token);
        if (!isValidCode) {
            return res.status(400).json({
                error: "ValidationError",
                message: "Invalid verification code. Cannot disable two-factor authentication.",
            });
        }
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });
        return res.json({
            data: {
                message: "Two-factor authentication has been disabled",
                twoFactorEnabled: false,
            },
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to disable two-factor authentication");
    }
}
/**
 * Get the current 2FA status for the authenticated user.
 */
export async function getTwoFactorStatus(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Authentication required",
            });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                twoFactorEnabled: true,
                twoFactorSecret: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                error: "NotFound",
                message: "User not found",
            });
        }
        return res.json({
            data: {
                accountName: user.username,
                enabled: user.twoFactorEnabled,
                issuer: getTwoFactorAppIssuer() || APP_NAME,
                pendingSetup: Boolean(user.twoFactorSecret && !user.twoFactorEnabled),
                twoFactorEnabled: user.twoFactorEnabled,
                ...getTwoFactorDefaults(),
            },
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to get two-factor status");
    }
}
/**
 * Validate a TOTP token during login and issue the final JWT.
 */
export async function validateTwoFactorLogin(req, res) {
    try {
        const validationResult = loginTokenSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json(buildValidationError(validationResult.error));
        }
        const { userId, token } = validationResult.data;
        const user = await findTwoFactorLoginUser(userId);
        if (!user) {
            return res.status(404).json({
                error: "NotFound",
                message: "User not found",
            });
        }
        if (!user.isActive) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Account is not active",
            });
        }
        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({
                error: "BadRequest",
                message: "Two-factor authentication is not configured for this user",
            });
        }
        const secret = decryptTwoFactorSecret(user.twoFactorSecret);
        const isValidCode = verifyTwoFactorCode(secret, token);
        if (!isValidCode) {
            return res.status(400).json({
                error: "ValidationError",
                message: "Invalid verification code",
            });
        }
        const session = await createAuthSession(user.id, req);
        const jwtToken = generateToken({
            sessionId: session.id,
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
        return res.json({
            data: buildLoginResponse(user, session, jwtToken),
        });
    }
    catch (error) {
        return handleControllerError(res, error, "Failed to validate two-factor code");
    }
}
//# sourceMappingURL=two-factor.controller.js.map