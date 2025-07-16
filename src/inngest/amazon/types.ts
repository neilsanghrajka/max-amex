import { z } from "zod";

export const AmazonLoginSchema = z.object({});

export type AmazonLoginType = z.infer<typeof AmazonLoginSchema>;

export const AmazonLoginResultSchema = z.object({
  success: z.boolean(),
});

export type AmazonLoginResult = z.infer<typeof AmazonLoginResultSchema>;

export const AmazonRedeemSchema = z.object({
  jobId: z.number(),
  ordinal: z.number(),
  voucherCode: z.string(),
});

export type AmazonRedeemType = z.infer<typeof AmazonRedeemSchema>;

export const AmazonRedeemResultSchema = z.object({
  success: z.boolean(),
  jobId: z.number(),
  ordinal: z.number(),
  voucherCode: z.string(),
});

export type AmazonRedeemResult = z.infer<typeof AmazonRedeemResultSchema>;
