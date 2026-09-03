import { authSessionSelect, touchAuthSession, } from "../lib/auth-session.js";
import { prisma } from "../lib/db.js";
import { extractTokenFromHeader, verifyToken } from "../lib/jwt.js";
import { roleRequiresOfficeAssignment } from "../helper/myOffice.js";
const sessionUserInclude = {
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
    staff: {
        include: {
            office: {
                select: {
                    id: true,
                    name: true,
                    status: true,
                },
            },
        },
    },
};
async function findActiveSession(sessionId) {
    return prisma.session.findUnique({
        where: { id: sessionId },
        select: {
            ...authSessionSelect,
            user: {
                include: sessionUserInclude,
            },
        },
    });
}
function normalizeRoleName(roleName) {
    return roleName?.trim().toUpperCase() ?? "";
}
function getPrimaryStaff(user) {
    return user.staff ?? null;
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
function buildRequestUser(user) {
    const role = user.role
        ? {
            id: user.role.id,
            name: user.role.name,
        }
        : null;
    const primaryStaff = getPrimaryStaff(user);
    const staffContext = primaryStaff
        ? {
            id: primaryStaff.id,
            officeId: primaryStaff.officeId,
            ...(primaryStaff.office
                ? {
                    office: {
                        id: primaryStaff.office.id,
                        name: primaryStaff.office.name,
                        status: primaryStaff.office.status,
                    },
                }
                : {}),
            ...(role ? { role } : {}),
        }
        : null;
    const officerContext = primaryStaff && role
        ? {
            id: primaryStaff.id,
            companyId: primaryStaff.officeId,
            warehouseId: primaryStaff.officeId,
            roleId: role.id,
            role,
            ...(primaryStaff.office
                ? {
                    company: {
                        id: primaryStaff.office.id,
                        name: primaryStaff.office.name,
                    },
                }
                : {}),
        }
        : null;
    return {
        id: user.id,
        name: user.username,
        username: user.username,
        phone: user.phoneNumber,
        phoneNumber: user.phoneNumber,
        ...(user.roleId ? { roleId: user.roleId } : {}),
        ...(role ? { roleName: role.name } : {}),
        ...(staffContext ? { staff: staffContext } : {}),
        ...(officerContext ? { officer: officerContext } : {}),
    };
}
/**
 * Middleware to require authentication.
 * Verifies the JWT token, validates the backing session, and attaches the
 * authenticated user context to the request.
 */
export async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);
        if (!token) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Authentication required. Please provide a valid token.",
            });
        }
        let decodedToken;
        try {
            decodedToken = verifyToken(token);
        }
        catch {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Invalid or expired token",
            });
        }
        if (!decodedToken.sessionId) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Session information is missing. Please sign in again.",
            });
        }
        let activeSession;
        try {
            activeSession = await findActiveSession(decodedToken.sessionId);
        }
        catch (error) {
            console.error("[requireAuth] Database error:", error);
            if (isDatabaseConnectionError(error)) {
                return res.status(503).json({
                    error: "ServiceUnavailable",
                    message: "Database connection failed. Please try again later.",
                });
            }
            throw error;
        }
        if (!activeSession || activeSession.userId !== decodedToken.userId) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Session expired or revoked. Please sign in again.",
            });
        }
        const authenticatedUser = activeSession.user;
        if (!authenticatedUser.isActive) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Account is not active",
            });
        }
        const roleName = normalizeRoleName(authenticatedUser.role?.name);
        const isAdmin = roleName === "ADMIN";
        const isManager = roleName === "MANAGER";
        const isStaff = roleName === "STAFF";
        const isCustomer = roleName === "CUSTOMER";
        const primaryStaff = getPrimaryStaff(authenticatedUser);
        if (!isAdmin && primaryStaff?.office && !primaryStaff.office.status) {
            return res.status(403).json({
                error: "AuthenticationError",
                message: "Your office account is currently inactive. Please contact support.",
            });
        }
        if (roleRequiresOfficeAssignment(roleName, isAdmin, isManager) &&
            !primaryStaff?.officeId) {
            return res.status(403).json({
                error: "OfficeAssignmentRequired",
                message: "Your account is not assigned to an office. Please contact your administrator.",
            });
        }
        let permissions = [
            ...new Set(authenticatedUser.role?.rolePermissions.flatMap((entry) => permissionIdentifiers(entry.permission)) ?? []),
        ];
        if (isAdmin) {
            const allPermissions = await prisma.permission.findMany({
                select: {
                    name: true,
                    code: true,
                },
            });
            permissions = [...new Set(allPermissions.flatMap(permissionIdentifiers))];
        }
        req.user = buildRequestUser(authenticatedUser);
        req.userId = authenticatedUser.id;
        req.permissions = permissions;
        req.isAdmin = isAdmin;
        req.isManager = isManager;
        req.isStaff = isStaff;
        req.isCustomer = isCustomer;
        req.sessionId = activeSession.id;
        req.authSession = {
            id: activeSession.id,
            userId: activeSession.userId,
            deviceName: activeSession.deviceName,
            deviceType: activeSession.deviceType,
            browser: activeSession.browser,
            operatingSystem: activeSession.operatingSystem,
            ipAddress: activeSession.ipAddress,
            userAgent: activeSession.userAgent,
            lastSeenAt: activeSession.lastSeenAt,
            createdAt: activeSession.createdAt,
            updatedAt: activeSession.updatedAt,
        };
        void touchAuthSession(activeSession.id, activeSession.lastSeenAt);
        next();
    }
    catch (error) {
        console.error("[requireAuth] Error:", error);
        return res.status(500).json({
            error: "InternalServerError",
            message: "An error occurred during authentication",
        });
    }
}
/**
 * Identify the caller when they present a token, and carry on when they do not.
 *
 * For endpoints that serve both the public site and the dashboard. The guest
 * catalogue of services is open to anyone, but a signed-in office user must
 * still be recognised so their view can be scoped to their own office — which
 * is impossible on a route that never reads the token.
 *
 * Never rejects: an absent, malformed or expired token simply leaves the
 * request anonymous. Use requireAuth wherever a caller must be known.
 */
