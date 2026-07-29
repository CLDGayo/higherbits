---
name: plan:supabase-interconnect-phase-05-billing
description: "Supabase Interconnect — Phase 05: Billing unification (LS-aware routing + dual-webhook mutual exclusion)"
date: 25-07-26
metadata:
  node_type: memory
  type: plan
  feature: supabase-interconnect
  phase: phase-05
---

# Phase 05 — Billing Unification

**Program:** supabase-interconnect
**Umbrella plan:** process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/supabase-interconnect-umbrella_PLAN_25-07-26.md
**Phase status:** 🧪 TESTING — EVL-confirmed (29-07-26), 1 EVL fix cycle (CRITICAL defect closed and
re-verified); UPDATE PROCESS complete; kept in active/testing pending genuine Known Gaps (see report)
**Report destination:** process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-05-billing_REPORT_{dd-mm-yy}.md (flat in the program task folder)
**Parallel-safe with:** Phase 4 (Navigation) — disjoint file ownership, see umbrella `## Pre-PVL Conflict Resolution`. Reconfirmed disjoint by outer-PVL (25-07-26): zero path overlap between this phase's Blast Radius and the Phase 4 registry entry.

---

## Purpose

Finish the payment-provider migration that was started: make `/settings/billing`'s cancel/invoice
flow provider-aware so a Lemon Squeezy subscriber (the provider people actually use to pay) isn't
silently routed to Stripe-only endpoints, and add a documented mutual-exclusion guarantee so the
two webhook families can never both grant a plan for the same event. `users_to_plans` has 0 live
rows, so all verification is fixture-based per the SPEC's Cross-Cutting Requirement — this is not a
data-population task.

---

## Entry Gate

- Phase 1 exit gate passed (grants sane — no billing-adjacent query hits 42501)

---

## Blast Radius

- `apps/web/app/settings/billing/page.client.tsx` (cancel/invoice routing logic —
  currently Stripe-only at lines 184, 159)
- `apps/web/app/api/lemonsqueezy/webhook/route.ts` (existing LS webhook — add mutual-exclusion
  marker/check). **Note (outer-PVL, 25-07-26): this file has an uncommitted WIP diff (+25 lines,
  Clerk `publicMetadata` sync on the create/cancel branches) — build on top of it, do not
  overwrite or revert it.** **Correction (inner-PVL, 29-07-26):** confirmed via `git status --short` this file now has zero uncommitted changes — the +25-line Clerk sync described above is fully committed. The "build on top of it" guidance still holds; only the "uncommitted" framing was stale.
- `apps/web/app/api/stripe/webhook/v2/route.ts` (existing Stripe webhook — add mutual-exclusion
  marker/check)
