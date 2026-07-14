---
name: plan:21st-clone-phase-4-ingestion-qdrant
description: "21st-clone — Phase 4: Run ingest at scale, populate Qdrant, attribution UI on component detail page"
date: 27-06-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: phase-4
---

# Phase 4 — Ingestion Run + Qdrant Population + Attribution Display

**Program:** 21st-clone monetization-catalog
**Umbrella plan:** process/features/monetization-catalog/active/21st-clone_27-06-26/21st-clone-umbrella_PLAN_27-06-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/monetization-catalog/active/21st-clone_27-06-26/phase-4-ingestion-qdrant_REPORT_27-06-26.md

---

## Purpose

Use a deterministic bash script (`ops/seed-catalog.sh`) to ingest 25 hardcoded MIT URLs with rate-limit delays to populate the registry with enough components for catalog breadth (AC-1: 10+ categories, 5+ per category). Create a local `ops/seed-qdrant.ts` script to read the ingested registry files and populate Qdrant. Populate the local Qdrant instance with embedded vectors so `/api/search` returns behavioral query results (AC-14). Add per-component attribution UI (author name, source repo link, MIT label) to the component detail page (AC-12). Update `apps/web/lib/components.ts` (specifically the `toSummary` function) to surface new payload fields in search results.

CONTAINS LIVE EXTERNAL CALLS: `ops/seed-catalog.sh` and `ops/github-ingest.mjs` call GitHub API (rate-limited, no cost). `ops/seed-qdrant.ts` calls OpenAI embeddings API (billed per token), and Qdrant (local). Explicit user opt-in required for OpenAI/Qdrant calls. GitHub API calls are non-billed but require a `GITHUB_TOKEN` env var for rate-limit headroom. If `OPENAI_API_KEY` is missing, `ops/seed-qdrant.ts` will gracefully fallback to 1536-dimensional mock vectors.

---

## Entry Gate

- Phase 2 VERIFIED: registry schema stable; ingest tool hardened; validate-registry.mjs exits 0.
- Phase 3 VERIFIED: getCatalog() live; 10+ category pages rendering; build exits 0.
- Phase 2 + Phase 3 reports read by research-agent before starting this phase.
- Env vars required for live run: `GITHUB_TOKEN`, `OPENAI_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY` (or local docker-compose Qdrant running).
- User has confirmed opt-in for OpenAI embedding calls (billed).

---

## Blast Radius

- `ops/seed-catalog.sh` — NEW deterministic bash script to ingest 25 hardcoded MIT URLs with rate-limit delays
- `ops/seed-qdrant.ts` — NEW local script to read ingested registry files and populate Qdrant with real or mock vectors
- `ops/github-ingest.mjs` — RUN as a script (no source edits)
- `docs/evidence-manifest/registry/` — NEW .md files written by ingest tool (no edits to existing Phase 2 files)
- `apps/web/lib/components.ts` — update search mapping `toSummary` to include new payload fields (Author, Content_Type, IsPro) in returned results
- `apps/web/components/attribution-display.tsx` — new React component: author name, source repo link, MIT license label
- `apps/web/app/(catalog)/[category]/[slug]/page.tsx` — add `<AttributionDisplay>` to detail page (read Phase 1 + Phase 3 final version before editing)

---

## Implementation Checklist

### Step A — Create deterministic ingestion script

- [ ] A1. Create `ops/seed-catalog.sh`.
- [ ] A2. Populate the script with 25 hardcoded MIT GitHub URLs covering the target 10+ categories (buttons, cards, heroes, inputs, navbars, tabs, dialogs, tables, backgrounds, pricing).
- [ ] A3. The script should loop through the URLs, calling `node ops/github-ingest.mjs <url>` for each, with a 5-second sleep between calls to respect rate limits.

### Step B — Run ingestion via seed script

