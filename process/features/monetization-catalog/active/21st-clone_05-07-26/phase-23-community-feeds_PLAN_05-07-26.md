---
name: plan:21st-clone-phase-23-community-feeds
description: "21st.dev Clone — Phase 23: Community feeds"
date: 05-07-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: phase-23
---

# Phase 23 — Community feeds

**Program:** 21st-clone
**Umbrella plan:** process/features/monetization-catalog/active/21st-clone_05-07-26/21st-clone-umbrella_PLAN_05-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/monetization-catalog/active/21st-clone_05-07-26/phase-23-community-feeds_REPORT_05-07-26.md (flat in the program task folder)

---

## Purpose

Add engagement loops around the catalog: a week-bucketed "Latest" feed, a creator leaderboard, and an announcements surface.

---

## Entry Gate

- Phase 22 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/app/latest/page.tsx`
- `apps/web/app/leaderboard/page.tsx`
- `apps/web/app/announcements/page.tsx`

---

## Implementation Checklist

### Step A — Schema & Backfill
- [ ] A1. Schema Injection: Update `scripts/validate-registry.mjs` to enforce `Date_Added` (regex `^\d{4}-\d{2}-\d{2}$`) and update `apps/web/lib/catalog.ts` to map it to `dateAdded: string`.
- [ ] A2. Write and run `scripts/backfill-dates.mjs` to inject `Date_Added: 2026-06-01` into all existing markdown files.
- [ ] A3. Ensure `submitComponent` action adds the current date.

### Step B — Feed UI Implementation
- [ ] B1. Implement "Latest" feed logic: group catalog by `dateAdded` into weeks in `apps/web/app/latest/page.tsx` (or a helper).
- [ ] B2. Wire up "Featured" and "Trending" feeds to existing catalog/Redis fetchers.

---

## Exit Gate

```bash
# Verify tests
corepack pnpm exec vitest run
# Expected: passing tests
```

- all checklist items checked
- validators exit 0
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- upstream phase exit gate not yet passed

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md`
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `scripts/validate-registry.mjs`
- `apps/web/lib/catalog.ts`
- `apps/web/app/actions/submit-component.ts`
- `apps/web/app/latest/page.tsx`
- `scripts/backfill-dates.mjs`

---

## Public Contracts

- None

---

## Verification Evidence

```bash
corepack pnpm exec vitest run
# Expected: passing tests
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization-catalog/active/21st-clone_05-07-26/phase-23-community-feeds_PLAN_05-07-26.md`
- Last completed step: PVL (Step 4)
- Validate-contract status: WRITTEN
- Next step: Spawn vc-execute-agent for EXECUTE (Step 5)

---

## Validate Contract

### 1. Status: PASS

### 2. Gate: CONDITIONAL PROCEED
- Architecture is viable (static Markdown Date_Added field is fast and reliable).

### 3. Plan Updates Applied
- Replaced vague data architecture tasks with exact schema updates and backfill script.
- Combined feed UI tasks to rely on existing Phase 20/22 getters.

### 4. Execute-Agent Instructions
- Implement `scripts/backfill-dates.mjs` and execute it once to backfill legacy Markdown files.
- Update `scripts/validate-registry.mjs` to require `Date_Added` matching `YYYY-MM-DD`.
- Update `apps/web/lib/catalog.ts` `CatalogEntry` to parse `Date_Added`.
- Update `submitComponent` in `apps/web/app/actions/submit-component.ts` to insert current date.
- Build the "Latest" feed UI in `page.tsx` with week-grouping logic.

### 5. Test Gates
```bash
corepack pnpm exec vitest run
corepack pnpm exec tsc --noEmit
node scripts/validate-registry.mjs
```

### 6. High-Risk Pack
- N/A

### 7. Backlog Artifacts
- None.

### 8. Known Gaps
- None.

### 9. Accepted By
vc-validate-agent (05-07-26)
