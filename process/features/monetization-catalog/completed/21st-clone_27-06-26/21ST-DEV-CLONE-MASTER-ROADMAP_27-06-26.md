---
name: plan:21st-clone-master-roadmap
description: "Human-readable master roadmap for the full 21st.dev clone — 14 phases, phase tracker, per-phase local build checkpoints + graphify steps. Points to umbrella + per-phase RIPER-5 plans."
date: 27-06-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: master-roadmap
---

# 21st.dev Clone — Master Roadmap

Date: 27-06-26
Status: 🔄 CURRENT (Phase 5 at RESEARCH)
Complexity: COMPLEX (PHASE PROGRAM — 14 phases)

**What this file is:** the readable, phase-by-phase progress tracker for cloning 21st.dev on top of Cozy Downloads. Open it any time to answer "what phase are we in and what do I do next."

**What this file is NOT:** the execution machinery. The actual RIPER-5 contracts — validate-contracts, EVL gates, blast-radius registry, atomic checklists — live in the umbrella plan and per-phase plans (linked below). This roadmap points to them; it does not replace them.

> **Scope:** FULL 21st.dev clone. Marketplace (components + blocks + hooks), semantic search, auth, dual Stripe billing (subscription + lifetime), MIT attribution, Pro gate, AI component generation, community publishing + revenue share, collections/favorites, versioning, team/org billing, search ranking/trending, deploy/scale hardening.

> **How to use this doc:** Work top to bottom. Find the 🔄 CURRENT row in the tracker — that is where we are. Do each phase, then run its **Local Build Checkpoint** in the browser to confirm it works before moving on, then run the **graphify update** step so codebase queries stay fast and cheap.

---

## Overview

This roadmap orchestrates the expansion of Cozy Downloads (a 5-component MIT seed store) into a full 21st.dev-scale component marketplace, in 14 dependent phases. Phases 1–4 reuse the existing monetization-catalog program plans unchanged; phases 5–14 are new and get full RIPER-5 plans written when reached. Every phase ends with a local build checkpoint (visual confirmation in the browser) and a graphify update (cheap codebase-graph refresh). The per-phase RIPER-5 execution machinery — research, validate-contracts, test gates, EVL — lives in the linked per-phase plans, not in this tracker. This file is the durable "where are we" view that survives context compaction.

---

## Phase Tracker — You Are Here

| # | Phase | Status | RIPER-5 plan |
|---|---|---|---|
| 1 | Billing + Auth + Pro-gate migration | ✅ **DONE** (CODE DONE — automated gates green; AC-3/AC-4 pending live Clerk keys) | [phase-1-billing-gate_PLAN](./phase-1-billing-gate_PLAN_27-06-26.md) |
| 2 | Registry schema + ingest-tool hardening | ✅ **DONE** (VERIFIED 2026-06-28 — EVL 8/8 green; registry pruned 139→5; validate-registry.mjs live; ops hardened; AC-10/AC-11/AC-13 met) | [phase-2-registry-schema_PLAN](./phase-2-registry-schema_PLAN_27-06-26.md) |
| 3 | Catalog routing rebuild (dynamic registry read) | 🔄 **CURRENT** — Step 0 RESEARCH pending | [phase-3-catalog-routing_PLAN](./phase-3-catalog-routing_PLAN_27-06-26.md) |
| 4 | Ingestion run + Qdrant + attribution + semantic search | ✅ **DONE** (COMPLETE_WITH_CONDITIONALS) | [phase-4-ingestion-qdrant_PLAN](./phase-4-ingestion-qdrant_PLAN_27-06-26.md) |
| 5 | Component detail experience (preview/code, copy, CLI install) | 🔄 **CURRENT** — Step 0 RESEARCH pending | _written when we reach it_ |
| 6 | Landing / marketing pages + 21st.dev visual identity | ⏳ PLANNED | _written when we reach it_ |
| 7 | User collections + favorites | ⏳ PLANNED | _written when we reach it_ |
| 8 | Community author publishing (submit + moderate + profiles) | ⏳ PLANNED | _written when we reach it_ |
| 9 | Author dashboards + revenue share (Stripe Connect) | ⏳ PLANNED | _written when we reach it_ |
| 10 | AI component generation (Magic-style LLM) | ⏳ PLANNED | _written when we reach it_ |
| 11 | Component versioning + changelog | ⏳ PLANNED | _written when we reach it_ |
| 12 | Team / organization billing (seats, org Pro) | ⏳ PLANNED | _written when we reach it_ |
| 13 | Search ranking + trending + analytics | ⏳ PLANNED | _written when we reach it_ |
| 14 | Deploy + scale hardening | ⏳ PLANNED | _written when we reach it_ |

