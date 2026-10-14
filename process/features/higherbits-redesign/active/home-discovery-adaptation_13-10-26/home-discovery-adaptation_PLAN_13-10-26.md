# HigherBits Home discovery adaptation — implementation plan

**Date**: 13-10-26
**Complexity**: COMPLEX, one execution stream
**Status**: ✅ VALIDATED CONDITIONAL for local EXECUTE; application code untouched at V6
**SPEC:** [home-discovery-adaptation_SPEC_13-10-26.md](home-discovery-adaptation_SPEC_13-10-26.md)

TL;DR: Compose the existing Home component feeds into a compact discovery page, add truthful category and public-content sections, and label unavailable capabilities precisely. One small public-count correction is necessary to keep category totals consistent with browse results.

## Context and Goals

The current `/?tab=home` is three component rows. The live 21st.dev Home uses a compact sidebar plus sectioned discovery, grouped categories, horizontally browsable cards, collection/library features, gradients, templates, and lower category rails. This plan adapts that hierarchy in HigherBits styling, with actual HigherBits content and destinations. The requested four screenshots were absent; the user selected the live page. The observed 21st.dev state did not show “The best navbars” or “Jump back in”; neither name is treated as a shipped reference contract. Some lower lazy rails and hover details remained uninspectable.

Use the clean worktree `/private/tmp/higherbits-home-discovery-20261013` on `codex/home-discovery-20261013` from `origin/main`. The original checkout contains extensive unrelated changes and must remain untouched. No deployment, application dependency, marketing page, or broad sidebar redesign belongs here.

## Goals and Success Metrics

1. A visitor can scan popular/new component cards, grouped categories, a real collection, libraries, heroes, gradients, templates, and applicable lower category rows on Home.
2. Every available card and “View all” link opens a verified HigherBits browse or preview destination. Any unverified purchase/install action is absent from Home.
3. Category numbers in a fresh successful count response match the public tag browse query, including its auto-index approval rule; errors never masquerade as zero. The existing five-minute cache can briefly lag new approvals or delistings.
4. Public gradient creation, personalized history, and unverified editorial curation are visibly and accessibly “Coming soon.”
5. At 1280, 820, and 390 CSS-pixel widths in both themes, content remains readable and reachable; row arrows, keyboard focus, touch scrolling, and reduced motion work.

## Scope and Reference Mapping

| Live 21st.dev area | HigherBits Home behavior | Source / evidence | State |
| --- | --- | --- | --- |
| Fixed sidebar and search | Reuse `MainSidebar`; keep existing desktop/mobile navigation and command search | `sidebar-layout.tsx` | Keep working |
| Top today | “Popular” from `useMainDemosExcludingFeatured`; no daily ranking claim | `get_demos_list_v2` downloads sort | Implement |
| New & noteworthy | “New additions” from `useLatestDemos` | Public date sort | Implement |
| Grouped categories/counts | Marketing Blocks and UI Components from `sidebarCategories`, with public counts only | Existing taxonomy and tag routes; counts API currently unsafe | Implement with count correction |
| Curated collection | “Collections” using public `get_collections_v1`; one eligible card plus browse link; no “best” claim | Live Animated Blocks: five components at `/c/animated-blocks` | Implement; curation badge Coming soon |
| Featured library | A factual, text/local-asset “Browse libraries” entry point; no copied 21st-derived icon, description, popularity, or install claim | Live public `/?tab=libraries`; `LIBRARIES_DATA` is an auto-generated 21st.dev-matching catalog | Implement factual browse |
| More heroes | “More heroes” from public `/s/hero` content; no browsing-history explanation | `useTagDemos("hero", …)` and tag route | Implement |
| Gradients | Public gradient component row and `/s/gradients` | Live page has nine cards | Implement browse |
| Create a gradient | No public route | Studio gradient editor is restricted | Coming soon action |
| Templates | Public catalog preview and `/?tab=templates`; no payment action on Home | Live catalog has one “template test” card; purchase unverified | Implement browse only |
| Lower category rails | Avatars, Tabs, AI Chats when each public query has data; show honest empty/failed state when requested | Existing tags `/s/avatars`, `/s/tabs`, `/s/ai-chat` | Implement conditionally |
| ASCII art | No verified content/category destination | Existing sidebar marks it unavailable | Coming soon preview |
| New/promising libraries | “Explore libraries” without ranking | Same public library catalog | Integrate once, no duplicate row |
| Explore everything | Links to the main component catalog and populated categories | `/?tab=components` and `/s/[tag_slug]` | Implement |
| Jump back in | No persisted recently viewed source | Code research found none | Coming soon preview, no personal data claim |
| 21st-specific brands and tools | No equivalent | No meaningful HigherBits route | Omit |

