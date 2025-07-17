import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import {
  PurchaseSchema,
  PurchaseResultSchema,
} from "@/inngest/bulk-purchase/types";
import { gyftrrPurchaseVoucherEventHandler } from "@/inngest/gyftrr/purchase-voucher";
import { amazonRedeemEventHandler } from "@/inngest/amazon/redeem";

const PURCHASE_EVENT = EventNames.PURCHASE;

// EVENT HANDLER
const handler: EventHandler<
  typeof PURCHASE_EVENT,
  typeof PurchaseSchema,
  typeof PurchaseResultSchema
> = async (data, step) => {
  await step.run("log-start", async () => {
    console.log(`Purchase ${data.index} for job ${data.jobId}`);
    return { logged: true };
  });

  await step.run("generate-payment-link", async () => {
    const paymentLink = `https://gyftr.com/payment/voucher-${data.jobId}-${data.index}`;
    console.log(
      `Generated payment link for purchase ${data.index}: ${paymentLink}`,
    );
    return { paymentLink };
  });

  await step.invoke("gyftrr-purchase-voucher", {
    function: gyftrrPurchaseVoucherEventHandler,
    data: {
      jobId: data.jobId,
      index: data.index,
    },
  });

  // Hard-coded voucher codes for now (in real implementation, these would come from elsewhere)
  const voucherCodes = [
    `VOUCHER-${data.jobId}-${data.index}-1`,
    `VOUCHER-${data.jobId}-${data.index}-2`,
  ];

  await step.run("log-voucher-codes", async () => {
    console.log(
      `Generated voucher codes for purchase ${data.index}:`,
      voucherCodes,
    );
    return { voucherCodes };
  });

  // Sequential redeem loop: redeem each voucher one after another
  for (let i = 0; i < voucherCodes.length; i++) {
    await step.invoke(`redeem-${i + 1}`, {
      function: amazonRedeemEventHandler,
      data: {
        jobId: data.jobId,
        index: data.index,
        voucherCode: voucherCodes[i],
      },
    });
  }

  await step.sleep("dummy-wait", "5s");

  await step.run("log-completion", async () => {
    console.log(`Purchase ${data.index} for job ${data.jobId} completed`);
    return { logged: true };
  });

  return {
    success: true,
    index: data.index,
    jobId: data.jobId,
    voucherCodes,
  };
};

// EVENT FUNCTION
export const purchaseEventHandler = createEventHandler<
  typeof PURCHASE_EVENT,
  typeof PurchaseSchema,
  typeof PurchaseResultSchema
>(
  PURCHASE_EVENT,
  PURCHASE_EVENT,
  { limit: 1 },
  3,
  PurchaseSchema,
  handler,
  PurchaseResultSchema,
);
