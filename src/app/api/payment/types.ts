import { z } from "zod";

// TypeScript interfaces for the payment route
enum CardType {
  MRCC = "MRCC",
  Gold = "Gold",
}

// Request Schema
export const InitiatePaymentRequest = z.object({
  cardType: z.enum(CardType),
  quantity: z.number().min(1).max(6),
  amount: z.number().refine((val: number) => val === 1000 || val === 1500, {
    message: "Amount must be either 1000 or 1500",
  }),
});

export type InitiatePaymentRequest = z.infer<typeof InitiatePaymentRequest>;

// Response Schema
export const InitiatePaymentResponse = z.object({
  jobId: z.string(),
});

const ErrorResponse = z.object({
  error: z.string(),
});

export type InitiatePaymentResponse = z.infer<typeof InitiatePaymentResponse>;
export type ErrorResponse = z.infer<typeof ErrorResponse>;

// Every endpoint has a request, error response, and success response.
// Every endpoint needs to validate user.
