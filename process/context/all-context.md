# HigherBits.dev - All Context

Last updated: 2026-07-13

Root context entrypoint for the repo. Use for (1) quick routing to the right context pack, (2) broad architecture + repo understanding. Start here before loading deeper context files.

---

## Project Identity (read first)

**CURRENT STATE CORRECTION (2026-07-13, supersedes the paragraphs immediately below):**
`apps/web` is NOT the small 5-9-component curated storefront described in the rest of this
section anymore. Following the `21st-promotion` (2026-07-09) and `higherbits-full-port` programs,
`apps/web` is the **full 21st.dev-derived application port** — marketplace, creator studio, Magic
MCP onboarding/console, contest, collections, pricing, and publish/draft flows all live and wired.
The registry/Qdrant-driven curated catalog described below is one surface within this larger app,
not the whole product. Brand identity is fully **HigherBits.dev** ("Higher Bits Labs Inc." in
legal/footer copy) — the `higherbits-cozy-rebrand` program (completed 2026-07-13, see
`process/features/higherbits-cozy-rebrand/completed/higherbits-cozy-rebrand_12-07-26/`) fixed the
double/missing-logo bug, swept all residual "21st" brand strings from `apps/web`/`apps/backend`
shipped code, and restyled the app to a **cozy claymorphism visual system**: pastel lavender/cream
("cozy daylight") + a dark "cozy dusk" theme, puffy 20-28px-radius cards with dual soft shadows,
a reusable CSS-only `.texture-cushion` grain/texture utility, pill buttons, and Quicksand-family
rounded typography — applied across header/sidebar/footer/landing/pricing/component-card surfaces.
**Monetization readiness (Lemon Squeezy, as of 2026-07-13):** legal/policy pages are live (`/terms`,
`/privacy`, `/refunds`, linked from the footer); `ops/seed-placeholder-components.mjs` seeded 8
components into the live DB; `/api/platform/stats` returns real (non-mocked) platform stats. Stripe
checkout code paths described later in this file are effectively dead/unconfigured pending a Lemon
Squeezy integration (blocked on user-supplied LS account credentials — see
`process/features/higherbits-cozy-rebrand/backlog/`). Studio publish flow additionally needs a
`CSB_API_KEY` (CodeSandbox) that is not yet provisioned.

**Original historical description (pre-full-port, retained for registry/Qdrant-catalog subsystem accuracy — the paragraphs below describe the registry-driven curated catalog subsystem, which still exists inside the larger app):**

**HigherBits.dev** is a premium **Next.js + Turborepo monorepo** UI marketplace — a high-end curated component, template, and theme aggregator. It showcases a growing catalog of original React UI components and ingest MIT-licensed components from GitHub via the `ops/github-ingest.mjs` tool. A **Qdrant vector database** powers behavior-based semantic search ("a soft pastel button", "a calm photo card") rather than name search, populated by an **n8n** ingestion pipeline that reads staged `docs/evidence-manifest/registry/` files.

**HigherBits.dev** provides a sleek, modern design language. The legacy React Bits port (the "128 ported components" in `@repo/ui`) was **PURGED** in commit `c08c2cb` to kill bundle bloat — those folders dragged `three`, `face-api.js`, `matter-js`, OGL, etc. into the webpack graph through the `@repo/ui` barrel. Disregard any older claim of "128 ported components"; it is obsolete.

**HigherBits redesign program — COMPLETE WITH CONDITIONAL VISUAL-PROBE GAP (2026-07-11, execution commit `0d9e6c0`).** The phase program at `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/` completed Phases 0-5: ground truth, tokens/typography, brand sweep, core chrome/landing, high-traffic surfaces, and long-tail QA. The web app now uses the HigherBits visual system across the targeted route set, with rogue large-radius classes normalized under `apps/web/app` and `apps/web/components`, production debug surfaces/logs removed from the Phase 5 blast radius, and Playwright/Axe a11y coverage added in `apps/web/e2e/a11y.spec.ts` for 8 routes across light/dark mode. Verified gates on 2026-07-11: `corepack pnpm --filter web build`, `corepack pnpm --filter web exec tsc --noEmit`, `corepack pnpm --filter web test`, `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts`, plus brand/radius/debug `rg` sweeps. Known gap: the `agent-browser` CLI was unavailable, so no dedicated screenshot artifact was created; automated a11y/source-token evidence is the accepted substitute. Unrelated dirty Supabase embedding/search changes under `supabase/functions/*` were explicitly excluded from the redesign commit and need a separate backend migration/debug plan before merge or deploy.

**Current seed data: 5 original Cozy components.** `@repo/ui` now contains ONLY the curated baseline — `soft-button`, `pill-button` (`cozy-buttons`), `lofi-card`, `polaroid-card` (`lofi-cards`), `calm-stack` (`minimalist-layouts`). These 5 render live in the Preview Engine and are the entire live component surface. The barrel (`packages/ui/src/index.ts`) exports only these three categories; its header documents the purge.

**Legacy catalog routes are placeholder-only.** `apps/web/lib/catalog.ts` still lists legacy React Bits slugs (text-animations / animations / backgrounds / components) as routing entries. Phase 2 (2026-06-28) DELETED the corresponding 134 legacy registry files from `docs/evidence-manifest/registry/` — those routes now fall back to `DEMO_SOURCE` harmlessly (force-dynamic + null-safe reads). Phase 3 will prune `catalog.ts` to the live 5 registry entries and rebuild routing dynamically. Until then, legacy slugs in catalog.ts are intentional placeholders.

**Server-side paywall (LIVE, registry-driven as of Phase 1).** The freemium gate is enforced on the SERVER, not via CSS blur. In `apps/web/app/(catalog)/[category]/[slug]/page.tsx`, Pro components (those with `IsPro: true` in their registry frontmatter — `lofi-card`, `pill-button`) have their raw `source`/`css`/`dependencies` stripped to a `LOCKED_SOURCE` placeholder before render. The old `apps/web/lib/tiers.ts` hardcoded Set was DELETED (Phase 1, commit 3ed6a40+); the gate now reads `entry?.isPro === true` from the registry entry. A signed-in user whose Clerk `publicMetadata.isPro === true` unlocks the real source.

