---
phase: phase-18-r2-migration
date: 2026-07-04
status: COMPLETE
feature: monetization-catalog
plan: process/features/monetization-catalog/active/phase-18-r2-migration_04-07-26/phase-18-r2-migration_PLAN_04-07-26.md
---

### What Was Done
- Installed `@aws-sdk/client-s3` as a root `devDependency`.
- Created `ops/r2-client.mjs` wrapper with lazy-init.
- Created `apps/web/lib/video-url.ts` and refactored `preview-tabs.tsx` to safely prefix demo videos with `NEXT_PUBLIC_CDN_URL`.
- Wired `ops/github-ingest.mjs` to trigger a fire-and-forget upload of the parsed `cozySource` to R2.
- Wired `apps/web/lib/registry.ts` to hydrate missing registry files from R2 `fetch()` before falling back to local `fs.readFile`.
- Extended `ops/copy-demo-video.mjs` with `--r2` flag.
- Added comprehensive test coverage and bundle-safety gates to ensure the S3 client doesn't leak into the web bundle.

### What Was Skipped/Deferred
- Live R2 E2E test (C21): Hybrid/Manual, blocked-on-provisioning.
- C15: Real MP4 recordings (deferred to backlog).
- C16: copy-demo-video.mjs non-R2 path untested (low priority).

### Test Gate Outcomes
- `node --test ops/__tests__/*.test.mjs` — GREEN
- `corepack pnpm --filter web test` — GREEN
- `node --test scripts/__tests__/validate-registry.test.mjs` — GREEN
- `corepack pnpm --filter @repo/ui type-check` — GREEN
- `corepack pnpm --filter web build` — GREEN
- `node scripts/validate-registry.mjs` — GREEN
- `bundle-safety grep` — GREEN
- `git diff --check` — GREEN

### Plan Deviations
- `r2-fetch.ts` was not created. Instead, `fetchRegistryFromR2` was implemented directly inside `apps/web/lib/registry.ts`.
- Mocking for `React.cache` was avoided by bypassing it in tests or configuring Vitest differently; `apps/web/__tests__/registry.test.ts` was modified directly instead of creating a new test file `registry-r2.test.ts`.

### Test Infra Gaps Found
- `React.cache` and `unstable_cache` testibility in Vitest remains slightly clunky but was resolved inline in `registry.test.ts`.

### SPEC Achievement
(Not applicable / no separate SPEC file)

### Closeout Packet
1. Selected plan path: `process/features/monetization-catalog/active/phase-18-r2-migration_04-07-26/phase-18-r2-migration_PLAN_04-07-26.md`
2. Closeout classification: Ready for UPDATE PROCESS archival
3. What was finished: R2 migration for registry and videos.
4. Verified: Automated test suite green. | Unverified: Live R2 bucket E2E test.
4b. Validate-contract: present (inline in plan, PASS)
5. Cleanup done: Plan execution complete. | Still needed: None.
6. Next valid state: Process complete, plan archivable.
7. Commit checkpoint: Process commit belongs after UPDATE PROCESS (execution commit `07b7647` already made).
8. Regression status: Web build passes, all component tests and registry tests pass.

### Forward Preview

#### Test Infra Found
- Node `--test` S3 mocking established in `r2-client.test.mjs`.

#### Blast Radius Changes
- Unchanged from plan.

#### Commands to Stay Green
- `corepack pnpm --filter web test`
- `node --test ops/__tests__/*.test.mjs`

#### Dependency Changes
- `@aws-sdk/client-s3` added as devDependency.
