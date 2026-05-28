import type { Response } from "express";
import { prisma } from "../lib/db.js";
import { randomUUID } from "crypto";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createFeedbackSchema,
  updateFeedbackSchema,
  buildValidationError,
} from "../validators/feedback.validator.js";

/**
 * Feedback response include configuration
 */
const feedbackInclude = {
  request: {
    select: {
      id: true,
      date: true,
      userId: true,
      service: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

/**
 * Format feedback response with ISO date strings
 */
function formatFeedback(feedback: any) {
  return {
    id: feedback.id,
    requestId: feedback.requestId,
    rating: feedback.rating,
    comment: feedback.comment,
    createdAt: feedback.createdAt.toISOString(),
    updatedAt: feedback.updatedAt.toISOString(),
    requestDate: feedback.request?.date?.toISOString() || null,
    serviceId: feedback.request?.service?.id || null,
    serviceName: feedback.request?.service?.name || null,
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
 * GET - List all feedback (role-based access)
 * Customers see only their own feedback.
 * Staff and admins can see all feedback based on permissions.
 */
export async function listFeedback(req: AuthRequest, res: Response) {
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
    let where: any = {};
    if (isCustomer) {
      // Customers see only their own feedback
      where = {
        request: {
          userId,
        },
      };
    }

    const feedback = await prisma.customerSatisfaction.findMany({
      where,
      include: feedbackInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: feedback.map(formatFeedback),
    });
  } catch (error: any) {
    console.error("❌ Error fetching feedback list:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch feedback list",
    });
  }
}

/**
 * GET - Get feedback for a specific request (requires feedback:read permission)
 */
export async function getFeedback(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const requestId = req.params.requestId;

    // Get feedback for the request
    const feedback = await prisma.customerSatisfaction.findUnique({
      where: { requestId },
      include: feedbackInclude,
    });

    // Customers can only view their own feedback
    const roleName = await getUserRole(userId);
    const isCustomer = roleName === "customer";

    if (feedback && isCustomer && feedback.request.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: "Feedback not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: formatFeedback(feedback),
    });
  } catch (error: any) {
    console.error("❌ Error fetching feedback:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch feedback",
    });
  }
}

/**
 * POST - Create new feedback for a request (requires feedback:create permission)
 */
export async function createFeedback(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const requestId = req.params.requestId;

    // Validate request body
    const validation = createFeedbackSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    const { rating, comment } = validation.data;

    // Verify request exists and belongs to the user
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        userId: true,
        date: true,
      },
    });

    if (!requestData) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    if (requestData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error:
          "Unauthorized - You can only provide feedback for your own requests",
      });
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.customerSatisfaction.findUnique({
      where: { requestId },
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        error:
          "Feedback already exists for this request. Use PUT to update it.",
      });
    }

    // Create new feedback
    const feedback = await prisma.customerSatisfaction.create({
      data: {
        id: randomUUID(),
        requestId,
        rating,
        comment: comment || null,
      },
      include: feedbackInclude,
    });

    return res.status(201).json({
      success: true,
      data: formatFeedback(feedback),
      message: "Feedback submitted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error creating feedback:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create feedback",
    });
  }
}

/**
 * PUT - Create or update feedback for a request (requires feedback:create permission)
 */
export async function upsertFeedback(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const requestId = req.params.requestId;

    // Validate request body
    const validation = createFeedbackSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    const { rating, comment } = validation.data;

    // Verify request exists and belongs to the user
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        userId: true,
        date: true,
      },
    });

    if (!requestData) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    if (requestData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error:
          "Unauthorized - You can only provide feedback for your own requests",
      });
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.customerSatisfaction.findUnique({
      where: { requestId },
    });

    let feedback;
    let isUpdate = false;

    if (existingFeedback) {
      // Update existing feedback
      feedback = await prisma.customerSatisfaction.update({
        where: { id: existingFeedback.id },
        data: {
          rating,
          comment: comment || null,
        },
        include: feedbackInclude,
      });
      isUpdate = true;
    } else {
      // Create new feedback
      feedback = await prisma.customerSatisfaction.create({
        data: {
          id: randomUUID(),
          requestId,
          rating,
          comment: comment || null,
        },
        include: feedbackInclude,
      });
    }

    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      data: formatFeedback(feedback),
      message: isUpdate
        ? "Feedback updated successfully"
        : "Feedback submitted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error saving feedback:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to save feedback",
    });
  }
}

/**
 * PATCH - Update existing feedback (requires feedback:update permission)
 */
export async function updateFeedback(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const requestId = req.params.requestId;

    // Validate request body
    const validation = updateFeedbackSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    // Get existing feedback
    const existingFeedback = await prisma.customerSatisfaction.findUnique({
      where: { requestId },
      include: {
        request: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingFeedback) {
      return res.status(404).json({
        success: false,
        error: "Feedback not found",
      });
    }

    // Check authorization
    if (existingFeedback.request.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Build update data
    const { rating, comment } = validation.data;
    const updateData: any = {};

    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;

    // Update feedback
    const feedback = await prisma.customerSatisfaction.update({
      where: { id: existingFeedback.id },
      data: updateData,
      include: feedbackInclude,
    });

    return res.status(200).json({
      success: true,
      data: formatFeedback(feedback),
      message: "Feedback updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Error updating feedback:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to update feedback",
    });
  }
}

/**
 * DELETE - Delete feedback (requires feedback:delete permission)
 */
export async function deleteFeedback(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const requestId = req.params.requestId;

    // Get existing feedback
    const existingFeedback = await prisma.customerSatisfaction.findUnique({
      where: { requestId },
      include: {
        request: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!existingFeedback) {
      return res.status(404).json({
        success: false,
        error: "Feedback not found",
      });
    }

    // Check authorization
    if (existingFeedback.request.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Delete feedback
    await prisma.customerSatisfaction.delete({
      where: { id: existingFeedback.id },
    });

    return res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting feedback:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to delete feedback",
    });
  }
}