- `apps/web/app/api/stripe/webhook/v1/route.ts` **(added by outer-PVL, 25-07-26 — see Step B0
  below).** Confirmed on disk to independently write `users_to_plans` at 8 sites (same shape as
  v2) and to read its own signature secret (`STRIPE_WEBHOOK_SECRET_V1`), i.e. it is a second live
  code path capable of granting a plan. The original plan draft scoped the mutual-exclusion
  guarantee to v2 only — that would leave AC11 ("Stripe and Lemon Squeezy webhooks cannot both
  grant a plan") incompletely proven. INNOVATE must decide v1's disposition (guard it too / confirm
  genuinely dead and document why it's exempt) rather than silently leaving it unguarded.
- `apps/web/lib/lemonsqueezy.ts`, `apps/web/lib/stripe.ts` (provider-detection helper logic, and/or
  a new shared helper if one doesn't exist)
- Possibly `apps/web/app/api/lemonsqueezy/` — new cancel/invoice route(s) if none exist yet
  alongside the existing Stripe-only ones. **Confirmed on disk (outer-PVL, 25-07-26): only
  `webhook/route.ts` and `create-checkout/route.ts` currently exist under
  `apps/web/app/api/lemonsqueezy/` — no cancel/invoice route exists yet, so A4 below is a genuine
  net-new (but in-scope, per SPEC AC10) route pair, not a rename.**
- **New (29-07-26 inner-loop supplement): `apps/web/lib/billing-provider-guard.ts`** — new shared
  helper implementing the B1 mutual-exclusion mechanism (see Step B1 for exact behavior).
- **New (29-07-26): root `.env.example`** — checklist item to document (names only, never
  values) the provider secret env vars this phase's files reference (see Step E1).
- **Source-of-truth correction (29-07-26, research):** for `users_to_plans.lemon_squeezy_subscription_id`,
  `apps/web/types/supabase.ts` (confirmed present, 3 occurrences) and `apps/web/sql/add_lemonsqueezy_fields.sql`
  (confirmed present) are CURRENT. `apps/web/prisma/schema.prisma:669-680`'s `users_to_plans` model
  is STALE and does NOT have this column (confirmed by direct read — model has only `id, created_at,
  updated_at, user_id, plan_id, status, meta, last_paid_at`). This inverts this program's usual
  "types.ts is stale fiction" default for this one field — stated explicitly here so a later reader
  does not "correct" it back to the Prisma schema's shape. (Note: the schema file's real path is
  `apps/web/prisma/schema.prisma`, not `packages/db/prisma/schema.prisma` as an earlier draft of
  this instruction assumed — `packages/db` has no `.prisma` file in this repo.)
- **New (29-07-26 inner-loop PVL discovery): `apps/web/app/api/subscription/stripe-cron/route.ts`** — confirmed on disk to be a FOURTH independent writer of `users_to_plans` (3 sites setting `status: "inactive"`, purely from Stripe-side signals in `meta` — no Lemon Squeezy awareness, no use of the new guard). Auth-gated by `CRON_SECRET` bearer token (not open/unauthenticated) and currently NOT scheduled to run (per `process/context/all-context.md` — the `vercel.json` cron entry never fires on the gayo-vps pm2 deployment; no crontab/n8n equivalent is wired). See Step B0b for the required disposition decision — do not leave this silently excluded from AC11's guarantee the way the original draft silently excluded Stripe webhook v1.

---

## Implementation Checklist

### Step A — Provider-aware routing on `/settings/billing`

- [x] A1. **Provider-identity mechanism CONFIRMED by outer-PVL (25-07-26) — no schema migration
      needed.** `users_to_plans` already fully encodes provider identity across its existing
      columns: the top-level `lemon_squeezy_subscription_id` column is non-null for LS subscribers;
      Stripe subscribers instead carry `stripe_subscription_id` / `stripe_customer_id` inside the
      JSON `meta` column (written by `cancel-subscription/route.ts` and `get-invoices/route.ts`
      today). Do NOT add a new `provider` column — derive it from these two existing fields. If
      research turns up a genuine case these fields can't disambiguate, escalate to INNOVATE with
      that specific evidence rather than defaulting to a migration.
- [x] A2. Add a provider-detection helper (in `lib/lemonsqueezy.ts`, `lib/stripe.ts`, or a new
      shared `lib/billing.ts`) that resolves "is this user's active subscription Stripe or Lemon
      Squeezy" from the fields confirmed in A1.
- [x] A3. Update `page.client.tsx:184` (cancel) and `page.client.tsx:159` (invoices) to branch on
      the detected provider — Stripe subscriber → existing Stripe-only route; Lemon Squeezy
      subscriber → new/existing LS-aware route. **Fail-safe default required (outer-PVL note):**
      when neither provider marker is present (e.g. free user, or a genuinely ambiguous row), the
      UI must show a clear "no active subscription" / error state — it must never fall through to
      silently calling the Stripe endpoint by default, since that is the exact bug this phase
      exists to fix.
- [x] A4. If no Lemon Squeezy cancel/invoice API route exists yet (confirmed: none exist — see
      Blast Radius), create the minimal route(s) needed (`apps/web/app/api/lemonsqueezy/cancel/route.ts`,
      `apps/web/app/api/lemonsqueezy/invoices/route.ts` or equivalent) — repair/connect only, no new
      product surface beyond what SPEC AC10 requires. **Must auth-gate identically to the existing
      Stripe routes** (`await auth()` → 401 if no `userId`, matching `cancel-subscription/route.ts`
      and `get-invoices/route.ts`) — the original draft did not call this out explicitly.
      **Scope decision (29-07-26 inner-loop supplement): the CANCEL route is the priority — it is
      the destructive path an LS subscriber currently cannot perform at all via this UI. The
      INVOICES route/branch is explicitly DEFERRED to backlog for this phase** (page.client.tsx:159
      keeps calling `/api/stripe/get-invoices` unconditionally for now) — invoices is a display
      inconsistency (an LS subscriber sees an empty/wrong invoice list), not a broken destructive
      action, so it is lower severity than cancel. Document this deferral in the phase report;
      write a dedicated backlog note if execute-agent confirms the invoices gap is still open at
      EVL.

### Step B — Dual-webhook mutual exclusion

- [x] B0. **(New, outer-PVL 25-07-26).** Decide `apps/web/app/api/stripe/webhook/v1/route.ts`'s
      disposition as part of INNOVATE: either (a) apply the same mutual-exclusion guard to it as
      v2, or (b) confirm it is genuinely unreachable in production (e.g. no `STRIPE_WEBHOOK_SECRET_V1`
      configured live / no webhook endpoint registered in the Stripe dashboard for it) and document
      that finding + rationale in the phase report. Do not leave this undecided — AC11's "cannot
      both grant a plan" guarantee is incomplete if a second live Stripe-writing path is silently
      excluded. **Honest status (29-07-26 inner-loop supplement, research):** whether the
      `STRIPE_WEBHOOK_SECRET_V1` env var is actually set in any live environment, and whether a
      Stripe Dashboard endpoint still points at `/api/stripe/webhook/v1`, could NOT be determined
      read-only from this repo — this genuinely is unresolved, not merely unconfirmed. Default
      decision pending INNOVATE: guard it defensively (treat as potentially live) rather than
      assume it dead, since a wrong "dead" assumption would leave AC11 unproven. A build-time or
      runtime presence check for that env var (existence only, never the value, in the target
      deploy environment) is available if it would help settle this and is cheap to run; it is not
      required to proceed with the defensive-guard default.
- [x] B0b. **(New, inner-PVL cycle-1, 29-07-26 — see Blast Radius.)** Decide `apps/web/app/api/subscription/stripe-cron/route.ts`'s disposition, mirroring B0's pattern: either (a) route its `status: "inactive"` writes through the same guard/derivation so it never deactivates a row whose current owner is the OTHER provider, or (b) confirm and document that once B1's mutual-clearing fix ships, a row that has switched providers no longer carries the stale Stripe `meta` fields this cron keys off of, so it naturally becomes a no-op for switched rows without any direct code change. Do not leave this cron silently unguarded and undocumented — it is a real, currently-dormant (unscheduled) but live-invokable (via its `CRON_SECRET`-gated endpoint) fourth writer.
- [x] B1. Design the mutual-exclusion mechanism as a new shared helper,
      **`apps/web/lib/billing-provider-guard.ts`** (29-07-26 inner-loop supplement — names the file
      explicitly; do not scatter the logic inline across the three webhook routes). Behavior:
      derive the row's owning provider from the same A1 signals — `meta.stripe_customer_id` /
      `meta.stripe_subscription_id` (embedded in the `meta` JSON blob) for Stripe, vs the top-level
      `lemon_squeezy_subscription_id` column for Lemon Squeezy. On an **active** cross-provider
      conflict (the existing row's `status` indicates an active/live grant AND its derived provider
      differs from the incoming event's provider): **skip the write and log** — never silently
      overwrite. If the existing row's provider-owning subscription is **canceled** (not active),
      allow the write — this is a legitimate provider switch (e.g. cancel Stripe, later subscribe
      via Lemon Squeezy), not a conflict. Rationale: a canceled row is not "actively owned," so a
      real switch must keep working, while a live grant must never be clobbered by the other
      provider. No new schema column — reuse the same existing-column signals confirmed in A1. **Mutual-clearing requirement (added inner-PVL cycle-1, 29-07-26 — closes a residual-marker gap found during validation):** confirmed on disk that NEITHER existing write path clears the OTHER provider's identity markers on a legitimate switch — Stripe's update never touches `lemon_squeezy_subscription_id`; Lemon Squeezy's update never touches `meta` at all. Left as-is, a legitimate switch (either direction) leaves BOTH markers simultaneously present on the row (one live, one stale), which makes any later single-marker-presence check ambiguous and risks misidentifying the row's true owner on a subsequent event. **B2's write in each of the three webhooks MUST therefore also null out the other provider's markers in the SAME write that establishes a new owner:** switching a row TO Lemon Squeezy must set `meta` to `null` (or strip `stripe_customer_id`/`stripe_subscription_id`/`stripe_plan_id` from it); switching a row TO Stripe must set `lemon_squeezy_subscription_id: null`. This makes the two markers mutually exclusive by construction instead of relying on a runtime "which one wins" derivation.
- [x] B2. Implement the check in `app/api/lemonsqueezy/webhook/route.ts`, `app/api/stripe/webhook/v2/route.ts`,
      and (per the B0 decision) `app/api/stripe/webhook/v1/route.ts` — do not weaken the existing
      signature verification or `payment_status` allow-list gate while adding this (hard safety
      constraint, also stated at umbrella level). **Clerk-sync sequencing (inner-PVL cycle-1, 29-07-26):** in `app/api/lemonsqueezy/webhook/route.ts`, the Clerk `publicMetadata.isPro` sync call runs unconditionally after the write block, independent of whether `existingUserPlan` triggered an update or insert. When the guard causes a write to be skipped, the function must `return` before reaching the Clerk sync line — a skipped DB write followed by an unconditional Clerk sync would desynchronize Clerk's `isPro` claim from the actual `users_to_plans` row.
- [x] B3. Write a unit test simulating both webhooks firing for equivalent/same-user events,
      asserting only one grant lands and the second is a documented no-op or rejection (SPEC AC11).
      **Must also cover the legitimate provider-switch case** (e.g. a user who genuinely cancels
      Lemon Squeezy and later subscribes via Stripe) as a distinct scenario from an
      accidental/duplicate double-grant — a mechanism that blocks all provider switches
      unconditionally is not a correct implementation of B1's documented behavior. **Test-infra
      note (outer-PVL, 25-07-26):** no existing test file covers Stripe webhook v1 or v2 today
      (`apps/web/app/api/lemonsqueezy/__tests__/webhook.test.ts` exists, 115 lines, LS-only) — this
      test must be authored from scratch for the Stripe side, not merely extended.
      **Assertion guidance (29-07-26 inner-loop supplement):** extend the mocking pattern from
      `apps/web/app/api/lemonsqueezy/__tests__/webhook.test.ts` (mock `supabaseWithAdminAccess`,
      not real network calls) to all three routes. Assertions MUST target the **mocked
      `users_to_plans` write call's arguments, or its absence** (e.g. `expect(mockUpdate).not.toHaveBeenCalled()`
      or `expect(mockUpdate).toHaveBeenCalledWith(...)`) — **NOT** the route's HTTP status code. A
      webhook can return 200 while silently performing (or silently skipping) the wrong write; a
      200 assertion alone proves nothing about billing correctness. Required cases: (1) same-provider
      renewal ALLOWED — this catches a buggy provider-derivation that wrongly blocks a legitimate
      renewal; (2) cross-provider blocked in BOTH directions (Stripe blocks an active LS row, LS
      blocks an active Stripe row); (3) canceled-row provider-switch ALLOWED. **Mock chain shape (inner-PVL cycle-1, 29-07-26):** the existing LS test's mock chain uses `.maybeSingle()` (matching the LS webhook's own query); the Stripe v1/v2 webhook code uses `.single()` for its `existingUserPlan` lookup — new Stripe tests must mock the chain shape each route actually calls, not copy the LS test's chain verbatim. **Add a 4th required case: (4) after a provider switch, the losing provider's marker is nulled in the SAME write** (assert the mocked update/insert call's arguments include the other provider's field set to null per B1's mutual-clearing requirement) — this is what prevents the residual-marker ambiguity B1 was amended to close.

### Step C — Fixture-based verification (SPEC AC10)

- [x] C1. Write a Stripe-provider fixture (mocked `users_to_plans` row with the `meta.stripe_*`
      fields set per A1) and confirm the billing page selects the Stripe cancel/invoice path.
- [x] C2. Write a Lemon-Squeezy-provider fixture (`lemon_squeezy_subscription_id` set per A1) and
      confirm the billing page selects the LS-aware path.
- [x] C3. If a live Lemon Squeezy test account is available (per SPEC Known Gaps — not confirmed),
      attempt an Agent-Probe end-to-end confirmation; otherwise document as INCONCLUSIVE/Known Gap
      per the SPEC's explicit allowance.

### Step D — `lib/stripe.ts` lazy-getter conversion (new, 29-07-26 inner-loop supplement)

- [x] D1. Convert `stripeV1`/`stripeV2`/`stripe` in `apps/web/lib/stripe.ts` from eager module-scope
      construction (`export const stripeV1 = new Stripe(stripeSecretKeyV1)` at line 14, which
      currently `throw`s at import time when `STRIPE_SECRET_KEY_V1`/`V2` are unset — confirmed on
      disk) to lazy getters behind the repo-standard `paymentsNotConfigured()` guard — the pattern
      four existing checkout routes already use (`all-context.md` §Deployment learning #4). This is
      a **separate checklist item from B1/B2** (same file, different review/test concern — the
      guard logic and the lazy-init logic should be reviewed independently). Do not weaken or
      remove the existing `createFallbackProxy` behavior as part of this conversion; the
      version-mixing risk in that proxy is tracked separately (see
      `process/features/supabase-interconnect/backlog/stripe-fallback-proxy-version-mixing_NOTE_29-07-26.md`)
      and is explicitly out of scope for this phase.

### Step E — Env var documentation (new, 29-07-26 inner-loop supplement)

- [x] E1. Add a checklist item documenting (in root `.env.example`, **names only, never
      values**) the env vars this phase's files reference: `STRIPE_SECRET_KEY_V1`,
      `STRIPE_SECRET_KEY_V2`, `STRIPE_WEBHOOK_SECRET_V1`, `STRIPE_WEBHOOK_SECRET_V2`,
      `LEMON_SQUEEZY_WEBHOOK_SECRET`, and `LEMON_SQUEEZY_API_KEY` (confirmed exact name via direct
      read of `apps/web/lib/lemonsqueezy.ts:8`, `configureLemonSqueezy()`). Root env-example file
      currently has zero Stripe/LS entries (confirmed absent via grep). Never write actual secret
      values into this file — variable names only.

---

## Exit Gate

**Gate scope decision (29-07-26 inner-loop supplement, orchestrator + user):** the repo-wide
`tsc --noEmit` currently fails with **~1160 errors** — 100% attributable to two foreign,
uncommitted causes: (1) the user's uncommitted `package.json`/`pnpm-lock.yaml` state (duplicate
React types producing `TS2786`), and (2) a stale `.next` cache referencing a deleted `api/test-db`
route. This is a documented, accepted **known-gap baseline** — Phase 5 does NOT need to fix it and
CANNOT reasonably gate on a repo-wide check while it is red for reasons outside this phase's blast
radius. Phase 5's Exit Gate therefore uses a **SCOPED tsc check** covering only the files this
phase touches, per the file list below (mirrors the Phase 5 Blast Radius / Touchpoints sections).

```bash
# CORRECTED inner-PVL cycle-1, 29-07-26 — the command below as originally written does NOT work:
# (a) repo-root-relative paths 404 under `--filter web` (cwd becomes apps/web); (b) even with
# apps/web-relative paths, passing an explicit file list to tsc bypasses tsconfig.json resolution
# (no --jsx flag, no path aliases) and fails on unrelated grounds. Confirmed empirically this PVL
# pass. Use the full-project run and grep for this phase's files instead:
corepack pnpm --filter web exec tsc --noEmit 2>&1 | grep -E "settings/billing/page.client|lemonsqueezy|stripe/webhook|lib/stripe\.ts|billing-provider-guard"
# BASELINE captured this PVL pass (29-07-26, before any Phase 5 code changes): exactly 3 errors,
# all TS2786 ("'Button' cannot be used as a JSX component") in page.client.tsx at lines 61, 539,
# 570 — 100% attributable to the documented foreign duplicate-React-types baseline (uncommitted
# package.json/pnpm-lock.yaml), NOT to this phase's edits. Gate criterion is therefore a DELTA
# check, not "exit 0" (exit 0 is not achievable for page.client.tsx until the foreign React-types
# issue is fixed, which is out of this phase's scope): PASS if the only lines reported for these
# grep patterns are the 3 known TS2786 lines above (or fewer, e.g. if the foreign issue is fixed
# upstream in the meantime) — FAIL if any NEW error appears in a Phase 5 file, or if a NEW error
# type appears in page.client.tsx beyond the 3 known TS2786 lines.

corepack pnpm --filter web test
# Vitest baseline (29-07-26, confirmed via direct run): 81/82 tests passing — 1 pre-existing
# failure in apps/web/lib/registry.test.ts, unrelated to billing (do not attempt to fix as part
# of this phase). Expected: 82/82 once this phase's new fixture-based routing tests and webhook
# mutual-exclusion tests (Steps B3, C1, C2) are added and green, plus the same 1 known pre-existing
# failure — i.e. gate PASSES if the only remaining failure is the documented registry.test.ts one.
```

- All Step A-E checklist items checked (including new B0, D1, E1)
- Fixture-based test confirms correct cancel/invoice routing per provider (SPEC AC10)
- Unit test confirms webhook mutual exclusion, including the provider-switch scenario (SPEC AC11)
- Existing webhook signature verification and `payment_status` allow-list gate unweakened (v1 and v2)
- Live LS API confirmation attempted if credentials available, else documented as Known Gap
- **High-risk evidence pack produced (outer-PVL requirement — billing is a high-risk class per
  `process/development-protocols/orchestration.md` §High-Risk Execution Handoff).** 5-artifact set
  (`risk-gate.json`, `context-snippets.json`, `verification.json`, `review-decision.json`,
  `adversarial-validation.json`) written to
  `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/harness/phase-05/`
  before this phase is treated as finalize-ready. See `vc-risk-evidence-pack` skill for schema.
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Phase 1 exit gate not yet passed and a billing-adjacent query hits 42501 — blocked on Phase 1.
- ~~No existing column/convention records subscription provider identity...~~ **RESOLVED by
  outer-PVL (25-07-26) — see A1. This is confirmed NOT a blocker: provider identity is derivable
  from existing columns, no schema migration required.**

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — confirmed provider-identity storage convention in `users_to_plans` (A1's
      outer-PVL finding re-verified: `meta.stripe_*` vs top-level `lemon_squeezy_subscription_id`,
      current source-of-truth is `types/supabase.ts` + `add_lemonsqueezy_fields.sql`, NOT the stale
      Prisma schema); confirmed `apps/web/lib/lemonsqueezy.ts` env var name
      (`LEMON_SQUEEZY_API_KEY`); confirmed `apps/web/lib/stripe.ts` eager-construction throw
      behavior at line 14; confirmed no cancel/invoice LS routes exist; v1 webhook live/dead status
      for B0 could NOT be determined read-only — recorded as a genuinely unresolved item (see B0).
- [x] 2. INNOVATE — decided: (B0) guard v1 defensively rather than assume dead, pending an optional
      cheap env-presence check; (B1) shared helper `apps/web/lib/billing-provider-guard.ts` with
      active-vs-canceled-row disambiguation (skip+log on active conflict, allow on canceled-row
      switch) — no new schema column.
- [x] 3. PLAN-SUPPLEMENT — this pass. Existing phase plan updated: shared guard helper named (B1),
      v1's unresolved status stated honestly (B0), lazy-getter `lib/stripe.ts` conversion added as
      its own item (D1), env-var-name documentation added (E1), invoices deferred to backlog (A4),
      test-assertion guidance tightened to mocked-write-args not HTTP-status (B3), Exit Gate
      rewritten to scoped tsc + documented foreign baselines, prisma-schema staleness correction
      recorded, 2 backlog notes written. Inner Loop Refresh Note written below.
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md`
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all 5 gates green on first run; independent adversarial review then found and closed 1
      CRITICAL + 1 MEDIUM defect (EVL Fix Cycle 1, 29-07-26); re-confirmed green after fix (113/114
      vitest, zero new tsc errors); follow-up stubs registered (2 new backlog notes); EVL HANDOFF
      SUMMARY written
- [x] 7. UPDATE PROCESS — phase report finalized (`mustStopBeforeFinalize` cleared), umbrella
      `## Current Execution State` rewritten, context docs updated. Commit pending orchestrator
      (process commit, separate from any execution commit).

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first.

---

## Deviations (EXECUTE, 29-07-26)

Three files were edited that the Blast Radius did not name. All three are
additive, within the billing surface, and were required to implement A3 at all.
None is a hard-stop class (no schema change, no auth change, no breaking
public-contract change).

1. **`apps/web/app/settings/billing/page.tsx`** — added
   `lemon_squeezy_subscription_id` to the `users_to_plans` select and to the
   `PlanInfo` object it passes to `page.client.tsx`.
   *Why:* the client had no Lemon Squeezy marker to branch on — `page.tsx` is
   the sole supplier of `subscription` to the file the plan DID name. A3 is
   unimplementable without it. Side effect: also fixes the pre-existing dead
   reference at `page.client.tsx:242`, which read
   `subscription?.lemon_squeezy_subscription_id` when that field was never
   populated.
2. **`apps/web/hooks/use-subscription.ts`** — added `stripe_subscription_id?:
   string` to the `PlanInfo` interface (the field the client is typed against
   already had the LS one but not the Stripe one).
   *Why:* type-only, additive; needed for the provider derivation to compile.
3. **`apps/web/lib/billing-provider-guard.ts`** gained two client-facing
   exports beyond B1's server-side guard — `deriveProviderFromPlanInfo` (works
   on the flattened `PlanInfo` shape rather than a raw row) and
   `cancelEndpointFor` (provider → endpoint, `null` = no active subscription).
   *Why:* keeps one source of truth for provider derivation across server and
   client instead of duplicating the rule inline in the page.

