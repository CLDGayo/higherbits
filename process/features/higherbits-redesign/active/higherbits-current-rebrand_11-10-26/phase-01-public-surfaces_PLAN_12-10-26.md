---
name: plan:higherbits-current-rebrand-phase-01-public-surfaces
description: "HigherBits.dev rebrand Phase 01 — public naming, routes, documentation, and image pixels."
date: 12-10-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-redesign
  phase: phase-01
---

# Phase 01 — Public Surfaces and Compatibility

- **Date**: 12-10-26
- **Complexity**: PHASE PROGRAM — Phase 01 of 02
- **Program:** `higherbits-current-rebrand`
- **Umbrella plan:** `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/higherbits-current-rebrand-umbrella_PLAN_12-10-26.md`
- **Status**: ✅ VERIFIED — independent final EVL PASS 2026-10-13; retained active with program task by user boundary
- **Report destination:** `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-01-public-surfaces_REPORT_12-10-26.md`

## Current Closeout — 2026-10-13

2026-10-13 owner reconciliation: Phase 01 is ✅ VERIFIED locally. Independent vc-validate-agent final EVL dated 2026-10-13 (session-phase01-final-evl_REPORT_13-10-26.md) passes AC1–AC6 and A1–D5 after the explicit user baseline acceptance. Actual raw proof was reviewed by that validator; current applicability is supported by 796 source/config/test/docs and 16 asset matches at the recorded endpoints. Current canonical packet decision APPROVE is agent evidence disposition for Phase01 local verification only; historical REJECT/rationale/timestamp are preserved in historicalDecisions. No production/human approval inferred. Original public pre-edit history remains missing; C2 eleven-original aggregate remains writer-only without the original manifest; viewport/tiled capture, supplementary-unit artifact and all other disclosed limits/failures remain intact. No required Phase01 gate is deferred. Commit not required for local verification and prohibited; no archive/move/cleanup. Program/task stay active for outstanding Phase02. Exact next action: fresh RESEARCH on phase-02-first-party-identifiers_PLAN_12-10-26.md, then its own seven-step loop and fresh PVL before execution. See session-phase01-update-process_REPORT_13-10-26.md.

Earlier entry/acceptance/handoff/validation statements are dated snapshots where superseded by this closeout. The inline Validate Contract remains verbatim historical validator ownership; this closeout does not rewrite its CONDITIONAL verdict.

## What's Functional Now

Approved public product identities/copy, additive MCP card/illustrative preview and qualified disclosures are verified with preserved legacy redirects, aliases, subscribe mappings, commands and auth. Ten current public audits, four genuine protected comparisons and final matched MCP comparisons satisfy the explicitly revised standard. Exact evidence and consumer/criterion ledgers are in session-phase01-final-evl_REPORT_13-10-26.md.

## Overview

Update current public branding to HigherBits.dev, naming the former Magic Chat product **HigherBits AI** and the MCP product **HigherBits MCP**. Preserve factual history, legal/vendor disclosures, auth/security, and all route/API/request compatibility contracts. Phase 01 covers public surfaces only; first-party identifier changes remain Phase 02 work, gated on this phase’s VERIFIED exit evidence.

## Purpose

Present current public pages, navigation, pricing, console, onboarding/install guidance, documentation, and branded imagery consistently as HigherBits.dev, HigherBits AI, and HigherBits MCP. Keep legacy URLs, API identifiers/request values, the `npx higherbits-ai` command, factual history/legal/vendor disclosures, and current auth/security behavior unchanged. Phase 02 owns safe first-party identifier renames and cannot begin until this phase is VERIFIED.

## Entry Gate

- The locked SPEC is available and unchanged; this plan is the selected Phase 01 execution anchor.
- Before code edits, capture a fresh read-only baseline: `git branch --show-current`, `git rev-parse HEAD`, `git rev-list --left-right --count HEAD...@{upstream}`, `git status --short --branch`, `git diff --name-only --diff-filter=U`, and scoped status/diffs for every target below. Include untracked files in the status. Do not clean, reset, revert, stage, commit, or overwrite another task’s work.
- The latest planning scan found `main` at HEAD `3f091057`, 5 ahead/70 behind, with modified and untracked source overlapping this scope; an earlier scan reported 4 ahead/70 behind. Re-read rather than using either as an execution baseline. If any target’s ownership/current contents cannot be separated from existing user changes, stop before that target and record the blocker.
- Pinned reports: `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-02-brand-sweep_REPORT_11-07-26.md` and `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-05-long-tail-qa_REPORT_11-07-26.md`. KEEP: `process/features/higherbits-cozy-rebrand/completed/higherbits-cozy-rebrand_12-07-26/phase-02-brand-sweep_PLAN_12-07-26.md`, Step A0 / Survivors. Reconcile historical claims against current source.
- Fresh V1 and all parent-run reviews are complete: 4 dimensions + 18 sections = 22 CONCERN, 0 FAIL, 0 PASS. V5 explicitly accepted concerns on 2026-10-12. The inline CONDITIONAL contract permits only prerequisite-satisfied Phase 01 work; no product implementation or protected proof is claimed.
- Standing Autopilot EXECUTE consent is granted; `EXECUTE CONSENT: standing-granted` in `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/higherbits-current-rebrand_AUTOPILOT_GOAL_12-10-26.md` is authoritative. No renewed execution permission is required. Execution remains gated on a validated contract and established source-hunk ownership; protected proof remains BLOCKED absent an authorized local admin state.
- The Clerk feasibility probe is INCONCLUSIVE (double opt-in was not available); the browser probe is INCONCLUSIVE (`localhost:3000` refused and no authorized local admin session was available). Do not claim auth feasibility, live-provider verification, or route coverage from those probes.
- Source-confirmed admin gates: `apps/web/app/higherbits-mcp/layout.tsx` calls `auth()` and `checkIsAdmin(userId)` and redirects signed-out or non-admin users to `/`; `apps/web/app/magic-chat/page.tsx` applies the same gate before rendering its client page. Before protected content, screenshot, or Axe assertions on either route, require an already-authorized local admin state, then assert the final URL and route-specific identity marker. Never weaken, bypass, or mock the app’s auth boundary. If no authorized state is available, keep those gates BLOCKED while independent signed-out, route/API, and asset checks continue.
- The current Playwright projects are `setup`, `public`, and `studio`; there is no admin project. Admin coverage is conditional on an already-authorized local admin state. Do not create credentials, fabricate storage state, or infer access from the studio project.
- The npm registry lookup was declined and remains unprobed. Preserve the literal `npx higherbits-ai` UI fallback as unresolved; make no claim about registry resolution or functionality. The live API-key RPC probe is excluded; only local mocked API contract proof is in scope.

## Touchpoints

**Public surface inventory; inspect all listed consumers, editing only current product branding:**