- [ ] B1. Confirm `GITHUB_TOKEN` is set for rate-limit headroom.
- [ ] B2. Run `bash ops/seed-catalog.sh`.
- [ ] B3. Run `node scripts/validate-registry.mjs` — all new registry files must pass.
- [ ] B4. Confirm `getCatalog()` now returns 10+ distinct categories each with 5+ entries.

### Step C — Update apps/web/lib/components.ts search mapping

- [ ] C1. Read `apps/web/lib/components.ts` (specifically the `toSummary` function).
- [ ] C2. Update the mapping logic to include `author`, `content_type`, `is_pro`, `source_repo` in returned search result objects.
- [ ] C3. Update the `ComponentPayload` type/usage to match the extended schema.
- [ ] C4. Run `corepack pnpm --filter web type-check` — exit 0.
- [ ] C5. Write/update unit test for search result shape.

### Step D — Create and run local Qdrant population script

- [ ] D1. Create `ops/seed-qdrant.ts`.
- [ ] D2. The script should read all `.md` files in `docs/evidence-manifest/registry/`.
- [ ] D3. For each file, extract `AI_Behavioral_Summary`.
- [ ] D4. Call OpenAI `text-embedding-3-small` to get a 1536-dim vector. **CRITICAL FALLBACK**: If `OPENAI_API_KEY` is missing, gracefully fallback to generating 1536-dimensional mock vectors (arrays of 0s or random floats).
- [ ] D5. Upsert to local Qdrant `reactbits_components` collection with payload fields: `Component_Name`, `Category`, `Content_Type`, `Author`, `Source_Repo`, `IsPro`, `License_SPDX`, `Registry_Path`.
- [ ] D6. Run `corepack pnpm tsx ops/seed-qdrant.ts`.

### Step E — Verify semantic search (CONDITIONAL)

- [ ] E1. Confirm Qdrant collection has vectors: `curl -s http://localhost:6333/collections/reactbits_components` — assert `vectors_count > 0`.
- [ ] E2. Issue a search query via `/api/search`. If mock vectors were used, AC-14 is strictly CONDITIONAL (it will "work" and not crash, but results will not be semantically meaningful). Document this gracefully.

### Step F — Attribution UI component

- [ ] F1. Create `apps/web/components/attribution-display.tsx`:
  - Props: `author: string`, `sourceRepo: string`, `license: string` (default "MIT")
  - Renders: author name (text), source repo URL (anchor tag with `target="_blank" rel="noopener noreferrer"`), "MIT License" label
  - Visible to all users (free and Pro) — no paywall on attribution
  - Accessible: link has descriptive `aria-label`
- [ ] F2. Update `apps/web/app/(catalog)/[category]/[slug]/page.tsx`:
  - Import `<AttributionDisplay>` and render below the component preview
  - Pass `author`, `sourceRepo`, `license` from the registry entry (already returned by `readRegistryEntry()` from Phase 1)
  - Preserve all Phase 1 (isPro gate) and Phase 3 (notFound guard) logic exactly
- [ ] F3. Write integration test / Playwright snapshot:
  - Render a component detail page
  - Assert author name text present in DOM
  - Assert anchor tag with sourceRepo URL present
  - Assert "MIT License" text present

### Step G — Semantic search smoke test

- [ ] G1. Issue a behavioral search query via the Next.js API route: `curl -s "http://localhost:3000/api/search?q=soft+pastel+button"` — assert non-empty results array returned.
- [ ] G2. Assert at least 1 result has a relevance score above the collection minimum threshold (check Qdrant score field > 0.5 or per-collection default). Skip this assertion if mock vectors were used.
- [ ] G3. Note: AC-14 is strictly CONDITIONAL. If `OPENAI_API_KEY` is missing, the API will "work" (not crash) and return results using mock query embeddings, but they will not be semantically meaningful. Document in phase report.

### Step H — Final regression pass

