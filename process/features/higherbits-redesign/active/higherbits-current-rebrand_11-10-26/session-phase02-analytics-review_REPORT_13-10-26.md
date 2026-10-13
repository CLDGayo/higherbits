---
phase: phase-02-analytics-independent-review
date: 2026-10-13
status: PASS
feature: higherbits-redesign
plan: process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-02-first-party-identifiers_PLAN_12-10-26.md
scope: Step B analytics/privacy only; not whole-phase approval
---

# Phase02 analytics/privacy independent review

TL;DR: PASS for the three owned files. No blocking regression or missing named unit scenario found. Native evidence confirms 84 passing cases, with **12 original cases preserved and 72 added**, correcting the worker's 13/71 arithmetic. Whole Phase02 finalization remains stopped pending coordinator-owned joint/browser/regression evidence and independent final validation.

## Scope

| File | Exact worker-before to current change |
|---|---|
| `apps/web/hooks/use-analytics.ts` | +80 / -22 lines |
| `apps/web/hooks/__tests__/use-analytics.test.ts` | +354 / -8 lines |
| `apps/web/app/(utility)/privacy/page.tsx` | +1 / -1 lines |

Total: 435 added / 31 removed lines. Comparison uses retained `before-0.txt`, `before-1.txt`, and `before-2.txt`, not unrelated cumulative branch changes. Reviewed the selected plan's PASS contract, Step B, ANON matrix, worker report, actual source/tests/privacy diff, raw logs, native JSON, and before/after fingerprints. Other workers' unfinished MCP/fixture work is excluded.

Only this review report was written. No app, test, plan, harness, graph, environment, provider, browser, dependency, or commit changes. No tests were rerun; bounded Node standard-library evidence assertions and read-only source comparisons were used as authorized.

## Scout Findings

Graphify query was the first tool action: `graphify query "Phase 02 analytics privacy useAnalytics ANON consent session-phase02-analytics"`. Applied `vc-scout`, `vc-security`, and source-based `vc-scenario` analysis locally; no delegation tool was available.

- Actual dependents are the component detail page, preview dialog, copy-code button, and intercepted demo modal. Calls retain `capture(component_id, activity_type, user_id?)`; none relies on a new export or testing seam.
- The real consent store invokes subscribers synchronously and isolates subscriber errors. Hook cleanup unsubscribes and separately invalidates the instance, so unsubscribe alone is not relied on to cancel pending work.
- Risk boundaries are independent storage operations, alias drift after initialization, revocation across an awaited lookup, instance teardown, unusable lookup results, and signed-in behavior under anonymous-storage failure. These were inspected before the systematic review.
- Multi-tab atomicity, simultaneous captures' existing read-before-insert race, server-side telemetry permissions, and genuine provider operation are outside this migration's proof. The reviewed change introduces no new query fan-out or server authorization contract.

## Overall Assessment

Both review passes completed: blocking correctness/security review PASS; informational evidence review found one count correction. No app fix is recommended. Step B2/B3 match the selected contract; B1 preserves the original test bodies and supplies real assertions for every named unit scenario. The failing-first artifact covers the initial 73-case matrix; the later refinements were tested after implementation, as the worker explicitly discloses.

## Critical / High Priority

None in the three-file scope. No missing named unit proof identified. This result does not satisfy the required joint browser gate or authorize Phase02 finalization.

## Informational Finding

**Evidence count correction; non-blocking.** `session-phase02-analytics_REPORT_13-10-26.md:11` claims 13 original and 71 added cases; the same split recurs at lines 31, 73, and 107, and in `evidence/phase-02/analytics-13-10-26/after.json:23` and `after.json:25`. Actual retained source contains eight direct tests and a two-by-two parameterized block: **12 original cases**. The original body block is present byte-for-byte in the final source. Native `results-final.json` contains those 12 names plus **72 new cases**, all passing. There is no removed original case or missing scenario hidden by the arithmetic.

Minimal correction for the owning worker/coordinator: change derived summaries to 12 preserved / 72 added, while retaining raw logs, source snapshots, and native results unchanged. No app change or rerun is required for this bookkeeping correction. These artifacts are observations outside this review's three source targets and sole writable report.

## Scenario Verification

