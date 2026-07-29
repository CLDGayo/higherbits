---
name: context:tests
description: Test stack and verification entrypoint. Vitest live in apps/web; Playwright/Axe a11y checks cover the HigherBits route matrix; packages/db has node --test smoke coverage.
keywords: [tests, testing, verification, vitest, playwright, coverage, evidence-integrity, unit tests, type-check, rate-limit, connect, submit-component, webhook, demo, paywall, preview, theme, template, registry]
date: 2026-07-11
metadata:
  node_type: context-group
  type: context
  group: tests
---

# Tests - Group Router

## Scope

Test runners, commands, and verification strategy for Cozy Downloads.

**Current state (2026-07-06): Vitest LIVE in `apps/web`, 25 test files, all passing.** Phase 1 of the
monetization-catalog program installed vitest; subsequent phases (10, 12, 13, 14, security-hardening
pass, 17, 18, 19) added test files. Phase 18 resolved the 6 pre-existing baseline failures
(registry.test.ts/search.test.ts/views.test.ts rewrites); Phase 19 added 7 new tests on top of the
now-clean 80/80 baseline. cozy-21st-mirror Phase 3 (2026-07-06) added 5 new landing-page tests
(`page.test.tsx`, `hero.test.tsx`, `trending-strip.test.tsx`, `featured-strip.test.tsx`) on top of
the 97/97 post-Phase-2 baseline — established the async-Server-Component await-then-render RTL
pattern and fake-timer + `act()` debounce-assertion pattern for future component tests. The planned
stack is no longer future-only.

**HigherBits redesign Phase 5 (2026-07-11)** added a minimal Playwright + Axe accessibility harness
for unauthenticated visual-regression-adjacent coverage. `apps/web/e2e/a11y.spec.ts` checks `/`,
`/magic`, `/magic-chat`, `/studio`, `/api-access`, `/contest`, `/our-story`, and `/templates` in
both light and dark mode. It does not replace authenticated E2E or screenshot visual regression.

## Active test runner — apps/web