- [ ] H1. Run `node scripts/validate-registry.mjs` — exit 0 for all registry files (original + newly ingested).
- [ ] H2. Run `corepack pnpm --filter web build` — exit 0.
- [ ] H3. Run `corepack pnpm --filter web test` — exit 0 (all prior unit tests green).
- [ ] H4. Run `corepack pnpm --filter @repo/db type-check` — exit 0.
- [ ] H5. Confirm no heavy dep in main bundle: `grep -r "three\|matter-js\|face-api" .next/build-manifest.json || echo "PASS"`.

---

## Acceptance Criteria Covered

| AC | Criterion | Proven by |
|---|---|---|
| AC-1 | 10+ categories, 5+ entries each | getCatalog() check Step B4 — Hybrid |
| AC-12 | Attribution visible on detail page | Integration test Step F3 — Hybrid |
| AC-14 | Semantic search returns results (CONDITIONAL) | API smoke test Step G — Hybrid |

---

## Exit Gate

```bash
# 1. Registry linter — all entries valid
node scripts/validate-registry.mjs
# Expected: exit 0

# 2. Qdrant populated
curl -s http://localhost:6333/collections/reactbits_components | grep -c '"vectors_count"'
# Expected: 1 (field present, value > 0)

# 3. Search returns results
curl -s "http://localhost:3000/api/search?q=soft+pastel+button" | grep -c '"slug"'
# Expected: >= 1

# 4. Build exits 0
corepack pnpm --filter web build
# Expected: exit 0

# 5. No bundle bloat regression
grep -r "three\|matter-js\|face-api" .next/build-manifest.json || echo "PASS"
# Expected: "PASS"

# 6. Full test suite
corepack pnpm --filter web test && corepack pnpm --filter @repo/db type-check
# Expected: exit 0
```

- All checklist items checked
- Phase report written to report destination above
- AC-14 gate may be CONDITIONAL if OPENAI_API_KEY unavailable at EVL time — document explicitly

---

## Blockers That Would Justify BLOCKED Status

- `OPENAI_API_KEY` not set — Not a hard blocker anymore due to mock vector fallback. AC-14 becomes strictly CONDITIONAL.
- GitHub API returns 403 (rate limit exhausted even with token) — ingest run blocked for bulk repos; may partially run.
- Qdrant not running locally and VPS credentials not available — Step D blocked; mark as CONDITIONAL.
- Attribution component causes hydration mismatch in Next.js RSC/client boundary — escalate to orchestrator.

---

## Phase Loop Progress

- [ ] 1. RESEARCH — research-agent: Phase 2 + Phase 3 reports read; current search.ts + n8n blueprint inspected; Qdrant collection state checked; plan drift documented
- [ ] 2. INNOVATE — innovate-agent: ingestion strategy decided; repo list approach confirmed; Decision Summary written
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: phase plan updated with research findings (repo list, env availability); Inner Loop Refresh Note if sections changed
- [ ] 4. PVL — vc-validate-agent: full V1–V7; validate-contract written; live-provider gates (OpenAI, Qdrant) noted as cost-class: needs-live-provider
- [ ] 5. EXECUTE — all checklist items done; per-section test gates green
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

---

## Touchpoints

- `ops/seed-catalog.sh` (NEW script)
- `ops/seed-qdrant.ts` (NEW script)
- `ops/github-ingest.mjs` (run only — no source edits)
- `docs/evidence-manifest/registry/` (new .md files from ingest run)
- `apps/web/lib/components.ts` (search mapping update)
- `apps/web/components/attribution-display.tsx` (new)
- `apps/web/app/(catalog)/[category]/[slug]/page.tsx`
- New test files for attribution-display and search result shape

---

## Public Contracts

- `/api/search` response shape unchanged; new fields (`author`, `content_type`, `is_pro`) added to each result object — additive, backwards-compatible
- `AttributionDisplay` component: pure presentational; no server state; safe to render in both RSC and client contexts
- Registry file naming: `{category}__{slug}.md` pattern unchanged; new files from ingest follow same convention

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| getCatalog() returns 10+ categories, 5+ entries each | Hybrid | AC-1 |
| Attribution display: author, sourceRepo link, MIT label in DOM | Hybrid | AC-12 |
| /api/search returns ≥1 result for behavioral query | Hybrid | AC-14 |
| Search result object includes author, content_type, is_pro fields | Fully-Automated | AC-12 data shape |
| validate-registry.mjs exits 0 for all entries (incl. ingested) | Fully-Automated | AC-11 regression |
| No heavy dep in main bundle after ingestion | Hybrid | AC-13 regression |
| Build exits 0 | Fully-Automated | Regression |

