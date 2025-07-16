import { z } from "zod";

export const OtpReceivedSchema = z.object({
  jobId: z.number(),
  otp: z.string(),
});

export type OtpReceivedType = z.infer<typeof OtpReceivedSchema>;

export const GetOtpSchema = z.object({
  senderPhone: z.string(),
  portal: z.enum(["GYFTR_AMEX_REWARDS_MULTIPLIER", "AMAZON", "JUSPAY"]),
  otpType: z.enum(["ACCOUNT_LOGIN", "PAYMENT_CONFIRMATION"]),
  startTime: z.string(), // ISO date string // TODO: Look into this
});

export type GetOtpType = z.infer<typeof GetOtpSchema>;

export const OtpWaitCompletedSchema = z.object({
  jobId: z.number(),
  success: z.boolean(),
  otp: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type OtpWaitCompletedType = z.infer<typeof OtpWaitCompletedSchema>;
