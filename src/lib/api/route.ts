import { NextRequest, NextResponse } from "next/server";
import { ZodTypeAny, z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";

// Generic error response schema & type
export const ErrorResponseSchema = z.object({
  error: z.string(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Minimal helper to build Next.js API route handlers with:
 *  – Zod request/response validation
 *  – Supabase authentication & user injection
 *  – Consistent error handling
 *
 * Usage:
 *   export const POST = route(RequestSchema, ResponseSchema, async (body, user) => { ... })
 */
export function route<
  ReqSchema extends ZodTypeAny,
  ResSchema extends ZodTypeAny,
>(
  requestSchema: ReqSchema,
  responseSchema: ResSchema,
  handler: (
    body: z.infer<ReqSchema>,
    user: User,
  ) => Promise<z.infer<ResSchema>>,
): (
  request: NextRequest,
) => Promise<NextResponse<z.infer<ResSchema> | ErrorResponse>> {
  return async (
    request: NextRequest,
  ): Promise<NextResponse<z.infer<ResSchema> | ErrorResponse>> => {
    try {
      // 1. Parse & validate request body
      const jsonBody = await request.json().catch(() => undefined);
      const parseResult = requestSchema.safeParse(jsonBody);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Invalid request body" },
          { status: 400 },
        );
      }

      // 2. Ensure the user is authenticated via Supabase
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // 3. Run the business logic
      const result = await handler(parseResult.data, user);

      // 4. Validate response
      const resValidation = responseSchema.safeParse(result);
      if (!resValidation.success) {
        console.error(
          "[route] Invalid response generated:",
          resValidation.error,
        );
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }

      return NextResponse.json(resValidation.data, { status: 200 });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        return NextResponse.json(
          { error: err.message },
          { status: err.status },
        );
      }
      if (err instanceof Error) {
        console.error("[route] Unhandled error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
      console.error("[route] Unknown error:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
