# Event System Documentation

This document explains how to add new events and send events using the Inngest event system.

## Adding a New Event

### Step 1: Define Event Name

Add your event name to `src/inngest/handlers/events.ts`:

```typescript
export const enum EventName {
  PAYMENT_INITIATE = "payment/initiate",
  OTP_RECEIVED = "otp/received",
  YOUR_NEW_EVENT = "your-domain/your-action", // Add here
}
```

### Step 2: Create Handler Folder

Create a new folder: `src/inngest/handlers/your-domain/`

### Step 3: Create Event Handler

Create `src/inngest/handlers/your-domain/index.ts`:

```typescript
import { z } from "zod";
import { createEventHandler, EventHandler } from "../factory";
import { EventName } from "../events";

const YOUR_NEW_EVENT = EventName.YOUR_NEW_EVENT;

export const YourNewEventSchema = z.object({
  userId: z.string(),
  // Add your data structure here
});

const handler: EventHandler<
  typeof YOUR_NEW_EVENT,
  typeof YourNewEventSchema
> = async (data, step) => {
  const result = await step.run("your-step-name", async () => {
    // Your business logic here
    console.log("Processing event:", data);
    return { success: true };
  });

  return result;
};

export const yourNewEventHandler = createEventHandler(
  YOUR_NEW_EVENT,
  "your-event-id",
  { limit: 1, key: "event.data.userId" }, // Concurrency config
  3, // Retry count
  YourNewEventSchema,
  handler,
);
```

### Step 4: Register Handler

Update `src/inngest/index.ts`:

```typescript
import {
  yourNewEventHandler,
  YourNewEventSchema,
} from "./handlers/your-domain";

// Add to Events type
type Events = {
  [EventName.PAYMENT_INITIATE]: { data: z.infer<typeof PaymentInitiateSchema> };
  [EventName.YOUR_NEW_EVENT]: { data: z.infer<typeof YourNewEventSchema> }; // Add this
};

// Add to handlers array
export const ALL_HANDLERS = [
  paymentInitiatedEventHandler,
  yourNewEventHandler, // Add this
];
```

## Sending Events

Import and use the `sendEvent` function:

```typescript
import { sendEvent } from "@/inngest";
import { EventName } from "@/inngest/handlers/events";

// Send an event
await sendEvent({
  name: EventName.YOUR_NEW_EVENT,
  data: {
    userId: "user123",
    // Your event data
  },
});
```

## Configuration

- **Concurrency**: `{ limit: 1, key: "event.data.userId" }` - limit per user
- **Retries**: Number of retry attempts (e.g., `3`)
- **Steps**: Use `step.run()` to break down logic with automatic retries
