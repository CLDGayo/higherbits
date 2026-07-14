---
name: plan:21st-clone-phase-2-registry-schema
description: "21st-clone — Phase 2: Registry YAML schema extension, packages/db schema update, ingest-tool hardening"
date: 27-06-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: phase-2
---

# Phase 2 — Registry Schema + Ingest-Tool Hardening

**Program:** 21st-clone monetization-catalog
Date: 2026-06-28 (supplemented; original 2026-06-27)
Status: ✅ VERIFIED (EVL green 2026-06-28)
Complexity: COMPLEX (phase program phase)
**Umbrella plan:** process/features/monetization-catalog/active/21st-clone_27-06-26/21st-clone-umbrella_PLAN_27-06-26.md
**Phase status:** ✅ VERIFIED
**Report destination:** process/features/monetization-catalog/active/21st-clone_27-06-26/phase-2-registry-schema_REPORT_27-06-26.md

---

## Overview

Phase 2 of the 21st-clone monetization-catalog program. Goal: establish a stable, validated registry YAML schema that all downstream phases (3: catalog routing, 4: ingestion/Qdrant) depend on.

Key scope decisions locked in this phase:
- PRUNE 129 legacy placeholder registry files (React Bits port) via scripted glob delete — only the 5 curated Cozy entries survive
- Migrate the 5 surviving entries to the extended schema (Content_Type, Author, Source_Repo, License_SPDX, IsPro)
- Create `scripts/validate-registry.mjs` to enforce schema compliance on all remaining files
- Extend `packages/db` ComponentPayload type with new optional fields (backwards-compatible)
- Harden `ops/github-ingest.mjs`: soften MIT gate to structured skip/warn, rename attribution fields, remove UI_SRC_DIR write

Phase 2 does NOT touch `apps/web/app/(catalog)/[category]/[slug]/page.tsx` or `apps/web/lib/catalog.ts` — those are Phase 3 scope. The delete is build-safe (force-dynamic + null-safe registry reads confirmed by orchestrator).

---

## Phase Completion Rules

This phase is complete when ALL of the following hold:

1. `node scripts/validate-registry.mjs` exits 0 — all 5 surviving registry files pass schema validation
2. `corepack pnpm --filter @repo/db type-check` exits 0
3. `corepack pnpm --filter web build` exits 0 (regression: confirms prune is build-safe)
4. `grep -r "UI_SRC_DIR\|packages/ui/src" ops/github-ingest.mjs` returns no match
5. `node --test ops/__tests__/github-ingest.test.mjs` exits 0 — all ingest unit tests pass
6. `corepack pnpm --filter web test` exits 0 — Phase 1 vitest regression
7. Phase report written to report destination

Phase may NOT be marked VERIFIED without all 7 points confirmed and phase report written.

---

## Inner Loop Refresh Note

Date: 2026-06-28
**Triggered by:** INNOVATE output (Decision Summary) + user scope decision (PRUNE)
**Changes applied:**
- Step ordering resequenced: A → B → C (PRUNE+MIGRATE) → D → E → F
- Step C replaced: was "migrate 5 files"; now "DELETE 129 legacy files + migrate 5 curated survivors". Scripted glob delete, not individual edits.
- Step B simplified: validator validates ALL .md files in registry dir (no Content_Type:legacy branch needed — legacy files are gone).
- Fork B resolved: MANUAL `---` splitter (handles both `\n` and `\r\n`), no gray-matter dep.
- Fork C resolved: `Author` (not `Original_Author`), `Source_Repo` (repo URL not author profile URL), `Content_Type: component`, `License_SPDX`, `IsPro: false` default.
- Fork D resolved: ops tests run under `node --test`, NOT vitest; E7 verification = `node --test ops/__tests__/github-ingest.test.mjs`.
- Fork E resolved: MIT gate ALREADY EXISTS (lines 104-136 + 227-231) — HARDEN only: replace ABORT throw with `console.warn` + structured skip return value (null or `{ skipped: true, reason: 'no-mit-license' }`).
- Build-safety note added: page.tsx + catalog.ts NOT touched in Phase 2 (force-dynamic + null-safe reads = delete is build-safe).
- Blast Radius and Touchpoints updated to reflect delete of 129 files.
- Verification Evidence updated: grep for UI_SRC_DIR, node --test command, validator over all remaining files.
**Sections modified:** Overview (new), Phase Completion Rules (new), Purpose, Blast Radius, Implementation Checklist (Steps B, C, E, F), Blockers, Touchpoints, Public Contracts, Verification Evidence, Test Infra Improvement Notes, Resume and Execution Handoff, Acceptance Criteria table.
**No sections outside Phase 2 plan file modified.**

