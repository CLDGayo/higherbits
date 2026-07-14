---
name: spec:21st-clone
description: "Product-discovery requirements doc — 21st.dev-clone monetization model + large MIT catalog expansion for Cozy Downloads"
date: 27-06-26
feature: monetization-catalog
---

# Cozy Downloads — 21st.dev-Clone Monetization + Catalog Expansion

**SPEC date:** 27-06-26
**Feature folder:** `process/features/monetization-catalog/`
**Status:** LOCKED — ready for INNOVATE

---

## Summary

Cozy Downloads will expand from a 5-component seed store into a large curated storefront of hundreds of MIT-licensed React UI components, matching the taxonomy breadth of 21st.dev (buttons, cards, heroes, backgrounds, inputs, navbars, tabs, dialogs, tables, pricing, and more). The monetization model gates full component **source code** behind a Pro tier — free visitors browse live previews across the full catalog, while Pro subscribers (recurring monthly or lifetime one-time purchase) unlock the raw source, CSS, and install commands for every component. This extends Cozy's existing server-side paywall and Stripe/Clerk scaffolding, which are already partially wired from prior commits. The catalog also gains two new content types alongside single components: **blocks** (multi-component page sections) and **hooks** (reusable React hooks). Every ingested component carries MIT license notices and author attribution, and ingested assets must not introduce heavyweight dependency bundle bloat into the webpack graph.

---

## User Stories / Jobs To Be Done

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

---

## What The User Wants (Behavioral Outcomes)

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

---

## Flow / State Diagram

### Visitor → Pro Upgrade Flow

```
                          Visitor lands on catalog
                                    |
                         Browse categories / search
                                    |
                      Click any component / block / hook
                                    |
                     +-------- isPro? --------+
                     |                        |
                    Yes                       No
                     |                        |
            View full source             Live preview shown
            CSS + install cmd       Source panel shows paywall
            Copy to clipboard            "Unlock with Pro"
                                              |
                                    Click "Unlock with Pro"
                                              |
                          Checkout page: choose billing mode
                                   /          \
                             Monthly          Lifetime
                           subscription     one-time pay
                                   \          /
                                 Stripe Checkout
                                      |
                              Payment success
                                      |
                         Stripe webhook fires
                                      |
                     +---- billing mode? ----+
                     |                       |
                Subscription           One-time payment
                     |                       |
          Set isPro:true              Set isPro:true
          Store sub ID + expiry        No expiry stored
          in Clerk metadata            (permanent flag)
                     |                       |
                User session updated (Clerk claim synced)
                     |
                Redirect back to component — source visible
```

### Subscription Lifecycle (recurring mode)

```
  Active subscription
          |
    Stripe events:
          |
  invoice.paid -----> extend Pro (renew expiry in metadata)
  customer.subscription.deleted  ---> set isPro:false
  customer.subscription.paused   ---> set isPro:false (or grace period)
  invoice.payment_failed (retry exhausted) --> set isPro:false
```

### Ingestion Pipeline Flow

```
  Operator identifies MIT GitHub repo
          |
  ops/github-ingest.mjs
          |
  Fetch raw source, parse README, detect license (MIT check)
          |
     MIT verified?
     /           \
   No             Yes
   |               |
  Skip       Write registry entry:
             docs/evidence-manifest/registry/{category}__{slug}.md
             - YAML frontmatter (Component_Name, Category, Dependencies,
               AI_Behavioral_Summary, Author, Source_Repo, License_SPDX,
               Content_Type: component|block|hook, IsPro flag)
             - Raw source code body
                    |
             n8n pipeline reads registry
                    |
             Embed AI_Behavioral_Summary via OpenAI
                    |
             Upsert vector + payload to Qdrant
                    |
             Component appears in storefront catalog
```

### Pro vs Free State Machine (per user per component)

```
                  [unauthenticated]
                        |
                   [signed in]
                  /           \
           [not Pro]          [isPro = true AND
                               sub active OR lifetime]
                |                       |
          Preview only          Full source + CSS
          Paywall panel         + install command
```

