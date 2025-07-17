import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import {
  AmazonLoginSchema,
  AmazonLoginType,
  AmazonLoginResultSchema,
} from "./types";

const AMAZON_LOGIN_EVENT = EventNames.AMAZON_LOGIN;

// EVENT HANDLER
const handler: EventHandler<
  typeof AMAZON_LOGIN_EVENT,
  typeof AmazonLoginSchema,
  typeof AmazonLoginResultSchema
> = async (data: AmazonLoginType, step) => {
  console.log("Amazon login - barebones function executed");
  console.log(data, step);
  return { success: true };
};

// EVENT FUNCTION
export const amazonLoginEventHandler = createEventHandler<
  typeof AMAZON_LOGIN_EVENT,
  typeof AmazonLoginSchema,
  typeof AmazonLoginResultSchema
>(
  AMAZON_LOGIN_EVENT,
  AMAZON_LOGIN_EVENT,
  { limit: 1 }, // Allow only one Amazon login at a time
  AmazonLoginSchema,
  handler,
  AmazonLoginResultSchema,
);
