---
name: plan:higherbits-current-rebrand-umbrella
description: "HigherBits.dev current rebrand — public surfaces first, safe first-party identifiers second."
date: 12-10-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-redesign
  phase: umbrella
---

# HigherBits.dev Current Rebrand — Umbrella Plan

TL;DR: Deliver the confirmed HigherBits.dev, HigherBits MCP, and HigherBits AI names in two gated phases, retaining routes, API behavior, stored data, third-party identifiers, and truthful disclosures.

- **Date**: 12-10-26
- **Complexity**: COMPLEX — user-approved two-phase program
- **Status**: ✅ VERIFIED locally — both phases complete after final Phase02 EVL/UPDATE PROCESS 2026-10-13; task retained active, no archive/commit/deploy.
- **Feature:** `higherbits-redesign`
- **Locked SPEC:** `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/higherbits-current-rebrand_SPEC_11-10-26.md`

## Overview

This approved program delivers the user-selected HigherBits.dev brand and the product names HigherBits MCP and HigherBits AI in two sequential phases. Phase 01 updates verified public surfaces and image pixels while proving route/API compatibility; Phase 02 migrates only the explicitly approved first-party storage and waitlist configuration identifiers. The locked SPEC governs scope, and neither phase may change API behavior or erase legacy compatibility.

## Program Goal Charter

### North star

Present the current product as HigherBits.dev, with products named HigherBits MCP and HigherBits AI, while preserving existing users, integrations, history, legal disclosures, and third-party contracts.

### Definition of done

1. Current first-party page copy, navigation, metadata, documentation, and verified product artwork use the approved names.
2. `/higherbits-mcp` remains canonical; legacy MCP page and API paths still reach the same destinations and behavior.
3. Safe first-party browser-storage and waitlist configuration identifiers use HigherBits names with legacy values accepted and user state preserved.
4. Historical, legal, attribution, vendor, package, registry, sandbox, analytics, and rate-limit identifiers remain accurate and functional.
5. Current product images pass inspection of the actual source pixels and rendered route screenshots, not filename or text-only checks.

### Program-level verification bar

A phase is VERIFIED only after its validate-contract gates pass, regression evidence is recorded, automated and required human-review evidence is attached to its report, and no unresolved ownership or compatibility conflict remains. Existing dirty work is not proof of completion.

### Scope tiers and phase map

- Tier 1 — Current public surfaces and compatibility: Phase 01.
- Tier 2 — Safe first-party identifier migration: Phase 02.
- This program retires only verified current-product branding and the two approved safe identifier families. It does not seek zero legacy-string matches.

### Explicitly out of scope

- Product behavior, pricing, authentication, API response behavior, request/data contracts, schemas, or live data changes.
- Renaming third-party packages, vendor URLs, registry/sandbox IDs, Resend audience values, external repository slugs, or historical/legal identifiers.
- Removing legacy URLs, API routes, request-body values, or persisted aliases.
- Deployment, production environment mutation, live waitlist submissions, or unreviewed image/source replacement.
- A broad refactor of every `magic`, `21st`, or `21st.dev` occurrence.

### Hard safety constraints

- Do not start product edits until the phase’s read-only branch/status/diff baseline is captured and reviewed. Preserve all modified and untracked user work; never clean, reset, revert, stage, or commit it as part of this plan.
- Stop before touching a target whose current diff or ownership cannot be separated safely from the user’s existing changes.
- Keep legacy page/API routes, request values, response shapes, status behavior, rate-limit buckets, and data contracts unchanged.
- Never rename an identifier on a global-search basis. Apply the KEEP boundaries in this plan and the completed Phase 02 brand-sweep plan.
- Do not print, inspect, or change live environment values or provider audience IDs. Do not submit a real waitlist contact or deploy.
- Do not edit or delete an untracked/modified image until its ownership and current diff are reviewed; use an additive asset path only if the existing target cannot safely be edited.
- Preserve factual history, attribution, and required legal/license disclosures. If legal accuracy is uncertain, leave the text unchanged and block that edit for owner review.

## Stable Program Goal