- Product routes: `apps/web/app/magic-chat/page.tsx` (current metadata identity is Magic Chat and its server page is admin-gated), `apps/web/app/magic-chat/page.client.tsx` (current client copy and waitlist request), `apps/web/app/higherbits-mcp/layout.tsx` (admin gate), `apps/web/app/higherbits-mcp/page.tsx`, and `apps/web/app/higherbits-mcp/page.client.tsx`.
- MCP console and pricing: `apps/web/app/higherbits-mcp/console/page.tsx`, its client page, `apps/web/app/pricing/page.tsx`, its client page, and `apps/web/components/features/higherbits-mcp/pricing.tsx`.
- Onboarding/install: `apps/web/app/higherbits-mcp/onboarding/page.tsx`, its client page, `apps/web/components/features/higherbits-mcp/get-started/onboarding-server-wrapper.tsx`, `get-started/onboarding-layout.tsx`, `get-started/welcome-onboarding.tsx`, `get-started/api-key-section.tsx`, `get-started/get-started-tabs.tsx`, `get-started/ide-instructions.tsx`, `apps/web/components/features/higherbits-mcp/onboarding/steps/create-component-step.tsx`, `apps/web/components/features/higherbits-mcp/onboarding/steps/install-ide-step.tsx`, `apps/web/components/features/higherbits-mcp/onboarding/steps/select-ide-step.tsx`, `apps/web/components/features/higherbits-mcp/onboarding/steps/troubleshooting-step.tsx`, `apps/web/components/features/higherbits-mcp/onboarding/steps/upgrade-pro-step.tsx`, and `apps/web/components/features/higherbits-mcp/onboarding/steps/welcome-step.tsx`.
- Shared MCP surfaces: `apps/web/components/features/higherbits-mcp/feedback-dialog.tsx`, `higherbits-mcp-header.tsx`, `faq.tsx`, `hero.tsx`, `features.tsx`, `how-it-works.tsx`, `higherbits-mcp-banner.tsx`, `supported-editors.tsx`, and `troubleshooting.tsx`; plus `apps/web/lib/navigation.ts`, the current navigation module, and its caller `apps/web/components/features/main-page/sidebar-layout.tsx`. Preserve the current AI and MCP navigation hrefs (`/magic-chat` and `/higherbits-mcp`).
- Public docs/history/legal: `apps/web/public/llms.txt`, `apps/web/public/llms-full.txt`, `apps/web/app/our-story/page.tsx`, and `apps/web/app/(utility)/terms/page.tsx`, `privacy/page.tsx`, and `refunds/page.tsx`. Keep accurate history, legal notices, vendor/product names, source attribution, and the 21st.dev comparison facts.

**Compatibility and proof:**

- `apps/web/middleware.ts` — existing legacy page redirects.
- `apps/web/app/api/magic/check/route.ts`, `apps/web/app/api/magic/use/route.ts`, `apps/web/app/api/magic/__tests__/legacy-routes.test.ts`, `apps/web/app/api/higherbits-mcp/check/route.ts`, `apps/web/app/api/higherbits-mcp/use/route.ts`, and `apps/web/app/api/higherbits-mcp/__tests__/route.test.ts` — retain exact `/api/magic/check` and `/api/magic/use` alias behavior against the canonical handlers.
- `apps/web/e2e/higherbits-mcp-legacy-redirect.spec.ts` currently tests only `?source=legacy`; extend all three 308 mappings to assert destination plus the full query with encoded values, repeated keys, and multiple parameters.
- `apps/web/e2e/a11y.spec.ts` and `apps/web/playwright.config.ts` — current projects are `setup`, `public`, and `studio`; there is no admin project.
- Focused browser specs: `apps/web/e2e/higherbits-mcp-legacy-redirect.spec.ts` (existing), `apps/web/e2e/higherbits-mcp-signed-out.spec.ts` (public), `apps/web/e2e/higherbits-mcp-route-identity.spec.ts` (admin-only when authorized state exists), `apps/web/e2e/higherbits-mcp-visual-evidence.spec.ts` (admin-only), `apps/web/e2e/a11y.spec.ts` (public routes only), and `apps/web/e2e/higherbits-mcp-a11y.spec.ts` (admin-only). Add/use an `admin` project only when an already-authorized local admin state is supplied; otherwise protected gates remain BLOCKED.
- Focused mocked subscribe specs: `apps/web/app/magic-chat/__tests__/page.client.test.tsx` and `apps/web/app/api/subscribe/__tests__/route.test.ts`. The client must send `POST /api/subscribe` with JSON `type: "magic-chat"`; the handler proof covers all accepted request types and mapping/response behavior without calling a live provider.

**Image consumer inventory (re-scan before edits and record every result):** `apps/web/public/higherbits-mcp-og-image.png` feeds MCP OpenGraph/Twitter metadata in `apps/web/app/higherbits-mcp/page.tsx` and the invite email in `apps/web/lib/emails/invite-template.tsx`; both metadata/email targets are dirty, the OG asset is untracked, and the email image currently uses an absolute HTTPS URL. Preserve the original asset bytes and treat all dirty/untracked hunks as pre-existing until ownership is established. The additive fallback `apps/web/public/higherbits-mcp-social-card.png` is currently missing; do not point either consumer at it until that asset has been created and reviewed. `/magic-preview.webp` is shared by the AI page and MCP hero (`apps/web/app/magic-chat/page.client.tsx` and `apps/web/components/features/higherbits-mcp/hero.tsx`). `apps/web/public/magic-chat-waitilist.webp` (existing misspelled filename) is referenced as the AI page background; `apps/web/public/magic-chat-waitilist.png` exists but is unreferenced; correctly spelled `magic-chat-waitlist.webp` is absent. Also inspect `apps/web/public/magic-chat-og.png` as AI social art and fresh-scan `magic-agent-og-image.png` and `og-image-21st.png` before classifying them. Review the below-fold preview and every consumer, not just the first viewport. Do not rename or delete original/unused candidates as a shortcut.

## Public Contracts

**2026-10-13 Phase 01 acceptance revision (Asia/Tokyo; authoritative):** The user answered: "Use current zero-violation audits plus genuine protected-page deltas." This revises only the historical public pre-edit accessibility-baseline requirement. `A11Y-DELTA-10` now requires all ten current public audits (`/`, `/studio`, `/api-access`, `/our-story`, `/public-dashboard` × light/dark) with zero violations, all four genuine protected before/after comparisons (`/higherbits-mcp`, `/magic-chat` × light/dark) with no new signatures AND no newly affected nodes, and the final affected MCP light/dark matched-baseline deltas. The original public pre-edit capture is missing and unrecoverable in the examined scope; current public proof is post-only and cannot prove historical public non-regression. Never substitute HEAD, reconstructed dirty bytes or another checkout for that capture. All route/auth/identity/image/truth/compatibility requirements and raw failures remain intact. This bounded acceptance revision does not change the locked SPEC, source, program scope, risk approval or Phase 02. This acceptance-revision checkpoint preceded independent final EVL; current Phase01 status is VERIFIED per Current Closeout. Exact evidence, criterion consequences and historical supersession are recorded in `session-baseline-acceptance-revision_REPORT_13-10-26.md` in this task folder; this dated revision overrides earlier pending-choice and literal public-baseline blocker statements only.

**2026-10-12 query-encoding clarification:** Here, full/exact query preservation means ordered parameter names and decoded values, including duplicates, nested values, empty values and literal plus/percent/equal characters; equivalent space encoding (%20 versus +) is allowed. Local installed Next.js source and assertions confirm normalization before middleware invocation. The user requested working legacy compatibility, not raw signed-query byte identity. Preserve existing framework serialization; do not change middleware/auth to satisfy byte-equality tests. Retain 308/path assertions, normalized URLSearchParams equality and independently expected ordered entries. Original raw byte-equality failures remain FAIL under their earlier contract; fresh rerun is required after this transparent low-risk clarification, independently recommended by reviewer and debugger. Byte-sensitive signed-query support is neither introduced nor claimed.

**2026-10-12 public-matrix clarification:** C4's public-only isolation also excludes /contest, whose existing source requires admin authorization. The focused rebrand protects MCP/AI coverage in the separate admin project; it does not claim Contest content coverage from a signed-out redirect. Preserve the inherited route inventory, but public discovery must select only five actual public routes × two themes (10 cases), not the earlier invalid 12-case matrix. This changes test classification only, not application auth or URLs. Record prior timeout/unrun outcomes and any late public baseline honestly; a post-edit zero-violation result proves current public accessibility, not an invented pre-edit capture.

