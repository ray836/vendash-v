ALTER TABLE "transactions" DROP CONSTRAINT "transactions_slot_id_slots_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "slot_id";