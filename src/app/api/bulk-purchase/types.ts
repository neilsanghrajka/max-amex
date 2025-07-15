import { z } from "zod";

// TypeScript interfaces for the bulk purchase route
enum CardType {
  MRCC = "MRCC",
  Gold = "Gold",
}

// Request Schema
export const InitiateBulkPurchaseRequest = z.object({
  cardType: z.enum(CardType),
  quantity: z.number().min(1).max(6),
  amount: z.number().refine((val: number) => val === 1000 || val === 1500, {
    message: "Amount must be either 1000 or 1500",
  }),
});

export type InitiateBulkPurchaseRequest = z.infer<
  typeof InitiateBulkPurchaseRequest
>;

// Response Schema
export const InitiateBulkPurchaseResponse = z.object({
  jobId: z.string(),
});

const ErrorResponse = z.object({
  error: z.string(),
});

export type InitiateBulkPurchaseResponse = z.infer<
  typeof InitiateBulkPurchaseResponse
>;
export type ErrorResponse = z.infer<typeof ErrorResponse>;

// Every endpoint has a request, error response, and success response.
// Every endpoint needs to validate user.
