CREATE TABLE IF NOT EXISTS "meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_logs" DROP CONSTRAINT "food_logs_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "food_logs" ADD COLUMN "meal_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "food_logs" DROP COLUMN IF EXISTS "user_id";--> statement-breakpoint
ALTER TABLE "food_logs" DROP COLUMN IF EXISTS "carbs";--> statement-breakpoint
ALTER TABLE "food_logs" DROP COLUMN IF EXISTS "fat";--> statement-breakpoint
ALTER TABLE "food_logs" DROP COLUMN IF EXISTS "image_url";