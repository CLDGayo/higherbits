# Release upstream baseline verification — 13-10-26

Zero new failures against upstream `369d4ca440b1c21007ee5d30058cb154e6a61eb8`. All 23 release failures reproduce upstream by relative test path, full test name, and first-line error signature.

| Run | Native test files | Passed files | Failed files | Total tests | Passed | Failed | Skipped | Time |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Upstream archive | 152 | 146 | 6 | 1245 | 1221 | 24 | 0 | 16.05s |
| Release controlled rerun | 159 | 154 | 5 | 1573 | 1550 | 23 | 0 | 17.26s |
| Previously supplied release JSON | 159 | 154 | 5 | 1573 | 1550 | 23 | 0 | 15.03s |

Native files are `testResults.length`; Vitest's nested `numTotalTestSuites` is not the test-file count. Both final commands exited 1. The supplied release failure set matches the controlled rerun exactly.

## Method

- Mandatory Graphify query executed in original repository before source inspection.
- Upstream extracted with `git archive 369d4ca440b1c21007ee5d30058cb154e6a61eb8` into `/private/tmp/higherbits-upstream-baseline-369d4ca4-sAbei8`.
- Dependency entries linked from release node_modules. Workspace package links point to extracted baseline packages, not release source. Generated Prisma client linked separately.
- Safe `vitest.first-party-identifiers.config.ts` added using apply_patch; byte-identical to release. Base config and shared test setup unchanged from upstream. `envDir: false`; dotenv-loading setup excluded.
- Both final full-unit runs used exactly the same cleared environment with synthetic credentials; no real provider keys. Existing shared fetch mock retained.
- Product source and lockfiles not changed. No staging, commits, deployment, type fixes, build, provider checks, or broad program rerun.

Final command, run once from each tree; output names differ:
```sh
env -i PATH="$PATH" HOME="$HOME" TMPDIR=/private/tmp NODE_ENV=test \
  NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
  NEXT_PUBLIC_SUPABASE_KEY=synthetic-test-key \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=synthetic-test-key \
  SUPABASE_SERVICE_ROLE_KEY=synthetic-test-key \
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuZXhhbXBsZS5jb20k \
  corepack pnpm --filter web exec vitest run \
  --config vitest.first-party-identifiers.config.ts \
  --reporter=json --outputFile=[per-run JSON below]
```

The initial exploratory pair omitted NEXT_PUBLIC_SUPABASE_KEY and produced extra header failures. Those exploratory results are superseded by the matched final pair above; no test/product source was modified to obtain the final counts. Original saved run's exact environment values were unavailable, so both trees were rerun with explicitly identical values.

## Unchanged release failures

All five failing test files are byte-identical to upstream; SHA-256 evidence and every failing test name/error are in `harness/verification.json`. Inspected direct application imports are also byte-identical.

| Test path under apps/web | Failures | Error signature / likely follow-up |
|---|---:|---|
| lib/__tests__/copy-route-contracts.test.ts:610 | 1 | GHL too-many-entries: expected 400, got 503; inspect copy capability/availability guard and fixture configuration |
| lib/__tests__/ghl-generator-title.test.ts:70 | 1 | malformed-script error does not match /JavaScript\|unclosed/i; align generator diagnostic expectation |
| app/api/sandbox/connect/__tests__/route.test.ts:196 | 6 | expected success/SDK error statuses, got 503; inspect codesandbox-sdk availability guard and fixture |
| app/api/sandbox/new/__tests__/route.test.ts:188 | 13 | expected success/SDK/rate-limit behavior, got 503 or zero calls; inspect availability guard before mocked SDK |
| components/features/studio/publish/__tests__/publish-submission-gating.test.ts:156 | 2 | expected GoHighLevel output could not be saved; actual Copy outputs could not be saved; align expectation with upstream behavior |

No new rebrand failure observed. Upstream additionally fails `app/api/magic/__tests__/route.test.ts:70`, valid-key check (expected 200, got 401). That legacy test path is removed/replaced in release, so the one-failure reduction is not proof that this legacy test was repaired. Test inventories differ by 7 files / 328 cases; this is a failure-delta comparison, not an identical-inventory claim.

## Artifacts and limits

- Final upstream: `/private/tmp/higherbits-upstream-baseline-matched-unit.json`, corresponding `.log`.
- Final release: `/private/tmp/higherbits-release-matched-unit.json`, corresponding `.log`.
- Supplied release: `/private/tmp/higherbits-rebrand-release-unit.json`.
- Exact comparison: `harness/verification.json`.
- Coverage line/branch/function: not measured. Performance: wall duration only; no benchmark/memory claim.
- Build, types, lint, live providers: outside this sidecar; no status asserted.
- No full risk-gate/finalize approval assessed. Unit suite remains red on inherited failures.
- Unresolved: release owner must decide disposition of inherited failures before claiming full-unit green.

**Status:** DONE_WITH_CONCERNS
**Summary:** All 23 release failures reproduced upstream; zero new failures in the matched full-unit run.
**Concerns/Blockers:** Full-unit commands exit 1; inherited failures remain.
