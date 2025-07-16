import { z } from 'zod';
import { generateStructuredOutput } from '@/lib/llm/client';
import { Portal, OTPType } from './otp';

const OTPSchema = z.object({
  otp: z.string().min(4).max(8),
  portal: z.enum(['amex', 'amazon', 'amex_rewards_multiplier']),
  otp_type: z.enum(['transaction', 'login']),
  raw_message: z.string(),
});

export type OTPExtraction = z.infer<typeof OTPSchema>;

/**
 * Build the system prompt
 */
function buildSystemPrompt(): string {
  return `You are an OTP extraction specialist. Your task is to find the latest OTP (One-Time Password) from SMS messages.

Rules:
2. Focus on the most recent message if multiple are provided
3. Return ONLY the OTP digits, nothing else from the message`;
}

/**
 * Build the user prompt with message and filtering criteria 
 */
function buildUserPrompt(
  message: string,
  portal: Portal,
  otpType: OTPType,
  additionalPrompt?: string
): string {
  let prompt = `Here are the messages:
<messages>
${message}
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

/**
 * Extract OTP from SMS message using LLM
 */
export async function extractOtpFromMessage(
  message: string,
  portal: Portal,
  otpType: OTPType,
  additionalPrompt?: string
): Promise<OTPExtraction | null> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(message, portal, otpType, additionalPrompt);

  try {
    const result = await generateStructuredOutput(
      systemPrompt,
      userPrompt,
      OTPSchema,
      "otp_extraction"
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

/**
 * Legacy function for backward compatibility - now uses LLM extraction
 */
export async function classifyOtpMessage(message: string): Promise<{
  portal: Portal;
  otpType: OTPType;
  confidence: number;
}> {
  // For backward compatibility, we'll try to extract with default assumptions
  // This is a simplified version that tries common patterns
  
  // Try GYFTR first (most common)
  try {
    const result = await extractOtpFromMessage(
      message,
      Portal.GYFTR_AMEX_REWARDS_MULTIPLIER,
      OTPType.ACCOUNT_LOGIN
    );
    if (result) {
      return {
        portal: Portal[result.portal.toUpperCase() as keyof typeof Portal] || Portal.GYFTR_AMEX_REWARDS_MULTIPLIER,
        otpType: result.otp_type === 'transaction' ? OTPType.CARD_TRANSACTION : OTPType.ACCOUNT_LOGIN,
        confidence: 0.8, // Default confidence
      };
    }
  } catch (error) {
    console.warn('Failed to extract with GYFTR assumption:', error);
  }

  // Try Amazon
  try {
    const result = await extractOtpFromMessage(
      message,
      Portal.AMAZON,
      OTPType.ACCOUNT_LOGIN
    );
    if (result) {
      return {
        portal: Portal[result.portal.toUpperCase() as keyof typeof Portal] || Portal.AMAZON,
        otpType: result.otp_type === 'transaction' ? OTPType.CARD_TRANSACTION : OTPType.ACCOUNT_LOGIN,
        confidence: 0.8,
      };
    }
  } catch (error) {
    console.warn('Failed to extract with Amazon assumption:', error);
  }

  // Default fallback
  throw new Error('Could not classify OTP message');
} 