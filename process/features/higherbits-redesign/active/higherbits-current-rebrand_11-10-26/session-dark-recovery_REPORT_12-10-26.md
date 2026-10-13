# Dark workflow capture recovery — 12-10-26

TL;DR: PASS for the requested dark workflow proof: six native viewport PNGs, desktop 1280×900 and mobile 375×812, all individually inspected. All three numbers, headings and complete descriptions are readable. The rounded-card corner assertion is demonstrably invalid: 12 corner probes hit the surrounding grid while all 32 rendered text lines pass interior hit-tests. Two fresh raw failures remain FAIL; the third bounded invocation passes in 9367ms. No application source changed.

## Scope and safeguards

Only the new task-local `session-dark-recovery.cjs`, this report and new evidence directories are owned. Existing dirty application work, other reports, the server and historical failures were preserved. No commit, deployment, auth bypass, provider probe, credential-content inspection, consent interaction, CSS change or onboarding navigation occurred. Playwright consumed `/Users/clarencelloydgayo/.higherbits-admin-state.json` only as `storageState`. Exact canonical URL, HigherBits MCP page title, product identity count, stored dark theme and rendered dark class are asserted in every final capture. This preserves the established admin-context/product-identity guard; it does not independently inspect the account identity or permissions.

Graphify queried first. Read the context router, tests router, selected Phase 01 plan, previous final workflow report, failed temporary script and copied raw failure, relevant component/page/identity/visual spec sources, communication/orchestration protocols and vc-debug/vc-web-testing skills and references. Tests router contains no deeper grouped test documents on disk. RTK.md is absent, as previously reported. No dedicated chrome-devtools tool was available; actual Playwright screenshots and native `view_image` inspection supplied browser evidence.

Before browser use, `curl --max-time 20 -s -o /dev/null -w 'HTTP=%{http_code}\n' http://localhost:3101/higherbits-mcp` returned HTTP=200. This established server availability only; browser URL and page identity checks established content coverage. Existing port 3101 server was neither restarted nor replaced after a timeout.

## Evidence-first diagnosis

| Competing explanation | Concrete result |
|---|---|
| Rounded card corners lie outside the painted card | Confirmed in fresh measurements. Every card has computed borderRadius=24px. Both one-pixel-inset outer corner probes hit the surrounding `mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3` DIV; card-center and text-interior probes pass. The old composite would fail despite readable cards. |
| Header or cookie consent actually covers target text | Eliminated for the six final target cards. Whole card/text boxes fit measured unobscured bands; every rendered number, heading and description line has an interior hit-test resolving inside its text element. Native PNG inspection confirms readable pixels. Other, non-target content can remain covered. |
| Wrong page, light theme or window scrolling produced false proof | Eliminated by exact URL, product marker/title, dark storage/class, measured native container scrollTop and unchanged windowScrollY=0 on every final capture. |

The historical follow-up failed before persisting geometry; its exact failed subcondition cannot be reconstructed retrospectively. The fresh reproduction proves its corner-test pattern unsound without inventing missing historical measurements. The earlier missing pre-assertion record is also proven directly by the old script placing its capture-record append and screenshot after the failing assertion.

Two additional harness defects were exposed and corrected only after raw failure:

1. Invocation 1 reached the visible product identity, then `networkidle` timed out after 20000ms. Network-wide idleness was an unnecessary readiness requirement for these rendered cards. The correction waits for loaded fonts, then actual section/card measurements. The cause of continuing network activity was not instrumented and is not claimed.
2. Invocation 2 saved diagnostic PNGs and geometry, then demanded a different scrollTop for desktop card 03. Desktop cards share one grid row; cards 02 and 03 correctly both requested/received 2366. The correction requires a positive measured native scroll and actual movement from the initial position, while permitting same-row captures to share a position. Mobile still demonstrably moves between cards.

## Exact commands and timeline

Commands were run from the repository root unless specified. Both repair runs were explicit, diagnosed invocations; there is no automatic retry loop.

```sh
graphify query "dark workflow capture harness rounded corner hit testing higherbits current rebrand"
curl --max-time 20 -s -o /dev/null -w 'HTTP=%{http_code}\n' http://localhost:3101/higherbits-mcp
node process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/session-dark-recovery.cjs --self-check
node process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/session-dark-recovery.cjs
```

The final command was invoked three times total, with two diagnosed repairs. Each run has its own UUID directory, command.log, capture-script.cjs snapshot, capture-results.json and exit-code.txt. The script records its own stdout/error stack and exit outcome there; no old output was overwritten. Each invocation is bounded at 300s, beginning before browser launch, with browser closure at 297s and forced exit if closure hangs. All completed far below the bound.

All directories below are relative to this task's `evidence/phase-01/`:

| Invocation | UTC start → finish | Raw outcome | Evidence directory |
|---|---|---|---|
| 1 | 12:23:45.042 → 12:24:09.218 | FAIL, exit 1, 24176ms; networkidle timeout; no PNG | `session-dark-recovery-4945c262-fc3b-40a3-9359-cbe17131ed37/` |
| 2 | 12:24:27.036 → 12:24:48.272 | FAIL, exit 1, 21236ms; same-row scroll inequality; three diagnostic PNGs preserved | `session-dark-recovery-0b816c8a-20a1-489a-9221-af0dec18e5ef/` |
| 3 | 12:25:14.881 → 12:25:24.248 | PASS, exit 0, 9367ms; all six captures | `session-dark-recovery-1e9ae994-8b82-4f30-b3ab-90d91cdbd6c4/` |

