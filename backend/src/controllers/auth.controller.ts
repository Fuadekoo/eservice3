import type { Request, Response } from "express";
import { Prisma } from "../lib/prisma-client.js";
import { compare, hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { sendSMS } from "../services/sms.service.js";

import type { AuthRequest } from "../middleware/auth.js";
import {
  disableTwoFactor as disableTwoFactorHandler,
  generateTwoFactorSetup as beginTwoFactorSetupHandler,
  getTwoFactorStatus as getTwoFactorStatusHandler,
  validateTwoFactorLogin as verifyLoginTwoFactorHandler,
  verifyAndEnableTwoFactor as verifyTwoFactorSetupHandler,
} from "./two-factor.controller.js";
import {
  createAuthSession,
  deleteAuthSession,
  listUserAuthSessions,
  revokeOtherUserSessions,
  serializeAuthSession,
} from "../lib/auth-session.js";
import { prisma } from "../lib/db.js";
import { generateToken } from "../lib/jwt.js";
import { buildValidationError } from "../validators/security.validator.js";
import {
  ETHIOPIAN_MOBILE_PHONE_MESSAGE,
  getEthiopianMobilePhoneCandidates,
  normalizeEthiopianMobilePhone,
} from "../utils/phone.js";

const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine((value) => normalizeEthiopianMobilePhone(value) !== null, {
      message: ETHIOPIAN_MOBILE_PHONE_MESSAGE,
    })
    .transform((value) => normalizeEthiopianMobilePhone(value) ?? value),
  password: z.string().min(1, "Password is required."),
});

const updateProfileSchema = z
  .object({
    username: z.string().trim().min(1, "Username is required.").optional(),
    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required.")
      .refine((value) => normalizeEthiopianMobilePhone(value) !== null, {
        message: ETHIOPIAN_MOBILE_PHONE_MESSAGE,
      })
      .transform((value) => normalizeEthiopianMobilePhone(value) ?? value)
      .optional(),
  })
  .refine(
    (value) => value.username !== undefined || value.phone !== undefined,
    {
      message: "Provide at least one field to update.",
      path: [],
    },
  );

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
      createdAt: "asc" as const,
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
} as const;

async function findUserForAuthByPhone(phone: string) {
  const candidates = getEthiopianMobilePhoneCandidates(phone);

  return prisma.user.findFirst({
    where: {
      phoneNumber:
        candidates.length > 1 ? { in: candidates } : (candidates[0] ?? phone),
    },
    include: userAuthInclude,
  });
}

async function findUserForAuthById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: userAuthInclude,
  });
}

type AuthUserRecord = NonNullable<
  Awaited<ReturnType<typeof findUserForAuthById>>
>;

function getPrimaryStaff(user: AuthUserRecord) {
  return user.staffs[0] ?? null;
}

function getPermissions(user: AuthUserRecord): string[] {
  return (
    user.role?.rolePermissions.map(
      (entry) => entry.permission.code ?? entry.permission.name,
    ) ?? []
  );
}

function buildTokenForUser(user: AuthUserRecord, sessionId: string): string {
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

function buildAuthResponse(
  user: AuthUserRecord,
  token?: string,
  session?: Awaited<ReturnType<typeof createAuthSession>>,
) {
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

async function normalizeStoredAuthUserPhone(
  user: AuthUserRecord,
  normalizedPhone: string,
): Promise<AuthUserRecord> {
  if (user.phoneNumber === normalizedPhone) return user;

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { phoneNumber: normalizedPhone },
    });

    return (await findUserForAuthById(user.id)) ?? user;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return user;
    }

    console.warn(
      `[auth.controller] Failed to normalize stored phone for user ${user.id}:`,
      error,
    );
    return user;
  }
}

function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: unknown };
  return (
    maybeError.code === "ECONNREFUSED" ||
    maybeError.code === "ETIMEDOUT" ||
    maybeError.code === 45028
  );
}

function handleControllerError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
): Response {
  console.error(`[auth.controller] ${fallbackMessage}:`, error);

  if (isDatabaseConnectionError(error)) {
    return res.status(503).json({
      error: "ServiceUnavailable",
      message:
        "Database connection failed. Please check your database configuration.",
    });
  }

  return res.status(500).json({
    error: "InternalServerError",
    message: fallbackMessage,
    details:
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : undefined,
  });
}

