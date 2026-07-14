---
name: plan:pricing-and-copy-limits-phase-01-metering
description: "Pricing and Copy Limits — Phase 01: Metering Backend Switch"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: monetization
  phase: phase-01
---

# Phase 01 — Metering Backend Switch

**Program:** pricing-and-copy-limits
**Umbrella plan:** process/features/monetization/active/pricing-and-copy-limits-umbrella_07-07-26/pricing-and-copy-limits-umbrella_PLAN_07-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-01-metering_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Shift the backend telemetry and limit checking from tracking component views to tracking prompt copies. This removes the server-side paywall for viewing components, allowing users to browse the catalog freely, but establishes the backend infrastructure for limiting copies based on authentication and subscription tier.

---

## Entry Gate

- Phase 0 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/lib/metering.ts`
- `apps/web/app/api/metering/usage/route.ts`
- `apps/web/app/api/metering/copy/route.ts` (new)
- `apps/web/app/(catalog)/[category]/[slug]/page.tsx`
- `apps/web/components/usage-meter.tsx`
- `apps/web/components/view-tracker.tsx`

---

## Implementation Checklist

### Step A — Update Metering Logic

- [x] A1. In `lib/metering.ts`, rename `recordComponentView` to `recordComponentCopy` and `hasHitDailyLimit` to `hasHitDailyCopyLimit`. Migrate Redis namespace to `metering:copy:daily:${date}:${userIdOrIp}` and use the `sadd` methodology so multiple copies of the *same* component count as 1 against the limit.
- [x] A2. Create `apps/web/app/api/metering/copy/route.ts` to accept POST requests with `{ slug }`. It will check `hasHitDailyCopyLimit`. If over limit, return `{ allowed: false }`; if under limit, call `recordComponentCopy` and return `{ allowed: true }`.
- [x] A3. Update `apps/web/app/api/metering/usage/route.ts` to fetch the new `metering:copy` keys and return `dailyCopies` instead of `dailyViews`.

### Step B — Remove SSR View Paywall

- [x] B1. Modify `apps/web/app/(catalog)/[category]/[slug]/page.tsx` to remove the view logging and view limit checks entirely. The `locked` condition will solely depend on `entry.isPro`.
- [x] B2. Leave `ViewTracker` intact as it serves the `POST /api/views` trending telemetry/Qdrant fusion ranking, which is completely separate from the freemium metering limits.

### Step C — Update Usage Meter UI

- [x] C1. Update `apps/web/components/usage-meter.tsx` to read `data.dailyCopies` instead of `data.dailyViews` and display "Daily Prompt Copies".

---

## Exit Gate

```bash
npm run test
npm run build
```

- Metering logic successfully refactored.
- View limits no longer enforced on SSR.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Missing Redis connection hindering local testing.
- `lib/metering.ts` changes causing cascading type errors in unrelated services.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/lib/metering.ts`
- `apps/web/app/api/metering/usage/route.ts`
- `apps/web/app/api/metering/copy/route.ts`
- `apps/web/app/(catalog)/[category]/[slug]/page.tsx`
- `apps/web/components/usage-meter.tsx`

---

## Public Contracts

- `POST /api/metering/copy` introduced.
- Existing view limitations lifted.

---

## Verification Evidence

```bash
npm run build
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-01-metering_PLAN_07-07-26.md`
- Last completed step: Step 7 (UPDATE PROCESS)
- Validate-contract status: CONDITIONAL
- Next step: Phase complete. Advance to Phase 2.

---

## Validate Contract

Status: CONDITIONAL
Date: 07-07-26
Gate: CONDITIONAL — 2 concerns resolved: 0 plan fixes, 2 execute-agent instructions, 0 known-gaps accepted

### Parallel strategy
Choice: sequential
Signals: 2/7 — dominant: Schema/API/auth surface touched
Agent count: 1 (1 executor)

### Plan updates applied
- [x] None required.

### Execute-agent instructions
- Step A: Validate `slug` payload in `POST /api/metering/copy` to prevent injection. Use Clerk auth fallback to IP for `userIdOrIp`.
- Step A/B: Verify no other files import `recordComponentView` or `hasHitDailyLimit` before renaming them. Update any stray imports found.

### Test gates (run after each section; regression suite after all sections)

**Metering API & Logic (`apps/web/lib/metering.ts` & `apps/web/app/api/metering/copy/route.ts`)**
- Fully-automated: `npm run test` exits 0.
  Proves: `sadd` set logic correctly tracks unique copies and calculates limits.
- Agent probe: Send `POST` to `/api/metering/copy` using curl.
  Proves: Endpoint responds with `{ allowed: boolean }` based on limits.

**SSR View Paywall & Usage Meter UI (`apps/web/app/(catalog)/*` & `apps/web/components/usage-meter.tsx`)**
- Agent probe: Load a component page locally and verify the Usage Meter.
  Proves: No SSR paywall block on views; meter displays "Daily Prompt Copies".

**Regression suite (after all sections complete)**
- `npm run test` exits 0
- `npm run build` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None.

### Known gaps on record
- None.

### Accepted by
session — Security concern (input validation), Breaking Changes concern (import check)
