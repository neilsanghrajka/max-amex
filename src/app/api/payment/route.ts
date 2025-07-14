import { route } from "@/lib/api/route";
import {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
} from "@/app/api/payment/types";
import { User } from "@supabase/supabase-js";
import { db } from "@/db";
import { paymentJobTable } from "@/db/schema/paymentJob";

export const POST = route(
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  async (_request: InitiatePaymentRequest, _user: User) => {
    // Insert Row into the DB
    console.log("Received Payment Request for user", _user.id, _request);
    const [job] = await db
      .insert(paymentJobTable)
      .values({
        amount: _request.amount,
        quantity: _request.quantity,
        status: "pending",
      })
      .returning({ id: paymentJobTable.id });

    // TODO: Initiate Ingress Job
    // await sendPaymentEvent(job.id);

    // TODO: Return the jobId
    return { jobId: job.id.toString() };
  },
);
