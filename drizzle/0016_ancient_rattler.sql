ALTER TABLE "transactions" ADD COLUMN "slot_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "slot_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_slot_id_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slots"("id") ON DELETE no action ON UPDATE no action;