The Home body should appear in this exact order: **Popular → New additions → Categories → Collections → Browse libraries → More heroes → Gradients → Templates → Featured → populated lower category rails (Avatars, Tabs, AI Chats in that order) → ASCII art Coming soon → Explore everything → Recently viewed Coming soon**. Do not render a fabricated editorial card or a duplicate “promising libraries” rail. A section backed by a failed request renders a small error message and retry; a successful empty result renders an explicit empty state, except lower optional category rails may be withheld only when their zero count is known. Initial loading uses existing skeletons; no skeleton remains after failure.

## Architecture and Data Flow

1. `HomeTabLayout` stays the single Home composition point. It keeps the existing featured, newest, and popular hooks and `HorizontalSlider`; `buildHomeSections` keeps its three factual criteria. Reorder presentation in the layout rather than turning `home-sections.ts` into a generic section registry.
2. Query the finite Home-only tags `hero`, `gradients`, `avatars`, `tabs`, and `ai-chat` through existing `useTagDemos` with `p_include_private: false`, a bounded preview limit, and the tag route as “View all.” Do not call a hook in a loop or fetch dozens of tags. Show the preview array for each row, but use `total_count` for its count; if a zero-row RPC cannot return a total, treat it as known zero for that tag only. Do not derive exact counts from a truncated preview.
3. The grouped category grid takes names, order, icons, canonical hrefs, and `comingSoon` flags from `sidebarCategories`. Select a compact subset of working categories with positive public counts **plus a small intentional subset of relevant disabled Coming soon categories regardless of count**; a “Browse all” route opens the existing Components sidebar/category browse. Never use historical `demosCount` values from `navigation.ts` as current totals or display numeric zero on a failed count request.
4. Correct `/api/tags/counts` to return counts for the same **visible demo set** as `get_demos_list_v2`: count `demo_tags` only using `COUNT(DISTINCT d.id)` per slug (the browse RPC uses `EXISTS`), join demos/components and both required public profile rows, require `components.is_public = true`, and apply `auto_index_component_has_current_approval` for auto-index components. One additive SQL function `public.get_public_demo_tag_counts()` aggregates by slug in one database query. Use `SET search_path = pg_catalog, pg_temp` with all application objects schema-qualified; revoke EXECUTE from `PUBLIC`, `anon`, and `authenticated`, then grant only to `service_role`. The existing API calls this function through the server-side service client, preserves `{counts}` JSON and cache headers, and returns 500 on failure. Keep no user/creator identifiers in the response. Update the generated Supabase function typing or a narrow local return type, whichever compiles without weakening the type boundary.
5. `useCategoryTagCounts` should let React Query expose `isError` instead of swallowing failures into `{}`. Existing sidebar may omit count on error; Home shows an error/retry and no numeric count. Since the endpoint's response key and query key remain stable, the sidebar and Home share cached data.
6. Fetch public collections with the existing `get_collections_v1` shape used in `CollectionsContainer`; show a collection only if it has a usable slug and public component preview. Choose the first eligible item in response order, link to `/c/[collection_slug]`, and link section “View all” to `/?tab=collections`. Do not hardcode Animated Blocks as a permanent editorial pick. If no eligible collection exists, display a truthful empty collections message and retain the browse link.
7. Render one factual “Browse libraries” entry point to `/?tab=libraries` using Home typography and a local or CSS-only graphic. Do not copy the auto-generated 21st.dev-matching `LIBRARIES_DATA` names, third-party icons, descriptions, metrics, install commands, or “featured/promising” claims into Home. If a specific HigherBits-owned library is later verified, it may replace this entry only with recorded source and destination proof.
8. Fetch public templates through the existing `get_templates_v3` query shape. Display up to three preview cards and a `/?tab=templates` browse link. Home template cards route only to the verified catalog, avoiding `TemplateCard`'s mobile `payment_url || "#"` behavior. The creation/purchase action is not advertised. A missing image uses the existing image fallback; a failed query shows an error instead of a faux template.
9. Put small presentation-only cards/tiles in `apps/web/components/features/home/` and reuse existing Card/Button/Badge and theme tokens. `HorizontalSlider` retains its component-card navigation; add an optional one-line description/accessible scroll labels and a reduced-motion-safe arrow behavior only if needed by the new Home rows. No autoplay, new carousel package, hotlinked asset, or new source of truth.
10. Keep the existing `page.client.tsx` Home branch and sidebar ownership. Use responsive grid/overflow classes in Home: horizontal rails maintain an evident partial next card; grouped categories collapse from desktop multi-column to tablet two-column to mobile one-column; all row controls are ≥44 CSS pixels on touch layouts, visible-focus, and non-trapping. Light theme uses existing semantic tokens, not hardcoded dark-only colors.

