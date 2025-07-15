import { z } from "zod";

export const AmazonLoginSchema = z.object({});

export type AmazonLoginType = z.infer<
  typeof AmazonLoginSchema
>;

export const AmazonRedeemSchema = z.object({});

export type AmazonRedeemType = z.infer<
  typeof AmazonRedeemSchema
>;
