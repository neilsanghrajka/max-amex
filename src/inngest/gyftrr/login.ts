import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import { GyftrrLoginSchema, GyftrrLoginType } from "./types";
import { requestOtp } from "@/services/gyftr";

const GYFTRR_LOGIN_EVENT = EventNames.GYFTRR_LOGIN;

// EVENT HANDLER
const handler: EventHandler<
  typeof GYFTRR_LOGIN_EVENT,
  typeof GyftrrLoginSchema
> = async (data: GyftrrLoginType, step) => {
  // Start
  await step.run("start", async () => {
    console.log(`Starting Gyftrr Login for ${data.email} ${data.mobile}`);
  });

  // Request OTP
  await step.run("request-otp", async () => {
    const success = await requestOtp(data.mobile, data.email);

    if (!success) {
      throw new Error("Failed to request OTP");
    }

    return { success: true, message: "OTP requested successfully" };
  });

  // TODO: Wait for OTP
  // TODO: Return "Auth token"

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
