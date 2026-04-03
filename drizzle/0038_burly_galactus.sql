CREATE TABLE "linking_consumed_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_item_id" text NOT NULL,
	"card_reader_id" text NOT NULL,
	"consumed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "slots" DROP CONSTRAINT "slots_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "slots" DROP CONSTRAINT "slots_updated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "slots" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction_items" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "reorder_point" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "aliases" text[];