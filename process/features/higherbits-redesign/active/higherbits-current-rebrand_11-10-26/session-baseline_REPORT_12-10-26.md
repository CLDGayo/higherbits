# Session baseline runtime — 12-10-26

TL;DR: Pre-edit admin baseline PASS: 14/14, eight PNGs, four Axe attachments with zero violations. Public checks FAIL: 1/6 passed, five failed. Baseline usable for post-change comparison; Phase 01 completion is not established.

## Scope

Current checkout on http://localhost:3101 only. Preserved the unrelated port-3100 checkout/server. No source/product edits, commits, deployments, direct provider probes, auth bypass, account-menu interaction, or credential inspection. The existing authorized private state was consumed only through Playwright storageState. This was scoped baseline verification, not an EVL confirmation sweep. Parent received admin results before public checks; no admin baseline rerun after source edits.

Read Graphify first, Phase 01 plan/report, context router/testing context, config and selected specs; used vc-scout for scoped discovery. RTK.md is absent. No additional setup was needed.

## Exact commands

Shared environment for both invocations:

```sh
export PLAYWRIGHT_PORT=3101
export PLAYWRIGHT_BASE_URL=http://localhost:3101
export HIGHERBITS_E2E_STAGE=baseline
export HIGHERBITS_E2E_ADMIN_STATE=/Users/clarencelloydgayo/.higherbits-admin-state.json
export HIGHERBITS_E2E_RUN_ID=session-baseline-359bbec6-0872-4f05-9545-62fc908049ce
```

Admin:

```sh
export HIGHERBITS_E2E_COMMAND_ID=admin-62b6d439-9674-4dca-8e50-d13ab377311a
corepack pnpm --filter web exec playwright test e2e/higherbits-mcp-route-identity.spec.ts e2e/higherbits-mcp-visual-evidence.spec.ts e2e/higherbits-mcp-a11y.spec.ts --project=admin --global-timeout 300000
```

Public:

```sh
export HIGHERBITS_E2E_COMMAND_ID=public-31d2f8e6-2b85-420c-8484-6007d83d55a1
corepack pnpm --filter web exec playwright test e2e/higherbits-mcp-signed-out.spec.ts e2e/higherbits-mcp-legacy-redirect.spec.ts --project=public --global-timeout 300000
```

Global setup unchanged, never skipped or weakened. Admin warmed 18 routes in 66768ms. Public warmed 17/18 in 154933ms; /templates timed out after two attempts. Public setup completed and assertions ran: classify failures as FAIL, not an inconclusive global-setup timeout.

## Raw outcomes

| Invocation | Passed | Failed | Skipped | Flaky | Exit | Duration |
|---|---:|---:|---:|---:|---:|---:|
| Admin | 14 | 0 | 0 | 0 | 0 | 160251.509ms |
| Public | 1 | 5 | 0 | 0 | 1 | 217639.18ms |
| Total | 15 | 5 | 0 | 0 | — | 377890.689ms |

Admin: two final-URL/identity/title/social-metadata cases passed; eight full-page screenshot cases passed; four Axe cases passed. Both route identities were guarded before screenshots/Axe. Baseline /magic-chat identity was Magic Chat, not the pending HigherBits AI identity. All four accessibility scans have zero violations and empty signature arrays. No raw failure was waived.

Public failures:

| Case | Exact failure / likely investigation location |
|---|---|
| legacy MCP page URLs permanently redirect to HigherBits MCP | TypeError: Invalid URL at apps/web/e2e/higherbits-mcp-legacy-redirect.spec.ts:22:25, new URL(response.headers().location!) |
| /magic preserves encoded values, repeated keys and all query parameters | TypeError: Invalid URL at apps/web/e2e/higherbits-mcp-legacy-redirect.spec.ts:41:25 |
| /magic/console preserves encoded values, repeated keys and all query parameters | TypeError: Invalid URL at apps/web/e2e/higherbits-mcp-legacy-redirect.spec.ts:41:25 |
| /magic/get-started preserves encoded values, repeated keys and all query parameters | TypeError: Invalid URL at apps/web/e2e/higherbits-mcp-legacy-redirect.spec.ts:41:25 |
| signed-out /higherbits-mcp redirects to / | toHaveURL failed at apps/web/e2e/higherbits-mcp-signed-out.spec.ts:8:24; expected http://localhost:3101/, received http://localhost:3101/higherbits-mcp; assertion timeout 5000ms |

