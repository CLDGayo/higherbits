# Post runtime evidence — 12-10-26

TL;DR: Admin PASS, 14/14, eight PNGs and four zero-violation Axe scans matching baseline. Public accessibility INCONCLUSIVE: four passed, eight did not run before the 300-second deadline; raw exit 1 and two timeout errors retained. Admin evidence predates the final shared-header correction and is not proof of that correction. Browser/runtime activity stopped after this public run; main owns any diagnostic server restart and final rerun.

## Scope and sequence

Graphify queried first. Existing selected Phase 01 context/config/specs retained. No code/product/auth changes, no guard weakening, no direct provider probes, commits, deployment, server restart, account-menu capture, or private-state inspection. Authorized saved state consumed through Playwright storageState only. Port 3100 and its different checkout untouched. Parent was notified of complete admin results and signature comparison before public Axe invocation. No six-case public rerun or further browser/readiness request followed.

Parent subsequently reported a pre-existing MCP label in the AI shared header and assigned a separate UI correction. This 14-PASS admin invocation completed before that correction; retain its precise temporal limit. Parent also reported an ordered semantic-query contract clarification and a separate test adjustment. Earlier strict query FAIL results remain unchanged; this assignment does not verify those later adjustments.

## Exact commands

Shared environment:

```sh
export PLAYWRIGHT_PORT=3101
export PLAYWRIGHT_BASE_URL=http://localhost:3101
export HIGHERBITS_E2E_STAGE=post
export HIGHERBITS_E2E_ADMIN_STATE=/Users/clarencelloydgayo/.higherbits-admin-state.json
export HIGHERBITS_E2E_RUN_ID=session-post-1f0bcd15-9a8e-45e4-852d-8eabad6ee2e0
```

Admin:

```sh
export HIGHERBITS_E2E_COMMAND_ID=admin-3498b579-4720-4568-852c-9ed644c5e0c5
corepack pnpm --filter web exec playwright test e2e/higherbits-mcp-route-identity.spec.ts e2e/higherbits-mcp-visual-evidence.spec.ts e2e/higherbits-mcp-a11y.spec.ts --project=admin --global-timeout 300000
```

Public accessibility:

```sh
export HIGHERBITS_E2E_COMMAND_ID=public-axe-82913210-4aef-4620-85ee-4333749e2ad3
corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts --project=public --global-timeout 300000
```

Global setup unchanged and not skipped. Each raw apps/web/test-results/results.json was copied immediately into its unique command folder before any next invocation reused that path. Public project uses empty cookies/origins, despite admin state being configured for the separate admin project. Authenticated traces, automatic screenshots and video remain disabled; only the explicit protected visual spec captured PNGs.

## Raw result table

| Invocation | Selected | Passed | Assertion failures | Skipped / did not run | Flaky | Top-level errors | Exit | Duration |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Post admin | 14 | 14 | 0 | 0 | 0 | 0 | 0 | 202950.260ms |
| Post public Axe | 12 | 4 | 0 | 8 | 0 | 2 | 1 | 300042.793ms |

Admin: setup warmed 18 routes in 94729ms; two final-URL/identity/metadata checks, eight visual captures and four Axe scans passed. Post /magic-chat marker/title/social metadata assert HigherBits AI. This spec does not assert every shared header label, explaining why the later header correction still needed independent visual review.

Public: setup warmed 18 routes in 192992ms. Reporter records expected=4, skipped=8, unexpected=0, flaky=0; the list reporter says eight did not run. Raw errors:

```text
Timed out waiting 300s for the test suite to run
Timed out waiting 300s for the teardown for test suite to run
```

This was a suite/teardown deadline after setup completed and four cases passed, not a global-setup timeout and not a passing public gate. Classify public completion INCONCLUSIVE; preserve exit 1. No raw assertion FAIL is hidden or reclassified.

## Admin accessibility comparison

Baseline root (task-relative):

```text
evidence/phase-01/session-baseline-359bbec6-0872-4f05-9545-62fc908049ce/baseline/admin-62b6d439-9674-4dca-8e50-d13ab377311a/
```

| Route | Theme | Baseline signatures / target nodes | Post signatures / target nodes | New violations |
|---|---|---|---|---:|
| /higherbits-mcp | light | [] | [] | 0 |
| /higherbits-mcp | dark | [] | [] | 0 |
| /magic-chat | light | [] | [] | 0 |
| /magic-chat | dark | [] | [] | 0 |

Compared complete signatures arrays including rule ID, impact and affected target-node arrays. All four are identical empty arrays; no baseline or post violating target nodes. Desktop selected WCAG 2 A/AA and 2.1 A/AA tags only. Empty violations do not establish full accessibility, keyboard behavior, pixel parity or all source-path coverage.

