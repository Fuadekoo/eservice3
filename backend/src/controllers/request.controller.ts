import type { Response } from "express";
import { randomUUID } from "crypto";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createRequestSchema,
  updateRequestSchema,
  approveRequestByStaffSchema,
  approveRequestByAdminSchema,
  rejectRequestSchema,
  buildValidationError,
} from "../validators/request.validator.js";
import {
  generateRequestNumber,
  sendSMS,
  sendEmail,
} from "../utils/notification.js";

/**
 * Request response include configuration
 */
const requestInclude = {
  user: {
    select: {
      id: true,
      username: true,
      phoneNumber: true,
    },
  },
  service: {
    include: {
      office: {
        select: {
          id: true,
          name: true,
          roomNumber: true,
          address: true,
          status: true,
        },
      },
    },
  },
  approveStaff: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          phoneNumber: true,
        },
      },
    },
  },
  approveManager: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          phoneNumber: true,
        },
      },
    },
  },
  fileData: true,
  appointments: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          phoneNumber: true,
        },
      },
      approveStaff: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  },
  customerSatisfaction: {
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

/**
 * Format request response with ISO date strings
 */
function formatRequest(req: any) {
  return {
    ...req,
    date: req.date.toISOString(),
    createdAt: req.createdAt.toISOString(),
    updatedAt: req.updatedAt.toISOString(),
    fileData:
      req.fileData?.map((file: any) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })) || [],
    appointments:
      req.appointments?.map((apt: any) => ({
        ...apt,
        date: apt.date.toISOString(),
        createdAt: apt.createdAt.toISOString(),
        updatedAt: apt.updatedAt.toISOString(),
      })) || [],
  };
}

/**
 * Get user role
 */
async function getUserRole(userId: string): Promise<string> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  return dbUser?.role?.name?.toLowerCase() || "";
}

/**
 * Get manager's office
 */
async function getManagerOffice(userId: string): Promise<string | null> {
  const staff = await prisma.staff.findFirst({
    where: { userId },
    select: { officeId: true },
  });
  return staff?.officeId || null;
}

/**
 * Get staff record
 */
async function getStaffRecord(userId: string): Promise<{ id: string } | null> {
  return prisma.staff.findFirst({
    where: { userId },
    select: { id: true },
  });
}

/**
 * GET - List all requests (role-based access)
 */