### Failure modes and tradeoffs

| Risk | Mitigation / proof |
| --- | --- |
| Private or unapproved auto-index entries counted | SQL visibility predicate mirrors browse RPC, service-only execute, SQL fixture and API tests |
| Count changes alter sidebar | Shared endpoint contract unchanged; existing sidebar error/no-count regression and category click proof; a fresh response has predicate parity, while existing cache may lag up to five minutes |
| SQL function unavailable in runtime DB | Migration is additive and deploy is excluded; use the focused disposable PGlite fixture for aggregate logic, record the hosted-integration residual, and show count error/no number at runtime until the function exists |
| More queries slow Home | Fixed five tag queries, one aggregate count RPC, React Query cache; no all-category per-tag fan-out; capture request count and settled state |
| Template purchase or library install falsely implied | Home links only to verified browse views; no transactional control or numbers |
| Poor mobile scroll or keyboard focus | Existing scroll primitive, visible arrows with labels, swipe/keyboard browser gate at 390/820/1280 |
| Reference changed or lazy rail unknown | Lock observed hierarchy and verify screenshots; no invented uninspected names |
| Upstream test failures | Compare to clean worktree baseline and report only new failures; no unrelated fixes |

## Touchpoints

| File or package | Planned change |
| --- | --- |
| `apps/web/components/features/home/home-layout.tsx` | Compose ordered sections, bounded data queries, real links, state boundaries |
| `apps/web/components/features/home/horizontal-slider.tsx` | Minimal description/scroll accessibility or reduced-motion change if needed by Home |
| `apps/web/components/features/home/home-sections.ts` | Retain factual 3-feed mapping; rename “Newest” to “New additions” only if presentation is not overridden in layout |
| `apps/web/components/features/home/home-discovery-sections.tsx` | Small local category/collection/library/template/coming-soon presentation, without new shared abstraction |
| `apps/web/app/api/tags/counts/route.ts` | Replace raw link-row aggregate with service-only public count RPC; same JSON contract |
| `apps/web/lib/queries.ts` | Preserve count query error state; reuse existing tag hook |
| `apps/web/types/supabase.ts` | Narrow additive RPC type if required by typed `rpc()` call |
| `supabase/migrations/20261013_public_demo_tag_counts.sql` | Add service-only aggregate function; no table/schema mutation |
| `supabase/migrations/20261013_public_demo_tag_counts.verify.sql` | Disposable-DB fixture verifies public/private/approval/duplicate-tag semantics and execute privileges |
| `ops/pglite-verify-public-demo-tag-counts.mjs` | Reuse installed PGlite to bootstrap minimal disposable schema/roles and deterministic approval-helper stub, run migration plus fixture, and assert aggregate behavior/privileges; no production connection |
| `apps/web/app/api/tags/counts/__tests__/route.test.ts` | Contract and error tests |
| `apps/web/components/features/home/__tests__/home-sections.test.ts` | Updated wording/order if changed |
| `apps/web/components/features/home/__tests__/home-discovery-sections.test.tsx` | jsdom data/empty/error/coming-soon and category selection tests, including zero-count future entries |
| `apps/web/e2e/home-catalogue.spec.ts` | Settled-state order, route and responsive interaction tests, replacing old exactly-three assumption |
| `apps/web/e2e/empty-loading-states.spec.ts` | Existing Home settled-state gate, extend only if needed |
| `apps/web/e2e/home-discovery-a11y.spec.ts` | Home-specific light/dark axe baseline/diff with route identity; do not add the Home tab directly to the generic a11y spec with its known 58 tab-surface contrast findings |

