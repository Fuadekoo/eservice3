import type { Response } from "express";
import { Prisma } from "../lib/prisma-client.js";
import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createOfficeSchema,
  updateOfficeSchema,
  buildValidationError,
} from "../validators/office.validator.js";

function handlePrismaError(
  error: unknown,
  res: Response,
  context: string,
): Response {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Office not found." });
    }
    if (error.code === "P2002") {
      const fields = Array.isArray(error.meta?.target)
        ? (error.meta.target as string[]).join(", ")
        : "field";
      return res.status(409).json({
        error: "Conflict",
        message: `An office with this ${fields} already exists.`,
      });
    }
  }
  console.error(`[${context}] Error:`, error);
  return res
    .status(500)
    .json({
      error: "InternalServerError",
      message: "An unexpected error occurred.",
    });
}

const officeListSelect = {
  id: true,
  name: true,
  roomNumber: true,
  address: true,
  phoneNumber: true,
  subdomain: true,
  logo: true,
  slogan: true,
  status: true,
  startedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listOffices(
  _req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const offices = await prisma.office.findMany({
      select: {
        ...officeListSelect,
        _count: {
          select: {
            service: true,
            staffs: true,
            requests: true,
            appointments: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
          take: 3,
        },
      },
      orderBy: { name: "asc" },
    });
    return res.json({ data: offices });
  } catch (error) {
    return handlePrismaError(error, res, "listOffices");
  }
}

export async function getOffice(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    const office = await prisma.office.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            service: true,
            staffs: true,
            requests: true,
            appointments: true,
          },
        },
        availability: true,
        service: {
          include: {
            requirements: true,
            serviceFors: true,
          },
        },
      },
    });

    if (!office) {
      return res
        .status(404)
        .json({ error: "NotFound", message: "Office not found." });
    }

    return res.json({ data: office });
  } catch (error) {
    return handlePrismaError(error, res, "getOffice");
  }
}

export async function createOffice(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const validation = createOfficeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    const {
      name,
      roomNumber,
      address,
      subdomain,
      phoneNumber,
      logo,
      slogan,
      settings,
      status,
    } = validation.data;

    const office = await prisma.office.create({
      data: {
        name,
        roomNumber,
        address,
        subdomain,
        ...(phoneNumber !== undefined ? { phoneNumber } : {}),
        ...(logo !== undefined ? { logo } : {}),
        ...(slogan !== undefined ? { slogan } : {}),
        ...(settings !== undefined ? { settings } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });

    return res.status(201).json({ data: office });
  } catch (error) {
    return handlePrismaError(error, res, "createOffice");
  }
}

export async function updateOffice(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;
    const validation = updateOfficeSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json(buildValidationError(validation.error));
    }

    const {
      name,
      roomNumber,
      address,
      subdomain,
      phoneNumber,
      logo,
      slogan,
      settings,
      status,
    } = validation.data;

    const office = await prisma.office.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(roomNumber !== undefined ? { roomNumber } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(subdomain !== undefined ? { subdomain } : {}),
        ...(phoneNumber !== undefined ? { phoneNumber } : {}),
        ...(logo !== undefined ? { logo } : {}),
        ...(slogan !== undefined ? { slogan } : {}),
        ...(settings !== undefined ? { settings } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });

    return res.json({ data: office });
  } catch (error) {
    return handlePrismaError(error, res, "updateOffice");
  }
}

export async function deleteOffice(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  try {
    const id = req.params["id"] as string;

    await prisma.office.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    return handlePrismaError(error, res, "deleteOffice");
  }
}