The three expanded query cases passed their preceding status-308 and nonempty-Location assertions before URL construction failed. A relative Location is a plausible test-parser issue, not confirmed without inspecting the actual response; query/destination assertions remain unproven. The original combined redirect case failed before its status assertion. No test or product fix attempted. Signed-out /magic-chat redirects to / passed. Public /higherbits-mcp failure does not by itself establish protected-content exposure; body authorization was not inspected in this failed public case. Concurrent parent-owned source edits began after admin capture, so public failures are not attributed to those edits or a pre-existing defect without investigation.

## Preserved evidence

Task-relative root:

```text
evidence/phase-01/session-baseline-359bbec6-0872-4f05-9545-62fc908049ce/baseline/
```

Both command folders contain results.json copied byte-for-byte from apps/web/test-results/results.json immediately after their respective invocation, command.log, and exit-code.txt. Admin reporter was preserved before public invocation reused its source path. Reporter error arrays are empty in both runs.

Admin folder: admin-62b6d439-9674-4dca-8e50-d13ab377311a/

Four Axe attachments are embedded as base64 bodies in its raw results.json, with no separate reporter path. They were decoded without alteration into these actual files beside the reporter:

| File | Bytes | Violations |
|---|---:|---:|
| higherbits-mcp-light-desktop-axe.json | 226487 | 0 |
| higherbits-mcp-dark-desktop-axe.json | 216827 | 0 |
| magic-chat-light-desktop-axe.json | 107322 | 0 |
| magic-chat-dark-desktop-axe.json | 107321 | 0 |

Eight PNGs exist at these paths relative to the admin command folder:

```text
admin/higherbits-mcp-visual-evid-9833e--desktop-full-page-evidence-admin/higherbits-mcp-light-desktop.png
admin/higherbits-mcp-visual-evid-5e6fb-t-mobile-full-page-evidence-admin/higherbits-mcp-light-mobile.png
admin/higherbits-mcp-visual-evid-dee49--desktop-full-page-evidence-admin/higherbits-mcp-dark-desktop.png
admin/higherbits-mcp-visual-evid-3fba9-k-mobile-full-page-evidence-admin/higherbits-mcp-dark-mobile.png
admin/higherbits-mcp-visual-evid-5a58a--desktop-full-page-evidence-admin/magic-chat-light-desktop.png
admin/higherbits-mcp-visual-evid-66ab0-t-mobile-full-page-evidence-admin/magic-chat-light-mobile.png
admin/higherbits-mcp-visual-evid-f9db0--desktop-full-page-evidence-admin/magic-chat-dark-desktop.png
admin/higherbits-mcp-visual-evid-bb4a0-k-mobile-full-page-evidence-admin/magic-chat-dark-mobile.png
```

Public folder: public-31d2f8e6-2b85-420c-8484-6007d83d55a1/. Complete failure messages/stacks remain in results.json and command.log. No authenticated traces/videos or automatic failure screenshots enabled; selected visual spec never opens account menu.

## Usability, gaps and next steps

Baseline captures cover two routes × two themes × two viewports; automated identity and metadata guards passed. Admin evidence is usable for pre/post comparison. Capture existence is not native-resolution artwork/layout review; that remains pending. Four Axe scans cover desktop only, selected WCAG tags, and do not prove full accessibility or source-code coverage. No line/branch/function coverage generated; not applicable to this runtime-only assignment.

Next: parent can run a separate post-stage admin invocation with unique IDs after edits complete. Preserve this pre-edit baseline. Investigate five public failures at the locations above and preserve raw FAIL results even if later checks pass. Public /templates warm-up degradation may affect timing; no flake classification established from a single run. pnpm package-level pnpm/resolutions and NO_COLOR/FORCE_COLOR warnings were emitted; no build gate ran.

Skipped full public accessibility, unit/type/build/performance suites, provider checks, and risk-finalization artifacts because outside assigned scope. This report does not replace verification.json, review-decision.json, adversarial-validation.json, or final phase gates. No broader green or Phase 01 VERIFIED claim.

Unresolved questions: actual legacy Location values and signed-out MCP failure cause; native image review; fresh post-change comparison.

**Status:** DONE_WITH_CONCERNS
**Summary:** Usable admin baseline passed all 14 cases; scoped public run passed one and failed five, with raw evidence preserved.
**Concerns/Blockers:** Five public failures and pending post-change/image review prevent claiming phase completion.