- `/higherbits-mcp` remains the canonical MCP route; `/magic`, `/magic/console`, and `/magic/get-started` retain their current redirect destinations and query strings.
- `/magic-chat` remains the current route for HigherBits AI; do not create `/higherbits-ai` or change the route as part of this phase.
- `/api/magic/check` and `/api/magic/use` remain callable compatibility paths with their current method, response, status, and canonical-handler behavior.
- `/api/subscribe` retains request types `newsletter`, `magic-waitlist`, and `magic-chat`; `/magic-chat` continues to send `POST /api/subscribe` with exact JSON value `type: "magic-chat"`, and the handler retains its existing audience mapping and behavior.
- Preserve the literal `npx higherbits-ai` as an unresolved UI fallback. The npm lookup was declined/unprobed, so do not claim registry resolution or command functionality. Keep existing API identifiers/request values and compatibility aliases; Phase 02 alone may rename first-party identifiers where safe.
- Preserve all query parameters, including encoded values and repeated keys, for the three 308 redirects: `/magic` → `/higherbits-mcp`, `/magic/console` → `/higherbits-mcp/console`, `/magic/get-started` → `/higherbits-mcp/onboarding`. The current redirect spec covers only `?source=legacy`; expanded cases are required proof.
- Retain existing authentication and authorization. No visual, accessibility, or identity assertion may be treated as page coverage until the final URL and page-specific identity marker have been asserted.
- Keep image URL paths where safe. If the additive social-card fallback is used, the only planned consumers are the MCP page social metadata and invite-email image URL; preserve original asset bytes. Never satisfy image acceptance by changing a filename while stale pixels remain in a consumer.

## Blast Radius

- Package: `apps/web` only; no schema, auth-control, billing, live-provider, deployment, or Phase 02 identifier changes.
- Direct candidates: the enumerated product, console, pricing, onboarding/install, docs/history/legal surfaces; navigation; middleware/API compatibility; subscribe client/handler tests; Playwright config/specs; email template; and enumerated image consumers/assets.
- Risk class: public route/API compatibility and externally visible branding; source artwork may be dirty/untracked and requires ownership review.
- No source path outside this enumerated set may be added without returning to PLAN/PVL.

## Risk Assessment and Edge Scenarios

| Risk | Edge scenario | Required behavior / mitigation |
|---|---|---|
| Dirty parallel work | `page.client.tsx`, navigation, MCP pages, API aliases, or images already contain user changes. | Preserve the current diff; apply only a reviewed, minimal change. Stop if ownership is unclear. |
| Redirect drift | Legacy URL contains an arbitrary query string or targets console/onboarding. | Preserve exact status, pathname mapping, and query string; test all three existing cases. |
| API compatibility drift | Legacy and canonical route handlers diverge during branding edits. | Keep re-export/equivalence assertions; do not change handler logic or rate-limit bucket. |
| Copy classification | `21st.dev`, `Magic`, or vendor names appear in history, a legal notice, a third-party product, or an installation command. | Classify each occurrence; preserve accurate history/legal/vendor/integration identifiers. Do not use zero grep matches as a gate. |
| Stale pixels | HTML copy is correct but OG image or embedded preview still shows Magic/21st.dev. | Inspect actual image files and route screenshots after editing; keep dimensions/format and avoid filename-only completion. |
| Existing a11y baseline | Historical test context lists prior failures and stale route counts. | Re-run the applicable baseline at execution; require no newly introduced violations, not a misleading all-green claim. |
| Protected routes | `/higherbits-mcp` and `/magic-chat` redirect signed-out/non-admin users. | Keep signed-out redirect tests separate. For page content, screenshots, and Axe, require an authorized local admin session, final URL, and route-specific identity marker first; otherwise block page coverage. |
| Shared or unowned artwork | MCP OG asset is also used by invite email; `/magic-preview.webp` is shared; source image bytes may be untracked. | Enumerate consumers, preserve original bytes unless ownership/provenance is confirmed, and bound fallback use to the two named MCP social-image consumers. |
| Subscribe contract | Branding changes could accidentally change the legacy request value or mapping. | Add mocked client and handler proofs for the exact POST and `"magic-chat"` audience mapping; no live-provider request. |
| Inconclusive external probes | Current Clerk and localhost probes did not establish feasibility. | Keep both limitations visible; mock provider behavior for contract proof and do not claim live-provider or admin-route feasibility. |

## Implementation Checklist

### Step A — Read-only baseline and blockers

- [x] A1. Before any source change, capture a read-only baseline: branch, HEAD, upstream divergence, full `git status --short --branch`, unmerged paths, scoped tracked diffs, and untracked target contents. Treat every modified or untracked hunk as pre-existing until its owner and ownership are established; `git status` alone is insufficient. Build a path-and-hunk ownership map for every planned source target. Do not reset, clean, stage, commit, or overwrite user work; stop before changing any target whose baseline or ownership remains unclear, and record its exact path/hunk.
- [x] A2. Inventory every occurrence in the Touchpoints list into REBRAND, HISTORY/LEGAL/ATTRIBUTION, THIRD-PARTY/INTEGRATION, COMPATIBILITY, or UNRELATED. Record existing state and intended action per occurrence; never use a global replacement.
- [x] A3. Re-scan image references and record every source-to-consumer edge, including MCP social metadata plus invite email, shared /magic-preview.webp on AI and MCP hero, AI social/background assets, and the fresh status of magic-agent-og-image.png and og-image-21st.png. Capture hashes/status for untracked or modified originals; preserve their bytes unless ownership/provenance is confirmed.
- [x] A4. User-authorized existing session verified by actual protected bodies at /higherbits-mcp and /magic-chat on this checkout's port 3101. Codegen saved private 0600 state outside Git; no credential contents retrieved, no auth bypass or separate live-provider probe. Ordinary application authorization may contact configured providers. Automated state reuse/baseline remains A5, not inferred from this UI check.
- [x] A0. Prepared the named harness, public/admin isolation and final URL/page identity guards after ownership review, BEFORE A5 or product edits. Public discovery: 14 tests; independent static review PASS after baseline identity correction. Admin specs excluded atomically, studio exclusion retained, admin requires existing authorized state with trace off. Scaffolding is not protected runtime proof.
- [x] A5. Current-checkout port 3101 pre-edit admin baseline passed 14 cases in 2.7 minutes, including four route/theme Axe JSONs, two identity checks and eight screenshots. Unique run session-baseline-359bbec6-0872-4f05-9545-62fc908049ce / baseline / admin-62b6d439-9674-4dca-8e50-d13ab377311a preserves signatures/targets, results.json and command.log. This clears protected baseline prerequisite only. Under the explicit 2026-10-13 acceptance revision, retain all four genuine protected comparisons and final affected MCP deltas; require all ten current public zero-violation audits while disclosing the missing original public pre-edit capture. Evidence references: session-baseline-provenance_REPORT_12-10-26.md, session-public-final_REPORT_12-10-26.md, session-final-runtime_REPORT_12-10-26.md and session-final-copy-tests_REPORT_12-10-26.md. Independent EVL disposition remains required.

### Step B — Public identity and compatibility contracts