---

## Acceptance Criteria (Testable Outcomes)

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

---

## Out Of Scope

- **AI code generation / Magic MCP credits.** Cozy Downloads gates source code, not AI-powered generation. No MCP server, no credit system, no per-generation billing is in scope for this phase. (This is the primary way 21st.dev monetizes; Cozy's model is simpler.)
- **Community author publishing / revenue share.** External authors submitting their own components for sale, author accounts, or split-revenue models are not in scope. The operator is the sole ingestion agent.
- **User-created collections or favorites.** Bookmarks, personal libraries, or "my collection" features are future work.
- **Component versioning.** Tracking multiple versions of a component over time is not in scope; each slug maps to one current implementation.
- **Automated scraping of 21st.dev's catalog.** The component list must be sourced from the upstream MIT GitHub repositories directly, not by scraping 21st.dev's website or copying their curated list wholesale. (Legal grey area — Cozy ingests MIT source from GitHub, not 21st.dev's presentation layer.)
- **Team / organization billing.** Per-seat billing, team plans, or shared Pro seats are not in scope.
- **Free tier trial of source code.** Free users see previews only; there is no time-limited trial of full source access.
- **Dark/light mode configuration per component.** Component previews render in a single theme; per-component theme switching is future.

---

## Constraints

**C-1 — Existing paywall model is fixed.** Server-side source stripping (strip `source`/`css`/`deps` for Pro slugs before serializing to the client) is the chosen gate model. The gate must remain server-side; no CSS-blur or client-side workaround is acceptable.

**C-2 — Both Stripe billing modes required.** Stripe must be configured with at least two price objects: one for recurring subscription, one for one-time lifetime purchase. The webhook must handle both event shapes.

**C-3 — Subscription lifecycle events must be handled.** At minimum: `checkout.session.completed` (both modes), `customer.subscription.deleted`, `invoice.paid`. Failure to handle cancellation means stale Pro access — a billing correctness defect.

**C-4 — MIT license is a hard gate on ingestion.** No component enters the registry without a confirmed MIT (or MIT-compatible) license on the upstream repository. SPDX `MIT` is the preferred indicator; other permissive licenses (ISC, Apache-2.0) require operator review.

**C-5 — Author attribution is mandatory.** Every ingested component must carry `Author`, `Source_Repo`, and `License_SPDX` in its registry frontmatter. Components without this data are incomplete and must be rejected at ingestion time.

**C-6 — No barrel-export of heavy deps.** The `@repo/ui` barrel (`packages/ui/src/index.ts`) must not statically re-export components that pull in `three`, `matter-js`, `face-api.js`, OGL, or similarly large dependency trees. Dynamic / on-demand loading is required for any component category that carries heavy deps.

**C-7 — Clerk `publicMetadata.isPro` is the single source of truth for Pro status.** The session token claim `publicMetadata` must be configured in Clerk Dashboard so the claim is available server-side via `auth()`. All Pro checks read this field; no parallel Pro flag in a separate database is introduced in this phase.

**C-8 — Clerk env keys are required for auth to work.** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` must be set. `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SUBSCRIPTION_PRICE_ID`, and `STRIPE_LIFETIME_PRICE_ID` must all be present. The ingestion pipeline additionally requires `OPENAI_API_KEY` and `QDRANT_URL` / `QDRANT_API_KEY`.

**C-9 — Pro tier membership stored in registry frontmatter, not code.** The hardcoded `Set<string>` in `apps/web/lib/tiers.ts` is a known gap from the current implementation. The target state has `IsPro` determined by the registry entry, making the catalog operator-controlled without code changes.

**C-10 — Content types must be self-describing.** Every registry entry carries a `Content_Type` field (`component`, `block`, or `hook`) so the UI can badge and filter without inspecting the file structure.

---

## Open Questions

None that block INNOVATE. The following are resolved by the locked decisions or deferred:

- **OQ-1 (resolved):** Gate model = source-code gate (not AI credits). Fixed.
- **OQ-2 (resolved):** Billing = both recurring + lifetime. Fixed.
- **OQ-3 (deferred to PLAN):** Which specific GitHub repos / component libraries to ingest first for the large-mirror catalog. The operator decides at ingestion time; the SPEC requires the infrastructure to accept them.
- **OQ-4 (deferred to PLAN):** Exact Stripe price ID naming convention and whether the two prices live in `.env.local` or a config file. PLAN-level detail.
- **OQ-5 (deferred to PLAN):** Whether to migrate the current `apps/web/lib/tiers.ts` hardcoded Set to registry-frontmatter reads in-place or via a new middleware layer. AC-15 locks the outcome; the approach is INNOVATE/PLAN territory.
- **OQ-6 (deferred to PLAN):** Grace period behavior after `invoice.payment_failed` before revoking Pro. The SPEC requires revocation eventually; timing policy is PLAN-level.
- **OQ-7 (deferred to PLAN):** Exact Qdrant collection schema changes needed to add `Content_Type`, `Author`, and `IsPro` payload fields. Existing schema has `Category` and `Animation_Library`; PLAN must extend.

---

## Background / Research Findings

**21st.dev model (key facts from research):**
- ~324 components across dozens of categories: 130 buttons, 102 inputs, 79 cards, 73 heroes, 33 backgrounds, plus tabs, dialogs, tables, pricing, navbars, etc.
- Three content types: components, blocks, hooks.
- Install mechanism: `npx shadcn` CLI — component source delivered via registry protocol, not npm package.
- Real monetization gate: AI code generation (Magic MCP, ~$20/mo Pro). Raw source is publicly visible on 21st.dev — the Pro gate is on AI features, not source.
- Per-author attribution; community publishing model with author accounts.

**Cozy Downloads current state (from commit 3ed6a40 + all-context.md):**
- 5 live curated components: `soft-button`, `pill-button` (cozy-buttons), `lofi-card`, `polaroid-card` (lofi-cards), `calm-stack` (minimalist-layouts).
- Server-side paywall in `apps/web/app/(catalog)/[category]/[slug]/page.tsx` — strips `source`/`css`/`deps` for Pro slugs. Pro slugs currently hardcoded in `apps/web/lib/tiers.ts` as a `Set`.
- Clerk auth scaffolded: `ClerkProvider` in layout, `middleware.ts`, `auth()` call in component page, `publicMetadata.isPro` check. Env keys not yet set.
- Stripe checkout scaffolded: `apps/web/app/api/checkout/route.ts` (mode: "payment", one-time). Webhook: `apps/web/app/api/webhooks/stripe/route.ts` handles `checkout.session.completed` only, sets `isPro: true`.
- Missing: subscription mode in Stripe checkout, subscription lifecycle webhook events (`customer.subscription.deleted`, `invoice.paid`), subscription ID storage.
- MIT ingestion tool: `ops/github-ingest.mjs` (347 lines) exists but has not been run at scale.
- Qdrant infra: `packages/db` with collection schema and upsert/search helpers. Not populated.
- 134 legacy catalog routes in `apps/web/lib/catalog.ts` for the purged React Bits port — render placeholder previews only.
- Bundle bloat context: commit `c08c2cb` purged the 128-component React Bits port (`three`, `face-api.js`, `matter-js`, OGL pulled in via `@repo/ui` barrel) to fix build bloat. This must not recur.

**User decisions locked before SPEC:**
1. Gate model = source-code gate (Pro unlocks raw source). Not AI generation.
2. Billing = both recurring subscription AND one-time lifetime.
3. Catalog = large mirror of 21st.dev taxonomy, hundreds of components.
4. Content types = components + blocks + hooks (full parity).

**High-risk surfaces (note for INNOVATE/PLAN):**
- Billing / Stripe webhook (correctness of subscription lifecycle)
- Auth / Clerk session claim (isPro propagation speed, session token refresh)
- Public catalog/API (semantic search endpoint, n8n ingestion pipeline integrity)
- Bundle safety (webpack graph impact of ingested components)
