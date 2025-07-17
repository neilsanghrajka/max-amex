import { z } from "zod";

export const User = z.object({
  email: z.email(),
  mobileNumber: z.string().min(10).max(10),
});

export const GyftrrSession = z.object({
  authToken: z.string(),
});

export type User = z.infer<typeof User>;
export type GyftrrSession = z.infer<typeof GyftrrSession>;