Read-only callers and contracts to inspect during EXECUTE: `apps/web/app/page.client.tsx`, `apps/web/components/features/main-page/sidebar-layout.tsx`, `apps/web/lib/navigation.ts`, `apps/web/components/features/collections/collections-list.tsx`, `apps/web/components/features/libraries/libraries-list.tsx`, `apps/web/components/features/templates/templates-list.tsx`, `apps/web/app/s/[tag_slug]/page.tsx`, `supabase/rpc-functions.sql`, and `apps/web/playwright.config.ts`.

## Public Contracts

- `GET /api/tags/counts` remains public `200 {"counts": {"tag-slug": number}}` and `500 {"error": string, "counts": {}}`; successful counts represent demos visible through the public tag browse query. Cache policy stays five minutes plus stale-while-revalidate.
- `public.get_public_demo_tag_counts()` returns `(slug text, demo_count bigint)` only to `service_role`. The public endpoint is the only web caller. Function has no input and returns no user data.
- Existing component/collection/tag/template URLs and sidebar permissions stay unchanged. No new public purchase/install/creator-editor API is introduced.
- The additive migration is reversible by dropping this one function and restoring the previous API route; no rows or user content change. It must not be applied to production in this task.

## Blast Radius

One Next.js web surface, one existing public JSON endpoint, one additive Supabase function, its generated type, a focused `ops/` PGlite test runner, and focused tests. No database table change, data migration, auth flow, billing flow, deployment, dependency, or other package change. The SQL function uses service privileges only; the public API must filter private and unapproved data before aggregation. The original dirty checkout is outside the blast radius.

## Security and Permission Review

STRIDE focus: information disclosure is the primary risk (raw tag counts can reveal private or unapproved content); denial of service is secondary (a per-category query fan-out could tax the database). The aggregate must mirror public list visibility with `COUNT(DISTINCT d.id)` per slug, return only slug/count, schema-qualify application objects, set `search_path = pg_catalog, pg_temp`, grant only `service_role` execution, and avoid user parameters. Test `has_function_privilege` for `PUBLIC`, `anon`, `authenticated`, and `service_role`. The endpoint must reject or report SQL errors rather than expose exception detail. Tampering and elevation are limited because there is no write operation or caller-chosen filter. Existing permission checks on Studio/creator routes stay intact. The focused PGlite fixture verifies this function's logic but not hosted Supabase configuration or the current approval helper's internals; retain that residual explicitly.

## Phased Execution Workflow

This is one controlled execution stream, not a multi-plan program. The user has entered EXECUTE and invoked Autopilot after the V4 findings were disclosed; implementation still waits for this Validate Contract. Implement three sequential sections and run each section's gate before moving on: (1) public-count contract; (2) Home composition and cards; (3) interaction, responsive, and accessibility verification. No section is marked verified on compile alone. If the count migration cannot be tested on a disposable database, mark the count gate conditional and report the gap rather than silently showing a numeric count. All browser checks run from this worktree on an unused port **3201**, not the original checkout's port 3100; prove the process cwd and empty target port before Playwright starts.

## Phase Completion Rules

A section is ✅ VERIFIED only after its integration flow, manual browser check, data/public-count check, error path, and user-visible result are evidenced. 🔨 CODE DONE means code without full proof; 🧪 TESTING means gates in progress; 🚧 BLOCKED means a required proof failed. User confirmation may be requested after the complete local preview, but a successful build alone is not confirmation.

## Implementation Checklist