## Public coverage, exact limits

| Route | Light | Dark | Persisted Axe signatures |
|---|---|---|---|
| / | PASS, 70318ms | PASS, 13011ms | [] in both |
| /studio | PASS, 7635ms | PASS, 2808ms | [] in both |
| /api-access | Did not run | Did not run | None |
| /contest | Did not run | Did not run | None |
| /our-story | Did not run | Did not run | None |
| /public-dashboard | Did not run | Did not run | None |

Both /contest guards remain intact; deadline prevented reaching them, so no contest assertion result or scan is claimed. Protected /higherbits-mcp and /magic-chat are intentionally absent from this public matrix and are covered separately by admin. /templates destination coverage is excluded by the existing spec. Public home light was slow (70.318s); setup consumed most of the suite budget. No causal diagnosis or flakiness claim from this single run.

Fresh complete pre-edit public accessibility baseline was unavailable. Four post public scans prove only those route/theme cases at this runtime; they do not establish a full public pre/post delta. Parent states the navigation naming change is admin-visible only, but that is not a substitute for absent baseline scans.

## Actual evidence paths

All following paths relative to task folder process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/.

Post root:

```text
evidence/phase-01/session-post-1f0bcd15-9a8e-45e4-852d-8eabad6ee2e0/post/
```

Admin command folder: admin-3498b579-4720-4568-852c-9ed644c5e0c5/. Contains results.json, command.log, exit-code.txt and baseline-comparison.json. baseline-comparison.json includes all eight actual PNG paths and the four complete signature/target comparisons. PNGs reside below this folder's admin/ tree, one for each route × light/dark × desktop/mobile combination. Eight files confirmed after completion. Native visual/artwork review remains parent's separate evidence; capture success alone is not acceptance of final header pixels.

Four embedded reporter attachments decoded without alteration into actual files beside admin results.json:

```text
admin-3498b579-4720-4568-852c-9ed644c5e0c5/higherbits-mcp-light-desktop-axe.json
admin-3498b579-4720-4568-852c-9ed644c5e0c5/higherbits-mcp-dark-desktop-axe.json
admin-3498b579-4720-4568-852c-9ed644c5e0c5/magic-chat-light-desktop-axe.json
admin-3498b579-4720-4568-852c-9ed644c5e0c5/magic-chat-dark-desktop-axe.json
```

Public command folder: public-axe-82913210-4aef-4620-85ee-4333749e2ad3/. Contains preserved results.json, command.log, exit-code.txt and coverage-summary.json. Four actual decoded Axe files alongside them:

```text
public-axe-82913210-4aef-4620-85ee-4333749e2ad3/home-light-desktop-axe.json
public-axe-82913210-4aef-4620-85ee-4333749e2ad3/home-dark-desktop-axe.json
public-axe-82913210-4aef-4620-85ee-4333749e2ad3/studio-light-desktop-axe.json
public-axe-82913210-4aef-4620-85ee-4333749e2ad3/studio-dark-desktop-axe.json
```

Each retains sanitized raw Axe results and violation signatures. Raw reporter attachments remain embedded as base64 bodies; decoded copies are derived evidence, not replacement reports. No attachment exists for the eight unrun cases.

Earlier public evidence unchanged: initial five FAIL/one PASS and relative-Location-fix rerun four FAIL/two PASS. Exact paths and errors remain in session-baseline_REPORT_12-10-26.md and session-public-rerun_REPORT_12-10-26.md. Their results are not superseded by this accessibility-only selection.

## Handoff and gaps

Browser test processes finished; no more warming, browsing, readiness requests, server operations or automatic reruns. Main can restart only its owned 3101 server diagnostically and run the final combined admin/public verification after its separately owned header/test changes. No stale post evidence is presented as verification of those changes.

Not an EVL confirmation sweep or Phase 01 closeout. No build/type/unit suites, source-code coverage percentages, performance benchmark, live provider probe, or risk-finalization artifacts generated. Existing package-level pnpm/resolutions and NO_COLOR/FORCE_COLOR warnings retained in logs. No Graphify rebuild or other process-doc write performed in this restricted post-evidence assignment.

Unresolved questions: final corrected-header verification; eight missing public route/theme checks; missing fresh public baseline; independently diagnosed signed-out MCP instability and latest query-contract rerun. Parent owns all further execution.

**Status:** DONE_WITH_CONCERNS
**Summary:** Pre-header-correction post admin passed 14/14 with no new Axe signatures/target nodes; public accessibility completed four of twelve cases before deadline.
**Concerns/Blockers:** Public gate INCONCLUSIVE with raw exit 1 and eight unrun cases; final corrected state requires parent-owned rerun.