export async function optionalAuth(req, res, next) {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token)
        return next();
    try {
        const decoded = verifyToken(token);
        if (!decoded.sessionId)
            return next();
        const session = await findActiveSession(decoded.sessionId);
        if (!session || session.userId !== decoded.userId)
            return next();
        const user = session.user;
        if (!user.isActive)
            return next();
        const roleName = normalizeRoleName(user.role?.name);
        req.user = buildRequestUser(user);
        req.userId = user.id;
        req.permissions = [
            ...new Set(user.role?.rolePermissions.flatMap((entry) => permissionIdentifiers(entry.permission)) ?? []),
        ];
        req.isAdmin = roleName === "ADMIN";
        req.isManager = roleName === "MANAGER";
        req.isStaff = roleName === "STAFF";
        req.isCustomer = roleName === "CUSTOMER";
        req.sessionId = session.id;
    }
    catch {
        // A bad token is treated as no token; the endpoint is public either way.
    }
    return next();
}
/**
 * Every identifier a permission row can be recognised by.
 *
 * Two seeding conventions ended up in the permission table: `seed.ts` writes a
 * human label into `name` and the code into `code` ("Assign Staff" /
 * "service:assign-staff"), while `permission-seed.ts` writes the code into
 * `name`. Guards are written against the code, so reading `name` alone denied
 * every guarded route on a database seeded the first way — the grant was there
 * on the role, it simply could not be recognised, which is the worst version of
 * this bug because the roles screen shows the permission as held.
 *
 * `assignDefaultPermissionsToRole` already matches on either column when it
 * grants. This is the same rule on the checking side, so the two agree.
 */
function permissionIdentifiers(permission) {
    return [permission.name, permission.code]
        .map((value) => (value ?? "").trim())
        .filter(Boolean);
}
export function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.userId || !req.user) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Authentication required",
            });
        }
        if (req.isAdmin) {
            return next();
        }
        const userPermissions = req.permissions || [];
        if (!userPermissions.includes(permission)) {
            return res.status(403).json({
                error: "PermissionDenied",
                message: `You do not have permission to perform this action. Required permission: ${permission}`,
                requiredPermission: permission,
            });
        }
        next();
    };
}
export function requireAnyPermission(...permissions) {
    return (req, res, next) => {
        if (!req.userId || !req.user) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Authentication required",
            });
        }
        if (req.isAdmin) {
            return next();
        }
        const userPermissions = req.permissions || [];
        const hasPermission = permissions.some((permission) => userPermissions.includes(permission));
        if (!hasPermission) {
            return res.status(403).json({
                error: "PermissionDenied",
                message: `You do not have permission to perform this action. Required permissions: ${permissions.join(", ")}`,
                requiredPermissions: permissions,
            });
        }
        next();
    };
}
export function requireAllPermissions(...permissions) {
    return (req, res, next) => {
        if (!req.userId || !req.user) {
            return res.status(401).json({
                error: "AuthenticationError",
                message: "Authentication required",
            });
        }
        if (req.isAdmin) {
            return next();
        }
        const userPermissions = req.permissions || [];
        const hasAllPermissions = permissions.every((permission) => userPermissions.includes(permission));
        if (!hasAllPermissions) {
            const missingPermissions = permissions.filter((permission) => !userPermissions.includes(permission));
            return res.status(403).json({
                error: "PermissionDenied",
                message: `You do not have all required permissions. Missing: ${missingPermissions.join(", ")}`,
                requiredPermissions: permissions,
                missingPermissions,
            });
        }
        next();
    };
}
export async function requireAdmin(req, res, next) {
    if (!req.userId || !req.user) {
        return res.status(401).json({
            error: "AuthenticationError",
            message: "Authentication required",
        });
    }
    if (!req.isAdmin) {
        return res.status(403).json({
            error: "PermissionDenied",
            message: "This action is restricted to platform admins.",
        });
    }
    next();
}
//# sourceMappingURL=auth.js.map