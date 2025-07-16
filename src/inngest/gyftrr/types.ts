import { z } from "zod";

export const GyftrrLoginSchema = z.object({
  email: z.email(),
  mobile: z.string().min(10).max(10),
});

export type GyftrrLoginType = z.infer<typeof GyftrrLoginSchema>;

export const GyftrrLoginResultSchema = z.object({
  auth_token: z.string().nullable(),
});

export type GyftrrLoginResult = z.infer<typeof GyftrrLoginResultSchema>;

export const GyftrrPurchaseVoucherSchema = z.object({
  jobId: z.number(),
  ordinal: z.number(),
});

export type GyftrrPurchaseVoucherType = z.infer<
  typeof GyftrrPurchaseVoucherSchema
>;

export const GyftrrPurchaseVoucherResultSchema = z.object({
  success: z.boolean(),
  jobId: z.number(),
  ordinal: z.number(),
});

export type GyftrrPurchaseVoucherResult = z.infer<
  typeof GyftrrPurchaseVoucherResultSchema
>;
