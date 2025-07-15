import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import { AmazonRedeemSchema, AmazonRedeemType } from "./types";

const AMAZON_REDEEM_EVENT = EventNames.AMAZON_REDEEM;

// EVENT HANDLER
const handler: EventHandler<
  typeof AMAZON_REDEEM_EVENT,
  typeof AmazonRedeemSchema
> = async (data: AmazonRedeemType, step) => {
  await step.run("log-start", async () => {
    console.log(`Amazon redeem for job ${data.jobId}, ordinal ${data.ordinal}, voucher: ${data.voucherCode}`);
    return { logged: true };
  });

  await step.sleep("amazon-redeem-processing", "3s");

  await step.run("log-completion", async () => {
    console.log(`Amazon redeem completed for voucher ${data.voucherCode}`);
    return { logged: true };
  });

  return { 
    success: true, 
    message: "Amazon redeem function completed",
    jobId: data.jobId,
    ordinal: data.ordinal,
    voucherCode: data.voucherCode
  };
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
