---
phase: execute
date: 2026-10-18
status: COMPLETE_WITH_GAPS
feature: higherbits-ai
plan: /Users/clarencelloydgayo/Gayo Sphere/HigherBits.dev/process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/higherbits-mcp-parity_PLAN_17-10-26.md
---

## What Was Done

- Implemented in the isolated checkout at `ebd6f6a6e7f8c6879e6b9aacc76be74cf8f7fe00`; the primary checkout, selected primary plan, umbrella, and context files were not edited.
- The worktree’s pre-existing untracked task-folder plan and feasibility artifacts were left untouched; implementation followed only the selected primary V6 plan path above.
- Extracted shared MCP server/tool logic into `packages/ai/src/server.ts`, added stateless request-scoped HTTP handling in `packages/ai/src/http.ts`, retained the CLI entry and existing handler exports, and added the package HTTP export/build entry.
- Remediated the reviewer’s High retry finding in `packages/ai/src/server.ts`: the default dispatcher constructs a valid `Request` before fetch and tags fetch-boundary `TypeError`s as `HigherBitsNetworkError`; `handleSource` retries only that tagged failure. Injected in-process dispatcher errors, including ordinary `TypeError`, propagate without retry.
- Added focused AC4 assertions: a fetch-boundary failure retries once with the identical `requestId` and request body; an injected in-process `TypeError` causes exactly one dispatcher invocation.
- Added `/api/higherbits-mcp` as a Bearer-only adapter. It validates via the existing identity handler, dispatches only to fixed first-party search/source handlers, and passes only Authorization to synthetic downstream requests.
- Added SDK HTTP/package tests, mocked route-adapter tests, and the actual-route Playwright spec. The approved adjustment adds `higherbits-mcp-http.spec.ts` to the Playwright admin matcher.
- Added the plan-named AC6 test-building backlog note at `process/features/higherbits-ai/backlog/higherbits-mcp-ac6-test-building_NOTE_18-10-26.md`.
- Added `harness/ac6-admission-behavior.sql` and verified the authoritative migration/RPC behavior in a disposable local Supabase/Postgres database. The separate local concurrency probe admitted exactly two of ten simultaneous requests and charged exactly twice; no deployed or production behavior was probed.
- Created/updated the task-folder high-risk evidence artifacts under `process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/harness/`. The initial REJECT remains preserved as review history; the independent follow-up APPROVES the retry remediation with no blocking or material security findings.
- Exact implementation/report/evidence files changed:
  - `apps/web/package.json`
  - `apps/web/playwright.config.ts`
  - `apps/web/app/api/higherbits-mcp/route.ts`
  - `apps/web/app/api/higherbits-mcp/__tests__/streamable-http.test.ts`
  - `apps/web/e2e/higherbits-mcp-http.spec.ts`
  - `packages/ai/package.json`
  - `packages/ai/src/http.ts`
  - `packages/ai/src/server.ts`
  - `packages/ai/src/index.ts`
  - `packages/ai/tsup.config.ts`
  - `packages/ai/__tests__/index.test.ts`
  - `pnpm-lock.yaml`
  - `process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/harness/ac6-admission-behavior.sql`
  - `process/features/higherbits-ai/backlog/higherbits-mcp-ac6-test-building_NOTE_18-10-26.md`
  - `process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/higherbits-mcp-parity_REPORT_18-10-26.md`
  - `process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/harness/risk-gate.json`
  - `process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/harness/context-snippets.json`
  - `process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/harness/verification.json`
  - `process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/harness/review-decision.json`
  - `process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/harness/adversarial-validation.json`

## What Was Skipped or Deferred

- Actual-route Playwright/AC8 was not run: no authorized local deterministic fixture, test Clerk key/API keys, loopback Supabase URL, or admin storage state was available. No server or browser test was started; no auth bypass or production database was used.
- AC6 local RPC/grant semantics are now verified against the exact tracked migration in a disposable local Supabase database. Deployed grants/quota behavior and end-to-end MCP-to-database semantics remain unverified and out of scope.
- AC7 is not triggered because no setup/account UI changed.
- The full web suite is not green; unrelated environment/baseline failures remain untouched.
- The initial independent REJECT is retained as history, and an independent follow-up APPROVES only the retry remediation. This does not approve overall parity or clear the outstanding route E2E and AC6 conditions.
- No live providers, production DB/auth, secret changes, deployment, commit, or npm publication occurred.

