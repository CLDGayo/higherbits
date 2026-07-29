---
name: note:get-invoices-backfill-removal
description: "GET /api/stripe/get-invoices is a read endpoint that still mutates users_to_plans ownership state on the unowned-row path; full removal is safer than the current guard"
date: 29-07-26
metadata:
  node_type: memory
  type: note
  feature: supabase-interconnect
---

# Remove the `get-invoices` `meta.stripe_customer_id` backfill entirely (A4 deprecation)

**Status:** open, found during Phase 05 EVL fix cycle 1 (29-07-26). Follow-up to the
CRITICAL defect closed in that cycle — the guard fix is a correct, minimal patch, not
the final shape this should have.

## What exists today

`apps/web/app/api/stripe/get-invoices/route.ts` is nominally a **read** endpoint (list
a user's invoices) but has a side effect: when it can't find `meta.stripe_customer_id`
on the user's `users_to_plans` row, it searches Stripe by email and — if it finds any
matching customer — **writes** that customer id back onto the row.

Phase 05's EVL fix cycle guarded this write with `hasLemonSqueezyMarker()` so it no
longer plants a Stripe ownership marker onto a Lemon-Squeezy-owned row (see
`phase-05-billing-evl-iteration-001_REPORT_29-07-26.md` for the full defect writeup).
That fix is correct and sufficient to close the immediate cross-provider-cancellation
bug. It does not change the underlying shape: **a read endpoint still mutates billing
ownership state** on the unowned-row path (a free/no-marker user viewing invoices with a
discoverable Stripe customer still gets `meta.stripe_customer_id` backfilled).

## Why this is worth revisiting

A GET route that writes billing-critical state is the wrong shape regardless of how
well-guarded the write is:
- It's surprising — nothing about "list my invoices" suggests a DB write will happen.
- Every future billing-derivation change (e.g. a new provider, a new marker field) has
  to remember this route is also a writer, not just Stripe v1/v2 webhooks, the LS
  webhook, and the cron. That's the exact class of miss that caused the CRITICAL defect
  in the first place — this route wasn't even in the "four writers" count until an
  independent adversarial review found it as a fifth.
- The backfill is a cache optimization, not a correctness requirement: `customerId` is
  already resolved locally in the same request and used for `invoices.list` regardless
  of whether the persist succeeds. Removing the backfill costs one extra Stripe customer
  lookup on the next page load and nothing else.

## Recommended fix (future phase / standalone task)

Remove the `meta.stripe_customer_id` backfill write from `get-invoices/route.ts`
entirely — do not merely guard it further. Resolve `customerId` locally per-request for
the invoice list and stop writing it back. If a future phase wants the caching behavior
back, it should live in an explicit, named write path (e.g. a dedicated
"link Stripe customer" action) that is enumerated alongside the other `users_to_plans`
writers and passes through `apps/web/lib/billing-provider-guard.ts`, not implicitly
inside a GET handler.

## Not done here because

Out of Phase 05's EVL fix-cycle scope (minimal, targeted fix only, per the phase's own
scope-discipline rule). This is genuine follow-up work, not a currently-open bug — the
guard fix already closes the exploitable path.