---

## Test Infra Improvement Notes

- AC-14 (semantic search) requires a populated local Qdrant — this is a hybrid gate dependent on infra availability. If Qdrant is not available at EVL time, the gate is CONDITIONAL. A future phase could add a Qdrant fixture seeder for deterministic CI testing.
- Attribution component unit test can be Fully-Automated with React Testing Library or Playwright component mode — prefer the latter if Playwright is already configured from earlier phases.
- OpenAI embedding calls in Step D cannot be unit-tested without mocking the OpenAI SDK — add `vi.mock('openai')` stubs in a follow-up if not done during Phase 4 EXECUTE.

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization-catalog/active/21st-clone_27-06-26/phase-4-ingestion-qdrant_PLAN_27-06-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Supporting context: umbrella plan, SPEC, Phase 1 + Phase 2 + Phase 3 reports (read all before starting), `apps/web/lib/components.ts`, `apps/web/app/(catalog)/[category]/[slug]/page.tsx`
- Next step: Spawn vc-research-agent for RESEARCH (Step 1) — read all prior phase reports and check Qdrant/env availability first
- Live-provider note: OpenAI and Qdrant calls require env keys + user opt-in. vc-validate-agent must flag these as cost-class: needs-live-provider in the validate-contract.

---

## Inner Loop Refresh Note

PLAN-SUPPLEMENT update applied based on INNOVATE decision:
- Updated `Blast Radius` and `Touchpoints` to include new scripts (`ops/seed-catalog.sh`, `ops/seed-qdrant.ts`) and removed `ops/n8n/`.
- Replaced references to `packages/db/src/search.ts` with `apps/web/lib/components.ts`.
- Replaced Steps A–E with the new bash seeding script and TypeScript Qdrant populator script with mock vector fallback.
- Updated AC-14 to strictly CONDITIONAL and modified Step G and Blockers to reflect the graceful fallback when `OPENAI_API_KEY` is missing.

---

## Validate Contract

Status: CONDITIONAL
Date: 29-06-26
date: 2026-06-29
generated-by: outer-pvl

Parallel strategy: sequential
Rationale: linear dependencies, 1 agent sufficient

Test gates:

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC-1 | 10+ categories, 5+ entries each | Hybrid | getCatalog() check Step B4 | A |
| AC-12 | Attribution visible on detail page | Hybrid | Integration test Step F3 | A |
| AC-14 | Semantic search returns results (CONDITIONAL) | Hybrid | API smoke test Step G | A |
| AC-12 data shape | Search result object includes new fields | Fully-Automated | unit test | A |
| AC-11 regression | validate-registry.mjs exits 0 | Fully-Automated | `node scripts/validate-registry.mjs` | A |
| AC-13 regression | No heavy dep in main bundle | Fully-Automated | `grep -r ... .next/build-manifest.json` | A |
| Regression | Build exits 0 | Fully-Automated | `corepack pnpm --filter web build` | A |

Dimension findings:
- Infra fit: PASS — Graceful fallback for missing OpenAI API key.
- Test coverage: PASS — All checklist steps mapped to gates.
- Breaking changes: PASS — Additive schema changes.
- Security surface: PASS — Rate limiting implemented via sleeps; read-only ingest.

Open gaps: 
- Cost-Class: `needs-live-provider` (OpenAI embeddings and Qdrant). Mock fallback active.

What this coverage does NOT prove:
- Does not prove the qualitative relevance of semantic search results when using real embeddings.

Gate: CONDITIONAL
Accepted by: user (accepted cost-class concerns)
