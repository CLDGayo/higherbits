-- Seed data for a fresh HigherBits.dev database.
-- Plans mirror apps/web/lib/config/subscription-plans.ts (PLAN_LIMITS):
--   free      $0        5 tokens/mo
--   pro       $20/mo or $192/yr   50 tokens/mo
--   pro_plus  $40/mo or $384/yr   200 tokens/mo
-- stripe_plan_id is NULL until Stripe products/prices are created; billing
-- webhooks match plans by stripe_plan_id, so fill these in once Stripe is set up
-- (UPDATE public.plans SET stripe_plan_id = 'price_...' WHERE type='pro' AND period='monthly'; etc).
-- Idempotent: seeds only when the plans table is empty.

INSERT INTO public.plans (type, period, price, add_usage, env, version, stripe_plan_id)
SELECT * FROM (
  VALUES
    ('free',     'monthly', 0::numeric,   5,   'live', 1, NULL::text),
    ('pro',      'monthly', 20::numeric,  50,  'live', 1, NULL::text),
    ('pro',      'yearly',  192::numeric, 50,  'live', 1, NULL::text),
    ('pro_plus', 'monthly', 40::numeric,  200, 'live', 1, NULL::text),
    ('pro_plus', 'yearly',  384::numeric, 200, 'live', 1, NULL::text)
) AS seed(type, period, price, add_usage, env, version, stripe_plan_id)
WHERE NOT EXISTS (SELECT 1 FROM public.plans);
