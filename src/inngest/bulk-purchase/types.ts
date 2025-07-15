import { z } from "zod";
import { type GetStepTools } from "inngest";
import { inngest } from "@/inngest/client";
import { EventNames } from "@/inngest/events";

export const BulkPurchaseInitiateSchema = z.object({
  jobId: z.number(),
});

export type BulkPurchaseInitiateType = z.infer<typeof BulkPurchaseInitiateSchema>;

export enum STEPS {
  AMAZON_LOGIN = "amazon-login",
  GYFTR_LOGIN = "gyft-login",
}

export type BulkPurchaseStep = GetStepTools<
  typeof inngest,
  typeof EventNames.BULK_PURCHASE_INITIATE
>; 