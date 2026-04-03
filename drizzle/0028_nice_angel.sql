CREATE TABLE "route_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"route_id" text NOT NULL,
	"assigned_to_user_id" text NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"estimated_duration" integer,
	"actual_duration" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pre_kits" ADD COLUMN "route_stop_id" text;--> statement-breakpoint
ALTER TABLE "pre_kits" ADD COLUMN "scheduled_date" timestamp;--> statement-breakpoint
ALTER TABLE "route_stops" ADD COLUMN "estimated_time" integer;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "assigned_to_user_id" text;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "scheduled_date" timestamp;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "estimated_duration" integer;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "recurring_pattern" text;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "route_assignments" ADD CONSTRAINT "route_assignments_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_assignments" ADD CONSTRAINT "route_assignments_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_assignments" ADD CONSTRAINT "route_assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_kits" ADD CONSTRAINT "pre_kits_route_stop_id_route_stops_id_fk" FOREIGN KEY ("route_stop_id") REFERENCES "public"."route_stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;