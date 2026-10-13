---
name: report:sidebar-reference-adaptation-validation
description: V1–V4 sidebar plan validation; awaiting the single V5 user decision.
date: 13-10-26
feature: higherbits-redesign
phase: VALIDATE
status: awaiting-user-decision
---
# Sidebar validation review

Validation candidate: CONDITIONAL. No application changes, contract write, commit, push, data changes, or deployment were performed. The four-file design is feasible after the concrete plan amendments below. This is V4 evidence, not a V7 approval.

## Scope and pre-check

Selected plan: sidebar-reference-adaptation_PLAN_13-10-26.md, same task folder. Feature: higherbits-redesign. Product workspace: /Users/clarencelloydgayo/Gayo Sphere/HigherBits.dev; the sibling Second Brain is the knowledge vault.

Graphify MainSidebar query succeeded against 21,283-node graph. Exact mandatory validator command:

`node .claude/skills/vc-generate-plan/scripts/validate-plan-artifact.mjs process/features/higherbits-redesign/active/sidebar-reference-adaptation_13-10-26/sidebar-reference-adaptation_PLAN_13-10-26.md`

Result: zero failures, zero warnings. All four write targets exist. The documented historical docs/01-architecture-and-stack.md is missing and noncritical. Supporting source hooks/use-category-tag-counts.ts is also absent; actual useCategoryTagCounts lives in apps/web/lib/queries.ts. Correct this reference. Plan has explicit Blast Radius/Public Contracts/Touchpoints/Verification Evidence; no inference needed. Validate Contract is pending, no existing PASS/CONDITIONAL contract, Phase Ordering dependency or conflict-resolution action.

Branch main is ahead6/behind72 against locally stored origin/main; no fetch. Three allowed files already dirty; landing toggle test clean. Preserve all prior changes. Situation scanner did not return promptly; git status supplied the read-only fallback.

Loaded context discovery/plan discovery inventories, root router, planning router, test router and actual downstream Playwright/a11y/Vitest configs/tests. Product capability-use file absent; applied documented vault protocol. Relevant aids: Ponytail scope discipline; Graphify source localization; Karpathy assumptions/proof; concise Caveman lite communication; scout path verification; strategy comparison; scenario exploration; scoped security review. Obsidian editing and new prompt generation do not apply; reference-led density/branding governs visual scope without invented redesign.

## Layer1 dimensions

| Dimension | Status | Evidence |
|---|---|---|
| Infra/setup fit | PASS | Node24.13/Corepack/dependencies present; web scripts and jsdom files match commands; tsc incremental disabled; no port3100 listener. |
| Test coverage | CONCERN | Frozen route/sort mocks and fake MainSidebar mobile fixture cannot prove planned behavior; exact amendments P2/P3/P4. |
| Breaking changes | CONCERN | Existing URL synchronization handles tab only, not sort; P1 explicitly adds bounded synchronization. |
| Security surface | PASS | Auth/admin visibility preserved, MCP/Contest server guards remain, static disabled rows introduce no route/action; no trust-boundary/data/dependency changes. |

## Layer2 execution blocks

| Section | Status | Mechanical feasibility, gaps, conflicts, highest risk |
|---|---|---|
| Baseline and test preparation | CONCERN | Existing files/scripts match. Replace obsolete no-Explore assertion, complete/reset mocks, preserve dirty snapshots. Runtime readiness unverified. Highest risk: overwriting preexisting test edits; use hashes/narrow hunks. |
| Metadata and presentation | PASS | Immutable sidebar export can preserve shared arrays, all aliases/order and existing gates. Search event matches current command listener; mobile title can live within existing SheetContent descendants. Highest risk: shared-array mutation or renamed-label sorting; assert originals/order. |
| Runtime proof | CONCERN | Browser/server/auth readiness INCONCLUSIVE, no local server started. Require deterministic navigation/mobile assertions and real sessions. Highest risk: mistaking mocked UI or HTTP200 for route/access proof. |

Totals by review area:0 FAILs /4 CONCERN areas /3 PASS areas. No unresolved architectural blocker. Security PASS is static scope review, not a claim that authenticated runtime passed. Metadata PASS does not establish browser readiness. These different verdicts are compatible; synthesis ranks source-proven gaps above generic feasibility.

## Proposed plan amendments — applied only after V5 acceptance

