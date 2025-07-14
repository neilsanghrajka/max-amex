// Create a client to send and receive events

import { paymentInitiatedEventHandler } from "./handlers/payment";
import { inngest, sendEvent } from "./client";

export const ALL_HANDLERS = [paymentInitiatedEventHandler];

export { inngest, sendEvent };