## Continuation Update — 2026-10-19

- Re-ran `corepack pnpm --filter web exec vitest run app/api/higherbits-mcp/__tests__/streamable-http.test.ts`: 2/2 route-adapter tests passed.
- Re-ran the MCP package build and full test suite in the isolated candidate: package build succeeded and all 10 tests passed.
- Re-ran the full web Vitest suite: 12 of 163 files failed (35 tests failed, 1,536 passed). Visible unrelated failures include missing Supabase URL configuration, sandbox endpoint `503` responses, font/sidebar assertions, and a publish error-message mismatch; unrelated areas were not changed.
- Re-ran the focused MCP route, identity-boundary, and legacy endpoint regression files after the full suite: all 3 files passed, 16/16 tests.
- Probed the built SDK handler with local Request/Response objects: GET returned `200 text/event-stream`, canceling the response body resolved, and DELETE returned `200`. This is SDK transport evidence only, not Next route/auth evidence.
- Updated the actual-route Playwright spec so it starts a pending SSE body read, aborts the fetch, and expects the read to reject with `AbortError`. The prior order canceled the body before aborting, making the abort signal ineffective. The updated spec type-checks. A disposable `127.0.0.1` Node SSE probe confirmed the pending read rejects with `AbortError` and the generic server observes response `close`; this validates the abort mechanism only, not the Next route.
- Rechecked the actual-route prerequisites: all seven E2E variables are absent and `apps/web/e2e/.auth/studio.json` is absent. Playwright test discovery registered zero tests because the config creates the admin project only when `HIGHERBITS_E2E_ADMIN_STATE` is set. No Next app server or browser was started; the only runtime probe used and stopped a disposable `127.0.0.1` Node server. No Chrome window was opened.
- Inspected the pinned SDK 1.29.0 web-standard transport: its standalone GET stream's `ReadableStream.cancel` removes the stream mapping. This is dependency-source evidence only; neither it nor the client-side abort assertion proves server-side termination through the Next route. `G-NEXT-STREAM-SSE` remains CONDITIONAL until an authorized local fixture and a harness that observes server-side termination are available.
- `graphify update .` completed after the E2E test edit: 21,657 nodes, 35,187 edges, 1,336 communities. It skipped 38 SQL files because `tree_sitter_sql` is absent and did not refresh community labels.
- Corrected stale verification entries: the independent follow-up approval is now recorded, and the route E2E, current cancellation evidence, and admin-project discovery blocker are stated accurately. No implementation beyond the focused test correction was changed.

## Test Gate Outcomes