---

## Purpose

Extend the registry YAML frontmatter schema with the new fields required by downstream phases (`Content_Type`, `Author`, `Source_Repo`, `License_SPDX`, `IsPro`). The registry is PRUNED first: 129 legacy placeholder files (React Bits port) are deleted via scripted glob; only the 5 curated Cozy entries survive. Those 5 are then migrated to the extended schema. `packages/db/src/schema.ts` is updated to reflect the extended payload in Qdrant. `ops/github-ingest.mjs` is hardened: MIT gate is softened from a hard throw to a structured skip/warn, attribution fields are renamed and extended, and any UI_SRC_DIR write path is removed. A new `scripts/validate-registry.mjs` linter ensures every surviving registry file conforms to the schema before ingestion. Phase 2 does NOT touch `apps/web/app/(catalog)/[category]/[slug]/page.tsx` or `apps/web/lib/catalog.ts` — those are Phase 3 scope.

**BUILD-SAFETY NOTE (orchestrator-verified, 2026-06-28 — do not re-litigate in EXECUTE or VALIDATE):**
`apps/web/app/(catalog)/[category]/[slug]/page.tsx` is `export const dynamic = "force-dynamic"` with NO `generateStaticParams`. It reads registry null-safely: `entry?.source ?? DEMO_SOURCE`, `entry?.css`, `entry?.dependencies ?? []`, `entry?.animationLibrary ?? "CSS"`. `readRegistryEntry()` returns `null` on missing file (try/catch). `apps/web/lib/catalog.ts` is a hardcoded slug manifest that does NOT read the registry directory. Therefore deleting the 129 legacy registry files is BUILD-SAFE: no SSG, no crash on null entry. The only cosmetic effect is legacy Code tabs fall back to `DEMO_SOURCE`. Leaving 129 legacy slugs in catalog.ts is intentional — pruning catalog.ts is Phase 3.

---

## Entry Gate

- Phase 1 VERIFIED: `readRegistryEntry()` contract established; `IsPro` field pattern confirmed.
- Phase 1 phase report read by research-agent before starting this phase.

---

## Blast Radius

**Files DELETED in this phase:**
- `docs/evidence-manifest/registry/` — 129 legacy placeholder files with prefixes `text-animations__`, `animations__`, `backgrounds__`, `components__` (scripted glob delete; verified count: 134 → 5 after)

**Files KEPT and MODIFIED in this phase:**
- `docs/evidence-manifest/registry/` — 5 curated entries (prefixes `cozy-buttons__`, `lofi-cards__`, `minimalist-layouts__`) — frontmatter extended with new required fields

**Files CREATED:**
- `scripts/validate-registry.mjs` — new registry linter/validator script
- `ops/__tests__/github-ingest.test.mjs` — new unit test file for ingest tool

**Files MODIFIED:**
- `packages/db/src/schema.ts` — extend ComponentPayload type; broaden Category from union to string
- `ops/github-ingest.mjs` — harden license gate (warn/skip instead of throw), rename/add attribution fields, remove UI_SRC_DIR write path
- `packages/db/src/index.ts` — re-export updated types if needed

