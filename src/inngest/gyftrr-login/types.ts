import { z } from "zod";

export const GyftrLoginRequestedSchema = z.object({
  jobId: z.number(),
  mobileNumber: z.string(),
  email: z.string().email(),
  amount: z.number(),
  brand: z.string().optional().default("amazon-gift-vouchers"),
});

export type GyftrLoginRequestedType = z.infer<typeof GyftrLoginRequestedSchema>;

export const GyftrLoginCompletedSchema = z.object({
  jobId: z.number(),
  success: z.boolean(),
  authToken: z.string().optional(),
  paymentLink: z.string().optional(),
  error: z.string().optional(),
});

export type GyftrLoginCompletedType = z.infer<typeof GyftrLoginCompletedSchema>;
