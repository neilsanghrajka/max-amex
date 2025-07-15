// Create a client to send and receive events

import { bulkPurchaseInitiatedEventHandler } from "@/inngest/bulk-purchase";
import { purchaseEventHandler } from "@/inngest/bulk-purchase/purchase";
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
  bulkPurchaseInitiatedEventHandler,
  purchaseEventHandler,
  gyftrLoginRequestedEventHandler,
  otpWaitRequestedEventHandler,
  amazonLoginEventHandler,
  amazonRedeemEventHandler,
  gyftrrLoginEventHandler,
  gyftrrPurchaseVoucherEventHandler,
];

export { inngest };
