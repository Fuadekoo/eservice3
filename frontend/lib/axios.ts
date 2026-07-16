import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { getToken, removeToken } from "./auth-client";

// Resolve base URL with sensible fallbacks for different environments
// Priority:
// 1) NEXT_PUBLIC_API_BASE_URL (explicit config)
// 2) Browser: same-origin `/back-api` (behind nginx or reverse proxy)
// 3) Server-side: local dev backend `http://localhost:4000/back-api`
export const NEXT_PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined"
    ? "/back-api"
    : process.env.API_BASE_URL || "http://localhost:4000/back-api");

/**
 * Get the base URL for uploaded files
 */
export const getUploadUrl = (filename?: string) => {
  if (!filename) return "";
  // If it's already a full URL (e.g. an external logo), return it as-is.
  if (filename.startsWith("http")) return filename;

  // Stored values vary: a bare filename ("abc.jpg") or a full path such as
  // "/api/filedata/abc.jpg", "/filedata/abc.jpg" or "/uploads/abc.jpg". The
  // proxy resolves files by name against the backend's /uploads and /filedata
  // dirs, so reduce anything with slashes down to just the filename — otherwise
  // a stored path becomes the broken "/api/uploads//api/filedata/abc.jpg".
  const name = filename.split("/").pop() || filename;

  // Stream through the local API proxy route.
  return `/api/uploads/${name}`;
};

export class ApiError extends Error {
  status: number;
  details?: Array<{ path?: string; message: string }>;

  constructor(
    message: string,
    status: number,
    details?: Array<{ path?: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

// Create axios instance
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 300000, // 5 minutes timeout to allow for large file uploads
  withCredentials: false, // JWT doesn't need cookies
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Remove Content-Type header for FormData to let axios set it automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    // Add JWT token to Authorization header
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Handle 204 No Content responses
    if (response.status === 204) {
      return undefined;
    }

    // Handle empty content
    if (response.headers["content-length"] === "0") {
      return undefined;
    }

    // Check if response.data exists and is valid
    if (response.data === null || response.data === undefined) {
      return undefined;
    }

    // If response.data is already an object (axios parsed it), return it
    if (typeof response.data === "object") {
      return response.data;
    }

    // If response.data is a string, try to parse it
    if (typeof response.data === "string") {
      if (response.data.trim() === "") {
        return undefined;
      }
      try {
        return JSON.parse(response.data);
      } catch {
        return response.data;
      }
    }

    return response.data;
  },
  (error: AxiosError) => {
    // Let AbortController / axios cancellations pass through unchanged so
    // callers can detect them with axios.isCancel() or error.name checks.
    if (axios.isCancel(error) || (error as any).code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

    // Handle error responses (server responded with error status)
    if (error.response) {
      const status = error.response.status;

      // Safely extract error data
      let errorData: {
        error?: string;
        message?: string;
        details?: Array<{ path?: string; message?: string }>;
      } = {};

      // Try to parse error response data
      if (error.response.data) {
        if (typeof error.response.data === "string") {
          // If it's a string, try to parse it as JSON
          if (error.response.data.trim()) {
            try {
              errorData = JSON.parse(error.response.data);
            } catch {
              // If parsing fails, use the string as the message
              errorData = { message: error.response.data };
            }
          }
        } else if (typeof error.response.data === "object") {
          errorData = error.response.data as typeof errorData;
        }
      }

      // Handle 401 Unauthorized - token expired or invalid
      if (status === 401) {
        const isAuthEndpoint = error.config?.url?.includes("/auth/");
        const isLoginEndpoint = error.config?.url?.includes("/auth/login");

        // Don't clear auth on login endpoint (wrong credentials)
        if (!isLoginEndpoint && !isAuthEndpoint) {
          // Token expired or invalid - clear and redirect
          removeToken();
          if (
            typeof window !== "undefined" &&
            window.location.pathname !== "/signin"
          ) {
            window.location.href = "/signin";
          }
        }
      }

      const message =
        errorData?.message ||
        errorData?.error ||
        `API request failed (${status})`;
      const details = Array.isArray(errorData?.details)
        ? errorData.details.map((item) => ({
            path: typeof item?.path === "string" ? item.path : undefined,
            message: typeof item?.message === "string" ? item.message : "",
          }))
        : undefined;

      return Promise.reject(new ApiError(message, status, details));
    }

    // Handle network errors (request made but no response received)
    if (error.request) {
      const isTimeout =
        error.code === "ECONNABORTED" || error.message?.includes("timeout");
      const message = isTimeout
        ? "Request timeout: The server took too long to respond"
        : "Network error: Unable to reach the server";

      return Promise.reject(new ApiError(message, 0));
    }

    // Handle other errors (error setting up request)
    const message = error.message || "An unexpected error occurred";
    return Promise.reject(new ApiError(message, 0));
  },
);
