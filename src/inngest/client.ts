// Create a client to send and receive events
import { EventSchemas, Inngest } from "inngest";
import { AppEventSchemas } from "@/inngest/events";
import { z } from "zod";

// All event payloads
type Events = {
  [K in keyof typeof AppEventSchemas]: {
    data: z.infer<typeof AppEventSchemas[K]>;
  };
};

export const inngest = new Inngest({
  id: "max-amex",
  schemas: new EventSchemas().fromRecord<Events>(),
});

export const sendEvent = inngest.send;
