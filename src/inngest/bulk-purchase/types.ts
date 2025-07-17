import { z } from "zod";
import { type GetStepTools } from "inngest";
import { inngest } from "@/inngest/client";
import { EventNames } from "@/inngest/events";
import { GyftrrSession, User } from "@/inngest/types";
import { VoucherBrand } from "@/services/gyftrr/utils";

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
