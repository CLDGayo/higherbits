---
name: report:stripe-fallback-proxy-version-mixing
description: "Backlog — apps/web/lib/stripe.ts's default-export Proxy silently mixes Stripe API versions across checkout/connect/getStripeId, not just webhooks"
date: 29-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-05
---

# Backlog — Silent Stripe version-mixing proxy (`apps/web/lib/stripe.ts`)

**Raised by:** supabase-interconnect Phase 5 PLAN-SUPPLEMENT inner-loop pass (29-07-26), during
research into the dual-webhook mutual-exclusion guard. Out of Phase 5's scope (architectural,
touches checkout/connect surfaces well beyond billing-unification's blast radius) — recorded here
as a genuine follow-up task, not fixed by this phase.

## What

`apps/web/lib/stripe.ts:17-68` exports a default `stripe` object built by `createFallbackProxy`,
a `Proxy` wrapper that calls every method on `stripeV2` first and **silently falls back to
`stripeV1` on any failure** (`catch` block logs and retries on the other client instance). This
default export is imported wherever code just needs "the" Stripe client — not only the two
explicit webhook routes (`webhook/v1`, `webhook/v2`) that intentionally keep separate clients.

## Why it's a risk

- A transient V2 API error (rate limit, timeout, partial outage) silently re-runs the same
  operation against a **different Stripe account/API version** (V1) without any log-level
  distinction visible to an on-call engineer beyond a `console.error` line.
- Any code path using the default `stripe` export (checkout creation, Connect account operations,
  `getStripeId`) inherits this behavior even though those call sites never opted into dual-version
  fallback semantics — they just imported "stripe".
- This is architecturally distinct from the webhook mutual-exclusion guard Phase 5 is building:
  the guard governs which provider's *webhook* may write `users_to_plans`; this proxy governs which
  Stripe *account* actually executes an *outbound* API call, and can silently do so inconsistently
  request-to-request.

## Suggested resolution (future task, not scoped)

- Audit every import of the default `stripe` export from `apps/web/lib/stripe.ts` and decide,
  per call site, whether V1/V2 fallback is actually desired or whether the call site should pin to
  one explicit client (`stripeV1` / `stripeV2`) instead.
- If fallback behavior is intentionally kept, add structured logging (which client actually served
  the request) so version-mixing is observable, not just a swallowed exception.

## Status

Not fixed. Recorded as a discovered risk during Phase 5 research; no action taken on this file
beyond the (separate, in-scope) lazy-getter conversion tracked in Phase 5's own checklist.
