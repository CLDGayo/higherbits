---
phase: phase-02-brand-sweep
date: 2026-07-12
status: COMPLETE
feature: higherbits-cozy-rebrand
plan: process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-02-brand-sweep_PLAN_12-07-26.md
---

# Phase 2 — Brand Sweep — Execution Report

## What Was Done

Retired all non-functional "21st" brand residue from apps/web + apps/backend. 17 source files
modified, 5 stale brand-asset binaries deleted (empty `public/brand/` dir removed).

- Legal entity "21st Labs Inc." → "Higher Bits Labs Inc." (terms page ×2 + footer copyright) — locked decision.
- All `serafimcloud/21st` display GitHub links → `github.com/CLDGayo/higherbits` (footer ×2, hero-section, header, command-menu, page.client report link, ManageSubmissionModal, first-stap-layout, publish-layout, help).
- `github-stars-number` default `repo` prop → CLDGayo/higherbits (live stars API now targets the real HigherBits repo).
- Display copy: loading-spinner aria-label; "21st Registry"/"21st registry" ×2; email Twitter share text "@21st_dev!" → "HigherBits.dev!".
- `brand-assets-menu.tsx`: replaced `Logo21SVG` glyph with `HigherBitsLogoSVG` (hexagon outline matching logo.tsx); retired png/svg/zip binary downloads; kept copy-SVG action.
- Deleted 5 old-brand binaries: 21st-brand.zip, 21st-logo-{dark,white}.{png,svg}.
- apps/backend CORS allow-list origin `"https://21st.dev"` → `"https://higherbits.dev"` (single-string config swap; localhost/railway/array-shape unchanged).

## What Was Skipped or Deferred

- package.json / layout.tsx metadata / sitemap / robots / manifest: NO work — Phase 0 confirmed already clean (residue grep = 0).
- magic-mcp.ts / codesandbox-sdk.ts: NO edit — only allow-listed functional identifiers.

## Test Gate Outcomes

| criterion | command | result |
|---|---|---|
| exit-gate-grep | content-line-aware allow-list-aware residue sweep | 0 non-allow-listed matches (24 raw → 0 brand residue) |
| logo21svg-retired | `grep -rn "Logo21SVG" apps/web/app apps/web/components apps/web/lib` | 0 |
| build-typecheck-test-green | build / tsc --noEmit / vitest | exit 0 / exit 0 / 10-10 pass |
| logo21svg-visual-replacement (Agent-Probe) | manual render check | NOT RUN — known-gap (no automated visual assertion) |
| backend-cors-string-handling (Agent-Probe) | code-read classification | DONE — classified functional CORS origin, brand-correct swap applied |

## Plan Deviations

None material. Within-blast-radius execute-agent judgment calls the plan delegated: GitHub link
target = CLDGayo/higherbits; brand-assets-menu download retirement; CORS origin replaced not
allow-listed (per task hard rule).

## Test Infra Gaps Found

- No unit test asserts brand-string/copy content (footer/header/terms) — pre-existing thin-UI-coverage gap carried from higherbits-redesign precedent. Coverage relies on build/typecheck/test regression net + deterministic residue grep.

## Closeout Packet

- Selected plan: phase-02-brand-sweep_PLAN_12-07-26.md
- Finished: all Step A–F checklist items; Phase Loop Progress Step 5 ticked.
- Verified: 3 automated gates green + residue grep 0 + Logo21SVG grep 0.
- Unverified: Agent-Probe visual check of the new hexagon mark in both themes (deferred to Phase 4/5); favicon/OG image-content 21st-glyph inspection (deferred to Phase 5).
- Next valid state: EVL confirmation run (vc-tester re-runs the 3 gate commands + residue grep), then commit Phase 2, then Phase 3.

## Forward Preview

### Test Infra Found
Vitest 10/10 across 4 files; no new test harness needed for a brand sweep.

### Blast Radius Changes
17 source files + 5 deleted assets in apps/web + apps/backend. `public/brand/` dir removed. No schema/auth/API/route change.

### Commands to Stay Green
- `corepack pnpm --filter web build`
- `corepack pnpm --filter web exec tsc --noEmit`
- `corepack pnpm --filter web test`
- Residue grep (see Test Gate Outcomes) — expect 0.

### Dependency Changes
None. No new npm deps.
