import { OTPType, Portal } from "@/services/otp/types";
import { z } from "zod";
import { EventNames } from "../events";
import { GetStepTools } from "inngest";
import { inngest } from "../client";

export const OtpReceivedSchema = z.object({
  jobId: z.number(),
  otp: z.string(),
});

// Schema that matches the OTPResult interface returned by the OTP service.
export const OtpResultSchema = z.object({
  otp: z.string(),
  message: z.string(),
  timestamp: z.string(),
  portal: z.enum(Object.values(Portal)),
  otpType: z.enum(Object.values(OTPType)),
});

export type OtpResultType = z.infer<typeof OtpResultSchema>;

export const GetOtpSchema = z.object({
  senderPhone: z.string(),
  portal: z.enum(Object.values(Portal)),
  otpType: z.enum(Object.values(OTPType)),
  startTime: z.string(),
});

export type GetOtpRequest = z.infer<typeof GetOtpSchema>;
export type OtpStep = GetStepTools<typeof inngest, typeof EventNames.OTP_GET>;