- [x] B1. Current naming updated to HigherBits.dev, HigherBits AI and HigherBits MCP across owned metadata/client/nav/header strings and two legacy /21 guidance strings; source inventory confirms already-correct console/pricing/onboarding copy. Shared header defaults MCP and AI supplies its label, without changing hrefs, auth, exports or request values. Focused final-header tests 30 PASS and independent scoped reviews PASS; final runtime rerun still required below.
- [x] B2. Review apps/web/public/llms.txt, llms-full.txt, apps/web/app/our-story/page.tsx, and terms/privacy/refunds. Keep truthful history, legal/vendor/source attribution, third-party Magic names, and accurate 21st.dev comparisons; verify each changed claim against its source or leave it unchanged.
- [x] B3. Preserved package strings and unresolved `npx higherbits-ai`; no npm/functionality claim. Added six mocked client tests and seventeen handler tests for all three types, mapping, responses/errors and missing config, with synthetic env before dynamic import and reset mocks/modules. Focused gate including existing API compatibility: 30 PASS; independent review PASS. No live values or sends.
- [x] B4. Preserve `/api/magic/check` and `/api/magic/use` alias behavior and canonical equivalence with `/api/higherbits-mcp/check` and `/api/higherbits-mcp/use`. Extend focused compatibility assertions only if needed; do not change methods, payloads, response/status semantics, or rate-limit behavior. The API-key RPC live probe is explicitly excluded; do not claim it was tested.
- [x] B5. All three existing 308 mappings remain unchanged. Expanded redirect spec covers encoded/repeated/multiple/empty parameters under the explicit ordered semantic-query clarification. Four final public redirect cases PASS, including every mapping; independent review PASS. Historical timeout and byte-equality failures remain recorded separately in session reports.

### Step C — Assets, authorized browser coverage, and evidence

Execution discovery (2026-10-12): overlapping native MCP tiles expose the legacy tool label 21st_magic_component_builder inside How It Works artwork, not the already-replaced shared preview. The scoped surface list includes how-it-works.tsx. Smallest honest current-brand resolution: retain all three original raster files/URLs unchanged but replace the three decorative screenshot strips in this component with static numbered steps using existing card geometry/tokens. Preserve headings/descriptions, no invented replacement tool identifier or functionality. Capture/review the resulting workflow section in both themes/viewports and rerun affected MCP Axe after this final source change; earlier runtime evidence remains tied to its original snapshot.

Consumer follow-through: the same legacy strips also occur twice each in get-started/onboarding-layout.tsx and onboarding/steps/create-component-step.tsx. Remove their decorative wrappers/imports while preserving existing numbered badges, handlers, API/check-status behavior and storage values. Replace unsupported /ui and instant-builder instructions with IDE-independent HigherBits MCP search/retrieve-source wording; do not invent a slash command. These onboarding states require separate proof and are not implicitly covered by the MCP landing-page runtime.

- [x] C1. User confirmed named ownership. Created/native-reviewed original local-vector-rendered 1200×630 `apps/web/public/higherbits-mcp-social-card.png`, then repointed exactly MCP OG/Twitter and absolute HTTPS email URL. Independent review PASS; original OG SHA-256 unchanged. No original deletion, external provider generation or unrelated email overwrite.
- [x] C2. Review `/magic-preview.webp` in both `apps/web/app/magic-chat/page.client.tsx` and `apps/web/components/features/higherbits-mcp/hero.tsx`, including below-fold placement; inspect the AI OG image and referenced `magic-chat-waitilist.webp` background. Native review found consumed legacy pixels. Bounded additive execution resolution: create original local-vector `apps/web/public/higherbits-component-preview.svg` illustrating neutral component examples, not a claimed functional screenshot, and repoint exactly the two preview consumers with route-specific illustrative alt labels. Reuse the existing native-reviewed HigherBits `/og-image.png` for AI social metadata instead of duplicating art. Preserve every original raster and typo filename; no provider generation, dependency, route or API change. Record unused candidates and absent correctly spelled filename; verify final pixels and consumers.
- [x] C3. Existing authorized admin state saved privately outside Git with permissions 0600. Final combined run passed both signed-out public redirects and both admin final-URL/identity/metadata checks before screenshot/Axe work. No credentials fabricated, auth mocked/bypassed, or state committed. Earlier failed outcomes retained; session-final-runtime_REPORT_12-10-26.md records actual evidence.
- [x] C4. Retain A0 isolation/identity guards, studio exclusion and trace-off admin configuration using existing authorized state. Public Axe excludes protected routes and asserts final URL/page identity. Under the explicit 2026-10-13 acceptance revision, verify all five public routes × two themes (ten current zero-violation records), retain all four genuine protected baseline/post signature-and-target comparisons and final affected MCP matched deltas, and disclose that the public capture is late post-only. Missing public cases or protected comparisons still block proof; no route/auth coverage is reduced. See session-baseline-acceptance-revision_REPORT_13-10-26.md for exact raw evidence paths. Leave this checkbox for independent EVL disposition.
- [x] C5. Capture eight full-page screenshots in `apps/web/e2e/higherbits-mcp-visual-evidence.spec.ts` for `/magic-chat` and `/higherbits-mcp`: each route × light/dark × desktop/375px mobile. Run only with the authorized admin project/state. Assert final URL and route-specific identity before capture. Use a unique run-scoped folder under `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/evidence/phase-01/<run-id>/`; use deterministic route-theme-viewport filenames, review below-fold preview and all shared consumers, and never overwrite another run’s artifacts.
- [x] C6. Review screenshots and source assets at native resolution. Record each path, route/consumer, auth state, theme, viewport, and pass/fail verdict; confirm both social-card consumers and both shared-preview consumers.

### Step D — Direct verification and handoff

