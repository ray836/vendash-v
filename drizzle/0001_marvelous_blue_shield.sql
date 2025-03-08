CREATE TABLE "restock_machine_data" (
	"id" text PRIMARY KEY NOT NULL,
	"machine_id" text NOT NULL,
	"cash_amount" integer NOT NULL,
	"pictures" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"restock_record_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restock_records" (
	"id" text PRIMARY KEY NOT NULL,
	"route_id" text NOT NULL,
	"location_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"timestamp" timestamp NOT NULL,
	"stocked_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_stops" (
	"id" text PRIMARY KEY NOT NULL,
	"route_id" text NOT NULL,
	"location_id" text NOT NULL,
	"order" integer NOT NULL,
	"notes" text DEFAULT '',
	"is_complete" boolean DEFAULT false NOT NULL,
	"vending_machine_ids" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vending_machines" ALTER COLUMN "notes" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vending_machines" ADD COLUMN "model" varchar(256);--> statement-breakpoint
ALTER TABLE "vending_machines" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vending_machines" ADD COLUMN "created_by" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vending_machines" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "vending_machines" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "vending_machines" ADD COLUMN "updated_by" text NOT NULL;--> statement-breakpoint
ALTER TABLE "restock_machine_data" ADD CONSTRAINT "restock_machine_data_machine_id_vending_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."vending_machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_machine_data" ADD CONSTRAINT "restock_machine_data_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_machine_data" ADD CONSTRAINT "restock_machine_data_restock_record_id_restock_records_id_fk" FOREIGN KEY ("restock_record_id") REFERENCES "public"."restock_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_records" ADD CONSTRAINT "restock_records_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_records" ADD CONSTRAINT "restock_records_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_records" ADD CONSTRAINT "restock_records_stocked_by_users_id_fk" FOREIGN KEY ("stocked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vending_machines" ADD CONSTRAINT "vending_machines_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vending_machines" ADD CONSTRAINT "vending_machines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vending_machines" ADD CONSTRAINT "vending_machines_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;