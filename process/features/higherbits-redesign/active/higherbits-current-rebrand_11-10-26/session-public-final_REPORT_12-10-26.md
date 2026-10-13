# Final public accessibility capture — 12-10-26

TL;DR: PASS: all ten public route/theme cases passed, zero violations, failures, skips or flaky results; raw exit 0. This is late post-edit public evidence, not a pre-edit baseline or a public before/after regression comparison. Prior final combined 20-case report is saved and unchanged.

## Scope and routing

Graphify queried first. Revisited process/context/all-context.md routing and process/context/tests/all-tests.md browser runner documentation; followed its source paths to current apps/web/e2e/a11y.spec.ts and retained existing Playwright config. Historical test-router route counts are stale relative to the current selected spec: public scope is five actual public routes × two themes. Per explicit Public Contracts clarification, actual admin-gated /contest is excluded alongside /higherbits-mcp and /magic-chat. Exclusion is test selection, not an auth bypass or claim of contest coverage. Final URL and route-heading guards remain before every Axe scan.

Only one runtime invocation on existing current-checkout port 3101. No restarts, source/product/auth changes, extra suites, provider/auth probes, state-file-content reads, account-menu interactions or screenshots. Public project uses empty cookies/origins. No admin-state environment value was needed or set by this invocation. No private session content appears in report or evidence.

## Exact invocation

```sh
export PLAYWRIGHT_PORT=3101
export PLAYWRIGHT_BASE_URL=http://localhost:3101
export HIGHERBITS_E2E_STAGE=post
export HIGHERBITS_E2E_RUN_ID=session-public-final-9411bddd-f4c3-4756-8dfa-d7adee2ed88a
export HIGHERBITS_E2E_COMMAND_ID=public-axe-3fd0d6b1-4031-47ea-b66a-23fccdb36dfa
corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts --project=public --global-timeout 300000
```

Runtime selected exactly ten tests using one worker. Existing global setup unchanged; warmed all 18 routes in 41841ms. Reporter start 2026-10-12T10:33:09.742Z; duration 165755.210ms. Raw expected=10, unexpected=0, skipped=0, flaky=0, errors=[]. Exit 0. No deadline reached and no raw failures waived.

## Ten exact results

| Route | Theme | Result | Violations | Test duration |
|---|---|---|---:|---:|
| / | light | PASS | 0 | 44003ms |
| / | dark | PASS | 0 | 10274ms |
| /studio | light | PASS | 0 | 3858ms |
| /studio | dark | PASS | 0 | 31680ms |
| /api-access | light | PASS | 0 | 3336ms |
| /api-access | dark | PASS | 0 | 3076ms |
| /our-story | light | PASS | 0 | 6966ms |
| /our-story | dark | PASS | 0 | 3953ms |
| /public-dashboard | light | PASS | 0 | 9353ms |
| /public-dashboard | dark | PASS | 0 | 3769ms |

All ten attachments contain rawResults.violations=[] and signatures=[]; no violating target nodes. Scans use desktop viewport and WCAG 2 A/AA plus 2.1 A/AA tags. This does not prove all accessibility criteria, keyboard interactions, mobile accessibility, source-code coverage or pixel/layout correctness. Home light and studio dark were slow at 44.003s and 31.680s; no flakiness or causal diagnosis inferred from one passing run.

## Exact evidence paths

Repository-relative command evidence root:

```text
process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/evidence/phase-01/session-public-final-9411bddd-f4c3-4756-8dfa-d7adee2ed88a/post/public-axe-3fd0d6b1-4031-47ea-b66a-23fccdb36dfa/
```

Files below relative to that root:

```text
results.json
command.log
exit-code.txt
axe-summary.json
home-light-desktop-axe.json
home-dark-desktop-axe.json
studio-light-desktop-axe.json
studio-dark-desktop-axe.json
api-access-light-desktop-axe.json
api-access-dark-desktop-axe.json
our-story-light-desktop-axe.json
our-story-dark-desktop-axe.json
public-dashboard-light-desktop-axe.json
public-dashboard-dark-desktop-axe.json
```

results.json copied byte-for-byte from apps/web/test-results/results.json immediately after invocation. Original sanitized Axe attachments remain embedded as base64 bodies in the raw reporter; ten decoded files preserve those bodies without alteration. axe-summary.json records captureKind=late-public-post-only-no-pre-edit-baseline, reporter statistics/errors, and each route/theme result/signature. command.log preserves raw runner output and package-level pnpm/resolutions plus NO_COLOR/FORCE_COLOR warnings. No traces, video or PNGs captured in this public-only run.

## Prior report confirmation and limits

Confirmed existing file process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/session-final-runtime_REPORT_12-10-26.md. Its final combined result remains 20 PASS (14 admin + six public), eight corrected-header PNGs and four empty admin Axe signature/target comparisons versus pre-edit admin baseline. It was not overwritten or rerun.

Earlier public accessibility four PASS/eight unrun with raw exit 1 remains historically INCONCLUSIVE for that invocation. This completed ten-case matrix adds fresh late-post evidence, with /contest now explicitly outside public scope; it does not retroactively complete the old twelve-case invocation or fabricate missing pre-edit public evidence. Earlier public query and signed-out failures remain preserved; later recovery does not establish their cause. Protected contest is not audited by this public run. Full below-fold screenshot review remains outside this task.

No build/type/unit gates, line/branch/function coverage, live provider validation, full EVL confirmation or risk-finalization artifacts run. Browser processes finished; no automatic reruns or further warming follow. Existing server untouched. This report proves assigned ten-case scope, not Phase 01 completion.

Unresolved questions: no complete fresh pre-edit public baseline; protected contest accessibility remains outside selected scope; earlier signed-out instability cause and below-fold image proof remain independent gaps.

**Status:** DONE
**Summary:** All ten actual-public route/theme Axe cases passed with zero violations; raw reporter/log and ten attachments preserved, and prior final 20-case report confirmed saved.
**Concerns/Blockers:** Late post-only evidence cannot establish a public pre/post delta or whole-product accessibility.
