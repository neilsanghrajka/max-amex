import { sql } from "drizzle-orm";
import { integer, pgTable, serial, timestamp, check, pgEnum } from "drizzle-orm/pg-core";

// Define the payment status enum
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing", 
  "completed",
  "failed"
]);

export const paymentJobTable = pgTable(
    // TABLE NAME
    "payment_job",
    // COLUMNS
    {
        id: serial("id").primaryKey(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        // TODO: This does not update on update, so we need to manually update it
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
        amount: integer("amount").notNull(), 
        quantity: integer("quantity").notNull(),
        status: paymentStatusEnum("status").notNull().default("pending"),
        // TODO: add FK to user table
        // TODO: Add FK to user card
        
    },
    // CONSTRAINTs & INDEXES
    (table) => [
        check(`${table}_amount_check`, sql`${table.amount} IN (1000, 1500)`),
        check(`${table}_quantity_check`, sql`${table.quantity} > 0 AND ${table.quantity} <= 10`),
        // TODO: Add check so one user + card can only have one payment job at a time that is active
    ]
);