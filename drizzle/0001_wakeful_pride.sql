ALTER TABLE "fuel_entries" DROP CONSTRAINT "fuel_entries_driver_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "fuel_entries" ALTER COLUMN "driver_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fuel_entries" ADD COLUMN "logged_by_id" uuid;--> statement-breakpoint
ALTER TABLE "fuel_entries" ADD COLUMN "logged_by_role" text DEFAULT 'driver';--> statement-breakpoint
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_logged_by_id_users_id_fk" FOREIGN KEY ("logged_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;