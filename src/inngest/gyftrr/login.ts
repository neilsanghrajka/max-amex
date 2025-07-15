import { createEventHandler, EventHandler } from "@/inngest/factory";
import { EventNames } from "@/inngest/events";
import { GyftrrLoginSchema, GyftrrLoginType } from "./types";

const GYFTRR_LOGIN_EVENT = EventNames.GYFTRR_LOGIN;

// EVENT HANDLER
const handler: EventHandler<
  typeof GYFTRR_LOGIN_EVENT,
  typeof GyftrrLoginSchema
> = async (data: GyftrrLoginType, step) => {
  console.log("Gyftrr login - barebones function executed");
  console.log(data, step);
  return { success: true, message: "Gyftrr login function completed" };
};

// EVENT FUNCTION
export const gyftrrLoginEventHandler = createEventHandler<
  typeof GYFTRR_LOGIN_EVENT,
  typeof GyftrrLoginSchema
>(
  GYFTRR_LOGIN_EVENT,
  "gyftrr-login",
  { limit: 1 }, // Allow only one Gyftrr login at a time
  3, // Retry count
  GyftrrLoginSchema,
  handler,
);