**`ops/github-ingest.mjs` (MIT ingestion tool, hardened Phase 2).** Node script that ingests MIT-licensed components from GitHub into the curated registry/catalog. Phase 2 hardening (2026-06-28): UI_SRC_DIR write removed (no longer writes to packages/ui/src/); MIT gate changed from hard throw to structured warn+skip (`console.warn('SKIPPED…') + { skipped: true, reason: 'no-mit-license' }`); attribution fields renamed/extended: `Author` (was `Original_Author`), `Source_Repo` (repo URL, was `Author_URL`), `Content_Type`, `License_SPDX`, `IsPro: false` (default for ingested); heavy-dep warn gate for `[three, matter-js, @react-three/fiber, gsap, face-api.js, ogl]` (warn-only, sets `HeavyDeps: true`). Unit tests at `ops/__tests__/github-ingest.test.mjs` (4 tests, node --test runner, mocked fetch).

**Server-side paywall — registry-driven (Phase 1 complete, commit 3ed6a40+).** `apps/web/lib/tiers.ts` was DELETED as of Phase 1. The Pro gate now reads the `IsPro` frontmatter field from each registry entry via `apps/web/lib/registry.ts`. `lofi-card` and `pill-button` have `IsPro: true` in their registry files. `apps/web/app/(catalog)/[category]/[slug]/page.tsx` reads `entry?.isPro === true` directly — no import from `tiers.ts`. The old note about `isPro() in apps/web/lib/tiers.ts` is obsolete.

- **Dual Stripe billing (Phase 1 complete).** `apps/web/app/api/checkout/route.ts` accepts `?mode=subscription` (monthly) or `?mode=payment` (lifetime one-time). A Stripe Customer is created at checkout with `metadata.clerkUserId` so lifecycle events (`customer.subscription.deleted`, `invoice.paid`) can resolve the Clerk userId. `apps/web/app/api/webhooks/stripe/route.ts` handles 7 events. Webhook is idempotent (read-before-write).
- **Organization Billing & Seat Sync (Phase 12 complete).** `apps/web/app/api/checkout/route.ts` accepts `?orgId` to attach `metadata.clerkOrgId` to Stripe subscriptions. Seat quantities automatically sync with Clerk organization memberships.
- **Auth & Clerk Webhook Validation (Phase 12 complete).** `apps/web/app/api/webhooks/clerk/route.ts` safely validates Clerk webhook signatures using `svix` and `CLERK_WEBHOOK_SECRET`. Handles `organizationMembership.created` and `deleted` to automatically increment or decrement the active Stripe subscription quantity.
- **Security hardening pass (LIVE, commit `9a3593d`, 2026-07-01).** 4 gaps closed on the billing/auth/creator-payout surface:
  - `submitComponent` server action (`apps/web/app/actions/submit-component.ts`) is now rate-limited (5/hr per authenticated `userId`, via new `checkSubmitRateLimit` in `apps/web/lib/rate-limit.ts`) BEFORE any privileged `GITHUB_TOKEN` Octokit call.
  - The Stripe webhook (`apps/web/app/api/webhooks/stripe/route.ts`) now enforces a `payment_status` allow-list before granting Pro on `checkout.session.completed`: one-time payment mode requires `paid`; subscription mode requires `paid` or `no_payment_required`; `unpaid`/`undefined` never grants.
  - `checkout` + all 3 `connect/*` routes now key their rate limiter on the authenticated `userId` (e.g. `checkout:${userId}`), not the client-spoofable `x-forwarded-for` header.
  - Stripe Connect `POST /api/connect` (`apps/web/app/api/connect/route.ts`) now reuses an existing Express account via Clerk `publicMetadata.stripeConnectAccountId` when present, instead of creating a new account on every POST. Known residual (backlog): no Stripe-side `accounts.retrieve` re-validation of the reused account before reuse — see `process/features/monetization-catalog/backlog/connect-account-revalidation_NOTE_01-07-26.md`.

**Vitest installed in apps/web (Phase 1, expanded through cozy-21st-mirror Phase 3).** `apps/web/package.json` has `vitest ^1.6.0` + `@vitejs/plugin-react ^4.0.0` devDeps and `"test": "vitest run"` script. `apps/web/vitest.config.ts` uses `environment: "node"` plus a `@/` resolve alias (added 2026-07-01). Per-file `@vitest-environment jsdom` override established in Phase 17 (`preview-demo.test.tsx`) for client-component render tests. **102 unit tests across 25 files, all passing** (Phase 18 resolved the prior 6 baseline failures; Phase 19 added 7 new tests; cozy-21st-mirror Phase 3 added 5 landing-page tests) — see `process/context/tests/all-tests.md`. New Phase 19 files/additions: theme + component `contentType` fixtures in `registry.test.ts`; `templates`/`themes` category fixtures in `catalog.test.ts`; theme `installSnippet` paywall-parity cases in `paywall-demo.test.ts`. Run: `corepack pnpm --filter web test`.

**Phase 19 — Templates & Themes content types (VERIFIED COMPLETE 2026-07-05, commit `7ad466e`).** Two new top-level content types added alongside `component | block | hook`: `template` and `theme`. `scripts/validate-registry.mjs` `VALID_CONTENT_TYPES` now includes both; adds optional `Palette_Tokens` frontmatter validation (JSON array of `{name, value}`). `apps/web/lib/registry.ts` `RegistryEntry` gained `contentType?`, `installSnippet?` (extracted from a `## Install Snippet (.css)` body block), and `paletteTokens?`; `parseRawEntry` has a theme-specific source-guard opt-out (themes have no `## Source (.tsx)` block — `source: ""` is valid when `contentType === "theme"`). New pure server component `apps/web/components/preview/theme-detail.tsx` renders a palette swatch grid + install-snippet code block (no `dangerouslySetInnerHTML`) and is Pro-gated identically to component source (installSnippet stripped server-side for non-Pro users viewing a Pro theme). Both content types reuse the existing dynamic `[category]/page.tsx` route — no new route files were needed. Templates reuse the Phase 17 multi-demo/PreviewTabs machinery unchanged. Registry grew from 5 to 9 curated files: `themes__cozy-daylight` (free), `themes__lofi-dusk` (Pro), `themes__paper-cafe` (free), `templates__cozy-landing` (Pro, multi-demo). New `ops/upload-seed-entries.mjs` batch-uploads these to R2 with the same `IsPro:true`-skip guard pattern as `ops/github-ingest.mjs` (commit 90fb7ed) — unit-tested against a mocked `uploadToR2`, but the live upload has not yet been run against the real bucket (see `process/features/monetization-catalog/backlog/phase-19-r2-seed-upload_NOTE_05-07-26.md`). Dedicated `/templates`/`/themes` nav chrome and category-specific empty states are deferred to Phase 20.

