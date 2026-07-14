---
phase: phase-2-registry-schema
date: 2026-06-28
status: COMPLETE
feature: monetization-catalog
plan: process/features/monetization-catalog/active/21st-clone_27-06-26/phase-2-registry-schema_PLAN_27-06-26.md
---

# Phase 2 — Registry Schema + Ingest-Tool Hardening — EXECUTE Report

## What Was Done

- **Step A** — Extended registry YAML schema confirmed (required: Component_Name, Category (open string),
  Dependencies, Animation_Library, AI_Behavioral_Summary, Content_Type, Author, Source_Repo, License_SPDX, IsPro).
- **Step B** — Created `scripts/validate-registry.mjs` (ESM, Node 22, manual CRLF-safe `---` splitter, no
  gray-matter/yaml dep). Validates required fields, Content_Type ∈ {component,block,hook}, License_SPDX===MIT
  (case-insensitive), IsPro boolean, Author/Source_Repo non-empty. B4 tests at
  `scripts/__tests__/validate-registry.test.mjs` (7 tests, incl. CRLF + invalid-Content_Type + missing-Author).
- **Step C** — PRUNE: scripted prefix glob-delete removed 134 legacy registry files (prefixes
  text-animations__/animations__/backgrounds__/components__). 139 → 5. MIGRATE: added Content_Type/Author/
  Source_Repo/License_SPDX to all 5; IsPro:false added to the 3 free ones; the 2 Pro files (pill-button,
  lofi-card) kept their existing Phase-1 `IsPro: true` (EI-2 de-dup honored — no duplicate field).
- **Step D** — `packages/db/src/schema.ts`: ComponentPayload gained optional Content_Type/Author/Source_Repo/
  License_SPDX (string) + IsPro (boolean); Category broadened to `string`. `ComponentCategory` alias kept
  intact and still exported (EI-1). `index.ts` uses `export *` → no change needed (D5).
- **Step E** — `ops/github-ingest.mjs` hardened: removed UI_SRC_DIR const + packages/ui/src write path +
  doc-comment refs (E2); MIT gate throw → `console.warn('SKIPPED…')` + `{skipped:true, reason:'no-mit-license'}`
  (E3); EI-3 null/skip guard added in main(); renderRegistry() rewritten in ONE coordinated edit (EI-4):
  Original_Author→Author, Author_URL→Source_Repo (repo URL), + Content_Type/License_SPDX/IsPro:false/HeavyDeps;
  heavy-dep warn gate for [three, matter-js, @react-three/fiber, gsap, face-api.js, ogl] (E5, warn-only).
  Tests at `ops/__tests__/github-ingest.test.mjs` (4 tests, mocked fetch, node --test).

## What Was Skipped or Deferred

- catalog.ts prune (129 legacy slugs) → Phase 3 (hard constraint).
- ops:test root script wiring for CI → noted for a later phase (Test Infra Notes in plan).

## Test Gate Outcomes (self-run; EVL will independently re-confirm)

| Gate | Command | Result |
|---|---|---|
| F1 | `node scripts/validate-registry.mjs` | exit 0 (5/5 pass) |
| F2 | `corepack pnpm --filter @repo/db type-check` | exit 0 |
| F3 | `corepack pnpm --filter web build` | exit 0 (prune build-safe; [slug] route ƒ Dynamic) |
| F4 | `grep -rE "UI_SRC_DIR\|packages/ui/src" ops/github-ingest.mjs` | no match |
| F5 (ops) | `node --test ops/__tests__/github-ingest.test.mjs` | exit 0 (4/4) |
| F5 (web) | `corepack pnpm --filter web test` | exit 0 (16/16 Phase-1 regression) |
| B4/EI-5 | `node --test scripts/__tests__/validate-registry.test.mjs` | exit 0 (7/7) |
| C1-count | `ls docs/evidence-manifest/registry/*.md \| wc -l` | 5 |

## Plan Deviations

3 within-blast-radius edits (full detail in plan `## Deviations`): widened category type from
`ComponentCategory` to `string` in `packages/db/src/points.ts` (SearchOptions.category +
listComponentsByCategory param) and `apps/web/lib/components.ts` (ComponentSummary.category,
SearchParams.category, getComponentsByCategory param). Required to keep F3 build green after D3's
open-Category decision. Forbidden files (page.tsx, catalog.ts) untouched. ComponentCategory alias preserved.
Count note: plan said "134 before"; actual was 139 (134 legacy deleted, 5 survive) — binding "5 after" holds.

## Test Infra Gaps Found

- Validator does not test future Phase-4-ingestion edge cases (binary/non-UTF-8 registry files) — covered only
  for the 3 specified unit scenarios + CRLF.
- ops tests use mocked GitHub fetch — no live API rate-limit/timeout coverage (by design).

## EVL Independent Confirmation (vc-tester re-run, 2026-06-28)