function respondNotImplemented(res: Response, feature: string): Response {
  return res.status(501).json({
    error: "NotImplemented",
    message: `${feature} is not implemented for the current Prisma schema.`,
  });
}

export async function login(
  req: Request,
  res: Response,
): Promise<Response | void> {
  try {
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(buildValidationError(validationResult.error));
    }

    const { phone, password } = validationResult.data;
    let user = await findUserForAuthByPhone(phone);

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

    user = await normalizeStoredAuthUserPhone(user, phone);

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
  } catch (error) {
    return handleControllerError(res, error, "Failed to login");
  }
}

export async function getCurrentUser(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
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
  } catch (error) {
    return handleControllerError(res, error, "Failed to get current user");
  }
}

export async function updateProfile(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
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

    if (phone !== undefined) {
      const existingByPhone = await prisma.user.findFirst({
        where: {
          id: { not: req.userId },
          phoneNumber: { in: getEthiopianMobilePhoneCandidates(phone) },
        },
        select: { id: true },
      });

      if (existingByPhone) {
        return res.status(409).json({
          error: "ConflictError",
          message: "Phone number is already in use.",
        });
      }
    }

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
  } catch (error) {
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

export async function changePassword(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
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
  } catch (error) {
    return handleControllerError(res, error, "Failed to change password");
  }
}

export async function verifyLoginTwoFactor(
  req: Request,
  res: Response,
): Promise<Response | void> {
  return verifyLoginTwoFactorHandler(req, res);
}

const registerCustomerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  fatherName: z.string().trim().min(1, "Father's name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  username: z.string().trim().min(1, "Username is required."),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine((value) => normalizeEthiopianMobilePhone(value) !== null, {
      message: ETHIOPIAN_MOBILE_PHONE_MESSAGE,
    })
    .transform((value) => normalizeEthiopianMobilePhone(value) ?? value),
  password: z.string().min(6, "Password must be at least 6 characters."),
  otp: z.string().trim().length(6, "OTP must be 6 digits."),
  officeId: z.string().min(1).optional(),
});

const registerOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine((value) => normalizeEthiopianMobilePhone(value) !== null, {
      message: ETHIOPIAN_MOBILE_PHONE_MESSAGE,
    })
    .transform((value) => normalizeEthiopianMobilePhone(value) ?? value),
});

const verifyRegisterOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required.")
    .refine((value) => normalizeEthiopianMobilePhone(value) !== null, {
      message: ETHIOPIAN_MOBILE_PHONE_MESSAGE,
    })
    .transform((value) => normalizeEthiopianMobilePhone(value) ?? value),
  otp: z.string().trim().length(6, "OTP must be 6 digits."),
});

type OtpEntry = {
  otp: string;
  expiresAt: number;
  attempts: number;
  verified?: boolean;
};
type ResetTokenEntry = { phone: string; expiresAt: number };

const registrationOtpStore = new Map<string, OtpEntry>();
const otpStore = new Map<string, OtpEntry>();
const resetTokenStore = new Map<string, ResetTokenEntry>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_OTP_ATTEMPTS = 5;

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

function getValidOtpEntry(
  store: Map<string, OtpEntry>,
  phone: string,
): OtpEntry | null {
  const entry = store.get(phone);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(phone);
    return null;
  }
  return entry;
}

export async function requestRegistrationOtp(
  req: Request,
  res: Response,
): Promise<Response | void> {
  try {
    const validationResult = registerOtpSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(buildValidationError(validationResult.error));
    }

    const phone = validationResult.data.phone;
    const phoneCandidates = getEthiopianMobilePhoneCandidates(phone);
    const existingUser = await prisma.user.findFirst({
      where: { phoneNumber: { in: phoneCandidates } },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "ConflictError",
        message: "Phone number is already in use.",
      });
    }

    const otp = generateOtp();
    registrationOtpStore.set(phone, {
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
      verified: false,
    });

    const smsResult = await sendSMS(
      phone,
      `Your E-Service registration code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
    );

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[register] OTP for ${phone}: ${otp} (SMS: ${smsResult.success ? "sent" : "failed"})`,
      );
    }

    return res.json({
      message: "Verification code sent. Please check your phone.",
      ...(process.env.NODE_ENV === "development" ? { _devOtp: otp } : {}),
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Failed to send registration OTP",
    );
  }
}

