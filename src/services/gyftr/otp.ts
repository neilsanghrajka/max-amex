import { db } from "@/db";
import { smsWebhooks } from "@/db/schema/smsWebhooks";
import { desc, gte, and, like } from "drizzle-orm";

export enum Portal {
  GYFTR_AMEX_REWARDS_MULTIPLIER = "GYFTR_AMEX_REWARDS_MULTIPLIER",
  AMAZON = "AMAZON",
  JUSPAY = "JUSPAY",
}

export enum OTPType {
  ACCOUNT_LOGIN = "ACCOUNT_LOGIN",
  PAYMENT_CONFIRMATION = "PAYMENT_CONFIRMATION",
}

export interface OTPResult {
  otp: string;
  message: string;
  timestamp: string;
  portal: Portal;
  otpType: OTPType;
}

/**
 * Extract OTP from SMS message based on portal and type
 */
function extractOtpFromMessage(message: string): string | null {
  // Common OTP patterns
  const patterns = [
    /(\d{6})/g, // 6-digit OTP
    /(\d{4})/g, // 4-digit OTP
    /OTP[:\s]*(\d{4,6})/gi, // OTP: followed by digits
    /code[:\s]*(\d{4,6})/gi, // Code: followed by digits
  ];

  // Try each pattern
  for (const pattern of patterns) {
    const matches = message.match(pattern);
    if (matches) {
      // Return the first match that looks like an OTP
      const potentialOtp = matches[0].replace(/\D/g, "");
      if (potentialOtp.length >= 4 && potentialOtp.length <= 6) {
        return potentialOtp;
      }
    }
  }

  return null;
}

/**
 * Determine portal and OTP type from SMS message content
 */
function classifyOtpMessage(
  message: string,
): { portal: Portal; otpType: OTPType } | null {
  const lowerMessage = message.toLowerCase();

  // Gyftr patterns
  if (lowerMessage.includes("gyftr") || lowerMessage.includes("reward")) {
    return {
      portal: Portal.GYFTR_AMEX_REWARDS_MULTIPLIER,
      otpType: OTPType.ACCOUNT_LOGIN,
    };
  }

  // Amazon patterns
  if (lowerMessage.includes("amazon")) {
    return {
      portal: Portal.AMAZON,
      otpType: OTPType.ACCOUNT_LOGIN,
    };
  }

  // Juspay/Payment patterns
  if (lowerMessage.includes("juspay") || lowerMessage.includes("payment")) {
    return {
      portal: Portal.JUSPAY,
      otpType: OTPType.PAYMENT_CONFIRMATION,
    };
  }

  // Default to Gyftr login if we can't classify
  return {
    portal: Portal.GYFTR_AMEX_REWARDS_MULTIPLIER,
    otpType: OTPType.ACCOUNT_LOGIN,
  };
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

        // Classify the message
        const classification = classifyOtpMessage(message);
        if (!classification) continue;

        // Check if this matches our target portal and type
        if (
          classification.portal === portal &&
          classification.otpType === otpType
        ) {
          // Extract OTP
          const otp = extractOtpFromMessage(message);

          if (otp) {
            console.log(`Found OTP: ${otp} from ${portal}`);
            return {
              otp,
              message,
              timestamp: smsRecord.createdAt,
              portal,
              otpType,
            };
          }
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