- PASS — package build/export: `corepack pnpm --filter @higherbits-dev/cli build`; emitted `dist/http.js`, `dist/http.d.ts`, CLI output, and declarations. Re-run on 2026-10-19.
- PASS — exact Fully-Automated gates `G-AC1-SDK-HTTP`, `G-AC2-SEARCH`, `G-AC3-SOURCE`, `G-AC4-ERROR-RETRY`, and `G-AC5-CAPABILITY-LIST`, each run individually per the selected plan’s validate-contract matrix.
- PASS — post-fix focused gate `corepack pnpm --filter @higherbits-dev/cli exec vitest run __tests__/index.test.ts -t "G-AC4-ERROR-RETRY"`; the test proves one same-UUID/body retry for default fetch failure and no retry for injected in-process `TypeError`.
- PASS — post-fix `corepack pnpm --filter @higherbits-dev/cli test` (10/10 tests); re-run on 2026-10-19.
- PASS — post-fix `corepack pnpm --filter @higherbits-dev/cli build`; ESM and declaration outputs emitted.
- PASS — post-fix `git diff --check`.
- Expected red confirmed — before the implementation fix, the new in-process-TypeError assertion failed because the dispatcher was called twice.
- PASS — `corepack pnpm --filter web exec vitest run app/api/higherbits-mcp/__tests__/streamable-http.test.ts -t "G-ROUTE-ADAPTER"` (2/2 tests).
- PASS — 2026-10-19 rerun of `corepack pnpm --filter web exec vitest run app/api/higherbits-mcp/__tests__/streamable-http.test.ts` (2/2 tests).
- PASS — 2026-10-19 targeted TypeScript check of `apps/web/e2e/higherbits-mcp-http.spec.ts`; syntax/types only, not a runtime test.
- PASS — rerun identity boundary and legacy API tests: `lib/__tests__/copy-identity.test.ts` (6/6) and `app/api/higherbits-mcp/__tests__/route.test.ts` (8/8). The former unit test confirms API-key/session mismatch rejection; neither substitutes for actual Clerk middleware E2E.
- PASS — HTTP subpath import without `API_KEY`; `git diff --check`; both intentional pre-implementation red stubs failed as expected before implementation.
- FAIL — `corepack pnpm --filter web test`, rerun 2026-10-19: 12 of 163 files failed; 35 tests failed and 1536 passed. Visible unrelated failures include missing Supabase URL configuration, sandbox endpoint `503` responses, font/sidebar assertions, and a publish error-message mismatch. MCP route adapter tests pass separately; unrelated failures were not changed.
- SKIP — actual-route Playwright run: local-only prerequisites were absent, so the command was not started. The `--list` probe found zero tests because `HIGHERBITS_E2E_ADMIN_STATE` was missing and no admin project was configured. The revised test checks client-side abort only; server-side termination remains unproven.
- PASS — AC6 local authoritative migration/RPC verification: migration verifier and RLS/grant assertions passed; transaction-scoped behavior assertions passed for idempotent replay, replay limit, response conflict, two-per-UTC-day denial/reset, pro exemption, and 8-active-grant rate limit with `retryAfter: 60`.
- PASS — AC6 local concurrency probe: 10 independent psql sessions against the disposable local Supabase database yielded 2 admitted, 8 `copy_limit_reached`, and exactly 2 daily charges. Synthetic rows were cleaned from the test database.
- REVIEW HISTORY — initial independent REJECT found that broad TypeError retries could repeat in-process source admission while AC6 idempotency was unproven. That decision and finding remain preserved.
- FOLLOW-UP APPROVE — independent review approves the retry remediation only, with no new blocking or material security findings; evidence covers fetch-boundary classification and both retry regression cases. This is not approval of overall parity.
- PASS — final high-risk evidence validator reports no structural warnings/failures for the updated evidence pack; final `git diff --check` passes after the evidence/report updates.
- PASS — post-fix `graphify update .`: 21,655 nodes, 35,185 edges, 1,321 communities. Graphify did not parse 37 SQL files because `tree_sitter_sql` is not installed and noted community labels were not refreshed.
- PASS — 2026-10-19 `graphify update .` after the Playwright spec edit: 21,657 nodes, 35,187 edges, 1,336 communities. Graphify skipped 38 SQL files because `tree_sitter_sql` is not installed and community labels were not refreshed.

## Plan Deviations

- Previously approved plan adjustment: create `apps/web/e2e/higherbits-mcp-http.spec.ts` and include it in the Playwright admin matcher in `apps/web/playwright.config.ts`; both paths remain in the rollback/report scope.
- User-authorized reviewer remediation: restrict retries to `HigherBitsNetworkError` produced at the default fetch boundary and add the two requested tests. This is within the existing AC4 retry contract and does not change public API behavior.
- No other implementation deviations identified. Retry remediation has independent follow-up approval; actual Next runtime proof remains outstanding, so overall parity stays in active/testing and is not approved for completion or archive.

## Test Infra Gaps Found

