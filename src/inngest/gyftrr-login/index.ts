import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import { GyftrLoginRequestedSchema, GyftrLoginRequestedType } from "./types";
import { requestOtp, validateOtp, purchaseVouchers } from "@/services/gyftr";
import { Portal, OTPType } from "@/services/gyftr/otp";
import { OtpWaitCompletedType } from "@/inngest/otp/types";

const GYFTR_LOGIN_REQUESTED_EVENT = EventNames.GYFTR_LOGIN_REQUESTED;

// EVENT HANDLER
const handler: EventHandler<
  typeof GYFTR_LOGIN_REQUESTED_EVENT,
  typeof GyftrLoginRequestedSchema
> = async (data: GyftrLoginRequestedType, step) => {
  const { jobId, mobileNumber, email, amount, brand } = data;
  const sessionStartTime = new Date();

  console.log(`Starting Gyftr login for job ${jobId}`);

  try {
    // Step 1: Request OTP
    const otpRequested = await step.run("request-gyftr-otp", async () => {
      console.log("Requesting OTP for Gyftr authentication");
      return await requestOtp(mobileNumber, email);
    });

    if (!otpRequested) {
      const errorResult = {
        jobId,
        success: false,
        error: "Failed to request OTP from Gyftr",
      };

      await step.sendEvent("gyftr-login-completed", {
        name: EventNames.GYFTR_LOGIN_COMPLETED,
        data: errorResult,
      });

      return errorResult;
    }

    // Step 2: Wait for OTP using separate OTP function
    const otpWaitResult = (await step.invoke("wait-for-gyftr-otp", {
      function: "otp-wait-requested",
      data: {
        jobId,
        senderPhone: mobileNumber,
        portal: Portal.GYFTR_AMEX_REWARDS_MULTIPLIER,
        otpType: OTPType.ACCOUNT_LOGIN,
        startTime: sessionStartTime.toISOString(),
        maxRetries: 5,
      },
    })) as OtpWaitCompletedType;

    if (!otpWaitResult.success || !otpWaitResult.otp) {
      const errorResult = {
        jobId,
        success: false,
        error: "Failed to receive OTP from SMS",
      };

      await step.sendEvent("gyftr-login-completed", {
        name: EventNames.GYFTR_LOGIN_COMPLETED,
        data: errorResult,
      });

      return errorResult;
    }

    // Step 3: Validate OTP and get auth token
    const authToken = await step.run("validate-gyftr-otp", async () => {
      console.log("Validating Gyftr OTP");
      return await validateOtp(mobileNumber, email, otpWaitResult.otp!);
    });

    if (!authToken) {
      const errorResult = {
        jobId,
        success: false,
        error: "Failed to validate OTP",
      };

      await step.sendEvent("gyftr-login-completed", {
        name: EventNames.GYFTR_LOGIN_COMPLETED,
        data: errorResult,
      });

      return errorResult;
    }

    // Step 4: Purchase vouchers and get payment link
    const paymentLink = await step.run("generate-payment-link", async () => {
      console.log("Generating payment link for vouchers");
      return await purchaseVouchers(
        authToken,
        amount,
        email,
        mobileNumber,
        brand,
      );
    });

    if (!paymentLink) {
      const errorResult = {
        jobId,
        success: false,
        error: "Failed to generate payment link",
      };

      await step.sendEvent("gyftr-login-completed", {
        name: EventNames.GYFTR_LOGIN_COMPLETED,
        data: errorResult,
      });

      return errorResult;
    }

    // Success result
    const successResult = {
      jobId,
      success: true,
      authToken,
      paymentLink,
    };

    await step.sendEvent("gyftr-login-completed", {
      name: EventNames.GYFTR_LOGIN_COMPLETED,
      data: successResult,
    });

    return successResult;
  } catch (error) {
    console.error("Error in Gyftr login step:", error);
    const errorResult = {
      jobId,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };

    await step.sendEvent("gyftr-login-completed", {
      name: EventNames.GYFTR_LOGIN_COMPLETED,
      data: errorResult,
    });

    return errorResult;
  }
};

// EVENT FUNCTION
export const gyftrLoginRequestedEventHandler = createEventHandler<
  typeof GYFTR_LOGIN_REQUESTED_EVENT,
  typeof GyftrLoginRequestedSchema
>(
  GYFTR_LOGIN_REQUESTED_EVENT,
  "gyftr-login-requested",
  { limit: 5 }, // Allow multiple Gyftr logins in parallel
  3, // Retry count
  GyftrLoginRequestedSchema,
  handler,
);