export async function listRequests(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = (req.query.search as string) || "";
    const officeId = (req.query.officeId as string) || "";
    const status = (req.query.status as string) || "";

    const roleName = await getUserRole(userId);
    const isAdmin = ["admin", "administrator"].includes(roleName);
    const isManager = roleName === "manager";
    const isStaff = roleName === "staff";
    const isCustomer = roleName === "customer";

    let where: any = {};

    // Build where clause based on role
    if (isCustomer) {
      where.userId = userId;
    } else if (isManager) {
      const managerOfficeId = await getManagerOffice(userId);
      if (!managerOfficeId) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { page, pageSize, total: 0, totalPages: 0 },
        });
      }
      where.service = { officeId: managerOfficeId };
    } else if (isStaff) {
      const staffRecord = await getStaffRecord(userId);
      if (!staffRecord) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { page, pageSize, total: 0, totalPages: 0 },
        });
      }

      const assignedServices = await prisma.serviceStaffAssignment.findMany({
        where: { staffId: staffRecord.id },
        select: { serviceId: true },
      });

      const serviceIds = assignedServices.map((a) => a.serviceId);
      if (serviceIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { page, pageSize, total: 0, totalPages: 0 },
        });
      }

      where.serviceId = { in: serviceIds };
    }

    // Office filter (admin only)
    if (isAdmin && officeId) {
      where.service = { officeId };
    }

    // Status filter
    if (status) {
      if (status === "pending") {
        where.OR = [{ statusbystaff: "pending" }, { statusbyadmin: "pending" }];
      } else {
        where.AND = [{ statusbystaff: status }, { statusbyadmin: status }];
      }
    }

    // Search filter
    if (search) {
      const searchConditions = {
        OR: [
          {
            service: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            service: {
              office: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          },
          {
            user: {
              username: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            currentAddress: { contains: search, mode: "insensitive" as const },
          },
        ],
      };

      if (where.OR || where.AND) {
        where.AND = [where, searchConditions];
      } else {
        where.OR = searchConditions.OR;
      }
    }

    // Get total count
    const total = await prisma.request.count({ where });

    // Fetch requests
    const requests = await prisma.request.findMany({
      where,
      include: requestInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return res.status(200).json({
      success: true,
      data: requests.map(formatRequest),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching requests:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch requests",
    });
  }
}

/**
 * GET - Get a specific request
 */
export async function getRequest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const requestId = req.params.id as string;

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: requestInclude,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    // Check authorization
    const roleName = await getUserRole(userId);
    const isAdmin = ["admin", "administrator"].includes(roleName);

    if (!isAdmin && request.userId !== userId) {
      const isManager = roleName === "manager";
      if (isManager) {
        const managerOfficeId = await getManagerOffice(userId);
        if (request.service.officeId !== managerOfficeId) {
          return res.status(403).json({
            success: false,
            error: "Unauthorized",
          });
        }
      } else if (roleName === "staff") {
        const staffRecord = await getStaffRecord(userId);
        if (!staffRecord) {
          return res.status(403).json({
            success: false,
            error: "Unauthorized",
          });
        }

        const assignedServices = await prisma.serviceStaffAssignment.findMany({
          where: { staffId: staffRecord.id },
          select: { serviceId: true },
        });

        const serviceIds = assignedServices.map((a) => a.serviceId);
        if (!serviceIds.includes(request.serviceId)) {
          return res.status(403).json({
            success: false,
            error: "Unauthorized",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          error: "Unauthorized",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: formatRequest(request),
    });
  } catch (error: any) {
    console.error("❌ Error fetching request:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch request",
    });
  }
}

/**
 * POST - Create a new request
 */
export async function createRequest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Validate request body
    const validation = createRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    const { serviceId, currentAddress, date, notes, files } = validation.data;

    // Verify service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { office: true },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: "Service not found",
      });
    }

    // Generate request number
    const requestNumber = await generateRequestNumber();

    // Create request
    const newRequest = await prisma.request.create({
      data: {
        id: randomUUID(),
        userId,
        serviceId,
        currentAddress,
        date: new Date(date),
        statusbystaff: "pending",
        statusbyadmin: "pending",
        ...(files.length > 0
          ? {
              fileData: {
                create: files.map((file) => ({
                  id: randomUUID(),
                  name: file.name,
                  filepath: file.filepath,
                  description: file.description || notes || null,
                })),
              },
            }
          : {}),
      },
      include: requestInclude,
    });

    console.log(`✅ Created request: ${newRequest.id} (${requestNumber})`);

    // Send notifications to assigned staff
    try {
      const assignedStaff = await prisma.serviceStaffAssignment.findMany({
        where: { serviceId },
        include: {
          staff: {
            include: {
              user: {
                select: {
                  id: true,
                  phoneNumber: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      for (const assignment of assignedStaff) {
        const staffPhone = assignment.staff.user.phoneNumber;
        if (!staffPhone) continue;

        const staffMessage = `📋 New Service Request

Service: ${service.name}
Customer: ${newRequest.user.username}
Phone: ${newRequest.user.phoneNumber}
Address: ${currentAddress}
Date: ${new Date(date).toLocaleDateString()}
Request #: ${requestNumber}

Office: ${service.office.name}
Room: ${service.office.roomNumber}

Please check the dashboard to review and process this request.`;

        try {
          await sendSMS(staffPhone, staffMessage);
          console.log(`✅ SMS sent to staff: ${staffPhone}`);
        } catch (error: any) {
          console.error(`⚠️ Failed to send SMS to ${staffPhone}:`, error);
        }
      }
    } catch (notificationError: any) {
      console.error("⚠️ Failed to send notifications:", notificationError);
    }

    return res.status(201).json({
      success: true,
      data: {
        ...formatRequest(newRequest),
        requestNumber,
      },
      message: "Request created successfully",
    });
  } catch (error: any) {
    console.error("❌ Error creating request:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create request",
    });
  }
}

/**
 * PATCH - Update a request
 */
export async function updateRequest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const requestId = req.params.id as string;

    // Validate request body
    const validation = updateRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    // Get existing request
    const existingRequest = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    // Check authorization (only customer or admin)
    const roleName = await getUserRole(userId);
    const isAdmin = ["admin", "administrator"].includes(roleName);

    if (!isAdmin && existingRequest.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Prevent updates if already approved or completed
    if (
      existingRequest.statusbystaff === "approved" &&
      existingRequest.statusbyadmin === "approved"
    ) {
      return res.status(400).json({
        success: false,
        error: "Cannot update approved request",
      });
    }

    const { currentAddress, date } = validation.data;
    const updateData: any = {};

    if (currentAddress) updateData.currentAddress = currentAddress;
    if (date) updateData.date = new Date(date);

    // Update request
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: updateData,
      include: requestInclude,
    });

    return res.status(200).json({
      success: true,
      data: formatRequest(updatedRequest),
      message: "Request updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Error updating request:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to update request",
    });
  }
}

/**
 * PATCH - Approve request by staff
 */
export async function approveRequestByStaff(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const requestId = req.params.id as string;

    // Validate request body
    const validation = approveRequestByStaffSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    const { staffId, notes } = validation.data;

    // Get existing request
    const existingRequest = await prisma.request.findUnique({
      where: { id: requestId },
      include: { user: { select: { phoneNumber: true } } },
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    // Verify staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: { select: { phoneNumber: true, username: true } } },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: "Staff not found",
      });
    }

    // Update request
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        statusbystaff: "approved",
        approveStaffId: staffId,
      },
      include: requestInclude,
    });

    // Send SMS to customer
    if (existingRequest.user?.phoneNumber) {
      try {
        const customerMessage = `✅ Your service request has been approved by ${staff.user.username}.
        
It will be reviewed by the manager.
${notes ? `Note: ${notes}` : ""}`;

        await sendSMS(existingRequest.user.phoneNumber, customerMessage);
        console.log(`✅ Customer SMS sent`);
      } catch (error: any) {
        console.error("⚠️ Failed to send customer SMS:", error);
      }
    }

    return res.status(200).json({
      success: true,
      data: formatRequest(updatedRequest),
      message: "Request approved by staff successfully",
    });
  } catch (error: any) {
    console.error("❌ Error approving request:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to approve request",
    });
  }
}

