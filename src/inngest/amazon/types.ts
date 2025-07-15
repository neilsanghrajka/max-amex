import { z } from "zod";

export const AmazonLoginSchema = z.object({});

export type AmazonLoginType = z.infer<typeof AmazonLoginSchema>;

export const AmazonRedeemSchema = z.object({
  jobId: z.number(),
  ordinal: z.number(),
  voucherCode: z.string(),
});

export type AmazonRedeemType = z.infer<typeof AmazonRedeemSchema>;
