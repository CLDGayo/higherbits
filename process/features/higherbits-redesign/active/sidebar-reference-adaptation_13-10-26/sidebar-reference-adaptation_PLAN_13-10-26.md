---
feature: higherbits-redesign
phase: PLAN
status: shipped-verified-with-limitations
date: 13-10-26
---
# HigherBits sidebar reference adaptation

**Date**: 13-10-26
**Complexity**: SIMPLE — one bounded sidebar implementation stream
**Status**: ✅ RELEASED — user accepted the local UI; scoped VPS deployment verified with documented limits

## Overview

Adapt the applicable structure and compact visual rhythm of the live authenticated 21st.dev sidebar to HigherBits using its existing MainSidebar, routes, permissions, branding and dependencies. The investigation/mapping is [sidebar-reference-adaptation_REPORT_13-10-26.md](sidebar-reference-adaptation_REPORT_13-10-26.md), including all 78 reference categories and 27 root/context/control rows. Implementation and release outcomes are recorded in the execution and release reports in this task folder. This plan remains the execution anchor. The user's detailed task supplies the requirements, recorded in sidebar-reference-adaptation_SPEC_13-10-26.md; review approval freezes them. The unrelated rebrand SPEC is not authority to expand this scope.

Design Read: developer marketplace navigation for component builders; compact, calm, familiar, HigherBits-branded. Dials: DESIGN_VARIANCE 2 / MOTION_INTENSITY 2 / VISUAL_DENSITY 6. Reference hierarchy governs applicable order; existing HigherBits tokens and typography govern brand.

