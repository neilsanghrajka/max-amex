CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "payment_job" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"amount" integer NOT NULL,
	"quantity" integer NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "[object Object]_amount_check" CHECK ("payment_job"."amount" IN (1000, 1500)),
	CONSTRAINT "[object Object]_quantity_check" CHECK ("payment_job"."quantity" > 0 AND "payment_job"."quantity" <= 10)
);
