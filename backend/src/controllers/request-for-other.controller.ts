import type { Response } from "express";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createRequestForOtherSchema,
  buildValidationError,
} from "../validators/request.validator.js";
import { sendSMS } from "../services/sms.service.js";

/**
 * Requests a customer submits on behalf of a family member or dependent.
 *
 * The applicant stays the signed-in user — they are the account the office
 * corresponds with — while the dependent is recorded on the row itself
 * (`name`, `phoneNumber`, `relationship`). Ordinary self-requests live in the
 * `request` table and are handled by request.controller.ts.
 */

const requestForOtherInclude = {
  user: {
    select: { id: true, username: true, name: true, phoneNumber: true },
  },
  service: {
    select: {
      id: true,
      name: true,
      officeId: true,
      office: { select: { id: true, name: true } },
    },
  },
  fileData: {
    select: { id: true, name: true, filepath: true, description: true },
  },
} as const;

type RequestForOtherRecord = Awaited<
  ReturnType<typeof findRequestForOther>
>;

async function findRequestForOther(id: string) {
  return prisma.requestForOther.findUnique({
    where: { id },
    include: requestForOtherInclude,
  });
}

async function getUserRole(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  return user?.role?.name?.toLowerCase() || "";
}

/** Shapes a row for the API, keeping the beneficiary grouped and obvious. */
function formatRequestForOther(row: NonNullable<RequestForOtherRecord>) {
  return {
    id: row.id,
    // Marks the row as a dependent request wherever the two kinds are mixed.
    beneficiaryType: "other" as const,
    beneficiary: {
      name: row.name,
      phoneNumber: row.phoneNumber,
      relationship: row.relationship,
    },
    currentAddress: row.currentAddress,
    date: row.date,
    status: row.status,
    applicant: row.user,
    service: row.service,
    officeId: row.officeId,
    files: row.fileData,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * POST /requests/for-other
 * Submit a request on behalf of a family member.
 */
export async function createRequestForOther(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized" });
    }

    const validation = createRequestForOtherSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    const {
      serviceId,
      currentAddress,
      date,
      name,
      phoneNumber,
      relationship,
      notes,
      files,
    } = validation.data;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { office: { select: { id: true, name: true } } },
    });

    if (!service) {
      return res
        .status(404)
        .json({ success: false, error: "Service not found" });
    }

    const created = await prisma.requestForOther.create({
      data: {
        userId,
        serviceId,
        // Denormalised so the office can filter and count without joining
        // through the service on every read, as `request` already does.
        officeId: service.officeId,
        currentAddress,
        name,
        phoneNumber,
        relationship,
        date: new Date(date),
        status: "pending",
        ...(files.length > 0
          ? {
              fileData: {
                create: files.map((file) => ({
                  name: file.name,
                  filepath: file.filepath,
                  description: file.description || notes || null,
                })),
              },
            }
          : {}),
      },
      include: requestForOtherInclude,
    });

    // Fire-and-forget: the row is saved, and a slow SMS gateway must never turn
    // a successful application into an error.
    if (created.user.phoneNumber) {
      const message =
        `Dear ${created.user.name ?? created.user.username},\n\n` +
        `Your application for "${service.name}" at ${service.office.name} ` +
        `on behalf of ${name} (${relationship}) has been received ` +
        `and is now under review.`;
      sendSMS(created.user.phoneNumber, message).catch((error) =>
        console.error("SMS to applicant failed:", error),
      );
    }

    return res.status(201).json({
      success: true,
      data: formatRequestForOther(created),
      message: "Request submitted on behalf of the family member",
    });
  } catch (error: any) {
    console.error("❌ Error creating request for other:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to submit the request",
    });
  }
}

/**
 * GET /requests/for-other
 * Scoped the same way as ordinary requests: a customer sees the ones they
 * submitted, office roles see the ones belonging to their office.
 */
export async function listRequestsForOther(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = (req.query.search as string) || "";

    const roleName = await getUserRole(userId);
    const isAdmin = ["admin", "administrator"].includes(roleName);

    const where: any = {};

    if (!isAdmin) {
      const staff = await prisma.staff.findFirst({
        where: { userId },
        select: { officeId: true },
      });

      // An office member sees their office's rows; everyone else sees only
      // what they submitted themselves.
      if (staff?.officeId && roleName !== "customer") {
        where.officeId = staff.officeId;
      } else {
        where.userId = userId;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phoneNumber: { contains: search } },
        { currentAddress: { contains: search } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.requestForOther.findMany({
        where,
        include: requestForOtherInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.requestForOther.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: rows.map(formatRequestForOther),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error("❌ Error listing requests for other:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to load requests",
    });
  }
}

/**
 * GET /requests/for-other/:id
 */
export async function getRequestForOther(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized" });
    }

    const row = await findRequestForOther(req.params.id as string);
    if (!row) {
      return res
        .status(404)
        .json({ success: false, error: "Request not found" });
    }

    const roleName = await getUserRole(userId);
    const isAdmin = ["admin", "administrator"].includes(roleName);

    if (!isAdmin && row.userId !== userId) {
      // Not the applicant — allow it only for someone in the owning office.
      const staff = await prisma.staff.findFirst({
        where: { userId },
        select: { officeId: true },
      });
      const sameOffice =
        roleName !== "customer" &&
        Boolean(staff?.officeId) &&
        staff?.officeId === row.officeId;

      if (!sameOffice) {
        return res.status(403).json({
          success: false,
          error: "You do not have access to this request",
        });
      }
    }

    return res
      .status(200)
      .json({ success: true, data: formatRequestForOther(row) });
  } catch (error: any) {
    console.error("❌ Error loading request for other:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to load the request",
    });
  }
}