export async function verifyRegistrationOtp(
  req: Request,
  res: Response,
): Promise<Response | void> {
  try {
    const validationResult = verifyRegisterOtpSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(buildValidationError(validationResult.error));
    }

    const phone = validationResult.data.phone;
    const otp = validationResult.data.otp.trim();
    const entry = getValidOtpEntry(registrationOtpStore, phone);

    if (!entry) {
      return res.status(400).json({
        error: "OtpExpired",
        message: "Verification code has expired. Please request a new code.",
      });
    }

    entry.attempts += 1;
    if (entry.attempts > MAX_OTP_ATTEMPTS) {
      registrationOtpStore.delete(phone);
      return res.status(429).json({
        error: "TooManyAttempts",
        message: "Too many incorrect attempts. Please request a new code.",
      });
    }

    if (entry.otp !== otp) {
      return res.status(400).json({
        error: "InvalidOtp",
        message: "Incorrect verification code. Please try again.",
      });
    }

    entry.verified = true;

    return res.json({
      message: "Phone number verified successfully.",
    });
  } catch (error) {
    return handleControllerError(
      res,
      error,
      "Failed to verify registration OTP",
    );
  }
}

export async function registerCustomer(
  req: Request,
  res: Response,
): Promise<Response | void> {
  try {
    const validationResult = registerCustomerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(buildValidationError(validationResult.error));
    }

    const {
      firstName,
      fatherName,
      lastName,
      username,
      phone,
      password,
      otp,
      officeId,
    } = validationResult.data;
    const normalizedPhone = phone;
    const phoneCandidates = getEthiopianMobilePhoneCandidates(normalizedPhone);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { phoneNumber: { in: phoneCandidates } },
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "ConflictError",
        message: "Username or phone number is already in use.",
      });
    }

    const otpEntry = getValidOtpEntry(registrationOtpStore, normalizedPhone);
    if (!otpEntry) {
      return res.status(400).json({
        error: "OtpExpired",
        message: "Verification code has expired. Please request a new code.",
      });
    }

    if (otpEntry.otp !== otp.trim()) {
      otpEntry.attempts += 1;
      if (otpEntry.attempts > MAX_OTP_ATTEMPTS) {
        registrationOtpStore.delete(normalizedPhone);
        return res.status(429).json({
          error: "TooManyAttempts",
          message: "Too many incorrect attempts. Please request a new code.",
        });
      }

      return res.status(400).json({
        error: "InvalidOtp",
        message: "Incorrect verification code. Please try again.",
      });
    }

    if (!otpEntry.verified) {
      otpEntry.attempts += 1;
      if (otpEntry.attempts > MAX_OTP_ATTEMPTS) {
        registrationOtpStore.delete(normalizedPhone);
        return res.status(429).json({
          error: "TooManyAttempts",
          message: "Too many incorrect attempts. Please request a new code.",
        });
      }
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
          phoneNumber: normalizedPhone,
          password: await hash(password, 12),
          roleId: customerRole.id,
          isActive: true,
          phoneVerified: true,
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
    registrationOtpStore.delete(normalizedPhone);

    const userForAuth = await findUserForAuthById(newUser.id);
    if (!userForAuth) {
      throw new Error("Failed to retrieve created user");
    }

    const session = await createAuthSession(userForAuth.id, req);
    const token = buildTokenForUser(userForAuth, session.id);

    const welcomeMsg =
      `Welcome ${userForAuth.username}!\n\n` +
      `Your E-Service account has been created successfully.\n\n` +
      `You can now sign in, apply for services, track your requests, and receive updates by SMS.\n\n` +
      `Thank you for joining us.`;

    sendSMS(userForAuth.phoneNumber, welcomeMsg).catch((error) =>
      console.error(
        `Welcome SMS to customer ${userForAuth.phoneNumber} failed:`,
        error,
      ),
    );

    return res.status(201).json({
      data: buildAuthResponse(userForAuth, token, session),
      message: "Registration successful",
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to register customer");
  }
}

export async function getUserSessions(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "AuthenticationError",
        message: "User not authenticated",
      });
    }

    const sessions = await listUserAuthSessions(req.userId);

    return res.json({
      data: {
        sessions: sessions.map((s) => serializeAuthSession(s, req.sessionId)),
      },
      message: "Sessions retrieved successfully",
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to list sessions");
  }
}

export async function logout(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    if (req.sessionId) {
      await deleteAuthSession(req.sessionId);
    }

    return res.json({
      data: { success: true },
      message: "Logged out successfully",
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to logout");
  }
}

export async function revokeSession(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
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

    const count = await deleteAuthSession(sessionId as string, req.userId);

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
  } catch (error) {
    return handleControllerError(res, error, "Failed to revoke session");
  }
}