**21st-promotion program — PROGRAM COMPLETE, all 4 phases VERIFIED (2026-07-09).** A separate phase program (`process/features/21st-promotion/`) promoted the standalone `21st-dev/` application (a full-stack Next.js+Bun clone living in a nested folder with its own `.git`) into the main monorepo, one layer at a time. Phase 0 (pre-migration audit) established the merge plan. **Phase 1 merged 21st-dev's 40-model Prisma schema into `packages/db`:** `packages/db/prisma/schema.prisma` (new), with the load-bearing `users` model renamed to `local_users` (21 forward FK relation sites across 20 models preserved unchanged, cascade behavior mixed 11-Cascade/10-NoAction, none altered). `packages/db` gained its first Prisma tooling (`prisma` + `@prisma/client` devDeps, net-new to the repo), a new `packages/db/src/prisma.ts` + `./prisma` subpath export (tsup's `--dts` cannot parse Prisma's generated `index.d.ts`, so the Prisma client is exported via a dedicated second tsup entry, NOT re-exported from the main barrel), and its first test script (`node --test packages/db/__tests__/prisma-client.test.mjs`). The generated Prisma client output (`packages/db/prisma/client/`) is gitignored and never committed. `apps/web/app/api/webhooks/clerk/route.ts` gained new `user.created`/`user.updated`/`user.deleted` branches (hand-written fresh against the new Prisma client, NOT copied from 21st-dev's Supabase-client code) syncing to `local_users`; the existing `organizationMembership.*` billing-sync branches are unregressed (test suite grew 3→8). The live Supabase-hosted Postgres schema was migrated via `prisma db push` (NOT `migrate dev`/`migrate reset` — those hit a repeatable Supabase-platform-extension drift loop; see `process/features/21st-promotion/active/21st-promotion_08-07-26/supabase-prisma-extension-drift-pattern_NOTE_08-07-26.md`). 21st-dev's billing (Stripe Prisma models), search route, and original webhook code are imported present-but-unused only — a mandatory grep-based security gate (A4) confirms zero live wiring into any `apps/web/` route. `21st-dev/apps/backend` (a Bun runtime) is now a registered workspace member in `pnpm-workspace.yaml`/`turbo.json`, but has no build/lint/type-check scripts yet (Turbo silently skips it). **Phase 2 locked the program's most consequential decision: Hybrid (primitives + polish only) — NOT a full marketplace port.** The storefront's product direction stays the existing curated Qdrant/registry-based catalog; 21st-dev's marketplace page architecture (studio submission flow, component-detail pages, community browsing, contest/bundles) and the Phase 1 dormant Prisma marketplace tables remain unwired. 12 UI primitives (badge, card, label, separator, skeleton, avatar, tooltip, checkbox, switch, progress, toggle, scroll-area) were ported from `21st-dev/apps/web/components/ui/` into a new `apps/web/components/ui/` directory, token-remapped to root's authoritative CSS-variable scheme, and covered by 12 new jsdom smoke-render tests. `packages/ui` was confirmed untouched throughout (hard safety constraint) — a governance gap was carried to backlog: `packages/ui/src/cozy/*` (4 files, pre-existing "21st.dev Replica Primitives") lack `Author`/`Source_Repo`/`License_SPDX` attribution this repo's registry schema requires (see `packages-ui-cozy-attribution-gap_NOTE_09-07-26.md`; genuine future task, not resolved by this program). **Phase 3 (E2E Validation & Polish, FINAL phase) ran the program's first-ever unscoped root `pnpm build`/`pnpm test` pass** — required adding a missing `test` task to root `turbo.json` + `package.json` (a durable repo-wide infra fix, not phase-specific: every prior phase had used `--filter`-scoped commands only). Unscoped build: 3/3 packages green. Unscoped test: 4/4 tasks green (apps/web 123/123 vitest across 27 files + packages/db node --test smoke). A manual dev-server visual checkpoint (6 pages, HTTP 200, zero console errors) and a narrowly scoped 3-file stray cleanup in `21st-dev/` (leaving the subfolder itself untouched, per the charter's explicit deferral) completed the phase. Live-browser E2E and Clerk-authenticated click-through remain documented, non-blocking known-gaps (no local E2E harness exists in this repo; Clerk dev keys are not yet provisioned — both pre-existing, program-external blockers). **Program verdict: VERIFIED** — see the umbrella plan's `## Program Closeout` section for the full Definition-of-Done scoring against the Program Goal Charter. Task folder intentionally left in `active/` (not archived to `completed/`) pending the charter's still-open out-of-scope item (`21st-dev/` subfolder deletion) and the attribution backlog item — see Program Closeout for the archival-timing rationale.

**cozy-21st-mirror program — Phase 3 Landing Page (VERIFIED 2026-07-06).** A second, parallel phase program (`process/features/cozy-21st-mirror/`, separate from `monetization-catalog`) is mirroring 21st.dev's premium UI/UX onto the existing storefront. Phase 1 (catalog error fix) and Phase 2 (premium layout/design tokens: `--accent-secondary`, `--accent-tertiary`, `--radius`, `--shadow-soft`, expanded typography, glass treatments) are VERIFIED. Phase 3 wired `SearchIsland` (the existing debounced `/api/search` client island, previously only used in `site-header.tsx`) into the `Hero` marketing component on `/`, and applied the Phase 2 premium tokens (CSS/className-only) to all 4 landing marketing components (`Hero`, `FeaturedStrip`, `TrendingStrip`, `ValueProp` in `apps/web/components/marketing/`). No new props, dependencies, or data-fetch logic were added — pure composition + token polish. 5 new tests cover the previously-uncovered landing surface. **Outstanding for this program:** a dev-server visual/token-parity checkpoint across all 3 site themes is owed (no automated visual-regression harness exists in this repo) before Phase 4 (Component UI). See the umbrella plan for full phase sequence and status.

**Build status:** the Next.js storefront builds green and is a deployable artifact. Outstanding before full production: (1) live n8n → Qdrant ingestion run for real search results (needs gayo-VPS n8n + `OPENAI_API_KEY` + `QDRANT_*`); (2) Clerk env keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) + the Clerk session-token `publicMetadata` claim for the auth gate. Neither is a build defect.

### Two separate trees — do not conflate

| Tree | Owner | Purpose |
|---|---|---|
| `process/` | RIPER-5 harness | durable project knowledge, plans, context routing |
| `docs/` | recon evidence + build spec | architecture spec + atomic phases + evidence-manifest (screenshots, network-logs, registry) |

`process/context/all-context.md` (this file) is harness knowledge. The reactbits.dev evidence + build blueprint live in `docs/`. The live application lives in `apps/` + `packages/`.

---

## Build Phase Status (Migrated)

All phase planning, tracking, and statuses have been centralized into the Ultimate Master Roadmap to prevent context drift.