```text
TARGET: Finish Phase 01 public-surface rebrand, then Phase 02 safe first-party identifier migration, until each phase has a written report and all applicable gates pass. Use HigherBits.dev, HigherBits MCP, and HigherBits AI exactly as locked in the SPEC.

PER-PHASE LOOP: Use the 7-step inner loop R → I → P → PVL → E → EVL → UP; it skips SPEC. 1 RESEARCH → 2 INNOVATE → 3 PLAN-SUPPLEMENT → 4 PVL → 5 EXECUTE → 6 EVL → 7 UPDATE-PROCESS. PVL is never skipped; a placeholder validate-contract blocks EXECUTE. Every new subagent first runs vc-context-discovery and vc-plan-discovery. Re-research at each phase entry. Invoke vc-agent-strategy-compare at each phase end. Use only automated, hybrid, and agent-probe as proving tiers.

HARD STOPS: No execution before read-only baseline/status review; stop if scoped dirty/untracked work or asset ownership cannot be isolated, a required change would alter API/data behavior, history/legal accuracy is uncertain, or a live/provider/deploy action is proposed. Never execute from a placeholder validate-contract.

SAFETY: Preserve all user changes. Never reset, revert, clean, stage, or commit as part of PLAN. Keep legacy routes, API behavior, request values, stored values, and aliases working. Never rename vendor/third-party identifiers or expose/change live environment values.

TEST GATES:
1. node .claude/skills/vc-generate-plan/scripts/validate-plan-artifact.mjs process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/higherbits-current-rebrand-umbrella_PLAN_12-10-26.md
2. node .claude/skills/vc-generate-phase-program/scripts/validate-umbrella-artifact.mjs process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/higherbits-current-rebrand-umbrella_PLAN_12-10-26.md
3. node .claude/skills/vc-generate-phase-program/scripts/validate-phase-stub.mjs process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-01-public-surfaces_PLAN_12-10-26.md process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-02-first-party-identifiers_PLAN_12-10-26.md
4. node .claude/skills/vc-audit-plans/scripts/validate-phase-plan-completeness.mjs process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-01-public-surfaces_PLAN_12-10-26.md
5. node .claude/skills/vc-audit-plans/scripts/validate-umbrella-state.mjs process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/higherbits-current-rebrand-umbrella_PLAN_12-10-26.md

VALIDATE CONTRACT: vc-validate-agent writes and verifies a separate contract in each phase plan before that phase can enter EXECUTE.

EXECUTE CONSENT: standing-granted via Autopilot; the EXECUTE CONSENT field in higherbits-current-rebrand_AUTOPILOT_GOAL_12-10-26.md is authoritative. No renewed execution permission is required. Execution remains gated on a validated contract and established source-hunk ownership; protected proof remains BLOCKED absent authorized local admin state.

START: Program is VERIFIED locally after final Phase02 EVL and UPDATE PROCESS; read higherbits-current-rebrand-closeout_REPORT_13-10-26.md and session-phase02-update-process_REPORT_13-10-26.md, then main completes existing goal bookkeeping. No new phase, commit, archive, move, deploy or runtime action. Historical prior START: Phase01 is VERIFIED after independent vc-validate-agent final EVL PASS 2026-10-13 and interphase UPDATE PROCESS. Read session-phase01-final-evl_REPORT_13-10-26.md and session-phase01-update-process_REPORT_13-10-26.md, then begin fresh RESEARCH for phase-02-first-party-identifiers_PLAN_12-10-26.md. No Phase02 execution before fresh research/plan/PVL. Preserve missing public history/C2 provenance limits and historical failures. Commits/archive/moves remain prohibited; program task stays active.
Reference for latest state: process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/higherbits-current-rebrand-umbrella_PLAN_12-10-26.md
```

## Phase Ordering

| Phase | Plan | Goal | Depends on | Exit proof |
|---|---|---|---|---|
| Phase 01 — Public Surfaces | `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-01-public-surfaces_PLAN_12-10-26.md` | Current copy, navigation, metadata, public docs, and real image pixels; preserve routes and API aliases. | Program entry baseline review | AC1–AC6 gates, including route/API compatibility and actual pixel review, pass; report written. |
| Phase 02 — First-Party Identifiers | `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-02-first-party-identifiers_PLAN_12-10-26.md` | Migrate only the specified browser keys and add waitlist environment aliases without changing data/API contracts. | Phase 01 VERIFIED; fresh status/diff review | AC7 compatibility scenarios pass; Phase 01 route/brand gates remain green; report written. |

**Ordering rule:** Phase 02 does not start until Phase 01 is VERIFIED. Both phases touch `apps/web`; do not execute them concurrently.

## Program Status Table

User Confirmation scope: the user explicitly accepted the revised public-baseline standard on 2026-10-13 and authorized this reconciliation. VERIFIED is the independent vc-validate-agent evidence verdict; no new human working-product or production approval is asserted.

| Phase | Status | Completion evidence |
|---|---|---|
| Phase 01 — Public Surfaces | ✅ VERIFIED | Independent vc-validate-agent final EVL 2026-10-13 PASS AC1–AC6/A1–D5; session-phase01-final-evl_REPORT_13-10-26.md; interphase session-phase01-update-process_REPORT_13-10-26.md; 796 source + 16 asset integrity matches at recorded endpoints. Missing history/C2 manifest and prior failures retained. |
| Phase 02 — First-Party Identifiers | ✅ VERIFIED | Fresh own PVL PASS, owned implementation/five reviews, independent final EVL315/129/1214/118 plus recovered16/14; Phase01 regression/current887+20 integrity PASS; main report and session-phase02-update-process_REPORT_13-10-26.md reconciled. |

## Touchpoints

- Phase 01 public surfaces: `apps/web/app/magic-chat/page.tsx` metadata/admin gate, `apps/web/app/magic-chat/page.client.tsx`, `apps/web/lib/navigation.ts`, `apps/web/components/features/main-page/sidebar-layout.tsx` as the navigation caller, `apps/web/app/higherbits-mcp/` page/layout/client files, the enumerated HigherBits MCP copy-bearing components, `apps/web/public/llms.txt`, `apps/web/public/llms-full.txt`, and `apps/web/app/our-story/page.tsx` as a history KEEP boundary. Preserve current nav hrefs `/magic-chat` and `/higherbits-mcp`.
- Phase 01 compatibility and assets: `apps/web/middleware.ts`, the listed `/api/magic/*` compatibility routes and canonical HigherBits MCP routes/tests, the existing legacy redirect spec, and the image candidates enumerated in the Phase 01 plan. Inspect consumer references and current ownership before editing any asset.
- Phase 02 identifier/config surfaces: `apps/web/hooks/use-analytics.ts` and its test, `apps/web/app/(utility)/privacy/page.tsx`, the two verified HigherBits MCP onboarding/console consumers, the narrowly scoped storage helper/tests, `apps/web/app/api/subscribe/route.ts` and mocked tests, and `.env.example` with empty values only.
- No other source paths are authorized by this plan. Phase touchpoints are the exact candidate lists in the respective phase plan; any new consumer or path requires PLAN/PVL scope review.

