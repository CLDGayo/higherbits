[MODE: PLAN]

**Date**: 01-07-26
**Status**: COMPLETE
**Complexity**: COMPLEX

# Phase 13: Search Ranking, Trending & Analytics Plan

## Overview
Phase 13 introduces application-layer search re-ranking and trending capabilities without placing high-frequency write loads on the Qdrant vector database. 

Approach 1 (Decoupled Redis Tracking with Application-Layer Search Re-Ranking) is selected. Qdrant handles semantic retrieval (the candidate set), while Redis handles high-frequency view tracking (ZSETs and counters). The Node.js application fuses the semantic scores from Qdrant with popularity scores from Redis to produce the final re-ranked results. The Trending strip will fetch purely from Redis to find the most popular slugs, then hydrate those slugs via Qdrant or registry reads.

## Touchpoints
- `apps/web/package.json` (Ensure `@upstash/redis` is available)
- `apps/web/lib/redis.ts` (New file for Upstash Redis client)
- `apps/web/app/api/views/route.ts` (New view-tracking API)
- `apps/web/lib/components.ts` (Update `searchComponentsByText` and add `getTrendingComponents`)
- `apps/web/components/trending-strip.tsx` (Wire live data)
- `packages/db/src/index.ts` and `points.ts` (Add `getComponentsByRegistryPaths` to hydrate trending)

## Public Contracts
- `POST /api/views`: Takes `{ slug: string }`. Applies rate limit per IP. Increments ZSET `trending_components`.
- `searchComponentsByText`: Signature remains same, but internal ranking logic blends `qdrant_score` and `redis_zscore`.

## Blast Radius
- Search functionality (Semantic Vector Search)
- Component detailed views (Tracking triggers)
- Storefront trending components strip

## Architecture Notes / Data Flow
1. **View Tracking**: A user views a component. The client calls `POST /api/views`. The Node.js route handler rate-limits the IP, then calls `ZINCRBY trending_components 1 <slug>`.
2. **Trending Fetch**: The TrendingStrip calls `getTrendingComponents()`. It fetches `ZRANGE trending_components 0 9 REV WITHSCORES` from Redis, getting the top N slugs. It then queries Qdrant to hydrate the payloads for those slugs.
3. **Search Re-ranking**: User searches. `apps/web/lib/components.ts` queries Qdrant for top 50 semantic matches. It extracts their slugs, calls `ZMSCORE trending_components <slugs>` on Redis. In memory, it calculates `final_score = semantic_score + (log(views) * 0.1)`, sorts, and slices to top 12.

## Implementation Checklist

