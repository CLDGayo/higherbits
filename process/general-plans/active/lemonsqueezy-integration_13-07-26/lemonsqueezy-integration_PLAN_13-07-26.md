# Lemon Squeezy Store Integration

Replace the current dead Stripe integration with Lemon Squeezy for checkouts, subscriptions, and webhooks in the Next.js `apps/web` application. 

## User Review Required

> [!WARNING]
> This integration replaces Stripe. We need to decide whether to reuse existing database columns (`stripe_id`, `stripe_plan_id`) conceptually as generic provider IDs, or add dedicated columns (`lemon_squeezy_customer_id`) to the Supabase database. The safest approach is adding new columns for Lemon Squeezy to avoid collision, but since Stripe is "dead", reusing them as generic `payment_provider_id` might be easier. Please advise on your preference in the open questions below!

> [!IMPORTANT]
> To test this locally and on staging, you will need to provide `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, and `LEMON_SQUEEZY_WEBHOOK_SECRET` environment variables.

## Open Questions

1. **Database Schema:** Should I generate a Supabase migration to add `lemon_squeezy_customer_id` and `lemon_squeezy_subscription_id` to the `users` and `subscriptions` tables, or should we just reuse/rename the existing `stripe_id` fields?
2. **Existing Stripe Code:** Should I completely delete the existing `lib/stripe.ts` and `/api/stripe/*` routes, or leave them intact (but dormant) for historical purposes?
3. **Lemon Squeezy Store Config:** Are the variants/products already set up in Lemon Squeezy? We will need their variant IDs to map to the `plans` in our database.

## Proposed Changes

---

### Package Management

- Install `@lemonsqueezy/lemonsqueezy.js` in `apps/web`.

#### [MODIFY] [package.json](file:///Users/clarencelloydgayo/Gayo%20Sphere/HigherBits.dev/apps/web/package.json)

---

### Supabase Database / Types

Generate a migration to add Lemon Squeezy fields (if chosen over reuse) and update generated TypeScript types.

#### [MODIFY] [supabase.ts](file:///Users/clarencelloydgayo/Gayo%20Sphere/HigherBits.dev/apps/web/types/supabase.ts)

---

### Core Library

Create the Lemon Squeezy client wrapper, similar to the existing `stripe.ts`.

#### [NEW] [lemonsqueezy.ts](file:///Users/clarencelloydgayo/Gayo%20Sphere/HigherBits.dev/apps/web/lib/lemonsqueezy.ts)
- Initialize the Lemon Squeezy client using the API key.
- Provide helper functions to get plan variant IDs.

---

### API Routes (Checkout & Webhooks)

Implement checkout creation and webhook processing. 

#### [NEW] [route.ts](file:///Users/clarencelloydgayo/Gayo%20Sphere/HigherBits.dev/apps/web/app/api/lemonsqueezy/create-checkout/route.ts)
- Creates a checkout session using Lemon Squeezy API and returns the checkout URL.

#### [NEW] [route.ts](file:///Users/clarencelloydgayo/Gayo%20Sphere/HigherBits.dev/apps/web/app/api/lemonsqueezy/webhook/route.ts)
- Listens for Lemon Squeezy webhooks (`order_created`, `subscription_created`, `subscription_updated`, etc.).
- Verifies the webhook signature using `LEMON_SQUEEZY_WEBHOOK_SECRET`.
- Updates the Supabase database accordingly.

---

### UI Components

Update the pricing table and billing settings to use the Lemon Squeezy overlay/checkout buttons.

#### [MODIFY] [pricing-table.tsx](file:///Users/clarencelloydgayo/Gayo%20Sphere/HigherBits.dev/apps/web/components/features/settings/billing/pricing-table.tsx)
- Replace Stripe checkout calls with Lemon Squeezy.

#### [MODIFY] [pricing-section.tsx](file:///Users/clarencelloydgayo/Gayo%20Sphere/HigherBits.dev/apps/web/components/features/pricing/pricing-section.tsx)
- Replace Stripe checkout calls with Lemon Squeezy checkout.

## Verification Plan

### Automated Tests
- N/A for third-party webhooks unless there are existing tests we can port.

### Manual Verification
- Provide a webhook forwarding command (e.g., via `ngrok` or `stripe listen` equivalent) to test webhooks locally.
- Test the checkout flow end-to-end to ensure the Lemon Squeezy overlay opens correctly and the database is updated when the subscription is created.