**Runner:** vitest `^1.6.0`
**Config:** `apps/web/vitest.config.ts` — `environment: "node"`, includes `**/__tests__/**/*.test.ts`, `passWithNoTests: true`, `@/` → `apps/web/` resolve alias (added 2026-07-01, matches tsconfig `@/*→./*`). Per-file `@vitest-environment jsdom` override supported — use in individual test files for client-component render tests (first use: `preview-demo.test.tsx`, Phase 17).
**Run command:** `corepack pnpm --filter web test`
**Total (RE-BASELINED 29-07-26, `supabase-interconnect` Phase 05 inner-PVL/EVL — corrects the
Phase 04 entry immediately below, which is now stale by 32 tests / 3 files): 114 tests / 24 files,
113 PASSING / 1 pre-existing failing.** Phase 05 added 3 new test files —
`apps/web/lib/__tests__/billing-provider-guard.test.ts` (15 tests — provider derivation, both-marker
ambiguity, the exact-`"active"` rule, every allow/block branch, the clearing patch, and the
fixture→endpoint mapping), `apps/web/app/api/stripe/webhook/__tests__/mutual-exclusion.test.ts` (8
tests — first-ever Stripe webhook coverage in this repo, v1+v2, all 4 required mutual-exclusion
cases), and extended `apps/web/app/api/lemonsqueezy/__tests__/webhook.test.ts` (+6 tests) — 29 new
tests at EVL-green (110/111). An independent adversarial review then found a CRITICAL fifth
`users_to_plans` writer (`GET /api/stripe/get-invoices`) the automated gates could not catch; the
EVL fix cycle added a 4th new test file,
`apps/web/app/api/stripe/get-invoices/__tests__/no-lemon-pollution.test.ts` (3 tests), bringing the
total to 113/114. The sole failure is the same pre-existing, unrelated `lib/registry.test.ts` case
carried since Phase 01. Also re-confirmed `tsc --noEmit`: repo-wide 1165 errors (up from the ~1163
Phase 04 baseline — foreign, from the user's ~147 concurrent uncommitted edits), with **zero errors
in any file this phase touched**, verified by scoped grep across every new/edited path. See
`process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-05-billing_REPORT_29-07-26.md`
and its `## EVL Fix Cycle 1` section. Treat **113/114 across 24 files (1 pre-existing failure), zero
new tsc errors** as the current regression baseline to hold.
**Prior entry (RE-BASELINED 29-07-26, `supabase-interconnect` Phase 04 inner-PVL/EVL — corrects the
Phase 03 entry immediately below, which is now stale by 9 tests / 3 files, SUPERSEDED above): 82
tests / 21 files, ALL 82 PASSING.** Phase 04 added 3 new test files —
`apps/web/app/templates/__tests__/templates-redirect.test.ts` (2 tests, proves `/templates` calls
`permanentRedirect()` not `redirect()`), `apps/web/app/__tests__/home-metadata.test.ts` (3 tests,
proves the home route's `generateMetadata({searchParams})` branches to the templates SEO metadata
for `tab=templates` and preserves the default `WebSite` JSON-LD otherwise), and
`apps/web/app/__tests__/orphan-route-comments.test.ts` (2 tests, enforces the orphan-route marker
comments on `/public-dashboard` and `/import-old`) — plus 2 new cases extending
`apps/web/components/features/main-page/__tests__/sidebar-layout.test.tsx` (asserts sidebar counts
render from `useCategoryTagCounts()`, not the hardcoded `demosCount` value, and that a zero-count
Explore item is filtered). All 3 new assertion families were mutation-tested (source deliberately
broken, observed to fail, restored) before being trusted — see
`process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-04-navigation_REPORT_26-07-26.md`
§"Anti-vacuous-green verification". Also re-confirmed `tsc --noEmit` at exit 0/0 errors. Treat
**82/21, all passing, tsc 0 errors** as the current regression baseline to hold.
**Prior entry (RE-BASELINED 26-07-26, `supabase-interconnect` Phase 03 inner-PVL/EVL — corrects the
Phase 02 entry immediately below, which is now stale by 11 tests / 1 file, SUPERSEDED above): 73
tests / 18 files, ALL 73 PASSING.** Phase 03 added `apps/web/app/api/cron/gen-usage-embeddings/__tests__/route.test.ts`
(11 new tests, all passing) on top of the clean 62/17 baseline — pure addition, zero regressions.
Also re-confirmed `tsc --noEmit` at exit 0 / 0 errors — the single foreign error the Phase 02 entry
below still lists at `add-registry-modal.tsx:233` (a different line number than the 168/389 pair
Phase 01 recorded — the file kept drifting across sessions) is gone as of 26-07-26, fixed by
further concurrent work outside this program. Independently re-measured this session:
`corepack pnpm --filter web exec tsc --noEmit` exit 0/0 errors,
`corepack pnpm --filter web test` → `Test Files 18 passed (18)`, `Tests 73 passed (73)`. Treat
**73/18, all passing, tsc 0 errors** as the current regression baseline to hold.
**Prior entry (RE-BASELINED 26-07-26, `supabase-interconnect` Phase 02 inner-PVL/EVL — corrects the
Phase 01 entry immediately below, which is now stale in the better direction): 62 tests / 17
files, ALL 62 PASSING.** The 4 previously-documented foreign `tsc --noEmit` errors in
`apps/web/components/features/studio/sandbox/components/add-registry-modal.tsx:168,389` and the 5
vitest failures recorded by Phase 01 (below) were fixed by a concurrent session between Phase 01's
26-07-26 close and Phase 02's 26-07-26 close — independently re-measured twice this session (once
before Phase 02 EXECUTE started, once at EVL confirmation), byte-identical both times:
`corepack pnpm --filter web exec tsc --noEmit` exit 0/0 errors,
`corepack pnpm --filter web test` → `Test Files 17 passed (17)`, `Tests 62 passed (62)`. Treat
**62/17, all passing** as the historical baseline superseded above — not the 57/5 figure below.
**Prior entry (RE-BASELINED 26-07-26, `supabase-interconnect` Phase 01 inner-PVL/EVL — corrects the
18-07-26 figure below, which undercounted, SUPERSEDED by the entry above):** 62 tests / 17 files,
**57 passing / 5 failing**.
The prior "48/15, all passing" claim was stale — it predates several unrelated test files that
landed between 18-07-26 and 26-07-26 (not attributable to `supabase-interconnect`, which touched
zero `apps/web` files). The 5 pre-existing failures span 4 files: `font-cozy-sweep.test.tsx`,
`landing-smoke.test.tsx`, `header-smoke.test.tsx`, and `api/magic/route.test.ts` (×2 failures).
Confirmed live-repeatable across 6 independent PVL/EVL cycles during Phase 01
(`corepack pnpm --filter web test` → `Test Files 4 failed | 13 passed (17)`,
`Tests 5 failed | 57 passed (62)`, byte-identical every run) — this is a genuine standing
baseline at the time, not run-to-run flake. Root cause of the fix not investigated (fixed by a
concurrent session outside this program); flagged as a `vc-audit-context` follow-up (see
`process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/` phase-01 report
and PVL iteration reports for the confirming commands from that baseline's era).
**Prior entry (RE-BASELINED 18-07-26, `claymorphism-reference-parity` Phase 4 EVL — corrects the
17-07-26 figure below):** 48 tests / 15 files, all passing. Phase 4 added
`apps/web/app/__tests__/font-cozy-sweep.test.tsx` (3 new AC5 tests — RTL class-presence assertions
for `font-cozy` on the hero h1/h2/nav-brand span and the dashboard h1 + 5 stat-tile number divs;
the sidebar Go-Premium card target is asserted at source-level class-presence rather than jsdom
render, since `sidebar-layout.tsx` needs Clerk/jotai/`useSidebar`-context providers impractical to
mock in jsdom).
**Prior entry (17-07-26, `claymorphism-reference-parity` Phase 1 inner RESEARCH — corrects the
16-07-26 figure below, which undercounted; new unrelated test files landed the same day: clay
charts/input/pill-button, hero-section, use-sidebar-visibility, public-dashboard/page.client,
amplitude, api/magic/route):** 37 tests / 13 files, all passing.
**Prior entry (UPDATED 16-07-26 — Phase 4 added 2 new test files, superseded by the re-baseline
above):** 11 test files / 29 tests, all
passing: `apps/web/lib/registry.test.ts`, `apps/web/components/ui/__tests__/footer-smoke.test.tsx`,
`apps/web/components/ui/__tests__/header-smoke.test.tsx`,
`apps/web/app/__tests__/landing-smoke.test.tsx` (baseline 4 files / 10 tests), 4 files from
`claymorphism-3d-redesign` Phase 3 (Component Library, 15-07-26):
`apps/web/components/ui/__tests__/clay-card.test.tsx` (3 tests — base render, depth-class
mapping, optional iconSrc/illustrationSrc props), `clay-input.test.tsx` (2 tests),
`clay-pill-button.test.tsx` (2 tests), `clay-charts.test.tsx` (2 tests — pill-bar + donut chart
render, with a local `ResizeObserver` stub for recharts' `ResponsiveContainer`), plus 2 new files
from Phase 4 (Page Assembly & Layout, 16-07-26):
`apps/web/components/ui/__tests__/hero-section.test.tsx` (jsdom smoke test asserting
`HeroSection` renders `ClayPillButton`/`ClayCard` markup, mocking `next/navigation`) and
`apps/web/app/public-dashboard/__tests__/page.client.test.tsx` (jsdom smoke + chart key-match
tests, mocking `@tanstack/react-query`'s `useQuery` — asserts Clay component rendering, the pink
upsell card's `bg-accent-pink`/"Get Pro"/`/pricing` markup, and `ChartConfig` key-to-`data[].name`
match). Class-presence assertions use raw `element.className.toContain(...)` —
`@testing-library/jest-dom` is NOT installed in `apps/web`, so `toHaveClass` is unavailable (see
Test Infra gap below). The "123 tests across 27 files" text further below was found stale during
`claymorphism-3d-redesign` Phase 01 EVL (15-07-26, independently confirmed via
`corepack pnpm --filter web test`) — the disk state did not match the documented count, and no
test files were deleted during that phase's execution (its diff touched only `globals.css`,
`.env.example`, and 2 new files under `apps/web/scripts/`). The drift predates that phase; root
cause not yet investigated — flagged as a `vc-audit-context` follow-up.

**Test infra gaps found (Phase 05, `supabase-interconnect`, 29-07-26):** (1) vitest emits a large
`tsconfig-paths` error block on every run, from stray `tmp/shadcn-ui/ui-main/templates/**/tsconfig.json`
files with unresolvable `extends` — pre-existing, non-fatal, but buries real output; fix would be
adding `tmp/**` to the vitest `exclude` or `ignoreConfigErrors`; (2) no RTL harness exists for
`BillingSettingsClient` — the cancel flow is only reachable through several nested components
(PricingTable → confirm dialog → `onConfirm`), so button-level wiring for provider-aware routing is
proven only at the decision-function level (see AC10 partial in the Phase 05 report), not via a full
click-through render.

**Test infra gaps found (Phase 3, 15-07-26):** (1) no `@testing-library/jest-dom` in `apps/web` —
`toHaveClass`/DOM matchers unavailable, tests use raw `.className` string assertions instead
(candidate future infra add, out of Phase 3 scope); (2) jsdom lacks `ResizeObserver` globally —
recharts-based component tests must stub it per-file (candidate: hoist a shared stub into a test
setup file).
Historical narrative below (file-by-file additions, mocking conventions) is retained for
context but the aggregate "123/27" figure is NOT current — do not cite it.

**Historical narrative (stale count, kept for per-file history):** 123 tests across 27 files — **all passing** (the 6 pre-existing failures tracked in
`process/features/monetization-catalog/backlog/preexisting-test-failures_NOTE_01-07-26.md` were
resolved as a side effect of Phase 18's registry.test.ts/search.test.ts/views.test.ts rewrites —
see that note's 04-07-26 addendum for confirmation). `apps/web/__tests__/clerk-webhook.test.ts`
grew from 3 to 8 tests (2026-07-09, 21st-promotion Phase 1) with new `user.created`/`user.updated`/
`user.deleted` branch coverage synced against the new `local_users` Prisma model.
`apps/web/__tests__/ui-primitives.test.tsx` (2026-07-09, 21st-promotion Phase 2) added 12 jsdom
smoke-render tests (`@vitest-environment jsdom` per-file override) — one per newly ported
`apps/web/components/ui/*` primitive (badge, card, label, separator, skeleton, avatar, tooltip,
checkbox, switch, progress, toggle, scroll-area). Proves render-without-throw only, not
visual/theme correctness — this repo has no automated visual-regression harness.
**Key files:** `apps/web/__tests__/checkout.test.ts` (9 tests, incl. rate-limit key-arg
assertion), `apps/web/__tests__/webhook.test.ts` (10 tests, incl. payment_status allow-list
cases), `apps/web/__tests__/connect.test.ts` (3 tests — account reuse/create/rate-limit),
`apps/web/__tests__/submit-component.test.ts` (3 tests — rate-limit/PR-flow/unauthorized),
`apps/web/app/actions/__tests__/submit-component.test.ts`, `apps/web/__tests__/registry.test.ts`
(Phase 19: added theme fixture — no Source block, contentType/installSnippet/paletteTokens
extracted — plus component contentType extraction case), `apps/web/__tests__/paywall-demo.test.ts`
(Phase 17: stripDemoPaywall all-demo locking; Phase 19: +2 theme installSnippet stripping parity
cases), `apps/web/__tests__/preview-demo.test.tsx` (3 tests, jsdom env — Phase 17: demo pill
labels, pill click, video tag guard), `apps/web/__tests__/catalog.test.ts` (Phase 19: +2
getCategoryEntries("templates")/("themes") fixtures).

## Active browser/a11y runner — apps/web

**Runner:** Playwright Chromium + `@axe-core/playwright`
**Config:** `apps/web/playwright.config.ts` — starts the Next dev server for the web package and
runs tests from `apps/web/e2e/`.
**Run command:** `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts`
**Package script:** `corepack pnpm --filter web test:a11y`
**Current route matrix (updated 16-07-26, `claymorphism-3d-redesign` Phase 4/5):** `/`, `/magic`,
`/magic-chat`, `/studio`, `/api-access`, `/contest`, `/our-story`, `/templates`, plus 2 routes added
in Phase 4 (`hero-section.tsx`'s route and `/public-dashboard`) — 10 routes total, light and dark.
**RE-RECONCILED BASELINE (18-07-26, `claymorphism-reference-parity` Phase 4 EVL — independent
vc-tester confirmation run found 6 real pre-existing fails, down from the 8 listed below; net
improvement, 0 NEW; also corrects a wrong "networkidle timeout" attribution made in the Phase 4
EXECUTE report — these are genuine axe color-contrast violations, not test-infra flakiness): 6
pre-existing fails, 0 new, on `/magic`, `/api-access`, `/contest`, `/templates`, `/public-dashboard`
(light mode).** Root cause of the count drop (8→6) not independently re-investigated this pass —
plausible explanation is route/matrix changes across Phases 2-4, not a fix; treat as the current
live count, not a claimed improvement to preserve.
**Prior entry (17-07-26, `claymorphism-reference-parity` Phase 1 EVL — corrects the 16-07-26 entry
below, which undercounted pre-existing failures by 3): 8 pre-existing fails, 0 new, out of the full
light+dark matrix.** The 8 pre-existing fails were:
1. **5× `color-contrast` on the app-wide `--muted-foreground` token** (`/magic`, `/api-access`,
   `/contest`, `/templates`, `/public-dashboard`, all light-mode) — same violation class documented
   16-07-26 below, unchanged.
2. **2× `link-name` (serious)** on `/` and `/magic-chat`, light mode — pre-existing, NOT introduced
   by Phase 1 (Phase 1's blast radius never touched these routes' link markup).
3. **1× `color-contrast` on `text-primary` (`#a490df`, 2.3:1)** on `/contest`'s Discord links,
   light mode — pre-existing, NOT introduced by Phase 1 (token/markup untouched by Phase 1).
Both new items (2 and 3) were discovered during Phase 1's EVL confirmation run and are pre-existing
app-wide conditions unrelated to any Phase 1 change; they were previously undercounted in this
file's 16-07-26 entry. Zero new violation classes or routes vs this reconciled baseline.
Tracked in `process/features/claymorphism-3d-redesign/backlog/preexisting-muted-foreground-contrast_NOTE_15-07-26.md`
(muted-foreground only) — the link-name and text-primary items are documented here as the smallest
correct home pending a dedicated backlog note if a future phase wants to fix them.
**Prior entry (16-07-26, `claymorphism-3d-redesign` Phase 5 EVL, superseded by the reconciled count
above): 13 pass / 5 fail — all 5 failures are the same pre-existing `color-contrast`-class violation
on the app-wide `--muted-foreground` token; zero new violation classes or routes.**
**Limits:** unauthenticated only; does not prove Clerk-authenticated flows, pixel-perfect layout,
or visual diffs beyond the dedicated screenshot spec below.

**New: `apps/web/e2e/visual-evidence.spec.ts` (added 16-07-26, `claymorphism-3d-redesign` Phase 5).**
A scoped Playwright spec capturing 8 screenshot artifacts (hero + `/public-dashboard`, each in
light/dark theme, each at desktop default + 375px mobile viewport) into the program's task folder
(`process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/`). Run:
`corepack pnpm --filter web exec playwright test e2e/visual-evidence.spec.ts`. This is the first
dedicated visual-evidence artifact in the repo — closes a visual-parity Agent-Probe debt that had
accumulated since the program's Phase 1 (no `agent-browser` CLI was available in that environment).

### Mocking conventions established (vitest)

- Clerk: `vi.mock("@clerk/nextjs/server", () => ({ clerkClient: vi.fn(), auth: vi.fn() }))` — `clerkClient()` returns `{ users: { getUser: vi.fn(), updateUserMetadata: vi.fn() } }`
- Stripe: `vi.mock("stripe", () => ({ default: vi.fn(function () {...}) }))` factory-function pattern — `stripe.checkout.sessions.create`, `stripe.customers.create`, `stripe.customers.retrieve`, `stripe.webhooks.constructEvent`, `stripe.accounts.create`, `stripe.accountLinks.create` all mockable
- Octokit: `vi.mock("@octokit/rest", ...)` — same factory-function pattern as Stripe, applied to `.rest.git.getRef`, `.rest.git.createRef`, `.rest.repos.createOrUpdateFileContents`, `.rest.pulls.create` (established 2026-07-01 for `submit-component.test.ts`)
- Rate limiting: `vi.mock("@/lib/rate-limit")` — mock `checkRateLimit` and/or `checkSubmitRateLimit` directly to avoid hitting real Upstash Redis; assert on the exact key argument (e.g. `checkout:${userId}`) to prove userId-based (not IP-based) keying
- File system: `vi.mock("fs", () => ({ readFileSync: vi.fn() }))` for registry unit tests
- IntersectionObserver (jsdom): `global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }` — required when rendering components that use scroll/intersection hooks under jsdom (established Phase 17, `preview-demo.test.tsx`)
- jsdom per-file override: add `// @vitest-environment jsdom` at the top of a test file to use jsdom for that file only, without changing the global `environment: "node"` config (use for client-component render tests like pill selectors)
- Billing/webhook mock-chain shape (established Phase 05, `supabase-interconnect`): the mocked
  `supabaseWithAdminAccess.from()` chain shape differs per route and must match what that route
  actually calls — `apps/web/app/api/lemonsqueezy/webhook/route.ts` uses `.maybeSingle()`;
  `apps/web/app/api/stripe/webhook/{v1,v2}/route.ts` use `.single()`. Copying one route's mock
  chain onto another silently no-ops the test. Assert on the mocked write call's **arguments or
  absence** (e.g. `expect(mockUpdate).not.toHaveBeenCalled()` /
  `expect(mockUpdate).toHaveBeenCalledWith(...)`), never on HTTP status — a webhook can return 200
  while silently doing (or skipping) the wrong write.

## Active test runner — packages/db (added 2026-07-09, 21st-promotion Phase 1)

**Runner:** Node built-in `node --test` (no vitest — this package predates the vitest install and stays on the lighter native runner for its first test).
**Run command:** `node --test packages/db/__tests__/prisma-client.test.mjs`
**Total:** 1 smoke test — confirms the generated Prisma client instantiates without throwing. Does NOT prove live-DB behavior, only that the generated client + schema/config combination is structurally sound.
**Context:** `packages/db` introduced Prisma (`prisma` + `@prisma/client` devDeps, net-new to the repo) in the 21st-promotion Phase 1 backend/schema merge. This is the package's first testable logic and first test script.

### Type gates (all packages)

```bash
corepack pnpm --filter @repo/ui type-check    # packages/ui TypeScript check
corepack pnpm --filter web type-check          # apps/web TypeScript check (tsc --noEmit)
corepack pnpm --filter @repo/db type-check     # packages/db TypeScript check (added 2026-07-09)
corepack pnpm --filter @repo/db build          # packages/db build — includes prisma generate wiring
```

### Build gate

```bash
corepack pnpm --filter web build   # Next.js build — requires apps/web/.env.local with format-valid Clerk key
```

Note: the build requires a format-valid `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `apps/web/.env.local`. A placeholder key (e.g. `pk_test_Y2xlcmsuZXhhbXBsZS5jb20k`) unblocks the build but breaks the dev runtime — see `process/context/all-context.md` Open Questions for the build-vs-runtime distinction.

## Read when

- Writing new unit tests for `apps/web` route handlers or utilities
- Setting up mocks for Clerk or Stripe in vitest
- Running the test suite or type gates
- Planning test strategy for new phases (E2E, component tests)

## Evidence-integrity checks (registry, recon)

Still useful after registry batch writes:

```bash
# fail if any registry file is missing a required frontmatter key
for f in docs/evidence-manifest/registry/*.md; do
  for k in Component_Name Category Screenshot_Path Network_Log_Path Dependencies Animation_Library Target_Execution_Phase AI_Behavioral_Summary; do
    grep -q "^$k:" "$f" || echo "MISSING $k in $f";
  done
done
```

## validate-registry runner (scripts/)

**Runner:** `node --test` (Node 22 built-in)
**Run command:** `node --test scripts/__tests__/validate-registry.test.mjs`
**Total:** 20 tests (10 pre-Phase-17 + 3 Demos cases from Phase 17, incl. security constraint cases
for bad video path/id + ~6 Phase 19 cases: template/theme Content_Type accepted, Palette_Tokens
valid/missing-name/missing-value/non-array error cases). All pass.

## gemini-asset-gen runner (ops/, added 15-07-26, claymorphism-3d-redesign Phase 2)

**Runner:** `node --test` (Node 22 built-in) — first confirmed-on-disk test file under `ops/__tests__/`.
**Run command:** `node --test ops/__tests__/gemini-asset-gen.test.mjs`
**Total:** 7 tests, all passing. Mocked via an injected `fetchImpl` parameter (no `global.fetch`
override, zero live network calls). Covers: graceful-absence when `GEMINI_API_KEY` is unset,
successful icon generation with mimeType-derived file extension, manifest write, manifest
idempotency (hash-match skip), `GEMINI_IMAGE_MODEL` fallback to the confirmed DEFAULT, and
fail-fast on an invalid/retired resolved model id.
**Note (drift consistency):** the `upload-seed-entries runner` and `github-ingest.test.mjs`
entries below were NOT independently re-confirmed on disk during this pass — see
`process/context/all-context.md` Open Questions for the broader `ops/`-subsystem documentation
drift flagged 15-07-26 (this repo's actual `ops/` contents as of that date were confirmed to be
`ops/README-seed.md`, `ops/seed-placeholder-components.mjs`, and the 3 new Phase 2 gemini files
only — a full `vc-audit-context` pass is needed to reconcile the rest of this file's `ops/`
claims).

## gemini-asset-chroma-key runner (ops/, added 16-07-26, `claymorphism-reference-parity` Phase 1)

**Runner:** `node --test` (Node 22 built-in).
**Run command:** `node --test ops/__tests__/gemini-asset-chroma-key.test.mjs`
**Total:** 10 tests, all passing. Exercises the pure exported pixel-classifier + band-detector +
despeckle functions against synthetic RGBA buffer fixtures only — zero real-asset file I/O.
**Context:** `ops/gemini-asset-chroma-key.mjs` is a one-time, ops-time-only script (uses `sharp`,
added as a root `package.json` devDependency the same phase — never imported by app code, never
bundled into the production build) that converted the 8 Gemini-generated clay assets under
`apps/web/public/clay/{icons,illustrations,textures}/` from fake-checkerboard JPGs to real-alpha
WebP (7 chroma-keyed + 1 plain re-encode). See
`process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-01-assets-css-foundation_REPORT_16-07-26.md`
for the algorithm writeup.

## upload-seed-entries runner (ops/, Phase 19)

**Runner:** `node --test` (Node 22 built-in)
**Run command:** `node --test ops/__tests__/upload-seed-entries.test.mjs`
**Total:** 2 tests, mocked `uploadToR2` — asserts the upload helper is NEVER called for `IsPro: true`
fixture markdown (logs a `SKIPPED ...` warning instead) and IS called exactly once for
`IsPro: false` fixture markdown. Guard mirrors the pattern hardened in `ops/github-ingest.mjs`
(commit 90fb7ed) — regression coverage for "Pro-gated source must never reach the public CDN
bucket."

## Planned additions (future phases)

- **E2E:** authenticated Playwright (`apps/web` storefront) is still needed for AC-3/AC-4 live paywall verification (Phase 1 known-gaps). Requires real Clerk dev keys. The unauthenticated Axe route matrix above is live, but it is not a full product E2E suite.
- **packages/ui:** no test runner configured yet
- **ops/ (ingest tool):** `ops/__tests__/github-ingest.test.mjs` exists (5 tests, `node --test`). `ops/__tests__/upload-seed-entries.test.mjs` exists (2 tests, Phase 19). `ops/copy-demo-video.mjs` has no automated test yet — Phase 18 backlog (`ops/__tests__/copy-demo-video.test.mjs`)
- **Coverage target:** 80%+ (per global dev workflow)

## Source paths (deeper docs)

- `apps/web/playwright.config.ts`
- `apps/web/e2e/a11y.spec.ts`
