import type { Response } from "express";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";

function qs(value: unknown): string | undefined {
  const str = typeof value === "string" ? value.trim() : undefined;
  return str || undefined;
}

const reportInclude = {
  reportSentByUser: {
    select: {
      id: true,
      username: true,
      phoneNumber: true,
      staffs: {
        take: 1,
        select: {
          office: { select: { id: true, name: true } },
        },
      },
    },
  },
  reportSentToUser: {
    select: { id: true, username: true, phoneNumber: true },
  },
  fileData: {
    select: { id: true, name: true, filepath: true },
  },
} as const;

function formatReport(report: any) {
  const office = report.reportSentByUser?.staffs?.[0]?.office ?? null;
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
        }
      : null,
    receiver: report.reportSentToUser ?? null,
    office,
    files: report.fileData ?? [],
    filesCount: report.fileData?.length ?? 0,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export async function listReports(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10) || 1);
    const pageSize = Math.min(100, parseInt((req.query.pageSize as string) || "10", 10) || 10);
    const skip = (page - 1) * pageSize;

    const search = qs(req.query.search);
    const officeId = qs(req.query.officeId);
    const status = qs(req.query.status);
    const monthStr = qs(req.query.month);
    const yearStr = qs(req.query.year);

    const where: any = req.isAdmin ? {} : { reportSentBy: userId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { reportSentByUser: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.receiverStatus = status;
    }

    if (officeId) {
      where.reportSentByUser = {
        staffs: { some: { officeId } },
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
    return res.status(500).json({ success: false, error: error.message ?? "Failed to fetch reports" });
  }
}

export async function createReport(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const name = qs(req.body?.name);
    const description = qs(req.body?.description);
    const reportSentTo = qs(req.body?.reportSentTo);

    if (!name || !description || !reportSentTo) {
      return res.status(400).json({
        success: false,
        error: "name, description, and reportSentTo are required",
      });
    }

    const recipient = await prisma.user.findUnique({ where: { id: reportSentTo } });
    if (!recipient) {
      return res.status(404).json({ success: false, error: "Recipient user not found" });
    }

    const report = await prisma.report.create({
      data: {
        name,
        description,
        reportSentTo,
        reportSentBy: userId,
        receiverStatus: "sent",
      },
      include: reportInclude,
    });

    return res.status(201).json({
      success: true,
      data: formatReport(report),
      message: "Report submitted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error creating report:", error);
    return res.status(500).json({ success: false, error: error.message ?? "Failed to create report" });
  }
}

export async function getReport(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const id = req.params["id"] as string;
    const report = await prisma.report.findUnique({
      where: { id },
      include: reportInclude,
    });

    if (!report) return res.status(404).json({ success: false, error: "Report not found" });

    if (!req.isAdmin && report.reportSentBy !== userId && report.reportSentTo !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    if (
      (req.isAdmin || report.reportSentTo === userId) &&
      report.receiverStatus === "sent"
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
    return res.status(500).json({ success: false, error: error.message ?? "Failed to fetch report" });
  }
}

export async function updateReportStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const id = req.params["id"] as string;
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return res.status(404).json({ success: false, error: "Report not found" });

    if (!req.isAdmin && report.reportSentTo !== userId) {
      return res.status(403).json({ success: false, error: "Only the recipient or admin can update the status" });
    }

    const status = qs(req.body?.status);
    const validStatuses = ["pending", "sent", "received", "read", "archived"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: { receiverStatus: status as any },
      include: reportInclude,
    });

    return res.status(200).json({ success: true, data: formatReport(updated) });
  } catch (error: any) {
    console.error("❌ Error updating report status:", error);
    return res.status(500).json({ success: false, error: error.message ?? "Failed to update status" });
  }
}

export async function deleteReport(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const id = req.params["id"] as string;
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return res.status(404).json({ success: false, error: "Report not found" });

    if (!req.isAdmin && report.reportSentBy !== userId) {
      return res.status(403).json({ success: false, error: "Only the sender or admin can delete this report" });
    }

    await prisma.report.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Report deleted successfully" });
  } catch (error: any) {
    console.error("❌ Error deleting report:", error);
    return res.status(500).json({ success: false, error: error.message ?? "Failed to delete report" });
  }
}

export async function getAdminUsers(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const admins = await prisma.user.findMany({
      where: {
        role: {
          name: {
            in: ["ADMIN", "Admin", "admin", "ADMINISTRATOR", "Administrator", "SUPERADMIN"],
          },
        },
        isActive: true,
      },
      select: { id: true, username: true, phoneNumber: true },
      orderBy: { username: "asc" },
    });

    return res.status(200).json({ success: true, data: admins });
  } catch (error: any) {
    console.error("❌ Error fetching admin users:", error);
    return res.status(500).json({ success: false, error: error.message ?? "Failed to fetch admin users" });
  }
}