**B0b disposition chosen: option (a)** — the cron route now explicitly skips
Lemon-Squeezy-owned rows via `deriveBillingProvider`, rather than relying on
option (b)'s "naturally becomes a no-op" reasoning. Option (b)'s reasoning was
independently confirmed correct (a post-switch LS row has `meta = null`, so the
existing `if (!periodEnd) continue` at line ~88 already skips it), but an
explicit guard does not depend on that indirect precondition holding.

**B0 disposition chosen: guard defensively.** Stripe webhook v1's live/dead
status remains genuinely unresolved — see the phase report.

---

## Touchpoints

- `apps/web/app/settings/billing/page.client.tsx`
- `apps/web/app/api/lemonsqueezy/webhook/route.ts`
- `apps/web/app/api/stripe/webhook/v2/route.ts`
- `apps/web/app/api/stripe/webhook/v1/route.ts` (added by outer-PVL — see Blast Radius)
- `apps/web/lib/lemonsqueezy.ts`
- `apps/web/lib/stripe.ts`
- new `apps/web/app/api/lemonsqueezy/cancel/route.ts`, `apps/web/app/api/lemonsqueezy/invoices/route.ts`
  (confirmed net-new — neither exists on disk today)
- new `apps/web/lib/billing-provider-guard.ts` (added 29-07-26 — shared mutual-exclusion helper)
- root `.env.example` (added 29-07-26 — env var name documentation only)
- `apps/web/app/api/subscription/stripe-cron/route.ts` (added 29-07-26 inner-loop PVL discovery — 4th `users_to_plans` writer, see Blast Radius and Step B0b)

