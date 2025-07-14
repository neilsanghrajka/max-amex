// Create a client to send and receive events
import { EventSchemas, Inngest } from "inngest";
import { AppEventSchemas } from "@/inngest/handlers/events";

// All event payloads
type Events = {
  [K in keyof AppEventSchemas]: {
    data: AppEventSchemas[K]["data"];
  };
};

export const inngest = new Inngest({
  id: "max-amex",
  schemas: new EventSchemas().fromRecord<Events>(),
});

export const sendEvent = inngest.send; 