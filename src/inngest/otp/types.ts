import { z } from "zod";

export const OtpReceivedSchema = z.object({
  jobId: z.number(),
  otp: z.string(),
});

export type OtpReceivedType = z.infer<typeof OtpReceivedSchema>;
