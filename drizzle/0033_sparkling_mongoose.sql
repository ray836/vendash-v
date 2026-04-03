CREATE TABLE "stocking_records" (
	"id" text PRIMARY KEY NOT NULL,
	"pre_kit_id" text NOT NULL,
	"cash_collected" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stocking_records" ADD CONSTRAINT "stocking_records_pre_kit_id_pre_kits_id_fk" FOREIGN KEY ("pre_kit_id") REFERENCES "public"."pre_kits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocking_records" ADD CONSTRAINT "stocking_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;