**Files NOT touched (build-safety confirmed above):**
- `apps/web/app/(catalog)/[category]/[slug]/page.tsx` — NOT touched (force-dynamic + null-safe)
- `apps/web/lib/catalog.ts` — NOT touched (hardcoded manifest, not registry-dir-reading; prune is Phase 3)
- `apps/web/lib/registry.ts` — NOT touched (already reads IsPro from Phase 1)

---

## Implementation Checklist

### Step A — Define extended registry schema

- [ ] A1. Document the canonical extended YAML frontmatter schema (confirmed shape for all phases downstream):
  - Required: `Component_Name`, `Category` (string — open, not enum), `Dependencies`, `Animation_Library`, `AI_Behavioral_Summary`, `Content_Type` (component|block|hook), `Author`, `Source_Repo`, `License_SPDX` (MIT), `IsPro` (true|false)
  - Optional: `Block_Files` (array of additional file paths for block-type entries), `Screenshot_Path`, `Network_Log_Path`, `Target_Execution_Phase`
  - Note: `HeavyDeps: true` is an optional ingest-tool-generated field (added by E5 when heavy deps detected); not required in manually curated entries
- [ ] A2. Confirm with Phase 1 phase report that `IsPro` field name and type (boolean) matches what `readRegistryEntry()` reads.

### Step B — Create registry validator script

- [ ] B1. Create `scripts/validate-registry.mjs` (ESM, Node 22 compatible).
- [ ] B2. Script reads all `.md` files under `docs/evidence-manifest/registry/`, extracts YAML frontmatter using a **MANUAL `---` block splitter** (no gray-matter dependency). The splitter MUST handle both `\n` and `\r\n` line endings. Validated fields:
  - All required fields are present and non-empty.
  - `Content_Type` is one of: `component`, `block`, `hook`.
  - `License_SPDX` equals `MIT` (case-insensitive).
  - `IsPro` is a boolean (`true` or `false` in YAML).
  - `Author` and `Source_Repo` are non-empty strings.
- [ ] B3. Script validates ALL `.md` files in the registry dir — no skip mechanism, no Content_Type:legacy branch (legacy files are gone after Step C). Script exits 0 if all pass, exits 1 with per-file error messages if any fail.
- [ ] B4. Write unit tests for the validator (in `scripts/__tests__/` or colocated): pass a valid frontmatter string → assert exit 0; pass frontmatter missing `Author` → assert exit 1 with message; pass `Content_Type: widget` → assert exit 1. Runner: `node --test scripts/__tests__/validate-registry.test.mjs`. **Execute-agent must run this command explicitly after B4 is complete — it is NOT wired into the F-series exit gate automatically.**

### Step C — PRUNE + MIGRATE registry

> CAUTION: All deletions are via a scripted glob pass — NOT 129 individual file edits.

