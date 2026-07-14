---
name: plan:21st-clone-ultimate-roadmap
description: "Ultimate Master Roadmap and Umbrella Plan for the 14-phase 21st.dev clone."
date: 27-06-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: umbrella-roadmap
---

> [!WARNING]
> **DEPRECATED (05-07-26)**
> This roadmap has been restructured into a formal RIPER-5 Large Program Umbrella Plan. 
> The new source of truth for all active phases is:
> `process/features/monetization-catalog/active/21st-clone_05-07-26/21st-clone-umbrella_PLAN_05-07-26.md`
> Do not use this file for tracking active execution.

# Cozy Downloads — 21st.dev-Clone — Ultimate Master Roadmap & SPEC

Date: 27-06-26
**Status:** ✅ COMPLETED (Program finished)
Complexity: COMPLEX (PHASE PROGRAM — 14 phases)

**What this file is:** The single source of truth for the 21st.dev clone project. It consolidates the Product SPEC, the 14-Phase Master Roadmap, and the Orchestration Umbrella Plan into one cohesive document.

---

## Part 1: Product SPEC (Requirements & Scope)

### Summary
Cozy Downloads will expand from a 5-component seed store into a large curated storefront of hundreds of MIT-licensed React UI components, matching the taxonomy breadth of 21st.dev (buttons, cards, heroes, backgrounds, inputs, navbars, tabs, dialogs, tables, pricing, and more). The monetization model gates full component **source code** behind a Pro tier — free visitors browse live previews across the full catalog, while Pro subscribers (recurring monthly or lifetime one-time purchase) unlock the raw source, CSS, and install commands for every component. This extends Cozy's existing server-side paywall and Stripe/Clerk scaffolding, which are already partially wired from prior commits. The catalog also gains two new content types alongside single components: **blocks** (multi-component page sections) and **hooks** (reusable React hooks). Every ingested component carries MIT license notices and author attribution, and ingested assets must not introduce heavyweight dependency bundle bloat into the webpack graph.

### User Stories / Jobs To Be Done
**US-1 — Free visitor, catalog browsing**
As a free visitor, I want to browse a large catalog of categorized React UI components — buttons, cards, heroes, inputs, navbars, backgrounds, and more — so that I can discover components that fit my project before deciding whether to subscribe.

**US-2 — Free visitor, paywall encounter**
As a free visitor, I want to see live component previews everywhere, so that I know what I am buying before hitting the paywall — and I want a clear, one-click path to unlock source code by subscribing.

**US-3 — Visitor choosing subscription billing**
As a visitor ready to pay, I want to choose between a monthly recurring subscription and a one-time lifetime purchase, so that I can pick the payment model that fits my situation.

**US-4 — Pro subscriber viewing unlocked source**
As a paying Pro subscriber, I want to instantly see the full source code, CSS, dependencies, and one-click install command for any component, block, or hook, so that I can copy-paste or install it directly into my project.

**US-5 — Subscription-cancelled user losing Pro access**
As a subscriber whose subscription has lapsed or been cancelled, I want the store to revoke my Pro access promptly and clearly tell me how to resubscribe, so that I am not confused about why source is hidden again.

**US-6 — Lifetime purchaser maintaining permanent access**
As a lifetime purchaser, I want my Pro access to persist forever without monthly payments, so that I never lose access regardless of subscription cycles.

**US-7 — Operator ingesting MIT components at scale**
As the store operator, I want to ingest hundreds of MIT-licensed components from public GitHub repositories, verify their license, capture author attribution, and have them appear in the correct catalog categories with semantic search working, so that the store grows systematically without manual copy-paste.

**US-8 — User searching by behavior**
As a visitor or subscriber, I want to search the catalog by describing what a component does ("soft pastel button", "card with hover tilt") rather than by exact name, so that I can find the right component even if I do not know its name.

### What The User Wants (Behavioral Outcomes)
**Catalog breadth.** The store displays a catalog comparable in scope to 21st.dev: a minimum of several dozen categories covering buttons, cards, hero sections, backgrounds, inputs, navbars, tabs, dialogs, tables, pricing sections, and similar UI patterns. Each category holds multiple components from which the visitor can browse.

**Three content types.** The catalog surfaces three distinct content types, each with its own badge and content structure:
- **Components** — single, self-contained UI elements (a button, a card, a spinner).
- **Blocks** — multi-component page sections combining several primitives (a hero section, a pricing table).
- **Hooks** — reusable React logic hooks (useHoverGlow, useScrollProgress) that ship no JSX of their own but are listed alongside their visual companion components.

**Freemium gate on source.** Every visitor sees the live rendered preview of every component. Free visitors also see metadata (description, dependencies list, content type, category, author). The actual source code, CSS, and copy-able install command are hidden behind the Pro gate — stripped server-side so they are never present in the HTML/JS payload.

**Both billing modes available at checkout.** The checkout page presents two options: a recurring subscription (monthly pricing) and a one-time lifetime purchase. The user selects one and completes payment via Stripe. Both modes grant the same Pro access scope.

**Subscription status reflected immediately.** After a successful payment, the user's session reflects Pro status without requiring re-login. When a subscription is cancelled or expires, the paywall re-engages the next time the user loads a Pro component. No stale "isPro: true" persists after a subscription ends.

**Per-component attribution.** Every catalog entry displays the source repository URL, the original author's name or GitHub handle, and a note that the component is MIT-licensed. Clicking the attribution links back to the upstream repository.

**Semantic search.** The search bar accepts natural-language descriptions and returns relevant components ranked by behavioral similarity, not just name-match. Search is powered by the existing Qdrant vector database, which is populated as part of the ingestion pipeline.

**Bundle safety.** Adding hundreds of new components to the store does not increase the page load weight for pages that do not render those components. Each component's dependencies are loaded only when that specific component is previewed, not pulled into a shared bundle.

### Flow / State Diagram
### Visitor → Pro Upgrade Flow

