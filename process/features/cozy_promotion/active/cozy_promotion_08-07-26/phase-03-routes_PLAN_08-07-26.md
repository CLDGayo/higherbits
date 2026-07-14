---
name: plan:cozy_promotion-phase-03-routes
description: "Cozy Promotion — Phase 03: Routes"
date: 08-07-26
metadata:
  node_type: memory
  type: plan
  feature: cozy_promotion
  phase: phase-03
---

# Phase 03 — Routes

**Program:** cozy_promotion
**Umbrella plan:** process/features/cozy_promotion/active/cozy_promotion_08-07-26/cozy_promotion-umbrella_PLAN_08-07-26.md
**Phase status:** ✅ COMPLETE
**Report destination:** process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-03-routes_REPORT_08-07-26.md (flat in the program task folder)

---

## Purpose

Move the isolated `apps/web/app/21st` layout into the root Next.js `apps/web/app/layout.tsx`, deleting `LegacyLayoutWrapper`. Migrate all `/21st/*` routes to the root, resolving any conflicts. Most importantly, integrate the legacy `getCatalog()` functionality perfectly into the promoted `ComponentGrid` layout on the root `page.tsx` so Cozy Downloads continues to function.

---

## Entry Gate

- Phase 2 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/21st/*` (promoted to `apps/web/app/*`)
- `apps/web/app/(catalog)` (deleted)
- `apps/web/components/legacy-layout-wrapper.tsx` (deleted)

---

## Implementation Checklist

### Step A — Root Layout Unification

- [ ] A1. Delete `LegacyLayoutWrapper` from `apps/web/app/layout.tsx`
- [ ] A2. Inject the `Sidebar` and `TopNav` (from `cozy/layout`) directly into `RootLayout` along with the main content container

### Step B — Route Promotion

- [ ] B1. Move `apps/web/app/21st/ai` to `apps/web/app/ai`
- [ ] B2. Move `apps/web/app/21st/mcp` to `apps/web/app/mcp`
- [ ] B3. Move `apps/web/app/21st/[username]` to `apps/web/app/[username]`
- [ ] B4. Move `apps/web/app/21st/community` to `apps/web/app/community`
- [ ] B5. DELETE the legacy `apps/web/app/(catalog)` directory entirely to resolve the route collision in favor of the new `[username]/[component]` template
- [ ] B6. Update imports inside the promoted pages to point to the correct depths
- [ ] B7. Rewrite all hardcoded `href="/21st/..."` paths in the codebase to point to the root `/...`

### Step C — Data Integration (Root Page & Community)

- [ ] C1. Merge the design from `apps/web/app/21st/page.tsx` into `apps/web/app/page.tsx`
- [ ] C2. Create an adapter utility `mapCatalogToComponentCards` to transform legacy data format for the new `ComponentGrid`
- [ ] C3. Hook up `getCatalog()` in `app/page.tsx` to pass real Cozy data into the `ComponentGrid` using the new adapter
- [ ] C4. Update `community/*` pages to use `getCatalog()` with the new `mapCatalogToComponentCards` adapter

---

## Exit Gate

```bash
# Lint exit 0 check
npm run lint
# Expected: 0 failures / 0 warnings

# Build exit 0 check
npm run build
# Expected: successful Next.js production build output
```

- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- `getCatalog` data structure not matching the `ComponentGrid` requirements, requiring adapter logic.

---

## Phase Loop Progress

**Inner Loop Refresh Note:** Updated checklist and blast radius based on INNOVATE Decision Summary. Added `mapCatalogToComponentCards` adapter, added `community` directory promotion, resolved route collision by deleting `apps/web/app/(catalog)`, updated `LegacyLayoutWrapper` deletion instructions, and added step to rewrite hardcoded `/21st/` paths.

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

- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/21st/*`
- `apps/web/app/(catalog)`
- `apps/web/components/legacy-layout-wrapper.tsx`

---

## Public Contracts

- External routing structure changed (no more /21st).

---

## Verification Evidence

```bash
# Build exit 0 check
npm run build
# Expected: Build completes without import errors
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-03-routes_PLAN_08-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

Status: PASS
Date: 08-07-26
Gate: PASS — no FAILs, all fixes applied

### Parallel strategy
Choice: sequential
Signals: 1/7 — dominant: 5+ files in blast radius
Agent count: 1 (vc-execute-agent)

### Plan updates applied
- [x] None required

### Execute-agent instructions
- Step B7: Use `grep -rn "/21st/" apps/web` to verify all hardcoded legacy paths have been updated.
- Exit gate: Ensure `npm run build` succeeds to verify no import path resolution errors remain after the moves.

### Test gates (run after each section; regression suite after all sections)

**apps/web/app (Routing and Layout)**
- Fully-automated: `npm run lint` exits 0
  Proves: No TS/ESLint errors from broken imports.
- Fully-automated: `npm run build` exits 0
  Proves: Next.js routing and build are sound.
- Hybrid: `npm run dev` and curl `http://localhost:3000/` returns 200
  Proves: Root page rendering works with the new layout.
  Precondition: Dev server must be running.

**Regression suite (after all sections complete)**
- `npm run lint` exits 0
- `npm run build` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- None

### Accepted by
vc-validate-agent session
