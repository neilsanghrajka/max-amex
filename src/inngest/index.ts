// Create a client to send and receive events

import { paymentInitiatedEventHandler } from "@/inngest/payment";
import { gyftrLoginRequestedEventHandler } from "@/inngest/gyftrr-login";
import { otpWaitRequestedEventHandler } from "@/inngest/otp";
import {
  amazonLoginRequestedEventHandler,
  amazonRedeemRequestedEventHandler,
} from "@/inngest/amazon";
import { inngest } from "@/inngest/client";

export const ALL_HANDLERS = [
  paymentInitiatedEventHandler,
  gyftrLoginRequestedEventHandler,
  otpWaitRequestedEventHandler,
  amazonLoginRequestedEventHandler,
  amazonRedeemRequestedEventHandler,
];

export { inngest };
