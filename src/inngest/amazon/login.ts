import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import { AmazonLoginRequestedSchema, AmazonLoginRequestedType } from "./types";

const AMAZON_LOGIN_REQUESTED_EVENT = EventNames.AMAZON_LOGIN_REQUESTED;

// EVENT HANDLER
const handler: EventHandler<
  typeof AMAZON_LOGIN_REQUESTED_EVENT,
  typeof AmazonLoginRequestedSchema
> = async (data: AmazonLoginRequestedType, step) => {
  console.log("Amazon login requested - barebones function executed");
  console.log(data, step);
  return { success: true, message: "Amazon login function completed" };
};

// EVENT FUNCTION
export const amazonLoginRequestedEventHandler = createEventHandler<
  typeof AMAZON_LOGIN_REQUESTED_EVENT,
  typeof AmazonLoginRequestedSchema
>(
  AMAZON_LOGIN_REQUESTED_EVENT,
  "amazon-login-requested",
  { limit: 1 }, // Allow only one Amazon login at a time
  3, // Retry count
  AmazonLoginRequestedSchema,
  handler,
);
