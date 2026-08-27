import { z } from "zod";

/**
 * What counts as a person's name.
 *
 * The rule is a whitelist of letters rather than a blacklist of digits, so it
 * also turns away symbols like `@` or `#`. It is deliberately Unicode-aware:
 * this system runs in English, Amharic and Afaan Oromoo, so `ሰላም` must be as
 * valid as `Selam`, and Oromo names carrying an apostrophe (`Dhaba'a`) must be
 * accepted too. A Latin-only `[A-Za-z]` rule would reject most real users.
 *
 * Allowed: any Unicode letter or combining mark, plus spaces, hyphens,
 * apostrophes (straight and typographic) and full stops for initials.
 * Rejected: every numeral — Latin `123`, Arabic-Indic `١٢٣` and Ge'ez `፩፪፫`
 * are all outside `\p{L}` — and any other symbol.
 *
 * Must begin with a letter, so " -x" or "'" alone cannot pass.
 */
export const PERSON_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u;

export const PERSON_NAME_MESSAGE =
  "Name may only contain letters, spaces, hyphens and apostrophes.";

/** True when `value` is shaped like a person's name. */
export function isPersonName(value: string): boolean {
  return PERSON_NAME_PATTERN.test(value.trim());
}

/**
 * A required name part: non-blank, no digits, at most 100 characters.
 *
 * `.trim()` runs before every check, so "   " and " John123 " both fail.
 */
export function requiredNameField(label: string) {
  return z
    .string({ error: label + " is required." })
    .trim()
    .min(1, label + " is required.")
    .max(100, label + " must be 100 characters or fewer.")
    .regex(PERSON_NAME_PATTERN, label + " may only contain letters, spaces, hyphens and apostrophes.");
}

/** Same rules, but the field may be omitted entirely (partial updates). */
export function optionalNameField(label: string) {
  return requiredNameField(label).optional();
}