**➔ See the Ultimate Master Roadmap for all plans, docs, and phase statuses:**
[process/features/monetization-catalog/completed/21st-clone_27-06-26/21ST-CLONE-ULTIMATE-ROADMAP_27-06-26.md](../features/monetization-catalog/completed/21st-clone_27-06-26/21ST-CLONE-ULTIMATE-ROADMAP_27-06-26.md)

Established surfaces:

- **`apps/web`** — Next.js 15 (App Router) + React 19 + Tailwind + Shiki + **Clerk (`@clerk/nextjs` v7)**. Catalog routing shell, category/component routes, and a zero-hydration RSC Preview Engine (Shiki server-component highlighting + Preview/Code tabs). `apps/web/lib/catalog.ts` still lists the 134 legacy routes for routing only; registry source reader in `apps/web/lib/registry.ts`. Auth: `<ClerkProvider>` in `app/layout.tsx`, `middleware.ts` (`clerkMiddleware()`), auth UI in `components/site-header.tsx`. Server paywall + `auth()` gate in `app/(catalog)/[category]/[slug]/page.tsx`. **Phase 17 additions:** `parseRawEntry` extended for per-demo source extraction; `stripDemoPaywall(demos, userIsPro)` pure function strips ALL demo sources server-side for Pro components when user is not Pro; `PreviewTabs` client component gains demo pill selector (aria-pressed pills in preview toolbar; demoId state with jsdom-tested interaction); per-demo Shiki `Promise.all` fan-out in RSC layer; `<video>` render guard (src must start with `/previews/`). Git LFS tracks `apps/web/public/previews/**` via `.gitattributes`.
- **`packages/db`** — `@repo/db`: Qdrant client (`@qdrant/js-client-rest`), collection schema (`reactbits_components`, 1536-dim Cosine, keyword indexes on `Category` + `Animation_Library`), upsert + semantic-search helpers. Phase 2 (2026-06-28): `ComponentPayload` extended with optional `Content_Type`, `Author`, `Source_Repo`, `License_SPDX` (string) + `IsPro` (boolean); `Category` broadened to open `string` (was `ComponentCategory` union); `ComponentCategory` type alias retained and still exported from `@repo/db`. Downstream type consumers (`packages/db/src/points.ts`, `apps/web/lib/components.ts`) widened to `string` accordingly. Phase 13 (2026-07-01): Batched Qdrant hydration via `getComponentsByRegistryPaths` and fusion re-ranking combining Qdrant semantic score and Upstash Redis view counts. Phase 17 (2026-07-03): optional `Demos?: Array<{id: string; label: string; video?: string}>` field added to `ComponentPayload`.
- **`packages/ui`** — `@repo/ui`: **PURGED to the 5-component curated Cozy baseline** (commit `c08c2cb`). Registry-facing contents (what `docs/evidence-manifest/registry/` and `ops/github-ingest.mjs` govern): `cozy-buttons` (`soft-button`, `pill-button`, `soft-button-advanced`), `lofi-cards` (`lofi-card`, `polaroid-card`), `minimalist-layouts` (`calm-stack`). The barrel (`src/index.ts`) exports only these three categories. Phase 17 added `SoftButtonAdvanced` curated demo variant. The legacy 128-component React Bits port and its heavy deps (`three`, `face-api.js`, `matter-js`, OGL, etc.) were removed to kill bundle bloat. Gates: `corepack pnpm --filter @repo/ui type-check` + `build` both exit 0. Bundle-safety gate: `corepack pnpm --filter @repo/ui build 2>&1 | grep -E "(three|face-api|matter-js|ogl|gsap)" | wc -l` must return `0`. **Known drift (flagged by 21st-promotion Phase 0, 2026-07-08 — not yet fully reconciled):** `packages/ui/src/` on disk also contains `buttons/`, `cards/`, `dialogs/`, `heroes/`, `inputs/`, `navbars/`, `pricing/`, `tables/`, `tabs/` (shadcn/mantine-style primitives) and a `cozy/` directory ("21st.dev Replica Primitives," 4 files) — added by other in-flight programs (`cozy_promotion`, `cozy-21st-mirror`, and/or `port-ingested-components`), NOT by 21st-promotion (which confirmed `packages/ui` untouched throughout its own 4 phases). These directories sit outside the registry-governed barrel above and are not yet reflected in a full accurate inventory here — treat this paragraph's registry-facing description as authoritative only for the curated/ingested surface, not for `packages/ui/src/`'s complete current contents. `packages/ui/src/cozy/*` additionally lacks the `Author`/`Source_Repo`/`License_SPDX` attribution this repo's registry schema requires (see `process/features/21st-promotion/active/21st-promotion_08-07-26/packages-ui-cozy-attribution-gap_NOTE_09-07-26.md` — genuine future task). A full `packages/ui` re-inventory is owed as a follow-up (owner: whichever program next touches this package, or a standalone `vc-generate-context` delta pass).
- **`packages/config`** — shared TS/build config.

---

## Operating Rules (binding this phase)

1. **Evidence-backed.** Component props, dependency arrays, and registry entries must trace to the Evidence Manifest under `docs/evidence-manifest/`. No hallucinated props or hypothetical code.
2. **Silent I/O.** Write generated/scraped component code and large JSON payloads DIRECTLY to disk. Do NOT print raw source / large payloads to stdout. Report one concise paragraph per batch after it lands on disk.
3. **Qdrant-optimized YAML frontmatter.** Every file under `docs/evidence-manifest/registry/` opens with strict, parseable YAML frontmatter — the n8n ingestion pipeline depends on it. Schema below.
4. **Phase checkpoints.** Each build phase pauses for explicit human authorization before the next, per the active `/goal` block.

### Registry YAML frontmatter schema (required keys, exact — Phase 2 extended schema, 2026-06-28)

**Validated by `scripts/validate-registry.mjs`.** Run `node scripts/validate-registry.mjs` to confirm all registry files conform. All 5 curated files pass as of Phase 2 EVL (2026-06-28).