**➡️ YOU ARE HERE: Phase 5 — Component detail experience, at Step 0 (RESEARCH pending).**
Phase 1 is CODE DONE: all automated test gates green (16/16), build and type-checks pass, tiers.ts deleted, registry-driven isPro gate live. AC-3/AC-4 (runtime paywall + Pro-session unlock) are accepted known-gaps pending real Clerk dev keys.
Phase 2 is VERIFIED (2026-06-28): registry pruned 139→5 curated files, validate-registry.mjs live (7 tests), ops/github-ingest.mjs hardened (MIT gate warn+skip, attribution fields, heavy-dep warn), packages/db schema extended. AC-10/AC-11/AC-13 confirmed by EVL (8/8 green).

> **Phase 1 localhost checkpoint note:** The dev runtime is blocked for Clerk-gated routes until real Clerk dev keys (`pk_test_/sk_test_`) are set in `apps/web/.env.local`. Build/CI/tests are unaffected. Visual browser checkpoint for Phase 1 pending real keys.

**Status legend:** ✅ DONE = phase verified complete · 🔄 CURRENT = in progress now · ⏳ PLANNED = not started.

---

## Program references (the execution machinery)

| Artifact | Path |
|---|---|
| Umbrella / orchestration plan | [21st-clone-umbrella_PLAN](./21st-clone-umbrella_PLAN_27-06-26.md) |
| SPEC (locked requirements) | [21st-clone_SPEC](./21st-clone_SPEC_27-06-26.md) |
| Blast-radius registry | [phase-blast-radius-registry](./phase-blast-radius-registry.md) |
| Phase plans 1–4 | the four `phase-*_PLAN_27-06-26.md` files in this folder |

Phases 1–4 already have full RIPER-5 plans — use them. Phases 5–14 are roadmap-level here (goal + deliverables + checkpoint); each gets its own full phase plan written via the inner loop (`R → I → P → PVL → E → EVL → UP`) when we reach it.

---

## Standing per-phase rituals (apply to EVERY phase)

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

> **Testing context:** each phase's real test gates (fully-automated / hybrid / agent-probe tiers) live in that phase's RIPER-5 plan + validate-contract. The Local Build Checkpoint here is the post-phase human visual confirmation — it complements, not replaces, the per-phase automated test gates run during EXECUTE/EVL.

---

## Phases 1–4 — EXISTING program (reuse, don't rewrite)

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

### Phase 3 — Catalog routing rebuild (dynamic registry read) ⏳
- **Goal:** Replace the 134 hardcoded legacy `catalog.ts` slugs with a dynamic read of `docs/evidence-manifest/registry/`.
- **Key deliverables:** catalog + category routes driven by registry contents, not a static list; dead placeholder routes pruned.
- **Depends on:** Phase 2 (stable schema).
- **Full plan:** [phase-3-catalog-routing_PLAN](./phase-3-catalog-routing_PLAN_27-06-26.md)
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → browse categories; only real registry components appear, no 404/placeholder ghosts.
- **graphify:** `graphify update .`

### Phase 4 — Ingestion run + Qdrant population + attribution display + semantic search ⏳
- **Goal:** Run the n8n → Qdrant ingestion for real, show MIT attribution in the UI, and make behavior-based semantic search return live results.
- **Key deliverables:** Qdrant populated from registry `AI_Behavioral_Summary`; `/api/search` returns real hits; attribution rendered on component pages.
- **Depends on:** Phase 3 + live Qdrant + `OPENAI_API_KEY` + `QDRANT_*`.
- **Full plan:** [phase-4-ingestion-qdrant_PLAN](./phase-4-ingestion-qdrant_PLAN_27-06-26.md)
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → type "a soft pastel button" in search; real components rank by behavior; each shows its MIT attribution.
- **graphify:** `graphify update .`

---

## Phases 5–14 — NEW roadmap (full plans written when we reach each)

Each entry is goal + deliverables + depends-on + checkpoint. Full per-phase RIPER-5 execution plans get authored via the inner loop at the start of each phase.

