
// Create a client to send and receive events

import { EventSchemas, Inngest } from "inngest";
import { PaymentInitiateEvent } from "@/inngest/functions/payment";


export type InngestEvents = {
    "payment/initiate": PaymentInitiateEvent;
};


export const inngest = new Inngest({
  id: "max-amex",
  schemas: new EventSchemas().fromRecord<InngestEvents>(),
});

