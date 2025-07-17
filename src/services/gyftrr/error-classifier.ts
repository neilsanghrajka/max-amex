import { generateStructuredOutput } from "@/lib/llm/gemini";
import { z } from "zod";
import { ErrorResponse } from "./client";
import { PaymentLinkErrorType } from "./utils";

const ErrorClassificationSchema = z.object({
  type: z.enum(Object.values(PaymentLinkErrorType)),
});

export async function classifyPaymentLinkError(
  errorResponse: ErrorResponse,
): Promise<PaymentLinkErrorType> {
  const systemPrompt = `You are an error classifier for payment link creation errors. 
Classify the error response into one of these categories:
- MONTHLY_LIMIT_EXCEEDED: User has exceeded monthly purchase limit
- RATE_LIMITED: Too many requests, temporary rate limiting
- OTHER: Any other error

Focus on the error message content to determine the type.`;

  const userPrompt = `Classify this error response:
${JSON.stringify(errorResponse, null, 2)}`;

  const result = await generateStructuredOutput(
    systemPrompt,
    userPrompt,
    ErrorClassificationSchema,
  );

  return result?.type || PaymentLinkErrorType.OTHER;
}