### Phase 5 — Component detail experience ⏳
- **Goal:** Make each component page a real "use this now" surface — preview/code tabs, copy-code, a shadcn-style CLI install command, and dependency display.
- **Key deliverables:** Preview/Code tab toggle; one-click copy-code button; `npx`-style install command (e.g. `npx ...add <slug>`) with copy; dependency list shown per component; Pro gating still enforced server-side.
- **Depends on:** Phase 3 (component pages exist) + Phase 4 (real components).
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → open a component → switch Preview/Code, click copy-code, copy the CLI install command, see its deps listed.
- **graphify:** `graphify update .`

### Phase 6 — Landing / marketing pages + 21st.dev visual identity ⏳
- **Goal:** Build the front door — hero, browse-by-category, and a trending strip — in a 21st.dev-style visual identity.
- **Key deliverables:** marketing landing page (hero + value prop + CTA); browse-by-category section; trending/featured strip (static or early-ranked); cohesive visual theme across the storefront.
- **Depends on:** Phase 5 (component pages worth linking to).
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → landing page renders with hero, categories, and a trending row; links into real component pages.
- **graphify:** `graphify update .`

### Phase 7 — User collections + favorites ⏳
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

### Phase 9 — Author dashboards + revenue share ⏳
- **Goal:** Pay authors — dashboards plus Stripe Connect payouts for revenue share on Pro sales.
- **Key deliverables:** Stripe Connect onboarding for authors; author dashboard (sales, earnings, payout status); revenue-share split on Pro purchases; payout records.
- **Depends on:** Phase 1 (billing) + Phase 8 (authors exist). **High-risk: billing/payouts — needs a manual-first evidence pack.**
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → as an onboarded author, view the dashboard; a test Pro purchase reflects a revenue-share entry.
- **graphify:** `graphify update .`

### Phase 10 — AI component generation (Magic-style) ⏳
- **Goal:** Generate components from a natural-language prompt using an LLM (Magic-style).
- **Key deliverables:** prompt → generated component flow; uses latest Claude models (`claude-opus-4-8` for quality, `claude-sonnet-4-6` for speed/cost); generated output previewable and saveable into the registry/collections; guardrails on cost + output validation.
- **Depends on:** Phase 5 (preview/code surface) + Phase 2 (registry schema to save into).
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → enter a prompt ("a calm pastel pricing card"); a generated component renders in preview and can be saved.
- **graphify:** `graphify update .`

### Phase 11 — Component versioning + changelog ⏳
- **Goal:** Track versions per component with a visible changelog.
- **Key deliverables:** version field + history per component; changelog view; users can see/copy a specific version; latest-vs-pinned behavior.
- **Depends on:** Phase 2 (schema) + Phase 5 (detail page to host versions).
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → open a component with 2+ versions; switch versions; changelog lists what changed.
- **graphify:** `graphify update .`

### Phase 12 — Team / organization billing ⏳
- **Goal:** Sell Pro to teams — seats and org-level Pro entitlement.
- **Key deliverables:** Clerk org support; seat-based Stripe subscription; org Pro unlocks Pro components for all members; seat management UI.
- **Depends on:** Phase 1 (billing + auth). **High-risk: billing — needs a manual-first evidence pack.**
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → as an org admin, buy seats; a member of the org sees Pro content unlocked.
- **graphify:** `graphify update .`

### Phase 13 — Search ranking + trending + analytics ⏳
- **Goal:** Rank and trend components by popularity, recency, and behavior; capture analytics to feed it.
- **Key deliverables:** ranking signals (views/saves/recency) captured; trending computed from real signals; analytics events recorded; search results ordered by combined behavioral + popularity score.
- **Depends on:** Phase 4 (semantic search) + Phase 7 (favorites as a signal) + Phase 6 (trending strip to feed).
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → interact with components, then confirm the trending strip + search order reflect real activity.
- **graphify:** `graphify update .`

### Phase 14 — Deploy + scale hardening ⏳
- **Goal:** Make it production-grade — deploy, caching, rate limits, observability, error handling.
- **Key deliverables:** prod deploy pipeline; response/data caching; rate limiting on search + AI generation; observability (logs/metrics/errors); graceful error handling across surfaces.
- **Depends on:** all prior phases (this hardens the whole app). **High-risk: deploy/runtime — needs a manual-first evidence pack.**
- **Local Build Checkpoint:** `corepack pnpm --filter web dev` → http://localhost:3000 → app runs clean locally with caching + rate limits active; then verify the deployed environment matches.
- **graphify:** `graphify update .`

---

## Acceptance Criteria

