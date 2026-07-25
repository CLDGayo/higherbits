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
**Phase status:** ⏳ PLANNED
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
  overwrite or revert it.**
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

---

## Implementation Checklist

### Step A — Provider-aware routing on `/settings/billing`

- [ ] A1. **Provider-identity mechanism CONFIRMED by outer-PVL (25-07-26) — no schema migration
      needed.** `users_to_plans` already fully encodes provider identity across its existing
      columns: the top-level `lemon_squeezy_subscription_id` column is non-null for LS subscribers;
      Stripe subscribers instead carry `stripe_subscription_id` / `stripe_customer_id` inside the
      JSON `meta` column (written by `cancel-subscription/route.ts` and `get-invoices/route.ts`
      today). Do NOT add a new `provider` column — derive it from these two existing fields. If
      research turns up a genuine case these fields can't disambiguate, escalate to INNOVATE with
      that specific evidence rather than defaulting to a migration.
- [ ] A2. Add a provider-detection helper (in `lib/lemonsqueezy.ts`, `lib/stripe.ts`, or a new
      shared `lib/billing.ts`) that resolves "is this user's active subscription Stripe or Lemon
      Squeezy" from the fields confirmed in A1.
- [ ] A3. Update `page.client.tsx:184` (cancel) and `page.client.tsx:159` (invoices) to branch on
      the detected provider — Stripe subscriber → existing Stripe-only route; Lemon Squeezy
      subscriber → new/existing LS-aware route. **Fail-safe default required (outer-PVL note):**
      when neither provider marker is present (e.g. free user, or a genuinely ambiguous row), the
      UI must show a clear "no active subscription" / error state — it must never fall through to
      silently calling the Stripe endpoint by default, since that is the exact bug this phase
      exists to fix.
- [ ] A4. If no Lemon Squeezy cancel/invoice API route exists yet (confirmed: none exist — see
      Blast Radius), create the minimal route(s) needed (`apps/web/app/api/lemonsqueezy/cancel/route.ts`,
      `apps/web/app/api/lemonsqueezy/invoices/route.ts` or equivalent) — repair/connect only, no new
      product surface beyond what SPEC AC10 requires. **Must auth-gate identically to the existing
      Stripe routes** (`await auth()` → 401 if no `userId`, matching `cancel-subscription/route.ts`
      and `get-invoices/route.ts`) — the original draft did not call this out explicitly.

### Step B — Dual-webhook mutual exclusion

- [ ] B0. **(New, outer-PVL 25-07-26).** Decide `apps/web/app/api/stripe/webhook/v1/route.ts`'s
      disposition as part of INNOVATE: either (a) apply the same mutual-exclusion guard to it as
      v2, or (b) confirm it is genuinely unreachable in production (e.g. no `STRIPE_WEBHOOK_SECRET_V1`
      configured live / no webhook endpoint registered in the Stripe dashboard for it) and document
      that finding + rationale in the phase report. Do not leave this undecided — AC11's "cannot
      both grant a plan" guarantee is incomplete if a second live Stripe-writing path is silently
      excluded.
- [ ] B1. Design the mutual-exclusion mechanism (per INNOVATE — likely a provider-tagged column on
      `users_to_plans` plus an idempotency/exclusivity check: if a row already has
      `provider = 'stripe'` and a Lemon Squeezy event arrives for the same user, either reject or
      require an explicit provider-switch flow — document the chosen behavior explicitly). Can
      reuse the same existing-column signals confirmed in A1 rather than adding a new column.
- [ ] B2. Implement the check in `app/api/lemonsqueezy/webhook/route.ts`, `app/api/stripe/webhook/v2/route.ts`,
      and (per the B0 decision) `app/api/stripe/webhook/v1/route.ts` — do not weaken the existing
      signature verification or `payment_status` allow-list gate while adding this (hard safety
      constraint, also stated at umbrella level).
- [ ] B3. Write a unit test simulating both webhooks firing for equivalent/same-user events,
      asserting only one grant lands and the second is a documented no-op or rejection (SPEC AC11).
      **Must also cover the legitimate provider-switch case** (e.g. a user who genuinely cancels
      Lemon Squeezy and later subscribes via Stripe) as a distinct scenario from an
      accidental/duplicate double-grant — a mechanism that blocks all provider switches
      unconditionally is not a correct implementation of B1's documented behavior. **Test-infra
      note (outer-PVL, 25-07-26):** no existing test file covers Stripe webhook v1 or v2 today
      (`apps/web/app/api/lemonsqueezy/__tests__/webhook.test.ts` exists, 115 lines, LS-only) — this
      test must be authored from scratch for the Stripe side, not merely extended.

### Step C — Fixture-based verification (SPEC AC10)

