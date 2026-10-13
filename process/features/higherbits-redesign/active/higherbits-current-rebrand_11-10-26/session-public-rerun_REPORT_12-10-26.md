# Public rerun — 12-10-26

TL;DR: FAIL, exit 1: six cases, two passed, four failed, zero skipped/flaky. Previous five-fail/one-pass evidence preserved unchanged. No source, auth or guard edits.

## Exact invocation

```sh
export PLAYWRIGHT_PORT=3101
export PLAYWRIGHT_BASE_URL=http://localhost:3101
export HIGHERBITS_E2E_STAGE=post
export HIGHERBITS_E2E_ADMIN_STATE=/Users/clarencelloydgayo/.higherbits-admin-state.json
export HIGHERBITS_E2E_RUN_ID=session-public-rerun-f22fd266-7be5-4c5e-9456-e1f0fb4e87e7
export HIGHERBITS_E2E_COMMAND_ID=public-9489ec4d-533c-43ef-abdd-a6a54409f894
corepack pnpm --filter web exec playwright test e2e/higherbits-mcp-signed-out.spec.ts e2e/higherbits-mcp-legacy-redirect.spec.ts --project=public --global-timeout 300000
```

Existing config/global setup unchanged. Public project uses empty cookies/origins, not the admin state. Global setup warmed all 18 routes in 228916ms. Total reporter duration 251472.826ms; no top-level reporter errors. Assertions ran; outcome is FAIL, not INCONCLUSIVE.

## Results and failure evidence

| Case | Raw result | Detail |
|---|---|---|
| Original three legacy redirect mappings | PASS | 42ms; relative Location parsing now works |
| /magic expanded query | FAIL | 11ms; exact search-string assertion at higherbits-mcp-legacy-redirect.spec.ts:43 |
| /magic/console expanded query | FAIL | 24ms; same assertion |
| /magic/get-started expanded query | FAIL | 28ms; same assertion |
| Signed-out /higherbits-mcp | FAIL | 10940ms; final URL guard at higherbits-mcp-signed-out.spec.ts:8 |
| Signed-out /magic-chat | PASS | 6547ms |

All three expanded-query cases reached exact search comparison after status 308, nonempty Location and expected destination-path checks passed. Expected label=caf%C3%A9%20%26%20tea; received label=caf%C3%A9+%26+tea. Other printed query portions match. Decoded-entry assertions occur later and did not run. Preserve strict failure; no weakening or fix attempted.

Signed-out MCP expected http://localhost:3101/ but remained http://localhost:3101/higherbits-mcp after the 5000ms assertion window. Sanitized failure snapshot: main containing Cookie consent region (analytics disclosure, Privacy policy link, Accept/Reject), Notifications region, alert, and Open Next.js Dev Tools button. No protected product body appeared in captured context. This establishes a redirect failure, not protected-body exposure or a proven root cause. No account menu or screenshot captured.

## Local readiness after failure

Exact bounded local checks (bodies discarded; no cookies or credentials supplied):

```sh
curl --silent --output /dev/null --max-time 15 --write-out 'root status=%{http_code} seconds=%{time_total} final=%{url_effective}\n' http://localhost:3101/
curl --silent --location --output /dev/null --max-time 15 --write-out 'mcp status=%{http_code} seconds=%{time_total} final=%{url_effective}\n' http://localhost:3101/higherbits-mcp
lsof -a -p 55782 -d cwd -Fn
```

Root returned 200 in 2.958205s, final http://localhost:3101/. MCP returned 200 in 0.020923s, final http://localhost:3101/higherbits-mcp. PID 55782 cwd confirmed current checkout apps/web. HTTP responsiveness does not prove successful client hydration or auth redirect completion. Server stderr was not independently captured; earlier parent-reported webpack transients are not independently confirmed by this run.

## Evidence paths

All paths below relative to task folder process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/.

New evidence root:

```text
evidence/phase-01/session-public-rerun-f22fd266-7be5-4c5e-9456-e1f0fb4e87e7/post/public-9489ec4d-533c-43ef-abdd-a6a54409f894/
```

Contains results.json copied byte-for-byte immediately after invocation from apps/web/test-results/results.json, command.log, exit-code.txt, readiness.log, and public test failure contexts. Sanitized MCP context is summarized above; original context at public/higherbits-mcp-signed-out--502b6-igherbits-mcp-redirects-to--public/error-context.md. Raw reporter/log preserve full assertion messages and stacks.

Prior raw public FAIL (five failed, one passed) remains at evidence/phase-01/session-baseline-359bbec6-0872-4f05-9545-62fc908049ce/baseline/public-31d2f8e6-2b85-420c-8484-6007d83d55a1/. Original admin baseline remains untouched: 14 passed, eight PNGs, four zero-violation Axe attachments.

No admin rerun, full accessibility suite, build/type/unit suite, source edits, state-content reads, direct provider probes, or changes to existing reports/plans. pnpm package-level pnpm/resolutions and NO_COLOR/FORCE_COLOR warnings emitted. Coverage percentages and performance benchmarks not measured; duration above is runtime evidence only.

Unresolved questions: query serialization contract remediation and signed-out MCP hydration/readiness cause. Parent owns investigation; no extra six-case rerun authorized at this checkpoint.

**Status:** DONE_WITH_CONCERNS
**Summary:** Two public checks passed and four failed; raw evidence and sanitized failure/readiness context preserved.
**Concerns/Blockers:** Three exact query failures and repeated signed-out MCP URL failure remain; no phase-wide completion proof.
