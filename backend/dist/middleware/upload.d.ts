import multer from "multer";
import type { Request, Response, NextFunction } from "express";
/**
 * The only file types this system accepts, mapped to the extension they are
 * stored under. The extension is always derived from the detected content —
 * never from the name the client supplied — because `express.static` picks the
 * response Content-Type from the extension. A file stored as ".html" would be
 * served as text/html and its script would run on this origin, no matter what
 * the client claimed the MIME type was.
 */
type AllowedType = "image/png" | "image/jpeg" | "image/webp" | "application/pdf";
/**
 * Identify a file from its magic bytes. Returns null for anything unrecognised,
 * which includes SVG and HTML — both are plain text and have no signature, so
 * they can never be mistaken for an image here.
 */
export declare function detectFileType(buffer: Buffer): AllowedType | null;
export declare const upload: multer.Multer;
export declare const uploadMultiple: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadFields: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * Identify every uploaded file by its content and reject the request unless all
 * of them are a type we accept. Survivors are renamed to carry the extension of
 * what they actually are. Runs immediately after multer, before any handler.
 */
export declare function validateUploadedFile(req: Request, res: Response, next: NextFunction): Promise<void>;
export {};
//# sourceMappingURL=upload.d.ts.map