1. In `apps/web/app/api/tags/counts/__tests__/route.test.ts`, replace the old raw-join expectation with a red test for one service-only aggregate RPC result, JSON/cache compatibility, and SQL failure returning 500.
2. Add `supabase/migrations/20261013_public_demo_tag_counts.sql` with one grouped service-only function matching `get_demos_list_v2` public visibility: `COUNT(DISTINCT d.id)` per tag, both profile joins, public component predicate, and current auto-index approval. Set `search_path = pg_catalog, pg_temp`, schema-qualify all application objects, revoke from `PUBLIC`, `anon`, `authenticated`, and grant only `service_role`. Add `supabase/migrations/20261013_public_demo_tag_counts.verify.sql` with public/private/auto-index/duplicate association and `has_function_privilege` assertions. Add `ops/pglite-verify-public-demo-tag-counts.mjs` using the installed PGlite dependency to bootstrap a minimal disposable schema/roles plus deterministic approval-helper stub, execute migration and fixture, and exit nonzero on failure; do not access production. This proves the new aggregate logic, not hosted Supabase integration or the helper's internals. Review the tracked 20261008 approval-helper verification as complementary evidence; do not claim it was rerun unless it actually was.
3. Change `apps/web/app/api/tags/counts/route.ts` to call the function once and fold returned rows into the existing `{counts}` response; add only the necessary function type to `apps/web/types/supabase.ts`.
4. Update `useCategoryTagCounts` in `apps/web/lib/queries.ts` to preserve React Query error state; run the route unit test and add an existing-sidebar regression that omits numeric counts on error while preserving navigation. Define count parity against a **fresh** response; record the unchanged five-minute cache lag after approval/delisting.
5. Add red Home unit cases in `apps/web/components/features/home/__tests__/home-discovery-sections.test.tsx` with `// @vitest-environment jsdom` for category grouping/count visibility, a small set of zero-count disabled Coming soon categories, populated/empty/error sections, and non-navigating Coming soon controls. Force request errors and empty responses rather than inferring them from a missing spinner.
6. Build the compact static section shell and exact reading order in `home-layout.tsx` and `home-discovery-sections.tsx`, reusing HigherBits semantic theme tokens and existing sidebar without changing `page.client.tsx`.
7. Wire Popular/New additions/Featured and the five fixed tag feeds with bounded preview slices and real `/?tab=components` or `/s/<slug>` destinations; ensure empty/error/loading are distinct and remove personal or daily ranking wording.
8. Wire public collection and template previews with the documented safe destination policy. Add a factual text/local-asset Browse libraries entry to the existing route; do not copy 21st-derived library names, icons, descriptions, metrics, purchase, or install affordances. Home template cards remain browse-only because the existing mobile `TemplateCard` can open `payment_url || "#"`.
9. Add the precise Coming soon states for public gradient creation, editorial curation, ASCII art, and recently viewed, with visible badge/explanation and disabled accessible action.
10. Adapt `horizontal-slider.tsx` only as needed for readable section descriptions, named scroll arrows, focus and reduced-motion behavior; retain its existing card navigation and touch scroll.
11. Rewrite `apps/web/e2e/home-catalogue.spec.ts` around settled sections and real link/category behavior at 1280, 820, and 390 widths, retaining its explicit loaded-card wait. Force Home request errors/empty responses in the browser gate. Add `apps/web/e2e/home-discovery-a11y.spec.ts` with Home-specific route identity, light/dark axe signatures, and a before/after baseline comparison; do not directly add the tab route to the generic `a11y.spec.ts`, whose tab surface has known foreign contrast findings. Test reduced-motion arrow behavior.
12. Provision the existing lockfile dependencies without adding a package; use non-secret local dev configuration needed for public reads. Before browser tests, assert the runner cwd is this worktree and port 3201 has no listener; invoke Playwright with `PLAYWRIGHT_PORT=3201 PLAYWRIGHT_BASE_URL=http://localhost:3201` so it starts this worktree's server. Run scoped unit, `typecheck`, lint, Playwright, and focused PGlite SQL gates; capture dark/light desktop, tablet, and phone screenshots. Review the final diff for unrelated files, hardcoded metrics, broken routes, accessibility, and secrets. Run `graphify update .` after application code changes, then hand off the local preview for user review; do not deploy.

## Acceptance Criteria

The SPEC's criteria are preserved. VALIDATE refines browser/database proving strategies to Hybrid because they need reachable dev services or a disposable database; this does not change user-visible acceptance. Every criterion names a proving scenario below; each scenario names its criterion. A test cannot pass by observing only skeletons.

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
| --- | --- | --- |
| Home section-order and actual-card settled-state browser scenario | Hybrid | AC1 |
| Home card and View-all route scenario | Hybrid | AC2 |
| PGlite SQL visibility fixture + API contract + fresh Home-to-category comparison | Hybrid | AC3 |
| Mouse/keyboard/touch horizontal row scenario at 1280/820/390 | Hybrid | AC4 |
| Collection, library, gradient and template destination browser probe plus copy review | Hybrid | AC5 |
| Coming-soon click/keyboard non-navigation and accessible-name scenario | Hybrid | AC6 |
| Signed-out/no-history Home copy scenario | Hybrid | AC7 |
| Settled, empty, and forced-error Home scenario | Hybrid | AC8 |
| Light/dark 1280/820/390 screenshot and axe inspection | Hybrid | AC9 |
| Existing sidebar/search Home regression scenario | Hybrid | AC10 |

