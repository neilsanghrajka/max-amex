import { z } from "zod";

export const GyftrrLoginSchema = z.object({
  email: z.email(),
  mobile: z.string().min(10).max(10),
});

export type GyftrrLoginType = z.infer<typeof GyftrrLoginSchema>;

export const GyftrrPurchaseVoucherSchema = z.object({
  jobId: z.number(),
  ordinal: z.number(),
});

export type GyftrrPurchaseVoucherType = z.infer<
  typeof GyftrrPurchaseVoucherSchema
>;
