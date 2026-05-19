import type { Request } from "express";

import { prisma } from "./db.js";

const LAST_SEEN_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

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
  createdAt: true,
  updatedAt: true,
} as const;

export type AuthSessionRecord = Awaited<
  ReturnType<typeof createAuthSession>
>;

function getSingleHeaderValue(
  headerValue: string | string[] | undefined,
): string | null {
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

function detectBrowser(userAgent: string | null): string | null {
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

function detectOperatingSystem(userAgent: string | null): string | null {
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

function detectDeviceType(userAgent: string | null): string | null {
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

function buildDeviceName(
  browser: string | null,
  operatingSystem: string | null,
  deviceType: string | null,
): string | null {
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

export function getClientIpAddress(req: Request): string | null {
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

function buildSessionMetadata(req: Request) {
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

export async function createAuthSession(userId: string, req: Request) {
  return prisma.session.create({
    data: {
      userId,
      ...buildSessionMetadata(req),
      lastSeenAt: new Date(),
    },
    select: authSessionSelect,
  });
}

export async function deleteAuthSession(
  sessionId: string,
  userId?: string,
): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      id: sessionId,
      ...(userId ? { userId } : {}),
    },
  });

  return result.count;
}

export async function listUserAuthSessions(userId: string) {
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

export async function revokeOtherUserSessions(
  userId: string,
  currentSessionId?: string,
): Promise<void> {
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

export async function touchAuthSession(
  sessionId: string,
  lastSeenAt: Date,
): Promise<void> {
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

export function serializeAuthSession(session: {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  operatingSystem: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
} | null | undefined, currentSessionId?: string) {
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
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    ...(currentSessionId ? { isCurrent: session.id === currentSessionId } : {}),
  };
}