## Public Contracts

- Canonical MCP route stays `/higherbits-mcp`; `/magic`, `/magic/console`, and `/magic/get-started` retain current redirect destinations, status, and query strings. HigherBits AI remains at `/magic-chat`; no `/higherbits-ai` route is introduced.
- `/api/magic/check` and `/api/magic/use` remain compatible aliases for `/api/higherbits-mcp/check` and `/api/higherbits-mcp/use`, with unchanged methods, status/response behavior, request and response schemas, and `magic_use` rate-limit bucket. Mocked alias coverage maps to SPEC AC4 and AC6.
- `/api/subscribe` continues to accept `newsletter`, `magic-waitlist`, and `magic-chat` with unchanged request/response behavior. New waitlist environment names take precedence over their legacy names; the resolved third-party audience IDs do not change.
- Analytics consent order, one anonymous identity, attribution/event values, onboarding serialized schema, authentication behavior, and persisted legacy-key aliases remain compatible as defined in Phase 02.
- Keep the literal `npx higherbits-ai` as an unresolved UI fallback; npm lookup was declined/unprobed, so do not claim registry resolution or functionality. The API-key RPC live probe is excluded; local mocked proofs must not imply live RPC behavior.

## Blast Radius

- Only the `apps/web` package, its task-local focused browser evidence, and root `.env.example` are in scope. The expected risk spans public UI/metadata, redirects and API aliases, public docs and image assets, consent-gated browser storage, authenticated onboarding persistence, and waitlist configuration lookup.
- No database/schema, API/data contract, auth/billing, provider audience, deployment, package, vendor, sandbox, or third-party identifier changes are authorized. Source edits are limited to the phase touchpoint lists, and dirty/untracked ownership must be reviewed before execution.

## Current Execution State

Phase 01 — ✅ VERIFIED locally; original final EVL/interphase UPDATE PROCESS and frozen root APPROVE unchanged.

Phase 02 — ✅ VERIFIED locally; 2026-10-13 final owner reconciliation: Phase02 is ✅ VERIFIED locally after session-phase02-final-evl_REPORT_13-10-26.md final EVL PASS. Fresh UNIT315/PHASE01-unit129/FULL120 files1214/BROWSER118 plus distinct recovered PUBLIC16/PROTECTED14 all PASS on matching887 source/20 guards. Four genuine protected Axe comparisons/eight native PNGs retain their actual scope. Phase01 VERIFIED/root APPROVE unchanged. All required AC1–AC7 proof is fulfilled; no product gate deferred. Lowercase Phase02 decision approved with semanticCanonicalDecision=APPROVE and mustStopBeforeFinalize=false applies only to this local gate; no production/human approval. Historical PVL/REJECT/F failures/recovery and accepted provenance/visual/provider limits remain intact. Commit/stage/branch/deploy/archive/move are prohibited, intentionally not performed and not required for local verification. Task stays active at its existing path; polling runtime handle38673/PID9115 left live for user. Main may complete existing goal bookkeeping after the final requirement audit; no new goal created.

Program — ✅ VERIFIED locally: both validate-contracts/reports and all locked AC1–AC7 named gates satisfied. `higherbits-current-rebrand-closeout_REPORT_13-10-26.md` contains requirement/checklist/native/current-byte audit. No remaining scoped phase. Main may complete existing goal bookkeeping after process-validator audit. Task folder remains active intentionally; no archive/commit/deploy/runtime operation.

## Historical Execution State — preserved checkpoints

Latest authoritative checkpoint (2026-10-13 Asia/Tokyo): the user answered "Use current zero-violation audits plus genuine protected-page deltas." Only the historical public pre-edit accessibility-baseline requirement is revised: retain all ten current public zero-violation audits, all four genuine protected before/after comparisons and final affected MCP light/dark matched deltas; explicitly disclose missing original public capture. No SPEC, route/auth/image/truth/compatibility, source, risk approval or Phase 02 scope changes. Final FAQ/console independent source review and post-copy 117-file/928-test PASS are in the final-copy reports; their later heading supplement completes all four views and retains earlier raw failures. session-resume-integrity_REPORT_13-10-26.md checks 796 current files against the original 794-path manifest with reviewed FAQ/console overrides and two reviewed docs added: zero drift/missing and no unresolved merge paths. Carry actual timed test/runtime snapshots with their scopes; no redundant rerun or new goal is required. session-baseline-acceptance-revision_REPORT_13-10-26.md records the exact acceptance change and original raw paths. Phase 01 remains ACTIVE / TESTING under CONDITIONAL contract pending independent validator EVL and final criterion/packet disposition; Phase 02 remains ineligible. Historical pending-choice, pending-copy/heading and literal public-baseline blocker statements below and in older reports are superseded only as described here; their evidence and failures are preserved. Goal-tool resume is unavailable through update_goal's schema; the user's answer resumes the authorized work, without creating a replacement goal or claiming tool-state change.

