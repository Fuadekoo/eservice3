import { axiosInstance } from "./axios";

export interface FileUploadResponse {
  data: {
    id: string;
    fileNumber: string;
    path: string;
    mimeType: string;
    size: number;
    [key: string]: any;
  };
}

export interface FileUploadOptions {
  file: globalThis.File; // Browser File type
  fileNumber?: string;
  firstName?: string;
  fatherName?: string;
  lastName?: string;
  fan?: string;
  phone?: string;
  address?: string;
  woreda?: string;
  zone?: string;
  city?: string;
  state?: string;
  country?: string;
  folderId?: string | null;
  onProgress?: (progress: number) => void;
}

/**
 * Upload a file only (without creating a record)
 */
export async function uploadFileOnly(
  file: globalThis.File, // Browser File type
  onProgress?: (progress: number) => void
): Promise<{
  path: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post<{
    data: {
      path: string;
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
    };
  }>("/files/upload", formData, {
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(progress);
      }
    },
  });

  // Handle response structure from axios interceptor
  const data = (response as any).data?.data || (response as any).data;
  return data;
}

/**
 * Upload a file to the server (creates a record)
 */
export async function uploadFile(
  options: FileUploadOptions
): Promise<FileUploadResponse["data"]> {
  const {
    file,
    fileNumber,
    firstName,
    fatherName,
    lastName,
    fan,
    phone,
    address,
    woreda,
    zone,
    city,
    state,
    country,
    folderId,
    onProgress,
  } = options;

  // Create FormData
  const formData = new FormData();
  formData.append("file", file);

  // Add all metadata fields (required fields must be provided)
  if (fileNumber) formData.append("fileNumber", fileNumber);
  if (firstName) formData.append("firstName", firstName);
  if (fatherName) formData.append("fatherName", fatherName);
  if (lastName) formData.append("lastName", lastName);
  if (fan) formData.append("fan", fan);
  if (phone) formData.append("phone", phone);
  if (address) formData.append("address", address);
  if (woreda) formData.append("woreda", woreda);
  if (zone) formData.append("zone", zone);
  if (city) formData.append("city", city);
  if (state) formData.append("state", state);
  if (country) formData.append("country", country);
  if (folderId) formData.append("folderId", folderId);

  // Upload with progress tracking
  const response = await axiosInstance.post<FileUploadResponse>(
    "/files",
    formData,
    {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    }
  );

  // Handle response structure from axios interceptor
  const data = (response as any).data?.data || (response as any).data;
  return data;
}

/**
 * Get file download URL
 */
export function getFileUrl(fileId: string): string {
  const baseURL =
    process.env.NEXT_PUBLIC_API_BASE_URL;
  return `${baseURL}/files/${fileId}/serve`;
}

/**
 * Get file preview URL (for images/PDFs)
 */
export function getFilePreviewUrl(fileId: string): string {
  return getFileUrl(fileId);
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Check if file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Check if file is a PDF
 */
export function isPdfFile(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

/**
 * Check if file can be previewed in browser
 */
export function canPreviewFile(mimeType: string): boolean {
  return isImageFile(mimeType) || isPdfFile(mimeType);
}