1. Create `apps/web/lib/redis.ts` to initialize and export the `@upstash/redis` client (expects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`).
2. Add `getComponentsByRegistryPaths(client, paths: string[])` to `@repo/db` (`packages/db/src/points.ts` and export in `index.ts`).
3. Create `apps/web/app/api/views/route.ts` with a POST handler. It must accurately extract the IP (parsing forwarded headers like `x-forwarded-for`) for `checkRateLimit(ip)`. On pass, `redis.zincrby("trending_components", 1, body.slug)`. Ensure `UPSTASH_REDIS_REST_TOKEN` is strictly server-side only.
4. Update `apps/web/lib/components.ts` to implement `getTrendingComponents(limit = 10)`. Read from `trending_components` ZSET, construct `Registry_Path` strings, and hydrate via `@repo/db` `getComponentsByRegistryPaths`.
5. Update `searchComponentsByText` in `apps/web/lib/components.ts`:
   - Query Qdrant for `limit * 3` candidates (to give re-ranking enough depth).
   - Fetch `zmscore` for the returned slugs from Redis.
   - Re-rank using formula `(qdrant_score * 0.7) + (normalized_views * 0.3)`.
   - Slice to the original `limit`.
6. Update the storefront UI to call `POST /api/views` implicitly when a component page (`apps/web/app/(catalog)/[category]/[slug]/page.tsx`) mounts (via a small Client Component tracking pixel/hook).
7. Update `apps/web/components/trending-strip.tsx` (or equivalent) to consume `getTrendingComponents()`.

## Acceptance Criteria
- AC-1: Views are tracked in Redis ZSET without overwhelming Qdrant. Rate limited per IP.
- AC-2: Trending components strip reflects the top N viewed components from Redis.
- AC-3: Search results dynamically blend semantic vector similarity with Redis popularity metrics.
- AC-4: No write operations hit Qdrant during normal storefront browsing.

## Phase Completion Rules
Phase 13 is complete when the rate-limited API correctly tracks views in Redis ZSET and the Search API successfully returns mixed Qdrant and Redis data.

## Validate Contract

Status: CONDITIONAL
Date: 01-07-26
date: 2026-07-01
generated-by: outer-pvl

Parallel strategy: sequential
Rationale: Score 5/7 (Multi-package API with >5 files). Data flow is a tightly coupled vertical slice, executed best sequentially.

Test gates (C3 5-column table — ADDITIVE; existing consumers still parse the legacy line form below it):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC-1 | View tracking API increments Redis with Rate Limit | Fully-Automated | `test("should View tracking API increments Redis with Rate Limit")` | A |
| AC-2 | Trending components returns sorted ZSET hydrating Qdrant | Fully-Automated | `test("should Trending components returns sorted ZSET hydrating Qdrant")` | A |
| AC-3 | Search re-ranks candidates by view score | Fully-Automated | `test("should Search re-ranks candidates by view score")` | A |
| AC-1, AC-2 | View tracking fires on mount and Trending strip renders | Agent-Probe | View tracking fires on mount and Trending strip renders | A |

Legacy line form (retained so existing validate-contract consumers still parse):
- API: Fully-automated: `test("should View tracking API increments Redis with Rate Limit")`
- Trending: Fully-automated: `test("should Trending components returns sorted ZSET hydrating Qdrant")`
- Search: Fully-automated: `test("should Search re-ranks candidates by view score")`
- Mount: agent-probe: View tracking fires on mount and Trending strip renders

Dimension findings:
- Infra fit: PASS — Redis client and Qdrant interactions are additive and align with the serverless architecture.
- Test coverage: PASS — 3 Fully-Automated tests scoped; TDD stubs are already present in the plan.
- Breaking changes: PASS — Public contracts maintained (`searchComponentsByText` signature is stable).
- Security surface: CONCERN — Ensure `UPSTASH_REDIS_REST_TOKEN` is strictly server-side only, and IP rate limiting accurately parses forwarded headers (e.g., `x-forwarded-for`).

Open gaps:
- Redis latency spikes affecting search: known-gap: documented as NEW PLAN REQUIRED — see backlog/load-testing-redis

What this coverage does NOT prove:
- `test("should View tracking API increments Redis with Rate Limit")`: Does not prove immunity to distributed botnets with rotating IPs.
- `test("should Trending components returns sorted ZSET hydrating Qdrant")`: Does not prove behavior under extreme high-concurrency race conditions.
- `test("should Search re-ranks candidates by view score")`: Does not prove re-ranking precision when candidates outside top 50 are highly popular.
- Agent-Probe: Does not prove long-term metric accuracy.

Gate: CONDITIONAL
Accepted by: user — ensure UPSTASH_REDIS_REST_TOKEN is server-side only and IP rate-limiter accurately parses forwarded headers.

## Autonomous Goal Block

SESSION GOAL: Execute Phase 13 - Search ranking, trending, and analytics tracking using Redis and Qdrant.
Charter: Follow decoupled architecture, strictly adhering to server-side token usage and rate-limiting rules.
Autonomy rules: Do not modify Qdrant schema; do not overwhelm Qdrant with view increments.
Hard stops: Stop if Redis connection fails or if IP parsing logic is ambiguous.
Next phase: Phase 14
Contract summary: 3 automated tests, 1 agent probe, 1 accepted security concern.
Execute start command: ENTER EXECUTE MODE

## Dependencies, Risks, Integration Notes
- **Context**: Must align with `process/context/all-context.md` and `process/context/tests/all-tests.md`.
- **Risk**: Local maximum in search. Re-ranking only happens on the candidate set retrieved by Qdrant. A highly popular item that falls outside the top 50 semantic matches won't be boosted. We accept this constraint.
- **Dependency**: Requires Upstash Redis or local Redis instance during development.
- **Security**: Rate limit is strictly required for the view endpoint to prevent botting.

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| View tracking API increments Redis with Rate Limit | Fully-Automated | AC-1, AC-4 |
| Trending components returns sorted ZSET hydrating Qdrant | Fully-Automated | AC-2 |
| Search re-ranks candidates by view score | Fully-Automated | AC-3 |
| View tracking fires on mount and Trending strip renders | Agent-Probe | AC-1, AC-2 |

Failing stub:
```ts
test("should View tracking API increments Redis with Rate Limit", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: View tracking API increments Redis with Rate Limit")
})
```

Failing stub:
```ts
test("should Trending components returns sorted ZSET hydrating Qdrant", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: Trending components returns sorted ZSET hydrating Qdrant")
})
```

Failing stub:
```ts
test("should Search re-ranks candidates by view score", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: Search re-ranks candidates by view score")
})
```

## Gap Resolution Options
| Gap | Resolution options |
|---|---|
| High concurrency ZINCRBY race conditions | C) Accept as known-gap — Redis handles ZINCRBY atomically. Extreme loads are not a risk for the current expected traffic volume. |
| Bot protection beyond IP rate limit | C) Accept as known-gap — IP rate limiting is sufficient for MVP view tracking. |

## Missing Test Areas
| Area | Why untestable in this plan | Resolution chosen |
|---|---|---|
| Redis latency spikes affecting search | Requires production-level traffic simulation | Backlog: load-testing-redis |

## Test Infra Improvement Notes
(none identified yet)

## Resume and Execution Handoff
Phase 13 plan is complete. VALIDATE should ensure the tests are green and the Redis implementation meets the decoupling requirements. Once EXECUTE runs and EVL passes, Phase 13 is fully integrated.
Say 'ENTER EXECUTE MODE' when ready after VALIDATE.
