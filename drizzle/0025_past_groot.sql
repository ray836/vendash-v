CREATE TABLE "pre_kit_items" (
	"id" text PRIMARY KEY NOT NULL,
	"pre_kit_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"slot_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pre_kits" (
	"id" text PRIMARY KEY NOT NULL,
	"machine_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "pre_kit_items" ADD CONSTRAINT "pre_kit_items_pre_kit_id_pre_kits_id_fk" FOREIGN KEY ("pre_kit_id") REFERENCES "public"."pre_kits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_kit_items" ADD CONSTRAINT "pre_kit_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_kit_items" ADD CONSTRAINT "pre_kit_items_slot_id_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_kit_items" ADD CONSTRAINT "pre_kit_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_kit_items" ADD CONSTRAINT "pre_kit_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_kits" ADD CONSTRAINT "pre_kits_machine_id_vending_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."vending_machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_kits" ADD CONSTRAINT "pre_kits_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_kits" ADD CONSTRAINT "pre_kits_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;