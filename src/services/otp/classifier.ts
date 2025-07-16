import { z } from "zod";
import { generateStructuredOutput } from "@/lib/llm/client";
import { Portal, OTPType } from "./types";
import { SmsWebhook } from "@/db/schema/smsWebhooks";

const OTPSchema = z.object({
  otp: z.string()
    .min(4)
    .max(8)
    .describe("The one-time password code"),
  portal: z.enum(["amex", "amazon", "amex_rewards_multiplier"])
    .describe("The portal/service that sent the OTP. Options: amex (American Express), amazon (Amazon), amex_rewards_multiplier (American Express Rewards Multiplier powered by Gyftr)"),
  otp_type: z.enum(["transaction", "login"])
    .describe("The type of OTP. Options: transaction (Transaction related OTP like 'Your Amex SafeKey One-Time Password for INR 2.00, at CRED is 269510. Valid for 10 mins for Card ending 11006. Do not disclose it to anyone.'), login (Login related OTP like '632226 is your Amazon OTP. Do not share it with anyone')"),
  raw_message: z.string()
    .describe("The raw message that was sent by the portal"),
});

export type OTPExtraction = z.infer<typeof OTPSchema>;

/**
 * Build the system prompt
 */
const SYSTEM_PROMPT = `
You are an OTP extraction specialist. Your task is to find the latest OTP (One-Time Password) from SMS messages.

Rules:
2. Focus on the most recent message if multiple are provided
3. Return ONLY the OTP digits, nothing else from the message
`;


/**
 * Build the user prompt with messages and filtering criteria
 */
function buildUserPrompt(
  messages: SmsWebhook[],
  portal: Portal,
  otpType: OTPType,
  additionalPrompt?: string,
): string {
  let prompt = `Here are the messages:
    <messages>
    ${JSON.stringify(messages, null, 2)}
    </messages>

    We are looking for the latest OTP from the messages that was sent by the portal: ${portal}
    And of OTP type: ${otpType}

    If you cannot find matching OTP for BOTH THE PORTAL AND OTP TYPE, return None. DO NOT MAKE UP A MATCH JUST TO RETURN A VALUE.

    `;

      if (additionalPrompt) {
        prompt += `Additionally, we want to filter by:
    <prompt>
    ${additionalPrompt}
    </prompt>
    `;
  }

  return prompt;
}


export async function extractOtpFromMessage(
  messages: SmsWebhook[],
  portal: Portal,
  otpType: OTPType,
  additionalPrompt?: string,
): Promise<OTPExtraction | null> {
  const userPrompt = buildUserPrompt(
    messages,
    portal,
    otpType,
    additionalPrompt,
  );

  try {
    const result = await generateStructuredOutput(
      SYSTEM_PROMPT,
      userPrompt,
      OTPSchema,
      "otp_extraction",
    );

    // Validate that the extracted portal and type match what we're looking for
    if (result.portal === portal && result.otp_type === otpType && result.otp) {
      return result;
    }

    return null;
  } catch (error) {
    console.error("Error extracting OTP with LLM:", error);
    return null;
  }
}
