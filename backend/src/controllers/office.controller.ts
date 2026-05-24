import type { Response } from "express";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createOfficeSchema,
  updateOfficeSchema,
  buildValidationError,
} from "../validators/office.validator.js";

/**
 * List all offices (Public access for signup)
 */
export async function listOffices(_req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const offices = await prisma.office.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        logo: true,
        slogan: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.json({ data: offices });
  } catch (error) {
    console.error("[listOffices] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to fetch offices list.",
    });
  }
}

/**
 * Get a single office by ID
 */
export async function getOffice(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Office ID is required.",
      });
    }

    const office = await prisma.office.findUnique({
      where: { id },
    });

    if (!office) {
      return res.status(404).json({
        error: "NotFound",
        message: `Office with ID '${id}' not found.`,
      });
    }

    return res.json({ data: office });
  } catch (error) {
    console.error("[getOffice] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to fetch office details.",
    });
  }
}

/**
 * Create a new office (Admin only)
 */
export async function createOffice(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const validation = createOfficeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    const office = await prisma.office.create({
      data: validation.data,
    });

    return res.status(201).json({ data: office });
  } catch (error) {
    console.error("[createOffice] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to create office.",
    });
  }
}

/**
 * Update an office (Admin/Manager only)
 */
export async function updateOffice(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const validation = updateOfficeSchema.safeParse(req.body);
    
    if (!id) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Office ID is required.",
      });
    }

    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    const office = await prisma.office.update({
      where: { id },
      data: validation.data,
    });

    return res.json({ data: office });
  } catch (error) {
    console.error("[updateOffice] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to update office.",
    });
  }
}

/**
 * Delete an office (Admin only)
 */
export async function deleteOffice(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Office ID is required.",
      });
    }

    await prisma.office.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("[deleteOffice] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to delete office.",
    });
  }
}
