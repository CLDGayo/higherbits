---
name: report:phase-05-billing-evl-iteration-001
description: "Supabase Interconnect Phase 05 — EVL fix cycle 1 (CRITICAL fifth-writer defect closed)"
date: 29-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-05
  domain: tests
  cycle: 1
  loop: evl
---

# Phase 05 — EVL Iteration 001

**Plan:** `.../phase-05-billing_PLAN_25-07-26.md`
**Cycle:** 1 · **Trigger:** CRITICAL defect from independent adversarial code review · **Date:** 29-07-26

---

## Why this cycle exists

The automated gates were green. All five EVL gates passed on the first run — tsc scoped-clean, 110/111
tests, both harness validators, clean diff-check. A phase that trusted its gates would have closed here.

It would have shipped a bug that silently cancels paying customers.

`vc-execute-agent` had flagged, unprompted, that its own `review-decision.json` was a **self-review**
rather than an independent one, and left `mustStopBeforeFinalize` set. That honesty is what triggered
the independent review. The review found the defect the gates could not.

## The defect

`apps/web/app/api/stripe/get-invoices/route.ts` was a **fifth, unguarded writer** to `users_to_plans`.
The phase had carefully guarded four (Stripe v2, Stripe v1, the LS webhook, the dormant Stripe cron)
and verified each one. This one was never in the count.

It is reachable on an ordinary page load, not an edge case: `settings/billing/page.client.tsx` calls
`fetchInvoices()` in a mount-time `useEffect` whenever `subscription && currentPlanId !== "free"` —
which is to say, for **paying** users specifically.

The chain:

1. A paying Lemon Squeezy subscriber's row is `status: "active"`, `lemon_squeezy_subscription_id` set,
   `meta: null` — the healthy shape `clearingPatchFor` produces.
2. They open `/settings/billing`.
3. The route finds no `stripe_customer_id`, so it searches Stripe by email, then scans up to 100
   customers for a `metadata.userId` match.
4. If any Stripe customer exists for that email — an abandoned checkout, an old trial, any prior
   touch — it writes `meta.stripe_customer_id` onto the LS-owned row, unguarded.
5. `hasStripeMarker()` treats a bare `stripe_customer_id` as sufficient, so the row now derives as
   **`ambiguous`**.
6. The guard's rule 3 auto-allows *any* subsequent write to an ambiguous row. A stale Stripe
   `customer.subscription.deleted` for that dormant customer then sets `status: "inactive"` — on
   someone who is actively paying.

## Why it was missed, and the durable correction

The phase scoped the guard to "routes that write `status`." That framing is wrong.

The real blast radius is **any writer of the fields `deriveBillingProvider` reads** — `meta` and
`lemon_squeezy_subscription_id`. A `meta`-only write changes row ownership just as decisively as a
`status` write, and does it silently.

The plan even *names* this file (line 88) as a place `meta.stripe_customer_id` gets written — but in a
"where does provider data live" sense. Its write path was never evaluated against the guard's own
invariant. Being mentioned in a plan is not the same as being analyzed.

This is a new finding, not the already-accepted A4 invoices-display deferral. A4 deferred the *display*
problem; nobody had looked at the *write*.

## The fix, and why the reviewer's own suggestion was rejected

The reviewer offered two shapes. `vc-execute-agent` rejected the first — routing through
`guardBillingWrite` — for two concrete reasons, and was right to:

- `guardBillingWrite` blocks only **active** cross-provider rows. An *inactive* LS row would still be
  backfilled into ambiguity.
- Rule 3 requires an ownership-establishing write to merge `clearingPatchFor`, which nulls
  `lemon_squeezy_subscription_id` — an irreversible ownership change performed by a read-only invoice
  fetch.

The chosen fix skips the backfill when `hasLemonSqueezyMarker(userPlanData)` is true. That predicate is
status-independent, so it also protects inactive rows and already-ambiguous legacy rows. The backfill is
a cache, not a correctness requirement — `customerId` is resolved locally and the invoice list is
unaffected; the only cost is one extra Stripe lookup next load.

A second, smaller fix moved the `users.lemon_squeezy_customer_id` write in the LS webhook below the
guard check, so a guard-skip is a clean no-op rather than leaving a partial record.

## Test

`apps/web/app/api/stripe/get-invoices/__tests__/no-lemon-pollution.test.ts`, asserting on mocked write
arguments and absence — never HTTP status.

The fixture design matters more than the assertion: a Stripe customer **is** discoverable by email, and
the test asserts `stripeCustomersList` was actually called. Without that, the route would return
`{ invoices: [] }` early and the test would pass for the wrong reason — green because the code never ran,
not because it behaved. A third case proves the backfill still happens on an unowned row, so the fix does
not over-block.

## Gates

Tests 110/111 → **113/114**; the sole failure remains the pre-existing, unrelated `lib/registry.test.ts`.
Full-project `tsc --noEmit` shows zero errors across all touched paths. The 3 foreign `TS2786` errors in
`page.client.tsx` persist unchanged. Repo-wide count drifted 1163 → 1165 from the user's ~147 concurrent
edits — foreign, and not attributable here since every touched path is clean.

## What this cycle says about the process

**Green gates are not evidence of correctness on a high-risk surface.** Every automated gate passed
before and after; they were never going to catch this. The defect was found by an agent whose only
instruction was to assume something was wrong and go looking.

**The self-review disclosure was the load-bearing moment.** `vc-execute-agent` could have quietly filed
its self-review as the evidence pack's review leg. It flagged the gap instead, which is the only reason
an independent pass ran at all.

**"Assume a fifth thing exists" found the fifth thing.** PVL had already found a marker-residue bug and
an unguarded fourth writer. Instructing the reviewer to assume another remained was not rhetorical.

## Residual

`get-invoices` still writes `users_to_plans` on the unowned-row path. A read endpoint that mutates
billing ownership state is the wrong shape regardless of the guard, and full removal of the backfill
would be strictly safer — but that is scope expansion, deliberately not taken here. Folded into the A4
deprecation conversation.

Cycles used: 1 of 10.
