---
name: plan:phase-14-deploy-scale
description: Phase 14 Deploy and Scale Hardening
date: 01-07-26
feature: monetization-catalog
phase: 14
---

# Phase 14: Deploy + Scale Hardening

Date: 01-07-26
Complexity: Simple
Status: ✅ VERIFIED

## Overview

Harden the application for production deployment on Vercel by implementing caching, rate limiting on the search API, observability via Vercel analytics, and graceful error handling.

## Quick Links

- [Overview](#overview)
- [Execution Brief](#execution-brief)
- [Scope](#scope)
- [Functional Requirements](#functional-requirements)
- [Acceptance Criteria](#acceptance-criteria)
- [Implementation Checklist](#implementation-checklist)
- [Touchpoints](#touchpoints)
- [Public Contracts](#public-contracts)
- [Blast Radius](#blast-radius)
- [Verification Evidence](#verification-evidence)
- [Phase Loop Progress](#phase-loop-progress)
- [Validate Contract](#validate-contract)

## Execution Brief

**IMPORTANT:** This is a SIMPLE (one-session) plan - implement continuously without approval gates.

Before EXECUTE begins, vc-validate-agent must write the Validate Contract section. Do not start EXECUTE with an empty placeholder.

### Phase Completion Rules

- All ACs must be met
- Deployment config verified on Vercel

### Post-Phase Testing

After completing all implementation steps, verify the following (see `process/context/tests/all-tests.md` for methodology):

1. **Smoke Test:** Run `pnpm dev` - app loads without errors `[automated]`
2. **Rate Limit Test:** Hit `/api/search` repeatedly to trigger 429 `[agent-probe]`
3. **Analytics Test:** Verify Analytics component renders `[automated]`

## Scope

**In-Scope:**
- Vercel Deployment configuration
- Next.js Caching for registry reads
- Rate Limiting via Upstash
- Observability via Vercel Analytics/Speed Insights
- Branded Error Boundaries

## Functional Requirements

1. **Caching:** Wrap `lib/registry.ts` and `lib/catalog.ts` file reads in `React.cache()` and `unstable_cache`.
2. **Rate Limiting:** Implement `@upstash/ratelimit` in `/api/search/route.ts`.
3. **Observability:** Integrate `@vercel/analytics` and `@vercel/speed-insights` in the root layout.
4. **Error Handling:** Add branded `error.tsx` and `not-found.tsx` to `app/(catalog)/`.

## Acceptance Criteria

1. ✅ App runs on `localhost:3000` with `pnpm dev`
2. ✅ Search API returns 429 after rate limit threshold
3. ✅ Registry reads are cached effectively
4. ✅ Error boundary catches exceptions and shows branded UI

## Implementation Checklist

1. **Caching**
   - Import and apply `React.cache` and `unstable_cache` in `apps/web/lib/registry.ts` and `apps/web/lib/catalog.ts`.
2. **Rate Limiting**
   - Install `@upstash/ratelimit`.
   - Update `apps/web/app/api/search/route.ts` to instantiate and check ratelimit.
3. **Observability**
   - Install `@vercel/analytics` and `@vercel/speed-insights`.
   - Add `<Analytics />` and `<SpeedInsights />` to `apps/web/app/layout.tsx`.
4. **Error Boundaries**
   - Create `apps/web/app/(catalog)/error.tsx` with a branded error UI.
   - Create `apps/web/app/(catalog)/not-found.tsx` with a branded 404 UI.

## Touchpoints

- `apps/web/lib/registry.ts`
- `apps/web/lib/catalog.ts`
- `apps/web/app/api/search/route.ts`
- `apps/web/app/layout.tsx`
- `apps/web/app/(catalog)/error.tsx`
- `apps/web/app/(catalog)/not-found.tsx`
- `apps/web/package.json`

## Public Contracts

- `/api/search/route.ts`: Rate limited, returns 429 after threshold

## Blast Radius

- API routes and caching layer
- Root layout (wrappers added)

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| Search API rate limiting | Agent-Probe | Rate limit triggers 429 after threshold |

## Phase Loop Progress

- [x] 1. RESEARCH
- [x] 2. INNOVATE
- [x] 3. PLAN-SUPPLEMENT
- [x] 4. PVL
- [x] 5. EXECUTE
- [x] 6. EVL
- [x] 7. UPDATE-PROCESS

## Resume and Execution Handoff

1. **Selected plan file path:** `process/features/monetization-catalog/active/21st-clone_27-06-26/phase-14-deploy-scale_PLAN_01-07-26.md`
2. **Last completed phase or step:** PVL
3. **Validate-contract status:** complete (PASS)
4. **Supporting context files loaded:** `process/context/all-context.md`, `process/features/monetization-catalog/active/21st-clone_27-06-26/21ST-CLONE-ULTIMATE-ROADMAP_27-06-26.md`
5. **Next step for a fresh agent picking up mid-execution:** Spawn `vc-execute-agent` for step 5 (EXECUTE) using the completed Validate Contract and Goal block.

## Validate Contract

### Layer 1 dimensions
| Layer 1 dimensions | Status |
|---|---|
| Infra fit | PASS |
| Test coverage | PASS |
| Breaking changes | PASS |
| Security surface | PASS |

### Layer 2 sections
| Layer 2 sections | Status |
|---|---|
| Section 1 — Caching | PASS |
| Section 2 — Rate Limiting | PASS |
| Section 3 — Observability | PASS |
| Section 4 — Error Boundaries | PASS |

**Totals: 0 FAILs / 0 CONCERNs / 8 PASSes**

**→ Net Gate: PASS**

### Proposed Plan Updates
| # | What changes | Where in plan | Why |
|---|---|---|---|
| None | N/A | N/A | Plan is mechanically feasible as written |

### Execute-Agent Instructions
| # | Instruction | Trigger condition |
|---|---|---|
| E1 | Ensure Next.js 15 App Router conventions for data cache (e.g. `unstable_cache`) are used correctly alongside `React.cache` in `registry.ts` and `catalog.ts`. | Section 1 entry |
| E2 | Before testing `@upstash/ratelimit`, ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present in `.env.local`. | Section 2 entry |
| E3 | When building `error.tsx` and `not-found.tsx`, match the existing Cozy Downloads visual identity (e.g., minimalist/pastel). | Section 4 entry |

### Backlog Artifacts
| Artifact | Location | What it tracks |
|---|---|---|
| none | n/a | n/a |

## Autonomous Goal Block
```text
SESSION GOAL: Phase 14: Deploy + Scale Hardening
Ref: process/features/monetization-catalog/active/21st-clone_27-06-26/phase-14-deploy-scale_PLAN_01-07-26.md

TARGET: Complete Phase 14 implementation until:
- Caching applied to registry.ts and catalog.ts
- Upstash rate limit active in /api/search/route.ts
- Vercel analytics/speed-insights added to root layout
- Branded error.tsx and not-found.tsx added to app/(catalog)
- App runs clean locally and search API returns 429 when rate limited

AUTONOMY:
1. Follow the Implementation Checklist precisely.
2. Adhere to Execute-Agent Instructions E1-E3 from Validate Contract.

HARD STOPS:
- Live Vercel deploy configuration fails or requires manual token creation not available in env
- Redis credentials for Upstash missing preventing local testing

NEXT PHASE: EVL
CONTRACT SUMMARY: 0 FAILS / 0 CONCERNS / PASS NET GATE
EXECUTE START COMMAND: Spawn vc-execute-agent for Phase 14
```
