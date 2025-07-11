import { pgTable, bigint, timestamp, json, varchar } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const smsWebhooks = pgTable("SMS Webhooks", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: `"SMS Webhooks_id_seq"`, startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	raw: json(),
	senderPhone: varchar("sender_phone").default(''),
}); 