---

## Public Contracts

- Existing Stripe webhook payload contract and signature verification are unchanged (v1 and v2).
- Existing Lemon Squeezy webhook payload contract and signature verification are unchanged.
- `/settings/billing`'s user-facing cancel/invoice buttons keep their existing labels/UX — only the
  underlying routing target changes to be provider-correct.
- New LS cancel/invoice routes are net-new API surface, not a change to an existing contract; they
  must follow the existing Stripe routes' auth-gating convention (see A4).

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| Fixture-based routing test (Stripe provider, LS provider) | Fully-Automated (vitest/RTL, mocked provider state) | AC10 |
| Webhook mutual-exclusion unit test (incl. provider-switch case, v1+v2) | Fully-Automated (vitest) | AC11 |
| Live LS API end-to-end confirmation | Agent-Probe (may be INCONCLUSIVE — no confirmed test account) | AC10 |
| High-risk evidence pack (billing class) | Manual-first artifact set, not a test gate | Protocol requirement, orthogonal to SPEC ACs |

```bash
corepack pnpm --filter web test
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-05-billing_PLAN_25-07-26.md`
- Last completed step: PLAN-SUPPLEMENT (inner loop, 29-07-26) — Steps 1 (RESEARCH) and 2 (INNOVATE)
  completed this pass; see `## Phase Loop Progress` and `## Inner Loop Refresh Note`
