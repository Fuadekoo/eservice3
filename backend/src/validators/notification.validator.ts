import { z } from "zod";

/**
 * A PushSubscription as the browser serialises it.
 *
 * The endpoint is capped at the column width rather than left unbounded: an
 * over-long value would be truncated on write and become permanently
 * undeliverable, so it is better rejected at the door with a clear message.
 * `expirationTime` is accepted and ignored — browsers send it, nothing uses it.
 */
export const subscribeSchema = z.object({
  endpoint: z
    .string()
    .trim()
    .url("Endpoint must be a valid URL.")
    .max(512, "Endpoint is too long to store."),
  expirationTime: z.union([z.number(), z.null()]).optional(),
  keys: z.object({
    p256dh: z
      .string()
      .trim()
      .min(1, "keys.p256dh is required.")
      .max(255, "keys.p256dh is too long."),
    auth: z
      .string()
      .trim()
      .min(1, "keys.auth is required.")
      .max(255, "keys.auth is too long."),
  }),
});

export const unsubscribeSchema = z.object({
  endpoint: z.string().trim().min(1, "Endpoint is required."),
});

/**
 * Build validation error from Zod error
 */
export function buildValidationError(
  error: z.ZodError,
): Record<string, string> {
  const result: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    result[path || "general"] = issue.message;
  });
  return result;
}
