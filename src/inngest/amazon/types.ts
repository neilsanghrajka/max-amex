import { z } from "zod";

export const AmazonLoginRequestedSchema = z.object({});

export type AmazonLoginRequestedType = z.infer<
  typeof AmazonLoginRequestedSchema
>;

export const AmazonRedeemRequestedSchema = z.object({});

export type AmazonRedeemRequestedType = z.infer<
  typeof AmazonRedeemRequestedSchema
>;
