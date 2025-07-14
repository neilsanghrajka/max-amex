# Event System Documentation

This document explains the "Hybrid Colocation" architecture for adding and sending events. This pattern is designed for scalability and clear ownership of features.

## Architecture Overview

- **Event Schemas**: Defined in a `types.ts` file, colocated with the feature handler (e.g., `src/inngest/payment/types.ts`).
- **Event Names**: Centralized in a single `EventNames` object in `src/inngest/events.ts`.
- **Client (`client.ts`)**: Acts as an "Assembler" by importing all schemas and names to create a single, fully-typed Inngest client.
- **Aggregator (`index.ts`)**: Collects all implemented handlers from each feature folder to be served by the API.

---

## Adding a New Event

Here is the step-by-step process for adding a new event (e.g., `user/signed-up`).

### Step 1: Create the Feature Module

If it doesn't already exist, create a folder for your feature:

`src/inngest/user/`

### Step 2: Define the Event Schema (Colocated)

Create a `types.ts` file inside your new folder. Define and export your Zod schema here.

**File: `src/inngest/user/types.ts`**
```typescript
import { z } from "zod";

export const UserSignedUpSchema = z.object({
  userId: z.string(),
  signupMethod: z.enum(["google", "email"]),
});
```

### Step 3: Define the Event Name (Centralized)

Add the new event's name to the central `EventNames` object.

**File: `src/inngest/events.ts`**
```typescript
export const EventNames = {
  // ... existing event names
  USER_SIGNED_UP: "user/signed-up", // Add new name here
} as const;
```

### Step 4: Update the Client Assembler

Update the client to make it aware of your new event's schema.

**File: `src/inngest/client.ts`**
```typescript
import { z } from "zod";
// ... other schema imports
import { UserSignedUpSchema } from "./user/types"; // 1. Import new schema

// ...
type Events = {
  // ... existing events
  [EventNames.USER_SIGNED_UP]: { // 2. Add new event type
    data: z.infer<typeof UserSignedUpSchema>;
  };
};

export const inngest = new Inngest({
  id: "max-amex",
  schemas: new EventSchemas().fromRecord<Events>(),
});
// ...
```

### Step 5: Implement the Event Handler

Create an `index.ts` file inside your feature folder (`src/inngest/user/index.ts`). This is where your business logic lives.

**File: `src/inngest/user/index.ts`**
```typescript
import { createEventHandler, EventHandler } from "../factory";
import { EventNames } from "../events";
import { UserSignedUpSchema } from "./types"; // Import local schema

const USER_SIGNED_UP_EVENT = EventNames.USER_SIGNED_UP;

const handler: EventHandler<
  typeof USER_SIGNED_UP_EVENT,
  typeof UserSignedUpSchema
> = async (data, step) => {
  await step.run("send-welcome-email", async () => {
    // Your business logic for the new event
    console.log(`Sending welcome email to user ${data.userId}`);
    return { sent: true };
  });

  return { message: "Welcome email sent!" };
};

export const userSignedUpEventHandler = createEventHandler(
  USER_SIGNED_UP_EVENT,
  "user-signed-up-handler", // Unique event ID
  { limit: 5 }, // Concurrency config
  3, // Retry count
  UserSignedUpSchema,
  handler
);
```

### Step 6: Register the Handler (Aggregator)

Finally, register your new handler in the main aggregator file so it can be served.

**File: `src/inngest/index.ts`**
```typescript
// ... other handler imports
import { userSignedUpEventHandler } from "./user"; // 1. Import new handler

export const ALL_HANDLERS = [
  // ... existing handlers
  userSignedUpEventHandler, // 2. Add to the array
];

// ...
```

## Sending Events

Import the `sendEvent` function and `EventNames` object.

```typescript
import { sendEvent } from "@/inngest";
import { EventNames } from "@/inngest/events";

await sendEvent({
  name: EventNames.USER_SIGNED_UP,
  data: {
    userId: "user-abc-123",
    signupMethod: "google",
  },
});
```