export async function revokeOtherSessions(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
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
  } catch (error) {
    return handleControllerError(res, error, "Failed to revoke other sessions");
  }
}

export async function getTwoFactorStatus(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  return getTwoFactorStatusHandler(req, res);
}

export async function beginTwoFactorSetup(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  return beginTwoFactorSetupHandler(req, res);
}

export async function verifyTwoFactorSetup(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  return verifyTwoFactorSetupHandler(req, res);
}

export async function disableTwoFactor(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  return disableTwoFactorHandler(req, res);
}

// ─── Forgot Password (OTP-based) ─────────────────────────────────────────────

const forgotPasswordStrongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be less than 128 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

export async function requestPasswordReset(
  req: Request,
  res: Response,
): Promise<Response | void> {
  try {
    const { phone } = req.body as { phone?: string };
    const normalizedPhone = phone
      ? normalizeEthiopianMobilePhone(phone)
      : null;
    if (!phone?.trim() || !normalizedPhone) {
      return res.status(400).json({
        error: "ValidationError",
        message: phone?.trim()
          ? ETHIOPIAN_MOBILE_PHONE_MESSAGE
          : "Phone number is required.",
      });
    }

    const phoneCandidates = getEthiopianMobilePhoneCandidates(normalizedPhone);
    const user = await prisma.user.findFirst({
      where: { phoneNumber: { in: phoneCandidates } },
      select: { id: true, phoneNumber: true, isActive: true },
    });

    // Always return success to prevent phone enumeration attacks,
    // but only send OTP if the account actually exists and is active.
    if (user && user.isActive) {
      const otp = generateOtp();
      otpStore.set(normalizedPhone, {
        otp,
        expiresAt: Date.now() + OTP_TTL_MS,
        attempts: 0,
      });

      const smsResult = await sendSMS(
        normalizedPhone,
        `Your password reset code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
      );

      if (process.env.NODE_ENV === "development") {
        console.log(`[forgot-password] OTP for ${normalizedPhone}: ${otp} (SMS: ${smsResult.success ? "sent" : "failed"})`);
      }
    }

    return res.json({
      message: "If an account with that number exists, an OTP has been sent.",
      ...(process.env.NODE_ENV === "development" && user?.isActive
        ? { _devOtp: otpStore.get(normalizedPhone)?.otp }
        : {}),
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to send password reset OTP");
  }
}

export async function verifyPasswordResetOtp(
  req: Request,
  res: Response,
): Promise<Response | void> {
  try {
    const { phone, otp } = req.body as { phone?: string; otp?: string };
    const normalizedPhone = phone
      ? normalizeEthiopianMobilePhone(phone)
      : null;

    if (!phone?.trim() || !normalizedPhone || !otp?.trim()) {
      return res.status(400).json({
        error: "ValidationError",
        message:
          phone?.trim() && !normalizedPhone
            ? ETHIOPIAN_MOBILE_PHONE_MESSAGE
            : "Phone number and OTP are required.",
      });
    }

    const entry = otpStore.get(normalizedPhone);

    if (!entry) {
      return res.status(400).json({
        error: "InvalidOtp",
        message: "No OTP found for this number. Please request a new code.",
      });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(normalizedPhone);
      return res.status(400).json({
        error: "OtpExpired",
        message: "OTP has expired. Please request a new code.",
      });
    }

    entry.attempts += 1;

    if (entry.attempts > MAX_OTP_ATTEMPTS) {
      otpStore.delete(normalizedPhone);
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

    otpStore.delete(normalizedPhone);

    const resetToken = generateResetToken();
    resetTokenStore.set(resetToken, {
      phone: normalizedPhone,
      expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
    });

    return res.json({
      data: { resetToken },
      message: "OTP verified. You may now reset your password.",
    });
  } catch (error) {
    return handleControllerError(res, error, "Failed to verify OTP");
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
): Promise<Response | void> {
  try {
    const { resetToken, newPassword } = req.body as {
      resetToken?: string;
      newPassword?: string;
    };

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
        message: parsed.error.issues[0]?.message ?? "Invalid password.",
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
      where: { phoneNumber: { in: getEthiopianMobilePhoneCandidates(entry.phone) } },
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
  } catch (error) {
    return handleControllerError(res, error, "Failed to reset password");
  }
}
