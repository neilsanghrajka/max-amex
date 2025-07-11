import { inngest } from "@/inngest/client";

import { db } from "@/db";
import { paymentJobTable } from "@/db/schema/";
import { eq } from "drizzle-orm";


export type PaymentInitiateEvent = {
  data: {
      jobId: number;
  };
};

export const payment = inngest.createFunction(
  { id: "payment", concurrency: { key: "event.data.jobId", limit: 1 }, retries: 1 },
  { event: "payment/initiate" },
  async ({ event, step }) => {
    console.log("Received job", event.data.jobId);
  
    const job = await step.run("get-job", async () => {
      const j = await db.query.paymentJobTable.findFirst({
        where: eq(paymentJobTable.id, event.data.jobId),
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
        .where(eq(paymentJobTable.id, event.data.jobId));
    });
  
  
    return { message: `Processed job ${job.id}!` };
  },
);


export const sendPaymentEvent = async (jobId: number) => {
  await inngest.send({
    name: "payment/initiate",
    data: {
      jobId: jobId,
    },
  });
};