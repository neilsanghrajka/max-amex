import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import {
  GyftrrLoginSchema,
  GyftrrLoginType,
  GyftrrLoginResultSchema,
} from "./types";
import { requestOtp, validateOtp } from "@/services/gyftrr";
import { getOtpEventHandler } from "@/inngest/otp";
import { OTPType, Portal } from "@/services/otp/types";
import { NonRetriableError } from "inngest";

const GYFTRR_LOGIN_EVENT = EventNames.GYFTRR_LOGIN;

// EVENT HANDLER
const handler: EventHandler<
  typeof GYFTRR_LOGIN_EVENT,
  typeof GyftrrLoginSchema,
  typeof GyftrrLoginResultSchema
> = async (data: GyftrrLoginType, step) => {
  // Start
  await step.run("Start", async () => {
    console.log(`Starting Gyftrr Login for ${data.email} ${data.mobile}`);
  });

  // Request OTP
  const { startTimeUtc } = await step.run("Request OTP", async () => {
    const startTimeUtc = new Date().toISOString();
    const success = await requestOtp(data.mobile, data.email);

    if (!success) {
      throw new Error("Failed to request OTP");
    }

    return {
      success: true,
      message: "OTP requested successfully",
      startTimeUtc,
    };
  });

  const otp = await step.invoke("Get OTP", {
    function: getOtpEventHandler,
    data: {
      senderPhone: data.mobile,
      portal: Portal.GYFTR_AMEX_REWARDS_MULTIPLIER,
      otpType: OTPType.ACCOUNT_LOGIN,
      startTime: startTimeUtc,
    },
  });

  if (!otp) {
    throw new NonRetriableError("No OTP found", {
      cause: "No OTP found even after retries.",
    });
  }

  // Get Auth Token
  const authToken = await step.run("Get Auth Token", async () => {
    const authToken = await validateOtp(data.mobile, data.email, otp.otp);

    if (!authToken) {
      throw new NonRetriableError("No auth token found", {
        cause: "No auth token found..",
      });
    }

    return authToken;
  });

  return { auth_token: authToken };
};

// EVENT FUNCTION
export const gyftrrLoginEventHandler = createEventHandler<
  typeof GYFTRR_LOGIN_EVENT,
  typeof GyftrrLoginSchema,
  typeof GyftrrLoginResultSchema
>(
  GYFTRR_LOGIN_EVENT,
  GYFTRR_LOGIN_EVENT,
  { limit: 1 }, // Allow only one Gyftrr login at a time
  3, // Retry count
  GyftrrLoginSchema,
  handler,
  GyftrrLoginResultSchema,
);
