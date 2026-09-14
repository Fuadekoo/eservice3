import { SESSION_IDLE_TIMEOUT_MS, sessionExpiryFrom, sessionExpiryReason, } from "../config/session.js";
import { prisma } from "./db.js";
/**
 * How stale `lastSeenAt` is allowed to get before a request writes it back.
 *
 * Every authenticated request would otherwise be a write. Kept well under the
 * idle timeout so an active session can never be cut off by its own
 * write-throttling — the guard below enforces that even if the two are
 * reconfigured apart.
 */
const LAST_SEEN_UPDATE_INTERVAL_MS = Math.min(5 * 60 * 1000, Math.max(30 * 1000, Math.floor(SESSION_IDLE_TIMEOUT_MS / 4)));
export const authSessionSelect = {
    id: true,
    userId: true,
    deviceName: true,
    deviceType: true,
    browser: true,
    operatingSystem: true,
    ipAddress: true,
    userAgent: true,
    lastSeenAt: true,
    expiresAt: true,
    createdAt: true,
    updatedAt: true,
};
function getSingleHeaderValue(headerValue) {
    if (typeof headerValue === "string") {
        const trimmed = headerValue.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    if (Array.isArray(headerValue)) {
        for (const value of headerValue) {
            const trimmed = value.trim();
            if (trimmed.length > 0) {
                return trimmed;
            }
        }
    }
    return null;
}
function detectBrowser(userAgent) {
    if (!userAgent) {
        return null;
    }
    if (/Edg\//i.test(userAgent)) {
        return "Edge";
    }
    if (/OPR\/|Opera/i.test(userAgent)) {
        return "Opera";
    }
    if (/Firefox\//i.test(userAgent)) {
        return "Firefox";
    }
    if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) {
        return "Chrome";
    }
    if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) {
        return "Safari";
    }
    if (/MSIE|Trident\//i.test(userAgent)) {
        return "Internet Explorer";
    }
    return null;
}
function detectOperatingSystem(userAgent) {
    if (!userAgent) {
        return null;
    }
    if (/Windows/i.test(userAgent)) {
        return "Windows";
    }
    if (/Android/i.test(userAgent)) {
        return "Android";
    }
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
        return "iOS";
    }
    if (/Mac OS X|Macintosh/i.test(userAgent)) {
        return "macOS";
    }
    if (/CrOS/i.test(userAgent)) {
        return "ChromeOS";
    }
    if (/Linux/i.test(userAgent)) {
        return "Linux";
    }
    return null;
}
function detectDeviceType(userAgent) {
    if (!userAgent) {
        return null;
    }
    if (/bot|crawler|spider|crawl/i.test(userAgent)) {
        return "bot";
    }
    if (/iPad|Tablet|Nexus 7|Nexus 10|KFAPWI/i.test(userAgent)) {
        return "tablet";
    }
    if (/Mobile|Android|iPhone|iPod/i.test(userAgent)) {
        return "mobile";
    }
    return "desktop";
}
function buildDeviceName(browser, operatingSystem, deviceType) {
    if (browser && operatingSystem) {
        return `${browser} on ${operatingSystem}`;
    }
    if (browser) {
        return browser;
    }
    if (operatingSystem) {
        return operatingSystem;
    }
    if (deviceType === "mobile") {
        return "Mobile device";
    }
    if (deviceType === "tablet") {
        return "Tablet";
    }
    if (deviceType === "desktop") {
        return "Desktop device";
    }
    if (deviceType === "bot") {
        return "Automated client";
    }
    return "Unknown device";
}
export function getClientIpAddress(req) {
    const forwardedFor = getSingleHeaderValue(req.headers["x-forwarded-for"]);
    if (forwardedFor) {
        const firstForwardedAddress = forwardedFor
            .split(",")
            .map((entry) => entry.trim())
            .find(Boolean);
        if (firstForwardedAddress) {
            return firstForwardedAddress;
        }
    }
    const realIp = getSingleHeaderValue(req.headers["x-real-ip"]);
    if (realIp) {
        return realIp;
    }
    const requestIp = req.ip?.trim();
    return requestIp ? requestIp : null;
}
function buildSessionMetadata(req) {
    const userAgent = getSingleHeaderValue(req.headers["user-agent"]);
    const browser = detectBrowser(userAgent);
    const operatingSystem = detectOperatingSystem(userAgent);
    const deviceType = detectDeviceType(userAgent);
    const ipAddress = getClientIpAddress(req);
    return {
        browser,
        deviceName: buildDeviceName(browser, operatingSystem, deviceType),
        deviceType,
        ipAddress,
        operatingSystem,
        userAgent,
    };
}
export async function createAuthSession(userId, req) {
    const now = new Date();
    return prisma.session.create({
        data: {
            userId,
            ...buildSessionMetadata(req),
            lastSeenAt: now,
            // The session's own deadline, matching the expiry baked into the token
            // handed out alongside it.
            expiresAt: sessionExpiryFrom(now),
        },
        select: authSessionSelect,
    });
}
/**
 * Remove every session that has passed its absolute deadline or been idle for
 * too long.
 *
 * Expiry is enforced on each request regardless — this only stops the table
 * growing without bound, and keeps the "active devices" list in Settings from
 * showing sessions that would be refused if anyone tried to use them.
 */