Independent vc-tester ran all 8 validate-contract gate commands. Result: **8/8 GREEN**.

| Gate ID | Command | Independent EVL result |
|---|---|---|
| B4 | `node --test scripts/__tests__/validate-registry.test.mjs` | PASS |
| F1 (validate-registry 5/5) | `node scripts/validate-registry.mjs` | PASS (5/5) |
| D4 | `corepack pnpm --filter @repo/db type-check` | PASS |
| F3 (web build — [slug] route Dynamic ƒ) | `corepack pnpm --filter web build` | PASS |
| E2-grep (no UI_SRC_DIR) | `grep -rE "UI_SRC_DIR\|packages/ui/src" ops/github-ingest.mjs` | PASS (no match) |
| Phase1-reg (web test 16/16) | `corepack pnpm --filter web test` | PASS (16/16) |
| E7 | `node --test ops/__tests__/github-ingest.test.mjs` | PASS (4/4) |
| C1-count (registry=5) | `ls docs/evidence-manifest/registry/*.md \| wc -l` | PASS (5) |

**Accepted deviations (orchestrator ruling, 2026-06-28):** Two files outside the literal plan touchpoints were modified:
- `apps/web/lib/components.ts` — category type widened to `string` (was `ComponentCategory`)
- `packages/db/src/points.ts` — category param widened to `string` (was `ComponentCategory`)

Both are ACCEPTED — build-required consequences of the Step D3 open-Category schema change (ComponentPayload.Category broadened union→string; downstream consumers needed widening to keep the F3 build gate green). Forbidden files (apps/web/page.tsx, catalog.ts) were NOT touched. ComponentCategory alias preserved (EI-1). These are accepted deviations, not defects.

**EVL closeout classification: CLEAN.**

## SPEC Achievement

Phase 2 covers AC-10, AC-11, and AC-13 from the locked `21st-clone_SPEC_27-06-26.md`.

| AC | Criterion | Proving gate | Result |
|---|---|---|---|
| AC-10 | MIT license gate in ingest tool (warn/skip, not throw) | `node --test ops/__tests__/github-ingest.test.mjs` — Fully-Automated | **MET** (4/4 tests, EVL confirmed) |
| AC-11 | Author + Source_Repo + License_SPDX in every registry entry | `node scripts/validate-registry.mjs` exit 0 — Fully-Automated | **MET** (5/5, EVL confirmed) |
| AC-13 | Bundle/legacy cleanup | 129 legacy registry files deleted; grep confirms no UI_SRC_DIR write — Fully-Automated | **MET** (both gates confirmed by EVL) |

All 3 Phase 2 ACs met. No unmet criteria → no backlog stubs required for this phase.

## Follow-Up Stubs (from EVL HANDOFF SUMMARY)

- **catalog.ts legacy slugs prune** — catalog.ts still lists 129 legacy slugs; registry files for them are now gone, routes fall back to DEMO_SOURCE harmlessly. Action: Phase 3 will prune catalog.ts and rebuild catalog routing dynamically. No immediate defect.
- **ops:test root script** — `node --test ops/__tests__/github-ingest.test.mjs` and `node --test scripts/__tests__/validate-registry.test.mjs` are not yet wired into a root-level `ops:test` script or CI integration. Phase 3+ candidate. No impact on current phase green status.

## Closeout Packet

- Selected plan: `process/features/monetization-catalog/active/21st-clone_27-06-26/phase-2-registry-schema_PLAN_27-06-26.md`
- Finished: Steps A–F all complete; all 8 gates green on self-run AND independent EVL re-run.
- Verified: 8/8 EVL gates green (independent vc-tester, 2026-06-28). AC-10, AC-11, AC-13 all proven by Fully-Automated gates.
- Classification: **Ready for UPDATE PROCESS archival** (EVL green, all ACs met, accepted deviations documented).

## Forward Preview

### Test Infra Found
- New `node --test` suites added (ops + scripts). Not yet wired into a root CI script — Phase 3+ candidate.

### Blast Radius Changes
- Registry dir is now 5 curated files (was 139). `packages/db` Category type is open (`string`).
- `apps/web/lib/components.ts` + `packages/db/src/points.ts` category types widened to string.

### Commands to Stay Green
- `node scripts/validate-registry.mjs`
- `node --test scripts/__tests__/validate-registry.test.mjs`
- `node --test ops/__tests__/github-ingest.test.mjs`
- `corepack pnpm --filter @repo/db type-check`
- `corepack pnpm --filter web build`
- `corepack pnpm --filter web test`

### Dependency Changes
- None. No new npm deps (manual splitter + node:test only).

## Follow-up Stubs Created
- None (no out-of-scope BLOCKED items; all concerns resolved as EI-1..EI-5 instructions, all applied).

## CONTEXT_PARTIAL
- None.