The self-check was rerun after the final correction: PASS. It checks the measured centering equation, invariance after scrolling, rejection of oversized/unreachable geometry, and a mutation that omits the existing scroll offset. The mutation produces the wrong answer and is rejected using Node's standard assert library.

`graphify update .` also passed, run **inside the new final evidence directory**, producing a task-local graphify-out/ with 22 nodes and 28 edges, code extraction only and no model/provider request. The repository-wide graph was left untouched to respect the explicit task-local ownership restriction; this is not a claim that its global index was refreshed.

## Final geometry and pixel proof

Final evidence root: `evidence/phase-01/session-dark-recovery-1e9ae994-8b82-4f30-b3ab-90d91cdbd6c4/`.

| PNG | Native scrollTop | Safe vertical band | Target card vertical bounds | Result |
|---|---:|---|---|---|
| `higherbits-mcp-dark-desktop-01.png` | 2371 | 57–842 | 298.44–600.14 | PASS |
| `higherbits-mcp-dark-desktop-02.png` | 2366 | 66–842 | 303.44–605.14 | PASS |
| `higherbits-mcp-dark-desktop-03.png` | 2366 | 66–842 | 303.44–605.14 | PASS |
| `higherbits-mcp-dark-mobile-01.png` | 2571 | 68–642 | 208.94–500.88 | PASS |
| `higherbits-mcp-dark-mobile-02.png` | 2879 | 73–642 | 224.88–490.81 | PASS |
| `higherbits-mcp-dark-mobile-03.png` | 3177 | 73–642 | 224.81–490.75 | PASS |

Desktop scroll container: clientHeight=900, scrollHeight=4327, overflowY=auto. Mobile: clientHeight=812, scrollHeight=5318, overflowY=auto. Measured card positions are derived from current scrollTop and actual card bounds, centered between rendered header descendants and consent top. Geometry and guards are written before assertions; PNGs are saved before capture validation so a failing target retains diagnostics. PNG dimensions are verified from their native IHDR bytes.

All six final PNGs were opened individually with native `view_image`, with no resizing/editing of evidence files. Desktop shows all three complete cards in each viewport; captures 02 and 03 are intentionally byte-identical because both target cards share the same row. Mobile views show complete 01 Describe Your Vision, 02 Choose from Options, and 03 Instant Integration respectively, including every description. Adjacent unobscured mobile content bands overlap by 261px and 271px in native scroll coordinates. The header still overlaps unrelated content above each target; consent still covers lower non-target content. The mobile How It Works heading is partly behind the header in the first view, so these images prove card readability, not a wholly unobscured section heading.

Both viewport DOM checks find zero images in How It Works and no legacy how-it-works-1/2/3.png URLs anywhere in img src/srcset/currentSrc. No source or CSS was changed to obtain these results.

Independent final Node audit: PASS. Recomputed all six PNG SHA-256 hashes against capture-results.json; recomputed all 16 historical raw-artifact hashes; confirmed exit 0, under-300s duration, six passing captures, 32 text-line probes and positive mobile overlap (261px/271px). The final JSON contains exact PNG hashes and the 16 preserved before/after historical hashes, covering both original failures and both fresh recovery failures. Original failures remain FAIL.

## Limits and remaining ownership

No Axe rerun was needed because no application source changed. No build, typecheck, broad suite, deployment/provider check, onboarding/API-key flow, public-baseline recovery or claim/licensing adjudication was performed. This is Chromium desktop and a 375px Chromium viewport, not physical mobile-device or cross-browser proof. The development issue badge remains visible and uninvestigated. Prior light evidence is historical and was not rerun here. These dark results close this capture gap; they do not mark Phase 01 VERIFIED or authorize Phase 02.

Risk class is low: additive local verification code/report/evidence only. No new risk-gate.json or context-snippets.json is required for this restricted harness work; parent risk/review/verification/adversarial artifacts and phase-wide decisions were neither changed nor re-adjudicated. Recurrence prevention lives in the measured geometry self-check, per-text-line hit-tests, immutable per-run script/log/result/PNG artifacts and pre-assertion diagnostics.

Unresolved questions: the exact historical failed subcondition was never recorded; network activity responsible for invocation 1's idle timeout remains unclassified; pre-existing phase-wide baseline/claim gaps and development issue badge remain parent concerns. No unresolved question prevents the requested dark card proof.

## Fix boundary

```text
FIX BOUNDARY:
affected_files: [process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/session-dark-recovery.cjs]
root_cause: Outer one-pixel-inset corner hit-tests sample outside rounded card paint, while the old harness discarded geometry before failure. Fresh capture also exposed unnecessary network-idle readiness and a scroll-change assertion incompatible with cards sharing a desktop row.
proposed_fix: The new task-local harness centers actual card bounds inside measured overlay-free space, persists geometry and PNGs before assertions, tests rendered text-line interiors, waits for rendered readiness, and allows same-row capture positions while proving native scrolling from the initial position. No application-source fix is required.
risk_class: low
```

**Status:** DONE
**Summary:** Requested dark desktop/mobile proof is complete: six passing, natively inspected PNGs with all three cards readable. Every raw failure remains preserved and the geometry mutation/self-check passes.
**Concerns/Blockers:** No blocker for this capture task; broader phase verification and previously recorded claim/baseline gaps remain outside scope.