Historical checkpoint (2026-10-12; superseded only where the 2026-10-13 checkpoint resolves the pending choice and later reviews): ownership/admin access resolved; correct checkout remains on 3101 and unrelated 3100 is preserved. Current full unit proof is 117 files / 928 PASS plus overlapping focused 30 PASS with 794 stable source fingerprints. Genuine protected baseline 14 and final combined runtime 20 PASS establish four zero-delta admin Axe pairs and compatibility/signed-out proof; final affected MCP two-theme Axe also passes. All ten public current Axe cases pass with zero violations, but are post-only. Nested-scroll/header/preview/middle/light workflow captures now have completed six dark workflow and eight footer native-review supplements. The two owned public LLM docs pass independent exact-diff/source-truth review. All five canonical risk records exist and validate; REJECT remains with historical rationale preserved and current disposition linked. Independent review identified bounded MCP FAQ identity/truth and console fallback-context gaps; source corrections and final coverage consolidation are underway. The explicit acceptance choice for the unrecoverable original public baseline remains pending. Phase 01 is ACTIVE / TESTING, not VERIFIED; Phase 02 remains ineligible. No renewed admin session or execution consent is required.

Historical planning snapshots (retained for chronology, not current session/asset availability):

Checkpoint supplement: session-public-final_REPORT_12-10-26.md now records all ten actual public Axe cases PASS, zero violations, exit 0. This is post-only, not the missing public pre-edit baseline. Supplemental below-fold artwork captures and static truth/KEEP/consumer review are recorded in their session reports; independent exit review still withholds VERIFIED for historical baseline/full-content/truth and closure evidence. No additional first-party Magic/21st branding rename is required in the six reviewed public/legal documents. Phase 02 remains held; admin access is not a blocker.

- The umbrella and both phase plans are revised; no source files were changed in this PLAN turn. Earlier agent-run tool evidence carried from the parent transcript: the two focused API Vitest files passed 2 files / 7 tests; the Playwright redirect attempt and local curl returned no response and were manually interrupted, so both are INCONCLUSIVE. These checks were not rerun during this PLAN supplement.
- Latest read-only situation: branch `main`, HEAD `3f091057`, upstream divergence `5 ahead / 70 behind`; an earlier read in this same planning session reported `4 ahead / 70 behind`. The moving baseline must be re-read before execution.
- Scoped product paths already contain overlapping modified and untracked HigherBits MCP/rebrand work. `git diff --name-only --diff-filter=U` returned no unresolved merge paths at the latest check. The locked SPEC is untracked in its task folder; its observed SHA-256 was `fe2029b0f59fd7d91cc491fc77062396fe6f7c20c0f983b947ba2f44dbaf1e98`.
- Do not infer ownership from status alone. Treat modified and untracked hunks as pre-existing until a fresh baseline, scoped diff, and path-and-hunk ownership map establish ownership; stop before any source change if unclear. `apps/web/app/higherbits-mcp/page.tsx` and `apps/web/public/higherbits-mcp-og-image.png` are untracked; `apps/web/lib/emails/invite-template.tsx` is dirty. Preserve original image bytes.
- Both `/higherbits-mcp` (`apps/web/app/higherbits-mcp/layout.tsx`) and `/magic-chat` (`apps/web/app/magic-chat/page.tsx`) have source-confirmed `auth()` plus `checkIsAdmin(userId)` gates. The current Playwright projects are `setup`, `public`, and `studio`; no admin project or authorized local admin state is established. Keep protected content, screenshot, and Axe gates BLOCKED unless pre-authorized state is available; never bypass auth. Independent checks may proceed.
- Asset state: `magic-chat-waitilist.webp` is the referenced background; `magic-chat-waitilist.png` exists but is unreferenced; correctly spelled `magic-chat-waitlist.webp` is absent. The MCP social-card fallback `higherbits-mcp-social-card.png` is absent; the invite email currently uses an absolute HTTPS image URL. Preserve all originals and do not point consumers at a missing fallback.
- Current phase: Phase 01 ACTIVE / TESTING under inline inner-pvl: phase-01 contract dated 2026-10-12. Raw validation findings retained. Mocked tests and browser safeguards implemented; 30 focused tests PASS, public discovery 14 and static review PASS. Named MCP/email ownership confirmed. Admin browser bodies now verified on current-checkout port 3101; private owner-only session saved outside Git and bounded automated baseline running. Port 3100 belongs to another checkout and is preserved. Prior redirect runtime is INCONCLUSIVE after setup timeout. Product edits still require completed A5 baseline; Phase 01 is not VERIFIED.

## Phase Loop Progress

Current workflow follow-through (2026-10-13): both phases completed all seven inner-loop steps; independent final Phase02 EVL and owner reconciliation complete. Program VERIFIED locally, retained active without commit/archive/deploy. Earlier checkpoints below remain historical where superseded.

