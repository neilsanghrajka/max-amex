import { z } from "zod";
import { type GetStepTools } from "inngest";
import { inngest } from "@/inngest/client";
import { EventNames } from "@/inngest/events";

export const PaymentInitiateSchema = z.object({
  jobId: z.number(),
});

export type PaymentInitiateType = z.infer<typeof PaymentInitiateSchema>;

export enum STEPS {
  AMAZON_LOGIN = "amazon-login",
  GYFTR_LOGIN = "gyft-login",
}

export type PaymentStep = GetStepTools<
  typeof inngest,
  typeof EventNames.PAYMENT_INITIATE
>;