- Validate-contract status: SUPERSEDED pending re-validation — the existing `## Validate Contract`
  below (dated 25-07-26, `generated-by: outer-pvl`) predates this 29-07-26 supplement; the
  `## Inner Loop Refresh Note` date is newer, which is the mechanical trigger for PVL to re-run
  from V1 (per `process/development-protocols/orchestration.md` Step 4b)
- Next step: spawn vc-validate-agent for PVL (Step 4), re-running from V1 against the updated plan
  — NOT execute. Do not route to vc-execute-agent until a fresh `Gate: PASS` (or accepted
  CONDITIONAL) is recorded.

---

## Test Infra Improvement Notes

- No existing test file covers Stripe webhook v1 or v2 (`apps/web/app/api/stripe/webhook/`) as of
  outer-PVL (25-07-26) — only the Lemon Squeezy webhook has coverage
  (`apps/web/app/api/lemonsqueezy/__tests__/webhook.test.ts`, 115 lines). `process/context/tests/all-tests.md`'s
  reference to a Stripe `apps/web/__tests__/webhook.test.ts` (10 tests) does not correspond to any
  file found on disk during this pass — likely the same broader test-baseline documentation drift
  already flagged elsewhere in that file. Not this phase's job to fix the doc drift, but B3's new
  test should not assume prior Stripe webhook test scaffolding exists to build on.

