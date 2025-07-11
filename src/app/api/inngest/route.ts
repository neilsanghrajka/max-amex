import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { payment } from "@/inngest/functions/payment";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    /* your functions will be passed here later! */
    payment,
  ],
});
