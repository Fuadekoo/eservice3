import type { Response } from "express";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  approveAppointmentSchema,
  buildValidationError,
} from "../validators/appointment.validator.js";
import { dispatch } from "../services/notification.service.js";
import {
  notifyAppointmentApproved,
  notifyAppointmentBooked,
  notifyAppointmentCancelled,
  notifyAppointmentRescheduled,
} from "../services/notification-events.js";

/**
 * Everything a notification needs to describe an appointment: who it belongs
 * to, which service and office it sits under. Loaded in one query per action
 * rather than assembled from the response shape, so the notification layer
 * never depends on which `include` a particular endpoint happened to use.
 */
async function loadAppointmentContext(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      date: true,
      time: true,
      notes: true,
      userId: true,
      user: { select: { username: true } },
      request: {
        select: {
          serviceId: true,
          service: {
            select: { name: true, officeId: true },
          },
        },
      },
    },
  });

  if (!appointment) return null;

  return {
    appointmentId: appointment.id,
    customerUserId: appointment.userId,
    customerName: appointment.user?.username ?? "A customer",
    serviceName: appointment.request?.service?.name ?? "your service",
    serviceId: appointment.request?.serviceId ?? null,
    officeId: appointment.request?.service?.officeId ?? null,
    date: appointment.date,
    time: appointment.time,
    notes: appointment.notes,
  };
}

/**
 * Appointment response include configuration
 */
const appointmentInclude = {
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
          phoneNumber: true,
        },
      },
    },
  },
  request: {
    select: {
      id: true,
      // The customer's reference number, so an appointment can be traced back
      // to the request it came from without a second lookup.
      requestNumber: true,
      statusbystaff: true,
      statusbyadmin: true,
      fileData: {
        select: {
          id: true,
          name: true,
          filepath: true,
          description: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          office: {
            select: {
              id: true,
              name: true,
              address: true,
              roomNumber: true,
            },
          },
        },
      },
    },
  },
} as const;


/**
 * Format appointment response with ISO date strings
 */
function formatAppointment(appointment: any) {
  return {
    ...appointment,
    date: appointment.date.toISOString(),
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}

/**
 * Check user's role
 */
async function getUserRole(userId: string): Promise<string> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  return dbUser?.role?.name?.toLowerCase() || "";
}

/**
 * GET - List all appointments for the user (with role-based access)
 * Customers see only their own appointments.
 * Staff and admins can see all appointments based on permissions.
 */
export async function listAppointments(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const roleName = await getUserRole(userId);
    const isCustomer = roleName === "customer";

    // Build where condition based on role
    const where = isCustomer ? { userId } : {};

    const appointments = await prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: appointments.map(formatAppointment),
    });
  } catch (error: any) {
    console.error("❌ Error fetching appointments:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch appointments",
    });
  }
}

/**
 * GET - Get a specific appointment (requires appointment:read permission)
 */
export async function getAppointment(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const appointmentId = req.params['id'] as string;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: appointmentInclude,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Appointment not found",
      });
    }

    // Customers can only view their own appointments
    const roleName = await getUserRole(userId);
    const isCustomer = roleName === "customer";

    if (isCustomer && appointment.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatAppointment(appointment),
    });
  } catch (error: any) {
    console.error("❌ Error fetching appointment:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch appointment",
    });
  }
}

/**
 * POST - Create a new appointment (requires appointment:create permission)
 */
export async function createAppointment(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Validate request body
    const validation = createAppointmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    const { requestId, date, time, notes } = validation.data;

    // Verify request exists
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      select: { userId: true, id: true },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    // Customers can only create appointments for their own requests
    const roleName = await getUserRole(userId);
    const isCustomer = roleName === "customer";

    if (isCustomer && request.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        requestId,
        userId: request.userId,
        date: new Date(date),
        time: time || null,
        notes: notes || null,
        status: "pending",
      },
      include: appointmentInclude,
    });

    // Confirms receipt to the customer and puts the slot in front of the staff
    // who can confirm it. Non-blocking — the booking is already saved.
    dispatch(
      (async () => {
        const context = await loadAppointmentContext(appointment.id);
        if (context) await notifyAppointmentBooked(context);
      })(),
    );

    return res.status(201).json({
      success: true,
      data: formatAppointment(appointment),
      message: "Appointment created successfully",
    });
  } catch (error: any) {
    console.error("❌ Error creating appointment:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create appointment",
    });
  }
}

