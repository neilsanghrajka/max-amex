import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import { PurchaseSchema } from "@/inngest/bulk-purchase/types";

const PURCHASE_EVENT = EventNames.PURCHASE;

// EVENT HANDLER
const handler: EventHandler<
  typeof PURCHASE_EVENT,
  typeof PurchaseSchema
> = async (data, step) => {
  await step.run("log-start", async () => {
    console.log(`Purchase ${data.ordinal} for job ${data.jobId}`);
    return { logged: true };
  });

  await step.sleep("dummy-wait", "5s");

  await step.run("log-completion", async () => {
    console.log(`Purchase ${data.ordinal} for job ${data.jobId} completed`);
    return { logged: true };
  });

  return { success: true, ordinal: data.ordinal, jobId: data.jobId };
};

// EVENT FUNCTION
export const purchaseEventHandler = createEventHandler<
  typeof PURCHASE_EVENT,
  typeof PurchaseSchema
>(
  PURCHASE_EVENT,
  "purchase",
  { limit: 1 },
  3,
  PurchaseSchema,
  handler,
); 