```yaml
---
Component_Name: <string>
Category: <string — open, not enum; examples: cozy-buttons, lofi-cards, minimalist-layouts>
Dependencies: [<array of npm packages>]
Animation_Library: <Framer Motion | GSAP | CSS | none | ...>
AI_Behavioral_Summary: <dense 2-sentence description of visual physics + interaction model, for semantic vectorization>
Content_Type: <component | block | hook | template | theme>
Author: <string — non-empty, e.g. CLDGayo>
Source_Repo: <https://github.com/{owner}/{repo}>
License_SPDX: MIT
IsPro: <true | false>
# Optional fields:
Screenshot_Path: <relative path under docs/evidence-manifest/screenshots/>
Network_Log_Path: <relative path under docs/evidence-manifest/network-logs/>
Target_Execution_Phase: <docs/phases/NN-*.md this component belongs to>
Block_Files: [<array of additional file paths for block-type entries>]
HeavyDeps: true  # set by ops/github-ingest.mjs when heavy deps detected (warn-only)
changelog: [<array of objects with versionId, date, changes>]
Demos: '[{"id":"default","label":"Default"},{"id":"advanced","label":"Advanced","video":"previews/{category}/{slug}/advanced.mp4"}]'
# Demos: optional (Phase 17). Single-line JSON array. Each entry: {id, label, video?}.
# id format: ^[a-zA-Z0-9_-]+$  (enforced by validate-registry.mjs)
# video format: ^previews/[a-zA-Z0-9/_-]+\.mp4$  (enforced by validate-registry.mjs; no external URLs)
# Per-demo source lives in body under ## Source (demo: {id}) (.tsx) heading-keyed blocks.
# ops/copy-demo-video.mjs: CLI helper to copy an MP4 to apps/web/public/previews/{category}/{slug}/{demo-id}.mp4
Palette_Tokens: '[{"name":"bg","value":"#FAF6F0"},{"name":"ink","value":"#2B2622"}]'
# Palette_Tokens: optional (Phase 19, theme entries only). Single-line JSON array of {name, value}.
# Each token must have non-empty name (string) and non-empty value (string); validated by validate-registry.mjs.
# Theme entries have NO ## Source (.tsx) block (parseRawEntry opts out of the source-required guard
# when Content_Type === "theme", returning source: "" instead of null).
# Install snippet lives in body under ## Install Snippet (.css) heading (extracted via extractFenced).
---
```

**Note:** `Category` was a restricted union (`text-animations | animations | backgrounds | components`) before Phase 2. It is now an open string to support new category names from ingested MIT components. `ComponentCategory` type alias still exported from `@repo/db` for legacy code compatibility.

**Note (Phase 17, 2026-07-03):** `Demos` optional field added. `validate-registry.mjs` validates its structure. Body heading convention: `## Source (demo: {id}) (.tsx)` and `## CSS (demo: {id})` — `parseRawEntry` in `apps/web/lib/registry.ts` extracts these per-demo. Files without `Demos:` are backward-compatible and unchanged. COZY_PREVIEWS map in `apps/web/components/preview/live-preview.tsx` now accepts `"category/slug/demo-id"` keys with fallback to `"category/slug"`.

---

## docs/ layout (recon evidence + build spec)

```
docs/
  00-index.md                      -- build phase index
  01-architecture-and-stack.md     -- Next.js storefront, Turborepo boundaries, Qdrant integration
  02-layout-and-shell.md           -- layout strategy, decoupled from React Bits visual identity
  03-preview-engine-spec.md        -- Preview/Code wrapper: state, Shiki syntax highlighting
  phases/                          -- atomic per-phase markdown (01-monorepo-init … 05-n8n-ingestion, 10-13 engine)
  evidence-manifest/
    screenshots/                   -- PNGs, programmatic naming: {category}__{component}__{state}.png
    network-logs/                  -- JSON/text: API structures, prop configs, asset fetches, component-map.json
    registry/                      -- per-component markdown: raw code + Qdrant YAML frontmatter (9 curated files as of Phase 19: 5 components + 3 themes + 1 template; was 139 — 134 legacy React Bits placeholders deleted in Phase 2)
      history/                     -- component version history: history/[slug]/[versionId].md
```

---

## Technology Stack

**Note (2026-07-13):** the stack below still applies but "storefront" undersells current scope —
`apps/web` is the full 21st.dev-derived port (marketplace/studio/magic/contest/pricing/publish),
cozy-claymorphism-styled per the `higherbits-cozy-rebrand` program. See the CURRENT STATE
CORRECTION at the top of this file.

- **Framework:** Next.js 15 (App Router) storefront in `apps/web`
- **Component engine:** isolated in `packages/ui`, decoupled from the storefront shell (never imports from `apps/web`)
- **Monorepo:** Turborepo build orchestration; pnpm workspaces (`apps/*`, `packages/*`)
- **Language:** TypeScript throughout
- **Styling:** Tailwind CSS (+ custom CSS modules per component)
- **Animation libs (observed in source, install per category):** Framer Motion (`motion`), GSAP, raw CSS/WAAPI, Three.js + `@react-three/fiber`/`drei`, OGL, Matter.js, etc. for 3D/shader backgrounds
- **Preview engine:** Shiki for RSC syntax highlighting in the interactive Preview/Code wrapper (zero client hydration)
- **Vector DB:** Qdrant (`text-embedding-3-small`, 1536-dim, Cosine), populated by an n8n pipeline that embeds `AI_Behavioral_Summary` (OpenAI embeddings) and upserts vectors keyed to registry file paths

---

## Repository Structure (current)

```
Cozy Downloads/
  .agents/ .claude/ .codex/        -- agent harness (Claude Code + Codex mirror)
  apps/
    web/                           -- Next.js storefront (App Router, RSC Preview Engine)
  packages/
    db/                            -- @repo/db: Qdrant client + collection schema
    ui/                            -- @repo/ui: shared UI primitives
    config/                        -- @repo/config: shared TS/build config
  scripts/
    validate-registry.mjs          -- registry CI linter (Node 22, manual CRLF-safe --- splitter, validates all docs/evidence-manifest/registry/*.md)
    __tests__/validate-registry.test.mjs  -- 7 unit tests for the linter (node --test)
  ops/
    n8n/                           -- n8n ingestion workflow blueprint (import into the gayo-VPS instance)
    __tests__/github-ingest.test.mjs  -- 4 unit tests for ingest tool (node --test, mocked fetch)
  docs/                            -- recon evidence + build spec (see layout above)
  process/
    context/                       -- this context system (all-context.md + groups)
    general-plans/                 -- {active,completed,backlog} task folders
    features/                      -- feature-scoped storage (created on demand)
    development-protocols/         -- RIPER-5 methodology docs
  docker-compose.yml               -- local Qdrant (cozy-qdrant, :6333)
  turbo.json / pnpm-workspace.yaml / package.json / pnpm-lock.yaml
  CLAUDE.md / AGENTS.md            -- managed protocol files (orchestrator + RIPER-5)
```

## Key Patterns and Conventions

