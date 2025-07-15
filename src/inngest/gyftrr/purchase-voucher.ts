import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import {
  GyftrrPurchaseVoucherSchema,
  GyftrrPurchaseVoucherType,
} from "./types";

const GYFTRR_PURCHASE_VOUCHER_EVENT = EventNames.GYFTRR_PURCHASE_VOUCHER;

// EVENT HANDLER
const handler: EventHandler<
  typeof GYFTRR_PURCHASE_VOUCHER_EVENT,
  typeof GyftrrPurchaseVoucherSchema
> = async (data: GyftrrPurchaseVoucherType, step) => {
  await step.run("log-start", async () => {
    console.log(
      `Gyftrr purchase voucher for job ${data.jobId}, ordinal ${data.ordinal}`,
    );
    return { logged: true };
  });

  await step.sleep("gyftrr-processing", "5s");

  await step.run("log-completion", async () => {
    console.log(
      `Gyftrr purchase voucher completed for job ${data.jobId}, ordinal ${data.ordinal}`,
    );
    return { logged: true };
  });

  return {
    success: true,
    message: "Gyftrr purchase voucher function completed",
    jobId: data.jobId,
    ordinal: data.ordinal,
  };
};

// EVENT FUNCTION
export const gyftrrPurchaseVoucherEventHandler = createEventHandler<
  typeof GYFTRR_PURCHASE_VOUCHER_EVENT,
  typeof GyftrrPurchaseVoucherSchema
>(
  GYFTRR_PURCHASE_VOUCHER_EVENT,
  "gyftrr-purchase-voucher",
  { limit: 1 }, // Allow only one Gyftrr purchase voucher at a time
  3, // Retry count
  GyftrrPurchaseVoucherSchema,
  handler,
);
