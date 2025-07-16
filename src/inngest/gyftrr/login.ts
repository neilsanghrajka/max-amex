import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import { GyftrrLoginSchema, GyftrrLoginType } from "./types";
import { requestOtp } from "@/services/gyftr";
import { getOtpEventHandler } from "@/inngest/otp";

const GYFTRR_LOGIN_EVENT = EventNames.GYFTRR_LOGIN;

// EVENT HANDLER
const handler: EventHandler<
  typeof GYFTRR_LOGIN_EVENT,
  typeof GyftrrLoginSchema
> = async (data: GyftrrLoginType, step) => {
  // Start
  await step.run("Start", async () => {
    console.log(`Starting Gyftrr Login for ${data.email} ${data.mobile}`);
  });

  // Request OTP
  await step.run("Request OTP", async () => {
    const success = await requestOtp(data.mobile, data.email);

    if (!success) {
      throw new Error("Failed to request OTP");
    }

    return { success: true, message: "OTP requested successfully" };
  });

  // Wait for OTP
  await step.sleep("Wait for OTP", "10 seconds");

  await step.invoke("Get OTP", {
    function: getOtpEventHandler,
    data: {
      senderPhone: data.mobile,
      portal: "GYFTR_AMEX_REWARDS_MULTIPLIER",
      otpType: "ACCOUNT_LOGIN",
      startTime: new Date().toISOString(), // TODO: Check UTC time here
    },
  });
  // TODO: Return "Auth token"
  // await step.invoke("Get OTP", {
  //   function: getOtpEventHandler,
  //   data: {},
  // });

  return { auth_token: "TODO", message: "Gyftrr login function completed" };
};

// EVENT FUNCTION
export const gyftrrLoginEventHandler = createEventHandler<
  typeof GYFTRR_LOGIN_EVENT,
  typeof GyftrrLoginSchema
>(
  GYFTRR_LOGIN_EVENT,
  GYFTRR_LOGIN_EVENT,
  { limit: 1 }, // Allow only one Gyftrr login at a time
  3, // Retry count
  GyftrrLoginSchema,
  handler,
);