- [x] PLAN — locked SPEC, current status, routed context, prior plan/KEEP boundaries, and existing tests reviewed; Phase 01/02 plan files created and Phase 01 plan revised.
- [x] Phase 01 RESEARCH — complete.
- [x] Phase 01 INNOVATE — approved approach retained.
- [x] Phase 01 PLAN-SUPPLEMENT — approved plan corrections applied.
- [x] Phase 01 PVL — CONDITIONAL contract/audit dated 2026-10-12; explicit V5 acceptance retains unmet prerequisites.
- [x] Phase 01 EXECUTE — owned work and actual final snapshots reconciled.
- [x] Phase 01 EVL — independent vc-validate-agent PASS dated 2026-10-13, AC1–AC6 and A1–D5.
- [x] Phase 01 UPDATE-PROCESS — session-phase01-update-process_REPORT_13-10-26.md; status/report/goal/current packet reconciled; commit not required for local verification and prohibited; no archive.
- [x] Phase 02 RESEARCH — session-phase02-research_REPORT_13-10-26.md; fresh actor findings persisted.
- [x] Phase 02 INNOVATE — session-phase02-innovate_REPORT_13-10-26.md; minimal joint proof and bounded compatibility decisions.
- [x] Phase 02 PLAN-SUPPLEMENT — existing selected plan supplemented; session-phase02-plan-supplement_REPORT_13-10-26.md; full fresh PVL required.
- [x] Phase 02 PVL — fresh V1–V7 PASS after one bounded process-only fix cycle; executable inline contract and session-phase02-validate_REPORT_13-10-26.md recorded. Implementation/EVL remain pending.
- [x] Phase 02 EXECUTE — owned18-path implementation, five bounded reviews and gates PASS.
- [x] Phase 02 EVL — session-phase02-final-evl_REPORT_13-10-26.md final evidence PASS; F failures and distinct R confirmation retained.
- [x] Phase 02 UPDATE-PROCESS — current packet/report/plan/goal/context reconciled; archive/commit prohibited.
- [x] Program closeout — both phases/reports VERIFIED locally; AC1–AC7/22+20 checklist audit and process-validator outcomes retained.

## Pre-PVL Conflict Resolution

- Shared package: `apps/web` — **reassign to sequential ownership; Phase 01 is the winning first owner**, and Phase 02 is deferred until Phase 01 is VERIFIED. The phases have separate planned source domains but share browser/API test surfaces and must not be edited in parallel.
- Within Phase 01, public copy, route compatibility, and artwork stay in one coordinated execution stream. Within Phase 02, storage migration and waitlist-config aliasing stay in one stream so shared identifiers and rollback rules remain consistent.
- No phase-blast-radius registry is needed for this two-phase sequential plan set. Re-run conflict review at each phase entry; any newly shared target is reassigned before execution.

## Entry and Exit Gates

| Gate | Required evidence |
|---|---|
| Program entry | Read-only branch/HEAD/upstream/status, merge-conflict, and scoped-diff review; exact dirty/untracked files classified; no destructive cleanup. If a selected target is ambiguous, stop before edits. |
| Phase 01 exit | Named AC1–AC6 verification rows pass; compatibility paths remain unchanged; images pass source-pixel and route-screenshot review; Phase 01 report records baseline and residuals. |
| Phase 02 entry | Phase 01 report read; status/diff baseline recaptured; target changes reconciled against Phase 01; no unresolved ownership or contract conflict. |
| Phase 02 exit | AC7 old/new storage and config compatibility tests pass; no real provider send; Phase 01 regression gates pass; Phase 02 report records resolved aliases and any intentionally retained IDs. |
| Program exit | Both phases VERIFIED with validate-contracts, own gates, regression checks, and reports. No zero-grep requirement. |

## Scope and KEEP Boundaries

**Rename/current presentation:** Use HigherBits.dev as umbrella brand; HigherBits MCP at canonical `/higherbits-mcp`; HigherBits AI is the product currently served at `/magic-chat`. Keep `/magic-chat` as the existing route; do not invent `/higherbits-ai`.

**Preserve compatibility:** `/magic/*` redirects, query strings, `/api/magic/check`, `/api/magic/use`, their methods and response behavior, and existing `/api/subscribe` request types (`newsletter`, `magic-waitlist`, `magic-chat`). Keep reserved `magic`/`magic-chat` slugs in `apps/web/lib/constants.ts`.

**KEEP — third-party and functional identifiers:** `@21st-dev/cli`, `@21st-dev/magic`, `21st-registry.json`, `21st-vite`, `21st-dev/magic-mcp`, npm registry URLs, vendor-hosted `cdn.21st.dev` assets and library links, sandbox/template IDs, and external integration values. The authoritative prior allow-list is `process/features/higherbits-cozy-rebrand/completed/higherbits-cozy-rebrand_12-07-26/phase-02-brand-sweep_PLAN_12-07-26.md` §Implementation Checklist / Step A0 and §Survivors.

**KEEP — history/legal/measurement:** Preserve truthful history in `apps/web/app/our-story/page.tsx`, legally required entity/license text, source attribution, accurate third-party comparisons, persisted attribution values (`magic`, `magic_header`, `magic_landing_hero`, `magic_console`, `magic_onboarding`), and the `magic_use` rate-limit bucket. These are not current product copy.

**KEEP — unapproved storage families:** Leave Jotai-backed `magic_agent_used`, `magic_onboarding_completed`, and `magic-banner-visible` unchanged in this program; their persisted state adapter/consumer migration is not in the safe subset. Do not rename analytics event/source values or API request values.

