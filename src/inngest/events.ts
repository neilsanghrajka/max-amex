import {  PaymentInitiateSchema } from "@/inngest/payment/types";
import {  OtpReceivedSchema } from "@/inngest/otp/types";

export const EventNames = {
  PAYMENT_INITIATE: "payment/initiate",
  OTP_RECEIVED: "otp/received",
} as const;


// Event Schema Definitions
// ----------------------------------------
export const AppEventSchemas = {
  [EventNames.PAYMENT_INITIATE]: PaymentInitiateSchema,
  [EventNames.OTP_RECEIVED]: OtpReceivedSchema,
};


