ALTER TABLE "transaction_items" ADD COLUMN "slot_code" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "data" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "slot_code";