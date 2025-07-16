import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import { GetOtpSchema, GetOtpRequest, OtpStep, OtpResultSchema } from "./types";
import { getOtp } from "@/services/otp";
import { RetryAfterError } from "inngest";

const GET_OTP_EVENT = EventNames.OTP_GET;

// EVENT HANDLER
const handler: EventHandler<
  typeof GET_OTP_EVENT,
  typeof GetOtpSchema,
  typeof OtpResultSchema
> = async (data: GetOtpRequest, step: OtpStep) => {
  // Add step to console log first
  await step.run("Log", async () => {
    console.log("Getting OTP for", data);
  });

  // Attempt to get OTP from service
  const otp = await step.run("Get OTP", async () => {
    return await getOtp(
      data.senderPhone,
      data.startTime,
      data.portal,
      data.otpType,
    );
  });

  // If no OTP found, throw error and tell Inngest to retry after 10 seconds
  if (!otp) {
    throw new RetryAfterError(
      "No OTP found",
      10 * 1000, // Retry every 10 seconds
    );
  }

  return otp; // TODO: Add return type to the function and to EventHandler
};

// EVENT FUNCTION
export const getOtpEventHandler = createEventHandler<
  typeof GET_OTP_EVENT,
  typeof GetOtpSchema,
  typeof OtpResultSchema
>(
  GET_OTP_EVENT,
  GET_OTP_EVENT,
  {
    limit: 1,
    key: `event.data.senderPhone + "-" + event.data.portal + "-" + event.data.otpType`,
  }, // Allow one OTP get per phone + portal + type combination
  10, // Retry count
  GetOtpSchema,
  handler,
  OtpResultSchema,
);