- Actual route E2E needs a deterministic local Clerk/API-key/Supabase fixture and `HIGHERBITS_E2E_ADMIN_STATE`; the test is gated on explicit local fixture inputs.
- The complete web suite currently depends on generated Prisma/Supabase/CodeSandbox test configuration that is unavailable or failing in this checkout.
- `packages/ai` testing is not routed in the shared test-context router. The selected plan also notes missing `docs/01-architecture-and-stack.md`. `CONTEXT_PARTIAL: packages/ai test context`; `CONTEXT_PARTIAL: docs/01-architecture-and-stack.md`.
- Graphify’s SQL parser dependency is absent, so the latest update skipped 38 SQL files; community names were not relabeled. The code graph itself updated successfully.

## Closeout Packet

- Selected plan: `/Users/clarencelloydgayo/Gayo Sphere/HigherBits.dev/process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/higherbits-mcp-parity_PLAN_17-10-26.md` (V6; not edited).
- Finished: package facade, fixed-handler route adapter, matcher/spec change, mocked adapter coverage, AC6 backlog note, and reviewer-directed retry fix.
- Verified: post-fix AC4, all 10 package tests, package build, and diff check; earlier package AC1–AC5 and mocked route gates remain green.
- Unverified/blocked: actual Next Clerk/cookie/SSE/cancellation E2E, observable server-side SSE termination, deployed database behavior, and full web-suite green. AC6's local migration/RPC contract now passes. The retry remediation is independently approved; the initial REJECT remains in review history. Keep the selected plan active/testing.
- Follow-up plan stubs created: `process/features/higherbits-ai/backlog/higherbits-mcp-ac6-test-building_NOTE_18-10-26.md`. No other plan stubs were created.
- Best next valid state: **Keep in active/testing** because actual-route E2E is unavailable and the prior full web-suite failures remain. AC6 local migration/RPC semantics pass, but deployed behavior is unverified. The retry remediation’s follow-up approval does not establish overall parity; do not complete or archive the plan.

## Forward Preview

### Test Infra Found

- Provision only a loopback test fixture with test Clerk/API-key identities, local Supabase, and admin storage state before running the actual-route spec. Resolve the web suite’s unrelated environment failures separately.

### Blast Radius Changes

- Source/test changes are limited to the `packages/ai` facade, one `apps/web` route and its tests, the approved Playwright matcher/spec, the workspace dependency/lock entry, the task evidence, and the named AC6 backlog note. No existing search/source/identity/admission implementation was modified.

### Commands to Stay Green

- `corepack pnpm --filter @higherbits-dev/cli build`
- `corepack pnpm --filter @higherbits-dev/cli test`
- `corepack pnpm --filter @higherbits-dev/cli exec vitest run __tests__/index.test.ts -t "G-AC1-SDK-HTTP"` (repeat for AC2–AC5 names above)
- `corepack pnpm --filter web exec vitest run app/api/higherbits-mcp/__tests__/streamable-http.test.ts -t "G-ROUTE-ADAPTER"`
- Run the actual-route Playwright command only after its safe local fixture/server prerequisites exist.

### Dependency Changes

- `apps/web` now depends on workspace package `@higherbits-dev/cli`; the lockfile adds only the app importer entry. SDK remains pinned at 1.29.0.

## Executor Self-Review

- Confirmed Bearer validation precedes identity lookup/transport; the existing `copyIdentity` and source `admitCopy` remain the source of truth.
- Confirmed internal destinations are fixed and synthetic downstream requests contain only Authorization and Content-Type; tests reject alternate identities before dispatch and assert denied source is absent.
- Confirmed package tool argument schemas/handlers validate exact keys, safe integers, and UUIDs; transient retry reuses the same request UUID and source denial is not retried.
- Confirmed only fetch-boundary TypeErrors become `HigherBitsNetworkError`; the in-process injected-dispatcher TypeError regression asserts one call and passes.
- Confirmed the approved Playwright spec is routed through the admin matcher and remains gated on test-only local inputs.
- STRIDE summary: spoofing/elevation are partially tested at the mocked boundary; tampering/SSRF is mitigated by validation and fixed destinations; information disclosure checks cover metadata-only search and source-denial sentinel; retry/idempotency UUID reuse and dispatcher TypeError non-retry are package-tested. The independent follow-up approves the retry remediation with no blocking/material security findings. Actual Clerk runtime identity, SSE/cancellation, and authoritative DB admission remain unproven, so overall parity remains open.

