import multer from "multer";
import path from "path";
import type { Request } from "express";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

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

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Use original filename, sanitize it
    const ext = path.extname(file.originalname);
    const name = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .toLowerCase();
    // Save as: filedata/filename.ext
    cb(null, `${name}${ext}`);
  },
});

// File filter - allow common document and image types
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    // Documents
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "text/plain", // .txt
    "text/csv", // .csv
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml", // .svg
    // Archives
    "application/zip",
    "application/x-rar-compressed",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, images (JPEG, PNG, GIF, WEBP, SVG), and archives (ZIP, RAR) are allowed."
      )
    );
  }
};

// Single file upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1000 * 1024 * 1024, // 1GB limit (1000MB)
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
