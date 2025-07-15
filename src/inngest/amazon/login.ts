import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import { AmazonLoginSchema, AmazonLoginType } from "./types";

const AMAZON_LOGIN_EVENT = EventNames.AMAZON_LOGIN;

// EVENT HANDLER
const handler: EventHandler<
  typeof AMAZON_LOGIN_EVENT,
  typeof AmazonLoginSchema
> = async (data: AmazonLoginType, step) => {
  console.log("Amazon login - barebones function executed");
  console.log(data, step);
  return { success: true, message: "Amazon login function completed" };
};

// EVENT FUNCTION
export const amazonLoginEventHandler = createEventHandler<
  typeof AMAZON_LOGIN_EVENT,
  typeof AmazonLoginSchema
>(
  AMAZON_LOGIN_EVENT,
  "amazon-login",
  { limit: 1 }, // Allow only one Amazon login at a time
  3, // Retry count
  AmazonLoginSchema,
  handler,
);
