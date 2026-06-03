import type { Response } from "express";
import { Prisma } from "../lib/prisma-client.js";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createAdministrationSchema,
  updateAdministrationSchema,
  buildValidationError,
} from "../validators/administration.validator.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function handlePrismaError(
  error: unknown,
  res: Response,
  context: string,
): Response {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Administration section not found." });
    }
  }
  console.error(`[${context}] Error:`, error);
  return res
    .status(500)
    .json({ error: "InternalServerError", message: "An unexpected error occurred." });
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /administration
 * Public. Returns all administration sections ordered by creation date.
 */
export async function listAdministration(
  _req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const sections = await prisma.administration.findMany({
      orderBy: { createdAt: "asc" },
    });

    return res.json({ data: sections });
  } catch (error) {
    return handlePrismaError(error, res, "listAdministration");
  }
}

/**
 * GET /administration/:id
 * Public. Returns a single administration section by ID.
 */
export async function getAdministration(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    const section = await prisma.administration.findUnique({ where: { id } });

    if (!section) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Administration section not found." });
    }

    return res.json({ data: section });
  } catch (error) {
    return handlePrismaError(error, res, "getAdministration");
  }
}

/**
 * POST /administration
 * Admin only. Creates a new administration section.
 */
export async function createAdministration(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const validation = createAdministrationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    const { name, image, description } = validation.data;

    const section = await prisma.administration.create({
      data: {
        name,
        image,
        ...(description !== undefined ? { description } : {}),
      },
    });

    return res.status(201).json({ data: section });
  } catch (error) {
    return handlePrismaError(error, res, "createAdministration");
  }
}

/**
 * PUT /administration/:id
 * Admin only. Partially updates an administration section.
 */
export async function updateAdministration(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    const validation = updateAdministrationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    const { name, image, description } = validation.data;

    const section = await prisma.administration.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    return res.json({ data: section });
  } catch (error) {
    return handlePrismaError(error, res, "updateAdministration");
  }
}

/**
 * DELETE /administration/:id
 * Admin only.
 */
export async function deleteAdministration(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    await prisma.administration.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    return handlePrismaError(error, res, "deleteAdministration");
  }
}
