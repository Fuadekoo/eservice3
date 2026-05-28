import { prisma } from "../lib/db.js";

/**
 * Generate a unique request number
 * Format: REQ-YYYYMMDD-XXXXX (e.g., REQ-20260525-00001)
 */
export async function generateRequestNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");

  // Get the count of requests created today
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await prisma.request.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const sequenceNumber = (count + 1).toString().padStart(5, "0");
  return `REQ-${dateStr}-${sequenceNumber}`;
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
  // TODO: Implement SMS sending with your provider
  console.log(`📱 SMS to ${phoneNumber}:`, message);

  // Example with Twilio:
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({
  //   body: message,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phoneNumber,
  // });
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