Quick links: [Scope](#scope), [Acceptance Criteria](#acceptance-criteria), [Implementation Checklist](#implementation-checklist), [Verification Evidence](#verification-evidence), [Resume and Execution Handoff](#resume-and-execution-handoff).

## Context Envelope

- feature: higherbits-redesign
- phase: PLAN
- session-goal: deliver investigation, exhaustive mapping and one reviewable sidebar adaptation plan
- branch: main, as inspected 13-10-26; no checkout or branch changes performed
- worktree: /Users/clarencelloydgayo/Gayo Sphere/HigherBits.dev; many unrelated dirty files
- context-group: planning | tests
- blast-radius-packages: apps/web sidebar presentation and sidebar-only navigation metadata
- active-plan: process/features/higherbits-redesign/active/sidebar-reference-adaptation_13-10-26/sidebar-reference-adaptation_PLAN_13-10-26.md
- test-runner: vitest | browser agent-probe
- validate-contract: inline below, CONDITIONAL accepted 13-10-26

## Goals and Success Metrics

All reference items are accounted for in the mapping; all rendered working links target existing HigherBits features, unavailable items are visibly and semantically Coming soon, and no permission boundary changes. Preserve needed HigherBits navigation. Verify desktop, keyboard, responsive sheet, scrolling, route active states and browser history after approved implementation. A screenshot or HTTP200 alone is insufficient proof.

## Scope

In scope: MainSidebar root/components/libraries views, sidebar-only category order/aliases/availability, Help/Publish footer, active/focus states, local search and mobile close/title. Include removal of the leftover local pink Upgrade/Support card, previously requested by the user.

Out of scope: missing product features; database/schema/tag seeding; ingestion; billing; ownership; authentication or permission changes; changes to Studio sidebar; header branding; homepage slider categorization; app routes/APIs; new dependencies; push/commit/deploy. Keep all work local.

## Evidence and Assumptions

Live reference: root inspected in authenticated Chrome at 1920×980, Components clicked, category anchors and context replacement observed. The screenshot `21st-home-desktop.jpg` is supporting evidence. Mobile/tablet, keyboard, wheel scrolling, Help/Publish menus, close/sidebar context controls and search filtering were not directly tested before Chrome connectivity failed. These are proposed HigherBits behaviors, not verified reference parity. No backend network contract captured; observed routes/anchors are the reference contract.

Current HigherBits: source examined; no visual browser verification this turn. Product repo was located through the vault context router. Source overrides stale historical context; `docs/01-architecture-and-stack.md` is missing. Current navigation has 75 category entries (29 marketing/46 UI), reference has78 (29/49). Production read-only tag evidence:27 configured missing slugs;5 supported aliases; remaining22 plus3 new reference entries gives25 unavailable category rows. Existing tag rows with zero component count remain available.

Anonymous HTTP follow-up: HigherBits home/components/authors/collections/libraries tab URLs return200, which proves HTTP response only. Five alias category URLs return200 with expected titles and without Next redirect/404 markers. `/s/ascii` returns streamed HTTP200 with `NEXT_HTTP_ERROR_FALLBACK;404`; treat absent tags as unavailable despite status. `/higherbits-mcp` returns a Next redirect/refresh marker for anonymous request, consistent with its gate. None of this is visual verification; generic fallback text serialized in a successful page is not a visible404 test.

## Phase Completion Rules

This SIMPLE plan has one implementation stream; the work blocks below are not independent phase programs. Completion requires integration/runtime navigation, manual keyboard/mobile flows, state verification, error/loading behavior, and user visual confirmation. No database writes are required; verify URL, selected context, filters and mobile-open state instead. ⏳ PLANNED means unstarted; 🔨 CODE DONE means code only; 🧪 TESTING means gates in progress; ✅ VERIFIED requires tests and explicit user confirmation. Never mark unavailable auth/browser proof as green.

## Execution Brief

1. Baseline and test preparation: preserve the current dirty file snapshots; add focused expectations before implementation. Test current sidebar and landing toggle to distinguish existing failures. Verify source hashes and git diff; done when scope and baseline are recorded.
2. Metadata and presentation: resolve sidebar-only categories, root Explore/Build groups and compact HigherBits styles. Test route/availability permissions with mocked users; verify no global homepage category contract change. Done when unit tests and typecheck delta meet the gates.
3. Runtime proof: exercise local desktop and mobile with available auth states, test Help/Publish routing without submitting data, and capture screenshots. Verify URLs/history/focus/scroll/state. Done when the scenario matrix passes and limitations are disclosed; final VERIFIED remains subject to user visual confirmation.

Expected outcome: compact branded navigation; accurate real links and disabled Coming soon rows; all current necessary navigation retained; no product features or deployment added.

## Functional Requirements

Root order: local Search button then Home; Explore: Components, Themes, Templates, Apps, Icons, Video, Bookmarks (signed-in), Creators, Collections. Build: Creator Studio, HigherBits AI, HigherBits MCP. Add admin-only Catalog tools (Bundles, Premium Stores), admin AI Waitlist, Contest and current admin links after Build. Templates remains in Explore as a real admin-only link; hide for non-admins. Implemented gated features are not Coming soon merely because they are restricted. Retain existing current destinations for supplemental links; do not invent links from names. Purchased Bundles is Coming soon even admin because its renderer is incomplete.

Component context: Back to main control; labelled category Search with slash hint; Featured, Newest, Creators, Libraries; Marketing Blocks then UI Components exactly in mapping/reference order. No reference New/Updated/Try free badges become HigherBits claims unless current evidence supports them. Libraries retains current search/category/view filters and list context. Existing needed expansion remains only for actual child menus (e.g. admin MCP links); do not add expand semantics to a plain Newest link or headings.

Category aliases: `/s/avatar`→`/s/avatars`; `/s/bento-grid`→`/s/grid`; `/s/registration-signup`→`/s/registration`; `/s/team-section`→`/s/team`; `/s/carousel`→`/s/3d-carousel`, labelled **3D Carousels** to disclose narrower support. Count lookup and active state must use the resolved slug. Add sidebar entries Profiles, Progress, Search Bars in reference order as unavailable. Preserve original shared category arrays for other consumers.

The25 Coming soon category rows are Announcements, ASCII Art, Calls to Action, FAQs, Footers, Galleries, Hooks, Images, Maps, Steppers, Videos, File Uploads, Icons, Links, Notifications, Onboarding, Paginations, Profiles, Progress, Radio Groups, Search Bars, Sliders, Tags, Text Areas, Toasts. Do not derive availability from counts. Separate root Themes/Apps/Icons/Video/HigherBits AI placeholders are Coming soon. Templates/Bundles/Premium Stores/MCP/Contest preserve current visibility gates and are hidden for non-admins; access restriction is not missing implementation. Admin MCP and Waitlist retain existing working gated destinations. AI Chats category is available UI components, not a claim of shipped AI generation.

Each unavailable row is a native disabled button with no href or navigation click handler, visible Coming soon text, accessible name including the unavailable status, and sufficient readable contrast. No invisible hover-only explanation. These rows are skipped by Tab naturally; screen readers can still read disabled state/content. No clickable false affordance or fabricated public route.

Help reuses existing panel and contents in footer. Signed-in Publish reuses current Add new behavior: `studioHardNavigate('/studio/{username}/components?new=true')` when identity exists, existing `/studio?new=true` fallback otherwise. No new publisher. Signed-out state does not expose a publish action that bypasses auth. Creator Studio reuses its current entry behavior. Brand remains in the current header without a second competing logo.

## Non-Functional Requirements

Use existing Sidebar primitives, Sheet, icons, cn utility, theme tokens and font-cozy where current. Desktop width256px/mobile288px/768px breakpoint remain; reference measured240px is not copied globally. Desktop rows32px minimum, 16px icons in consistent32px cells, 14px/20px medium text,12px/16px headings,8px outer inset,6px corners and1px row gaps. HigherBits lavender active token remains; inactive foreground uses existing muted token; visible keyboard focus ring remains. Badge rows may grow or wrap labels without horizontal overflow. Mobile targets at least44px, sheet max-width viewport minus safe inset at320px. Footer outside independently scrolling nav region; flex/min-height constraints must allow scrolling in short viewport. Keep reduced motion; no automatic delayed submenu opening.

Links expose `aria-current="page"` when active. Expansion buttons expose labelled `aria-expanded` and `aria-controls` referencing actual submenu ids. Existing library filter buttons touched must expose `aria-pressed`. Mobile MainSidebar adds its own accessible SheetTitle and Close navigation button using current `isMobile`/`setOpenMobile` context; avoid changing shared primitive or Studio. Escape/outside click retain Sheet dismissal; choose main view Back separately from sidebar Close.

## Acceptance Criteria

- AC1: All105 mapped reference rows are accounted for, with78 individual categories and explicit Design Bug Bot omission. proven by: Mapping integrity; strategy: Fully-Automated.
- AC2: Root/component/library structures follow the specified order with necessary HigherBits additions; no false expandable Newest. proven by: Sidebar composition; strategy: Fully-Automated.
- AC3:25 unavailable category entries and required product placeholders have no href/handler, readable Coming soon and disabled semantics; available zero-count tags remain links. proven by: Availability and permissions; strategy: Fully-Automated.
- AC4: All5 aliases use resolved routes/counts/active state and 3D Carousels label; original shared homepage navigation data is preserved. proven by: Category resolution; strategy: Fully-Automated.
- AC5: Auth/admin gates remain; real signed-in navigation/Studio/Publish reach expected destination without unauthorized creation. proven by: Local identity navigation; strategy: Hybrid.
- AC6: One ordinary click produces correct URL/context/active state; modified clicks preserve native behavior; back/forward restores state without duplicate history entries. proven by: Local navigation and history; strategy: Hybrid.
- AC7: Category/library search, actual expansions and Help work via keyboard with appropriate state semantics and visible focus. proven by: Keyboard and control matrix; strategy: Hybrid.
- AC8: Independent scrolling and accessible mobile close work at1920×980,1280×720,320×568,390×844 and767/768/769px boundaries without clipped badges/footer or horizontal overflow. proven by: Mobile semantics and responsive behavior; strategy: Fully-Automated and Hybrid. Visual layout judgment additionally uses Agent-Probe.
- AC9: No new touched-file type errors, no focused regression failures, no app edits outside blast radius or dependency/data/deploy operations. proven by: Scope and regression gate; strategy: Fully-Automated.
- AC10: Light/dark branding is retained; forbidden pink promotion absent; report distinguishes inspected reference behavior from unverified parity. proven by: Branded evidence review; strategy: Agent-Probe.

## Touchpoints

Allowed application writes (4 existing files only):
- `apps/web/lib/navigation.ts`: add a sidebar-only export `sidebarCategories` derived from existing categories with explicit route/availability/title overrides and three reference-only entries; optional sidebar availability field belongs only to sidebar export, not global feature availability. Existing `categories`, `marketing`, `ui`, main tab configuration exports retain meaning for homepage consumers.
- `apps/web/components/features/main-page/sidebar-layout.tsx`: use sidebar metadata, restructure root groups, render disabled unavailable rows, reuse current nav/search/auth/Help/Studio handlers, scoped styling/mobile title/close. Preserve props contract and libraries view.
- `apps/web/components/features/main-page/__tests__/sidebar-layout.test.tsx`: replace obsolete admin support-card expectation; add behavior-focused composition/availability/aliases/auth/active state/expansion tests.
- `apps/web/app/__tests__/landing-sidebar-toggle.test.tsx`: extend only as required to prove MainSidebar existing default collapsed landing behavior; preserve provider behavior. Its mocked MainSidebar is provider regression only; real mobile MainSidebar tests belong in sidebar-layout.test.tsx.

Read-only supporting sources: `apps/web/components/ui/sidebar.tsx`, `sheet.tsx`, `header.client.tsx`, `command-menu.tsx`, `main-page/help.tsx`, Studio `nav-config.ts`, Studio creation consumer, `hooks/use-navigation.ts`, `lib/queries.ts` (useCategoryTagCounts), `hooks/use-sidebar-visibility.ts`, `lib/atoms.ts`, category server page, `app/page.client.tsx`, MCP/Contest server gates, root providers, current tests/config/package scripts.

Plan/report/evidence may be written only inside this task folder. If a hook, shared primitive, header or route change proves necessary, stop that proposed edit and bring exact evidence for plan/validate-contract amendment; do not silently expand scope.

## Public Contracts

No API/schema/dependency contract changes. Existing tab/query values, tag-count API, user identity resolution and permission checks remain. `MainSidebar` props and useSidebar provider contract remain stable. Sidebar-only category metadata expresses an existing canonical href or unavailable row; no route creation. Ordinary link activation must not call both navigateToTab and handleSortChange causing multiple pushes: use one final existing URL/route transition, preserving tab atoms through existing URL sync. Existing useNavigation does NOT synchronize URL sort. MainSidebar must explicitly synchronize sortByAtom only when pathname is `/` and tab is `components`, validating against existing supported SortOption values and defaulting missing/invalid values to recommended. Update only when the atom differs; this effect must never navigate or write history/cookies and must not overwrite category/library sort state. MainSidebar remains mounted when collapsed or the mobile sheet is closed. Native modified clicks never mutate current tab/context or close current sheet. Category data/count failure must not fabricate counts or erase navigation; no disabled-by-count behavior. Search dispatch matches current header command trigger and does not install a duplicate global command menu.

## Blast Radius

4 application/test files in apps/web; bounded presentation/navigation risk. Permissions are consumed, not changed, but gate regressions require hybrid verification. No shared primitive/Studio changes. Shared navigation arrays feed homepage category surfaces, which is why this plan adds a sidebar-only export rather than rewriting their availability or alias hrefs. No database writes/data loss expected. Existing dirty sidebar-layout.tsx, its tests, navigation.ts, hooks/use-navigation.ts and many other files belong to prior work; save patch baselines/hashes before execute. Never reset, stash, overwrite wholesale or stage unrelated files. No commit or deployment in this task.

## Implementation Checklist

1. Record branch/status and hashes plus copies of all4 current touchpoint files in task `evidence/baseline/`; run focused baseline tests and typecheck; record current failures before editing.
2. Extend sidebar-layout.test.tsx with composition, Coming soon, signed-out/signed-in/admin and category-alias cases. Replace obsolete no-Explore-text expectation with Explore heading/group versus forbidden accordion proof. Use resettable hoisted route/search/role/count/spies; complete navigation mocks. Add isolated real-Jotai consumer and URL-rerender cases for sort synchronization; do not rely on mocked sort for integration proof. Prove expected failures on baseline without altering production data.
3. In navigation.ts create sidebarCategories with reference order,5 aliases,25 unavailable entries and3 new reference entries; preserve existing category exports. Test resolved href/count keys and unchanged shared originals.
4. In MainSidebar render available category links and unavailable disabled rows from sidebarCategories, using resolved href for active/count; label category search and preserve filter behavior. Verify all78 rows available to filter and25 disabled.
5. Restructure MainSidebar root into Home/Explore/Build and supplemental gated groups using exact mapping. Retain libraries view and admin controls; implement true unsupported-feature placeholders, omit Design Bug Bot/CLI promise. Verify auth-role composition tests.
6. Add sidebar Search with current command trigger, retain Help footer, add signed-in Publish via current Studio hard-navigation behavior, preserve Studio/Bookmarks fallbacks. Test no unresolved identity creates malformed href.
7. Apply scoped compact row/heading/icon/spacing styles and HigherBits active/focus tokens; remove residual pink card and obsolete auto-open timer. Test forbidden promotion absent for all roles.
8. Add labelled MainSidebar mobile SheetTitle/close control through useSidebar; actual expansions get aria-expanded/controls, touched filters aria-pressed. Test actual MainSidebar+SidebarProvider+SidebarTrigger in existing sidebar-layout.test.tsx using mutable @/hooks/use-mobile mock; assert title, Close navigation, Escape and focus return. Keep landing-sidebar-toggle test as provider-collapse regression. No shared primitive edits.
9. Ensure available tab controls expose native links with final URL and a single ordinary navigation transition; keep modified-click semantics and exact route-derived active state. Add MainSidebar root-components-only URL→sortByAtom synchronization with supported-value validation and recommended fallback, equality guard and no navigation/cookie writes. Test direct date URL, missing/invalid sort, route rerenders, one ordinary transition, no current-state mutation on Ctrl/Meta/middle click, and no category/library reset. Run real browser Back/Forward/reload matrix.
10. Run focused Vitest suites and typecheck; compare touched-file errors with baseline; inspect diff for accidental unrelated edits and unchanged dependency/schema/route files.
11. On local app execute identity/navigation/control/keyboard/mobile/scroll matrix; visit destination identities, inspect route error/redirect state, and capture requested light/dark/desktop/mobile screenshots with sanitized account regions. Do not create/publish component data.
12. Write final local verification report and evidence manifest in task folder; include Coming soon inventory, omissions, inspection limitations, commands/results and residual failures. Request user visual review; no commit/push/deploy.

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| Mapping integrity | Fully-Automated | AC1: count105 mapping rows;78 category rows; verify every reference-items.json name occurs exactly once within its group |
| Sidebar composition | Fully-Automated | AC2: scoped RTL tests assert required root/group/category order and existing library controls, no false Newest expansion |
| Availability and permissions | Fully-Automated | AC3: role fixtures assert25 category disabled buttons plus public product placeholders have no href/action; existing zero-count tags still link |
| Category resolution | Fully-Automated | AC4:5 aliases resolve href/count key/active state; 3D label and untouched original shared exports |
| Local identity navigation | Hybrid | AC5: local app with available signed-out, signed-in non-admin and admin sessions; Bookmarks/Studio/Publish destinations; gate behavior |
| Local navigation and history | Hybrid | AC6: ordinary click, Cmd/Ctrl-click, middle click, reload, direct alias, back/forward; URL/context/aria-current match |
| Keyboard and control matrix | Hybrid | AC7: Tab/Shift+Tab focus, Enter/Space actual controls, slash outside editors, search empty/no-match, real expansion, Help close |
| Mobile semantics and responsive behavior | Fully-Automated + Hybrid | AC8: real sidebar mobile RTL plus browser assertions for desktop/320/390mobile/767–769 boundaries, last category/footer reachability, close/Escape/outside/return focus |
| Responsive visual judgment | Agent-Probe | AC8/10: inspect screenshot density, wrapping, contrast and clipping at the required sizes |
| Scope and regression gate | Fully-Automated | AC9: focused tests pass; typecheck no introduced errors; diff only approved edits; no data/dependency/deploy operations |
| Branded evidence review | Agent-Probe | AC10: dark/light screenshots maintain HigherBits brand and readable Coming soon; removed promotion absent; report limitations explicit |

## Test Procedure

Sources loaded: `process/context/tests/all-tests.md` and downstream actual `apps/web/playwright.config.ts`, `apps/web/e2e/a11y.spec.ts`; current Vitest config, package scripts and two scoped test files. Historical router baselines are stale and must not be copied as current results.

From product root run before/after:
- `corepack pnpm --filter web test components/features/main-page/__tests__/sidebar-layout.test.tsx app/__tests__/landing-sidebar-toggle.test.tsx`
- `corepack pnpm --filter web exec tsc --noEmit`

These commands are not executed by planning. Record preexisting test/type failures separately; no blanket claim of passing from static inspection. Scoped tests prove sidebar composition and deterministic handlers, not real Clerk/Next navigation. Runtime gates require existing local server, real accessible sessions and browser tooling. Use `corepack pnpm --filter web dev --port 3100` only if no suitable server runs. Visit local app rather than mutate production.

Runtime matrix: main/components/libraries contexts; recommended/date/creators/collections/categories; alias direct load and active selection; hover focus versus selection; modified link clicks; Back then Forward after main→components→category; slash shortcut while input/textarea/contenteditable is focused; case-insensitive search, clearing/no results; library controls; admin real expansion open/close; unavailable rows no route mutation; role-specific catalog/AI/MCP/Contest links; Help dialog close; Publish opens existing creation UI but never submit. Desktop1920×980 and1280×720; narrow320×568 and390×844; breakpoint767/768/769; theme light/dark; scroll to final category then close sheet/restore focus. Test default landing collapse and preserved header trigger.

For actual runtime auth gates, anonymous/non-admin/admin contexts must be distinct; do not fabricate user or reviewer identities. If authenticated sessions are unavailable, preserve gate as CONDITIONAL and disclose exact untested flows; do not call a mocked test real gate proof. Reference mobile parity is a named inspection limit, not a reason to skip HigherBits mobile verification. Save screenshots `higherbits-sidebar-main-dark-desktop.png`, `higherbits-sidebar-components-light-desktop.png`, `higherbits-sidebar-components-dark-mobile.png`, `higherbits-sidebar-coming-soon-mobile.png` under task evidence after approval.


### Accepted validation amendments and deterministic runtime assertions

P1–P6 from sidebar-reference-adaptation-validation_REPORT_13-10-26.md were accepted by the user's `ENTER EXECUTE MODE` after the V5 menu. Acceptance approves plan fixes and execution, not a claim of runtime success. Baseline tests/server/browser/auth were not run in validation; runtime readiness remains INCONCLUSIVE until execution proves it. Browser reference component-context back control was directly observed after recovery; reference mobile, keyboard, scrolling and menus remain unverified after Chrome disconnected.

Hybrid checks must record deterministic assertions (available browser tooling may execute scripts in task evidence without adding application E2E files):
- Real guest/non-admin/admin sessions: assert visible allowed groups, hidden restricted links and actual destination heading/route/error/redirect state. Publish opens existing UI, never submit/create data. Missing genuine sessions leave the exact gate CONDITIONAL.
- Featured→Newest→Back→Forward and reload/direct date URL: assert URL, shared sort consumer/component order and exactly one aria-current agree; no extra history transition. Ctrl/Meta/middle click leaves current atom/context/sheet unchanged.
- Search/controls: assert focused field, case-insensitive results, clear/no-match state, unchanged input/editor slash behavior, expansion ids/expanded state, filter pressed state and Help dismissal.
- Mobile/scroll: assert dialog title/Close visible; close/Escape/outside dismiss, trigger focus restored; last category and footer reachable independently; no horizontal overflow at320/390px and767/768/769 boundaries. Inspect layout contrast/wrapping separately as Agent-Probe.

If a new shared hook/primitive/app-route file is needed, halt that edit and amend scope with evidence. The approved four-file scope is unchanged.

## Test Infra Improvement Notes

Current sidebar tests contain obsolete admin pink-card and no-Explore-text expectations. Replace those narrowly to match removal and the new labelled Explore group, preserving unrelated assertions. Existing mocks freeze route/sort and omit handleSortChange; add resettable fixtures and isolated real-Jotai consumer cases. Existing landing toggle test mocks MainSidebar entirely and cannot prove mobile controls. Add real sidebar/mobile proof to the allowed sidebar-layout.test.tsx with the correct @/hooks/use-mobile mock. Shared Playwright config routes artifacts into another active rebrand task and its generic a11y suite has unrelated route-identity drift; do not rewrite it or run it as a sidebar-specific proof. Existing scoped RTL plus direct browser matrices are sufficient here. If durable browser automation is needed, request amendment with exact dedicated test/config files first. Native disabled rows are readable but intentionally absent from Tab order; explicitly inspect screen-reader accessible names. No developed behavior may PASS on Known-Gap alone.

## Risks and Mitigations

- Dirty-file overlap: baseline snapshots/hashes and narrow hunks; stop on unexpected concurrent changes, preserve others' work.
- Broken category routes hidden by streaming HTTP200: use reviewed tag existence and expected page identity/error markers; no status-only claim.
- Alias scope: 3D Carousels is narrower than generic Carousels; show accurate label and count.
- History and intercepted modal state: single final URL per normal click and existing Studio hard navigation; verify Back/Forward.
- Gated features: source implementation is not permission to grant public access; true missing-feature placeholders and unchanged admin visibility checks.
- Dense unavailable badge layout: flexible label/badge row; mobile44px minimum, avoid forced32px mobile targets.
- Reference inspection incomplete: report precise limits; do not invent mobile/reference menu behavior or assert pixel parity.

## Integration Notes

Dependencies: current Clerk state, navigation atoms/hooks, existing Next routes, tag-count hook, Sidebar/Sheet and Studio helper. Existing sorting maps Featured→recommended, Newest→date. No network/backend changes. During loading, unavailable status is stable reviewed metadata; counts may load independently. Server gate stays authoritative even if a sidebar UI error exposes a link. Missing tag rows are not seeded by a sidebar project.

## Rollback and Change Management

Local-only rollback removes exactly this task's hunks using recorded file snapshots/diffs, preserving prior dirty edits. Never git reset/checkout whole files. No DB rollback/deploy needed. If feature availability changes before execute, recheck mapping and update plan/validate contract before changes. Any shared hook/primitive/route/API/dependency/data change is scope expansion requiring review; halt that edit and continue independent in-scope proof.

## Resume and Execution Handoff

Selected plan: `process/features/higherbits-redesign/active/sidebar-reference-adaptation_13-10-26/sidebar-reference-adaptation_PLAN_13-10-26.md`.

Last completed: investigation, mapping and V1–V7 conditional validation; no application implementation. Validate-contract status: CONDITIONAL, user accepted recommended P1–P6 by ENTER EXECUTE MODE after V5 menu; no code completion claims. Supporting context: product AGENTS.md, process/context/all-context.md, planning/all-planning.md, tests/all-tests.md, generate-plan skill/reference, current source/tests/configs, report, reference-items.json, screenshot. Vault capability-use protocol read because product copy absent. Graphify query ran against product graph; no code graph update required for plan-only writes.

Next for fresh agent: read investigation, validation report and exact plan/contract. User has explicitly authorized execution with ENTER EXECUTE MODE; do not ask again. Execute this one plan only. Record dirty baseline first. No deployment/commit. Preserve unverified reference limitations and auth/runtime conditional gates.

## Strategy Comparison

One tightly coupled sidebar,4 application/test files, existing tests, no service changes or independent implementation phases. Sequential: one owner plus reviewer, lowest coordination cost (~1× baseline); recommended. Parallel subagents: two editors on overlapping UI/config/tests, roughly1.5–2× token/coordination estimate, conflict risk. Workflow: research/validate/execute/review handoff, roughly1.2× estimate, appropriate phase governance but no extra coding fan-out. Coordinated parallel team: three roles, roughly2–3× estimate, unnecessary overhead for this bounded task. Estimates are relative planning estimates, not measured billing. VALIDATE should use one selected plan and bounded independent review where required by protocol; execution remains one editor followed by required code review.

## Validate Contract

Status: CONDITIONAL
Date: 13-10-26
date: 2026-10-13
generated-by: outer-pvl
Parallel strategy: sequential
Rationale: One coupled sidebar implementation in four existing app/test files; one editor followed by independent code review. Independent validation dimensions were reviewed in bounded parallel waves.

User decision: `ENTER EXECUTE MODE` immediately after V5 menu; root orchestrator confirmed this accepts the recommended P1–P6 conditional gate and authorizes execution. No prior finalized contract exists; supersedes does not apply.

Test gates:

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC1/2 | preserve mapped sidebar composition | Fully-Automated | Focused Vitest command below:105 mapping rows/78 category rows, required order/groups/omissions, no false expansion | B |

Failing stub:
```js
test("should preserve mapped sidebar composition", () => { throw new Error("NOT IMPLEMENTED — TDD stub: preserve mapped sidebar composition") })
```

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC3/4 | resolve aliases and clearly disable unavailable rows | Fully-Automated | Focused Vitest:25 disabled categories, product placeholders, zero-count links,5 aliases/count/active keys, original exports unchanged | B |

Failing stub:
```js
test("should resolve aliases and clearly disable unavailable rows", () => { throw new Error("NOT IMPLEMENTED — TDD stub: resolve aliases and clearly disable unavailable rows") })
```

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC5 | preserve role and identity navigation | Fully-Automated | Focused Vitest guest/non-admin/admin composition, unresolved identity no undefined href, no unauthorized publish action | B |

Failing stub:
```js
test("should preserve role and identity navigation", () => { throw new Error("NOT IMPLEMENTED — TDD stub: preserve role and identity navigation") })
```

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC6 | synchronize root component URL sort without extra navigation | Fully-Automated | Focused Vitest isolated real-Jotai consumer/route-rerender fixture:date/default/invalid/history-like updates, one push, modifier no mutation, category/library unaffected | B |

Failing stub:
```js
test("should synchronize root component URL sort without extra navigation", () => { throw new Error("NOT IMPLEMENTED — TDD stub: synchronize root component URL sort without extra navigation") })
```

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC7/8 | dismiss the real mobile sidebar accessibly | Fully-Automated | Focused Vitest real MainSidebar+SidebarProvider/mobile hook:dialog title, Close/Escape/focus, expansion/filter semantics, promotion absent | B |

Failing stub:
```js
test("should dismiss the real mobile sidebar accessibly", () => { throw new Error("NOT IMPLEMENTED — TDD stub: dismiss the real mobile sidebar accessibly") })
```

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC9 | preserve scoped baseline without introduced regressions | Fully-Automated | Baseline/post focused Vitest, tsc and scoped diff/hashes; no app writes beyond four targets | B |

Failing stub:
```js
test("should preserve scoped baseline without introduced regressions", () => { throw new Error("NOT IMPLEMENTED — TDD stub: preserve scoped baseline without introduced regressions") })
```

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC5 | real identity navigation and server gate preservation | Hybrid | Running local app plus genuine guest/non-admin/admin sessions; deterministic identity/destination/redirect assertions described above | B |
| AC6 | browser navigation/history and modified-click behavior | Hybrid | Local browser final URL/sort/active assertions after ordinary click, direct/reload, Back/Forward and modified click | B |
| AC7/8 | keyboard/mobile dismissal and independent scrolling | Hybrid | Local browser focus/ids/search/Help and320/390/767–769 geometry/state assertions described above | B |
| AC8/10 | HigherBits visual readability/branding | Agent-Probe | Light/dark screenshots at1920×980,1280×720,320×568,390×844; judge wrapping/contrast/footer/density, record reference limits | B |

gap-resolution legend: A — proven now; B — fixed/proven by this plan during implementation; C — deferred named phase; D — backlog residual. All rows use B: planned gates are not already passing tests. Known-Gap is not a proving strategy.

Exact focused command: `corepack pnpm --filter web test components/features/main-page/__tests__/sidebar-layout.test.tsx app/__tests__/landing-sidebar-toggle.test.tsx`.
Exact type command: `corepack pnpm --filter web exec tsc --noEmit`.

Legacy line form:
- Sidebar composition/availability/aliases/identity/sort/mobile semantics: Fully-automated: focused Vitest command above.
- Scope/regressions: Fully-automated: focused Vitest plus tsc baseline/post comparison and scoped diff.
- Real role/navigation/control/mobile flows: hybrid: local browser deterministic assertions + running local app and genuine accessible sessions.
- Branding/visual layout: agent-probe: required theme/viewport screenshots and readability review.

Dimension findings:
- Infra fit: PASS — existing tools/scripts/write paths fit; no runtime server readiness claim.
- Test coverage: CONCERN — P2–P4 amend fixtures/mobile proof and deterministic gates; implementation must run them.
- Breaking changes: CONCERN — P1 supplies missing root URL-sort sync without touching shared hook.
- Security surface: PASS — unchanged auth/admin/server gates; no data/API/dependency changes.
- Baseline and test preparation feasibility: CONCERN — preserve dirty snapshots; narrowly replace obsolete expectations.
- Metadata and presentation feasibility: PASS — immutable scoped metadata/current primitives/handlers support plan.
- Runtime proof feasibility: CONCERN — browser/server/genuine sessions INCONCLUSIVE; mandatory execution proof or exact residual disclosure.

Open gaps: Runtime local boot, genuine role sessions, real history/mobile/scroll/visual proof pending implementation. Reference mobile/key/scroll/menu parity remains an explicit inspection limitation. No unresolved FAIL or deferred out-of-scope implementation requirement.

What This Coverage Does NOT Prove:
- AC1/2 mapping/composition tests do not prove pixel parity or live route availability.
- AC3/4 alias/disabled tests do not prove backend routes remain available after data changes.
- AC5 mocked role/identity tests do not prove Clerk/server authorization; genuine-session Hybrid proof remains required.
- AC6 Jotai/rerender tests do not prove browser history/new tabs or actual component ordering; browser Hybrid proof remains required.
- AC7/8 jsdom tests do not prove actual geometry/scroll/contrast or browser focus behavior; Hybrid and visual checks remain required.
- AC9 typecheck/diff gates do not prove runtime behavior or clean unrelated repository baseline.
- AC5 genuine-role browser checks cover only available tested sessions, not all auth lifecycle/security scenarios.
- AC6 browser matrix does not prove every unrelated navigation consumer; root-only sync protects category/library state through targeted cases.
- AC7/8 browser matrix covers specified viewport/control scenarios, not every assistive technology/device.
- AC8/10 screenshots do not prove keyboard/access/server permissions; reference mobile parity is not verified.

Gate: CONDITIONAL (concerns noted, user accepted; P1–P6 plan amendments applied)
Accepted by: user — `ENTER EXECUTE MODE` after V5 menu; accepted P1 URL-sort sync, P2 fixture repair, P3 real mobile tests, P4 deterministic Hybrid gates, P5 runtime readiness/real-session concerns, P6 source-reference correction. These authorize implementation with required checks, not fabricated PASS results.

## Autonomous Goal Block

Stored per standalone-plan contract requirement; this does not activate a goal or grant deployment authority. No umbrella plan governs this standalone sidebar task. The unrelated current-rebrand umbrella contains Stable Program Goal, but is not authority for this work.

```text
SESSION GOAL: Implement the approved HigherBits sidebar adaptation locally using the selected plan and accepted conditional contract.
Reference for latest state: process/features/higherbits-redesign/active/sidebar-reference-adaptation_13-10-26/sidebar-reference-adaptation_PLAN_13-10-26.md
Scope: only four listed application/test files and colocated task evidence; preserve HigherBits branding, existing routes/navigation/permissions and unrelated dirty work.
Autonomy rules: user authorized ENTER EXECUTE MODE; apply P1–P6 and run mandatory focused/baseline/runtime checks without repeating approval. No missing product features.
Hard stops: no commit/push/deploy/data/dependency/auth/schema/API/shared primitive/hook changes; stop overlapping edits if baseline hashes drift; request scope amendment for necessary outside-file changes.
Next phase: EXECUTE, then independent code review and verification report.
Contract summary: CONDITIONAL accepted; root-components URL-sort synchronization plus genuine route/identity/mobile/history proof required. Unavailable sessions/tooling remain exact disclosed gaps.
Execute start command: ENTER EXECUTE MODE (already issued by user).
Completion: local sidebar behavior verified with screenshots and concise Coming soon/omission/inspection-limit report; final visual confirmation remains with user.
```

## Next Step

User accepted the V5 recommendations and issued ENTER EXECUTE MODE. Proceed with this selected four-file implementation, baseline first; do not ask for approval again. Keep changes local; no commit/push/deploy. Record exact residual runtime gaps without claiming verification.
