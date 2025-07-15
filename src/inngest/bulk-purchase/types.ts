import { z } from "zod";
import { type GetStepTools } from "inngest";
import { inngest } from "@/inngest/client";
import { EventNames } from "@/inngest/events";

export const BulkPurchaseInitiateSchema = z.object({
  jobId: z.number(),
});

export type BulkPurchaseInitiateType = z.infer<
  typeof BulkPurchaseInitiateSchema
>;

export const PurchaseSchema = z.object({
  jobId: z.number(),
  ordinal: z.number(),
});

export type PurchaseType = z.infer<typeof PurchaseSchema>;

export type BulkPurchaseStep = GetStepTools<
  typeof inngest,
  typeof EventNames.BULK_PURCHASE_INITIATE
>;