/**
 * PATCH - Update an appointment (requires appointment:update permission)
 */
export async function updateAppointment(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const appointmentId = req.params['id'] as string;

    // Validate request body
    const validation = updateAppointmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    // Get the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        request: {
          select: {
            statusbystaff: true,
            statusbyadmin: true,
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Appointment not found",
      });
    }

    // Check authorization
    const roleName = await getUserRole(userId);
    const isCustomer = roleName === "customer";

    if (isCustomer && appointment.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Prevent editing if appointment is approved or completed
    if (
      appointment.status === "approved" ||
      appointment.status === "completed"
    ) {
      return res.status(400).json({
        success: false,
        error: "Cannot update approved or completed appointment",
      });
    }

    // Build update data
    const { date, time, notes, status, approveStaffId } = validation.data;
    const updateData: any = {};

    if (date) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;
    if (approveStaffId) updateData.staffId = approveStaffId;

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: appointmentInclude,
    });

    // Only a moved slot or a cancellation is worth interrupting someone for.
    // A note or an internal status touch is not.
    const slotMoved =
      (date !== undefined &&
        new Date(date).getTime() !== appointment.date.getTime()) ||
      (time !== undefined && time !== appointment.time);
    const wasCancelled =
      status === "rejected" && appointment.status !== "rejected";

    if (slotMoved || wasCancelled) {
      dispatch(
        (async () => {
          const context = await loadAppointmentContext(appointmentId);
          if (!context) return;

          if (wasCancelled) {
            await notifyAppointmentCancelled({
              ...context,
              cancelledByStaff: !isCustomer,
            });
            return;
          }

          await notifyAppointmentRescheduled(context);
        })(),
      );
    }

    return res.status(200).json({
      success: true,
      data: formatAppointment(updatedAppointment),
      message: "Appointment updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Error updating appointment:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to update appointment",
    });
  }
}

/**
 * PATCH - Approve an appointment (requires appointment:approve permission)
 */
export async function approveAppointment(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const appointmentId = req.params['id'] as string;

    // Validate request body
    const validation = approveAppointmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    const { staffId, notes } = validation.data;

    // Get the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Appointment not found",
      });
    }

    // Verify staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { id: true, userId: true },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: "Staff not found",
      });
    }

    // Update appointment with approval
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "approved",
        staffId: staffId,
        notes: notes || appointment.notes,
      },
      include: appointmentInclude,
    });

    // The one message the customer has actually been waiting for.
    dispatch(
      (async () => {
        const context = await loadAppointmentContext(appointmentId);
        if (context) {
          await notifyAppointmentApproved({
            ...context,
            notes: notes ?? context.notes,
            approverStaffId: staffId,
          });
        }
      })(),
    );

    return res.status(200).json({
      success: true,
      data: formatAppointment(updatedAppointment),
      message: "Appointment approved successfully",
    });
  } catch (error: any) {
    console.error("❌ Error approving appointment:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to approve appointment",
    });
  }
}

/**
 * DELETE - Delete an appointment (requires appointment:delete permission)
 */
export async function deleteAppointment(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const appointmentId = req.params['id'] as string;

    // Get the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        request: {
          select: {
            statusbystaff: true,
            statusbyadmin: true,
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: "Appointment not found",
      });
    }

    // Check authorization
    const roleName = await getUserRole(userId);
    const isCustomer = roleName === "customer";

    if (isCustomer && appointment.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Prevent deleting if appointment is approved or completed
    if (
      appointment.status === "approved" ||
      appointment.status === "completed"
    ) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete approved or completed appointment",
      });
    }

    // Read the context before the row disappears — afterwards there is nothing
    // left to describe who the cancellation belonged to.
    const context = await loadAppointmentContext(appointmentId);

    // Delete the appointment
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    if (context) {
      dispatch(
        notifyAppointmentCancelled({
          ...context,
          cancelledByStaff: !isCustomer,
        }),
      );
    }

    return res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting appointment:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to delete appointment",
    });
  }
}
