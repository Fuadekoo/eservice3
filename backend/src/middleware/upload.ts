import multer from "multer";
import path from "path";
import type { Request, Response, NextFunction } from "express";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import crypto from "crypto";

// Get the project root directory
const getProjectRoot = () => {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFile);
  // Go up from src/middlewares to backend root
  return path.resolve(currentDir, "../..");
};

const projectRoot = getProjectRoot();
const uploadDir = path.join(projectRoot, "filedata");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * The only file types this system accepts, mapped to the extension they are
 * stored under. The extension is always derived from the detected content —
 * never from the name the client supplied — because `express.static` picks the
 * response Content-Type from the extension. A file stored as ".html" would be
 * served as text/html and its script would run on this origin, no matter what
 * the client claimed the MIME type was.
 */
type AllowedType = "image/png" | "image/jpeg" | "image/webp" | "application/pdf";

const ALLOWED_TYPES: Record<AllowedType, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

function isAllowedType(value: string): value is AllowedType {
  return Object.prototype.hasOwnProperty.call(ALLOWED_TYPES, value);
}

const ALLOWED_TYPES_MESSAGE =
  "Invalid file. Only PNG, JPG, WebP, and PDF files are allowed.";

/** Suffix used while the file is on disk but not yet content-checked. */
const PENDING_EXT = ".part";

/** Bytes needed to recognise the longest signature below (WebP needs 12). */
const SIGNATURE_LENGTH = 12;

/**
 * Identify a file from its magic bytes. Returns null for anything unrecognised,
 * which includes SVG and HTML — both are plain text and have no signature, so
 * they can never be mistaken for an image here.
 */
export function detectFileType(buffer: Buffer): AllowedType | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG: FF D8 FF — covers JFIF, Exif and raw variants.
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // WebP: "RIFF" .... "WEBP" (the 4 bytes between are the file size).
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  // PDF must start with "%PDF-". Readers tolerate leading junk; we do not,
  // because a leading-junk PDF is also a valid file of some other type.
  if (buffer.length >= 5 && buffer.toString("ascii", 0, 5) === "%PDF-") {
    return "application/pdf";
  }

  return null;
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, _file: Express.Multer.File, cb) => {
    // The client's filename is never used: it controlled the extension (and so
    // the served Content-Type) and allowed one upload to overwrite another by
    // reusing a name. A random name fixes both. The real extension is attached
    // by validateUploadedFile once the content has been identified.
    cb(null, `${crypto.randomUUID()}${PENDING_EXT}`);
  },
});

/**
 * Cheap first pass on the declared MIME type. This is only a courtesy so
 * obviously-wrong uploads fail before hitting the disk — the client controls
 * this value, so validateUploadedFile is what actually decides.
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const declared = file.mimetype === "image/jpg" ? "image/jpeg" : file.mimetype;
  if (isAllowedType(declared)) {
    cb(null, true);
  } else {
    cb(new Error(ALLOWED_TYPES_MESSAGE));
  }
};

// Single file upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    // Only images and PDFs are accepted, so the old 1GB ceiling served no
    // purpose. The apply-service form already refuses anything over 10MB.
    fileSize: 25 * 1024 * 1024,
  },
});

// Multiple files upload
export const uploadMultiple = upload.array("files", 10); // Max 10 files

// Named field uploads (for specific document types)
export const uploadFields = upload.fields([
  { name: "file", maxCount: 1 },
  { name: "files", maxCount: 10 },
  { name: "document", maxCount: 1 },
  { name: "documents", maxCount: 10 },
]);

function collectFiles(req: Request): Express.Multer.File[] {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  if (req.files && typeof req.files === "object") {
    return Object.values(req.files).flat();
  }
  return [];
}

async function readSignature(filePath: string): Promise<Buffer> {
  const handle = await fs.promises.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(SIGNATURE_LENGTH);
    const { bytesRead } = await handle.read(buffer, 0, SIGNATURE_LENGTH, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

async function discard(files: Express.Multer.File[]): Promise<void> {
  await Promise.all(
    files.map((file) =>
      fs.promises.rm(file.path, { force: true }).catch(() => undefined),
    ),
  );
}

/**
 * Identify every uploaded file by its content and reject the request unless all
 * of them are a type we accept. Survivors are renamed to carry the extension of
 * what they actually are. Runs immediately after multer, before any handler.
 */
export async function validateUploadedFile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const files = collectFiles(req);
  if (files.length === 0) {
    next();
    return;
  }

  try {
    for (const file of files) {
      const signature = await readSignature(file.path);
      const detected = detectFileType(signature);

      if (!detected) {
        await discard(files);
        res.status(400).json({
          error: "ValidationError",
          message: ALLOWED_TYPES_MESSAGE,
          details: [{ path: file.fieldname, message: ALLOWED_TYPES_MESSAGE }],
        });
        return;
      }

      const finalPath = file.path.replace(
        new RegExp(`\\${PENDING_EXT}$`),
        ALLOWED_TYPES[detected],
      );
      await fs.promises.rename(file.path, finalPath);

      // Hand the handlers the truth, not what the client claimed.
      file.path = finalPath;
      file.filename = path.basename(finalPath);
      file.mimetype = detected;
    }
    next();
  } catch (error) {
    await discard(files);
    next(error);
  }
}