**Identifier migration allowed in Phase 02:** `21st_anon_id` → `higherbits_anon_id`; `magic_onboarding_state` → `higherbits_mcp_onboarding_state`; and preferred env names `HIGHERBITS_MCP_WAITLIST_AUDIENCE` / `HIGHERBITS_AI_WAITLIST_AUDIENCE` with old env-name fallback. Keep old browser values readable/writable as specified in Phase 02; keep Resend audience values unchanged.

## Global Constraints

- Use only the locked product names and exact approved phase scope; do not infer additional renames from search results.
- Preserve every user-owned dirty or untracked change. No cleanup, reset, revert, stage, commit, production change, or live provider submission is part of this program.
- Public copy may be updated only where it describes the current first-party product. Preserve accurate historical, legal, license, source-attribution, vendor, third-party, package, registry, sandbox, API, analytics, rate-limit, and persisted-state identifiers.
- A legacy identifier is retained until its corresponding route, data, or configuration compatibility proof demonstrates a safe replacement. No zero-grep acceptance criterion is permitted.

## Data Flow and Failure Modes

1. Public visitor opens `/higherbits-mcp` or `/magic-chat`; route metadata, shared nav, copy, docs, and image assets provide the approved product names. Legacy `/magic/*` requests retain the same redirect destination and query string.
2. Legacy API callers continue through the existing `/api/magic/*` re-exports to the canonical HigherBits MCP handlers. No handler behavior, request/response schema, or rate-limit identity changes.
3. After consent, analytics reads the existing anonymous ID first, reuses it, then writes the same value to canonical and legacy keys. Before consent it does not migrate or create an identifier; rejection clears both. A storage failure fails closed and cannot create an alternate analytics identity.
4. Authenticated MCP onboarding/console state reads the legacy key first, falls back to the canonical key, and writes the unchanged serialized state to both. Existing unauthenticated clearing semantics clear both. Invalid state follows the existing default-state path.
5. Waitlist code resolves canonical config names before legacy env aliases, passes the identical configured vendor audience value to Resend, and continues to accept the existing request types. Missing config preserves the current error status/shape; no live audience is contacted in verification.

**Failure response:** If state migration, visual asset ownership, or alias precedence cannot be demonstrated without losing user data or changing an external contract, stop the affected checklist item, record evidence in the phase report, and do not mark the phase VERIFIED. Do not force green by widening grep allow-lists or dropping compatibility tests.

## Risk Predictions

| Persona | Prediction | Resolution locked into this plan |
|---|---|---|
| Architect | Two phases share a package; broad renames can cross phase boundaries. | Keep Phase 01 and Phase 02 sequential with explicit file ownership and entry gates. |
| Security/privacy | Analytics identifiers must remain consent-gated; copied environment values could leak. | Preserve consent order; test with mocks; never print or change live values. |
| Performance | Dual storage writes add small local work but must not duplicate analytics identity or events. | Reuse one ID/state value; add only key-alias writes; assert one measurement path. |
| UX/accessibility | New labels can coexist with old metadata or stale image pixels; keyboard/a11y may regress. | Route-level assertions, current a11y baseline comparison, desktop/mobile and light/dark visual evidence. |
| Devil’s advocate | Not every old string is a brand; zero grep matches would be a false success. | Use file-by-file ownership inventory and explicit KEEP list; no blanket replacement. |

## Durable Report Destinations

| Phase | Report destination |
|---|---|
| Phase 01 — Public Surfaces | process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-01-public-surfaces_REPORT_12-10-26.md |
| Phase 02 — First-Party Identifiers | process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-02-first-party-identifiers_REPORT_12-10-26.md |

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `BRAND-PUBLIC-01` — automated final URL, product identity/metadata/navigation assertions; authorized state/runtime are prerequisites | Fully-Automated | SPEC AC1, AC3 |
| `COPY-KEEP-02` — current copy inventory plus human review of docs, pricing/onboarding/console wording and KEEP exceptions | Hybrid | SPEC AC2, AC6 — approved copy and accurate disclosures |
| `ROUTE-COMPAT-03` — redirects preserve destination, 308 behavior, and encoded/repeated/multiple query strings for `/magic`, `/magic/console`, `/magic/get-started` | Fully-Automated | SPEC AC3 — canonical MCP identity and legacy page compatibility |
| `API-COMPAT-04` — mocked alias equivalence for `/api/magic/check` and `/api/magic/use` against canonical handlers | Fully-Automated | SPEC AC4, AC6 — current MCP API identity and legacy API usability |
| `PIXEL-QA-05` — capture product routes and inspect actual branded source images/screenshots, with admin gates conditional on authorized state; supporting Phase 01 A11Y-DELTA-10 uses the 2026-10-13 public/protected standard without reducing image proof | Hybrid | SPEC AC5 — current product artwork is correctly branded; supporting A11Y-DELTA-10 maps SPEC AC1, AC3, AC5 |
| `TRUTH-KEEP-06` — human review of history, attribution, legal/license text, vendor and integration identifiers | Hybrid | SPEC AC2, AC6 — factual and contractual disclosures remain intact |
| `IDENTIFIER-COMPAT-07` — browser storage and waitlist config old/new scenarios, plus local browser review | Hybrid | AC7 — first-party identifiers migrate compatibly; third-party IDs stay unchanged |

