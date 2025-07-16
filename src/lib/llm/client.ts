import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { LLMError } from "./types";

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

/**
 * Generate structured output using LLM with Zod schema validation
 */
export async function generateStructuredOutput<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>,
  schemaName: string = "output",
): Promise<T> {
  try {
    const response = await client.responses.parse({
      model: "gemini-2.5-flash",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      text: {
        format: zodTextFormat(schema, schemaName),
      },
    });

    const parsed = response.output_parsed;
    if (!parsed) {
      throw new LLMError("No parsed content in response", "gemini");
    }

    return parsed;
  } catch (error) {
    throw new LLMError(
      `Failed to generate structured output: ${error instanceof Error ? error.message : String(error)}`,
      "gemini",
    );
  }
}

/**
 * Generate plain text output
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new LLMError("No content in response", "gemini");
    }

    return content;
  } catch (error) {
    throw new LLMError(
      `Failed to generate text: ${error instanceof Error ? error.message : String(error)}`,
      "gemini",
    );
  }
}
