import type { Response } from "express";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";
import { dispatch } from "../services/notification.service.js";
import { notifyReportSent } from "../services/notification-events.js";

function qs(value: unknown): string | undefined {
  const str = typeof value === "string" ? value.trim() : undefined;
  return str || undefined;
}

function normalizeRole(roleName?: string | null): string {
  return roleName?.trim().toUpperCase() ?? "";
}

const ADMIN_ROLE_NAMES = [
  "ADMIN",
  "ADMINISTRATOR",
  "SUPERADMIN",
  "SYSTEM_ADMIN",
];

const MANAGER_ROLE_NAMES = ["MANAGER"];

const VALID_STATUSES = [
  "pending",
  "sent",
  "received",
  "read",
  "archived",
  "approved",
  "rejected",
] as const;

const reportInclude = {
  reportSentByUser: {
    select: {
      id: true,
      username: true,
      phoneNumber: true,
      role: { select: { name: true } },
      staff: {
        take: 1,
        select: {
          office: { select: { id: true, name: true } },
        },
      },
    },
  },
  reportSentToUser: {
    select: {
      id: true,
      username: true,
      phoneNumber: true,
      role: { select: { name: true } },
    },
  },
  fileData: {
    select: { id: true, name: true, filepath: true },
  },
} as const;

function formatReport(report: any) {
  const office = report.reportSentByUser?.staff?.office ?? null;
  return {
    id: report.id,
    name: report.name,
    description: report.description,
    reportSentTo: report.reportSentTo,
    reportSentBy: report.reportSentBy,
    receiverStatus: report.receiverStatus,
    sender: report.reportSentByUser
      ? {
          id: report.reportSentByUser.id,
          username: report.reportSentByUser.username,
          phoneNumber: report.reportSentByUser.phoneNumber,
          role: report.reportSentByUser.role?.name ?? null,
        }
      : null,
    receiver: report.reportSentToUser
      ? {
          id: report.reportSentToUser.id,
          username: report.reportSentToUser.username,
          phoneNumber: report.reportSentToUser.phoneNumber,
          role: report.reportSentToUser.role?.name ?? null,
        }
      : null,
    office,
    files: report.fileData ?? [],
    filesCount: report.fileData?.length ?? 0,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

async function getStaffOfficeId(userId: string): Promise<string | null> {
  const staff = await prisma.staff.findFirst({
    where: { userId },
    select: { officeId: true },
  });
  return staff?.officeId ?? null;
}

async function validateReportRecipient(
  senderId: string,
  recipientId: string,
  isAdmin: boolean,
  isManager: boolean,
  isStaff: boolean,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const [sender, recipient] = await Promise.all([
    prisma.user.findUnique({
      where: { id: senderId },
      select: {
        id: true,
        role: { select: { name: true } },
        staff: { select: { officeId: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        role: { select: { name: true } },
        staff: { select: { officeId: true } },
      },
    }),
  ]);

  if (!sender || !recipient) {
    return { ok: false, status: 404, error: "Sender or recipient not found" };
  }

  const recipientRole = normalizeRole(recipient.role?.name);

  if (isStaff) {
    if (!MANAGER_ROLE_NAMES.includes(recipientRole)) {
      return {
        ok: false,
        status: 400,
        error: "Staff reports must be sent to a manager.",
      };
    }
    const senderOfficeId = sender.staff?.officeId;
    const recipientOfficeId = recipient.staff?.officeId;
    if (!senderOfficeId || senderOfficeId !== recipientOfficeId) {
      return {
        ok: false,
        status: 403,
        error: "You can only send reports to a manager in your office.",
      };
    }
    return { ok: true };
  }

  if (isManager || (!isAdmin && normalizeRole(sender.role?.name) === "MANAGER")) {
    if (!ADMIN_ROLE_NAMES.includes(recipientRole)) {
      return {
        ok: false,
        status: 400,
        error: "Monthly reports must be sent to an administrator.",
      };
    }
    return { ok: true };
  }

  if (isAdmin) {
    return { ok: true };
  }

  return { ok: false, status: 403, error: "You are not allowed to submit reports." };
}

export async function listReports(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10) || 1);
    const pageSize = Math.min(
      100,
      parseInt((req.query.pageSize as string) || "10", 10) || 10,
    );
    const skip = (page - 1) * pageSize;

    const search = qs(req.query.search);
    const officeId = qs(req.query.officeId);
    const status = qs(req.query.status);
    const monthStr = qs(req.query.month);
    const yearStr = qs(req.query.year);
    const scope = qs(req.query.scope) ?? "inbox";

    let where: Record<string, unknown> = {};

    if (scope === "sent") {
      where.reportSentBy = userId;
    } else if (scope === "inbox") {
      where.reportSentTo = userId;
    } else if (scope === "all" && req.isAdmin) {
      where = {};
    } else if (req.isAdmin) {
      where.reportSentTo = userId;
    } else if (req.isManager) {
      where.reportSentTo = userId;
    } else {
      where.reportSentBy = userId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { reportSentByUser: { username: { contains: search } } },
        { reportSentToUser: { username: { contains: search } } },
      ];
    }

    if (status) {
      where.receiverStatus = status;
    }

    if (officeId) {
      where.reportSentByUser = {
        staff: { officeId },
      };
    }

    if (monthStr || yearStr) {
      const now = new Date();
      const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
      const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
      const from = new Date(year, month - 1, 1);
      const to = new Date(year, month, 1);
      where.createdAt = { gte: from, lt: to };
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: reportInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.report.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: reports.map(formatReport),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching reports:", error);
    return res.status(500).json({
      success: false,
      error: error.message ?? "Failed to fetch reports",
    });
  }
}

export async function createReport(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const name = qs(req.body?.name);
    const description = qs(req.body?.description);
    const reportSentTo = qs(req.body?.reportSentTo);
    const files = Array.isArray(req.body?.files) ? req.body.files : [];

    if (!name || !description || !reportSentTo) {
      return res.status(400).json({
        success: false,
        error: "name, description, and reportSentTo are required",
      });
    }

    if (description.length > 500) {
      return res.status(400).json({
        success: false,
        error: "Description must be 500 characters or fewer",
      });
    }

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "A PDF report file is required",
      });
    }

    const pdfFile = files[0];
    const filepath =
      typeof pdfFile?.filepath === "string" ? pdfFile.filepath.trim() : "";
    const fileName =
      typeof pdfFile?.name === "string" ? pdfFile.name.trim() : "";

    if (!filepath || !fileName) {
      return res.status(400).json({
        success: false,
        error: "Invalid file attachment",
      });
    }

    if (!filepath.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({
        success: false,
        error: "Only PDF files are allowed for reports",
      });
    }

    const validation = await validateReportRecipient(
      userId,
      reportSentTo,
      req.isAdmin === true,
      req.isManager === true,
      req.isStaff === true,
    );
    if (!validation.ok) {
      return res.status(validation.status).json({
        success: false,
        error: validation.error,
      });
    }

    const report = await prisma.report.create({
      data: {
        name,
        description,
        reportSentTo,
        reportSentBy: userId,
        receiverStatus: "pending",
        fileData: {
          create: {
            name: fileName,
            filepath,
            description: description.slice(0, 255),
          },
        },
      },
      include: reportInclude,
    });

    // A report sits unread until someone is told it arrived.
    dispatch(
      notifyReportSent({
        reportId: report.id,
        recipientUserId: reportSentTo,
        senderName: report.reportSentByUser.username,
        reportName: report.name,
      }),
    );

    return res.status(201).json({
      success: true,
      data: formatReport(report),
      message: "Report submitted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error creating report:", error);
    return res.status(500).json({
      success: false,
      error: error.message ?? "Failed to create report",
    });
  }
}