### Test tiers and exact gates

| Area | Tier | Command / precondition | Proves | Does not prove |
| --- | --- | --- | --- | --- |
| Web count/Home unit | Fully-Automated | `corepack pnpm --filter web exec vitest run app/api/tags/counts/__tests__/route.test.ts components/features/home/__tests__/home-sections.test.ts components/features/home/__tests__/home-discovery-sections.test.tsx components/features/main-page/__tests__/sidebar-layout.test.tsx` | Count response, Home state logic, sidebar caller | Live database privileges |
| Web types | Fully-Automated | `corepack pnpm --filter web typecheck` | Typed RPC and JSX | Browser behavior |
| Web lint | Fully-Automated | `corepack pnpm --filter web lint` | Lint gate | Visual quality |
| Browser flow | Hybrid | From this worktree, require `test -z "$(lsof -tiTCP:3201 -sTCP:LISTEN)"` and verify cwd; then `PLAYWRIGHT_PORT=3201 PLAYWRIGHT_BASE_URL=http://localhost:3201 corepack pnpm --filter web exec playwright test e2e/home-catalogue.spec.ts e2e/empty-loading-states.spec.ts` with reachable local public-data configuration | Real destinations, settled/error/empty states, responsive interaction | Production deployment or authenticated flows |
| Browser a11y | Hybrid | After the same port/cwd preflight, `PLAYWRIGHT_PORT=3201 PLAYWRIGHT_BASE_URL=http://localhost:3201 HIGHERBITS_E2E_STAGE=post corepack pnpm --filter web exec playwright test e2e/home-discovery-a11y.spec.ts`; compare Home baseline signatures captured before edits | Home theme/focus/axe regression | Existing foreign tab-surface violations or exact visual parity |
| SQL migration | Hybrid | `node ops/pglite-verify-public-demo-tag-counts.mjs` from the worktree root; runner creates only an in-memory fixture with minimal roles/schema, executes both planned SQL files, asserts DISTINCT public/approval behavior and `has_function_privilege` | New aggregate logic, duplicate-tag parity, and service-only grant in fixture | Hosted Supabase configuration, live migration state, or full approval-helper internals |
| Visual fidelity | Agent-Probe | Capture local Home at 1280/820/390 in dark/light; compare observed 21st hierarchy and HigherBits brand; inspect overflow and labels | Layout/visual intent | Exact uninspected 21st hover/lazy behavior |

The browser and SQL tests are **conditional until their local dependencies run**; they are not Known-Gap substitutions. The PGlite fixture can prove the aggregate but cannot prove hosted Supabase integration or replace a future non-production full-schema invocation. If its runner cannot be made executable, keep AC3 and numeric category rendering unverified rather than claiming a pass. If the isolated browser environment cannot be provided, keep AC1/AC2/AC4–AC10 conditional and record the blocker. The existing all-web suite may have 23 upstream failures on `origin/main` per the 13-10-26 baseline; scoped failures must be compared with an unchanged worktree baseline before attributing them.

## Test Infra Improvement Notes

The existing `home-catalogue.spec.ts` hardcodes exactly three sections and must be updated without losing its settled-card wait. The generic `a11y.spec.ts` excludes the Home tab because the tab browser has older color-contrast findings; use a separate Home audit and baseline comparison. Browser tests must route/intercept a request to force error and empty states. No general harness rewrite is in scope.

## Dependencies, Rollback, and Integration Notes

- Home category numbers depend on the additive SQL function and the API route update; do not merge UI that displays numerical counts before the aggregate fixture passes and a suitable non-production runtime function is available. Runtime failure should show an error/no number; existing cache may lag fresh content for five minutes.
- Existing React Query/Supabase, Next routes, scroll area, cards, theme classes, and lockfile PGlite are the only implementation dependencies. Installing the existing lockfile for this isolated worktree is permitted; add no package dependency.
- Roll back by reverting the Home/API changes and dropping `public.get_public_demo_tag_counts()` in a separate reversible migration after confirming no remaining caller. No data migration is involved.
- Stay on the isolated branch. No production migration, release artifact, deployment, or Vercel operation is authorized by this plan.

