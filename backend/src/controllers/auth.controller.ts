import type { Request, Response } from "express";
import { Prisma } from "../lib/prisma-client.js";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

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

const loginSchema = z.object({
  phone: z.string().trim().min(1, "Phone number is required."),
  password: z.string().min(1, "Password is required."),
});

const updateProfileSchema = z
  .object({
    username: z.string().trim().min(1, "Username is required.").optional(),
    phone: z.string().trim().min(1, "Phone number is required.").optional(),
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
  return prisma.user.findFirst({
    where: {
      phoneNumber: phone.trim(),
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
  phone: z.string().trim().min(1, "Phone number is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  officeId: z.string().min(1).optional(),
});

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
      officeId,
    } = validationResult.data;

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
      data: sessions.map((s) => serializeAuthSession(s, req.sessionId)),
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
