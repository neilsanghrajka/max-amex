# Event System Documentation

This document explains the "Hybrid Colocation" architecture for adding and sending events. This pattern is designed for scalability and clear ownership of features.

## Architecture Overview

- **Event Schemas**: Defined in a `types.ts` file, colocated with the feature handler (e.g., `src/inngest/payment/types.ts`).
- **Event Names**: Centralized in a single `EventNames` object in `src/inngest/events.ts`.
- **Client (`client.ts`)**: Acts as an "Assembler" by importing all schemas and names to create a single, fully-typed Inngest client.
- **Aggregator (`index.ts`)**: Collects all implemented handlers from each feature folder to be served by the API.

## Event Naming Convention

- **Object-Action**: Use noun-verb pattern: `account.created`, `account.updated`
- **Past-tense**: Use past-tense verbs: `uploaded`, `paid`, `completed`
- **Separators**: Use dot-notation: `user.created` or `blog_post.published`
- **Prefixes**: Group related events: `api/user.created`, `billing/invoice.paid`

## Adding a New Event

### Step 1: Create the Feature Module

Create a folder for your feature: `src/inngest/user/`

### Step 2: Define the Event Schema

Create a `types.ts` file with your Zod schema:

**File: `src/inngest/user/types.ts`**

```typescript
import { z } from "zod";

export const UserSignedUpSchema = z.object({
  userId: z.string(),
  signupMethod: z.enum(["google", "email"]),
});
```

### Step 3: Define the Event Name

Add to the central `EventNames` object:

**File: `src/inngest/events.ts`**

```typescript
export const EventNames = {
  // ... existing event names
  USER_SIGNED_UP: "user/signed-up",
} as const;
```

### Step 4: Update the Client Assembler

Update the client to include your new event's schema:

**File: `src/inngest/client.ts`**

```typescript
import { UserSignedUpSchema } from "./user/types";

type Events = {
  // ... existing events
  [EventNames.USER_SIGNED_UP]: {
    data: z.infer<typeof UserSignedUpSchema>;
  };
};
```

### Step 5: Implement the Event Handler

Create an `index.ts` file with your business logic:

**File: `src/inngest/user/index.ts`**

```typescript
import { createEventHandler, EventHandler } from "../factory";
import { EventNames } from "../events";
import { UserSignedUpSchema } from "./types";

const USER_SIGNED_UP_EVENT = EventNames.USER_SIGNED_UP;

const handler: EventHandler<
  typeof USER_SIGNED_UP_EVENT,
  typeof UserSignedUpSchema
> = async (data, step) => {
  await step.run("send-welcome-email", async () => {
    console.log(`Sending welcome email to user ${data.userId}`);
    return { sent: true };
  });

  return { message: "Welcome email sent!" };
};

export const userSignedUpEventHandler = createEventHandler(
  USER_SIGNED_UP_EVENT,
  USER_SIGNED_UP_EVENT,
  { limit: 5 },
  3,
  UserSignedUpSchema,
  handler,
);
```

### Step 6: Register the Handler

Add your handler to the main aggregator:

**File: `src/inngest/index.ts`**

```typescript
import { userSignedUpEventHandler } from "./user";

export const ALL_HANDLERS = [
  // ... existing handlers
  userSignedUpEventHandler,
];
```

## Multi-Operation Features

For features with multiple operations (like Amazon), use separate files within a single folder:

```
src/inngest/amazon/
├── types.ts          # All Amazon schemas
├── login.ts          # Amazon login handler
├── redeem.ts         # Amazon redeem handler
└── index.ts          # Export all handlers
```

## Sending Events

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
