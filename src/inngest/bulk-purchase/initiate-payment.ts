import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import {
  InitiatePaymentSchema,
  InitiatePaymentType,
  InitiatePaymentResultSchema,
} from "@/inngest/bulk-purchase/types";
import { initiatePayment } from "@/services/gyftrr";

const INITIATE_PAYMENT_EVENT = EventNames.INITIATE_PAYMENT;

// EVENT HANDLER
const handler: EventHandler<
  typeof INITIATE_PAYMENT_EVENT,
  typeof InitiatePaymentSchema,
  typeof InitiatePaymentResultSchema
> = async (data: InitiatePaymentType, step) => {
  const { gyftrrSession, user, details } = data;

  // Create Payment Link
  const paymentLink = await step.run("Generate Payment Link", async () => {
    return await initiatePayment(
      gyftrrSession.authToken,
      details.totalAmount,
      user.email,
      user.mobileNumber,
      details.brand,
    );
  });

  // TODO: Handle the error of limit exceeded.

  return {
    success: true,
    paymentLink,
    jobId: data.jobId,
    index: data.index,
  };
};

// EVENT FUNCTION
export const initiatePaymentEventHandler = createEventHandler<
  typeof INITIATE_PAYMENT_EVENT,
  typeof InitiatePaymentSchema,
  typeof InitiatePaymentResultSchema
>(
  INITIATE_PAYMENT_EVENT,
  INITIATE_PAYMENT_EVENT,
  { limit: 6, key: "event.data.jobId" }, // Allow up to 6 concurrent payment initiations per job
  InitiatePaymentSchema,
  handler,
  InitiatePaymentResultSchema,
);
