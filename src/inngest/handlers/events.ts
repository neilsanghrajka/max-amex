import { z } from "zod";

// Schemas
// ----------------------------------------
export const PaymentInitiateSchema = z.object({
  jobId: z.number(),
});

export const OtpReceivedSchema = z.object({
  jobId: z.number(),
  otp: z.string(),
});

export const EventNames = {
  PAYMENT_INITIATE: "payment/initiate",
  OTP_RECEIVED: "otp/received",
} as const;
// ----------------------------------------

// Event Definitions
// ----------------------------------------
export const eventSchemas = {
  [EventNames.PAYMENT_INITIATE]: {
    data: PaymentInitiateSchema,
  },
  [EventNames.OTP_RECEIVED]: {
    data: OtpReceivedSchema,
  },
};
// ----------------------------------------

// Export a single type for all events, to be used in the Inngest client
export type AppEventSchemas = typeof eventSchemas;