| ID | Amendment | Plan sections |
|---|---|---|
| P1 | Replace false existing-sort-sync assumption: MainSidebar synchronizes URL sort to sortByAtom only for pathname / and tab=components, validates existing SortOption values, defaults missing/invalid to recommended, updates only when changed, never pushes or changes category/library state. One native final-URL link per ordinary click; modified click mutates nothing. | Public Contracts; Checklist9; Verification Evidence |
| P2 | Mutable hoisted pathname/search/role/count/nav-spy fixtures reset before every test. Replace obsolete no-Explore-text test with Explore heading versus accordion assertion. Add real Jotai consumer/URL-rerender cases for sort, while isolating mocked composition tests. | Checklist2/9; Test Procedure; Infra Notes |
| P3 | Keep landing toggle test as provider regression. Add real MainSidebar+SidebarProvider+SidebarTrigger mobile tests inside approved sidebar-layout.test.tsx; mock correct hooks/use-mobile module; prove dialog title/Close/Escape and focus return. | Checklist8; Verification Evidence |
| P4 | Define deterministic browser assertions for identity/navigation/keyboard/scroll/mobile states as Hybrid; reserve Agent-Probe for visual judgment. AC8 behavior needs automated/hybrid coverage, not visual judgment alone. | AC8; Verification Evidence; Test Procedure |
| P5 | Retain mandatory runtime preflight and genuine guest/non-admin/admin verification. Missing sessions leave exact flows CONDITIONAL; mock roles never replace authenticated route proof. Record reference mobile/menu/keyboard/scroll limits honestly. | Evidence; Runtime gate; Resume |
| P6 | Correct supporting tag-count source to apps/web/lib/queries.ts. | Touchpoints |

P1 is feasible within four files because MainSidebar remains mounted for root tabs even when collapsed/closed (providers.tsx). use-navigation.ts:51–90 reads only tab; atoms.ts:26 initializes recommended; page.client.tsx consumes atom sort. No shared-hook edit is necessary unless proof fails. If that happens, halt that proposed change and amend scope with evidence.

## Test coverage plan and executable gates

Exact focused command: `corepack pnpm --filter web test components/features/main-page/__tests__/sidebar-layout.test.tsx app/__tests__/landing-sidebar-toggle.test.tsx`.

Exact type command: `corepack pnpm --filter web exec tsc --noEmit`.

| Criteria | Behavior | Strategy | Proving gate | Resolution |
|---|---|---|---|---|
| AC1/2 |105 mapping rows,78 category rows and mapped order; root groups/omissions | Fully-Automated | Focused Vitest plus report/reference-items.json integrity assertions in existing sidebar test | B |
| AC3/4 |25 disabled categories/product placeholders; zero-count links;5 canonical alias href/count/active keys; immutable original exports | Fully-Automated | Focused Vitest with scoped category/root queries | B |
| AC5 |Role composition, username fallback and no undefined destination | Fully-Automated | Focused role/identity fixture cases | B |
| AC6 |URL→sort atom on direct/rerender/history-like updates; one transition; modified-click no mutation; no category/library reset | Fully-Automated | Focused real-Jotai consumer and route rerender cases | B |
| AC7/8 |Real MainSidebar mobile dialog title/Close/Escape; expansion/filter semantics; promotion absent | Fully-Automated | Focused tests using actual SidebarProvider and correct mobile hook mock | B |
| AC9 |No introduced touched-file type/test failures, narrow approved diff | Fully-Automated | Baseline/post focused tests and tsc; compare error deltas and git diff | B |
| AC5 |Genuine guest/non-admin/admin destinations/access restrictions | Hybrid | Local browser: assert expected route identity and rejection/redirect; Publish opens UI without submission | B |
| AC6 |Actual ordinary/modifier/new-tab/history/reload behavior | Hybrid | Local browser: assert URL, sort consumer/list order and single aria-current after Featured→Newest→Back→Forward | B |
| AC7/8 |Keyboard, search, independent scroll/mobile close/focus | Hybrid | Local browser: assert focus targets, expansion ids/state, cleared/no-match search; final item/footer reachable; close/outside/Escape dismiss and restore trigger focus at767/768/769 | B |
| AC8/10 |Visual density, readable badges, brand/light/dark/narrow layout | Agent-Probe | Screenshots1920×980,1280×720,320×568,390×844 and breakpoint checks; no overflow/clipped footer | B |

B means gates added/run during implementation, not already proven. No automated tests or local runtime were executed in this validation pass. Existing application has not been implemented. Fully-Automated proving rows require inline failing stubs when writing V6 contract, not on-disk tests now:

