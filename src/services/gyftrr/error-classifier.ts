import { generateStructuredOutput } from "@/lib/llm/gemini";
import { z } from "zod";
import { ErrorResponse } from "./client";

export enum PaymentLinkErrorType {
  MONTHLY_LIMIT_EXCEEDED = "MONTHLY_LIMIT_EXCEEDED",
  RATE_LIMITED = "RATE_LIMITED",
  OTHER = "OTHER",
}

const ErrorClassificationSchema = z.object({
  type: z.enum([
    PaymentLinkErrorType.MONTHLY_LIMIT_EXCEEDED,
    PaymentLinkErrorType.RATE_LIMITED,
    PaymentLinkErrorType.OTHER,
  ]),
  reason: z.string(),
});

export async function classifyPaymentLinkError(
  errorResponse: ErrorResponse,
): Promise<{ type: PaymentLinkErrorType; reason: string }> {
  const systemPrompt = `You are an error classifier for payment link creation errors. 
Classify the error response into one of these categories:
- MONTHLY_LIMIT_EXCEEDED: User has exceeded monthly purchase limit
- RATE_LIMITED: Too many requests, temporary rate limiting
- OTHER: Any other error

Focus on the error message content to determine the type.`;

  const userPrompt = `Classify this error response:
${JSON.stringify(errorResponse, null, 2)}`;

  try {
    const result = await generateStructuredOutput(
      systemPrompt,
      userPrompt,
      ErrorClassificationSchema,
    );

    return (
      result || {
        type: PaymentLinkErrorType.OTHER,
        reason: "Classification failed",
      }
    );
  } catch (error) {
    console.error("Error classifying payment link error:", error);
    return {
      type: PaymentLinkErrorType.OTHER,
      reason: "Classification failed",
    };
  }
}