## Validate Contract

Status: CONDITIONAL
Date: 13-10-26
date: 2026-10-13
generated-by: outer-pvl
Parallel strategy: parallel-subagents
Rationale: 3/7 signals (public API/schema surface, high-risk trust boundary, 5+ touched files) justified independent validation reviews; EXECUTE uses one sequential implementation stream because SQL proof precedes truthful Home counts.

Test gates:

| criterion id | behavior | strategy | proving test | gap-resolution |
| --- | --- | --- | --- | --- |
| AC3, AC10 | Count API returns public shape or 500 and sidebar omits an unknown count | Fully-Automated | `corepack pnpm --filter web exec vitest run app/api/tags/counts/__tests__/route.test.ts components/features/main-page/__tests__/sidebar-layout.test.tsx` | B — update tests in this plan |
| AC1, AC6, AC8 | Home presentation order, unavailable controls, and forced empty/error states | Fully-Automated | `corepack pnpm --filter web exec vitest run components/features/home/__tests__/home-sections.test.ts components/features/home/__tests__/home-discovery-sections.test.tsx` with jsdom marker in new render test | B — add tests in this plan |
| AC3 | SQL aggregate counts distinct public demos and service-only grants in disposable fixture | Hybrid | `node ops/pglite-verify-public-demo-tag-counts.mjs`; precondition: existing lockfile dependencies installed | B — add runner and fixture in this plan |
| AC1, AC2, AC4, AC5, AC6, AC7, AC8, AC10 | Settled Home, real routes, interactions, copy, and request-driven states | Hybrid | Empty port 3201 and verified worktree cwd; `PLAYWRIGHT_PORT=3201 PLAYWRIGHT_BASE_URL=http://localhost:3201 corepack pnpm --filter web exec playwright test e2e/home-catalogue.spec.ts e2e/empty-loading-states.spec.ts` with reachable local public-data configuration | B — update scenarios in this plan |
| AC9 | Home light/dark axe signatures and responsive layouts | Hybrid | Same isolated server; `PLAYWRIGHT_PORT=3201 PLAYWRIGHT_BASE_URL=http://localhost:3201 HIGHERBITS_E2E_STAGE=post corepack pnpm --filter web exec playwright test e2e/home-discovery-a11y.spec.ts` and compare pre-edit Home baseline | B — add scoped gate in this plan |
| AC1, AC4, AC5, AC9 | Visual hierarchy, overflow cues, honest labels, and HigherBits branding | Agent-Probe | Inspect six 1280/820/390 dark/light local screenshots against the observed live reference | A — inspect during EXECUTE |
| AC3 | Full hosted-schema compatibility after later migration | Hybrid | Named residual: non-production full-schema smoke test in `process/features/higherbits-redesign/backlog/home-discovery-hosted-count-integration_NOTE_13-10-26.md` | D — backlog test-building stub; outside local task |

Failing stub (AC3/API, AC10):
```ts
test("should expose only public demo tag counts or a clear error to Home and sidebar", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: public count API and sidebar error state")
})
```

Failing stub (AC1, AC6, AC8/Home):
```ts
test("should distinguish populated, empty, failed, and coming-soon Home sections", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: Home discovery states")
})
```

gap-resolution legend: A — proven in this cycle; B — test added by this plan; C — named later phase; D — backlog test-building stub. `Known-Gap` is a residual, not a proving strategy.

Legacy line form:
- Count API and sidebar: Fully-automated: scoped Vitest command above; hosted database not proven.
- Home states: Fully-automated: scoped jsdom Vitest command above; live route behavior not proven.
- SQL migration: Hybrid: in-memory PGlite runner with minimal schema/roles and deterministic approval stub; real helper/hosted schema not proven.
- Browser flows: Hybrid: isolated port 3201, verified worktree cwd, reachable local public-data configuration.
- Accessibility and visual: Hybrid Home-specific axe baseline/diff plus Agent-Probe screenshots; pre-existing tab-surface violations remain separately identified.

