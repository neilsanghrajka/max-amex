import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import {
  BulkPurchaseInitiateSchema,
  BulkPurchaseInitiateResultSchema,
} from "@/inngest/bulk-purchase/types";
import { amazonLoginEventHandler } from "@/inngest/amazon";
import { gyftrrLoginEventHandler } from "@/inngest/gyftrr";
import { purchaseEventHandler } from "@/inngest/bulk-purchase/purchase";
import { initiatePaymentEventHandler } from "@/inngest/bulk-purchase/initiate-payment";
import { isPurchasePossible } from "@/services/gyftrr";
import { GyftrrSession, User } from "@/inngest/types";
import { PaymentLinkErrorType, VoucherBrand } from "@/services/gyftrr/utils";
import { NonRetriableError } from "inngest";

const BULK_PURCHASE_INITIATE_EVENT = EventNames.BULK_PURCHASE_INITIATE;

// const AMAZON_EMAIL = "sanghrajka.neil@gmail.com";
// const AMAZON_MOBILE = "8879472388";
const PURCHASE_COUNT = 4;
const TOTAL_AMOUNT = 1500;
const BRAND = VoucherBrand.AMAZON;

// TODO: In the future this should be fetched from DB.
const user = User.parse({
  email: "sanghrajka.neil@gmail.com",
  mobileNumber: "8879472388",
});

// EVENT HANDLER
const handler: EventHandler<
  typeof BULK_PURCHASE_INITIATE_EVENT,
  typeof BulkPurchaseInitiateSchema,
  typeof BulkPurchaseInitiateResultSchema
> = async (data, step) => {
  // Step 1: Check if there are vouchers even available
  const { possible, message } = await step.run(
    "Check GyftrrVoucher Inventory",
    async () => {
      const { possible, message } = await isPurchasePossible(
        TOTAL_AMOUNT,
        PURCHASE_COUNT,
        user.email,
        user.mobileNumber,
        BRAND,
      );
      return { possible, message };
    },
  );

  if (!possible) {
    console.log("Purchase is not possible:", message);
    return {
      jobId: data.jobId,
      // TODO: Return error message & status
    };
  }

  // Step 2:Invoke Amazon and Gyftr login functions in parallel
  const amazonLoginPromise = step.invoke("Amazon Login", {
    function: amazonLoginEventHandler,
    data: {},
  });

  const gyftrLoginPromise = step.invoke("Gyftrr Login", {
    function: gyftrrLoginEventHandler,
    data: {
      email: user.email,
      mobile: user.mobileNumber,
    },
  });

  const [amazonLoginResult, gyftrLoginResult] = await Promise.all([
    amazonLoginPromise,
    gyftrLoginPromise,
  ]);

  const gyftrrSession = await step.run("Get Session Details", async () => {
    console.log("amazonLoginResult", amazonLoginResult);

    const gyftrSession: GyftrrSession = {
      authToken: gyftrLoginResult.auth_token ?? "",
    };

    return gyftrSession;
  });

  // Step 3: Generate Payment Links
  // -------------------------------------
  const paymentLinks: string[] = [];
  for (let i = 0; i < PURCHASE_COUNT; i++) {
    const { paymentLink, errorType } = await step.invoke(
      `Initiate Payment ${i + 1}`,
      {
        function: initiatePaymentEventHandler,
        data: {
          jobId: data.jobId,
          index: i + 1,
          gyftrrSession,
          user,
          details: {
            totalAmount: TOTAL_AMOUNT,
            brand: BRAND,
          },
        },
      },
    );

    if (errorType === PaymentLinkErrorType.MONTHLY_LIMIT_EXCEEDED) {
      throw new NonRetriableError("Monthly limit exceeded", {
        cause: errorType,
      });
    } else if (errorType || !paymentLink) {
      throw new NonRetriableError("Failed to generate payment link", {
        cause: errorType,
      });
    } 

    paymentLinks.push(paymentLink);
  }

  // Step 4: Sequnetially process the purchases
  // --------------------------
  for (let i = 0; i < PURCHASE_COUNT; i++) {
    await step.invoke(`purchase-${i + 1}`, {
      function: purchaseEventHandler,
      data: {
        jobId: data.jobId,
        index: i + 1,
        paymentLink: paymentLinks[i] ?? "",
        gyftrrSession,
        user,
        details: {
          totalAmount: TOTAL_AMOUNT,
          brand: BRAND,
        },
      },
    });
  }

  return {
    jobId: data.jobId,
  };
};

// EVENT FUNCTION
export const bulkPurchaseInitiatedEventHandler = createEventHandler<
  typeof BULK_PURCHASE_INITIATE_EVENT,
  typeof BulkPurchaseInitiateSchema,
  typeof BulkPurchaseInitiateResultSchema
>(
  BULK_PURCHASE_INITIATE_EVENT,
  BULK_PURCHASE_INITIATE_EVENT,
  { limit: 1, key: "event.data.jobId" },
  BulkPurchaseInitiateSchema,
  handler,
  BulkPurchaseInitiateResultSchema,
);
