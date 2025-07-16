// Create a client to send and receive events

import { bulkPurchaseInitiatedEventHandler } from "@/inngest/bulk-purchase";
import { purchaseEventHandler } from "@/inngest/bulk-purchase/purchase";
import { getOtpEventHandler } from "@/inngest/otp";
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
  getOtpEventHandler,
  amazonLoginEventHandler,
  amazonRedeemEventHandler,
  gyftrrLoginEventHandler,
  gyftrrPurchaseVoucherEventHandler,
];

export { inngest };
