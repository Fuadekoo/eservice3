import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import path from "path";
import fs from "fs";

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

/**
 * Serve a request attachment directly by its filepath.
 * This is used for files stored in the fileData table
 * which record a relative filepath.
 *
 * Route: GET /files/by-path/* (the wildcard captures the entire path)
 */
export async function serveByFilepath(
  req: AuthRequest,
  res: Response
): Promise<Response | void> {
  try {
    // Express wildcard param is named "0" for `/*` patterns
    const rawPath: string = (req.params as any)[0] || (req.params as any).filepath || "";

    if (!rawPath) {
      return res.status(400).json({ error: "BadRequest", message: "No filepath provided." });
    }

    // Security: prevent directory traversal
    const normalised = path.normalize(rawPath).replace(/^(\.\.(\/|\\|$))+/, "");

    // Note: in eservice3, files might be stored in 'filedata' or 'uploads'. Let's support both/check parent dir
    const processDir = process.cwd();
    let filePath = path.join(processDir, normalised);

    // If normalized path doesn't start with a safe folder, restrict it.
    // Let's check if it exists.
    if (!fs.existsSync(filePath)) {
      // Try resolving in uploads/ or filedata/ folder
      const altPathUploads = path.join(processDir, "uploads", normalised);
      const altPathFiledata = path.join(processDir, "filedata", normalised);
      if (fs.existsSync(altPathUploads)) {
        filePath = altPathUploads;
      } else if (fs.existsSync(altPathFiledata)) {
        filePath = altPathFiledata;
      } else {
        console.error("[serveByFilepath] File not found on disk:", filePath);
        return res.status(404).json({ error: "NotFound", message: "File not found." });
      }
    }

    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return res.status(404).json({ error: "NotFound", message: "Path is not a file." });
    }

    // Determine MIME type from extension
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".txt": "text/plain",
      ".csv": "text/csv",
    };
    const mimeType = mimeTypes[ext] || "application/octet-stream";
    const isPdf = mimeType === "application/pdf";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", stats.size.toString());
    res.setHeader("Cache-Control", "private, max-age=3600");

    if (isPdf) {
      const basename = path.basename(filePath);
      res.setHeader("Content-Disposition", `inline; filename="${basename}"`);
      res.setHeader("X-Content-Type-Options", "nosniff");
    } else {
      res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);
    }

    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", (err) => {
      console.error("[serveByFilepath] Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "InternalServerError", message: "Unable to stream file." });
      }
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error("[serveByFilepath] Error:", error);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Unable to serve file.",
    });
  }
}

