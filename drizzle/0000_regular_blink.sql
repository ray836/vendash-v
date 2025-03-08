CREATE TABLE "vending_machines" (
	"id" text PRIMARY KEY NOT NULL,
	"type" varchar(256) NOT NULL,
	"location_id" text NOT NULL,
	"notes" text DEFAULT ''
);
