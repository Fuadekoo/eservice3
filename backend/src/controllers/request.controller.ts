import type { Response } from "express";
import { randomUUID } from "crypto";
import { prisma } from "../lib/db.js";
import type { Prisma } from "../lib/prisma-client.js";
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
  isRequestNumber,
  normalizeRequestNumber,
} from "../utils/notification.js";
import { sendSMS } from "../services/sms.service.js";
import { dispatch } from "../services/notification.service.js";
import {
  notifyRequestApprovedByManager,
  notifyRequestApprovedByStaff,
  notifyRequestRejected,
  notifyRequestSubmitted,
} from "../services/notification-events.js";

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
 * Create a request, claiming the next free request number.
 *
 * `generateRequestNumber` allocates from an atomic per-day counter, so under
 * normal operation the number is already unique and this succeeds first time.
 * The retry exists for the one case the counter cannot cover: a number written
 * outside this path (a restored backup, a manual insert) occupying a slot the
 * counter has not passed yet. Retrying re-allocates rather than reusing, and is
 * bounded so an unrelated unique conflict cannot spin forever.
 */
const REQUEST_NUMBER_MAX_ATTEMPTS = 5;

function isRequestNumberConflict(error: unknown): boolean {
  if ((error as { code?: string } | null)?.code !== "P2002") return false;

  // Where the offending column is reported depends on the driver: the classic
  // engine fills `meta.target`, while the MariaDB adapter nests it under
  // `meta.driverAdapterError.cause` (constraint index / MySQL error 1062 text).
  // Scanning the whole `meta` payload keeps this working across both.
  const meta = (error as { meta?: unknown }).meta;
  if (!meta) return false;

  try {
    const seen = new WeakSet<object>();
    const described = JSON.stringify(meta, (_key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return undefined;
        seen.add(value);
      }
      return value instanceof Error ? value.message : value;
    });
    return described?.includes("requestNumber") ?? false;
  } catch {
    return false;
  }
}

async function createRequestWithNumber(
  data: Omit<Prisma.requestUncheckedCreateInput, "requestNumber">,
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < REQUEST_NUMBER_MAX_ATTEMPTS; attempt++) {
    const requestNumber = await generateRequestNumber();
    try {
      return await prisma.request.create({
        data: { ...data, requestNumber },
        include: requestInclude,
      });
    } catch (error) {
      if (!isRequestNumberConflict(error)) throw error;
      lastError = error;
      console.warn(
        `Request number ${requestNumber} was taken concurrently; retrying (${attempt + 1}/${REQUEST_NUMBER_MAX_ATTEMPTS})`,
      );
    }
  }

  throw lastError;
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
 * Get all managers for a given office
 */