- [x] D1. Focused four-file Vitest gate passed 30 tests, including after the final header correction. Full package `corepack pnpm --filter web test` passed 117 files / 928 tests; this full run preceded the final header/guidance-only changes. Exact full-run log/snapshot in phase-01-unit-suite_REPORT_12-10-26.md; no coverage percentage or full-suite-after-every-string claim. Vitest excludes E2E; raw outcomes preserved.
- [x] D2. Verify configured local readiness (default http://localhost:3100) before browser runs; permitted local-only availability check: `curl --connect-timeout 2 --max-time 5 -I http://localhost:3100/`. Run `corepack pnpm --filter web exec playwright test e2e/higherbits-mcp-legacy-redirect.spec.ts --project=public --global-timeout 300000`, `corepack pnpm --filter web exec playwright test e2e/higherbits-mcp-signed-out.spec.ts --project=public --global-timeout 300000`, and `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts --project=public --global-timeout 300000`. Only with authorized admin state and isolated trace-off admin config, run `corepack pnpm --filter web exec playwright test e2e/higherbits-mcp-route-identity.spec.ts e2e/higherbits-mcp-visual-evidence.spec.ts e2e/higherbits-mcp-a11y.spec.ts --project=admin --global-timeout 300000`. Parent verified installed --global-timeout support; each browser invocation has 300000 ms total deadline. Global setup still warms 19 routes with retries (two 45-second attempts each), potentially exhausting budget before assertions. Terminate stalled runs; record INCONCLUSIVE/raw exits and preserve sanitized raw outcomes/reporter/Axe evidence before the next invocation.
- [x] D3. Apply the user-authorized 2026-10-13 A11Y-DELTA-10 evidence standard: all ten current public route/theme audits have zero violations; all four genuine protected pre/post comparisons and final affected MCP light/dark matched-baseline comparisons have no new Axe signatures AND no newly affected target nodes. Disclose missing original public pre-edit capture and do not claim a public historical delta. Preserve every raw failure, timeout, unrun case and its original contract separately; later proof does not rewrite historical FAILs. Missing any required current case/comparison remains BLOCKED. Independent validator EVL must confirm source/evidence applicability and criterion disposition; this revision alone does not check off D3.
- [x] D4. Perform the scoped copy, truth, command, API, and image-consumer review against AC1–AC6. Preserve documented exceptions; a zero-match grep is not a pass criterion.
- [x] D5. Write `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-01-public-surfaces_REPORT_12-10-26.md` with ownership/pre-edit/hash baseline, pinned references, inventory, exact commands/raw outcomes, separate Axe deltas, screenshots, consumer review and blockers. Its exact `## EVL Handoff` subsection records contract revision, run IDs/artifact paths, criterion ledger, ownership evidence and remaining blockers for independent EVL; UPDATE PROCESS links it. No unresolved required blocker permits VERIFIED.

**Final checklist adjudication — 2026-10-13:** All A1–D5 PASS in session-phase01-final-evl_REPORT_13-10-26.md; checkmarks credit that later actual evidence, not the earlier prerequisite wording above. D1's latest applicable full-suite proof is post-copy 117 files/928 tests; focused 30 overlaps. D2 ran the correct checkout on 3101, not preserved unrelated 3100. C5 is reviewed eight-combination content coverage via guarded viewport/overlapping supplements, not eight seamless full-height files. C2 has current hashes/consumer proof and explicitly unrecovered original-manifest limits. C4/D3 use the dated public-baseline acceptance revision. Prior raw failures and all limits remain unchanged.

## Acceptance Criteria

- AC1 (SPEC AC1, AC3): `proven by: PAGE-IDENTITY-01` and `SIGNED-OUT-REDIRECT-02`; `strategy: Fully-Automated`. Supporting `proven by: A11Y-DELTA-10`; `strategy: Hybrid`, using the 2026-10-13 ten-current-public/four-genuine-protected/final-MCP standard. Authorized state/runtime remain prerequisites; final URL/identity precede capture/Axe.
- AC2 (SPEC AC2, AC6): `proven by: COPY-INVENTORY-03`; `strategy: Hybrid`. Exact current subscribe request types, mapping, and behavior: `SUBSCRIBE-CONTRACT-04`; `strategy: Fully-Automated`.
- AC3 (SPEC AC3): `proven by: LEGACY-REDIRECTS-05` and `PAGE-IDENTITY-01`; `strategy: Fully-Automated`. Supporting `proven by: A11Y-DELTA-10`; `strategy: Hybrid` requires every case/comparison in the 2026-10-13 acceptance revision; legacy compatibility proof is unchanged.
- AC4 (SPEC AC4, AC6): `proven by: API-ALIASES-06`; `strategy: Fully-Automated`.
- AC5 (SPEC AC5): `proven by: IMAGE-CONSUMERS-07`; `strategy: Hybrid`. `IMAGE-REVIEW-08`; `strategy: Agent-Probe`. Supporting `proven by: A11Y-DELTA-10`; `strategy: Hybrid` uses the 2026-10-13 acceptance revision. Every existing image/consumer/native-review requirement and provenance limit remains intact.
- AC6 (SPEC AC2, AC6): `proven by: TRUTH-KEEP-09`; `strategy: Hybrid`.

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `PAGE-IDENTITY-01` — automated final URL, identity, metadata and shared navigation assertions; authorized state/runtime prerequisites | Fully-Automated | SPEC AC1, AC3 |
| `SIGNED-OUT-REDIRECT-02` — separately assert signed-out redirects for protected routes without treating redirects as page coverage | Fully-Automated | SPEC AC1, AC3 |
| `COPY-INVENTORY-03` — review console, pricing, onboarding/install, public docs, current copy, and KEEP categories | Hybrid | SPEC AC2, AC6 |
| `SUBSCRIBE-CONTRACT-04` — mock client POST plus handler for all accepted types (`newsletter`, `magic-waitlist`, `magic-chat`); assert exact endpoint, method, mappings, response/error behavior | Fully-Automated | SPEC AC2, AC6 |
| `LEGACY-REDIRECTS-05` — direct Playwright proof of three 308 mappings with encoded values, repeated keys, multiple parameters, and exact query preservation | Fully-Automated | SPEC AC3 |
| `API-ALIASES-06` — focused mocked tests prove `/api/magic/check` and `/api/magic/use` remain equivalent to canonical `/api/higherbits-mcp/check` and `/api/higherbits-mcp/use` handlers | Fully-Automated | SPEC AC4, AC6 |
| `IMAGE-CONSUMERS-07` — verify metadata/email consumers, current absolute HTTPS email URL or created fallback, typo-named waitilist assets, and shared AI/MCP preview consumers; capture eight pages only with authorized admin state | Hybrid | SPEC AC5 |
| `IMAGE-REVIEW-08` — inspect each reviewed source image and screenshot at native resolution, including below-fold content | Agent-Probe | SPEC AC5 |
| `A11Y-DELTA-10` — 2026-10-13 authorized standard: ten current public zero-violation audits, four genuine protected before/after comparisons, and final affected MCP matched deltas; final URL/identity guards, signature/node checks and missing public-history disclosure retained | Hybrid | SPEC AC1, AC3, AC5; supporting plan AC1, AC3, AC5 |
| `TRUTH-KEEP-09` — verify history, legal/vendor attribution, integration identifiers, unresolved `npx higherbits-ai` fallback, and accurate 21st.dev comparisons | Hybrid | SPEC AC2, AC6 |

**Prior run evidence (earlier agent-run tool evidence carried from the parent transcript; not rerun during this PLAN revision):** focused Vitest passed 2 files / 7 tests in `apps/web/app/api/higherbits-mcp/__tests__/route.test.ts` and `apps/web/app/api/magic/__tests__/legacy-routes.test.ts`. The redirect Playwright attempt and local curl returned no response and were manually interrupted; classify both as INCONCLUSIVE, not pass or fail. These results do not prove protected-page access and do not replace fresh VALIDATE.

## Phase Completion Rules

Phase 01 can be marked VERIFIED only when every AC1–AC6 gate has evidence, all three 308 redirects preserve exact destination and the full query, API aliases and exact subscribe value/mapping remain unchanged, the command and truthful disclosures remain accurate, every listed asset consumer and all eight full-page screenshots are reviewed, and A11Y-DELTA-10 satisfies the explicit 2026-10-13 acceptance revision. The authorized admin state must prove protected-page final URL and identity before content, screenshot, or Axe assertions. If that session is unavailable, protected page gates remain BLOCKED and Phase 01 cannot be called VERIFIED. A missing or inconclusive gate cannot be replaced by a Known-Gap or a zero-match/build-only result. The revision resolves only the historical public-baseline requirement; independent EVL must still adjudicate all actual evidence and limitations before any VERIFIED transition.

## Exit Gate

Phase 01 is VERIFIED only when A1–D5 are complete, every AC1–AC6 proof is recorded, no ownership/auth/evidence blocker remains, compatibility and subscribe contracts pass, image consumers and screenshots pass review, the revised A11Y-DELTA-10 public/protected evidence is documented, and the phase report is complete. The absence of an authorized admin session, unresolved user-hunk ownership, or unverified required factual/image claims prevents VERIFIED status. Build success or zero raw legacy-string matches alone is not sufficient. Exit adjudicated PASS by independent final EVL 2026-10-13; current status is VERIFIED locally. Historical prerequisite/contract wording remains preserved; see Current Closeout.

## Rollback

Rollback only reviewed inverse owned hunks against captured pre-edit contents and binary hashes, never whole dirty files or HEAD. Coordinate both image consumers and retained config/spec isolation; preserve originals/fallback. No clean/reset/stage/commit/delete of untracked originals. Rerun affected checks only where prerequisites hold; blocked protected reruns remain BLOCKED and raw outcomes remain recorded.

## Phase Loop Progress

- [x] 1. RESEARCH — completed in the prior cycle; V5 returned Phase 01 for plan changes.
- [x] 2. INNOVATE — approved choices remain public-first naming, compatibility preservation, and Phase 02-only safe identifier renames.
- [x] 3. PLAN-SUPPLEMENT — this approved V4 update set reconciles the findings and records the refresh note below.
- [x] 4. PVL — CONDITIONAL contract dated 2026-10-12; parent V5 explicitly accepted concerns. Raw 22 CONCERN/0 FAIL/0 PASS retained; no implementation or protected proof claimed.
- [x] 5. EXECUTE — owned Phase01 public surfaces and compatibility implemented; independent final EVL reconciles A1–D5.
- [x] 6. EVL — vc-validate-agent final PASS dated 2026-10-13; session-phase01-final-evl_REPORT_13-10-26.md; AC1–AC6 and A1–D5 proven.
- [x] 7. UPDATE PROCESS — report/umbrella/goal/current packet reconciled; retained active, no archive/context edit/commit by explicit user boundary; commit not required for local verification.

**Standing Autopilot consent persists. Phase01 local verification and interphase reconciliation complete; fresh Phase02 RESEARCH next. No commit/archive authorized.**

## Blockers That Justify BLOCKED

- **Ownership:** any selected target has overlapping user changes without explicit path/hunk ownership. Clear only with the A1 read-only baseline and a reviewed ownership map; otherwise stop before that target.
- **Protected-route access:** no authorized local admin session. Clear only when an existing authorized state is independently confirmed as admin and reaches each expected final route/page marker; never use auth bypass or live-provider assumptions. Until cleared, signed-out redirects may be tested but protected content/screenshots/Axe remain blocked and the phase cannot be VERIFIED.
- **Provider feasibility:** the Clerk double-opt-in probe remains INCONCLUSIVE. This does not block mocked contract tests; it blocks any claim of live-provider verification unless a separately authorized, documented proof becomes available.
- **Image provenance:** unclear source/rights or unowned original. Clear with verified provenance/ownership, or preserve original bytes and use only the enumerated higherbits-mcp-social-card.png fallback plus its two consumers; if required artwork still cannot be reviewed, keep the image gate blocked.
- **Truthful claims:** history/legal/vendor/comparison claim lacks authoritative support. Keep it unchanged or obtain source/owner confirmation; do not rewrite it speculatively.
- **Baseline/regression:** apply the dated 2026-10-13 revision only to original public pre-edit history. Missing any of ten current public audits, four genuine protected comparisons or final affected MCP deltas still blocks the gate. Record signatures/nodes and preserve historical failures; do not infer a historical public comparison from current zero violations.

## Test Infra Improvement Notes

Keep infrastructure changes bounded to apps/web/playwright.config.ts, focused Playwright specs, and focused Vitest specs. corepack pnpm --filter web test runs Vitest and excludes E2E; direct E2E gate commands are corepack pnpm --filter web exec playwright test .... Capture screenshots in unique evidence/phase-01/<run-id>/ folders, not the other program’s visual-evidence.spec.ts output. Missing admin fixture is a blocker, not a reason to weaken auth or downgrade developed behavior to a terminal Known-Gap.

## Resume and Execution Handoff

- **Current authoritative handoff — 2026-10-13:** 2026-10-13 owner reconciliation: Phase 01 is ✅ VERIFIED locally. Independent vc-validate-agent final EVL dated 2026-10-13 (session-phase01-final-evl_REPORT_13-10-26.md) passes AC1–AC6 and A1–D5 after the explicit user baseline acceptance. Actual raw proof was reviewed by that validator; current applicability is supported by 796 source/config/test/docs and 16 asset matches at the recorded endpoints. Current canonical packet decision APPROVE is agent evidence disposition for Phase01 local verification only; historical REJECT/rationale/timestamp are preserved in historicalDecisions. No production/human approval inferred. Original public pre-edit history remains missing; C2 eleven-original aggregate remains writer-only without the original manifest; viewport/tiled capture, supplementary-unit artifact and all other disclosed limits/failures remain intact. No required Phase01 gate is deferred. Commit not required for local verification and prohibited; no archive/move/cleanup. Program/task stay active for outstanding Phase02. Exact next action: fresh RESEARCH on phase-02-first-party-identifiers_PLAN_12-10-26.md, then its own seven-step loop and fresh PVL before execution. See session-phase01-update-process_REPORT_13-10-26.md.
- **Historical checkpoint bullets below:** retained for chronology, not current pending work.

- **Authoritative 2026-10-13 handoff:** the user chose "Use current zero-violation audits plus genuine protected-page deltas." The historical public-baseline decision is resolved by the bounded Public Contracts revision and session-baseline-acceptance-revision_REPORT_13-10-26.md. Latest final-copy source review, post-copy 117-file/928-test suite, matched MCP deltas and all four FAQ heading views are recorded in the final-copy reports. Existing evidence-ledger cutoff's pending heading/source statements are superseded by those later reports. Original public history remains missing; no synthetic baseline or risk approval is supplied. Next is independent validator EVL of the revised contract, current source-integrity applicability and complete criterion/consumer ledger; retain ACTIVE / TESTING and hold Phase 02. Earlier handoff bullets below are historical checkpoints where superseded by this paragraph.
- **Selected plan path:** process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-01-public-surfaces_PLAN_12-10-26.md is the sole Phase 01 execution anchor; pass this exact path to later phases.
- **State:** ACTIVE / TESTING under CONDITIONAL contract and explicit query-encoding/public-matrix clarifications. Naming/assets/header/guidance edits implemented with independent PASS reviews. Full unit suite 117 files / 928 PASS; focused final-header gate 30 PASS. Protected pre-edit baseline 14 PASS; final source combined runtime 20 PASS, including four zero-delta admin Axe records, eight correct-header screenshots and six public compatibility/signed-out cases. Viewport-only screenshots lack below-fold proof; complete public pre-edit baseline remains missing. Historical raw failures remain unwaived; port 3100 is a different preserved checkout, current source runs on 3101.
- **Next handoff:** read phase-01-public-surfaces_REPORT_12-10-26.md and session-final-runtime_REPORT_12-10-26.md. Finish public ten-case accessibility and exit review, preserving raw outcomes and missing baseline/pixel proof without weakening auth. Admin recovery is complete; no renewed consent question. Phase 02 still requires Phase 01 VERIFIED.
- **Evidence handoff:** preserve the inconclusive Clerk/browser feasibility notes; carry forward the read-only A1 baseline, explicit hunk ownership map, admin-session availability result, fresh Axe baseline, and asset consumer map. Re-capture A1 immediately before edits.
- **Supporting context:** locked SPEC (unchanged), umbrella plan (unchanged), Phase 02 plan (future-only), process/context/all-context.md, process/context/tests/all-tests.md, relevant Playwright config/specs, completed visual/brand-sweep references, and both feasibility artifacts.
- **Program boundaries:** Phase 01 public surfaces only; Phase 02 owns safe first-party identifier changes after Phase 01 VERIFIED. Preserve HigherBits AI vs HigherBits MCP naming, aliases, auth/security, and the no-commit program rule.

## Deviations and Lessons Learned — Final Reconciliation

The final EVL passes the explicit public-baseline revision, equivalent ordered query semantics, guarded tiled content coverage and bounded C2 provenance claim. Missing history is disclosed rather than reconstructed; later PASS never rewrites earlier FAIL. Carry exact command time/source applicability and named reviewers instead of equating aggregate test counts, current hashes or artifact existence with approval. No source/context/harness-rule change is made by this reconciliation.

## Inner Loop Refresh Note

- **Trigger:** the prior VALIDATE requested plan changes; the historical handoff records its V5 decision.
- **Revision:** applied the approved V4 corrections for source-confirmed admin gates, sidebar/nav and Magic Chat identity, exact asset state and missing fallback, all mocked subscribe request types, alias/canonical API mapping, Playwright project/spec commands, expanded redirect query cases, SPEC AC cross-mapping, unprobed npm/API-key RPC limits, pre-existing dirty-hunk ownership, and earlier agent-run tool evidence carried from the parent transcript.
- **State:** Accepted textual mitigations and CONDITIONAL contract dated 2026-10-12 consume this refresh. This note is not execution evidence; ownership, protected proof and fresh baselines remain prerequisites.

## Accepted Validation Conditions

- C01: A1 ownership review precedes A0 harness/isolation/identity preparation; A0 precedes A5 and product edits. Admin-only specs are excluded from public atomically upon creation even without admin state/config.
- C02: Named browser commands use --global-timeout 300000 after bounded local readiness. Global setup warms 19 routes with retries; stalled/interrupted runs remain INCONCLUSIVE.
- C03: Preserve sanitized raw command/reporter/Axe outcomes under `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/evidence/phase-01/<run-id>/<stage>/<command-id>/` before overwrite. Under the 2026-10-13 revision, require ten current public zero-violation cases plus four genuine protected comparisons and final affected MCP deltas with no new signatures AND no newly affected nodes. Missing public pre-edit history is explicitly disclosed; historical violations/raw failed assertions stay recorded separately. Missing required current route/theme/admin evidence blocks proof.
- C04: Admin trace: "off"; no storage state, cookies, tokens, credentials or authenticated traces in artifacts. No fabricated state/auth bypass/provider calls.
- C05: Synthetic subscribe env before import; module/config/mock reset between scenarios. AUDIENCES is a module-load snapshot; no live values/sends.
- C06: SPEC AC1/AC3 automated assertions remain Fully-Automated once authorized state/runtime exist; pixel/accuracy review remains Hybrid. A11Y-DELTA reverse AC links are required.
- C07: Current/HEAD generators already use @higherbits-dev/cli@latest; historical @21st-dev KEEP examples do not authorize restoring obsolete strings. Preserve unresolved npx higherbits-ai without registry/functionality claims. Reviewed fallback email URL is https://higherbits.dev/higherbits-mcp-social-card.png.
- C08: Plans/reports stay flat; screenshots/evidence keep unique task-local evidence/phase-01/<run-id>/ paths. Rollback uses captured pre-edit contents/binary hashes and inverse owned hunks with coordinated consumers/config/spec isolation.
- C09: Exact reports/KEEP are pinned in Entry Gate. MCP metadata/OG original are untracked; email image hunks overlap. EVL handoff is `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-01-public-surfaces_REPORT_12-10-26.md`, subsection `## EVL Handoff`.
- Parent scout reports isolated AI metadata/copy/nav lines and absent new test paths; obtain/reconcile its detailed map before edits. All untracked MCP source and email image overlap remain ownership-BLOCKED. No source ownership or protected proof is inferred.
- Completion additionally requires no new Axe signatures AND no newly affected nodes across full evidence. Raw failed assertions remain FAIL regardless of accepted no-regression deltas; no missing proof permits VERIFIED.

## Validate Contract

Status: CONDITIONAL
Date: 12-10-26
date: 2026-10-12
generated-by: inner-pvl: phase-01
Parallel strategy: parallel-subagents
Rationale: user-selected independent fan-out; four dimensions and eighteen section reviews completed in batches of five. No optional review was needed.

**Acceptance amendment: 2026-10-13 Asia/Tokyo.** Authorized user quote: "Use current zero-violation audits plus genuine protected-page deltas." Only A11Y-DELTA-10's historical public pre-edit baseline requirement is superseded by all ten current public zero-violation audits, retaining all four genuine protected comparisons and final affected MCP matched deltas. See the dated Public Contracts revision and session-baseline-acceptance-revision_REPORT_13-10-26.md. Source, locked SPEC, existing tests, risk approval and Phase 02 are unchanged. This is not a fresh validator verdict: CONDITIONAL / ACTIVE / TESTING remains pending independent EVL. All raw V1–V5 findings and failure/provenance limits below are retained as historical validation snapshots; their pending-choice/baseline prerequisites are current only where not explicitly superseded by this amendment and later linked reports.

V1: PASS after the onboarding-path, consent, evidence-provenance and project-isolation supplement. Structural checks found zero failures; three advisory Phase 01 warnings remain. V2–V4 raw totals: 0 FAIL / 22 CONCERN / 0 PASS. These are feasibility verdicts, not implementation-test results. C01–C09 above incorporate the accepted textual mitigations.

Test gates:

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| SPEC AC1, AC3 | Protected route/product identity and metadata | Fully-Automated | corepack pnpm --filter web exec playwright test e2e/higherbits-mcp-route-identity.spec.ts --project=admin --global-timeout 300000; authorized state required | B — planned spec; protected proof BLOCKED |
| SPEC AC1, AC3 | Signed-out access redirects | Fully-Automated | corepack pnpm --filter web exec playwright test e2e/higherbits-mcp-signed-out.spec.ts --project=public --global-timeout 300000 | B — planned spec and local readiness |
| SPEC AC2, AC6 | Exact client request and all three subscribe mappings/errors | Fully-Automated | corepack pnpm --filter web exec vitest run app/magic-chat/__tests__/page.client.test.tsx app/api/subscribe/__tests__/route.test.ts | B — collision-free planned tests; synthetic env and provider mocks |
| SPEC AC3 | Three 308 mappings preserve encoded/repeated/multiple query parameters | Fully-Automated | corepack pnpm --filter web exec playwright test e2e/higherbits-mcp-legacy-redirect.spec.ts --project=public --global-timeout 300000 | B — expansion requires ownership clearance; prior run INCONCLUSIVE |
| SPEC AC4, AC6 | Legacy/canonical API equivalence and mocked handler behavior | Fully-Automated | corepack pnpm --filter web exec vitest run app/api/magic/__tests__/legacy-routes.test.ts app/api/higherbits-mcp/__tests__/route.test.ts | A — earlier agent-run 2 files/7 tests; rerun at execution, no new edits without ownership |
| SPEC AC2, AC6 | Current copy, history, legal/vendor and integration accuracy | Hybrid | COPY-INVENTORY-03 and TRUTH-KEEP-09 occurrence ledger plus source review | B — ownership-gated; no speculative factual changes |
| SPEC AC5 | Image consumers and eight route/theme/viewport captures | Hybrid | corepack pnpm --filter web exec playwright test e2e/higherbits-mcp-visual-evidence.spec.ts --project=admin --global-timeout 300000; IMAGE-CONSUMERS-07 review | B — planned spec; admin/consumer ownership BLOCKED |
| SPEC AC5 | Native-resolution source-artwork and screenshot review | Agent-Probe | IMAGE-REVIEW-08 path/consumer/pixel ledger | B — original bytes preserved; no pixel review claimed |
| SPEC AC1, AC3, AC5 | A11Y-DELTA-10: ten current public audits, four genuine protected before/after pairs and final affected MCP matched deltas; original public history missing and disclosed | Hybrid | Existing e2e/a11y.spec.ts and e2e/higherbits-mcp-a11y.spec.ts evidence; D3 read-only comparison and exact roots in session-baseline-acceptance-revision_REPORT_13-10-26.md. Existing bounded commands above remain unchanged for validator-selected reruns only. | B — retained zero-violation raw evidence; public-history requirement explicitly revised 2026-10-13; independent EVL pending |

Resolution A means carried proof, B means implemented/proven during this plan, C means named later work, D means a named residual requiring test-building work. No required behavior is terminally accepted on a Known-Gap. Full package regression command: corepack pnpm --filter web test. Execute D1's focused four-file command before that broader gate.

Failing stubs for the future Fully-Automated scenarios (planning artifacts only; replace with real assertions during execution):
- PAGE-IDENTITY-01: test("should assert protected final URL and HigherBits product identity", () => { throw new Error("NOT IMPLEMENTED — TDD stub: protected identity") })
- SIGNED-OUT-REDIRECT-02: test("should preserve signed-out access redirects", () => { throw new Error("NOT IMPLEMENTED — TDD stub: signed-out redirects") })
- SUBSCRIBE-CONTRACT-04: test("should preserve exact client request and all subscribe mappings", () => { throw new Error("NOT IMPLEMENTED — TDD stub: subscribe contract") })
- LEGACY-REDIRECTS-05: test("should preserve encoded repeated and multiple query parameters", () => { throw new Error("NOT IMPLEMENTED — TDD stub: complete query preservation") })
- API-ALIASES-06: test("should preserve legacy and canonical API handler equivalence", () => { throw new Error("NOT IMPLEMENTED — TDD stub: API equivalence") }); existing assertions provide the implemented starting proof, so do not add a deliberately failing replacement to source.

Legacy line form:
- Unit contracts: Fully-automated: D1 focused Vitest command and corepack pnpm --filter web test.
- Routes: Fully-automated: D2 named public/admin Playwright commands with --global-timeout 300000 and their prerequisites.
- Accessibility/images/copy: hybrid: D3/C5/C6/D4 evidence and named commands; agent-probe: IMAGE-REVIEW-08 native-resolution review.

Dimension findings:
- Infra fit: CONCERN — bounded browser deadline/readiness required; C02 applied.
- Test coverage: CONCERN — planned tests, baseline retention and AC backlinks required; C01/C03/C05/C06 applied; protected evidence remains blocked.
- Breaking changes: CONCERN — preserve absolute email URL and current package identifiers; C07 applied.
- Security surface: CONCERN — admin artifacts must exclude authenticated traces/state; C04 applied.
- Overview feasibility: CONCERN — ownership and admin prerequisites remain.
- Purpose feasibility: CONCERN — occurrence-level renames preserve request identifiers.
- Entry Gate feasibility: CONCERN — exact prior references and ownership evidence required; C09 applied.
- Touchpoints feasibility: CONCERN — public exclusions accompany admin-spec creation; C01 applied.
- Public Contracts feasibility: CONCERN — synthetic env precedes fresh handler import; C05 applied.
- Blast Radius feasibility: CONCERN — task-local evidence paths reconciled; C08 applied.
- Risk Assessment and Edge Scenarios feasibility: CONCERN — guards precede baseline; C01 applied.
- Implementation Checklist feasibility: CONCERN — deadline, baseline sequencing and raw Axe outcomes clarified; C01–C03 applied.
- Acceptance Criteria feasibility: CONCERN — automated SPEC identity proof and reverse links restored; C06 applied.
- Verification Evidence feasibility: CONCERN — persist results before reporter overwrite; C03/C08 applied.
- Phase Completion Rules feasibility: CONCERN — zero new signatures or affected nodes; missing proof still blocks VERIFIED.
- Exit Gate feasibility: CONCERN — raw failed assertions stay FAIL; D3 applied.
- Rollback feasibility: CONCERN — inverse owned hunks against pre-edit baseline; C08 applied.
- Phase Loop Progress feasibility: CONCERN — exact EVL handoff subsection pinned; C09 applied.
- Blockers That Justify BLOCKED feasibility: CONCERN — isolation, ownership and admin gates retained.
- Test Infra Improvement Notes feasibility: CONCERN — bounded runs and atomic exclusions required; C01/C02 applied.
- Resume and Execution Handoff feasibility: CONCERN — time budgets, evidence paths and recaptured ownership required.
- Inner Loop Refresh Note feasibility: CONCERN — revision is not implementation evidence; prerequisites retained.

Open gaps at validation: authorized admin state and protected baseline/content/screenshots/Axe; overlapping dirty/untracked source ownership; planned tests/artwork and their execution proof. Subsequent execution report records named ownership confirmation, 30 passing focused tests, 14 public discovery cases and static review PASS. Local homepage now returns HTTP 200 but Chrome remains signed out; redirect runtime setup timed out and remains INCONCLUSIVE. Protected proof/artwork remain incomplete. npm resolution remains deliberately unprobed; the API-key RPC live probe is excluded. No missing proof is converted to PASS or a terminal Known-Gap.

What This Coverage Does NOT Prove:
- PAGE-IDENTITY-01: no protected page was reached in this cycle; no visual or accessibility proof.
- SIGNED-OUT-REDIRECT-02: no authorized content, session validity or admin role proof.
- SUBSCRIBE-CONTRACT-04: no live Resend delivery/audience/provider verification; new tests remain to be built.
- LEGACY-REDIRECTS-05: no protected destination body or fresh runtime success; expanded cases remain to be run.
- API-ALIASES-06: no deployed RPC/RLS/grant behavior, live service or full error-path coverage.
- COPY-INVENTORY-03/TRUTH-KEEP-09: no registry resolution or functionality of preserved package/command strings.
- IMAGE-CONSUMERS-07/IMAGE-REVIEW-08: no reviewed replacement pixels or current route screenshots yet.
- A11Y-DELTA-10: no complete fresh baseline/delta, no pixel/layout parity, and no protected audit until admin prerequisites hold.
- Package regression: not rerun during this static review; no build/type-check/runtime claim.

Gate: CONDITIONAL
Accepted by: session (autonomous, standing Autopilot policy). Accepted concerns: C01–C09 textual mitigations, pending planned tests/artwork, retained admin/ownership hard stops, and declined npm/excluded RPC checks. User explicitly chose “Keep those gates blocked; continue independent checks” and “Apply the proposed plan updates, then re-validate.” This acceptance permits independent prerequisite work only where its conditions are met; it does not clear blocked edits, prove protected access or authorize Phase 02.
Execution boundary: recapture A1 and use the audit's hunk-isolation map. New collision-free mocked tests may proceed independently; affected product edits stop at unresolved ownership or missing A5 baseline. Standing consent persists; Phase 01 is not VERIFIED.
Audit: process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-01-public-surfaces-validate_REPORT_12-10-26.md.

Historical next action at 2026-10-12 validation: EXECUTE only cleared Phase 01 prerequisites under standing consent; stop affected edits at unresolved ownership or missing baseline/admin proof.

Current next action (2026-10-13): independent validator EVL against this exact selected plan and the acceptance-revision report; reconcile all AC1–AC6 evidence and retained limits. session-resume-integrity_REPORT_13-10-26.md confirms 796 files with zero drift/missing against the original 794-path manifest plus reviewed FAQ/console hash overrides and two reviewed docs; no unresolved merge paths. Carry named post-copy 928-test and actual runtime snapshots with their documented time/scope, without duplicate browser/test reruns. No new source work, risk-approval mutation, archive, new goal or Phase 02 entry is authorized by this amendment.

## Next Step — Current Interphase Instruction

Fresh RESEARCH on `phase-02-first-party-identifiers_PLAN_12-10-26.md` is next. The Phase01 primary execute anchor is this selected plan; it is now VERIFIED locally, not a request for further execution. Supporting files: umbrella, main Phase01 report, independent final EVL and session-phase01-update-process_REPORT_13-10-26.md. **Validate-contract required** for Phase02: fresh research/plan/PVL must replace its placeholder before execution. Commit not required for local verification; no commit/archive/move authorized.