- [ ] C1. Write a Stripe-provider fixture (mocked `users_to_plans` row with the `meta.stripe_*`
      fields set per A1) and confirm the billing page selects the Stripe cancel/invoice path.
- [ ] C2. Write a Lemon-Squeezy-provider fixture (`lemon_squeezy_subscription_id` set per A1) and
      confirm the billing page selects the LS-aware path.
- [ ] C3. If a live Lemon Squeezy test account is available (per SPEC Known Gaps — not confirmed),
      attempt an Agent-Probe end-to-end confirmation; otherwise document as INCONCLUSIVE/Known Gap
      per the SPEC's explicit allowance.

---

## Exit Gate

```bash
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: all tests pass, including new fixture-based routing tests and webhook mutual-exclusion test
```

- All Step A-C checklist items checked (including new B0)
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

- [ ] 1. RESEARCH — research-agent: confirm provider-identity storage convention in `users_to_plans`
      (outer-PVL has pre-confirmed this — see A1 — research should verify, not re-derive from
      scratch); read Phase 1 report; confirm v1 webhook live/dead status for B0; test context loaded
- [ ] 2. INNOVATE — innovate-agent: decide mutual-exclusion mechanism design (B1) and v1 webhook
      disposition (B0); Decision Summary written
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [ ] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md`
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first.

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
- Last completed step: not started (outer-PVL complete — see `## Validate Contract` below)
- Validate-contract status: PASS (outer-pvl, 25-07-26)
- Next step: Spawn vc-research-agent for RESEARCH (Step 1) — after Phase 1 exit gate confirmed; may run parallel to Phase 4

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

## Validate Contract

Status: PASS
Date: 25-07-26
date: 2026-07-25
generated-by: outer-pvl

