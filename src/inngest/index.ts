// Create a client to send and receive events

import { EventSchemas, Inngest } from "inngest";
import { EventName } from "./handlers/events";
import {
  paymentInitiatedEventHandler,
  PaymentInitiateSchema,
} from "./handlers/payment";
import { z } from "zod";

type Events = {
  [EventName.PAYMENT_INITIATE]: {
    data: z.infer<typeof PaymentInitiateSchema>;
  };
};

export const inngest = new Inngest({
  id: "max-amex",
  schemas: new EventSchemas().fromRecord<Events>(),
});

export const ALL_HANDLERS = [paymentInitiatedEventHandler];

export const sendEvent = inngest.send;
