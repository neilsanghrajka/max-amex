  import { pgTable, bigint, timestamp, json, varchar } from "drizzle-orm/pg-core";

export const smsWebhooks = pgTable("sms_webhooks", {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
    startWith: 1,
    increment: 1,
    minValue: 1,
  }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  raw: json(),
  senderPhone: varchar("sender_phone").default(""),
});

export type SmsWebhook = typeof smsWebhooks.$inferSelect;
export type InsertSmsWebhook = typeof smsWebhooks.$inferInsert;