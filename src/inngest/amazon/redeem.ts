import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import {
  AmazonRedeemSchema,
  AmazonRedeemType,
  AmazonRedeemResultSchema,
} from "./types";

const AMAZON_REDEEM_EVENT = EventNames.AMAZON_REDEEM;

// EVENT HANDLER
const handler: EventHandler<
  typeof AMAZON_REDEEM_EVENT,
  typeof AmazonRedeemSchema,
  typeof AmazonRedeemResultSchema
> = async (data: AmazonRedeemType, step) => {
  await step.run("log-start", async () => {
    console.log(
      `Amazon redeem for job ${data.jobId}, index ${data.index}, voucher: ${data.voucherCode}`,
    );
    return { logged: true };
  });

  await step.sleep("amazon-redeem-processing", "3s");

  await step.run("log-completion", async () => {
    console.log(`Amazon redeem completed for voucher ${data.voucherCode}`);
    return { logged: true };
  });

  return {
    success: true,
    jobId: data.jobId,
    index: data.index,
    voucherCode: data.voucherCode,
  };
};

// EVENT FUNCTION
export const amazonRedeemEventHandler = createEventHandler<
  typeof AMAZON_REDEEM_EVENT,
  typeof AmazonRedeemSchema,
  typeof AmazonRedeemResultSchema
>(
  AMAZON_REDEEM_EVENT,
  AMAZON_REDEEM_EVENT,
  { limit: 1 }, // Allow only one Amazon redeem at a time
  AmazonRedeemSchema,
  handler,
  AmazonRedeemResultSchema,
);
