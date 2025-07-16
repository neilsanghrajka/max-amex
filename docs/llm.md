# LLM Integration

This project uses Gemini via OpenAI SDK for LLM functionality with proper structured output support.

## Setup

1. Install dependencies:
```bash
pnpm install openai zod
```

2. Set environment variable:
```bash
GEMINI_API_KEY=your_gemini_api_key
```

## Usage

### Structured Output

```typescript
import { generateStructuredOutput } from '@/lib/llm/client';
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

const result = await generateStructuredOutput(
  "You are a helpful assistant.",
  "Extract person info from: John is 25 years old",
  schema,
  "person_info"
);
```

### Text Generation

```typescript
import { generateText } from '@/lib/llm/client';

const response = await generateText(
  "You are a helpful assistant.",
  "What is the capital of France?"
);
```

## Implementation Details

- Uses OpenAI SDK with Gemini endpoint for compatibility
- Structured output uses `responses.parse()` with `zodTextFormat`
- Automatic JSON parsing and validation via Zod schemas
- Error handling with `LLMError` class

## OTP Classification

The main use case is OTP extraction from SMS messages:

```typescript
import { extractOtpFromMessage } from '@/services/gyftr/otp-classifier';
import { Portal, OTPType } from '@/services/gyftr/otp';

const result = await extractOtpFromMessage(
  "Your OTP is 123456",
  Portal.AMAZON,
  OTPType.ACCOUNT_LOGIN
);
``` 