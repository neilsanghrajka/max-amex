import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import { BulkPurchaseInitiateSchema } from "@/inngest/bulk-purchase/types";
import { amazonLoginEventHandler } from "@/inngest/amazon";
import { gyftrrLoginEventHandler } from "@/inngest/gyftrr";
import { purchaseEventHandler } from "@/inngest/bulk-purchase/purchase";

const BULK_PURCHASE_INITIATE_EVENT = EventNames.BULK_PURCHASE_INITIATE;

// EVENT HANDLER
const handler: EventHandler<
  typeof BULK_PURCHASE_INITIATE_EVENT,
  typeof BulkPurchaseInitiateSchema
> = async (data, step) => {
   // Invoke Amazon and Gyftr login functions in parallel
  const amazonLoginPromise = step.invoke("amazon-login", {
    function: amazonLoginEventHandler,
    data: {},
  });

  const gyftrLoginPromise = step.invoke("gyftr-login", {
    function: gyftrrLoginEventHandler,
    data: {},
  });

  await Promise.all([amazonLoginPromise, gyftrLoginPromise]);
 
  // PURCHASE
  // ----------------------------------------
  const PURCHASE_COUNT = 4;

  // Sequential fan-out: invoke each purchase one after another
  for (let i = 0; i < PURCHASE_COUNT; i++) {
    await step.invoke(`purchase-${i + 1}`, {
      function: purchaseEventHandler,
      data: {
        jobId: data.jobId,
        ordinal: i + 1,
      },
    });
  }

  return { message: "Bulk purchase completed", jobId: data.jobId, purchaseCount: PURCHASE_COUNT };
};

// EVENT FUNCTION
export const bulkPurchaseInitiatedEventHandler = createEventHandler<
  typeof BULK_PURCHASE_INITIATE_EVENT,
  typeof BulkPurchaseInitiateSchema
>(
  BULK_PURCHASE_INITIATE_EVENT,
  "bulk-purchase-initiate",
  { limit: 1, key: "event.data.jobId" },
  1,
  BulkPurchaseInitiateSchema,
  handler,
);