Parallel strategy: sequential (single-agent synthesis)
Rationale: 7-signal score 4/7 (S2 schema/API/auth surface, S4 phase-program classification, S6
high-risk billing class, S7 5-7 blast-radius files) nominally recommends Workflow/Agent-team per
the threshold table, but the Strategy Boundary fit-rule governs: this V2 fan-out is read-only
investigation with no cross-agent coordination need (4 Layer-1 dimension checks + 3 Layer-2 section
checks, synthesized after, no mid-run communication) — the correct execution shape is parallel
subagents. This session's spawn environment had no Agent-tool available to fan out literally, so
the single vc-validate-agent instance performed all Layer 1 + Layer 2 roles sequentially against
direct repo evidence (file reads, grep, disk existence checks) rather than model-generated
inference. Recommendation for EXECUTE (next phase step): parallel subagents are appropriate for
Step A (routing) vs Step B (webhook mutual exclusion) once INNOVATE's B0/B1 decisions are locked,
since those two implementation surfaces touch disjoint files (`page.client.tsx`+new LS routes vs
the three webhook route files) — re-run `vc-agent-strategy-compare` at end of INNOVATE to confirm.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC10 | Billing page selects correct cancel/invoice code path per provider | Fully-Automated | vitest/RTL fixture test, Stripe-provider and LS-provider cases (Step C1/C2) | A |
| AC10 | Real Lemon Squeezy API calls succeed end-to-end (live cancel/invoice) | Agent-Probe | Manual/agent-probe run against a live LS test account, if one exists | D |
| AC11 | Stripe v2 webhook + LS webhook cannot both grant a plan for the same user | Fully-Automated | vitest unit test simulating both webhooks firing for equivalent events (Step B3) | A |
| AC11 | Stripe v1 webhook is included in (or explicitly exempted from) the mutual-exclusion guarantee | Fully-Automated (if B0 chooses "guard it") or documentation-only (if B0 confirms dead) | Same B3-family test extended to v1, or a written dead-path confirmation in the phase report | B |
| AC11 | Legitimate provider-switch (cancel LS, later subscribe Stripe) is not blocked as a false-positive double-grant | Fully-Automated | vitest scenario distinct from the duplicate-event case (Step B3) | A |
| — | New LS cancel/invoice routes reject unauthenticated callers | Fully-Automated | vitest route test asserting 401 without a Clerk session, mirroring existing Stripe route tests | B |
| — | Existing Stripe/LS webhook signature verification and `payment_status` allow-list remain unweakened | Fully-Automated | existing coverage + a regression assertion added alongside the B2 mutual-exclusion check | A |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies (Fully-Automated /
Hybrid / Agent-Probe). Known-Gap is never a `strategy:` value — the AC10 live-LS-API row above uses
Agent-Probe as its strategy, with Known-Gap only as the documented fallback if no live LS test
account exists (per SPEC's own Known Gaps section), not as the row's strategy itself.

Legacy line form (retained so existing validate-contract consumers still parse):
- Routing logic: Fully-automated: `corepack pnpm --filter web test` (new fixture tests, Step C1/C2) | known-gap: live LS API confirmation, documented in SPEC Known Gaps
- Webhook mutual exclusion: Fully-automated: `corepack pnpm --filter web test` (new webhook test, Step B3, extended to v1 per B0) | hybrid: none required
- Type safety: Fully-automated: `corepack pnpm --filter web exec tsc --noEmit`

Dimension findings:
- Infra fit: PASS — pure Next.js API-route + client-component change in `apps/web`; no container, worker, or proxy surface touched.
- Test coverage: CONCERN — resolved by plan update. Existing coverage is asymmetric (LS webhook has 1 test file confirmed on disk; Stripe webhook v1/v2 have zero, contradicting `all-tests.md`'s stale claim of an existing 10-test Stripe webhook file). B3's new test must be authored from scratch for the Stripe side — noted in checklist and Test Infra Improvement Notes so effort is not underestimated.
- Breaking changes: PASS — no existing API contract, webhook payload shape, or signature scheme changes; new LS cancel/invoice routes are net-new surface, not a rename or removal.
- Security surface: CONCERN — resolved by plan update. Three items closed: (1) new LS routes now explicitly required to auth-gate like existing Stripe routes (A4); (2) Stripe webhook v1's independent `users_to_plans` write path is now explicitly in blast radius pending an INNOVATE decision (B0) instead of being silently excluded; (3) high-risk evidence pack requirement added to Exit Gate per `process/development-protocols/orchestration.md` §High-Risk Execution Handoff (billing is a named high-risk class) — plan did not originally reference this protocol requirement.
- Section A — Provider-aware routing feasibility: PASS (after plan update) — mechanical feasibility confirmed (edit targets at `page.client.tsx:159,184` exist exactly as claimed; LS SDK `@lemonsqueezy/lemonsqueezy.js` already a dependency). Gap found and closed: provider-identity column question (A1) resolved via direct schema read — no migration needed. Fail-safe default behavior for an undetermined provider added to A3.
- Section B — Dual-webhook mutual exclusion feasibility: PASS (after plan update) — mechanical feasibility confirmed for LS + Stripe v2 write sites; Stripe v1's parallel write path confirmed and added to scope via new B0 step. Highest-risk edit: the mutual-exclusion check itself, which could incorrectly block legitimate provider switches if implemented as a blanket "one provider per user, forever" rule — B1's own text already anticipates this ("reject or require an explicit provider-switch flow"); B3 now explicitly requires a distinct test scenario for it.
- Section C — Fixture-based verification feasibility: PASS — vitest/RTL mocking conventions for Stripe and Clerk are already established in this repo (`process/context/tests/all-tests.md` §Mocking conventions); mocking the LS SDK is new but follows the same factory-function pattern. C3's Agent-Probe/Known-Gap fallback already correctly matches SPEC's own accepted Known Gap (no confirmed live LS test account) — no live-provider dependency mandated for a PASS.

Open gaps: none blocking. Forward-looking, explicitly accepted per SPEC's own Known Gaps section:
- No live Lemon Squeezy test account confirmed available — AC10's live-API-call half is Agent-Probe and may resolve INCONCLUSIVE/Known-Gap (SPEC-level acceptance, not new to this phase).

What this coverage does NOT prove:
- The fixture-based routing test (AC10) proves the branching logic selects the correct code path given a mocked `users_to_plans` row; it does NOT prove Lemon Squeezy's real API actually accepts a cancel/invoice call in production (only the Agent-Probe/Known-Gap row attempts that, and may end inconclusive).
- The webhook mutual-exclusion unit test proves the in-process logic rejects/no-ops a conflicting second write; it does NOT prove Stripe's or Lemon Squeezy's real webhook delivery/retry semantics (e.g. out-of-order delivery, at-least-once redelivery) behave identically to the mocked event ordering used in the test.
- `tsc --noEmit` proves type-level correctness only; it does not exercise runtime branches.
- None of these gates run against a live `users_to_plans` row, because none exist (0 live rows) — wiring-correctness is proven, data-presence is not (matches the SPEC's own Cross-Cutting Requirement framing).

Gate: PASS (no FAILs; all identified CONCERNs resolved via plan updates applied in this outer-PVL pass, listed above; remaining forward-looking item is a pre-existing SPEC-level accepted Known Gap, not a new unresolved concern)
Accepted by: session (outer-PVL, 25-07-26) — plan updates applied directly to this phase plan file per V6; no CONCERN was left unresolved requiring a separate user acceptance beyond the SPEC's own pre-existing Known Gaps acceptance.