**Test context:** Phase 01 contract commands govern. Ownership-cleared isolation/identity harness precedes baseline/product edits. Admin-only specs excluded from public atomically upon creation even without admin state; preserve studio isolation. Admin trace off. Browser runs need readiness and --global-timeout 300000; setup warms 19 routes with retries. Preserve raw outcomes/Axe signatures/nodes before overwrite; no new signatures AND affected nodes, with old findings/raw failures disclosed separately. Current @higherbits-dev/cli@latest and unresolved npx higherbits-ai are preserved versus historical @21st-dev KEEP examples. Exact pinned reports/KEEP and EVL Handoff subsection are in Phase 01.

**Prior evidence and limits:** earlier agent-run tool evidence carried from the parent transcript records focused Vitest passing 2 files / 7 tests. The redirect Playwright attempt and local curl returned no response and were manually interrupted (INCONCLUSIVE). Neither Vitest nor Playwright/curl was rerun during this PLAN supplement. Do not treat the inconclusive checks as pass/fail or as protected-page evidence. No npm registry lookup or live API-key RPC probe is included.

## Test Infra Improvement Notes

No new runner/global infrastructure. Plans/reports stay flat; screenshots and sanitized command/Axe evidence use unique `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/evidence/phase-01/<run-id>/` paths, never another program’s folder.

## Rollback and Migration Safety

- Phase 01 keeps route/API contracts stable. Rollback uses captured pre-edit contents/binary hashes and reviewed inverse owned hunks, never whole dirty files or HEAD. Coordinate both image consumers and retained public/admin config/spec isolation; preserve originals/fallback. Protected reruns remain blocked without authorized state.
- Phase 02 retains and dual-writes legacy storage keys and old environment-name fallbacks. Rollback to the previous code continues to find legacy values/config. No user state or provider audience ID is deleted or rewritten.
- Keep old image URLs and filenames where safe; do not delete image assets as a branding shortcut. If an untracked target cannot be edited safely, add an explicit new asset and repoint the consumer without overwriting the user file.

## Resume and Execution Handoff

**Current authoritative next action — final closeout:** no remaining scoped execution phase. Main audits `higherbits-current-rebrand-closeout_REPORT_13-10-26.md` and `session-phase02-update-process_REPORT_13-10-26.md`, then completes existing goal bookkeeping. Both phases/program VERIFIED locally. Commit/stage/branch/deploy/archive/move and runtime operations remain prohibited/not required. Earlier instructions below are historical checkpoints, not renewed commands.

### Historical phase-entry handoffs — superseded

- **Current next action — Phase02 2026-10-13:** fresh full PVL V1–V7 on `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-02-first-party-identifiers_PLAN_12-10-26.md`. Its Inner Loop Refresh Note invalidates prior contract reuse. R/I/P complete; do not repeat broad research, execute the umbrella or treat Phase01's contract as Phase02 authority. Read the two Phase02 actor reports and supplement report; use selected plan's exact Context Envelope/package and new test/config allowlist. Preserve existing standing consent; no user round absent genuine hard stop. Later execution remains held until its own validated contract.
- Phase02 joint browser/consumer proof establishes persistence behavior only; test-only auth stubs never establish protected authorization. Preserve real server/layout gates, full package/focused regression, exact ten current public plus four genuine protected matched Axe standards and final affected MCP evidence, all native image/KEEP requirements, historical failures/provenance limits. No unauthorized narrowing or new SPEC.
- Phase02 additional scoped test allowlist is the four `apps/web/e2e/first-party-identifiers*` / `fixtures/first-party-identifiers/*` files, both actual consumer `__tests__/page.client.test.tsx` files and secret-free `apps/web/vitest.first-party-identifiers.config.ts`, alongside the already planned helper path and existing tests. All are specified exactly in Phase02 Touchpoints and require fresh PVL review. Shared configs/fixtures and unrelated dirty work stay read-only.

- **Current authoritative handoff — 2026-10-13:** 2026-10-13 owner reconciliation: Phase 01 is ✅ VERIFIED locally. Independent vc-validate-agent final EVL dated 2026-10-13 (session-phase01-final-evl_REPORT_13-10-26.md) passes AC1–AC6 and A1–D5 after the explicit user baseline acceptance. Actual raw proof was reviewed by that validator; current applicability is supported by 796 source/config/test/docs and 16 asset matches at the recorded endpoints. Current canonical packet decision APPROVE is agent evidence disposition for Phase01 local verification only; historical REJECT/rationale/timestamp are preserved in historicalDecisions. No production/human approval inferred. Original public pre-edit history remains missing; C2 eleven-original aggregate remains writer-only without the original manifest; viewport/tiled capture, supplementary-unit artifact and all other disclosed limits/failures remain intact. No required Phase01 gate is deferred. Commit not required for local verification and prohibited; no archive/move/cleanup. Program/task stay active for outstanding Phase02. Exact next action: fresh RESEARCH on phase-02-first-party-identifiers_PLAN_12-10-26.md, then its own seven-step loop and fresh PVL before execution. See session-phase01-update-process_REPORT_13-10-26.md.
- **Historical handoff bullets below:** retained snapshots where superseded; not current instructions.

