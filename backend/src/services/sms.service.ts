import axios from "axios";

import { normalizeEthiopianMobilePhone } from "../utils/phone.js";

const SMS_API = process.env.SMS_API ?? "";
const SMS_TOKEN = process.env.SMS_TOKEN ?? "";
const SENDER_NAME = process.env.SENDER_NAME ?? "";
const CALLBACK = process.env.CALLBACK ?? "";

export interface SMSResult {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * The gateway expects the international MSISDN form `2519XXXXXXXX` (no `+`, no
 * leading `0`). Call sites are inconsistent — some pass the stored/normalized
 * number, others pass raw user input like `0912…` or `+2519…` — so normalize
 * here to guarantee every message goes out in the one format the gateway
 * accepts. If the number isn't a recognizable Ethiopian mobile, fall back to a
 * digit-only version rather than silently dropping the send.
 */
function toGatewayMsisdn(phoneNumber: string): string {
  const normalized = normalizeEthiopianMobilePhone(phoneNumber);
  if (normalized) return normalized;
  const digits = phoneNumber.replace(/\D/g, "");
  console.warn(
    `SMS: "${phoneNumber}" is not a valid Ethiopian mobile number; sending to "${digits}" as-is`,
  );
  return digits;
}

export async function sendSMS(
  phoneNumber: string,
  text: string,
): Promise<SMSResult> {
  if (!SMS_API || !SMS_TOKEN) {
    console.error("SMS_API or SMS_TOKEN is not configured in environment");
    return { success: false, message: "SMS service is not configured" };
  }

  const payload: Record<string, string> = {
    msisdn: toGatewayMsisdn(phoneNumber),
    text,
  };

  if (SENDER_NAME) payload.sender = SENDER_NAME;
  if (CALLBACK) payload.callback = CALLBACK;

  try {
    const response = await axios.post(SMS_API, payload, {
      headers: {
        KEY: SMS_TOKEN,
        "Content-Type": "application/json",
      },
      timeout: 10_000,
    });

    return { success: true, message: "SMS sent successfully", data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data ?? error.message;
      console.error("SMS API error:", detail);
      return {
        success: false,
        message:
          typeof error.response?.data?.message === "string"
            ? error.response.data.message
            : error.message,
      };
    }
    console.error("Unexpected SMS error:", error);
    return { success: false, message: "Failed to send SMS" };
  }
}

export async function sendBulkSMS(
  phoneNumbers: string[],
  text: string,
): Promise<SMSResult[]> {
  return Promise.all(phoneNumbers.map((num) => sendSMS(num, text)));
}
