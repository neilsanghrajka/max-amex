import { db } from "@/db";
import { smsWebhooks } from "@/db/schema/smsWebhooks";
import { desc, gte, and, like } from "drizzle-orm";
import { extractOtpFromMessage as extractOtpWithLLM } from "./otp-classifier";

export enum Portal {
  AMEX = "amex",
  AMAZON = "amazon",
  GYFTR_AMEX_REWARDS_MULTIPLIER = "amex_rewards_multiplier",
}

export enum OTPType {
  CARD_TRANSACTION = "transaction",
  ACCOUNT_LOGIN = "login",
}

export interface OTPResult {
  otp: string;
  message: string;
  timestamp: string;
  portal: Portal;
  otpType: OTPType;
}

/**
 * Poll the SMS webhooks table for OTP messages
 */
export async function getOtpFromSms(
  senderPhone: string,
  startDateUtc: Date,
  portal: Portal,
  otpType: OTPType,
  maxRetries: number = 5,
  retryDelayMs: number = 10000,
): Promise<OTPResult | null> {
  console.log(`Polling for OTP from ${portal} for ${otpType}`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Attempt ${attempt}/${maxRetries} - Checking for OTP...`);

    try {
      // Query recent SMS messages
      const recentMessages = await db
        .select()
        .from(smsWebhooks)
        .where(
          and(
            gte(smsWebhooks.createdAt, startDateUtc.toISOString()),
            like(smsWebhooks.senderPhone, `%${senderPhone}%`),
          ),
        )
        .orderBy(desc(smsWebhooks.createdAt))
        .limit(10);

      console.log(`Found ${recentMessages.length} recent SMS messages`);

      // Check each message for OTP
      for (const smsRecord of recentMessages) {
        const rawData = smsRecord.raw as Record<string, unknown>;
        const message =
          (rawData?.message as string) || (rawData?.text as string) || "";

        if (!message) continue;

        try {
          // Extract OTP using LLM with exact portal and type matching
          const extraction = await extractOtpWithLLM(message, portal, otpType);

          if (extraction && extraction.otp) {
            console.log(
              `Found OTP: ${extraction.otp} from ${portal} (portal: ${extraction.portal}, type: ${extraction.otp_type})`,
            );
            return {
              otp: extraction.otp,
              message,
              timestamp: smsRecord.createdAt,
              portal,
              otpType,
            };
          }
        } catch (error) {
          console.error(`Error extracting OTP from message: ${error}`);
          // Continue to next message instead of failing entirely
          continue;
        }
      }

      // Wait before next attempt (except on last attempt)
      if (attempt < maxRetries) {
        console.log(`No OTP found, waiting ${retryDelayMs}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    } catch (error) {
      console.error(`Error polling for OTP (attempt ${attempt}):`, error);

      // Wait before retry on error
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  console.log(`Failed to find OTP after ${maxRetries} attempts`);
  return null;
}

/**
 * Wait for OTP using exponential backoff
 */
export async function getOtpWithExponentialBackoff(
  senderPhone: string,
  startDateUtc: Date,
  portal: Portal,
  otpType: OTPType,
  maxRetries: number = 5,
): Promise<OTPResult | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Cap at 30 seconds

    const result = await getOtpFromSms(
      senderPhone,
      startDateUtc,
      portal,
      otpType,
      1, // Single attempt per call
      0, // No delay within the single attempt
    );

    if (result) {
      return result;
    }

    // Wait with exponential backoff (except on last attempt)
    if (attempt < maxRetries) {
      console.log(`Waiting ${delayMs}ms before next attempt...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return null;
}