async function getOfficeManagers(officeId: string) {
  return prisma.staff.findMany({
    where: {
      officeId,
      user: { role: { name: "manager" } },
    },
    include: {
      user: { select: { username: true, phoneNumber: true } },
    },
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
          // Listed first so quoting a reference number is the fastest path —
          // `contains` also matches a partial number like "00042".
          {
            requestNumber: { contains: search },
          },
          {
            service: {
              name: { contains: search },
            },
          },
          {
            service: {
              office: {
                name: { contains: search },
              },
            },
          },
          {
            user: {
              username: { contains: search },
            },
          },
          {
            currentAddress: { contains: search },
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

    // Accept either the internal id or the reference number the customer was
    // given, so a support agent can paste "REQ-20260825-00001" straight in.
    const identifier = (req.params.id as string) ?? "";

    const request = await prisma.request.findUnique({
      where: isRequestNumber(identifier)
        ? { requestNumber: normalizeRequestNumber(identifier) }
        : { id: identifier },
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

    // Create the request together with its reference number, so the number the
    // customer is told is the one stored on the row and can be searched for.
    const newRequest = await createRequestWithNumber({
      id: randomUUID(),
      userId,
      serviceId,
      // Denormalised so the office can be filtered and counted without joining
      // through the service on every read.
      officeId: service.officeId,
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
    });

    const requestNumber = newRequest.requestNumber;

    console.log(`✅ Created request: ${newRequest.id} (${requestNumber})`);

    // In-app + web push, to the customer, the assigned staff and the managers.
    // Fire-and-forget: the request is already saved, and a push service being
    // slow or down must never turn a successful application into an error.
    dispatch(
      notifyRequestSubmitted({
        requestId: newRequest.id,
        requestNumber,
        customerUserId: userId,
        customerName: newRequest.user.username,
        serviceId,
        serviceName: service.name,
        officeId: service.officeId,
        officeName: service.office.name,
        appointmentDate: date,
      }),
    );

    // Send notifications (fire-and-forget — never block the response)
    (async () => {
      try {
        const assignedStaff = await prisma.serviceStaffAssignment.findMany({
          where: { serviceId },
          include: {
            staff: {
              include: {
                user: { select: { id: true, phoneNumber: true, username: true } },
              },
            },
          },
        });

        const customerName = newRequest.user.username;
        const customerPhone = newRequest.user.phoneNumber ?? "N/A";
        const requestDate = new Date(date).toLocaleDateString("en-GB");

        // --- Confirm receipt to the customer ---
        if (newRequest.user.phoneNumber) {
          const customerMsg =
            `Dear ${customerName},\n\n` +
            `Thank you for applying for "${service.name}" at ${service.office.name}.\n\n` +
            `Your request has been received and is now under review. Please wait while our team processes it.\n\n` +
            `Request No: ${requestNumber}`;

          sendSMS(newRequest.user.phoneNumber, customerMsg).catch((e) =>
            console.error(
              `SMS to customer ${newRequest.user.phoneNumber} failed:`,
              e,
            ),
          );
        }

        // --- Notify each assigned staff ---
        for (const assignment of assignedStaff) {
          const staffPhone = assignment.staff.user.phoneNumber;
          if (!staffPhone) continue;

          const staffMsg =
            `New service request received.\n\n` +
            `Service: ${service.name}\n` +
            `Customer: ${customerName}\n` +
            `Phone: ${customerPhone}\n` +
            `Address: ${currentAddress}\n` +
            `Date: ${requestDate}\n` +
            `Request No: ${requestNumber}\n\n` +
            `Office: ${service.office.name} - Room ${service.office.roomNumber}\n\n` +
            `Please login to review and process this request.`;

          sendSMS(staffPhone, staffMsg).catch((e) =>
            console.error(`SMS to staff ${staffPhone} failed:`, e),
          );
        }

        // --- Notify manager(s) of the office ---
        const managers = await getOfficeManagers(service.officeId);
        const staffNames =
          assignedStaff.map((a) => a.staff.user.username).join(", ") || "None";

        for (const manager of managers) {
          const managerPhone = manager.user.phoneNumber;
          if (!managerPhone) continue;

          const managerMsg =
            `New service request received.\n\n` +
            `Service: ${service.name}\n` +
            `Customer: ${customerName}\n` +
            `Phone: ${customerPhone}\n` +
            `Date: ${requestDate}\n` +
            `Request No: ${requestNumber}\n\n` +
            `Assigned staff: ${staffNames}\n\n` +
            `Please review on the dashboard.`;

          sendSMS(managerPhone, managerMsg).catch((e) =>
            console.error(`SMS to manager ${managerPhone} failed:`, e),
          );
        }
      } catch (notificationError) {
        console.error("Failed to send request notifications:", notificationError);
      }
    })();

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
      include: {
        user: { select: { id: true, username: true, phoneNumber: true } },
        service: { select: { name: true, officeId: true } },
      },
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

    // Customer hears it moved forward; the office managers hear it now needs
    // their decision.
    dispatch(
      notifyRequestApprovedByStaff({
        requestId,
        customerUserId: existingRequest.user.id,
        requestNumber: existingRequest.requestNumber,
        customerName: existingRequest.user.username,
        serviceName: existingRequest.service.name,
        officeId: existingRequest.service.officeId,
        actorStaffId: staffId,
        note: notes ?? null,
      }),
    );

    // Notify customer — staff-level approval (non-blocking)
    if (existingRequest.user?.phoneNumber) {
      const customerMsg =
        `Dear ${existingRequest.user.username},\n\n` +
        `Your request for "${existingRequest.service.name}" has been reviewed and approved by staff.\n\n` +
        `It is now pending manager approval. You will be notified once fully approved.` +
        (notes ? `\n\nNote: ${notes}` : "") +
        `\n\nRequest No: ${existingRequest.requestNumber}`;

      sendSMS(existingRequest.user.phoneNumber, customerMsg).catch((e) =>
        console.error("Customer SMS (staff approval) failed:", e),
      );
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
      include: {
        user: { select: { id: true, username: true, phoneNumber: true } },
        service: {
          include: {
            office: { select: { name: true, roomNumber: true, address: true } },
          },
        },
      },
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

    // Final approval — the customer's notification carries the address,
    // because "where do I go now?" is the only thing left to answer.
    dispatch(
      notifyRequestApprovedByManager({
        requestId,
        customerUserId: existingRequest.user.id,
        requestNumber: existingRequest.requestNumber,
        customerName: existingRequest.user.username,
        serviceName: existingRequest.service.name,
        officeName: existingRequest.service.office.name,
        roomNumber: existingRequest.service.office.roomNumber,
        address: existingRequest.service.office.address,
        actorStaffId: approverId,
        note: notes ?? null,
      }),
    );

    // Notify customer — final approval (non-blocking)
    if (existingRequest.user?.phoneNumber) {
      const office = existingRequest.service.office;
      const customerMsg =
        `Dear ${existingRequest.user.username},\n\n` +
        `Your request for "${existingRequest.service.name}" has been approved.\n\n` +
        `Please visit ${office.name} (Room ${office.roomNumber}, ${office.address}) for further assistance.` +
        (notes ? `\n\nNote: ${notes}` : "") +
        `\n\nRequest No: ${existingRequest.requestNumber}`;

      sendSMS(existingRequest.user.phoneNumber, customerMsg).catch((e) =>
        console.error("Customer SMS (manager approval) failed:", e),
      );
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
      include: {
        user: { select: { id: true, username: true, phoneNumber: true } },
        service: { select: { id: true, name: true } },
      },
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

    // The reason travels with the notification — a rejection the customer
    // cannot act on is worse than no notification at all.
    dispatch(
      notifyRequestRejected({
        requestId,
        customerUserId: existingRequest.user.id,
        requestNumber: existingRequest.requestNumber,
        customerName: existingRequest.user.username,
        serviceName: existingRequest.service.name,
        serviceId: existingRequest.service.id,
        reason: rejectionReason,
      }),
    );

    // Notify customer — rejection (non-blocking)
    if (existingRequest.user?.phoneNumber) {
      const customerMsg =
        `Dear ${existingRequest.user.username},\n\n` +
        `Your request for "${existingRequest.service.name}" has been rejected.\n\n` +
        `Reason: ${rejectionReason}\n\n` +
        `For more information, please contact us.\n\n` +
        `Request No: ${existingRequest.requestNumber}`;

      sendSMS(existingRequest.user.phoneNumber, customerMsg).catch((e) =>
        console.error("Customer SMS (rejection) failed:", e),
      );
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
