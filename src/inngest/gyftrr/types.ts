import { z } from "zod";

export const GyftrrLoginSchema = z.object({});

export type GyftrrLoginType = z.infer<typeof GyftrrLoginSchema>;

export const GyftrrPurchaseVoucherSchema = z.object({});

export type GyftrrPurchaseVoucherType = z.infer<
  typeof GyftrrPurchaseVoucherSchema
>;
