ALTER TABLE "transactions" ADD COLUMN "card_reader_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vending_machines" ADD COLUMN "card_reader_id" text;