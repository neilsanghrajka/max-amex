import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import {
  AmazonRedeemSchema,
  AmazonRedeemType,
} from "./types";

const AMAZON_REDEEM_EVENT = EventNames.AMAZON_REDEEM;

// EVENT HANDLER
const handler: EventHandler<
  typeof AMAZON_REDEEM_EVENT,
  typeof AmazonRedeemSchema
> = async (data: AmazonRedeemType, step) => {
  console.log("Amazon redeem - barebones function executed");
  console.log(data, step);
  return { success: true, message: "Amazon redeem function completed" };
};

// EVENT FUNCTION
export const amazonRedeemEventHandler = createEventHandler<
  typeof AMAZON_REDEEM_EVENT,
  typeof AmazonRedeemSchema
>(
  AMAZON_REDEEM_EVENT,
  "amazon-redeem",
  { limit: 1 }, // Allow only one Amazon redeem at a time
  3, // Retry count
  AmazonRedeemSchema,
  handler,
);
