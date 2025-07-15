// Create a client to send and receive events

import { paymentInitiatedEventHandler } from "@/inngest/payment";
import { gyftrLoginRequestedEventHandler } from "@/inngest/gyftrr-old";
import { otpWaitRequestedEventHandler } from "@/inngest/otp";
import {
  amazonLoginEventHandler,
  amazonRedeemEventHandler,
} from "@/inngest/amazon";
import {
  gyftrrLoginEventHandler,
  gyftrrPurchaseVoucherEventHandler,
} from "@/inngest/gyftrr";
import { inngest } from "@/inngest/client";

export const ALL_HANDLERS = [
  paymentInitiatedEventHandler,
  gyftrLoginRequestedEventHandler,
  otpWaitRequestedEventHandler,
  amazonLoginEventHandler,
  amazonRedeemEventHandler,
  gyftrrLoginEventHandler,
  gyftrrPurchaseVoucherEventHandler,
];

export { inngest };
