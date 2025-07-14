import { db } from "@/db";
import { paymentJobTable } from "@/db/schema/";
import { eq } from "drizzle-orm";
import { createEventHandler, EventHandler } from "@/inngest/handlers/factory";
import { PaymentInitiateSchema, EventNames } from "@/inngest/handlers/events";

const PAYMENT_INITIATE_EVENT = EventNames.PAYMENT_INITIATE;

// EVENT HANDLER
const handler: EventHandler<
  typeof PAYMENT_INITIATE_EVENT,
  typeof PaymentInitiateSchema
> = async (data, step) => {
  const job = await step.run("get-job", async () => {
    const j = await db.query.paymentJobTable.findFirst({
      where: eq(paymentJobTable.id, data.jobId),
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
      .update(paymentJobTable)
      .set({ status: "completed" })
      .where(eq(paymentJobTable.id, data.jobId));
  });

  return { message: `Processed job ${job.id}!` };
};

// EVENT FUNCTION
export const paymentInitiatedEventHandler = createEventHandler<
  typeof PAYMENT_INITIATE_EVENT,
  typeof PaymentInitiateSchema
>(
  PAYMENT_INITIATE_EVENT,
  "payment-initiate",
  { limit: 1, key: "event.data.jobId" },
  1,
  PaymentInitiateSchema,
  handler,
);