| Named set | Actual source and assertion evidence | Result |
|---|---|---|
| ANON-SELECTION | Hook `:20-42`; tests `:265-289`: legacy-only, canonical-only, equal, conflict, empty legacy, empty canonical, neither and both empty. Legacy nonempty wins; both aliases verify exactly; generated identity uses one generator invocation; one filter/insert identity. | PASS; 8 native cases |
| ANON-CONSENT | Hook `:94-109,128`; tests `:291-332`: absent/rejected perform zero alias reads/writes, client/select/insert; both removals attempted; each independently denied removal still attempts the other; accepted to null/rejected disables capture. Original cases also gate signed-in calls. | PASS; 6 new native cases plus original cases |
| ANON-FAIL-CLOSED initialization | Hook `:20-42`; tests `:334-364,524-538`: either initial read throws, either write throws, either readback throws or mismatches; both keys independently attempted when applicable. Failed reads of empty storage do not generate/write; anonymous query and insert suppressed. | PASS; 10 native cases |
| ANON-FAIL-CLOSED post-init | Hook `:140-148,182`; tests `:366-402`: either alias missing/divergent/read throws before query prevents lookup; restoring bytes does not revive the invalid instance. Each failure during pending lookup prevents insertion. | PASS; 12 native cases |
| ANON-INFLIGHT | Hook `:95,138-148,182`; tests `:404-438`: anonymous and signed-in rejected/null/reject-then-reaccept invalidate the pending lookup. Reaccepted later capture succeeds. | PASS; 6 native cases |
| ANON-TEARDOWN | Hook `:113-118,140-146`; tests `:404-448`: both paths unmount, revoke, reaccept, resolve produce zero old insert; unsubscribe asserted, retained callback cannot query; fresh mount captures. StrictMode effect replay remains functional. | PASS; 2 cases named INFLIGHT/unmount plus 1 named TEARDOWN |
| ANON-MEASUREMENT | Hook `:121-135,163-176,199-218`; tests `:274-289,450-499,551-560`: two aliases yield one event, returned duplicates yield none for both paths; all existing activity types, fields, 24-hour cutoff and limit retained. Signed-in payload has user_id and undefined anon_id despite initial/later anonymous failure. Development no-send and existing recorder prevent outward construction. | PASS; 7 named cases plus selection/original coverage |
| ANON-DATA-FAILURE | Hook `:167-192,205-218`; tests `:501-522,540-549`: both paths returned lookup error, missing/null/non-array data, null response and rejected lookup suppress insertion; insert error/null/rejection contained with one attempt and no retry; client-construction failure contained. | PASS; 20 native cases |
| PRIVACY-KEEP-07E owned subset | Privacy `:73` exact diff: canonical and legacy aliases represent one identifier; legacy reuse disclosed; acceptance-only creation and independent removal attempts on rejection/reopened choice; browser-denial deletion limit explicit. Twenty read-only guard hashes match. | PASS for analytics/privacy subset only |

No additional production seam was introduced. `getSupabase` including its existing `window.__supabaseAnalyticsClient` behavior is byte-identical to the before snapshot. The capture parameter signature is also byte-identical; `{ capture }` remains the returned interface. Module-level client caching remains existing behavior. Call sites inspected read-only: component detail `:117,612`, preview dialog `:204,380`, copy-code button `:38`, intercepted modal `:249`.

## Evidence Integrity

Evidence directory: `evidence/phase-02/analytics-13-10-26/` inside this task folder.

- Independently hashed all three retained before snapshots against `before.json`; all match. Those hashes also match the coordinator's `config-baseline-13-10-26/source-before.json` array manifest.
- Independently hashed all three current files against `after.json`; exact bytes and hashes match the reviewed final snapshot.
- Native `results-final.json` hash matches `after.json.resultsSha256`: `0ff0b6e87b2aed3a13ef08daf7017160063f6f202fe8c1425de4ded10d5f4e72`. Exactly one suite, 84 assertions, all passed; zero failed/pending. Original body block preserved byte-for-byte, not merely matching declarations.
- Raw `green-closeout.log` agrees: Vitest 4.1.10, one file / 84 passed, duration 874ms, exit file 0. Raw `red.log` agrees with red exit 1: 46 failed / 27 passed of 73. First green and intermediate final exit files are also 0. Existing pinned-source tsconfig diagnostics remain visible in raw evidence and did not make the final runner fail.
- Rehashed all 20 recorded read-only guards, including real consent, shared configurations and Phase01 root risk packet: all unchanged. Hash comparisons do not constitute review of another worker's implementation.
- One initial reviewer manifest assertion assumed an object with `files`; actual coordinator manifest is an array. Corrected read-only assertion passed for all three paths. No evidence or source was changed to satisfy it.

