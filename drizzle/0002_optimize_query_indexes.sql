DROP INDEX "fuel_vehicle_idx";--> statement-breakpoint
DROP INDEX "fuel_company_idx";--> statement-breakpoint
DROP INDEX "fuel_driver_idx";--> statement-breakpoint
DROP INDEX "messages_conversation_idx";--> statement-breakpoint
DROP INDEX "payments_company_idx";--> statement-breakpoint
DROP INDEX "vehicles_company_idx";--> statement-breakpoint
DROP INDEX "vehicles_driver_idx";--> statement-breakpoint
CREATE INDEX "fuel_vehicle_idx" ON "fuel_entries" USING btree ("vehicle_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "fuel_company_idx" ON "fuel_entries" USING btree ("company_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "fuel_driver_idx" ON "fuel_entries" USING btree ("driver_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "payments_company_idx" ON "payments" USING btree ("company_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "vehicles_company_idx" ON "vehicles" USING btree ("company_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "vehicles_driver_idx" ON "vehicles" USING btree ("driver_id","created_at" DESC NULLS LAST);