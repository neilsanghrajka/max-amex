import { route } from "@/lib/api/route";
import {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
} from "@/app/api/payment/types";
import { User } from "@supabase/supabase-js";
import { db } from "@/db";
import { paymentJobTable } from "@/db/schema/paymentJob";
import { EventNames } from "@/inngest/events";
import { inngest } from "@/inngest/client";

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

    await inngest.send({
      name: EventNames.PAYMENT_INITIATE,
      data: {
      jobId: job.id,
      },
    });

    // TODO: Return the jobId
    return { jobId: job.id.toString() };
  },
);
