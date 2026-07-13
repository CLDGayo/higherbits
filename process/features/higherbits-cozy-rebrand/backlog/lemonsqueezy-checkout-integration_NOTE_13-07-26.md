---
name: plan:higherbits-cozy-rebrand-lemonsqueezy-checkout-integration
description: "Backlog — Lemon Squeezy checkout integration blocked on user-supplied LS account credentials"
date: 13-07-26
metadata:
  node_type: memory
  type: backlog-note
  feature: higherbits-cozy-rebrand
---

# Lemon Squeezy checkout integration — NEW PLAN REQUIRED

**Date:** 13-07-26
**Source:** UPDATE PROCESS closeout for the `higherbits-cozy-rebrand` program, LS-readiness
follow-up batch (commit `56eb4ef`).

**Gap:** The app's monetization surface (`/pricing`, `/settings/billing`, upgrade-pro onboarding
step) currently drives Stripe checkout code paths (`apps/web/app/api/checkout/route.ts`,
`apps/web/app/api/webhooks/stripe/route.ts`). Stripe is being retired in favor of Lemon Squeezy —
`apps/web/lib/lemonsqueezy.ts` and `apps/web/app/api/lemonsqueezy/` already exist as boilerplate
(uncommitted at the time of this note) but are not wired into checkout UI or a live LS store.

**Why deferred:** Requires the user to create/configure a Lemon Squeezy account (store, product
variants, API key, webhook signing secret) before any code can be meaningfully tested against a
live or sandboxed LS environment. This is a credential/account-provisioning blocker, not a code
blocker.

**Suggested resolution (new plan, general-plans or a dedicated feature folder):**
1. User provisions LS store + product/variant IDs + `LEMONSQUEEZY_API_KEY` +
   `LEMONSQUEEZY_WEBHOOK_SECRET` (or equivalent env vars — confirm naming against
   `apps/web/lib/lemonsqueezy.ts`).
2. Wire the LS checkout overlay (`@lemonsqueezy/lemonsqueezy.js`) into `/pricing`,
   `/settings/billing`, and the Magic upgrade-pro onboarding step, replacing the Stripe
   `/api/checkout` calls.
3. Build a Lemon Squeezy webhook route mirroring the event-handling shape of
   `apps/web/app/api/webhooks/stripe/route.ts` (idempotent read-before-write, grants Pro on
   paid/subscription events).
4. Decide Stripe's fate: fully remove, or keep dormant behind a feature flag pending a clean
   cutover — do not leave both wired live simultaneously (double-billing risk).
5. Update `process/context/all-context.md` billing section once live.

**Note:** `process/general-plans/active/lemonsqueezy-integration_13-07-26/` already exists as an
active general plan — check it first before creating a new one; this backlog note may already be
superseded by that plan's scope.