## Follow-up — In-Process Route Protocol Integration (19-10-26)

- Plan provenance check: the primary plan named by the active goal records `VALIDATE gate accepted CONDITIONAL on 18-10-26`; the candidate worktree copy has a different checksum and stale “Pending VALIDATE / implementation unauthorized” text. The primary remains untouched. Treat the explicitly named primary plan plus the later user `go` as execution authority; do not let the stale copy override it.
- Added `apps/web/app/api/higherbits-mcp/__tests__/streamable-http.integration.test.ts`: sends MCP initialize, tools/list, and both tools/call JSON-RPC requests through the actual POST route export and built SDK HTTP server; also exercises actual GET SSE open/cancel and DELETE exports. Identity and downstream data handlers use deterministic mocks; the test adds no dependency.
- PASS — focused MCP route, adapter, and protocol integration run: 3 files, 12/12 tests. The new integration file passed both tests. `@higherbits-dev/cli` package build passed before the run.
- This closes an in-process composition gap and verifies response-stream cancellation in the direct route harness; it does not exercise a Next server, Clerk middleware/session cookies, real database/search handlers, or server-side stream termination after a network disconnect.
- `corepack pnpm --filter web typecheck` remains FAIL at the repository level with pre-existing errors in admin, bundles, Studio, Prisma client generation, and missing image declarations; the latest run reports no diagnostics in the MCP route or MCP test files. An initial run identified strict errors in the new route and adapter test; those were fixed, then rechecked.
- File-scoped ESLint could not start because `@next/eslint-plugin-next` is missing from the isolated dependency environment. No dependency was added for this check.
- Actual-route Playwright remains conditional because the authorized loopback test fixture, test Clerk/API keys, and admin storage state are absent. Do not count this integration test as a replacement for that runtime gate or claim overall parity complete.
- Graphify rebuilt after the MCP type-safety edit: 21,665 nodes, 35,201 edges, 1,309 communities. It skipped 38 SQL files because `tree_sitter_sql` is unavailable; community labels were not refreshed.

## Goal Continuation — Local E2E Prerequisite Check (22-10-26)

- Read-only verification: the isolated worktree remains at detached `ebd6f6a6e7f8c6879e6b9aacc76be74cf8f7fe00`, with the existing MCP changes still dirty. No implementation or test command ran in this checkpoint; prior 13/13 focused route and 10/10 package results are historical evidence.
- The current process has no `HIGHERBITS_MCP_E2E_LOCAL_FIXTURE`, either MCP E2E API key, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `HIGHERBITS_E2E_ADMIN_STATE`, `E2E_CLERK_EMAIL`, `E2E_CLERK_PASSWORD`, or `CLERK_SECRET_KEY`. The worktree has only example env files, and `apps/web/e2e/.auth/studio.json` does not exist. This reports presence only; no secret values were read or displayed.
- The checked-in studio setup signs in a pre-existing Clerk test account or reuses a saved session. It cannot create an account from this checkout. The MCP Playwright spec also requires a format-valid test publishable key, two local test API keys bound to matching/mismatching users, a loopback Supabase service-role fixture, an absolute admin storage-state file, and a loopback Next base URL. Playwright registers the `admin` project only when the state file is configured.
- The current MCP Playwright spec asserts that the client-side pending SSE read rejects on abort. It does not observe server-side termination inside the actual Next runtime. The synthetic loopback bridge test observes socket close and route-export reader cancellation, but it is not a substitute for the Next/Clerk gate.
- **AC8 / G-NEXT-STREAM-SSE: BLOCKED, not attempted in this checkpoint.** Smallest safe setup: point the worktree to an existing isolated Clerk test project/account, a usable admin Playwright storage state, and two pre-provisioned test API-key identities in a disposable loopback Supabase fixture; configure the named test-only environment variables; then add an observable server-side close/cancellation assertion and run the actual Next route spec. Do not use a production account, provider, database, or copied personal browser session.
- AC6 remains the accepted CONDITIONAL gap. Earlier disposable local RPC/grant tests remain historical local evidence; no deployed behavior was verified here. Overall MCP parity remains active/testing and is not ready for closeout or deployment.