Final reviewed SHA256 values:

| Target | SHA256 |
|---|---|
| Hook | `27e35aa17fac9691d427dfbb7393f521815a90925543bfe00f24afdf4c471ed9` |
| Tests | `5b59c20f0a7d1b00d4e922185741143ef2e8b7e811f6db351fcccd3adce15285` |
| Privacy | `2cce9e85dda591ee2d409ddaee5fc377b9099788aee8ae7950b3cbe0dfefecdd` |

## Security / Production Checklist

- Concurrency: per-instance generation and active state cancel pending captures on revoke/reaccept and unmount; no asynchronous gap exists between the final check and starting insert. A request already sent cannot be recalled; no recall guarantee is claimed.
- Error boundaries: per-key storage exceptions isolated; Supabase construction/query/insert errors contained. Only successful empty-array lookup permits insertion.
- API contracts/backwards compatibility: existing call signature, recorder, payload keys, signed-in omission of anon_id, event types, query fields and timing preserved. No schema or exported API change.
- Input validation: activity enum validation retained; stored aliases must read back exactly before anonymous access. Storage/caller values remain telemetry inputs under the existing trust model, not authenticated identity proof.
- Auth/authz: no sensitive-operation authorization changed; consent gates both identity paths. Server permissions were not audited or asserted by this slice.
- Query efficiency: bounded two-key loops; existing one lookup and at most one insert per capture. No new database loop, index requirement or N+1 query pattern introduced.
- Data disclosure: no new anonymous value included in signed-in payload; no outward request before consent or after detected invalidation. Existing console diagnostics remain local; no new external error response.

Applied scenario dimensions: user types, timing, state transitions, browser environment, error cascades, identity boundaries, integrity, integration and privacy. Scale is bounded here; billing/business logic and unrelated RPCs are outside scope. Dependency/network scans intentionally omitted: no dependency change and user prohibited duplicate provider/npm work.

## High-Risk Evidence Gate

Read the five existing Phase02 records at `evidence/phase-02/pvl-13-10-26/harness/`. `review-decision.json` and `adversarial-validation.json` are **present and required**. Their recorded disposition remains implementation rejected/pending, `mustStopBeforeFinalize: true`; they describe plan-time evidence, not the now-reviewed source result. The root task harness belongs to Phase01 and remains unchanged.

Updated Phase02 verification/decision/adversarial records remain coordinator-owned. Emission or mutation of separate JSON is explicitly deferred because this invocation grants write ownership only to this report. This report supplies the independent analytics source/unit findings for reconciliation. Required browser support, joint consumer proof, full regression and final independent validation remain outstanding for the coordinator; their absence does not block this explicitly bounded source/unit review, and this PASS cannot clear the full-phase stop.

## Recommended Actions / Plan Status

1. Accept this Step B source/unit review PASS for the exact fingerprints above; no app fix requested.
2. Correct the worker's derived 13/71 summaries to 12/72 without replacing raw/native evidence.
3. Coordinator may record B1/B2/B3 implementation and this review evidence, preserving the disclosed initial73-case red-first scope. Keep joint/browser/regression and final risk disposition pending until their actual gates complete. No plan file was edited here.

Metrics: native scoped test pass rate 84/84; original expanded cases 12; added expanded cases 72. Type coverage and code coverage percentages were not measured. Lint/build were not rerun, so no lint-count or compilation claim is made.

Context note: root `RTK.md` is absent, consistent with the worker report. Relevant context/test routing and protocol files were available; no missing task context prevented this review.

**Status:** DONE_WITH_CONCERNS
**Summary:** PASS for the exact three-file analytics/privacy slice; no blocking production regression or missing named unit proof found.
**Concerns/Blockers:** Non-blocking derived case-count correction: 12 preserved / 72 added. Full Phase02 risk approval remains coordinator-owned and pending; no whole-phase approval issued.
