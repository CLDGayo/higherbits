---
name: plan:cozy-21st-mirror-phase-05-themes-templates
description: "Cozy 21st Mirror — Phase 5: Themes & Templates"
date: 05-07-26
metadata:
  node_type: memory
  type: plan
  feature: cozy-21st-mirror
  phase: phase-05
---

# Phase 05 — Themes & Templates

**Program:** cozy-21st-mirror
**Umbrella plan:** process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/21st-mirror-umbrella_PLAN_05-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-05-themes-templates_REPORT_05-07-26.md (flat in the program task folder)

---

## Purpose

Add dedicated `/templates` and `/themes` navigation chrome and category-specific empty states, which
were explicitly deferred from Phase 19 (Templates & Themes content types, shipped 2026-07-05). This
phase closes that deferral and gives the two new content types (added in Phase 19) proper first-class
navigation, matching 21st.dev's category browsing UX. Runs in parallel with Phase 3 and Phase 4 (all
three depend only on Phase 2).

---

## Entry Gate

- Phase 2 exit gate met (root layout and globals.css updated to premium tokens)
- Phase 19 registry entries present (`themes__cozy-daylight`, `themes__lofi-dusk`, `themes__paper-cafe`, `templates__cozy-landing` — 4 curated seed files, already live per `process/context/all-context.md`)

---

## Blast Radius

- `apps/web/components/site-header.tsx` (nav chrome additions for Templates/Themes)
- `apps/web/app/(catalog)/[category]/page.tsx` (category-specific empty state handling, if this route exists — confirm in RESEARCH; otherwise the dynamic `[category]/page.tsx` route from Phase 19)
- `apps/web/lib/catalog.ts` (routing entries for `templates` / `themes` categories, if not already present)

---

## Implementation Checklist

### Step A — Navigation chrome

- [ ] A1. Add dedicated `/templates` and `/themes` links to the site nav/header, using Phase 2 premium shell tokens.
- [ ] A2. Confirm both routes resolve via the existing dynamic `[category]/page.tsx` route (per Phase 19 note: "Both content types reuse the existing dynamic `[category]/page.tsx` route — no new route files were needed").

### Step B — Category-specific empty states

- [ ] B1. Implement empty-state UI for `/templates` and `/themes` category views when no entries are present (edge case / future-proofing beyond the current 4 seed entries).
- [ ] B2. Ensure empty states use premium shell tokens consistent with Phase 2/4 polish.

### Step C — Verify

- [ ] C1. Confirm `/templates` renders `templates__cozy-landing` (Pro, multi-demo) correctly with dedicated nav chrome.
- [ ] C2. Confirm `/themes` renders all 3 theme entries (`themes__cozy-daylight`, `themes__lofi-dusk`, `themes__paper-cafe`) with dedicated nav chrome, respecting the Pro gate on `themes__lofi-dusk`.
- [ ] C3. Run full vitest suite, confirm no regressions, including existing theme/template fixture tests added in Phase 19 (`registry.test.ts`, `catalog.test.ts`, `paywall-demo.test.ts`).

---

## Exit Gate

```bash
# Vitest full suite
corepack pnpm --filter web test
# Expected: all tests passing, no new failures

# Type check
corepack pnpm --filter web exec tsc --noEmit
# Expected: exits 0
```

- All checklist items (A, B, C) checked
- `/templates` and `/themes` routes render dedicated nav chrome
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Phase 2 exit gate not yet passed (premium shell tokens not available)
- Phase 19 registry seed files not present or not yet uploaded to R2 (per backlog note `phase-19-r2-seed-upload_NOTE_05-07-26.md` — the live R2 upload has not yet been run against the real bucket; if this blocks local verification, document and treat as a known gap, not a hard block, since registry.ts has a documented hydration fallback)

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [ ] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [ ] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/components/site-header.tsx`
- `apps/web/app/(catalog)/[category]/page.tsx`
- `apps/web/lib/catalog.ts`

---

## Public Contracts

- Existing dynamic `[category]/page.tsx` route reused, not replaced — no new route files
- No changes to registry frontmatter schema or `@repo/db` payload shape
- Existing Pro gate on `themes__lofi-dusk` unchanged

---

## Verification Evidence

```bash
# Vitest full suite
corepack pnpm --filter web test
# Expected: all tests passing (baseline 87/87 or higher, zero new failures)
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-05-themes-templates_PLAN_05-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1) — after Phase 2 exit gate is confirmed met

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
