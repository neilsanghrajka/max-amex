// Create a client to send and receive events

import { paymentInitiatedEventHandler } from "@/inngest/payment";
import { inngest, sendEvent } from "@/inngest/client";

export const ALL_HANDLERS = [paymentInitiatedEventHandler];

export { inngest, sendEvent };
