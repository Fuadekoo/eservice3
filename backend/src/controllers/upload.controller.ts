import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";

/**
 * POST /files/upload
 * Auth required. Uploads a file and returns its details.
 */
export async function uploadFile(
  req: AuthRequest,
  res: Response,
): Promise<Response | void> {
  if (!req.file) {
    return res.status(400).json({
      error: "ValidationError",
      message: "No file provided.",
    });
  }

  // The middleware handles the actual storage in backend/filedata
  const file = req.file;

  return res.json({
    data: {
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
    },
  });
}
