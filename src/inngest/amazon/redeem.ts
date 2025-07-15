import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import {
  AmazonRedeemRequestedSchema,
  AmazonRedeemRequestedType,
} from "./types";

const AMAZON_REDEEM_REQUESTED_EVENT = EventNames.AMAZON_REDEEM_REQUESTED;

// EVENT HANDLER
const handler: EventHandler<
  typeof AMAZON_REDEEM_REQUESTED_EVENT,
  typeof AmazonRedeemRequestedSchema
> = async (data: AmazonRedeemRequestedType, step) => {
  console.log("Amazon redeem requested - barebones function executed");
  console.log(data, step);
  return { success: true, message: "Amazon redeem function completed" };
};

// EVENT FUNCTION
export const amazonRedeemRequestedEventHandler = createEventHandler<
  typeof AMAZON_REDEEM_REQUESTED_EVENT,
  typeof AmazonRedeemRequestedSchema
>(
  AMAZON_REDEEM_REQUESTED_EVENT,
  "amazon-redeem-requested",
  { limit: 1 }, // Allow only one Amazon redeem at a time
  3, // Retry count
  AmazonRedeemRequestedSchema,
  handler,
);