- [ ] C1. Write and run a Node script (can be inline/one-shot) that deletes ALL `.md` files under `docs/evidence-manifest/registry/` whose filename starts with `text-animations__`, `animations__`, `backgrounds__`, or `components__`. Verify count: 134 files before → 5 after. Log each deleted path.
- [ ] C2. Migrate the 5 surviving curated entries — add the following fields to their YAML frontmatter (each file's existing fields are preserved):
  - `Content_Type: component` (all 5 are single components)
  - `Author: CLDGayo`
  - `Source_Repo: https://github.com/CLDGayo/cozy-downloads`
  - `License_SPDX: MIT`
  - `IsPro: true` for `lofi-cards__lofi-card.md` and `cozy-buttons__pill-button.md`
  - `IsPro: false` for `cozy-buttons__soft-button.md`, `lofi-cards__polaroid-card.md`, `minimalist-layouts__calm-stack.md`
  - **IMPORTANT (execute-agent instruction):** Phase 1 already added `IsPro: true` to `lofi-cards__lofi-card.md` and `cozy-buttons__pill-button.md`. Before adding IsPro to any file, read the file first. If `IsPro:` already exists, confirm its value is correct and do NOT add a duplicate field.
- [ ] C3. Run `node scripts/validate-registry.mjs` — confirm exit 0 for all 5 remaining files.

### Step D — Extend packages/db schema

- [ ] D1. Read `packages/db/src/schema.ts` in full.
- [ ] D2. Extend `ComponentPayload` type to add: `Content_Type?: string`, `Author?: string`, `Source_Repo?: string`, `License_SPDX?: string`, `IsPro?: boolean`. All new fields optional (backwards-compatible with vectors already in Qdrant).
- [ ] D3. Broaden `Category` field in `ComponentPayload` from `ComponentCategory` to `string` — new categories will be added at ingestion time. **IMPORTANT (execute-agent instruction):** Do NOT delete or modify the `ComponentCategory` type alias — it is used in `points.ts` function signatures (`listComponentsByCategory`, `searchComponents`, `SearchOptions.category`). Only change the field type in `ComponentPayload`: `Category: ComponentCategory` → `Category: string`.
- [ ] D4. Run `corepack pnpm --filter @repo/db type-check` — must exit 0.
- [ ] D5. Re-export updated types from `packages/db/src/index.ts` if needed.

### Step E — Harden ops/github-ingest.mjs

- [ ] E1. Read `ops/github-ingest.mjs` in full (347 lines).
- [ ] E2. Remove any code that writes to `packages/ui/src/` — confirm removal with grep after edit: `grep -r "UI_SRC_DIR\|packages/ui/src" ops/github-ingest.mjs` must return no match.
- [ ] E3. Harden MIT license gate (ALREADY EXISTS at ~lines 104-136 + 227-231 — do NOT rebuild from scratch): replace the `throw new IngestError('ABORT...')` with `console.warn('SKIPPED [repo]: no MIT license detected')` + return a structured skip value (`null` or `{ skipped: true, reason: 'no-mit-license' }`). **IMPORTANT (execute-agent instruction):** After this change, `ingest()` returns `null` (or a skip object) instead of throwing on non-MIT repos. The CLI `main()` function (line ~330) currently passes the result directly to `console.log` — you MUST add a null/skip guard in `main()`: `if (!result || result.skipped) { console.log('Skipped: license not MIT'); process.exit(0); }` before the existing result usage.
- [ ] E4. Attribution field rename/extension — grep for all call sites of `renderRegistry()` first (`grep -n "renderRegistry" ops/github-ingest.mjs`):
  - Rename `Original_Author` → `Author` in `renderRegistry()` output
  - Replace `Author_URL` with `Source_Repo`, value = `https://github.com/${owner}/${repo}` (repo URL, not author profile URL)
  - Add to `renderRegistry()` output: `Content_Type: component`, `License_SPDX: <resolved spdx>`, `IsPro: false` (default for ingested components)
  - Update `renderRegistry()` signature and its call site(s). Update `ingest()` return object: rename `authorUrl` → `sourceRepo`.
- [ ] E5. Add heavy-dep warning gate: after dependency array is resolved, check if any dep is in `["three", "matter-js", "@react-three/fiber", "gsap", "face-api.js", "ogl"]`. If found, log: `WARNING [repo]: heavy dep detected — [dep]; manual review required` and set `HeavyDeps: true` flag in frontmatter (do NOT block ingestion; warn only). **IMPORTANT (execute-agent instruction):** E4 and E5 both modify `renderRegistry()`'s signature and call site — coordinate these in ONE edit. Add `sourceRepo` AND `heavyDeps` to the `renderRegistry()` parameter list simultaneously. Do not do E4 then E5 as separate function signature changes that could conflict.
- [ ] E6. Confirm all new required schema fields are written to generated registry entries: `Content_Type`, `Author`, `Source_Repo`, `License_SPDX`, `IsPro` (default false for ingested components).
- [ ] E7. Write unit tests in `ops/__tests__/github-ingest.test.mjs`. Runner: `node --test ops/__tests__/github-ingest.test.mjs` (NOT vitest — ops tests are NOT part of `corepack pnpm --filter web test`):
  - Mock GitHub repo with no LICENSE file → assert no registry file written, SKIPPED logged (structured skip return, not throw).
  - Mock GitHub repo with MIT LICENSE → assert registry file written with `License_SPDX: MIT`.
  - Mock repo with `three` in deps → assert `HeavyDeps: true` in output and warning logged.
  - Mock repo without Author → assert `Author` field captured from GitHub owner.
  - Splitter handles `\r\n` line endings → assert correct field parse (regression for Windows CRLF).

### Step F — Final validation pass

- [ ] F1. Run `node scripts/validate-registry.mjs` — exit 0 for all 5 remaining registry files.
- [ ] F2. Run `corepack pnpm --filter @repo/db type-check` — exit 0.
- [ ] F3. Run `corepack pnpm --filter web build` — exit 0 (regression gate — confirms prune stays build-safe).
- [ ] F4. Confirm `grep -r "UI_SRC_DIR\|packages/ui/src" ops/github-ingest.mjs` returns no match.
- [ ] F5. Run `node --test ops/__tests__/github-ingest.test.mjs` — exit 0.

---

## Acceptance Criteria Covered

| AC | Criterion | Proven by |
|---|---|---|
| AC-10 | MIT license gate in ingest tool | Unit test Step E7 — Fully-Automated (node --test) |
| AC-11 | Author + Source_Repo + License_SPDX in every registry entry | `node scripts/validate-registry.mjs` exit 0 — Fully-Automated |
| AC-13 | Bundle/legacy cleanup | 129 legacy registry files deleted; grep confirms no UI_SRC_DIR write — Fully-Automated |

---

## Exit Gate

```bash
# 1. Registry linter passes all 5 remaining entries
node scripts/validate-registry.mjs
# Expected: exit 0, no errors

# 2. DB package type-check
corepack pnpm --filter @repo/db type-check
# Expected: exit 0

# 3. Ingest tool has no UI_SRC_DIR write
grep -r "UI_SRC_DIR\|packages/ui/src" ops/github-ingest.mjs || echo "PASS"
# Expected: "PASS" (no match)

# 4. Build regression (confirms prune is build-safe)
corepack pnpm --filter web build
# Expected: exit 0

# 5. ops unit tests (node built-in runner — NOT vitest)
node --test ops/__tests__/github-ingest.test.mjs
# Expected: exit 0

# 6. Web unit test regression from Phase 1 suite
corepack pnpm --filter web test
# Expected: exit 0
```

- All checklist items checked
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Manual `---` frontmatter splitter cannot reliably handle edge cases in the 5 surviving files — escalate to orchestrator to evaluate gray-matter as a one-off dep.
- `packages/db/src/schema.ts` has deeply coupled types that make backwards-compatible extension risky — escalate to orchestrator.
- `renderRegistry()` has more than one call site with different signatures — grep first at E4; if multiple sites, expand E4 scope and note in phase report.

---

## Phase Loop Progress

- [x] 1. RESEARCH — research-agent: Phase 1 report read; registry current state inspected; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written (PRUNE + Fork B-E resolved)
- [x] 3. PLAN-SUPPLEMENT — plan-agent: phase plan updated with INNOVATE findings + user PRUNE decision; Inner Loop Refresh Note written 2026-06-28
- [x] 4. PVL — vc-validate-agent: full V1–V7; validate-contract written 2026-06-28 (Gate: CONDITIONAL)
- [x] 5. EXECUTE — all checklist items done; per-section test gates green (2026-06-28)
- [x] 6. EVL — all EVL gates green (8/8 independent vc-tester re-run, 2026-06-28); follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, committed (2026-06-28)

---

## Touchpoints

- `docs/evidence-manifest/registry/` — DELETE 129 legacy files (scripted glob); KEEP + MIGRATE 5 curated files
- `scripts/validate-registry.mjs` (new)
- `ops/__tests__/github-ingest.test.mjs` (new)
- `packages/db/src/schema.ts`
- `packages/db/src/index.ts` (if needed for schema re-export)
- `ops/github-ingest.mjs`

**NOT touched in Phase 2:**
- `apps/web/app/(catalog)/[category]/[slug]/page.tsx` (force-dynamic + null-safe — prune is build-safe)
- `apps/web/lib/catalog.ts` (hardcoded manifest — slug prune is Phase 3)
- `apps/web/lib/registry.ts` (IsPro contract complete from Phase 1)

---

## Public Contracts

- Registry YAML frontmatter: new required fields established (Content_Type, Author, Source_Repo, License_SPDX, IsPro); all downstream phases (3, 4) depend on this schema being stable after Phase 2
- `ComponentPayload` in `packages/db` extended with new optional fields — backwards-compatible with existing Qdrant vectors
- `scripts/validate-registry.mjs` exit code: 0 = all valid, 1 = failures — used as CI gate in later phases
- `ops/github-ingest.mjs` output: all generated registry files conform to extended schema; license gate returns structured skip (not throw) on non-MIT repos

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| validate-registry.mjs exits 0 for all 5 remaining registry files | Fully-Automated | AC-11 |
| Registry dir count: 134 before → 5 after scripted delete | Fully-Automated | AC-13 (legacy cleanup) |
| ingest tool: non-MIT repo returns structured skip, SKIPPED logged (not throw) | Fully-Automated | AC-10 |
| ingest tool: MIT repo writes registry with License_SPDX: MIT, Author, Source_Repo | Fully-Automated | AC-10, AC-11 |
| ingest tool: heavy dep detected → HeavyDeps: true in output, warning logged | Fully-Automated | Bundle safety gate |
| grep: no UI_SRC_DIR write in ingest tool | Fully-Automated | AC-13 (bundle bloat safety) |
| packages/db type-check exits 0 | Fully-Automated | Schema regression |
| build exits 0 after prune (force-dynamic confirms null-safe) | Fully-Automated | Build regression gate |
| node --test ops/__tests__/github-ingest.test.mjs exits 0 | Fully-Automated | AC-10 (test runner: node built-in) |
| Splitter handles \r\n line endings (CRLF test case) | Fully-Automated | Robustness gate |

---

## Test Infra Improvement Notes

- `ops/github-ingest.mjs` currently has no test coverage — Phase 2 adds the first unit test suite at `ops/__tests__/github-ingest.test.mjs` using Node's built-in `node:test` runner. No new npm dep required.
- YAML frontmatter parsing: manual `---` block splitter (no gray-matter) is the resolved approach. Splitter must handle `\r\n` — add a CRLF regression test case (Step E7 last bullet).
- ops tests are NOT wired into `corepack pnpm --filter web test` (vitest suite). They run via `node --test` directly. Consider adding an `ops:test` script to root package.json in a later phase for CI integration.

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization-catalog/active/21st-clone_27-06-26/phase-2-registry-schema_PLAN_27-06-26.md`
- Last completed step: Step 7 (UPDATE PROCESS) — phase DONE (2026-06-28). All 7 inner-loop steps complete.
- Validate-contract status: written (2026-06-28, Gate: CONDITIONAL — 5 concerns accepted as execute-agent instructions); EVL PASS closes CONDITIONAL
- Phase status: ✅ VERIFIED (EVL 8/8 green, AC-10/AC-11/AC-13 met, accepted deviations documented)
- Next step: Phase 3 RESEARCH — spawn vc-research-agent for `phase-3-catalog-routing_PLAN_27-06-26.md`

---

## Validate Contract

Status: CONDITIONAL
Date: 28-06-26
date: 2026-06-28
generated-by: inner-pvl: phase-2

Parallel strategy: sequential
Rationale: 2/7 signals (S2: schema surface; S7: 6 files in blast radius) — inner PVL for single phase, no fan-out parallelism needed

Test gates:

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| B4 | Validator rejects missing Author, rejects invalid Content_Type, passes valid frontmatter | Fully-Automated | `node --test scripts/__tests__/validate-registry.test.mjs` (created in Step B4) | B — fixed in this plan (test file created by execute-agent) |
| F1 | All 5 surviving registry files pass schema validation | Fully-Automated | `node scripts/validate-registry.mjs` exits 0 | A — proven during execute |
| D4 | packages/db type-check passes with extended ComponentPayload | Fully-Automated | `corepack pnpm --filter @repo/db type-check` exits 0 | A — proven during execute |
| F3 | Build regression passes after 134-file prune | Fully-Automated | `corepack pnpm --filter web build` exits 0 | A — proven during execute |
| E7 | Ingest unit tests: MIT gate warn/skip, MIT pass writes registry, heavy-dep detection, CRLF splitter | Fully-Automated | `node --test ops/__tests__/github-ingest.test.mjs` exits 0 | B — fixed in this plan (test file created by execute-agent) |
| Phase1-reg | Phase 1 vitest regression (16 tests remain passing) | Fully-Automated | `corepack pnpm --filter web test` exits 0 | A — proven during execute |
| C1-count | Registry dir count after scripted delete | Fully-Automated | `ls docs/evidence-manifest/registry/ | wc -l` outputs 5 | A — proven during execute |
| E2-grep | No UI_SRC_DIR write remains in ingest tool | Fully-Automated | `grep -r "UI_SRC_DIR\|packages/ui/src" ops/github-ingest.mjs` returns no match | A — proven during execute |

Failing stubs (Fully-Automated rows only — TDD starting points for execute-agent):

```
test("should reject frontmatter missing Author field", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: Validator rejects missing Author field")
})
test("should reject invalid Content_Type value", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: Validator rejects invalid Content_Type")
})
test("should pass valid frontmatter with all required fields", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: Validator passes valid frontmatter")
})
test("should not throw on non-MIT license — should log SKIPPED and return structured skip", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: Ingest MIT gate warn/skip (not throw)")
})
test("should write registry with License_SPDX: MIT on MIT-licensed repo", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: Ingest MIT pass writes registry")
})
test("should set HeavyDeps: true when 'three' in deps", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: Ingest heavy-dep detection")
})
test("should parse CRLF frontmatter correctly", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: CRLF splitter regression")
})
```

Dimension findings:
- Infra fit: PASS — force-dynamic confirmed (export const dynamic = "force-dynamic" at page.tsx:28); no generateStaticParams; no readdir over registry in web routes; scripts/ + ops/__tests__/ creation is in scope; Node 22 + corepack pnpm environment confirmed
- Test coverage: CONCERN — B4 validator unit tests not wired into F-series exit gate (execute-agent must run `node --test scripts/__tests__/validate-registry.test.mjs` explicitly after B4); validator has no CRLF regression test (only ops/E7 has CRLF case)
- Breaking changes: CONCERN — (1) ComponentCategory alias ambiguity in D3; (2) IsPro duplication risk on 2 Phase-1-touched files in C2; (3) main() null-check gap from E3 structured-return change
- Security surface: PASS — no auth/billing/secrets surfaces; UI_SRC_DIR removal reduces attack surface; MIT gate hardening is warn-only (no new exposure)

Execute-agent instructions (concerns converted to binding instructions):
- EI-1 (D3): Keep `ComponentCategory` type alias intact in schema.ts. Only change `Category: ComponentCategory` → `Category: string` in ComponentPayload. Do NOT delete or rename the ComponentCategory alias — it is used in points.ts function signatures.
- EI-2 (C2): Before adding IsPro to lofi-cards__lofi-card.md and cozy-buttons__pill-button.md, read each file first. If `IsPro:` already exists with the correct value (true), skip that field — do not create a duplicate. Phase 1 already wrote IsPro: true to both files.
- EI-3 (E3): After replacing the throw in ingest() with a structured skip return, add a null/skip guard in the CLI main() function. Before the existing `const result = await ingest(...)` result usage, add: `if (!result || result.skipped) { console.log('Skipped: ' + (result?.reason || 'license not MIT')); process.exit(0); }`.
- EI-4 (E4+E5 coordination): renderRegistry() signature must be extended in a SINGLE coordinated edit to add both `sourceRepo` and `heavyDeps` parameters simultaneously. Do not do E4 then E5 as two separate function-signature edits that could conflict.
- EI-5 (B4): After completing B4, run `node --test scripts/__tests__/validate-registry.test.mjs` explicitly. This command is NOT part of the F-series exit gate but is required before marking B4 complete.

Open gaps: none — all 5 concerns resolved as execute-agent instructions above

Known Gaps (accepted): none — no out-of-scope gaps requiring NEW PLAN REQUIRED designation

What this coverage does NOT prove:
- B4 (validator unit tests): does not prove the validator handles all possible edge cases in future registry files written by Phase 4 ingestion; only tests the 3 specified unit scenarios
- F1 (validate-registry.mjs exits 0): does not prove the validator script handles registry files with binary data or non-UTF-8 encoding
- D4 (type-check): does not prove runtime compatibility with existing Qdrant vectors that have no new optional fields (Qdrant payload is schemaless — runtime compat is not type-checked)
- F3 (build regression): does not prove the build passes when real Clerk dev keys are absent (requires format-valid placeholder key in apps/web/.env.local per Phase 1 learnings)
- E7 (ingest unit tests): does not prove the ingest tool handles GitHub API rate limits or network timeouts; tests use mocks not live GitHub API calls
- Phase1-reg (vitest suite): does not prove visual/browser-level paywall behavior (AC-3/AC-4 remain Phase 1 known-gaps pending real Clerk keys)
- C1-count: does not prove the correct 5 files survived (only proves count = 5); execute-agent must visually confirm the 5 prefixes after delete

Gate: CONDITIONAL
Accepted by: session (autonomous, /goal execution) — accepted concerns: EI-1 (ComponentCategory alias), EI-2 (IsPro duplication guard), EI-3 (main() null-check), EI-4 (renderRegistry signature coordination), EI-5 (B4 test runner explicit run)

## Deviations (EXECUTE, 2026-06-28)

Within-blast-radius deviations made under /goal to keep the F3 build gate green after the D3
open-Category schema change. All inside the Phase 2 blast radius (`packages/db/src/` + the
storefront's direct type consumer). The forbidden files (page.tsx, catalog.ts) were NOT touched.
`ComponentCategory` alias remains exported and intact (EI-1 honored).

1. **`packages/db/src/points.ts`** — widened `SearchOptions.category` and the
   `listComponentsByCategory(category)` param from `ComponentCategory` to `string`.
   *Why:* D3 broadened `ComponentPayload.Category` to `string`; these signatures consume it.
   *Impact:* none at runtime (Qdrant filter takes any string); `ComponentCategory` alias kept.
2. **`apps/web/lib/components.ts`** — widened `ComponentSummary.category`, `SearchParams.category`,
   and `getComponentsByCategory(category)` from `ComponentCategory` to `string`; dropped the now-unused
   `ComponentCategory` import.
   *Why:* `toSummary()` assigns `payload.Category` (now `string`) into a `ComponentCategory` field —
   hard type error at build (lib/components.ts:39).
   *Impact:* none; the two API routes (search, components) still pass `ComponentCategory` values,
   which are assignable to `string`. This file was NOT in the forbidden list (only page.tsx + catalog.ts were).

**Count note:** plan said "134 files before → 5 after"; actual registry held 139 (134 legacy + 5 curated).
The scripted prefix-delete removed exactly the 134 legacy files; exactly 5 curated survivors remain — the
binding assertion (5 after) holds. The "134 before" figure in the plan was stale.

## Autonomous Goal Block

This plan is a phase plan within the 21st-clone program. The umbrella plan governs the /goal block. Reference for latest state: process/features/monetization-catalog/active/21st-clone_27-06-26/21st-clone-umbrella_PLAN_27-06-26.md
