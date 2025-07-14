import { z } from "zod";

export const PaymentInitiateSchema = z.object({
    jobId: z.number(),
});

export type PaymentInitiateType = z.infer<typeof PaymentInitiateSchema>;
