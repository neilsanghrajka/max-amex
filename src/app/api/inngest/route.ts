import { serve } from "inngest/next";
import { ALL_HANDLERS, inngest } from "@/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: ALL_HANDLERS,
});