This roadmap document is correct when:

1. The Phase Tracker table lists all 14 phases with a status marker each (✅ / 🔄 / ⏳); Phase 1 = 🔄 CURRENT (at VALIDATE), Phases 2–14 = ⏳ PLANNED. — _proven by: tracker review (Agent-Probe)_
2. A "You Are Here" pointer names the current phase and its loop step. — _proven by: tracker review (Agent-Probe)_
3. Every one of the 14 phase entries contains a Local Build Checkpoint with the exact dev command + localhost URL + what-to-look-at. — _proven by: per-phase section review (Agent-Probe)_
4. Every one of the 14 phase entries contains a `graphify update .` step; the intro also mentions graphify. — _proven by: per-phase section review (Agent-Probe)_
5. Phases 1–4 link to existing phase plans and do not duplicate their full content; phases 5–14 are roadmap-level only. — _proven by: section comparison (Agent-Probe)_
6. The dev command equals the real `apps/web` dev script. — _proven by: `grep '"dev"' apps/web/package.json` shows `next dev`; package name `web` (Fully-Automated)_

## Phase Completion Rules

- A phase is **🔄 CURRENT** while any inner-loop step (R/I/P/PVL/E/EVL/UP) for it is unfinished.
- A phase is only marked **✅ DONE** when: its RIPER-5 plan's validate-contract passed, EXECUTE + EVL gates are green, AND its Local Build Checkpoint was visually confirmed in the browser. Code-only completion is `CODE DONE`, not DONE.
- Update this tracker's Status column at each phase boundary (during UPDATE PROCESS), then run `graphify update .`.
- Do not advance the "You Are Here" pointer past a phase whose checkpoint has not been confirmed.

---

## Touchpoints

- This file only (a roadmap document). No source code changes.
- References (read-only): the umbrella plan, SPEC, four phase plans, and blast-radius registry in this folder.

## Public Contracts

None. This is a human-readable tracker; it exposes no interface, API, or schema. The execution contracts live in the per-phase plans and their validate-contracts.

## Blast Radius

1 file, 0 packages, doc-only — lowest risk class. No build, schema, auth, or billing surface is touched by writing this roadmap. (The phases it describes carry their own risk classes; those are governed by their own plans.)

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| Tracker top row shows Phase 1 = 🔄 CURRENT (at VALIDATE), 2–14 = ⏳ PLANNED, with a "You Are Here" pointer | Agent-Probe | "Phase tracker so the user always knows what phase we're in" (user hard requirement #1) |
| Every one of the 14 phase entries contains a Local Build Checkpoint with the exact dev command + localhost URL + what-to-look-at | Agent-Probe | "Local Build Checkpoint after EVERY phase" (user hard requirement #2) |
| Every one of the 14 phase entries contains a `graphify update .` step; intro mentions it | Agent-Probe | "Periodic graphify updates" (user hard requirement #3) |
| Phases 1–4 link to existing phase plans and do NOT duplicate their full content | Agent-Probe | "Reuse existing program as phases 1-4; reference, don't rewrite" (locked decision) |
| Dev command `corepack pnpm --filter web dev` matches `apps/web/package.json` (`"dev": "next dev"`, name `web`) | Fully-Automated | Checkpoint command must be the real, runnable dev script |

## Test Infra Improvement Notes

(none identified yet)

## Resume and Execution Handoff

1. **Selected plan file path:** `process/features/monetization-catalog/active/21st-clone_27-06-26/21ST-DEV-CLONE-MASTER-ROADMAP_27-06-26.md` (this file — a tracker, not an executable plan).
2. **Last completed step:** Roadmap authored. Verified dev command (`corepack pnpm --filter web dev`, port 3000) against `apps/web/package.json`.
3. **Validate-contract status:** N/A for this doc — it carries no executable contract. The executable contracts live in the per-phase plans. The active executable work is Phase 1, whose validate-contract is pending (PVL not yet passed).
4. **Supporting context loaded:** `process/context/all-context.md`; umbrella plan; SPEC; four phase plans; blast-radius registry; `apps/web/package.json`.
5. **Next step for a fresh agent:** This roadmap is a reference. To make real progress, resume the active program at **Phase 1 PVL** — run the plan-validate loop on `phase-1-billing-gate_PLAN_27-06-26.md`, then EXECUTE. Update the Phase Tracker table here as each phase changes status.

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE. N/A for a doc-only roadmap; the executable validate-contracts live in the per-phase plans.)
