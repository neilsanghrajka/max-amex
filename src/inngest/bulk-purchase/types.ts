import { z } from "zod";
import { type GetStepTools } from "inngest";
import { inngest } from "@/inngest/client";
import { EventNames } from "@/inngest/events";
import { GyftrrSession, User } from "@/inngest/types";
import { PaymentLinkErrorType, VoucherBrand } from "@/services/gyftrr/utils";

export const BulkPurchaseInitiateSchema = z.object({
  jobId: z.number(),
});

export type BulkPurchaseInitiateType = z.infer<
  typeof BulkPurchaseInitiateSchema
>;

export const BulkPurchaseInitiateResultSchema = z.object({
  jobId: z.number(),
});

export type BulkPurchaseInitiateResult = z.infer<
  typeof BulkPurchaseInitiateResultSchema
>;

export const PurchaseSchema = z.object({
  jobId: z.number(),
  index: z.number(),
  paymentLink: z.string(),
  gyftrrSession: GyftrrSession,
  user: User,
  details: z.object({
    totalAmount: z.number(),
    brand: z.enum(Object.values(VoucherBrand)),
  }),
});

export type PurchaseType = z.infer<typeof PurchaseSchema>;

export const PurchaseResultSchema = z.object({
  success: z.boolean(),
  index: z.number(),
  jobId: z.number(),
  voucherCodes: z.array(z.string()),
});

export type PurchaseResult = z.infer<typeof PurchaseResultSchema>;

export type BulkPurchaseStep = GetStepTools<
  typeof inngest,
  typeof EventNames.BULK_PURCHASE_INITIATE
>;

// Initiate Payment Schema
export const InitiatePaymentSchema = z.object({
  jobId: z.number(),
  index: z.number(),
  gyftrrSession: GyftrrSession,
  user: User,
  details: z.object({
    totalAmount: z.number(),
    brand: z.enum(Object.values(VoucherBrand)),
  }),
});

export const InitiatePaymentResultSchema = z.object({
  success: z.boolean(),
  paymentLink: z.string().optional(),
  errorType: z.enum(Object.values(PaymentLinkErrorType)).optional(),
  jobId: z.number(),
  index: z.number(),
});

export type InitiatePaymentType = z.infer<typeof InitiatePaymentSchema>;
export type InitiatePaymentResultType = z.infer<
  typeof InitiatePaymentResultSchema
>;