---

## Inner Loop Refresh Note

**Date: 29-07-26**

PLAN-SUPPLEMENT (inner loop Step 3) pass. RESEARCH (Step 1) and INNOVATE (Step 2) ran this
session and surfaced material updates to the existing 25-07-26 outer-PVL plan. Changes applied to
this plan file:

1. Named the B1 mutual-exclusion mechanism as a concrete shared helper file,
   `apps/web/lib/billing-provider-guard.ts`, with an explicit active-vs-canceled-row derivation
   algorithm (was previously described only abstractly).
2. Recorded the source-of-truth correction for `users_to_plans.lemon_squeezy_subscription_id`:
   `types/supabase.ts` + `add_lemonsqueezy_fields.sql` are current; `apps/web/prisma/schema.prisma`
   is stale and missing the column (also corrected the schema's real repo path).
3. Added Step D (`lib/stripe.ts` lazy-getter conversion, D1) as a separate checklist item from the
   B1/B2 guard work.
4. Added Step E (env var name documentation, E1) for the six Stripe/LS secret names this phase's
   files reference.
5. Recorded an explicit backlog deferral for the LS invoices branch in A4 (cancel is the priority;
   invoices deferred).
6. Tightened B3's test-assertion guidance to target mocked `users_to_plans` write-call arguments
   (or their absence), not HTTP status codes.
7. Rewrote the Exit Gate: scoped `tsc --noEmit` covering only this phase's files (repo-wide tsc has
   a documented ~1160-error foreign baseline, 100% attributable to uncommitted user changes and a
   stale `.next` cache — not this phase's job to fix); vitest baseline recorded as 81/82 (1
   pre-existing unrelated failure in `lib/registry.test.ts`).
8. Recorded B0's v1-webhook liveness question as genuinely unresolved (not merely unconfirmed) with
   a defensive-guard default and an optional cheap presence-check escape hatch.