```js
test("should preserve mapped sidebar composition", () => { throw new Error("NOT IMPLEMENTED — TDD stub: preserve mapped sidebar composition") })
test("should resolve aliases and clearly disable unavailable rows", () => { throw new Error("NOT IMPLEMENTED — TDD stub: resolve aliases and clearly disable unavailable rows") })
test("should preserve role and identity navigation", () => { throw new Error("NOT IMPLEMENTED — TDD stub: preserve role and identity navigation") })
test("should synchronize root component URL sort without extra navigation", () => { throw new Error("NOT IMPLEMENTED — TDD stub: synchronize root component URL sort without extra navigation") })
test("should dismiss the real mobile sidebar accessibly", () => { throw new Error("NOT IMPLEMENTED — TDD stub: dismiss the real mobile sidebar accessibly") })
```

Coverage limits: mocked role tests do not prove Clerk/server authorization; rerender tests do not prove browser history or new tabs; jsdom does not prove layout/scroll geometry; typecheck does not prove runtime or visual correctness; screenshots do not prove keyboard/focus/access rules. Generic existing Playwright suite writes another task's artifacts and is not sidebar proof. No new E2E application files authorized.

Concrete scenarios: direct date URL with recommended atom; missing/invalid sort fallback without URL mutation; Featured→Newest→Back→Forward; Ctrl/Meta/middle-click leaves current state/sheet; category/library unaffected; closed/collapsed sidebar still synchronizes root sort; count query failure leaves available links; signed-in unresolved identity produces no malformed href; all-role promotion absent; case-insensitive search clear/no-match; visible focus, matching controls ids; mobile320px Coming soon wrapping and final row/footer reachability.

## Runtime feasibility disposition

INCONCLUSIVE: no localhost3100 listener/server boot in this phase; genuine local auth sessions unverified. Root recovered reference Chrome briefly and directly confirmed component-context back control restores root sidebar. Mobile viewport request then timed out and Chrome disconnected again. No reference mobile behavior claimed. Later browser failure is an inspection limitation, not a new feature failure.

Probe requests retained: local workspace boot/browser accessibility (cheap-local plus needs-browser); genuine role navigation/history (needs-browser); mobile dialog/scroll geometry (needs-browser). No runtime PASS. User can accept mandatory execution gates, request probes after implementation approval, or return to PLAN; no inferred acceptance.

## Strategy comparison

| Signal | Validation fan-out | Implementation |
|---|---|---|
| S1 ≥3 packages |0|0|
| S2 schema/API/auth changes |0 — consumes guards|0|
| S3 ≥3 independent review directions |1 — four dimensions/three blocks|0 — one coupled sidebar|
| S4 phase program |0|0|
| S5 explicit thorough investigation |1|1|
| S6 named permission risk |1|1|
| S7 ≥5 write files |0 — four|0|

Validation score3/7: bounded parallel reviewers fit independent checks; four dimensions plus three execution blocks covered by four reviewer processes in waves. Layer2 roles were paired with relevant dimension reviewer; no omitted dimension. One model-capacity retry returned findings. Implementation score2/7 threshold suggests parallel review, but strategy-by-fit recommends sequential editor then independent reviewer because files/behavior are tightly coupled.

| Option | Validation estimate | Implementation estimate | Fit |
|---|---|---|---|
| Sequential |1 coordinator +7 sequential role checks |1 editor +1 reviewer =2 |Recommended implementation ownership |
| Parallel subagents |4 dimensions +3 section roles +0 optional =7 assignments; executed via4 paired reviewer processes |2 editors +1 reviewer =3 |Good independent review; overlapping editors unnecessary |
| Workflow |2 layer steps×1 coordinator×1 iteration =2 plus7 review assignments |3 steps×1 agent×1 iteration =3 |Governance useful; no extra automation needed |
| Coordinated team |3 members×2 rounds =6 |3 members×1 round =3 |No mid-edit workstreams justify overhead |

No >30-agent or >6-member guard triggered. Estimated counts describe role/call budgets, not measured billing.

## V5 user decision — no contract written yet

Recommended: Accept with concerns P1–P6 and mandatory execution gates. Options: Accept / Accept + print /goal / Accept with concerns / Re-run specific agents / Return to PLAN. Acceptance writes amendments and Validate Contract; it does not implement app changes. Explicit ENTER EXECUTE MODE remains required afterward. User has not enabled autopilot or a goal.

Skipped local tests/runtime and all implementation; risk remains URL/sort mismatch unless P1/P2 are applied, plus genuine auth/mobile verification pending.