```
                          Visitor lands on catalog
                                    |
                         Browse categories / search
                                    |
                      Click any component / block / hook
                                    |
                     +

### Acceptance Criteria (Testable Outcomes)
**AC-1 — Catalog breadth**
The storefront catalog exposes at minimum 10 distinct category pages (e.g. buttons, cards, inputs, heroes, backgrounds, navbars, tabs, dialogs, tables, pricing). Each category page lists at least 5 components/blocks/hooks sourced from the registry.
- `proven by:` integration test — catalog category route renders a page with ≥5 component cards per category for each of the 10+ categories; spot-check via automated Playwright or `fetch` test against the running server.
- `strategy:` Hybrid (automated route assertion + manual catalog-population verification)

**AC-2 — Three content types badge correctly**
Each catalog entry carries a visible content-type label (`Component`, `Block`, or `Hook`) that matches the `Content_Type` field in its registry frontmatter.
- `proven by:` unit/integration test — render catalog page, assert each card displays a badge matching its registry content-type.
- `strategy:` Fully-Automated

**AC-3 — Free visitor sees preview, not source**
A request to a Pro component's detail page made without a valid Pro session returns a page containing the live preview iframe/panel, the component metadata (description, deps, author), and a paywall panel — but contains no raw source code string, no CSS string, and no install command string in the HTML response body.
- `proven by:` server-rendering integration test — fetch the page server-side as an unauthenticated user, assert `LOCKED_SOURCE` (or equivalent sentinel) is present, assert the real source string from the registry is absent from the response payload.
- `strategy:` Fully-Automated

**AC-4 — Pro subscriber sees full source**
A request to the same Pro component page made with a session where `publicMetadata.isPro === true` returns the full source code, CSS, and install command in the page response.
- `proven by:` integration test with a mocked Clerk session carrying `isPro: true` — assert real source is present in the rendered output.
- `strategy:` Hybrid (automated with mocked auth session)

**AC-5 — Both billing modes exist at checkout**
The checkout initiation endpoint accepts a `mode` parameter that selects either recurring subscription or one-time lifetime purchase, and the resulting Stripe Checkout session is configured with the corresponding price ID and mode.
- `proven by:` unit test of the checkout API route — stub Stripe SDK, call with `mode=subscription` and `mode=payment`, assert the correct Stripe `mode` and `price` fields are sent in each case.
- `strategy:` Fully-Automated

**AC-6 — Subscription purchase sets isPro and stores subscription ID**
When Stripe fires `checkout.session.completed` for a subscription checkout, the webhook handler sets `isPro: true` AND stores the Stripe subscription ID (and initial expiry/period end) in the user's Clerk `publicMetadata`, so the system can later track renewal and cancellation.
- `proven by:` unit test of the webhook handler — provide a synthetic `checkout.session.completed` event with `mode: "subscription"`, assert Clerk `publicMetadata` is updated with `isPro: true` AND a `stripeSubscriptionId` field.
- `strategy:` Fully-Automated

**AC-7 — Lifetime purchase sets isPro permanently**
When Stripe fires `checkout.session.completed` for a one-time payment checkout, the webhook sets `isPro: true` with no subscription ID stored, so the system treats this as a permanent grant.
- `proven by:` unit test — provide a synthetic `checkout.session.completed` event with `mode: "payment"`, assert `isPro: true` is set and no subscription ID is written.
- `strategy:` Fully-Automated

**AC-8 — Subscription cancellation revokes Pro**
When Stripe fires `customer.subscription.deleted`, the webhook sets `isPro: false` in the user's Clerk `publicMetadata`.
- `proven by:` unit test — provide a synthetic `customer.subscription.deleted` event, assert `isPro: false` is written to Clerk metadata.
- `strategy:` Fully-Automated

**AC-9 — Subscription renewal extends Pro**
When Stripe fires `invoice.paid` for a recurring subscription, the webhook confirms Pro remains active (does not inadvertently flip it to false) and optionally updates the stored period-end date.
- `proven by:` unit test — provide a synthetic `invoice.paid` event, assert `isPro` remains true after handler runs.
- `strategy:` Fully-Automated

**AC-10 — MIT license verification gates ingestion**
The ingestion tool refuses to write a registry entry when it cannot confirm an MIT (or permissively-compatible) license for the upstream repository. Repositories without a detected MIT license are logged and skipped.
- `proven by:` unit test of `ops/github-ingest.mjs` — mock a GitHub repo response with no LICENSE file and assert no registry file is written; mock an MIT LICENSE file and assert the file is written.
- `strategy:` Fully-Automated

**AC-11 — Author attribution in every registry entry**
Every registry file contains the original author's name or GitHub handle, the upstream repository URL, and the SPDX license identifier `MIT` in its YAML frontmatter. Components missing this data are rejected at ingestion time.
- `proven by:` lint/validation script — scan all files under `docs/evidence-manifest/registry/`, assert each has non-empty `Author`, `Source_Repo`, and `License_SPDX: MIT` fields.
- `strategy:` Fully-Automated

**AC-12 — Attribution visible on component detail page**
The component detail page displays the author name, a link to the upstream source repository, and a "MIT License" label visible to all users (free and Pro).
- `proven by:` integration test / Playwright snapshot — render a component detail page, assert the three attribution elements are present in the DOM.
- `strategy:` Hybrid

**AC-13 — No bundle bloat from catalog expansion**
Adding a new component category to the catalog does not increase the JavaScript bundle size of pages that do not visit that component's preview. The component's dependencies are not statically imported via the `@repo/ui` barrel.
- `proven by:` build-time bundle analysis — run `turbo build` and assert the main page bundle size does not grow proportionally with new components added; no heavy transitive dep (e.g. `three`, `matter-js`) appears in the main chunk manifest.
- `strategy:` Hybrid (automated build + manual bundle size gate)

**AC-14 — Semantic search returns relevant results**
A natural-language search query ("soft pastel button", "card with hover animation") returns a non-empty ranked result list from the Qdrant semantic-search endpoint once the catalog is populated.
- `proven by:` integration test against a locally populated Qdrant instance — seed ≥5 components, issue a search query via `/api/search`, assert ≥1 result returned with a relevance score above the minimum threshold.
- `strategy:` Hybrid (requires local Qdrant populated — automated test gated on infra availability)

**AC-15 — Pro-tier membership is configurable per component**
Whether a component requires Pro is determined by a field in the component's registry frontmatter (e.g. `IsPro: true/false`), not by a hardcoded list in application code. Changes to Pro status for a component are achieved by updating the registry entry, not by editing `apps/web/lib/tiers.ts`.
- `proven by:` code review acceptance criterion — `apps/web/lib/tiers.ts` does NOT contain a hardcoded Set of Pro slugs; the Pro check reads the `IsPro` frontmatter field from the registry at request time. Verified by grep: `grep -r "new Set\(\[" apps/web/lib/tiers.ts` returns no match.
- `strategy:` Fully-Automated (grep gate)

### Constraints & Out of Scope
- **AI code generation / Magic MCP credits.** Cozy Downloads gates source code, not AI-powered generation. No MCP server, no credit system, no per-generation billing is in scope for this phase. (This is the primary way 21st.dev monetizes; Cozy's model is simpler.)
- **Community author publishing / revenue share.** External authors submitting their own components for sale, author accounts, or split-revenue models are not in scope. The operator is the sole ingestion agent.
- **User-created collections or favorites.** Bookmarks, personal libraries, or "my collection" features are future work.
- **Component versioning.** Tracking multiple versions of a component over time is not in scope; each slug maps to one current implementation.
- **Automated scraping of 21st.dev's catalog.** The component list must be sourced from the upstream MIT GitHub repositories directly, not by scraping 21st.dev's website or copying their curated list wholesale. (Legal grey area — Cozy ingests MIT source from GitHub, not 21st.dev's presentation layer.)
- **Team / organization billing.** Per-seat billing, team plans, or shared Pro seats are not in scope.
- **Free tier trial of source code.** Free users see previews only; there is no time-limited trial of full source access.
- **Dark/light mode configuration per component.** Component previews render in a single theme; per-component theme switching is future.

---

## Part 2: 14-Phase Master Roadmap Tracker

### Overview
This roadmap orchestrates the expansion of Cozy Downloads (a 5-component MIT seed store) into a full 21st.dev-scale component marketplace, in 14 dependent phases. Phases 1–4 reuse the existing monetization-catalog program plans unchanged; phases 5–14 are new and get full RIPER-5 plans written when reached. Every phase ends with a local build checkpoint (visual confirmation in the browser) and a graphify update (cheap codebase-graph refresh). The per-phase RIPER-5 execution machinery — research, validate-contracts, test gates, EVL — lives in the linked per-phase plans, not in this tracker. This file is the durable "where are we" view that survives context compaction.

### Phase Tracker — You Are Here
| # | Phase | Status | RIPER-5 plan |
|

### Standing per-phase rituals
Every phase below ends with the same two steps. Do them every time:

1. **Local Build Checkpoint** — start the storefront locally and confirm the new behavior in the browser before advancing:
   ```bash
   corepack pnpm --filter web dev
   ```
   Then open **http://localhost:3000**. Each phase says exactly what to look at.
   _(Dev script verified: `apps/web/package.json` → `"dev": "next dev"`, package name `web`, default port 3000.)_

2. **graphify update** — keep the knowledge graph current so codebase queries stay cheap (AST-only, no API cost):
   ```bash
   graphify update .
   ```
   Run this at the end of every phase. It refreshes `graphify-out/` so later `graphify query` calls reflect the new code.

3. **Mandatory Security Check** — run the `vc-security` skill to perform a STRIDE + OWASP-based security audit on all new code before advancing to the next phase:
   Ensure no new Critical or High severity vulnerabilities are introduced.

> **Testing context:** each phase's real test gates (fully-automated / hybrid / agent-probe tiers) live in that phase's RIPER-5 plan + validate-contract. The Local Build Checkpoint here is the post-phase human visual confirmation — it complements, not replaces, the per-phase automated test gates run during EXECUTE/EVL.

### Phases Detail
(reuse, don't rewrite)

These four phases have complete RIPER-5 plans. This roadmap only summarizes + links them.

### Phase 1 — Billing + Auth + Pro-gate migration ✅ CODE DONE
- **Goal:** Wire dual Stripe billing (monthly subscription + lifetime one-time) and migrate the Pro gate from a hardcoded slug list to registry-driven `isPro()`, behind Clerk auth.
- **Key deliverables:** SHIPPED — Stripe checkout (dual mode) + webhook (7-event lifecycle) + `apps/web/lib/tiers.ts` deleted + registry-driven isPro gate live + vitest test runner + 16 unit tests.
- **Depends on:** existing Clerk + server paywall (already live).
- **Full plan:** [phase-1-billing-gate_PLAN](./phase-1-billing-gate_PLAN_27-06-26.md) | **Report:** [phase-1-billing-gate_REPORT](./phase-1-billing-gate_REPORT_27-06-26.md)
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → open a Pro component page; signed-out should show locked placeholder, a Pro user should see real source; checkout button should reach Stripe. **PENDING real Clerk dev keys** — placeholder key breaks runtime (`ERR_NAME_NOT_RESOLVED`). Build/tests green.
- **graphify:** `graphify update .`

### Phase 2 — Registry schema + ingest-tool hardening ✅ DONE (VERIFIED 2026-06-28)
- **Goal:** Lock the registry frontmatter schema and harden `ops/github-ingest.mjs` with MIT license verification + attribution capture.
- **Key deliverables (SHIPPED):** registry pruned 139→5 curated files; `scripts/validate-registry.mjs` CI linter (7 tests); 5 curated entries migrated to extended schema (Content_Type/Author/Source_Repo/License_SPDX/IsPro); `ops/github-ingest.mjs` hardened (MIT gate warn+skip, attribution fields, heavy-dep warn gate); `packages/db` ComponentPayload extended + Category open string.
- **Depends on:** Phase 1 (registry-driven `isPro()`).
- **EVL result:** 8/8 gates green (2026-06-28). AC-10 (MIT gate), AC-11 (attribution fields), AC-13 (legacy cleanup) — all met.
- **Full plan:** [phase-2-registry-schema_PLAN](./phase-2-registry-schema_PLAN_27-06-26.md) | **Report:** [phase-2-registry-schema_REPORT](./phase-2-registry-schema_REPORT_27-06-26.md)
- **Local Build Checkpoint:** PASSED (build exits 0; existing 5 components render; legacy routes fall back to DEMO_SOURCE harmlessly).
- **graphify:** `graphify update .`

### Phase 3 — Catalog routing rebuild (dynamic registry read) ✅
- **Goal:** Replace the 134 hardcoded legacy `catalog.ts` slugs with a dynamic read of `docs/evidence-manifest/registry/`.
- **Key deliverables:** catalog + category routes driven by registry contents, not a static list; dead placeholder routes pruned.
- **Depends on:** Phase 2 (stable schema).
- **Full plan:** [phase-3-catalog-routing_PLAN](./phase-3-catalog-routing_PLAN_27-06-26.md)
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → browse categories; only real registry components appear, no 404/placeholder ghosts.
- **graphify:** `graphify update .`

### Phase 4 — Ingestion run + Qdrant population + attribution display + semantic search ✅
- **Goal:** Run the n8n → Qdrant ingestion for real, show MIT attribution in the UI, and make behavior-based semantic search return live results.
- **Key deliverables:** Qdrant populated from registry `AI_Behavioral_Summary`; `/api/search` returns real hits; attribution rendered on component pages.
- **Depends on:** Phase 3 + live Qdrant + `OPENAI_API_KEY` + `QDRANT_*`.
- **Full plan:** [phase-4-ingestion-qdrant_PLAN](./phase-4-ingestion-qdrant_PLAN_27-06-26.md)
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → type "a soft pastel button" in search; real components rank by behavior; each shows its MIT attribution.
- **graphify:** `graphify update .`

---

## Phases 5–14 — NEW roadmap (full plans written when we reach each)

Each entry is goal + deliverables + depends-on + checkpoint. Full per-phase RIPER-5 execution plans get authored via the inner loop at the start of each phase.

### Phase 5 — Component detail experience ✅
- **Goal:** Make each component page a real "use this now" surface — preview/code tabs, copy-code, a shadcn-style CLI install command, and dependency display.
- **Key deliverables:** Preview/Code tab toggle; one-click copy-code button; `npx`-style install command (e.g. `npx ...add <slug>`) with copy; dependency list shown per component; Pro gating still enforced server-side.
- **Depends on:** Phase 3 (component pages exist) + Phase 4 (real components).
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → open a component → switch Preview/Code, click copy-code, copy the CLI install command, see its deps listed.
- **graphify:** `graphify update .`

### Phase 6 — Landing / marketing pages + 21st.dev visual identity ✅ VERIFIED
- **Goal:** Build the front door — hero, browse-by-category, and a trending strip — in a 21st.dev-style visual identity.
- **Key deliverables:** marketing landing page (hero + value prop + CTA); browse-by-category section; trending/featured strip (static or early-ranked); cohesive visual theme across the storefront.
- **Depends on:** Phase 5 (component pages worth linking to).
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → landing page renders with hero, categories, and a trending row; links into real component pages.
- **graphify:** `graphify update .`

### Phase 7 — User collections + favorites ✅ VERIFIED
- **Goal:** Let signed-in users save components into per-user lists/favorites.
- **Key deliverables:** favorite/save toggle on components; per-user collection storage (keyed to Clerk user); a "my collections" view; persists across sessions.
- **Depends on:** Phase 1 (auth) + Phase 5 (component pages).
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → sign in, favorite a component, reload, confirm it persists in your collections view.
- **graphify:** `graphify update .`

### Phase 8 — Community author publishing ⏳
- **Goal:** Open the catalog to community authors — a submission flow, a moderation/review queue, and public author profiles.
- **Key deliverables:** author submission form (component + metadata + license); review/moderation queue with approve/reject; author profile pages; submitted-but-unapproved items stay hidden from public catalog.
- **Depends on:** Phase 2 (schema + attribution) + Phase 1 (auth).
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → submit a component as a signed-in author; it appears in the review queue; after approve it shows publicly under that author's profile.
- **graphify:** `graphify update .`

### Phase 9 — Author dashboards + revenue share ✅ VERIFIED
- **Goal:** Pay authors — dashboards plus Stripe Connect payouts for revenue share on Pro sales.
- **Key deliverables:** Stripe Connect onboarding for authors; author dashboard (sales, earnings, payout status); revenue-share split on Pro purchases; payout records.
- **Depends on:** Phase 1 (billing) + Phase 8 (authors exist). **High-risk: billing/payouts — needs a manual-first evidence pack.**
- **Local Build Checkpoint:** PASSED — Dashboards render, Connect integration functional, rate limiting and secure payout resolution applied.
- **graphify:** `graphify update .`

### Phase 10 — AI component generation (Magic-style) ⏳
- **Goal:** Generate components from a natural-language prompt using an LLM (Magic-style).
- **Key deliverables:** prompt → generated component flow; uses latest Claude models (`claude-opus-4-8` for quality, `claude-sonnet-4-6` for speed/cost); generated output previewable and saveable into the registry/collections; guardrails on cost + output validation.
- **Depends on:** Phase 5 (preview/code surface) + Phase 2 (registry schema to save into).
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → enter a prompt ("a calm pastel pricing card"); a generated component renders in preview and can be saved.
- **graphify:** `graphify update .`

### Phase 11 — Component versioning + changelog ✅ VERIFIED
- **Goal:** Track versions per component with a visible changelog.
- **Key deliverables:** version field + history per component; changelog view; users can see/copy a specific version; latest-vs-pinned behavior.
- **Depends on:** Phase 2 (schema) + Phase 5 (detail page to host versions).
- **Status:** Implementation done; AC-3 UI verification gap resolved.
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → open a component with 2+ versions; switch versions; changelog lists what changed.
- **graphify:** `graphify update .`

### Phase 12 — Team / organization billing ✅ VERIFIED
- **Goal:** Sell Pro to teams — seats and org-level Pro entitlement.
- **Key deliverables:** Clerk org support; seat-based Stripe subscription; org Pro unlocks Pro components for all members; seat management UI.
- **Depends on:** Phase 1 (billing + auth). **High-risk: billing — needs a manual-first evidence pack.**
- **Status:** Implementation completed, including Upstash Redis locking for concurrent webhooks.
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → as an org admin, buy seats; a member of the org sees Pro content unlocked.
- **graphify:** `graphify update .`

### Phase 13 — Search ranking + trending + analytics ✅ VERIFIED
- **Goal:** Rank and trend components by popularity, recency, and behavior; capture analytics to feed it.
- **Key deliverables:** ranking signals (views/saves/recency) captured; trending computed from real signals; analytics events recorded; search results ordered by combined behavioral + popularity score.
- **Depends on:** Phase 4 (semantic search) + Phase 7 (favorites as a signal) + Phase 6 (trending strip to feed).
- **Local Build Checkpoint:** PASSED — Redis configured, rate-limiting active, TrendingStrip dynamically rendering.
- **graphify:** `graphify update .`

### Phase 14 — Deploy + scale hardening ✅ VERIFIED
- **Goal:** Make it production-grade — deploy, caching, rate limits, observability, error handling.
- **Key deliverables:** prod deploy pipeline; response/data caching; rate limiting on search + AI generation; observability (logs/metrics/errors); graceful error handling across surfaces.
- **Depends on:** all prior phases (this hardens the whole app). **High-risk: deploy/runtime — needs a manual-first evidence pack.**
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → app runs clean locally with caching + rate limits active; then verify the deployed environment matches.
- **graphify:** `graphify update .`

### Phase 17 — Multiple Demos & Demo Video Support ✅ CODE DONE (automated gates verified 03-07-26)
- **Goal:** Support complex components that have multiple named demo variants and manual pre-recorded MP4 video previews.
- **Key deliverables shipped (commit a10aa41, 26 files +733):** `Demos:` frontmatter field (single-line JSON `{id,label,video?}`); heading-keyed per-demo source blocks; `parseRawEntry` extension + `stripDemoPaywall` pure function; `validate-registry.mjs` Demos validation with security constraints (id/video regex, 13 tests); `ComponentPayload` optional `Demos` field; demo pill selector in `PreviewTabs` toolbar (client component, aria-pressed, not a nested tab row); per-demo Shiki `Promise.all` fan-out; `SoftButtonAdvanced` curated variant + demoId-keyed `COZY_PREVIEWS`; Git LFS `.gitattributes` for `public/previews/**`; `ops/copy-demo-video.mjs` helper; Demos entries with placeholder video paths on all 5 curated registry files.
- **Status note:** All Fully-Automated gates green (C1–C12, security scan PASS after 1 fix cycle). Manual Local Build Checkpoint (C13 pill visual + C14 MP4 browser playback) PENDING — blocked on real Clerk dev keys in `apps/web/.env.local` (pre-existing env blocker, not a regression). Real MP4 recordings and R2 migration deferred to Phase 18.
- **Plan:** [phase-17-multi-demos_PLAN_03-07-26.md](../../completed/phase-17-multi-demos_03-07-26/phase-17-multi-demos_PLAN_03-07-26.md)
- **Report:** [phase-17-multi-demos_REPORT_03-07-26.md](../../completed/phase-17-multi-demos_03-07-26/phase-17-multi-demos_REPORT_03-07-26.md)
- **Depends on:** Phase 4 (Qdrant) and Phase 5 (Component detail page).
- **graphify:** `graphify update .`

### Phase 18 — Cloudflare R2 Asset Migration ✅ CODE DONE
- **Goal:** Migrate component source code and heavy assets (videos, preview images) from local filesystem to Cloudflare R2 to support scale.
- **Key deliverables shipped:** `@aws-sdk/client-s3` devDependency, `ops/r2-client.mjs` lazy-init wrapper; `NEXT_PUBLIC_CDN_URL` prefixing for video paths; fallback hydration in `apps/web/lib/registry.ts`; fire-and-forget R2 uploads in `ops/github-ingest.mjs`.
- **Depends on:** Phase 17 (heavy video assets) and Phase 2 (ingestion pipeline).
- **Plan:** [phase-18-r2-migration_PLAN_04-07-26.md](../../completed/phase-18-r2-migration_04-07-26/phase-18-r2-migration_PLAN_04-07-26.md)
- **Report:** [phase-18-r2-migration_REPORT_04-07-26.md](../../completed/phase-18-r2-migration_04-07-26/phase-18-r2-migration_REPORT_04-07-26.md)
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → ingest a new component and verify its source code is fetched from R2 in the UI.
- **graphify:** `graphify update .`

---

## Part 2b — 21st.dev Feature-Gap Analysis (added 02-07-26)

Comparison of the live 21st.dev product (site + `serafimcloud/21st` repo) against this roadmap. Sources: 21st.dev navigation/pricing pages and the open-source repo README (Next.js + Supabase + Clerk + Cloudflare R2 + Sandpack; three-tier review pipeline `on_review → posted → featured`; multi-demo components with preview images/videos; `npx shadcn` install flow).

| 21st.dev feature | Cozy status | Covered by |
|---|---|---|
| Templates marketplace (landing pages, dashboards, SaaS, ecommerce) | DONE Phase 19 | Phase 19 |
| Themes marketplace (CSS-variable theme packs) | DONE Phase 19 | Phase 19 |
| Creator Studio — in-browser authoring/publish workspace | PARTIAL (Phase 8 has a plain submission form) | Phase 20 (new) |
| Three-tier review pipeline: `on_review → posted → featured` + quality guidelines (a11y, dark-mode, responsive) | PARTIAL (Phase 8 approve/reject only, no "featured" curation tier) | Phase 20 (new) |
| shadcn-compatible registry JSON endpoint (`/r/{slug}.json`) consumable by `npx shadcn add` | MISSING (Phase 5 renders the CLI string but nothing serves the registry payload) | Phase 21 (new) |
| Free-tier usage metering (e.g. 2 copies/installs per day) + AI credit system (100 free / 400 paid monthly credits) | MISSING (Cozy gate is binary free/Pro; Phase 10 AI gen has no user-facing credits) | Phase 22 (new) |
| "Latest this week" feed, creator leaderboard, announcements feed | PARTIAL (Phase 13 trending only) | Phase 23 (new) |
| Site-wide theming via CSS variables + per-preview theme toggle | MISSING (was explicitly out-of-scope; 21st.dev requires dark-mode support for featured status) | Phase 24 (new) — three Cozy themes: Cozy Daylight (default) / Lofi Dusk / Paper Café |
| Org-shared collections + team admin controls | PARTIAL (Phase 12 = seats/billing only; Phase 7 collections are per-user) | Backlog |
| SVG logo search (free utility, svgl-style) | MISSING | Backlog |
| Author premium bundles (paid component packs) | MISSING | Backlog |
| Magic MCP server (LLM-facing search/inject endpoint) | Saved | Backlog Phase 15 |
| Sandpack interactive previews + live editing | Saved | Backlog Phase 16 |
| Multi-demo per component + video previews | Planned | Phase 17 |
| R2/CDN asset storage | DONE | Phase 18 |

### Phase 19 — Templates & Themes marketplaces ✅ VERIFIED COMPLETE (05-07-26)
- **Goal:** Add two new top-level content types beyond components/blocks/hooks: full-page **Templates** and installable **Themes**, each with its own browse surface — matching 21st.dev's Explore split (Components / Themes / Templates).
- **Key deliverables shipped (commit 7ad466e, 19 files):** `Content_Type` extended to `template | theme` in `scripts/validate-registry.mjs` + optional `Palette_Tokens` JSON validation; `RegistryEntry` gained `contentType`/`installSnippet`/`paletteTokens` with theme source-guard opt-out in `parseRawEntry`; existing dynamic `[category]/page.tsx` route serves `/templates` and `/themes` with zero new route files; new `ThemeDetail` server component (palette swatch grid + `<pre><code>` install snippet, no `dangerouslySetInnerHTML`); template detail reuses Phase 17 PreviewTabs/demo-pill machinery unchanged; 4 new curated seed files (`themes__cozy-daylight`, `themes__lofi-dusk` [Pro], `themes__paper-cafe`, `templates__cozy-landing` [Pro]); new `ops/upload-seed-entries.mjs` R2 wrapper with IsPro-skip guard (mirrors commit 90fb7ed) + dedicated test.
- **Status note:** PVL took 1 supplement cycle (GAP-1: R2 upload wrapper needed an explicit IsPro-skip guard — closed by 19d.1/19d.1b). EVL: 6/6 gates green via independent vc-tester (vitest 87/87 across 19 files, validate-registry.test.mjs 20/20, github-ingest 5/5 regression clean, upload-seed-entries 2/2, `node scripts/validate-registry.mjs` 154 files exit 0, both type-checks exit 0).
- **Plan:** [phase-19-templates-themes_PLAN_05-07-26.md](../../completed/phase-19-templates-themes_05-07-26/phase-19-templates-themes_PLAN_05-07-26.md)
- **Report:** [phase-19-templates-themes_REPORT_05-07-26.md](../../completed/phase-19-templates-themes_05-07-26/phase-19-templates-themes_REPORT_05-07-26.md)
- **Depends on:** Phase 2 (schema), Phase 3 (dynamic routing), Phase 17 (multi-demo previews for templates).
- **Deferred (see backlog):** live R2 seed upload (needs real R2 creds — `ops/upload-seed-entries.mjs` is unit-tested but never run against the real bucket); Agent-Probe Local Build Checkpoint (`/templates`, `/themes`, theme detail, locked Lofi Dusk anonymous view) — pending manual dev-server browse; dedicated `/templates` and `/themes` route chrome (nav labels, category-specific empty states) deferred to Phase 20.
- **graphify:** `graphify update .` — run at UPDATE PROCESS 05-07-26.

### Phase 20 — Creator Studio + featured-tier review pipeline ⏳ NEW
- **Goal:** Upgrade Phase 8's plain submission form into a 21st.dev-style Creator Studio (in-browser authoring: code editor, demo management, live preview before submit) and extend moderation to the three-tier `on_review → posted → featured` pipeline.
- **Key deliverables:** studio route with editable code + demo slots + live preview; submission produces a draft registry entry; review states `on_review / posted / featured` stored per entry; featured checklist enforced (visual polish, a11y, dark-mode once Phase 24 lands, responsive); featured entries surface on landing + trending.
- **Depends on:** Phase 8 (submission + moderation base), Phase 16 (Sandpack, if promoted) or existing preview engine.
- **Recommended Agents/Skills (Non-Core):** `vc-ui-ux-designer` (for complex studio UI), `vc-scenario` (to map edge cases for the 3-tier review states).
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → author a component in the studio, submit, approve as `posted`, promote to `featured`, confirm it appears in the featured strip.
- **graphify:** `graphify update .`

### Phase 21 — shadcn registry endpoint + open install API ⏳ NEW
- **Goal:** Make the Phase 5 CLI install command real: serve a shadcn-compatible registry JSON payload per component so `npx shadcn add <url>` works against Cozy Downloads.
- **Key deliverables:** `/r/{slug}.json` (or `/api/registry/{slug}`) route emitting the shadcn registry item schema (files, dependencies, registryDependencies, tailwind config); Pro-gated components require a token/entitlement check before source is served; rate limiting keyed on userId/token; install docs on component pages updated to the real URL.
- **Depends on:** Phase 5 (install command UI), Phase 1 (Pro entitlement), Phase 14 (rate-limit infra).
- **Recommended Agents/Skills (Non-Core):** `vc-predict` (to debate the API payload structure and open-endpoint security before execution).
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → run `npx shadcn add http://localhost:3000/r/soft-button.json` in a scratch project; files land; Pro component without entitlement is refused.
- **graphify:** `graphify update .`

### Phase 22 — Usage metering + credits ⏳ NEW
- **Goal:** Move from a binary free/Pro gate to 21st.dev-style metered freemium: daily free-tier allowances and a monthly credit system for AI generation.
- **Key deliverables:** Redis-backed usage counters (reuse `@upstash/ratelimit` infra) for copies/installs per free user per day; monthly credit ledger for Phase 10 AI generation (free + Pro allocations, decrement per generation, refusal + upsell UI at zero); usage display in account settings; Stripe metadata unchanged (credits are app-side, not billed per-use).
- **Depends on:** Phase 1 (billing tiers), Phase 10 (AI generation), Phase 14 (Redis infra).
- **Recommended Agents/Skills (Non-Core):** `vc-security` (critical for preventing rate-limit bypass and credit double-spending).
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → exhaust the free daily copy allowance, confirm the gate + upsell; run AI generations until credits hit zero, confirm refusal.
- **graphify:** `graphify update .`

### Phase 23 — Community feeds: latest, leaderboard, announcements ⏳ NEW
- **Goal:** Add the engagement loops around the catalog: a week-bucketed "Latest" feed, a creator leaderboard, and an announcements surface.
- **Key deliverables:** `/latest` feed grouped by week from registry ingest dates; creator leaderboard ranked by Phase 13 signals (views/saves/installs); lightweight announcements list (markdown-backed is fine); nav entries for all three.
- **Depends on:** Phase 13 (ranking signals), Phase 8 (creators exist).
- **Recommended Agents/Skills (Non-Core):** `vc-code-reviewer` (to audit for N+1 queries and performance regressions in the feeds).
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → /latest shows week groups; leaderboard ranks seeded creators; announcement renders.
- **graphify:** `graphify update .`

### Phase 24 — Cozy theme system: Cozy Daylight / Lofi Dusk / Paper Café ⏳ NEW
- **DECISION (locked 02-07-26):** Cozy Downloads ships THREE named site themes, all driven by one CSS-variable token set:
  1. **Cozy Daylight** — the DEFAULT theme for all first-time visitors.
  2. **Lofi Dusk** — the dark theme; applied automatically when `prefers-color-scheme: dark` and no stored choice exists.
  3. **Paper Café** — opt-in third theme selected via the header theme switcher.
- **Goal:** Site-wide three-theme system driven by CSS variables — previously out-of-scope, but theming is table stakes on both 21st.dev (featured-status requirement) and reactbits.dev (dark-first identity), and it unblocks the Phase 19 themes marketplace + the Cozy visual identity below.
- **Theme token palettes (from the approved design directions, 02-07-26):**
  - **Cozy Daylight (default):** bg `#FAF6F0`, panel `#FFFFFF`, ink `#2B2622`, muted `#8A7F72`, hairline `#EBE2D6`, accents peach `#FFB98A` / sage `#A8C6A1` / lavender `#C7B9E8`. Type: Fraunces (serif display) + Sora (body).
  - **Lofi Dusk (dark):** bg `#1A1714`, panel `#241F1B`, ink `#F3EDE4`, muted `#A99C8C`, hairline `#342C25`, accents `#E8946A` / `#8FB489` / `#AC9BD6`.
  - **Paper Café:** bg `#F6F1E7`, panel `#FFFDF8`, ink `#3A322B`, muted `#94897B`, hairline `#E7DECE`, accents dusty rose `#E8A9A0` / teal-sage `#9DBFB4` / butter `#F2D5A0`. Signature flourish: polaroid-tilted card framing (echoes the `polaroid-card` seed component).
- **Key deliverables:** single CSS-variable token set (colors, radii, shadows, fonts) consumed by Tailwind config; three theme definitions as `[data-theme="daylight" | "dusk" | "cafe"]` variable overrides with `daylight` as the no-attribute default; 3-option theme switcher in header with persisted choice (localStorage/cookie) + `prefers-color-scheme: dark` → Lofi Dusk fallback when unset; component preview panes get an independent theme toggle; all 5 seed components verified in all three themes; no theme flash on first paint (inline theme script or cookie-based SSR).
- **Depends on:** Phase 6 (visual identity base).
- **Recommended Agents/Skills (Non-Core):** `modern-web-guidance` (mandatory to ensure modern CSS theming practices like CSS-variables and system-preference media queries are used), `vc-ui-ux-designer`.
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → site loads in Cozy Daylight by default; cycle switcher through Lofi Dusk and Paper Café, confirm no unstyled surfaces in any theme; reload preserves choice; toggle a preview pane independently of the site theme.
- **graphify:** `graphify update .`

### Cozy visual identity target (for Phases 19–24 UI work)
Layout skeleton cloned from 21st.dev; skin is Cozy's own. **DECISION (02-07-26): the three design directions are adopted as the site's three shipping themes — Cozy Daylight (DEFAULT) / Lofi Dusk (dark) / Paper Café (opt-in). Full token palettes live in Phase 24.**
- **Structure (21st.dev):** top nav (logo · Explore/Build menus · ⌘K command search · theme switcher · auth) + slim left category sidebar + dense responsive grid of live-preview cards; component detail = large preview pane with Preview/Code tabs + right rail (install command, dependencies, author attribution, version selector, favorite button).
- **Cozy Daylight (DEFAULT theme):** oat/cream background `#FAF6F0`, warm ink text `#2B2622`, pastel accents (peach `#FFB98A`, sage `#A8C6A1`, lavender `#C7B9E8`), `rounded-2xl` cards with soft diffuse shadows, serif display face for hero (Fraunces) over a humanist sans body (Sora).
- **Lofi Dusk (dark theme, via Phase 24 variables):** warm charcoal `#1A1714`, subtle film-grain texture, peach→lavender glows on hover, reactbits-style animated hero; auto-selected for `prefers-color-scheme: dark` visitors with no stored choice.
- **Paper Café (opt-in theme):** warm paper tones `#F6F1E7` with dusty rose / teal-sage / butter accents; polaroid-tilted card framing as the signature flourish (echoes the `polaroid-card` seed component).

---

---

## Part 3: Program Goal Charter & Autonomous Execution

### Program Goal Charter
```
Cozy Downloads — 21st.dev-Clone Monetization + Catalog Expansion — Program Goal Charter

North star:
- Transform Cozy Downloads from a 5-component seed store into a 21st.dev-scale MIT
  component storefront with dual Stripe billing (subscription + lifetime), a registry-driven
  Pro gate, and a bundle-safe catalog of hundreds of components/blocks/hooks with semantic search.

Definition of done (all must be true):
1. Checkout route accepts both "subscription" and "payment" modes; correct Stripe price is used per mode.
2. Webhook handles all 5 lifecycle events; subscription cancellation revokes isPro; idempotent.
3. isPro check reads registry IsPro frontmatter field — no hardcoded Set in tiers.ts.
4. Registry schema enforces Author, Source_Repo, License_SPDX, Content_Type, IsPro on every entry.
5. ops/github-ingest.mjs performs MIT license gate, attribution capture, heavy-dep warning; does NOT write to packages/ui/src/.
6. getCatalog() reads registry dir dynamically; 10+ distinct category pages each with 5+ entries.
7. Attribution (author name, source repo URL, MIT label) visible on every component detail page.
8. Local Qdrant populated; /api/search returns relevant results for behavioral queries.
9. Build produces no bundle bloat from ingested components (heavy deps absent from main chunk).
10. All 15 SPEC ACs pass their stated proving strategies.

What "verified" means (program level):
- Each phase: validate-contract written by vc-validate-agent + EVL gate commands green + phase report written.
- Program level: all 15 ACs proven per their strategies (Fully-Automated / Hybrid / Agent-Probe).
- A phase without a validate-contract (or documented skip reason) cannot be marked VERIFIED.

Scope tiers → phase mapping:
- Tier 1 Billing + Auth → Phase 1 (ACs 3,4,5,6,7,8,9,15)
- Tier 2 Registry + Ingest → Phase 2 (ACs 10,11)
- Tier 3 Catalog routing → Phase 3 (ACs 1,13)
- Tier 4 Ingestion run + search → Phase 4 (ACs 1,12,14)
- This program retires all 4 Tiers.

Explicitly out of scope (deferred tier):
- AI code generation / Magic MCP credits
- Community author publishing / revenue share
- User-created collections or favorites
- Component versioning
- Team / organization billing
- Free-tier trial of source code
- Automated scraping of 21st.dev

Hard safety constraints (non-negotiable, per phase):
1. NEVER re-introduce bundle bloat — ingested components are registry-as-data only; NEVER
   imported into @repo/ui; ops/github-ingest.mjs MUST NOT write to packages/ui/src/.
2. BILLING CORRECTNESS — subscription cancellation MUST revoke isPro; no PII in Clerk
   publicMetadata; webhook MUST be idempotent (check current metadata before writing);
   Stripe signature MUST be verified before processing any event.
3. MIT ATTRIBUTION — Author, Source_Repo, License_SPDX preserved per ingested component;
   components without confirmed MIT license rejected at ingestion.
4. NO LIVE STRIPE/CLERK CALLS without env keys set AND explicit user opt-in for any
   billable or irreversible action.
5. Commit each phase's execution changes before starting the next. Keep process/plan commits
   separate from execution commits.
```

### Stable Program Goal
```
SESSION GOAL: monetization-catalog — 21st.dev-Clone Monetization + Catalog Expansion
Ref: process/features/monetization-catalog/active/21st-clone_27-06-26/21st-clone-umbrella_PLAN_27-06-26.md

TARGET: Complete ALL 4 phases until:
- All 15 SPEC ACs pass their stated proving strategy
- All phase exit gates green + phase reports written
- Build exits 0 with no bundle bloat regression
- Test tiers: automated (iterate-until-green) / hybrid (fix-if-in-blast-radius) / agent-probe (record-judgment)

AUTONOMY: Before ANY subagent spawn, read:
1. Umbrella ## Current Execution State → current loop step + validate-contract status
2. Phase plan ## Phase Loop Progress → first unchecked box = next subagent to spawn

PER-PHASE LOOP (7-step inner loop R→I→P→PVL→E→EVL→UP, SKIPS SPEC):
  1 RESEARCH → 2 INNOVATE → 3 PLAN-SUPPLEMENT → 4 PVL → 5 EXECUTE → 6 EVL → 7 UPDATE-PROCESS
- PLAN-SUPPLEMENT: plan-agent adds research/innovate gaps to phase plan (or marks "n/a — clean")
- PVL NEVER skipped; partial contract = blocked
- Every subagent FIRST ACTION: vc-context-discovery + vc-plan-discovery
- Every phase-END: invoke vc-agent-strategy-compare for next step

Report via phase reports. No approval between phases unless hard stop hit.

HARD STOPS (pause for user):
- Live Stripe/Clerk call without env keys + user opt-in
- Irreversible action without explicit validate-contract instruction
- CASCADE_BLOCKED (two consecutive phases BLOCKED)
- Agent count > 100

SAFETY:
- NEVER write ingested components to packages/ui/src/ — bundle bloat protection
- NEVER process Stripe webhook without verifying Stripe-Signature header
- NEVER store PII in Clerk publicMetadata (only: isPro, stripeSubscriptionId, stripeCustomerId, currentPeriodEnd)
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit):
  corepack pnpm --filter web build 2>&1 | tail -5  # build must exit 0
  grep -r "new Set\(\[" apps/web/lib/tiers.ts || echo "PASS — no hardcoded Set"
  node scripts/validate-registry.mjs 2>&1 | tail -10  # registry linter (Phase 2+)
  node .claude/skills/vc-generate-plan/scripts/validate-plan-artifact.mjs <phase-plan-path>
  # SECURITY: Run vc-security audit on modified code

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 1, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 1.
```

### Per-Phase Entry / Exit Gates
| Phase | Entry | Exit gate |
|

### Per-Phase Loop
Each phase executes the canonical 7-step inner loop `R → I → P → PVL → E → EVL → UP`. SKIPS SPEC.

1. RESEARCH — spawn vc-research-agent: load prior reports, check plan drift, document findings
2. INNOVATE — spawn vc-innovate-agent: decide approach; Decision Summary written
3. PLAN-SUPPLEMENT — spawn vc-plan-agent (supplement mode): update existing phase plan with gaps; write Inner Loop Refresh Note if sections changed
4. PVL — spawn vc-validate-agent: full V1–V7; validate-contract written per example-validate-output.md
5. EXECUTE — spawn vc-execute-agent: implement per approved plan; per-section test gates inline
6. EVL — orchestrator spawns vc-tester & vc-security: re-run gate commands independently; perform STRIDE/OWASP security scan on new code; EVL HANDOFF SUMMARY written
7. UPDATE-PROCESS — spawn vc-update-process-agent: phase report written; umbrella Current Execution State rewritten; commit done

### Autonomous Execution Rules (During /goal)
- CONDITIONAL net gate: proceed autonomously, gaps on record
- BLOCKED net gate: write backlog note, continue to next phase

### Current Execution State
Last updated: 2026-07-05
Current phase: 19 of 24+
Phase 19 name: Templates & Themes marketplaces
Phase 19 status: ✅ VERIFIED COMPLETE — all 6 gates green, PVL 1 supplement cycle (GAP-1 resolved)
Phase 19 EVL: PASS (independent vc-tester run 05-07-26; vitest 87/87, validate-registry 20/20, github-ingest 5/5, upload-seed-entries 2/2, registry lint 154 files exit 0, both type-checks exit 0)
Phase 19 report: process/features/monetization-catalog/completed/phase-19-templates-themes_05-07-26/phase-19-templates-themes_REPORT_05-07-26.md
Next phase: Phase 20 — Creator Studio + featured-tier review pipeline ⏳

Completed phases: Phase 1 (✅ CODE DONE), Phase 2 (✅ VERIFIED), Phase 3 (✅ VERIFIED), Phase 4 (✅ COMPLETE_WITH_CONDITIONALS), Phase 5 (✅ VERIFIED), Phase 6 (✅ VERIFIED), Phase 7 (✅ VERIFIED), Phase 8 (✅ VERIFIED), Phase 9 (✅ VERIFIED), Phase 10 (✅ VERIFIED), Phase 11 (✅ VERIFIED), Phase 12 (✅ VERIFIED), Phase 13 (✅ VERIFIED), Phase 14 (✅ VERIFIED), Phase 17 (✅ CODE DONE — automated gates green; C13/C14 hybrid gates pending Clerk keys; C15/C16 Known-Gap → Phase 18), Phase 18 (✅ CODE DONE — R2 migration live, security-hardened commit 90fb7ed), Phase 19 (✅ VERIFIED COMPLETE — Templates & Themes, commit 7ad466e)
Program Net Gate: IN PROGRESS (Phase 20+ remaining)

Phase 1 known gaps (carried forward): AC-3 + AC-4 — BLOCKED on live Clerk env keys.
Phase 4 known gaps: AC-14 — RESOLVED BY PHASE 10.
Phase 17 known gaps: C13/C14 (hybrid manual) — pending real Clerk dev keys; C15/C16 — Phase 18 backlog.
Phase 19 known gaps: live R2 seed upload deferred to manual (see backlog); Agent-Probe Local Build Checkpoint pending manual dev-server browse.

Orchestrator rule: read "Current phase" and "Next phase" fields before spawning any subagent.

---

## Part 4: Blast Radius & Verification

### Blast Radius
HIGH-RISK classes present: billing (Stripe), auth (Clerk), public API surface

Files modified across all phases:
- `apps/web/app/api/checkout/route.ts`
- `apps/web/app/api/webhooks/stripe/route.ts`
- `apps/web/lib/tiers.ts`
- `apps/web/lib/registry.ts`
- `apps/web/lib/catalog.ts`
- `apps/web/app/(catalog)/[category]/[slug]/page.tsx`
- `apps/web/app/(catalog)/[category]/page.tsx`
- `apps/web/components/site-header.tsx`
- `packages/db/src/schema.ts`
- `packages/db/src/search.ts`
- `ops/github-ingest.mjs`
- `.env.example`
- All `docs/evidence-manifest/registry/*.md` files (frontmatter extension)

Files created:
- `scripts/validate-registry.mjs`
- `apps/web/components/attribution-display.tsx`
- `ops/n8n/` (blueprint update)
- 4 phase report files (one per phase)

### Verification Evidence
| Gate / Scenario | Strategy | Proves SPEC criterion |
|

### Validate Contract
(placeholder — vc-validate-agent writes this section before EXECUTE)

---

## Part 5: Centralized Index of Project Plans and Documents

This index acts as the single source of truth connecting all phases, plans, and contexts across the Cozy Downloads project.

### Harness & Context Docs
- [process/context/all-context.md](../../../../context/all-context.md) — Root context entrypoint
- [process/context/planning/all-planning.md](../../../../context/planning/all-planning.md)
- [process/context/tests/all-tests.md](../../../../context/tests/all-tests.md)
- [process/development-protocols/all-development-protocols.md](../../../../development-protocols/all-development-protocols.md)

### Active Phase Plans (21st-clone Program)
- [21ST-CLONE-ULTIMATE-ROADMAP_27-06-26.md](./21ST-CLONE-ULTIMATE-ROADMAP_27-06-26.md) (This File)
- [Phase 1: Billing Gate Plan](./phase-1-billing-gate_PLAN_27-06-26.md) | [Report](./phase-1-billing-gate_REPORT_27-06-26.md)
- [Phase 2: Registry Schema Plan](./phase-2-registry-schema_PLAN_27-06-26.md) | [Report](./phase-2-registry-schema_REPORT_27-06-26.md)
- [Phase 3: Catalog Routing Plan](./phase-3-catalog-routing_PLAN_27-06-26.md) | [Report](./phase-3-catalog-routing_REPORT_27-06-26.md)
- [Phase Blast Radius Registry](./phase-blast-radius-registry.md)

### Completed Phase Plans & Specs
- [Umbrella Plan](../../completed/21st-clone_27-06-26/21st-clone-umbrella_PLAN_27-06-26.md)
- [Master SPEC](../../completed/21st-clone_27-06-26/21st-clone_SPEC_27-06-26.md)
- [Phase 4: Ingestion & Qdrant Plan](../../completed/21st-clone_27-06-26/phase-4-ingestion-qdrant_PLAN_27-06-26.md) | [Report](../../completed/21st-clone_27-06-26/phase-4-ingestion-qdrant_REPORT_27-06-26.md)
- [Search UI Wiring Plan](../../../../../general-plans/completed/search-ui-wiring_24-06-26/search-ui-wiring_PLAN_24-06-26.md) | [Report](../../../../../general-plans/completed/search-ui-wiring_24-06-26/search-ui-wiring_REPORT_24-06-26.md)

### Legacy Build Phases (Atomic Specs)
- [01-monorepo-init.md](../../../../../../docs/phases/01-monorepo-init.md)
- [02-routing-shell.md](../../../../../../docs/phases/02-routing-shell.md)
- [03-qdrant-connection.md](../../../../../../docs/phases/03-qdrant-connection.md)
- [04-preview-engine.md](../../../../../../docs/phases/04-preview-engine.md)
- [05-n8n-ingestion.md](../../../../../../docs/phases/05-n8n-ingestion.md)
- [06-remap-text-animations.md](../../../../../../docs/phases/06-remap-text-animations.md)
- [07-remap-animations.md](../../../../../../docs/phases/07-remap-animations.md)
- [08-remap-backgrounds.md](../../../../../../docs/phases/08-remap-backgrounds.md)
- [10-engine-text-animations.md](../../../../../../docs/phases/10-engine-text-animations.md)
- [11-engine-animations.md](../../../../../../docs/phases/11-engine-animations.md)
- [12-engine-backgrounds.md](../../../../../../docs/phases/12-engine-backgrounds.md)
- [13-engine-components.md](../../../../../../docs/phases/13-engine-components.md)
- [14-auth-clerk.md](../../../../../../docs/phases/14-auth-clerk.md)
- [15-stripe-billing.md](../../../../../../docs/phases/15-stripe-billing.md)

### Backlog / Saved For Later

#### Phase 15: Magic MCP Server Integration (Saved)
**Goal:** Allow AI coding assistants (Cursor, Windsurf, Claude Code) to seamlessly discover, read, and inject Cozy components into the user's codebase.
- **Why it matters:** 21st.dev monetizes and drives massive engagement through its "Magic MCP" server. It provides an HTTP/SSE endpoint (`/api/search-mcp`) that exposes the component registry directly to LLMs.
- **Key Deliverables:** Next.js API route (`/api/search-mcp`) implementing the Model Context Protocol (MCP) over SSE. Rate limiting and Pro-gate verification via Clerk authentication on the MCP token.

#### Phase 16: Sandpack Interactive Previews & Live Editing (Saved)
**Goal:** Upgrade the static Shiki-based code preview to a fully interactive, in-browser bundler.
- **Why it matters:** 21st.dev uses Sandpack to let users tweak components (including npm dependencies) directly on the website before installing.
- **Key Deliverables:** Replace static `Preview/Code` engine with `@codesandbox/sandpack-react`. Backend bundler support for resolving dynamic imports and styles. Real-time live reloading.

#### Org-shared collections + team admin controls (Saved — gap vs 21st.dev, added 02-07-26)
**Goal:** Extend Phase 7 per-user collections to Clerk-organization scope with admin curation.
- **Why it matters:** 21st.dev's Team tier sells "shared collections & admin controls" on top of seats; Phase 12 only covers seats/billing.
- **Key Deliverables:** org-scoped collection storage; member read / admin write permissions; org switcher in collections view.

#### SVG logo search (Saved — gap vs 21st.dev, added 02-07-26)
**Goal:** Free svgl-style logo search utility as a traffic/SEO surface.
- **Why it matters:** 21st.dev keeps "inspiration and SVG logo search always free" as a top-of-funnel hook.
- **Key Deliverables:** logo search route backed by an MIT/CC logo dataset; copy-as-SVG/JSX buttons; no auth required.

#### Author premium bundles (Saved — gap vs 21st.dev, added 02-07-26)
**Goal:** Let approved authors sell curated component packs at a one-time price with revenue share.
- **Why it matters:** 21st.dev monetizes creators via paid bundles; Cozy already has Stripe Connect (Phase 9) to settle payouts.
- **Key Deliverables:** bundle entity (N registry entries + price); bundle checkout via existing Stripe Connect split; bundle entitlement checked by the Pro gate alongside `isPro`.
