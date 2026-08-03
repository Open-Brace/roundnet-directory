CREATE TYPE "public"."site_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "sites" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sites_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"url" text NOT NULL,
	"title" text NOT NULL,
	"status" "site_status" DEFAULT 'pending' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sites_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE INDEX "sites_status_position_idx" ON "sites" USING btree ("status","position");