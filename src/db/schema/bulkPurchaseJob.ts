import { sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  timestamp,
  check,
  pgEnum,
} from "drizzle-orm/pg-core";

// Define the bulk purchase status enum
export const bulkPurchaseStatusEnum = pgEnum("bulk_purchase_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const bulkPurchaseJobTable = pgTable(
  // TABLE NAME
  "bulk_purchase_job",
  // COLUMNS
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    // TODO: This does not update on update, so we need to manually update it
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    amount: integer("amount").notNull(),
    quantity: integer("quantity").notNull(),
    status: bulkPurchaseStatusEnum("status").notNull().default("pending"),
    // TODO: add FK to user table
    // TODO: Add FK to user card
  },
  // CONSTRAINTs & INDEXES
  (table) => [
    check(`${table}_amount_check`, sql`${table.amount} IN (1000, 1500)`),
    check(
      `${table}_quantity_check`,
      sql`${table.quantity} > 0 AND ${table.quantity} <= 10`,
    ),
    // TODO: Add check so one user + card can only have one bulk purchase job at a time that is active
  ],
); 