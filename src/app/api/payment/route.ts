import { route } from "@/lib/api/route";
import {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
} from "@/app/api/payment/types";
import { User } from "@supabase/supabase-js";

export const POST = route(
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  async (request: InitiatePaymentRequest, user: User) => {
    // TODO: Add a row in the DB for the payment.

    // TOOD: Initiate ingess job
    // TODO: Return the jobId
    return { jobId: "123" };
  },
);