Dimension findings:
- Infra fit: CONCERN — worktree initially lacks installed dependencies/env; psql/Docker absent, so PGlite and isolated port are required.
- Test coverage: CONCERN — corrected `typecheck` script, jsdom marker, forced request states, and Home-specific axe baseline are required.
- Breaking changes: CONCERN — endpoint semantics change from raw tag associations to public demo counts; response shape remains stable, distinct-count and sidebar regression are mandatory; five-minute cache lag remains.
- Security surface: CONCERN — service-role raw joins previously risk private/unapproved count disclosure; explicit visibility predicate, restrictive search path/grants, and fixture privilege tests are mandatory.
- Section 1 feasibility: CONCERN — migration is additive, but PGlite proves only the aggregate in a minimal fixture and cannot prove hosted integration.
- Section 2 feasibility: CONCERN — existing hooks/RPC shapes are usable; copied 21st-derived library data and zero-filtered future categories were removed from the plan.
- Section 3 feasibility: CONCERN — isolated browser identity, settled-card wait, response-driven error scenarios, and scoped accessibility comparison are mandatory.

Open gaps:
- Hosted Supabase full-schema/current-approval-helper integration: known-gap: documented as NEW PLAN REQUIRED — see `process/features/higherbits-redesign/backlog/home-discovery-hosted-count-integration_NOTE_13-10-26.md`. It is outside this local implementation and is not counted as a failure of the local Home gate.
- Local dependency/env availability and pre-edit Home axe baseline are execution preconditions; if absent, report affected ACs as unverified rather than claiming PASS.

## What This Coverage Does NOT Prove

- Vitest API/UI mocks do not prove SQL privileges or live routes.
- The PGlite minimal fixture does not prove the hosted Supabase function is installed, the full actual approval helper runs in that fixture, or production cache freshness.
- Playwright on the isolated dev server does not prove deployment, authenticated/private flows, template checkout, or production performance.
- Axe baseline/diff does not certify the entire app, remove pre-existing tab-surface contrast findings, or establish exact 21st.dev visual parity.
- Screenshot inspection does not prove unobserved 21st.dev lazy/hover behavior.

Gate: CONDITIONAL (the nine V4 corrections are recorded; remaining local test preconditions and the hosted-integration residual are explicit).
Accepted by: session — user explicitly entered EXECUTE for this Home plan, invoked Autopilot after the nine V4 concerns were disclosed, and confirmed sequential execution with standard hard stops/local-only scope.

## Autonomous Goal Block

```text
TARGET: Implement the selected Home discovery plan locally until its public-count logic, honest section states, routes, responsive behavior, and accessibility are evidenced. Work only in /private/tmp/higherbits-home-discovery-20261013; preserve the original checkout.

EXECUTE ORDER: 1 public-count SQL/API fixture and regression, 2 Home composition with verified content and precise Coming soon labels, 3 isolated-port browser/a11y/visual checks and focused review. Use one sequential implementation stream; no additional dependency or product feature. Keep the CONDITIONAL contract's hosted Supabase residual visible and never claim AC3 passed from an API mock or function definition alone.

HARD STOPS: Do not use Vercel, deploy, apply the migration to production, use the original dirty checkout, or advertise unverified purchase/install/history/metrics. On missing runtime function show error/no count. If disposable SQL or isolated browser proof cannot run, report the exact acceptance criteria unverified.

Reference for latest state: process/features/higherbits-redesign/active/home-discovery-adaptation_13-10-26/home-discovery-adaptation_PLAN_13-10-26.md
```

## Resume and Execution Handoff

- **Selected plan:** `process/features/higherbits-redesign/active/home-discovery-adaptation_13-10-26/home-discovery-adaptation_PLAN_13-10-26.md` in `/private/tmp/higherbits-home-discovery-20261013`.
- **Last completed phase:** VALIDATE (CONDITIONAL); no application implementation at V6.
- **Validate-contract status:** CONDITIONAL, accepted under the user's explicit Home EXECUTE + Autopilot confirmation after V4 disclosure.
- **Context loaded:** product `AGENTS.md`, `process/context/all-context.md`, `process/context/tests/all-tests.md`, completed SPEC, Home source/tests, tag-count route/tests, SQL browse RPC, live-reference findings from research.
- **Next fresh-agent step:** Run local EXECUTE on this exact contract in one sequential stream. Preserve hard stops, collect gate evidence, and leave deployment outside scope.

Cursor Plan mode may import the numbered checklist. RIPER-5 order for this task is RESEARCH → SPEC → INNOVATE → PLAN → VALIDATE → explicit EXECUTE approval → EXECUTE; source edits begin only in EXECUTE.
