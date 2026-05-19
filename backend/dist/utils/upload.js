import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Create filedata directory if it doesn't exist
const fileDataDir = path.join(__dirname, "../../uploads/filedata");
if (!fs.existsSync(fileDataDir)) {
    fs.mkdirSync(fileDataDir, { recursive: true });
}
// File storage configuration for enventory system
const fileStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, fileDataDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        const name = path
            .basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9]/g, "_");
        const filename = `${name}-${uniqueSuffix}${ext}`;
        cb(null, filename);
    },
});
// File filter for documents (PDF, DOC, DOCX, images, etc.)
const fileFilter = (_req, file, cb) => {
    const allowedMimes = [
        // Documents
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "text/plain",
        "text/csv",
        // Images
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        // Archives
        "application/zip",
        "application/x-zip-compressed",
        "application/x-rar-compressed",
    ];
    const allowedExtensions = [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".txt",
        ".csv",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".svg",
        ".zip",
        ".rar",
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, Images (JPG, PNG, GIF, WEBP, SVG), and Archives (ZIP, RAR).`));
    }
};
// Configure multer for file uploads
export const uploadFile = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1000 * 1024 * 1024, // 1GB limit (1000MB)
    },
});
// Single file upload middleware
export const uploadSingle = uploadFile.single("file");
// Multiple files upload middleware
export const uploadMultiple = uploadFile.array("files", 10); // Max 10 files
// File utility functions
export function getFileUrl(filename) {
    return `/uploads/filedata/${filename}`;
}
export function getFilePath(filename) {
    return path.join(fileDataDir, filename);
}
export function deleteFile(filename) {
    const filePath = getFilePath(filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}
export function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    }
    catch (error) {
        return 0;
    }
}
export function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls": "application/vnd.ms-excel",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".txt": "text/plain",
        ".csv": "text/csv",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".zip": "application/zip",
        ".rar": "application/x-rar-compressed",
    };
    return mimeTypes[ext] || "application/octet-stream";
}
// Get file data directory path
export const FILE_DATA_DIR = fileDataDir;
//# sourceMappingURL=upload.js.map