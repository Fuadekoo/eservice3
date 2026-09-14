import type { ZodError } from "zod";

/**
 * The one shape a failed validation is reported in.
 *
 * Thirteen validators each carried their own `buildValidationError`, in two
 * incompatible flavours. Some returned `{ error, message, details[] }`; the
 * rest returned a bare `{ fieldName: message }` map. The browser reads an error
 * body looking for `message`, `error` or `details[]` — none of which exist in a
 * bare map — so every endpoint using the second flavour surfaced nothing but
 * "API request failed (400)". Submitting a service request with a date the
 * office is closed on, or a phone number in the wrong format, told the customer
 * only that something had failed. That is what "unhandled errors on
 * submission" was.
 *
 * This carries all three forms at once so nothing that already reads one of
 * them breaks:
 *
 *   - `message` — a sentence naming the actual problems, fit for a toast.
 *   - `details` — one entry per field, for messages beside the inputs.
 *   - `fields`  — the original field-keyed map.
 */
export type ValidationErrorPayload = {
  error: "ValidationError";
  message: string;
  details: Array<{ path: string; message: string }>;
  fields: Record<string, string>;
};

/**
 * Turn a Zod failure into something a person can act on.
 *
 * Only the first problem per field is reported: later issues on the same field
 * are usually consequences of the first, and listing them makes the toast
 * unreadable without telling the customer anything new.
 */
export function buildValidationError(error: ZodError): ValidationErrorPayload {
  const fields: Record<string, string> = {};
  const details: Array<{ path: string; message: string }> = [];

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "general";
    if (path in fields) continue;

    fields[path] = issue.message;
    details.push({ path, message: issue.message });
  }

  const message =
    details.map((detail) => detail.message).join(" ") ||
    "One or more fields are invalid.";

  return { error: "ValidationError", message, details, fields };
}
