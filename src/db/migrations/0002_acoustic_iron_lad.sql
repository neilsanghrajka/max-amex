ALTER TYPE "public"."payment_status" RENAME TO "bulk_purchase_status";--> statement-breakpoint
ALTER TABLE "payment_job" RENAME TO "bulk_purchase_job";--> statement-breakpoint
ALTER TABLE "bulk_purchase_job" DROP CONSTRAINT "[object Object]_amount_check";--> statement-breakpoint
ALTER TABLE "bulk_purchase_job" DROP CONSTRAINT "[object Object]_quantity_check";--> statement-breakpoint
ALTER TABLE "bulk_purchase_job" ADD CONSTRAINT "[object Object]_amount_check" CHECK ("bulk_purchase_job"."amount" IN (1000, 1500));--> statement-breakpoint
ALTER TABLE "bulk_purchase_job" ADD CONSTRAINT "[object Object]_quantity_check" CHECK ("bulk_purchase_job"."quantity" > 0 AND "bulk_purchase_job"."quantity" <= 10);