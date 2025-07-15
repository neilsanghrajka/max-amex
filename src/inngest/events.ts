import { PaymentInitiateSchema } from "@/inngest/payment/types";
import {
  OtpReceivedSchema,
  OtpWaitRequestedSchema,
  OtpWaitCompletedSchema,
} from "@/inngest/otp/types";
import {
  GyftrLoginRequestedSchema,
  GyftrLoginCompletedSchema,
} from "@/inngest/gyftrr-login/types";
import {
  AmazonLoginRequestedSchema,
  AmazonRedeemRequestedSchema,
} from "@/inngest/amazon/types";

export const EventNames = {
  PAYMENT_INITIATE: "payment/initiate",
  OTP_RECEIVED: "otp/received",
  OTP_WAIT_REQUESTED: "otp/wait.requested",
  OTP_WAIT_COMPLETED: "otp/wait.completed",
  GYFTR_LOGIN_REQUESTED: "gyftr/login.requested",
  GYFTR_LOGIN_COMPLETED: "gyftr/login.completed",
  AMAZON_LOGIN_REQUESTED: "amazon/login.requested",
  AMAZON_REDEEM_REQUESTED: "amazon/redeem.requested",
} as const;

// Event Schema Definitions
// ----------------------------------------
export const AppEventSchemas = {
  [EventNames.PAYMENT_INITIATE]: PaymentInitiateSchema,
  [EventNames.OTP_RECEIVED]: OtpReceivedSchema,
  [EventNames.OTP_WAIT_REQUESTED]: OtpWaitRequestedSchema,
  [EventNames.OTP_WAIT_COMPLETED]: OtpWaitCompletedSchema,
  [EventNames.GYFTR_LOGIN_REQUESTED]: GyftrLoginRequestedSchema,
  [EventNames.GYFTR_LOGIN_COMPLETED]: GyftrLoginCompletedSchema,
  [EventNames.AMAZON_LOGIN_REQUESTED]: AmazonLoginRequestedSchema,
  [EventNames.AMAZON_REDEEM_REQUESTED]: AmazonRedeemRequestedSchema,
};
