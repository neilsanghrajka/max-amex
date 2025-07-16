import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import { GetOtpSchema, GetOtpType } from "./types";

const GET_OTP_EVENT = EventNames.OTP_GET;

// EVENT HANDLER
const handler: EventHandler<typeof GET_OTP_EVENT, typeof GetOtpSchema> = async (
  data: GetOtpType,
  step,
) => {
  // TODO: Implement with exponential backoff and retries.
  console.log(data, step);
};

// EVENT FUNCTION
export const getOtpEventHandler = createEventHandler<
  typeof GET_OTP_EVENT,
  typeof GetOtpSchema
>(
  GET_OTP_EVENT,
  GET_OTP_EVENT,
  { limit: 10 }, // Allow multiple OTP gets in parallel
  3, // Retry count
  GetOtpSchema,
  handler,
);