export async function deleteExpiredSessions(now = new Date()) {
    const idleCutoff = new Date(now.getTime() - SESSION_IDLE_TIMEOUT_MS);
    const result = await prisma.session.deleteMany({
        where: {
            OR: [
                { expiresAt: { lte: now } },
                // A row that predates the expiresAt column has no deadline of its own.
                { expiresAt: null },
                { lastSeenAt: { lt: idleCutoff } },
            ],
        },
    });
    return result.count;
}
export async function deleteAuthSession(sessionId, userId) {
    const result = await prisma.session.deleteMany({
        where: {
            id: sessionId,
            ...(userId ? { userId } : {}),
        },
    });
    return result.count;
}
export async function listUserAuthSessions(userId) {
    return prisma.session.findMany({
        where: {
            userId,
        },
        orderBy: [
            { lastSeenAt: "desc" },
            { createdAt: "desc" },
        ],
        select: authSessionSelect,
    });
}
export async function revokeOtherUserSessions(userId, currentSessionId) {
    await prisma.session.deleteMany({
        where: currentSessionId
            ? {
                userId,
                NOT: {
                    id: currentSessionId,
                },
            }
            : {
                userId,
            },
    });
}
/**
 * Whether this session may still be used, and why not when it may not.
 *
 * Re-exported from the config so callers have one import for "is this session
 * still good?" rather than reaching past this module for the rule.
 */
export const authSessionExpiryReason = sessionExpiryReason;
export async function touchAuthSession(sessionId, lastSeenAt) {
    if (Date.now() - lastSeenAt.getTime() < LAST_SEEN_UPDATE_INTERVAL_MS) {
        return;
    }
    await prisma.session
        .update({
        where: { id: sessionId },
        data: {
            lastSeenAt: new Date(),
        },
    })
        .catch(() => undefined);
}
export function serializeAuthSession(session, currentSessionId) {
    if (!session) {
        return null;
    }
    return {
        id: session.id,
        deviceName: session.deviceName,
        deviceType: session.deviceType,
        browser: session.browser,
        operatingSystem: session.operatingSystem,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        lastSeenAt: session.lastSeenAt.toISOString(),
        // Lets the browser show "your session ends at ..." and sign out cleanly
        // instead of discovering the expiry as a failed request.
        expiresAt: session.expiresAt ? session.expiresAt.toISOString() : null,
        idleTimeoutMs: SESSION_IDLE_TIMEOUT_MS,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        ...(currentSessionId ? { isCurrent: session.id === currentSessionId } : {}),
    };
}
//# sourceMappingURL=auth-session.js.map