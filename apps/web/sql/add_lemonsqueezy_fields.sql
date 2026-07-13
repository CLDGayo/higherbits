ALTER TABLE "public"."users" 
ADD COLUMN "lemon_squeezy_customer_id" text;

ALTER TABLE "public"."users_to_plans" 
ADD COLUMN "lemon_squeezy_subscription_id" text;

ALTER TABLE "public"."plans"
ADD COLUMN "lemon_squeezy_variant_id" text;
