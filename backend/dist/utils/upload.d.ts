import multer from "multer";
export declare const uploadFile: multer.Multer;
export declare const uploadSingle: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadMultiple: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare function getFileUrl(filename: string): string;
export declare function getFilePath(filename: string): string;
export declare function deleteFile(filename: string): void;
export declare function getFileSize(filePath: string): number;
export declare function getMimeType(filePath: string): string;
export declare const FILE_DATA_DIR: string;
//# sourceMappingURL=upload.d.ts.map