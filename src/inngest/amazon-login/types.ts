import { z } from "zod";

export const AmazonLoginRequestedSchema = z.object({});

export type AmazonLoginRequestedType = z.infer<typeof AmazonLoginRequestedSchema>;