9. Wrote two backlog notes: `stripe-fallback-proxy-version-mixing_NOTE_29-07-26.md` (the
   default-export Proxy's silent V1/V2 fallback, out of scope) and
   `billing-guard-observability-gap_NOTE_29-07-26.md` (log-only conflict handling has no alerting,
   accepted as this phase's mechanism).
10. Updated Blast Radius, Touchpoints, and the program's phase-blast-radius-registry entry for
    Phase 5 to reflect the new files (`billing-provider-guard.ts`, root env-example doc item).

This note's date (29-07-26) is newer than the existing `## Validate Contract`'s date (25-07-26),
which is the mechanical trigger for the orchestrator to re-spawn vc-validate-agent from V1 rather
than proceeding directly to EXECUTE.

---

## Validate Contract

Status: PASS
Date: 29-07-26
date: 2026-07-29
generated-by: inner-pvl: phase-5
supersedes: 2026-07-25 (outer-pvl, PASS) — the 29-07-26 `## Inner Loop Refresh Note` is newer than
the prior contract (per Step 4b, this mechanically triggers a full V1-V7 re-run, not a carry-over).
This inner-PVL cycle re-verified every prior claim against current disk state (all confirmed
accurate: A1 provider-identity columns, D1's `lib/stripe.ts` throw behavior, E1's env var names,
the 81/82 vitest baseline, the LS webhook's now-committed Clerk sync) and additionally found and
closed 3 NEW gaps the outer-pvl pass did not have the evidence to catch: (1) a residual
cross-provider marker bug in B1's derivation, (2) a previously-undetected 4th `users_to_plans`
writer (`stripe-cron/route.ts`), and (3) a broken Exit Gate `tsc` command (wrong path prefix +
an unachievable "exit 0" success criterion for a file that already carries a foreign error). All
3 are resolved via direct plan-text edits (see Dimension findings below), consistent with how the
prior outer-pvl contract itself resolved its own 2 CONCERNs.

Parallel strategy: sequential (single-agent synthesis)
Rationale: 7-signal score 4/7 (S2 schema/API/auth-adjacent surface — new billing API routes +
provider-state writes; S4 phase-program classification; S6 high-risk billing class; S7 8 blast-radius
files) nominally recommends Workflow/Agent-team per the threshold table, but the Strategy Boundary
fit-rule governs: this V2 fan-out is read-only investigation (direct file reads, grep, disk
existence checks, live `pnpm test`/`tsc` runs) with no cross-agent coordination need — the correct
execution shape is parallel subagents. This session's spawn environment had no Agent-tool available
to fan out literally (same constraint as the outer-pvl pass), so this single vc-validate-agent
instance performed all Layer 1 + Layer 2 roles sequentially against direct repo evidence rather
than model-generated inference — every claim below was confirmed by an actual command or file
read, not assumed.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC10 | Billing page selects correct cancel/invoice code path per provider | Fully-Automated | vitest/RTL fixture test, Stripe-provider and LS-provider cases (Step C1/C2) | A |
| AC10 | Real Lemon Squeezy API calls succeed end-to-end (live cancel/invoice) | Agent-Probe | Manual/agent-probe run against a live LS test account, if one exists | D |
| AC11 | Stripe v2 webhook + LS webhook cannot both grant a plan for the same user | Fully-Automated | vitest unit test simulating both webhooks firing for equivalent events (Step B3, case 2) | A |
| AC11 | Stripe v1 webhook is included in (or explicitly exempted from) the mutual-exclusion guarantee | Fully-Automated (if B0 chooses "guard it") or documentation-only (if B0 confirms dead) | Same B3-family test extended to v1, or a written dead-path confirmation in the phase report | B |
| AC11 | Legitimate provider-switch (cancel one provider, later subscribe via the other) is not blocked as a false-positive double-grant | Fully-Automated | vitest scenario distinct from the duplicate-event case (Step B3, case 3) | A |
| AC11 | On a legitimate provider switch, the losing provider's identity marker is nulled in the SAME write (closes the residual-marker gap) | Fully-Automated | vitest assertion on the mocked write call's arguments including the nulled field (Step B3, case 4 — **new this cycle**) | B |
| AC11 | `stripe-cron/route.ts`'s independent `status: "inactive"` writes cannot deactivate a row whose current live owner is the other provider | Fully-Automated (if B0b chooses "route through guard") or documentation-only (if B0b's no-op-after-fix reasoning is confirmed correct) | New test against the cron route, or a written confirmation that B1's mutual-clearing fix makes the stale-`meta` precondition this cron keys off of impossible post-switch (Step B0b — **new this cycle**) | B |
| — | New LS cancel/invoice routes reject unauthenticated callers | Fully-Automated | vitest route test asserting 401 without a Clerk session, mirroring existing Stripe route tests | B |
| — | Existing Stripe/LS webhook signature verification and `payment_status` allow-list remain unweakened | Fully-Automated | existing coverage + a regression assertion added alongside the B2 mutual-exclusion check | A |
| — | Skipped writes never leave Clerk `publicMetadata.isPro` out of sync with the DB row | Fully-Automated | vitest assertion that the Clerk sync call is NOT invoked when the guard skips a write (Step B2 Clerk-sync sequencing — **new this cycle**) | B |
| — | Scoped Exit Gate `tsc` command actually runs and isolates Phase 5 files | Fully-Automated | corrected full-project-run + grep command (Exit Gate, **fixed this cycle** — original command 404'd/bypassed tsconfig) | A |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies (Fully-Automated /
Hybrid / Agent-Probe). Known-Gap is never a `strategy:` value — the AC10 live-LS-API row uses
Agent-Probe as its strategy, with Known-Gap only as the documented fallback if no live LS test
account exists (per SPEC's own Known Gaps section), never as the row's strategy itself.

Legacy line form (retained so existing validate-contract consumers still parse):
- Routing logic: Fully-automated: `corepack pnpm --filter web test` (new fixture tests, Step C1/C2) | known-gap: live LS API confirmation, documented in SPEC Known Gaps
- Webhook mutual exclusion: Fully-automated: `corepack pnpm --filter web test` (new webhook test, Step B3, all 4 cases, extended to v1 per B0) | hybrid: none required
- Type safety: Fully-automated: corrected scoped-grep `tsc --noEmit` command (see Exit Gate)

Dimension findings:
- Infra fit: PASS — pure Next.js API-route + client-component change in `apps/web`; no container, worker, or proxy surface touched. Confirmed unchanged from outer-pvl.
- Test coverage: CONCERN — resolved by plan update. Two new gaps found and closed this cycle: (1) the Exit Gate's scoped `tsc --noEmit <file-list>` command is mechanically broken — empirically confirmed to 404 on repo-root-relative paths under `--filter web`, and to bypass tsconfig.json's JSX/path-alias resolution even when paths are corrected to be `apps/web`-relative. Replaced with a full-project-run + grep command, and replaced the unachievable "expect exit 0" criterion with a documented delta-vs-baseline check (baseline: exactly 3 pre-existing foreign `TS2786` errors in `page.client.tsx` at lines 61/539/570, confirmed live this cycle, unrelated to this phase). (2) Re-confirmed the 81/82 vitest baseline is still exactly accurate (ran `corepack pnpm --filter web test` live this cycle — same 1 pre-existing `lib/registry.test.ts` failure, no drift). Added a mock-chain-shape note to B3 (LS test uses `.maybeSingle()`, Stripe routes use `.single()` — confirmed via direct read; a copy-pasted mock would silently no-op).
- Breaking changes: PASS — confirmed unchanged: no existing API contract, webhook payload shape, or signature scheme changes (verified `constructEvent`/HMAC signature code in both Stripe routes and the LS route are untouched by this plan); new LS cancel/invoice routes are net-new surface, not a rename or removal.
- Security surface: CONCERN — resolved by plan update. This cycle's most substantive findings, both found via direct code reading (not inference): (1) **residual cross-provider marker bug** — confirmed on disk that neither webhook clears the OTHER provider's identity fields on a legitimate switch (Stripe's update never touches `lemon_squeezy_subscription_id`; LS's update never touches `meta` at all), so after any real switch the row carries BOTH markers simultaneously (one live, one stale) — this directly undermines B1's binary derivation and, combined with finding (2) below, could silently deactivate a real active subscription. Fixed by amending B1/B2 to require nulling the losing provider's marker in the same write that establishes the new owner, plus a new required B3 test case. (2) **undetected 4th writer** — `apps/web/app/api/subscription/stripe-cron/route.ts` independently sets `status: "inactive"` at 3 sites purely from Stripe-side signals, with zero Lemon-Squeezy awareness and no use of the new guard; confirmed auth-gated by `CRON_SECRET` (not an open endpoint) and confirmed currently unscheduled (per `all-context.md` — no live cron/n8n wiring), so today's exploitability is low, but AC11's "cannot both grant a plan" guarantee is incomplete without an explicit decision on this route, mirroring the B0 precedent for Stripe webhook v1. Added as new Blast Radius/Touchpoints entries and a new checklist item (B0b). (3) **Clerk publicMetadata desync risk** — confirmed the LS webhook's Clerk sync call is unconditional and runs after the write block regardless of whether the write happened; a guard-skipped write followed by an unconditional Clerk sync would desync Clerk's `isPro` claim from the DB. Added an explicit sequencing instruction to B2 (guard must `return` before the Clerk sync line). High-risk evidence pack requirement (from the outer-pvl pass) remains unchanged in the Exit Gate.
- Section A — Provider-aware routing feasibility: PASS — re-confirmed exact edit targets this cycle by direct read: `fetchInvoices()` calls the Stripe get-invoices route unconditionally and `handleCancelSubscription()` calls the Stripe cancel-subscription route unconditionally, both matching the claimed ~159/184 line targets. Confirmed the `paymentsNotConfigured()` local-function guard pattern (referenced by D1) is present verbatim in exactly the 4 routes claimed (`create-checkout`, `create-checkout-bundle`, `create-support-checkout` under stripe/, and `lemonsqueezy/create-checkout`). Confirmed `@lemonsqueezy/lemonsqueezy.js ^4.0.0` is an existing dependency. Confirmed no LS cancel/invoice route exists on disk (net-new, A4 accurate).
- Section B — Dual-webhook mutual exclusion feasibility: CONCERN — resolved by plan update (see Security surface above for the 2 substantive findings and their fixes). Mechanical feasibility for the guard's integration points is otherwise confirmed: both Stripe webhooks perform a SELECT-before-write (`existingUserPlan`) that is a natural insertion point for the guard call; the LS webhook does the same via `.maybeSingle()`. Confirmed v1's 8 write/read sites mirror v2's structure closely (near-duplicate, as originally claimed). Confirmed `status` is a free-form `string | null` column with exactly two literal values written anywhere in these three routes (`"active"` / `"inactive"`) — no `"canceled"` string literal exists in code, so B1's "active vs canceled" language should be read as "active vs anything-else (in practice, inactive)"; this is precise enough to implement correctly as long as the guard checks `status === "active"` exactly, which is now called out for execute-agent. Highest-risk edit: the mutual-exclusion + marker-clearing write itself — a bug here could either wrongly block a legitimate same-provider renewal (customer loses access) or wrongly allow a cross-provider overwrite (billing double-grant/no-grant); B3's 4 required cases (renewal-allowed, cross-provider-blocked-both-directions, switch-allowed, marker-nulled-on-switch) are designed to catch exactly these failure modes.
- Section C — Fixture-based verification feasibility: PASS — unchanged from outer-pvl; vitest/RTL mocking conventions for Stripe and Clerk are established in this repo; C3's Agent-Probe/Known-Gap fallback correctly matches SPEC's own accepted Known Gap.
- Section D — `lib/stripe.ts` lazy-getter conversion feasibility: PASS — re-confirmed by direct read this cycle: the eager `throw new Error("Stripe secret key is not set")` at module scope (lines 10-12) and `export const stripeV1 = new Stripe(...)` (line 14) are exactly as claimed. Confirmed the target `paymentsNotConfigured()` pattern exists in 4 routes to convert to (see Section A). No conflict with the separately-tracked `createFallbackProxy` backlog item — D1's scope (lazy construction only) is distinct from that proxy's fallback behavior, confirmed by direct read of the same file.
- Section E — Env var documentation feasibility: PASS — re-confirmed by direct read this cycle: the root example-env template has zero Stripe/LS entries (grep returned no matches); all 6 named env vars confirmed to the exact string used in code: `STRIPE_SECRET_KEY_V1`/`STRIPE_SECRET_KEY_V2` (`lib/stripe.ts`), `STRIPE_WEBHOOK_SECRET_V1`/`STRIPE_WEBHOOK_SECRET_V2` (`stripe/webhook/v1` and `v2` routes respectively), `LEMON_SQUEEZY_WEBHOOK_SECRET` (LS webhook route), `LEMON_SQUEEZY_API_KEY` (`lib/lemonsqueezy.ts`).

Open gaps: none blocking. Forward-looking, explicitly accepted per SPEC's own Known Gaps section:
- No live Lemon Squeezy test account confirmed available — AC10's live-API-call half is Agent-Probe and may resolve INCONCLUSIVE/Known-Gap (SPEC-level acceptance, carried unchanged from outer-pvl).
- Stripe webhook v1's true live/dead status (env var set + Stripe Dashboard endpoint registration) remains genuinely undetermined read-only — B0's defensive-guard default stands; B0b's cron disposition is the same shape of decision, deferred to execute-agent per the same pattern.

What this coverage does NOT prove:
- The fixture-based routing test (AC10) proves the branching logic selects the correct code path given a mocked `users_to_plans` row; it does NOT prove Lemon Squeezy's real API actually accepts a cancel/invoice call in production (only the Agent-Probe/Known-Gap row attempts that, and may end inconclusive).
- The webhook mutual-exclusion unit tests (including the new marker-nulling case) prove the in-process logic rejects/no-ops a conflicting second write and clears the losing provider's markers in a single mocked call; they do NOT prove Stripe's or Lemon Squeezy's real webhook delivery/retry semantics (out-of-order delivery, at-least-once redelivery, or genuinely concurrent near-simultaneous events from both providers within the same request-handling window) behave identically to the mocked, strictly-sequential event ordering used in the tests.
- The corrected scoped-`tsc` grep command proves no NEW type error appears in this phase's files beyond the 3 known pre-existing foreign `TS2786` lines; it does not prove the repo-wide `~1160`-error foreign baseline is fixed (out of scope), and it does not exercise runtime branches.
- None of these gates run against a live `users_to_plans` row, because none exist (0 live rows) — wiring-correctness is proven, data-presence is not (matches the SPEC's own Cross-Cutting Requirement framing, unchanged from outer-pvl).
- The B0b cron-route decision (whichever option execute-agent chooses) is not proven live either way — this PVL pass confirmed the route's code shape and current dormancy (unscheduled), not that it will remain unscheduled forever; if a future session wires up a scheduler for it (per the `all-context.md` Open Questions item on missing VPS crontab/n8n cron equivalents), this decision must be re-examined.

Gate: PASS (no FAILs; all identified CONCERNs — 2 new substantive security-surface findings, 1
broken Exit Gate command, plus minor documentation staleness — resolved via direct plan-text edits
applied in this inner-PVL pass, itemized above; remaining forward-looking items are pre-existing
SPEC-level accepted Known Gaps or the same class of "genuinely undetermined live status" already
accepted for Stripe webhook v1 at outer-pvl, not new unresolved concerns)
Accepted by: session (inner-pvl cycle-1, autonomous phase-program execution, 29-07-26) — plan
updates applied directly to this phase plan file per V6; no CONCERN was left unresolved requiring
a separate acceptance beyond the SPEC's own pre-existing Known Gaps acceptance and the B0/B0b
"genuinely undetermined, defensive-default" acceptance pattern already established at outer-pvl.
