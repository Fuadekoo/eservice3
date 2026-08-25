import { prisma } from "../lib/db.js";
import { sendSMS as smsSend } from "../services/sms.service.js";

export const REQUEST_NUMBER_PREFIX = "REQ";

/** `20260825` — the key a day's counter row is stored under. */
export function requestNumberDayKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

/** `REQ-20260825-` for the given day — the part every number for that day shares. */
export function requestNumberPrefixFor(date: Date): string {
  return `${REQUEST_NUMBER_PREFIX}-${requestNumberDayKey(date)}-`;
}

/** True for strings shaped like REQ-YYYYMMDD-NNNNN, so a lookup can branch on it. */
export function isRequestNumber(value: string): boolean {
  return /^REQ-\d{8}-\d{5}$/i.test(value.trim());
}

/** Upper-cases and trims a user-typed number so lookups are forgiving. */
export function normalizeRequestNumber(value: string): string {
  return value.trim().toUpperCase();
}

/**
 * Generate the next request number for a given day.
 *
 * Format: REQ-YYYYMMDD-NNNNN (e.g. REQ-20260825-00001)
 *
 * The sequence comes from a dedicated counter row rather than from counting or
 * scanning existing requests. Counting breaks the moment a request is deleted —
 * it would re-issue a number that already exists — and reading the current
 * maximum lets simultaneous applications read the same value and collide.
 * `INSERT … ON DUPLICATE KEY UPDATE` bumps and reads the counter in one
 * statement, so the database serialises the allocation for us.
 *
 * `LAST_INSERT_ID(expr)` is per-connection, so the write and the read-back must
 * share one; the interactive transaction pins the connection for both.
 */
export async function generateRequestNumber(
  when: Date = new Date(),
): Promise<string> {
  const day = requestNumberDayKey(when);

  const sequence = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO \`request_sequence\` (\`id\`, \`seq\`)
      VALUES (${day}, LAST_INSERT_ID(1))
      ON DUPLICATE KEY UPDATE \`seq\` = LAST_INSERT_ID(\`seq\` + 1)
    `;

    const rows = await tx.$queryRaw<
      Array<{ seq: bigint | number }>
    >`SELECT LAST_INSERT_ID() AS \`seq\``;

    return Number(rows[0]?.seq ?? 0);
  });

  return `${REQUEST_NUMBER_PREFIX}-${day}-${String(sequence).padStart(5, "0")}`;
}

/**
 * Send SMS notification
 * TODO: Integrate with your SMS provider (Twilio, AWS SNS, etc.)
 * @param phoneNumber - Phone number to send SMS to
 * @param message - SMS message content
 */
export async function sendSMS(
  phoneNumber: string,
  message: string,
): Promise<void> {
  await smsSend(phoneNumber, message);
}

/**
 * Send email notification
 * TODO: Integrate with your email provider
 * @param email - Email address to send to
 * @param subject - Email subject
 * @param body - Email body
 */
export async function sendEmail(
  email: string,
  subject: string,
  body: string,
): Promise<void> {
  // TODO: Implement email sending with your provider
  console.log(`📧 Email to ${email}: ${subject}`, body);

  // Example with Nodemailer or SendGrid:
  // await transporter.sendMail({
  //   from: process.env.EMAIL_FROM,
  //   to: email,
  //   subject,
  //   html: body,
  // });
}