- **Plan naming:** task folders `{slug}_{dd-mm-yy}/` under `process/general-plans/active/` or `process/features/{feature}/active/`, holding `{slug}_PLAN_{dd-mm-yy}.md`.
- **Commit branch policy:** `main` is the working local branch — commit directly on `main` (overrides harness default).
- **Screenshot naming:** `{category}__{component}__{state}.png` (state ∈ static | hover | active) for programmatic retrieval.
- **Registry naming:** `{category}__{slug}.md` under `docs/evidence-manifest/registry/`; `Registry_Path` is stored in the Qdrant payload for retrieval.
- **Data flow:** `registry/*.md` → n8n (parse frontmatter → embed `AI_Behavioral_Summary` via OpenAI → Qdrant upsert) → `apps/web` data-fetching layer (`apps/web/lib/`) queries `@repo/db` (embed query → semantic search; filtered scroll for category fetch).
- **Communication:** answer-first (BLUF), plain language, TL;DR on long output, no filler. Source: `process/development-protocols/communication-standards.md`.

## Environment and Configuration

- **Node:** Node 22+ required for tooling; pnpm via corepack (`corepack pnpm ...`). v22.22.2 installed; login shell may resolve a different default — prefer an explicit Node 22 for pnpm.
- **Config files:** `turbo.json`, `pnpm-workspace.yaml`, root + per-package `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.mjs`.
- **Env vars:** `QDRANT_URL`, `QDRANT_API_KEY`, `OPENAI_API_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `NEXT_PUBLIC_CDN_URL` — see `.env.example`. `.env` is gitignored.
- **Local Qdrant:** `docker compose up -d qdrant` (REST :6333, gRPC :6334, dashboard `/dashboard`); mirrors the secured gayo-VPS instance.
- **n8n:** ingestion (OpenAI embeddings, Qdrant upserts) runs on the gayo-VPS n8n instance; importable blueprint staged in `ops/n8n/`.
- **Deployment (higherbits.dev) — gayo-vps, NEVER Vercel.** higherbits.dev is self-hosted behind nginx on the user's own VPS (gayo-vps = `ssh root@72.62.196.231`, key auth). App lives at `/home/cozy/htdocs/higherbits.dev` (user `cozy`), served by pm2 app `higherbits` (`next start`, port 3005, nginx proxy). Deploy procedure (verified 2026-07-13): push to `origin main` (github.com/CLDGayo/higherbits), then `su - cozy -c "cd ~/htdocs/higherbits.dev && git pull --ff-only origin main && corepack pnpm install --no-frozen-lockfile && NODE_OPTIONS=\"--max-old-space-size=3072\" corepack pnpm --filter web build && pm2 restart higherbits"` — always `su - cozy`, never `sudo -u cozy` (HOME pollution breaks corepack). CRITICAL: the NODE_OPTIONS heap bound is required — unbounded build gets OOM-killed (exit 137). Pushing to GitHub alone does NOT deploy. `apps/web/vercel.json` is an upstream 21st.dev leftover — its two crons (`/api/cron/gen-usage-embeddings` hourly, `/api/subscription/stripe-cron` monthly) never run and need VPS crontab or n8n equivalents. Note: `/home/higherbits/htdocs/` on the box is an empty decoy; the real app is under `/home/cozy`.

## Scan Metadata

- Generated: 2026-06-24 (vc-setup, Flow A); updated 2026-06-25 for Phases 10/11/12/13 VERIFIED COMPLETE; updated 2026-06-28 for Phase 1 CODE DONE (billing/auth) and Phase 2 VERIFIED COMPLETE (registry pruned 139→5, validate-registry.mjs live, ops hardened, packages/db schema extended, Category now open string); updated 2026-07-01 for the security-hardening pass (commit `9a3593d`) — submitComponent rate limit, webhook payment_status allow-list, userId-keyed rate limits (checkout/connect/dashboard/return), Connect account reuse; test suite now 60 tests across 15 files (54 pass / 6 pre-existing baseline failures tracked in backlog); updated 2026-07-04 for Phase 17 multi-demos (commit `a10aa41`) — Demos frontmatter field, per-demo source heading convention, validate-registry Demos validation + security constraints, ComponentPayload Demos field, PreviewTabs demo pill selector, stripDemoPaywall, SoftButtonAdvanced curated variant, Git LFS .gitattributes, ops/copy-demo-video.mjs; test suite now 71 tests across 17 files (65 pass / 6 baseline failures unchanged); updated 2026-07-04 for Phase 18 R2 Migration — gracefully absent R2 integration, ops/r2-client.mjs lazy-init, registry.ts hydration fallback, NEXT_PUBLIC_CDN_URL demo video prefixing, ops/github-ingest.mjs R2 upload hook; updated 2026-07-05 for Phase 19 Templates & Themes (commit `7ad466e`) — Content_Type extended to template|theme, Palette_Tokens frontmatter field + validation, RegistryEntry contentType/installSnippet/paletteTokens fields, theme source-guard opt-out in parseRawEntry, new ThemeDetail server component, 4 new curated seed files (registry now 9 curated files total), ops/upload-seed-entries.mjs R2 wrapper with IsPro-skip guard; the prior 6 baseline vitest failures were already resolved by Phase 18 — test suite now 87 tests across 19 files, all passing; updated 2026-07-06 for cozy-21st-mirror Phase 3 Landing Page (VERIFIED) — SearchIsland wired into Hero, premium-token pass on Hero/FeaturedStrip/TrendingStrip/ValueProp, 5 new landing-page tests, established async-Server-Component await-then-render RTL pattern and fake-timer+act() debounce-assertion pattern; test suite now 102 tests across 25 files, all passing; updated 2026-07-09 for 21st-promotion Phase 1 Backend & Schema Merge (VERIFIED) — 21st-dev's 40-model Prisma schema merged into packages/db (users renamed to local_users, 21 FK relations preserved), first Prisma tooling + first test script in packages/db, new prisma.ts subpath export, Clerk webhook gained user.created/updated/deleted branches (test suite 3→8), live Supabase Postgres migrated via `prisma db push`, zero live wiring of 21st-dev billing/search/webhook code confirmed by grep security gate, 21st-dev/apps/backend registered as a workspace member; updated 2026-07-09 for 21st-promotion Phase 2 Frontend & UI Migration (VERIFIED) — Hybrid architecture decision locked (primitives + polish only, no marketplace port, dormant Prisma tables stay unwired), 12 UI primitives ported into new apps/web/components/ui/ directory and token-remapped to root's authoritative scheme, 12 new jsdom smoke-render tests (apps/web test suite 102→123 across 25→27 files, all passing), 7 new lightweight Radix deps, packages/ui confirmed untouched, packages/ui/src/cozy/* attribution gap carried to backlog; updated 2026-07-13 for HigherBits.dev Rebrand (VERIFIED) — 21st.dev strings replaced, logo fixed, tokens updated to cozy claymorphism, studio access fixes, Lemon Squeezy boilerplate ready, Supabase "users" bucket added.
- Mode: active build phase
- Package manager: pnpm (Turborepo workspaces)

## Source References

- `docs/01-architecture-and-stack.md` — storefront architecture, three decoupled layers, bundle strategy
- `docs/phases/*.md` — atomic build phase specs (01–05 foundational, 10–13 component engine)
- `process/development-protocols/all-development-protocols.md` — RIPER-5 workflow rules
- `process/development-protocols/communication-standards.md` — output style (BLUF)
- `process/context/tests/all-tests.md` — test stack (planned)
- `process/context/planning/all-planning.md` — plan-shape calibration

## Open Questions / Outstanding Work

- **Lemon Squeezy checkout integration NOT built (blocked on user LS account creds).** Stripe
  checkout code paths in this repo are effectively dead/unconfigured. Follow-up work (overlay UI +
  `@lemonsqueezy/lemonsqueezy.js` + a webhook route mirroring
  `apps/web/app/api/webhooks/stripe/route.ts`) is tracked in
  `process/features/higherbits-cozy-rebrand/backlog/lemonsqueezy-checkout-integration_NOTE_13-07-26.md`.
- **`CSB_API_KEY` (CodeSandbox) NOT provisioned.** Blocks the studio publish flow's CodeSandbox
  export step. See
  `process/features/higherbits-cozy-rebrand/backlog/csb-api-key-provisioning_NOTE_13-07-26.md`.
- **Clerk env keys NOT set (runtime blocker — affects ALL phases).** `apps/web/.env.local` needs `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_test_…`) and `CLERK_SECRET_KEY` (`sk_test_…`) from the Clerk dashboard. **CRITICAL BUILD-VS-RUNTIME DISTINCTION (discovered Phase 1, 2026-06-28):** A format-valid placeholder key (e.g. `pk_test_Y2xlcmsuZXhhbXBsZS5jb20k`, decodes to `clerk.example.com`) satisfies Next.js build validation (build exits 0) but BREAKS the dev RUNTIME — `clerkMiddleware()` in `apps/web/middleware.ts` attempts a handshake to the encoded frontend-API host, which does not resolve → `ERR_NAME_NOT_RESOLVED` on every page load. Build/CI/vitest are unaffected (they do not execute middleware). For local browser testing of ANY Clerk-gated route: real Clerk dev keys (`pk_test_` / `sk_test_` from a live Clerk app in the Clerk dashboard) are required in `apps/web/.env.local`.
- **Clerk session-token claim NOT configured.** `publicMetadata` is not in the default Clerk session token. The Pro check (`sessionClaims.publicMetadata.isPro`) only works after adding the custom claim `{"publicMetadata": "{{user.public_metadata}}"}` in Clerk Dashboard → Sessions, and setting a test user's public metadata to `{"isPro": true}`.
- **Billing/checkout (Stripe) & Connect — BUILT (Phase 1 & Phase 9 complete).** `apps/web/app/api/checkout/route.ts` and `apps/web/app/api/webhooks/stripe/route.ts` are live (dual mode, 7-event lifecycle, idempotent). Phase 9 introduced Stripe Connect payouts, using server-side component registry lookups (`readRegistryEntry`) to prevent payout destination manipulation. Env vars `STRIPE_SECRET_KEY`, `STRIPE_SUBSCRIPTION_PRICE_ID`, `STRIPE_LIFETIME_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` needed in `apps/web/.env.local` for live use. Unit-tested with mocks (no live Stripe calls needed for tests or build).
- **Security & Rate Limiting (hardened 2026-07-01, commit `9a3593d`):** A Redis-backed sliding window rate limiter (`@upstash/ratelimit`) protects sensitive routes. `checkout`, `connect`, `connect/dashboard`, `connect/return` are keyed on the authenticated `userId` (not the client-spoofable `x-forwarded-for` header). `submitComponent` has its own dedicated limiter (`checkSubmitRateLimit`, 5/hr per user, distinct Redis prefix `ratelimit:submit`) gating privileged GitHub API calls. `orgId` authorization relies securely on server-side Clerk `auth()` session claims. `/api/views` remains unauthenticated by design and stays IP+slug-deduped (24h) — IP-keying is appropriate there since there is no `userId` to key on. Stripe webhook grants are additionally gated on `payment_status` (see billing note above) as defense-in-depth beyond signature verification.
- **Live n8n ingestion / Qdrant population — NOT RUN (search-results blocker).** The ingestion pipeline that embeds `AI_Behavioral_Summary` and upserts vectors has not executed against a live Qdrant. Needs the gayo-VPS n8n instance + `OPENAI_API_KEY` + `QDRANT_*` creds. Until then `/api/search` returns `503 OPENAI_API_KEY is not set` and the search UI shows its "Search indexing..." fallback (graceful, no crash).
- **n8n registry source + Qdrant hosting cutover** — how the gayo-VPS n8n reaches `docs/evidence-manifest/registry/` (git checkout vs synced mount; documented in `ops/n8n/README.md`); local docker-compose for dev vs. the secured gayo-VPS instance for production. Finalize at import time.
- **`ops/github-ingest.mjs` — not yet run at scale.** The MIT GitHub ingestion tool exists (347 lines) but has only seeded the curated baseline; the forward catalog-growth workflow (which MIT repos, license verification, registry write) is not yet operationalized.
- **Legacy catalog routes (134) still in `catalog.ts`** — routing manifest lists the purged React Bits slugs; their `@repo/ui` implementations are gone so they render placeholder-only. Decide: prune `catalog.ts` to the 5 live components, or keep routes as "coming soon" placeholders pending MIT replacements.
- **`apps/web` has no ESLint config (harness-drift)** — `next lint` is interactive-only and cannot run as a non-interactive gate; `tsc --noEmit` is the working type gate. Configure ESLint (or migrate to the ESLint CLI) in a later task.
- **Test-baseline documentation drift (found 15-07-26, `claymorphism-3d-redesign` Phase 01 EVL).** Prior text in this file and `process/context/tests/all-tests.md` claimed "123 tests across 27 files, all passing." Independently confirmed actual disk state as of 15-07-26: **4 test files / 10 tests** (`apps/web/lib/registry.test.ts`, `apps/web/components/ui/__tests__/footer-smoke.test.tsx`, `apps/web/components/ui/__tests__/header-smoke.test.tsx`, `apps/web/app/__tests__/landing-smoke.test.tsx`). The drift predates the claymorphism program (that phase's diff touched only `globals.css`, `.env.example`, and 2 new `apps/web/scripts/` files — no test files were removed). Root cause not yet investigated; flagged as a `vc-audit-context` follow-up. See `process/context/tests/all-tests.md` for the corrected count and per-file detail.
- **Git LFS / `.gitattributes` tracking claim not found on disk (found 15-07-26, `claymorphism-3d-redesign` Phase 01 research).** The "Phase 17 additions" note above (`apps/web` bullet, under Build Phase Status) claims `.gitattributes` tracks `apps/web/public/previews/**` via Git LFS. Research for the claymorphism program's Phase 1 could not confirm this tracking exists on disk. Not investigated further (out of Phase 1 blast radius) — flagged as a `vc-audit-context` follow-up to confirm or correct.
- **Claymorphism + 3D Pastel Soft UI program — Phase 3 COMPLETE, clay tokens NOW CONSUMED (updated 15-07-26).** `apps/web/app/globals.css` has `--clay-shadow-light/dark/outer`, `--clay-depth-sm/md/lg`, `--clay-pressed`, `--accent-yellow(-foreground)`, and a `.clay-surface` utility (both `:root` and `.dark`), added additively by Phase 1. Phase 3 (Component Library, VERIFIED 15-07-26) registered `shadow-clay-sm/md/lg/pressed` Tailwind `boxShadow` utilities (`apps/web/tailwind.config.js`, additive-only) and built 5 new components in `apps/web/components/ui/`: `clay-card.tsx` (floating card, optional `iconSrc`/`illustrationSrc` props, no-render-when-absent), `clay-input.tsx` (pressed/inset search input), `clay-pill-button.tsx` (cva-based pill CTA), `clay-pill-bar-chart.tsx` and `clay-donut-chart.tsx` (thin wrappers over the existing `chart.tsx` recharts primitives — no new charting dependency). None of these 5 components are wired into any route yet — that is Phase 4's job (Page Assembly & Layout). Test suite grew to **19 tests across 8 files** (was 10/4) — see `process/context/tests/all-tests.md`.
- **MAJOR ops/-subsystem documentation drift, needs a full `vc-audit-context` reconciliation pass (found 15-07-26, `claymorphism-3d-redesign` Phase 02 research).** This file's "Build Phase Status" and "Established surfaces" sections above describe an extensive `docs/evidence-manifest/`-driven ingestion subsystem — `ops/github-ingest.mjs`, `ops/r2-client.mjs`, `ops/upload-seed-entries.mjs`, `docs/evidence-manifest/registry/*.md`, `scripts/validate-registry.mjs` — that does NOT exist anywhere in this repo's tracked git history. Actual `ops/` contents on disk as of 15-07-26: `ops/README-seed.md`, `ops/seed-placeholder-components.mjs`, plus this phase's new `ops/gemini-asset-gen.mjs` / `ops/gemini-prompts.mjs` / `ops/__tests__/gemini-asset-gen.test.mjs`. This is a larger and more consequential drift than the test-baseline and Git-LFS drift notes above (those were already flagged) — do not attempt a wholesale rewrite inline in this UPDATE PROCESS pass; a dedicated `vc-audit-context` session should confirm the full scope (which of the registry/Qdrant-catalog paragraphs above are stale vs. still accurate) and correct or remove the affected description.
- **Gemini asset-generation pipeline now exists (added 15-07-26, `claymorphism-3d-redesign` Phase 2).** `ops/gemini-asset-gen.mjs` (+ `ops/gemini-prompts.mjs` static prompt-template data module) is an ops-time-only Node script that calls the Gemini image-generation API, gated by shell-exported `GEMINI_API_KEY` / `GEMINI_IMAGE_MODEL` env vars only (never a `.env*` file). `apps/web/public/clay/{icons,illustrations,textures}/` exist but are empty pending a user-approved live seed-batch run — see the Phase 2 report for the opt-in command and cost estimate.

---

## How This File Works (the `all-*.md` Convention)

Every `process/context/` directory has one `all-*.md` entrypoint acting as an attachable quick router. This root file is the top-level router; groups have their own `all-{group}.md`. Agents read this first, find the relevant group from the tables below, read that group's entrypoint, then load the specific deep doc. Layered routing keeps context windows small — never load the whole `process/context/` tree.

## Current Root Entry Points

<!-- GENERATED:routing -->
| File | Read when |
|---|---|
| `process/context/all-context.md` | any substantial planning, research, review, or implementation task |
| `process/context/planning/all-planning.md` | Planning context entrypoint — plan-shape calibration (SIMPLE vs COMPLEX) and example plan references. |
| `process/context/tests/all-tests.md` | Test stack and verification entrypoint. Vitest live in apps/web; Playwright/Axe a11y checks cover the HigherBits route matrix; packages/db has node --test smoke coverage. |

## Current Context Groups

| Group | Entry point | Scope |
|---|---|---|
| `planning/` | `process/context/planning/all-planning.md` | Planning context entrypoint — plan-shape calibration (SIMPLE vs COMPLEX) and example plan references. |
| `tests/` | `process/context/tests/all-tests.md` | Test stack and verification entrypoint. Vitest live in apps/web; Playwright/Axe a11y checks cover the HigherBits route matrix; packages/db has node --test smoke coverage. |
<!-- /GENERATED:routing -->

## Task Routing Table

| If the task involves... | Start with |
|---|---|
| architecture / stack / build mission | this file → `docs/01-architecture-and-stack.md` |
| a specific build phase or plan | `process/features/monetization-catalog/completed/21st-clone_27-06-26/21ST-CLONE-ULTIMATE-ROADMAP_27-06-26.md` |
| reactbits.dev evidence, registry, screenshots | `docs/evidence-manifest/` |
| storefront data fetching / Qdrant queries | `apps/web/lib/` + `packages/db` |
| n8n ingestion pipeline | `ops/n8n/` + `docs/phases/05-n8n-ingestion.md` |
| testing or verification | `process/context/tests/all-tests.md` |
| creating a new plan | `process/general-plans/active/` task folder |

## Context Group Lifecycle

Create a group when a topic has 3+ durable docs, a doc exceeds ~800 lines with separable subtopics, or it maps to a stable operational domain. Do NOT create a group for temporary reports, plans, or feature-specific content. Run `vc-audit-context` after any context reorganization.

## Naming Convention

No `README.md` inside `process/context/`. Canonical entrypoints: root `process/context/all-context.md`, group `process/context/{group}/all-{group}.md`.

## Context Update Protocol

When durable project knowledge changes: (1) update the smallest relevant context file, (2) update this file if routing/ownership/naming/groups changed, (3) update the owning `all-{group}.md`, (4) run `vc-audit-context`.
