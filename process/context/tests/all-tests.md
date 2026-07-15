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
**Total (CORRECTED 15-07-26 — see note below):** 4 test files / 10 tests, all passing:
`apps/web/lib/registry.test.ts`, `apps/web/components/ui/__tests__/footer-smoke.test.tsx`,
`apps/web/components/ui/__tests__/header-smoke.test.tsx`,
`apps/web/app/__tests__/landing-smoke.test.tsx`. The "123 tests across 27 files" text below
was found stale during `claymorphism-3d-redesign` Phase 01 EVL (15-07-26, independently
confirmed via `corepack pnpm --filter web test`) — the disk state did not match the documented
count, and no test files were deleted during that phase's execution (its diff touched only
`globals.css`, `.env.example`, and 2 new files under `apps/web/scripts/`). The drift predates
that phase; root cause not yet investigated — flagged as a `vc-audit-context` follow-up.
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
**Current route matrix:** `/`, `/magic`, `/magic-chat`, `/studio`, `/api-access`, `/contest`,
`/our-story`, `/templates` across light and dark themes.
**Latest known result:** 16 Chromium Axe checks passed on 2026-07-11 during
`higherbits-redesign` Phase 5 EVL.
**Limits:** unauthenticated only; does not prove Clerk-authenticated flows, pixel-perfect layout,
or visual diffs. The dedicated `agent-browser` screenshot CLI was unavailable in that environment.

### Mocking conventions established (vitest)

- Clerk: `vi.mock("@clerk/nextjs/server", () => ({ clerkClient: vi.fn(), auth: vi.fn() }))` — `clerkClient()` returns `{ users: { getUser: vi.fn(), updateUserMetadata: vi.fn() } }`
- Stripe: `vi.mock("stripe", () => ({ default: vi.fn(function () {...}) }))` factory-function pattern — `stripe.checkout.sessions.create`, `stripe.customers.create`, `stripe.customers.retrieve`, `stripe.webhooks.constructEvent`, `stripe.accounts.create`, `stripe.accountLinks.create` all mockable
- Octokit: `vi.mock("@octokit/rest", ...)` — same factory-function pattern as Stripe, applied to `.rest.git.getRef`, `.rest.git.createRef`, `.rest.repos.createOrUpdateFileContents`, `.rest.pulls.create` (established 2026-07-01 for `submit-component.test.ts`)
- Rate limiting: `vi.mock("@/lib/rate-limit")` — mock `checkRateLimit` and/or `checkSubmitRateLimit` directly to avoid hitting real Upstash Redis; assert on the exact key argument (e.g. `checkout:${userId}`) to prove userId-based (not IP-based) keying
- File system: `vi.mock("fs", () => ({ readFileSync: vi.fn() }))` for registry unit tests
- IntersectionObserver (jsdom): `global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }` — required when rendering components that use scroll/intersection hooks under jsdom (established Phase 17, `preview-demo.test.tsx`)
- jsdom per-file override: add `// @vitest-environment jsdom` at the top of a test file to use jsdom for that file only, without changing the global `environment: "node"` config (use for client-component render tests like pill selectors)

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
