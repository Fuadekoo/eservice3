/**
 * Returns the API base URL, resolved from environment variables with
 * sensible fallbacks for both browser and server-side contexts.
 *
 * Priority:
 *  1. NEXT_PUBLIC_API_BASE_URL  (explicit config)
 *  2. Browser: same-origin /back-api  (behind nginx / reverse proxy)
 *  3. Server-side: http://localhost:4000/back-api  (local dev backend)
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined") {
    return "/back-api";
  }
  return process.env.API_BASE_URL ?? "http://localhost:4000/back-api";
}
