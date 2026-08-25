import type { Response } from "express";
import { Prisma } from "../lib/prisma-client.js";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createAboutSchema,
  updateAboutSchema,
  buildValidationError,
} from "../validators/about.validator.js";
import { sanitizeOptionalRichText } from "../utils/sanitize-html.js";

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
        .json({ error: "NotFound", message: "About section not found." });
    }
  }
  console.error(`[${context}] Error:`, error);
  return res
    .status(500)
    .json({ error: "InternalServerError", message: "An unexpected error occurred." });
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /about
 * Public. Returns all about sections ordered by creation date.
 */
export async function listAbout(
  _req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const sections = await prisma.about.findMany({
      orderBy: { createdAt: "asc" },
    });

    return res.json({ data: sections });
  } catch (error) {
    return handlePrismaError(error, res, "listAbout");
  }
}

/**
 * GET /about/:id
 * Public. Returns a single about section by ID.
 */
export async function getAbout(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    const section = await prisma.about.findUnique({ where: { id } });

    if (!section) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "About section not found." });
    }

    return res.json({ data: section });
  } catch (error) {
    return handlePrismaError(error, res, "getAbout");
  }
}

/**
 * POST /about
 * Admin only. Creates a new about section.
 */
export async function createAbout(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const validation = createAboutSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    const { name, image, description } = validation.data;

    // The description is rich text served on a public page, so it is cleaned
    // here — the API is the boundary, not any particular client.
    const safeDescription = sanitizeOptionalRichText(description);

    const section = await prisma.about.create({
      data: {
        name,
        image,
        ...(safeDescription !== undefined ? { description: safeDescription } : {}),
      },
    });

    return res.status(201).json({ data: section });
  } catch (error) {
    return handlePrismaError(error, res, "createAbout");
  }
}

/**
 * PUT /about/:id
 * Admin only. Partially updates an about section.
 * Verifies the section exists before attempting update.
 */
export async function updateAbout(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    const validation = updateAboutSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    // Explicit existence check so the 404 is always clear
    const existing = await prisma.about.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "About section not found." });
    }

    const { name, image, description } = validation.data;
    const safeDescription = sanitizeOptionalRichText(description);

    const section = await prisma.about.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(safeDescription !== undefined ? { description: safeDescription } : {}),
      },
    });

    return res.json({ data: section });
  } catch (error) {
    return handlePrismaError(error, res, "updateAbout");
  }
}

/**
 * DELETE /about/:id
 * Admin only. Verifies the section exists before deleting.
 */
export async function deleteAbout(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    // Explicit existence check gives a cleaner 404 than catching P2025
    const existing = await prisma.about.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "About section not found." });
    }

    await prisma.about.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    return handlePrismaError(error, res, "deleteAbout");
  }
}
