import {
  BulkPurchaseInitiateSchema,
  InitiatePaymentSchema,
  PurchaseSchema,
} from "@/inngest/bulk-purchase/types";
import { OtpReceivedSchema, GetOtpSchema } from "@/inngest/otp/types";

import { AmazonLoginSchema, AmazonRedeemSchema } from "@/inngest/amazon/types";
import {
  GyftrrLoginSchema,
  GyftrrPurchaseVoucherSchema,
} from "@/inngest/gyftrr/types";

export const EventNames = {
  BULK_PURCHASE_INITIATE: "bulk-purchase/initiate",
  PURCHASE: "bulk-purchase/purchase",
  INITIATE_PAYMENT: "bulk-purchase/initiate-payment",
  OTP_RECEIVED: "otp/received",
  OTP_GET: "otp/get",
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
  [EventNames.AMAZON_LOGIN]: AmazonLoginSchema,
  [EventNames.AMAZON_REDEEM]: AmazonRedeemSchema,
  [EventNames.GYFTRR_LOGIN]: GyftrrLoginSchema,
  [EventNames.GYFTRR_PURCHASE_VOUCHER]: GyftrrPurchaseVoucherSchema,
  [EventNames.INITIATE_PAYMENT]: InitiatePaymentSchema,
};