/**
 * PATCH - Approve request by admin/manager
 */
export async function approveRequestByAdmin(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const requestId = req.params.id as string;

    // Validate request body
    const validation = approveRequestByAdminSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    const { approverId, notes } = validation.data;

    // Get existing request
    const existingRequest = await prisma.request.findUnique({
      where: { id: requestId },
      include: { user: { select: { phoneNumber: true } } },
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    // Verify approver exists (staff)
    const approver = await prisma.staff.findUnique({
      where: { id: approverId },
      include: { user: { select: { phoneNumber: true, username: true } } },
    });

    if (!approver) {
      return res.status(404).json({
        success: false,
        error: "Approver not found",
      });
    }

    // Update request
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        statusbyadmin: "approved",
        approveManagerId: approverId,
      },
      include: requestInclude,
    });

    // Send SMS to customer
    if (existingRequest.user?.phoneNumber) {
      try {
        const customerMessage = `✅ Your service request has been fully approved by ${approver.user.username}.

You will receive further updates soon.
${notes ? `Note: ${notes}` : ""}`;

        await sendSMS(existingRequest.user.phoneNumber, customerMessage);
        console.log(`✅ Customer approval SMS sent`);
      } catch (error: any) {
        console.error("⚠️ Failed to send approval SMS:", error);
      }
    }

    return res.status(200).json({
      success: true,
      data: formatRequest(updatedRequest),
      message: "Request approved by admin successfully",
    });
  } catch (error: any) {
    console.error("❌ Error approving request by admin:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to approve request",
    });
  }
}

/**
 * PATCH - Reject a request
 */
export async function rejectRequest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const requestId = req.params.id as string;

    // Validate request body
    const validation = rejectRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    const { rejectionReason } = validation.data;

    // Get existing request
    const existingRequest = await prisma.request.findUnique({
      where: { id: requestId },
      include: { user: { select: { phoneNumber: true } } },
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    // Update request
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        statusbystaff: "rejected",
        statusbyadmin: "rejected",
      },
      include: requestInclude,
    });

    // Send SMS to customer
    if (existingRequest.user?.phoneNumber) {
      try {
        const customerMessage = `❌ Your service request has been rejected.

Reason: ${rejectionReason}

Please contact us for more information.`;

        await sendSMS(existingRequest.user.phoneNumber, customerMessage);
        console.log(`✅ Rejection SMS sent to customer`);
      } catch (error: any) {
        console.error("⚠️ Failed to send rejection SMS:", error);
      }
    }

    return res.status(200).json({
      success: true,
      data: formatRequest(updatedRequest),
      message: "Request rejected successfully",
    });
  } catch (error: any) {
    console.error("❌ Error rejecting request:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to reject request",
    });
  }
}

/**
 * DELETE - Delete a request
 */
export async function deleteRequest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const requestId = req.params.id as string;

    // Get existing request
    const existingRequest = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    // Check authorization (only customer or admin)
    const roleName = await getUserRole(userId);
    const isAdmin = ["admin", "administrator"].includes(roleName);

    if (!isAdmin && existingRequest.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Prevent deletion if approved
    if (
      existingRequest.statusbystaff === "approved" ||
      existingRequest.statusbyadmin === "approved"
    ) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete approved request",
      });
    }

    // Delete related fileData first
    await prisma.fileData.deleteMany({
      where: { requestId },
    });

    // Delete the request
    await prisma.request.delete({
      where: { id: requestId },
    });

    return res.status(200).json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting request:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to delete request",
    });
  }
}
