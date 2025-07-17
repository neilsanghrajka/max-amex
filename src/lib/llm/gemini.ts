import { GoogleGenAI } from "@google/genai";
import * as z from "zod";

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

/**
 * Generate structured output using LLM with Zod schema validation
 */
export async function generateStructuredOutput<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>,
  model: string = "gemini-2.5-flash",
): Promise<T | null> {
  const jsonSchema = z.toJSONSchema(schema);

  const response = await gemini.models.generateContent({
    model,
    contents: `${systemPrompt}\n\n${userPrompt}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: jsonSchema,
    },
  });

  if (!response.text) {
    console.log("Gemini Response: ", response);
    throw new Error("No response text from gemini");
  }

  const parsed = schema.safeParse(JSON.parse(response.text));

  if (!parsed.success) {
    throw new Error(
      `Failed to parse response. ${response.text} | ${JSON.stringify(parsed.error)}`,
    );
  }

  return parsed.data;
}
