import type { Response } from "express";
import { Prisma } from "../lib/prisma-client.js";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createGallerySchema,
  updateGallerySchema,
  addImageSchema,
  buildValidationError,
} from "../validators/gallery.validator.js";

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
        .json({ error: "NotFound", message: "Gallery or image not found." });
    }
  }
  console.error(`[${context}] Error:`, error);
  return res
    .status(500)
    .json({ error: "InternalServerError", message: "An unexpected error occurred." });
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /gallery
 * Public. Returns all galleries with their images.
 */
export async function listGalleries(
  _req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const galleries = await prisma.gallery.findMany({
      include: {
        images: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ data: galleries });
  } catch (error) {
    return handlePrismaError(error, res, "listGalleries");
  }
}

/**
 * GET /gallery/:id
 * Public. Returns a single gallery with its images.
 */
export async function getGallery(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    const gallery = await prisma.gallery.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!gallery) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Gallery not found." });
    }

    return res.json({ data: gallery });
  } catch (error) {
    return handlePrismaError(error, res, "getGallery");
  }
}

/**
 * POST /gallery
 * Admin only. Creates a new gallery.
 */
export async function createGallery(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const validation = createGallerySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    const { name, description } = validation.data;

    const gallery = await prisma.gallery.create({
      data: {
        name,
        ...(description !== undefined ? { description } : {}),
      },
    });

    return res.status(201).json({ data: gallery });
  } catch (error) {
    return handlePrismaError(error, res, "createGallery");
  }
}

/**
 * PUT /gallery/:id
 * Admin only. Updates a gallery's metadata.
 */
export async function updateGallery(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    const validation = updateGallerySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    const { name, description } = validation.data;

    const gallery = await prisma.gallery.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    return res.json({ data: gallery });
  } catch (error) {
    return handlePrismaError(error, res, "updateGallery");
  }
}

/**
 * DELETE /gallery/:id
 * Admin only.
 */
export async function deleteGallery(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    await prisma.gallery.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    return handlePrismaError(error, res, "deleteGallery");
  }
}

/**
 * POST /gallery/:id/images
 * Admin only. Adds an image to a gallery.
 */
export async function addImageToGallery(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const galleryId = req.params["id"] as string;

    const validation = addImageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    const { filename, order } = validation.data;

    const image = await prisma.galleryImage.create({
      data: {
        galleryId,
        filename,
        order,
      },
    });

    return res.status(201).json({ data: image });
  } catch (error) {
    return handlePrismaError(error, res, "addImageToGallery");
  }
}

/**
 * DELETE /gallery/images/:id
 * Admin only. Removes an image.
 */
export async function deleteImage(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    await prisma.galleryImage.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    return handlePrismaError(error, res, "deleteImage");
  }
}