- Authoritative 2026-10-13 next action: independent validator EVL of the selected Phase 01 plan's bounded acceptance revision. Read session-baseline-acceptance-revision_REPORT_13-10-26.md and session-resume-integrity_REPORT_13-10-26.md first, then the actual final-copy/public/protected/ledger evidence. Acceptance is resolved; original public pre-edit history remains missing. Carry the named post-copy 928-test and runtime snapshots under the 796-file integrity check with explicit time/scope, without duplicate tests/browser work. Keep ACTIVE / TESTING, retain historical REJECT/failures and leave risk records unchanged. Phase 02 remains held until independent Phase 01 VERIFIED and fresh Phase 02 research. Earlier bullets below are historical where superseded by this paragraph.
- Selected plan file path: `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-01-public-surfaces_PLAN_12-10-26.md` for the first execution loop; do not hand an executor the entire program as one plan.
- Supporting plan: `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-02-first-party-identifiers_PLAN_12-10-26.md`; it is not eligible for execution until Phase 01 is VERIFIED and freshly researched.
- Phase 01 VALIDATE is CONDITIONAL with explicit V5 acceptance, inline contract dated 2026-10-12 and `phase-01-public-surfaces-validate_REPORT_12-10-26.md` audit. Partial source test/harness implementation and named ownership confirmation are recorded in the execution report; no authorized admin baseline exists. Phase 02 remains ineligible until Phase 01 VERIFIED.
- Context loaded: `process/context/all-context.md`, `process/context/planning/all-planning.md`, `process/context/tests/all-tests.md`, `process/development-protocols/phase-programs.md`, prior HigherBits redesign/brand-sweep plans, and relevant source/test files.
- Next step: finish the bounded ten-case public accessibility run and reconcile exit-review findings without inventing missing baseline or below-fold proof. Read the latest execution checkpoint and session-final-runtime_REPORT_12-10-26.md; retain historical raw failures. Admin session recovery is complete, not a remaining user action.

## Phase02 V7 Historical Handoff — 2026-10-13

Phase02 plan readiness: PASS, not VERIFIED. Current contract: phase-02-first-party-identifiers_PLAN_12-10-26.md, generated-by inner-pvl: phase-02. Evidence: session-phase02-validate_REPORT_13-10-26.md and iteration001 report/results.tsv. Four dimension and five section reviews plus four affected/final reviews completed; initial concerns resolved in one bounded owned-process fix cycle. Standing Autopilot consent applies; no new user decision is needed for already-approved reversible local execution.

Current START supersedes older requests for fresh Phase02 PVL: scoped EXECUTE using the inline contract, coordinator-owned isolated test configs and safe-config baseline first, then three disjoint workers (analytics/privacy; MCP helper/two clients/units; subscribe/env/tests/template). Optional fixture worker starts after hook/helper seams are fixed. Eighteen exact source/test/template ownership paths are listed in the contract; no parallel shared-config ownership.

Main entry baseline117 files/928 tests PASS, exit0,49.43s is original-runner evidence only, not migration proof or simultaneous source-manifest evidence. Fixture/browser, actual consumer units, full/focused regressions, genuine protected/public audits, source guards and independent EVL remain mandatory. Preserve Phase01 VERIFIED revised acceptance and frozen root APPROVE packet. Separate Phase02 risk pack at evidence/phase-02/pvl-13-10-26/harness remains implementation-pending/REJECT until actual proof. No source implementation occurred during VALIDATE.

Existing goal received append-only V7 UPDATE; no new goal created. Reference for latest state remains this umbrella.

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)

## Program Closeout — 2026-10-13

2026-10-13 final owner reconciliation: Phase02 is ✅ VERIFIED locally after session-phase02-final-evl_REPORT_13-10-26.md final EVL PASS. Fresh UNIT315/PHASE01-unit129/FULL120 files1214/BROWSER118 plus distinct recovered PUBLIC16/PROTECTED14 all PASS on matching887 source/20 guards. Four genuine protected Axe comparisons/eight native PNGs retain their actual scope. Phase01 VERIFIED/root APPROVE unchanged. All required AC1–AC7 proof is fulfilled; no product gate deferred. Lowercase Phase02 decision approved with semanticCanonicalDecision=APPROVE and mustStopBeforeFinalize=false applies only to this local gate; no production/human approval. Historical PVL/REJECT/F failures/recovery and accepted provenance/visual/provider limits remain intact. Commit/stage/branch/deploy/archive/move are prohibited, intentionally not performed and not required for local verification. Task stays active at its existing path; polling runtime handle38673/PID9115 left live for user. Main may complete existing goal bookkeeping after the final requirement audit; no new goal created.

All five Program Goal Charter Definition-of-Done items are met within the locked and accepted local scope: current naming/artwork; canonical/legacy routes and API behavior; compatible storage/config aliases; retained truth/vendor/measurement contracts; automated captures plus native pixel/consumer review. Exact AC1–AC7 and both phase checklist proofs are in `higherbits-current-rebrand-closeout_REPORT_13-10-26.md`. Original public/C2 provenance, viewport/manual legibility and provider/npm/build/type/coverage limits remain explicit; no invented production/human approval or new gate. No downstream phase/follow-up stub is required for this scoped goal. Existing goal file receives append-only completion amendment. Artifact retention in active is intentional, not incomplete work.
