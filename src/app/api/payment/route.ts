import { route } from "@/lib/api/route";
import {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
} from "@/app/api/payment/types";
import { User } from "@supabase/supabase-js";

export const POST = route(
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  async (_request: InitiatePaymentRequest, _user: User) => {
    // TODO: Add a row in the DB for the payment.

    // TOOD: Initiate ingess job
    // TODO: Return the jobId
    console.log(_user);
    return { jobId: "123" };
  },
);
