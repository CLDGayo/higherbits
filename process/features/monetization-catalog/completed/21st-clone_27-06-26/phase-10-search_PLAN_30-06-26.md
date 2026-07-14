---
name: plan:phase-10-search
description: "Phase 10: Full-Text Search + Qdrant Integration"
date: 30-06-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: 10
---

# Phase 10: Full-Text Search + Qdrant Integration (Hybrid Search)

**Status:** 🔄 CURRENT
**Goal:** Implement hybrid search using Qdrant (semantic + payload text match) to resolve the AC-14 gap from Phase 4.
**Decision:** Approach 2: Dual-Query App-Side Reranking (Payload Text Match). We will add a `text` index to the `Component_Name` and run two queries (one dense, one text-filtered) and merge the results.

## Implementation Steps

### 1. Update Qdrant Schema
- **File:** `packages/db/src/collection.ts` (or equivalent schema file)
- **Change:** Add a `text` index for the `Component_Name` payload field. This allows Qdrant to perform exact or substring matches on the component name.

### 2. Update Qdrant Ingestion
- **File:** `ops/seed-qdrant.ts`
- **Change:** Ensure that `Component_Name` and other relevant text fields (like `Author`) are properly included in the payload during the upsert process, and that the text indices are created during the collection initialization.

### 3. Update Search Logic (Hybrid Merging)
- **File:** `packages/db/src/points.ts` (or `search.ts`)
- **Change:** Modify the `searchComponents` function.
  - If a `textQuery` is provided, execute a dense search and a separate dense search with a payload `text` match filter.
  - Merge the arrays in memory. Apply a rank boost to the items found via the text match.
  - Return the merged list.

### 4. Update Next.js Search API
- **File:** `apps/web/app/api/search/route.ts`
- **Change:** Pass the raw text query string to the updated `searchComponents` function.

## Phase Loop Progress
- [x] Step 1 (RESEARCH) - Completed
- [x] Step 2 (INNOVATE) - Completed
- [x] Step 3 (PLAN-SUPPLEMENT) - Completed (Creation Mode)
- [ ] Step 4 (PVL) - Pending Validate Contract
- [ ] Step 5 (EXECUTE)
- [ ] Step 6 (EVL)
- [ ] Step 7 (UPDATE PROCESS)

## Validate Contract
**Status:** PASS
**Generated-by:** inner-pvl: phase-10

### 1. Structural Checks
- Blast radius mapped? Yes
- Dependencies verified? Yes
- Scope constrained? Yes

### 2. Required Test Gates (To be run by EVL/Tester)
1. `corepack pnpm --filter web build` (Must exit 0, no bundle bloat introduced)
2. `corepack pnpm --filter @repo/db type-check` (Must exit 0 to ensure search function types are valid)
3. **Agent-Probe:** Seed script check - Verify `ops/seed-qdrant.ts` correctly creates the `text` index for `Component_Name`.
4. **Agent-Probe:** Next.js Route Check - Verify `apps/web/app/api/search/route.ts` passes the raw text query downstream.

### 3. Execution Handoff
Execute agent is clear to proceed with `packages/db/src/collection.ts`, `packages/db/src/points.ts` (or search equivalent), `ops/seed-qdrant.ts`, and `apps/web/app/api/search/route.ts`.