## AC8 Isolated Setup Preparation (22-10-26)

- Added `higherbits-mcp-ac8-isolated-setup_REF_22-10-26.md` with a nonsecret inventory, minimum dedicated fixture, isolation checks, test order, and one consolidated setup decision. No credential, account, database record, browser state, service, or production resource was created or changed.
- Repository `supabase/config.toml` uses project ID `21st` and standard local ports; the historical AC6 disposable fixture was not configured for AC8. Neither is assumed isolated or compatible for this gate. The payments test database was not inspected or modified and is excluded from reuse pending separate isolation, compatibility, and approval checks.
- `supabase --version` failed because its telemetry attempted a write outside the sandbox; `docker ps` was denied by the OrbStack socket. Both were read-only-intended probes, neither established a running test service, and neither was retried or escalated. Running container state remains unknown.
- The actual-route Playwright spec still proves only client-side abort. Actual Next/Clerk behavior and server-side SSE termination remain unverified. No test/build was rerun in this preparation checkpoint; prior 13/13 route and 10/10 package passes are historical.

## AC8 Isolated Fixture Progress (22-10-26)

- After the user's explicit isolated-setup approval, created `/tmp/hb-mcp-ac8-20261022` with project ID `hb-mcp-ac8-isolated-20261022` and dedicated API/DB ports 54521/54522. The local Supabase stack started successfully. A read-only query against its named DB container confirmed the minimal `users` and `api_keys` tables exist with 0 rows each. Generated credentials remain in the private local CLI output, not the repository or report.
- Narrow escalated tooling checks were accepted after the new approval: Supabase CLI 2.118.0, Docker 29.8.2, and container names/ports for only the new project. Earlier sandbox denials remain part of the history; no payments or production instance was touched.
- Clerk dashboard read-only inventory showed the only existing application is Cozy Downloads, whose development instance contains real users. Prepared an email-only `HigherBits MCP AC8 Isolated Test` app creation form, but did **not** submit it. Action-time user confirmation for creating the development app and its credentials is pending.
- No test identity, test API key, admin storage state, Next server, or E2E run has been created or started. AC8 remains CONDITIONAL; the synthetic and historical test evidence has not changed.
- User clarified that Cozy Downloads is the HigherBits Clerk application and that the named Supabase project also serves HigherBits. The existing Clerk development instance still contains real users, and its webhook endpoint panel did not load; creating a new test user there is paused until side effects can be verified. Separate Clerk app creation remains unsubmitted while the user chooses the isolation path.
- Automatic approval review rejected a proposed bounded Antigravity read-only review of four private MCP code/test files, stating the latest user approval covered local fixture setup rather than disclosure to an external service. The process did not execute; its two private output files were verified 0 bytes. No code was sent, no file edit occurred, and the denied operation was not retried or routed around.
- Following a specific user choice, created a separate email-only Clerk development app named `HigherBits MCP AC8 Isolated Test` (`app_3L2vg3RGSjblKvIWgbAdfFbqV9B`, instance `ins_3L2vg5sEiWzFXsjIjbh6ku4JGd1`). The dashboard verified the new app and an empty Users list. Test publishable and secret keys were copied locally into private 0600 files under `/tmp/hb-mcp-ac8-20261022`; key values were neither printed nor committed. The combined `next.env` points only to the new Clerk development app and dedicated loopback Supabase fixture.
- The new test-user form requires a password. Under the browser credential handoff policy, the user must enter and submit that credential personally; the form was left open and a handoff request sent. No Clerk test user, local API-key row, or Playwright storage state exists yet.
