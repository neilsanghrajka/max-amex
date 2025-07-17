import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import {
  GyftrrPurchaseVoucherSchema,
  GyftrrPurchaseVoucherType,
  GyftrrPurchaseVoucherResultSchema,
} from "./types";

const GYFTRR_PURCHASE_VOUCHER_EVENT = EventNames.GYFTRR_PURCHASE_VOUCHER;

// EVENT HANDLER
const handler: EventHandler<
  typeof GYFTRR_PURCHASE_VOUCHER_EVENT,
  typeof GyftrrPurchaseVoucherSchema,
  typeof GyftrrPurchaseVoucherResultSchema
> = async (data: GyftrrPurchaseVoucherType, step) => {
  await step.run("log-start", async () => {
    console.log(
      `Gyftrr purchase voucher for job ${data.jobId}, index ${data.index}`,
    );
    return { logged: true };
  });

  await step.sleep("gyftrr-processing", "5s");

  await step.run("log-completion", async () => {
    console.log(
      `Gyftrr purchase voucher completed for job ${data.jobId}, index ${data.index}`,
    );
    return { logged: true };
  });

  return {
    success: true,
    jobId: data.jobId,
    index: data.index,
  };
};

// EVENT FUNCTION
export const gyftrrPurchaseVoucherEventHandler = createEventHandler<
  typeof GYFTRR_PURCHASE_VOUCHER_EVENT,
  typeof GyftrrPurchaseVoucherSchema,
  typeof GyftrrPurchaseVoucherResultSchema
>(
  GYFTRR_PURCHASE_VOUCHER_EVENT,
  GYFTRR_PURCHASE_VOUCHER_EVENT,
  { limit: 1 }, // Allow only one Gyftrr purchase voucher at a time
  3, // Retry count
  GyftrrPurchaseVoucherSchema,
  handler,
  GyftrrPurchaseVoucherResultSchema,
);
