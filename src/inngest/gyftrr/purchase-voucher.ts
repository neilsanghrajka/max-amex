import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import { GyftrrPurchaseVoucherSchema, GyftrrPurchaseVoucherType } from "./types";

const GYFTRR_PURCHASE_VOUCHER_EVENT = EventNames.GYFTRR_PURCHASE_VOUCHER;

// EVENT HANDLER
const handler: EventHandler<
  typeof GYFTRR_PURCHASE_VOUCHER_EVENT,
  typeof GyftrrPurchaseVoucherSchema
> = async (data: GyftrrPurchaseVoucherType, step) => {
  console.log("Gyftrr purchase voucher - barebones function executed");
  console.log(data, step);
  return { success: true, message: "Gyftrr purchase voucher function completed" };
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