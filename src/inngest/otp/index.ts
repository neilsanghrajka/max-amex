import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import { OtpWaitRequestedSchema, OtpWaitRequestedType } from "./types";
import {
  getOtpWithExponentialBackoff,
  Portal,
  OTPType,
} from "@/services/gyftr/otp";

const OTP_WAIT_REQUESTED_EVENT = EventNames.OTP_WAIT_REQUESTED;

// EVENT HANDLER
const handler: EventHandler<
  typeof OTP_WAIT_REQUESTED_EVENT,
  typeof OtpWaitRequestedSchema
> = async (data: OtpWaitRequestedType, step) => {
  const { jobId, senderPhone, portal, otpType, startTime, maxRetries } = data;

  console.log(
    `Starting OTP wait for job ${jobId}, portal: ${portal}, type: ${otpType}`,
  );

  const otpResult = await step.run("wait-for-otp", async () => {
    return await getOtpWithExponentialBackoff(
      senderPhone,
      new Date(startTime),
      portal as Portal,
      otpType as OTPType,
      maxRetries,
    );
  });

  const success = !!otpResult;
  const result = {
    jobId,
    success,
    otp: otpResult?.otp,
    message: success ? "OTP received successfully" : "Failed to receive OTP",
    error: success ? undefined : "OTP timeout or not found",
  };

  // Send completion event
  await step.sendEvent("otp-wait-completed", {
    name: EventNames.OTP_WAIT_COMPLETED,
    data: result,
  });

  return result;
};

// EVENT FUNCTION
export const otpWaitRequestedEventHandler = createEventHandler<
  typeof OTP_WAIT_REQUESTED_EVENT,
  typeof OtpWaitRequestedSchema
>(
  OTP_WAIT_REQUESTED_EVENT,
  "otp-wait-requested",
  { limit: 10 }, // Allow multiple OTP waits in parallel
  3, // Retry count
  OtpWaitRequestedSchema,
  handler,
);
