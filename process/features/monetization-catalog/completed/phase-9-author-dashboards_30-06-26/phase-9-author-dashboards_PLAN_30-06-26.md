---
name: phase-9-author-dashboards_PLAN
description: "Execution plan for Phase 9 Author Dashboards and Revenue Share (Affiliate Model)"
date: 30-06-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: 9
---

# Phase 9: Author Dashboards & Revenue Share PLAN

## Scope and Blast Radius
- `apps/web/app/api/connect/route.ts`: New endpoint for Stripe Connect onboarding.
- `apps/web/app/api/connect/return/route.ts`: New endpoint for Stripe onboarding return.
- `apps/web/app/(dashboard)/author/page.tsx`: New dashboard for authors to see their Connect status.
- `apps/web/app/api/checkout/route.ts`: Modified to accept `authorStripeAccountId` and attach `transfer_data`.
- `apps/web/app/(catalog)/[category]/[slug]/page.tsx`: Pass `Stripe_Account_Id` into the checkout flow.
- `scripts/validate-registry.mjs`: Allow `Stripe_Account_Id` in schema.
- `docs/evidence-manifest/registry/*.md`: Schema extension.

## Architecture & Approach
We are using **Approach B (Affiliate Model)**:
1. Authors onboard via Stripe Connect Express.
2. The resulting `acct_...` ID is manually added to their components in the registry (`Stripe_Account_Id`).
3. When a user checks out from that component's page, the checkout session routes 50% of the transaction to the destination account via `transfer_data`.

## Verification Gates
- **Level 1**: `checkout.test.ts` asserts `transfer_data` payload is properly constructed.
- **Level 2**: Manual verification using Stripe test mode onboarding.

## Phase Ordering
1. Update `scripts/validate-registry.mjs`.
2. Create Stripe Connect API endpoints.
3. Create Author Dashboard page.
4. Modify `checkout` route and `[slug]/page.tsx`.
5. Update unit tests.

## Status
✅ VERIFIED COMPLETE

## What's Functional Now
- Stripe Connect Express onboarding endpoints (`/api/connect`, `/api/connect/return`, `/api/connect/dashboard`).
- Author Dashboard UI showing connection status.
- Checkout route supports dynamic revenue share (50%) to the destination `authorStripeAccountId`.
- Secure payout destination lookup via server-side registry.
- Rate limiting middleware protecting sensitive checkout and connect endpoints.

## Deviations & Lessons Learned
- Deviation: `orgId` verification and `Stripe_Account_Id` lookups were shifted completely server-side in the `/api/checkout` route to mitigate URL tampering.
- Deviation: Simple in-memory rate limiting was added for DoS mitigation.
