CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"recommended_price" integer NOT NULL,
	"category" text NOT NULL,
	"picture" text NOT NULL,
	"vendor_link" text NOT NULL,
	"case_cost" integer NOT NULL,
	"case_size" text NOT NULL,
	"shipping_available" boolean NOT NULL,
	"shipping_time_in_days" integer NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;