import { z } from "zod";
import { ConcurrencyOption } from "inngest/types";
import { GetFunctionInput, GetEvents } from "inngest";
import { inngest } from "@/inngest/client";

// For some reason this is how inngest defines it :facepalm:
type RetryCount =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20;

// THIS IS THE FUNCTION FACTORY
// ----------------------------------------
export const createEventHandler = <
  E extends keyof GetEvents<typeof inngest>,
  S extends z.ZodTypeAny,
  Result = unknown,
  FnInput extends GetFunctionInput<typeof inngest, E> = GetFunctionInput<
    typeof inngest,
    E
  >,
  DataType = z.infer<S>,
>(
  eventName: E,
  eventId: string,
  concurrencyConfig: ConcurrencyOption,
  retryCount: RetryCount,
  schema: S,
  handler: (data: DataType, step: FnInput["step"]) => Promise<Result>,
) => {
  return inngest.createFunction(
    {
      id: eventId,
      concurrency: concurrencyConfig,
      retries: retryCount,
    },
    { event: eventName },
    async ({ event, step }: FnInput) => {
      console.log("Received job", event.data);

      const data = schema.parse(event.data) as DataType;
      return handler(data, step);
    },
  );
};

export type EventHandler<
  E extends keyof GetEvents<typeof inngest>,
  S extends z.ZodTypeAny,
  Result = unknown,
> = (
  data: z.infer<S>,
  step: GetFunctionInput<typeof inngest, E>["step"],
) => Promise<Result>;
