import { db } from "@/db";
import { bulkPurchaseJobTable } from "@/db/schema/";
import { eq } from "drizzle-orm";
import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import { BulkPurchaseInitiateSchema } from "@/inngest/bulk-purchase/types";

const BULK_PURCHASE_INITIATE_EVENT = EventNames.BULK_PURCHASE_INITIATE;

// EVENT HANDLER
const handler: EventHandler<
  typeof BULK_PURCHASE_INITIATE_EVENT,
  typeof BulkPurchaseInitiateSchema
> = async (data, step) => {
  const job = await step.run("get-job", async () => {
    const j = await db.query.bulkPurchaseJobTable.findFirst({
      where: eq(bulkPurchaseJobTable.id, data.jobId),
    });
    return j;
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.status !== "pending") {
    // Or handle as you see fit
    console.log(`Job ${job.id} already processed with status: ${job.status}`);
    return { message: "Job already processed" };
  }

  await step.sleep("wait-a-moment", "1s");

  await step.run("update-job-status", async () => {
    await db
      .update(bulkPurchaseJobTable)
      .set({ status: "completed" })
      .where(eq(bulkPurchaseJobTable.id, data.jobId));
  });

  return { message: `Processed job ${job.id}!` };
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
