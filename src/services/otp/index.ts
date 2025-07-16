import { db } from "@/db";
import { smsWebhooks, SmsWebhook } from "@/db/schema/smsWebhooks";
import { desc, gte, and, like } from "drizzle-orm";
import { extractOtpFromMessage } from "./classifier";
import { Portal, OTPType, OTPResult } from "./types";

export async function getOtp(
  senderPhone: string,
  startDateUtc: string,
  portal: Portal,
  otpType: OTPType,
): Promise<OTPResult | null> {
  try {
    const messages = await getAllMessagesInTimeRange(senderPhone, startDateUtc);
    console.log("Messages: ", messages);

    const otp = await findTheCorrectOtp(messages, portal, otpType);
    console.log("OTP: ", otp);

    return otp;
  } catch (error) {
    console.error(`Error getting OTP: ${error}`);
    return null;
  }
}

/**
 * Get all messages in time range from database
 */
async function getAllMessagesInTimeRange(
  senderPhone: string,
  startDate: string,
): Promise<SmsWebhook[]> {
  const response = await db
    .select()
    .from(smsWebhooks)
    .where(
      and(
        gte(smsWebhooks.createdAt, startDate),
        like(smsWebhooks.senderPhone, `%${senderPhone}%`),
      ),
    )
    .orderBy(desc(smsWebhooks.createdAt));

  console.log("Received messages from database: ", response);
  return response;
}

async function findTheCorrectOtp(
  messages: SmsWebhook[],
  portal: Portal,
  otpType: OTPType,
): Promise<OTPResult | null> {
  if (!messages.length) {
    return null;
  }

  try {
    // Pass raw messages to LLM for extraction
    const extraction = await extractOtpFromMessage(messages, portal, otpType);
    console.log("Extracted OTP from LLM: ", extraction);

    if (extraction && extraction.otp) {
      return {
        otp: extraction.otp,
        message: extraction.raw_message,
        timestamp: new Date().toISOString(),
        portal,
        otpType,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error extracting OTP with LLM: ${error}`);
    throw error;
  }
}
