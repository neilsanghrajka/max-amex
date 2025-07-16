import {
  BulkPurchaseInitiateSchema,
  PurchaseSchema,
} from "@/inngest/bulk-purchase/types";
import { OtpReceivedSchema, GetOtpSchema } from "@/inngest/otp/types";
import {
  GyftrLoginRequestedSchema,
  GyftrLoginCompletedSchema,
} from "@/inngest/gyftrr-old/types";
import { AmazonLoginSchema, AmazonRedeemSchema } from "@/inngest/amazon/types";
import {
  GyftrrLoginSchema,
  GyftrrPurchaseVoucherSchema,
} from "@/inngest/gyftrr/types";

export const EventNames = {
  BULK_PURCHASE_INITIATE: "bulk-purchase/initiate",
  PURCHASE: "bulk-purchase/purchase",
  OTP_RECEIVED: "otp/received",
  OTP_GET: "otp/get",
  GYFTR_LOGIN_REQUESTED: "gyftr/login.requested",
  GYFTR_LOGIN_COMPLETED: "gyftr/login.completed",
  AMAZON_LOGIN: "amazon/login",
  AMAZON_REDEEM: "amazon/redeem",
  GYFTRR_LOGIN: "gyftrr/login",
  GYFTRR_PURCHASE_VOUCHER: "gyftrr/purchase-voucher",
} as const;

// Event Schema Definitions
// ----------------------------------------
export const AppEventSchemas = {
  [EventNames.BULK_PURCHASE_INITIATE]: BulkPurchaseInitiateSchema,
  [EventNames.PURCHASE]: PurchaseSchema,
  [EventNames.OTP_RECEIVED]: OtpReceivedSchema,
  [EventNames.OTP_GET]: GetOtpSchema,
  [EventNames.GYFTR_LOGIN_REQUESTED]: GyftrLoginRequestedSchema,
  [EventNames.GYFTR_LOGIN_COMPLETED]: GyftrLoginCompletedSchema,
  [EventNames.AMAZON_LOGIN]: AmazonLoginSchema,
  [EventNames.AMAZON_REDEEM]: AmazonRedeemSchema,
  [EventNames.GYFTRR_LOGIN]: GyftrrLoginSchema,
  [EventNames.GYFTRR_PURCHASE_VOUCHER]: GyftrrPurchaseVoucherSchema,
};
