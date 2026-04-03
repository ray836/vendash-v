ALTER TABLE "pre_kits" ALTER COLUMN "status" SET DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE "pre_kits" ADD COLUMN "last_recalculated_at" timestamp;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "status" text DEFAULT 'PLANNED' NOT NULL;