export async function getReport(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const id = req.params["id"] as string;
    const report = await prisma.report.findUnique({
      where: { id },
      include: reportInclude,
    });

    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }

    if (
      !req.isAdmin &&
      report.reportSentBy !== userId &&
      report.reportSentTo !== userId
    ) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    if (
      report.reportSentTo === userId &&
      (report.receiverStatus === "pending" || report.receiverStatus === "sent")
    ) {
      await prisma.report.update({
        where: { id: report.id },
        data: { receiverStatus: "read" },
      });
      (report as any).receiverStatus = "read";
    }

    return res.status(200).json({ success: true, data: formatReport(report) });
  } catch (error: any) {
    console.error("❌ Error fetching report:", error);
    return res.status(500).json({
      success: false,
      error: error.message ?? "Failed to fetch report",
    });
  }
}

export async function updateReportStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const id = req.params["id"] as string;
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }

    if (!req.isAdmin && report.reportSentTo !== userId) {
      return res.status(403).json({
        success: false,
        error: "Only the recipient can review this report",
      });
    }

    const status = qs(req.body?.status);
    if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    if (
      (status === "approved" || status === "rejected") &&
      !["pending", "sent", "read"].includes(report.receiverStatus)
    ) {
      return res.status(400).json({
        success: false,
        error: "This report has already been reviewed.",
      });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: { receiverStatus: status as (typeof VALID_STATUSES)[number] },
      include: reportInclude,
    });

    return res.status(200).json({ success: true, data: formatReport(updated) });
  } catch (error: any) {
    console.error("❌ Error updating report status:", error);
    return res.status(500).json({
      success: false,
      error: error.message ?? "Failed to update status",
    });
  }
}

export async function deleteReport(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const id = req.params["id"] as string;
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }

    if (!req.isAdmin && report.reportSentBy !== userId) {
      return res.status(403).json({
        success: false,
        error: "Only the sender or admin can delete this report",
      });
    }

    if (
      !req.isAdmin &&
      ["approved", "rejected", "archived"].includes(report.receiverStatus)
    ) {
      return res.status(400).json({
        success: false,
        error: "Reviewed reports cannot be deleted",
      });
    }

    await prisma.report.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting report:", error);
    return res.status(500).json({
      success: false,
      error: error.message ?? "Failed to delete report",
    });
  }
}

export async function getAdminUsers(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const admins = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          name: { in: ADMIN_ROLE_NAMES },
        },
      },
      select: { id: true, username: true, phoneNumber: true },
      orderBy: { username: "asc" },
    });

    return res.status(200).json({ success: true, data: admins });
  } catch (error: any) {
    console.error("❌ Error fetching admin users:", error);
    return res.status(500).json({
      success: false,
      error: error.message ?? "Failed to fetch admin users",
    });
  }
}

export async function getManagerUsers(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const officeId = await getStaffOfficeId(userId);
    if (!officeId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const managers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: { in: MANAGER_ROLE_NAMES } },
        staff: { officeId },
      },
      select: { id: true, username: true, phoneNumber: true },
      orderBy: { username: "asc" },
    });

    return res.status(200).json({ success: true, data: managers });
  } catch (error: any) {
    console.error("❌ Error fetching manager users:", error);
    return res.status(500).json({
      success: false,
      error: error.message ?? "Failed to fetch manager users",
    });
  }
}
