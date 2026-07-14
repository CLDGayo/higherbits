---
name: plan:21st-promotion-phase-02-frontend-migration
description: "21st.dev Promotion — Phase 02: Frontend & UI Migration"
date: 08-07-26
metadata:
  node_type: memory
  type: plan
  feature: 21st-promotion
  phase: phase-02
---

# Phase 02 — Frontend & UI Migration

**Program:** 21st-promotion
**Umbrella plan:** process/features/21st-promotion/active/21st-promotion_08-07-26/21st-promotion-umbrella_PLAN_08-07-26.md
**Phase status:** ✅ VERIFIED
**Report destination:** process/features/21st-promotion/active/21st-promotion_08-07-26/phase-02-frontend-migration_REPORT_08-07-26.md (flat in the program task folder)

**Date** 09-07-26
**Status** IN PROGRESS
**Complexity** COMPLEX (phase-program phase plan)

---

## Overview

## Purpose

This phase ports 21st-dev's shared UI **primitives** (`21st-dev/apps/web/components/ui/`) and visual/styling polish into Cozy Downloads `apps/web` — NOT a full page/marketplace port. It relies on `vc-frontend-design` and `vc-docs-seeker` to align styling systems (scoped Tailwind additions) and `vc-sequential-thinking` to reconcile ported primitives against what already exists in `packages/ui/src/cozy/*` and root's other UI dirs without breaking the existing storefront.

---

## Decisions from INNOVATE (Step 2)

**Chosen approach: Hybrid (Option C) — primitives + polish only.**

- Port 21st-dev's shared UI primitives and visual/styling polish ONLY.
- Do NOT port 21st-dev's marketplace/page-level architecture (studio, component-detail, community browsing, contest, bundles, submissions). Root's existing Qdrant-backed registry pipeline and existing placeholder routes (`apps/web/app/studio/*`, `apps/web/app/[username]/[component]/*`, `apps/web/app/community/*`) remain the product surface and are unchanged by this phase.
- Do NOT activate the Phase 1 dormant Prisma marketplace tables (`components`, `demos`, `bundles`, etc.) — stay present-but-unused, consistent with Phase 1's own decision.
- Root's `--radius`/Tailwind token scheme stays authoritative. Ported primitives adapt their class names to consume root's existing CSS variables — not the reverse. (Scout confirmed 21st's primitives use a `-21st` namespace, lowering collision risk with root tokens.)
- Dependencies: REJECT Monaco editor, CodeSandbox SDK, TanStack Query/react-table, Supabase JS client (forbidden — would violate Phase 1's "no second data-access SDK in live routes" decision), Amplitude/PostHog analytics, react-hook-form, recharts, lottie-react — all out-of-scope for a primitives-only port. Accept only what's minimally needed for the specific ported primitives (e.g. `tailwindcss-animate` plugin, small missing Radix packages) — decided at EXECUTE time based on which primitives are actually chosen.

**Explicitly OUT OF SCOPE for Phase 2:**
- `apps/web/app/studio/*` (existing placeholder implementation from another concurrent program — untouched)
- `apps/web/app/[username]/[component]/*` (existing placeholder — untouched)
- `apps/web/app/community/*` (existing placeholder — untouched)
- `apps/web/components/studio/*` (confirmed at VALIDATE V2 to belong to the concurrent Creator Studio program — not in this phase's Blast Radius, untouched)
- Monaco editor, CodeSandbox SDK, TanStack Query/react-table, Supabase JS client, Amplitude/PostHog analytics, react-hook-form, recharts, lottie-react
- Activating dormant Prisma marketplace tables

**Governance note (non-blocking, no action this phase):** `packages/ui/src/cozy/*` (4 files) already contains un-attributed "21st.dev Replica Primitives." This repo's identity is a strict MIT-attribution component aggregator (registry frontmatter requires `Author`/`Source_Repo`/`License_SPDX` per `process/context/all-context.md`), so these un-attributed replica primitives in the protected curated package are a governance gap. This is a FUTURE separate-task flag only — modifying `packages/ui` without explicit user approval is a hard safety constraint and out of scope here. UPDATE PROCESS should carry this into a backlog note.

---

## Entry Gate

- Phase 1 complete (Backend DB schema merged)

---

## Touchpoints

- `21st-dev/apps/web/components/ui/` (read-only source for the port)
- `apps/web/components/ui/` (new — mirrors 21st-dev's primitive naming; primary write target)
- `apps/web/tailwind.config.ts` (scoped additions only — animation/plugin config actually needed by ported primitives)
- A small number of EXISTING root page/component files where a ported primitive is a straightforward drop-in visual upgrade (exact files TBD at EXECUTE time, decided during A2/A3 reconciliation)
- `packages/ui/src/` — READ-ONLY reference for the A2 reconciliation inventory; not modified this phase

## Public Contracts

- No new public API, schema, or route contracts. This phase is UI-primitive-level only.
- Any existing page whose component is swapped for a ported primitive must preserve its existing props/behavior contract (visual/styling change only, not a behavioral change) unless the swap is a deliberate, narrowly-scoped enhancement noted in the phase report.

## Blast Radius

- `apps/web/components/ui/` (new primitives directory)
- `apps/web/tailwind.config.ts` (scoped additions only, not a full config merge)
- A small number of existing page files where a primitive is swapped in (exact list TBD at EXECUTE time — NOT a broad `apps/web/app/*` blast radius)
- `packages/ui/src/` is READ-ONLY reference only (governance/reconciliation lookup) — not modified
- Risk class: low — no schema/auth/API/billing surface touched; visual/styling change within an existing feature area

---

## Implementation Checklist

### Step A — UI Primitive Merge & Reconciliation

- [ ] A1. **Scoped Tailwind merge (not full config merge).** Identify only the Tailwind primitives/animations actually required by the specific ported UI primitives from `21st-dev/apps/web/components/ui/` (e.g. `tailwindcss-animate` plugin classes, keyframes). Add ONLY those to `apps/web/tailwind.config.ts`. Root's existing token scheme (including `--radius`) stays authoritative — adapt ported primitive class names to consume root's existing CSS variables, do not import 21st-dev's token values wholesale. **Confirmed at VALIDATE: `apps/web/tailwind.config.ts` currently has zero `animate`/keyframe entries — this is a pure addition, not a rewrite.**
- [ ] A2. **Inventory + reconciliation (not blind copy).** List every file in `21st-dev/apps/web/components/ui/`. Cross-reference against what ALREADY exists in `packages/ui/src/cozy/*` (existing 21st.dev-replica primitives) and root's other `packages/ui/src/` dirs (shadcn/mantine wrappers). Port ONLY primitives genuinely missing from root. Record the reconciliation table (source file → exists-already / port-needed → destination path) in the phase report. **See Execute-Agent Instruction E1 in the Validate Contract below for the pre-enumerated candidate-duplicate list — do not rediscover from scratch.**
- [ ] A3. **Narrow page/component integration.** Do NOT touch `apps/web/app/studio/*`, `apps/web/app/[username]/[component]/*`, `apps/web/app/community/*`, or `apps/web/components/studio/*` (confirmed at VALIDATE to be the concurrent Creator Studio program's surface) — those routes and their existing placeholder implementations are OUT OF SCOPE. Any page-level use of a ported primitive is limited to swapping it into an EXISTING root page/component as a drop-in visual upgrade where clearly beneficial (e.g. catalog or marketing component polish) — not building new marketplace pages.
- [ ] A4. **Governance note (add-only, no file action).** Add a note to the phase report flagging the `packages/ui/src/cozy/*` attribution gap (un-attributed 21st.dev replica primitives in the strict-MIT-attribution curated package) for UPDATE PROCESS to carry into a backlog note. No file is modified in `packages/ui` for this item.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `pnpm --filter web build` exits 0 | Fully-Automated | Ported primitives compile and do not break the Next.js build |
| Existing `studio/`, `community/`, `[username]/[component]` placeholder routes still render (route-still-renders smoke check) | Hybrid | No regression to out-of-scope routes; Hybrid decision (root tokens authoritative, no marketplace port) preserved |
| A2 reconciliation table shows no duplicate primitive ported | Agent-Probe | Reconciliation step (A2) was performed, not a blind copy |
| Governance note present in phase report re: `packages/ui/src/cozy/*` attribution gap | Agent-Probe | A4 add-only governance flag was carried forward, `packages/ui` left untouched |
| New `apps/web/components/ui/` primitives render without runtime error (new gate added at VALIDATE — see contract) | Agent-Probe | Closes the Test Gap: build success alone does not prove render correctness |

---

## Acceptance Criteria

- [ ] `pnpm --filter web build` exits 0 with ported primitives included.
- [ ] Reconciliation inventory (A2) completed — no primitive duplicated between the port and existing `packages/ui/src/cozy/*` or other `packages/ui/src/` dirs.
- [ ] No new page routes created under `studio/`, `[username]/[component]/`, or `community/` — those remain untouched placeholders.
- [ ] Ported primitives use root's existing Tailwind/CSS-variable token scheme (no wholesale 21st-dev token import).
- [ ] Governance note on `packages/ui/src/cozy/*` attribution gap recorded in the phase report (A4).

## Phase Completion Rules

- Phase is CODE DONE when all Implementation Checklist items (A1-A4) are complete and the Exit Gate build passes.
- Phase is VERIFIED only after PVL (validate-contract written) and EVL (gates re-confirmed independently) both complete per the Phase Loop Progress below.
- Phase report must be written before the phase is marked complete in the umbrella plan.

---

## Exit Gate

```bash
pnpm --filter web build
```
- Next.js build passes.
- No regression to the existing `studio/`, `community/`, `[username]/[component]` placeholder routes (simple route-still-renders check) — these must remain functionally unchanged since they are out of scope, not broken.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Incompatible Tailwind configs or Next.js App Router route collisions.
- A ported primitive cannot be adapted to root's token scheme without a broad token rewrite (would violate "root tokens authoritative" decision).

---

## Test Infra Improvement Notes

**Added at VALIDATE (09-07-26):** No automated test currently exists asserting `apps/web/components/ui/` primitives render correctly (confirmed via grep across `apps/web/**/__tests__`). The Exit Gate's "route-still-renders smoke check" for `studio/community/[username]` is also currently undefined as a concrete command. Both gaps are addressed as execute-agent instructions in the Validate Contract (E2, E3) rather than left as silent known-gaps, since a Fully-Automated build-only gate would leave the phase's core deliverable (new rendering primitives) unproven at runtime.

---

## Phase Loop Progress

- [x] 1. RESEARCH — research-agent: found root already has partial/placeholder studio/community/[username] implementations from other concurrent programs, un-attributed 21st-replica primitives already in `packages/ui/src/cozy/*`, and a `--radius` token-naming question later resolved by scout (21st primitives use a `-21st` namespace, low collision risk).
- [x] 2. INNOVATE — innovate-agent: chose Hybrid (Option C) — primitives/polish only, no marketplace architecture port, no dormant-Prisma activation, root tokens authoritative, minimal dependency acceptance; governance flag on `packages/ui/src/cozy/*` raised as non-blocking note.
- [x] 3. PLAN-SUPPLEMENT — plan-agent: checklist (A1–A3) revised to reflect Hybrid scope, new A4 governance-note item added, Blast Radius narrowed away from broad `apps/web/app/*`, Decisions-from-INNOVATE section added, Exit Gate updated with placeholder-route regression check, Acceptance Criteria + Phase Completion Rules added to satisfy plan-artifact validator.
- [x] 4. PVL — vc-validate-agent: full V1-V7 run; validate-contract written (Gate: CONDITIONAL, 2 concerns both resolved inline — no supplement cycle required).
- [x] 5. EXECUTE — all checklist items (A1–A4) done; test gates green. **Ported (12 total in `apps/web/components/ui/`):** 5 from prior partial run (badge, card, label, separator, skeleton) + 7 new this run (avatar, tooltip, checkbox, switch, progress, toggle, scroll-area) — all adapted to root's authoritative token scheme (primary→accent, ring→accent, input→border, popover→surface, muted-foreground→foreground). **Skipped:** the 8 E1 pre-confirmed duplicates (button, dialog, alert-dialog, dropdown-menu, input, textarea, tabs, table — exist in `packages/ui/src`); select/accordion (require `@radix-ui/react-icons` — heavier dep, no drop-in need); all app/marketplace-specific files (checkout-dialog, pricing-*, code-editor-dialog, sandpack-adjacent, brand-assets-menu, command-menu, sidebar, etc. — not needed for a primitives-only polish port). **A1:** no Tailwind config change needed (all tokens pre-exist; `animate-pulse` built-in; tooltip entrance-animation utilities dropped to avoid tailwindcss-animate plugin). **A3:** no existing-page wiring — no obvious low-risk drop-in need (marketing components already polished by the separate cozy-21st-mirror program; wiring risks unverifiable visual regression across 3 themes with no visual harness). **A4:** aware; `packages/ui` confirmed untouched. **Deps added:** 5 new Radix packages (avatar, checkbox, progress, scroll-area, switch, toggle, tooltip — 7 total incl. prior label/separator). **Gates:** `pnpm --filter web build` exit 0; full test suite 123/123 pass across 27 files (+12 new smoke tests in `apps/web/__tests__/ui-primitives.test.tsx`); type-check exit 0; E2 route-diff on studio/community/[username] EMPTY; `git status packages/ui` EMPTY. No deviations from plan.
- [x] 6. EVL — independent vc-tester re-run: all 5 gates green (build, route-regression diff empty, 123/123 tests, type-check exit 0, `packages/ui` untouched). No follow-up stubs required. Closeout classification: CLEAN.
- [x] 7. UPDATE PROCESS — phase report written (`phase-02-frontend-migration_REPORT_08-07-26.md`); A4 governance note carried to backlog (`packages-ui-cozy-attribution-gap_NOTE_09-07-26.md`); umbrella `## Current Execution State` rewritten; commit is the orchestrator's next step (not yet done as of this write).

---

## Resume and Execution Handoff

1. **Selected plan file path:** `process/features/21st-promotion/active/21st-promotion_08-07-26/phase-02-frontend-migration_PLAN_08-07-26.md`
2. **Last completed phase/step:** Step 5 (EXECUTE) — this update. All A1–A4 done; all Exit Gates green; no deviations. Phase is CODE DONE.
3. **Validate-contract status:** written (09-07-26) — see `## Validate Contract` below.
4. **Supporting context files loaded:** `process/context/all-context.md`, `process/context/tests/all-tests.md`, `process/features/21st-promotion/` full listing (via vc-plan-discovery), umbrella plan `21st-promotion-umbrella_PLAN_08-07-26.md`, Phase 1 backend-merge plan/report for prior-decision continuity.
5. **Next step for a fresh agent:** Spawn vc-tester for EVL confirmation run — Step 6. Re-run the validate-contract gate commands independently: `corepack pnpm --filter web build` (Exit-Gate-1), `git diff --stat -- apps/web/app/studio apps/web/app/community "apps/web/app/[username]"` must be empty (Exit-Gate-2), `corepack pnpm --filter web test` (Test-Gap-1 / regression, expect 123/123). Then UPDATE PROCESS writes the phase report (A4 governance note carried to backlog) and commits.

---

## Validate Contract

Status: CONDITIONAL
Date: 09-07-26
date: 2026-07-09
generated-by: inner-pvl: phase-2

Parallel strategy: sequential (single validate-agent synthesis; low signal count — single phase, low-risk, no schema/auth/API/billing surface, 5 blast-radius items)
Rationale: Signal score 1/7 (only S7-adjacent: blast radius includes a small number of TBD page files, but confirmed far under 5 concrete files). No coordination needed across dimension/section checks — all evidence gathered via direct file-system scouting in a single pass.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| Exit-Gate-1 | Ported primitives compile, Next.js build unaffected | Fully-Automated | `corepack pnpm --filter web build` exits 0 | A |
| Exit-Gate-2 | `studio/`, `community/`, `[username]/[component]` placeholder routes unchanged | Hybrid | Manual/agent-probe route diff: confirm `apps/web/app/studio/*`, `apps/web/app/community/*`, `apps/web/app/[username]/[component]/*` file contents are byte-identical pre/post EXECUTE (`git diff --stat` on those 3 paths shows no changes) | B |
| Exit-Gate-3 | A2 reconciliation performed, no duplicate primitive ported | Agent-Probe | Execute-agent's phase report includes the reconciliation table (source file → exists-already/port-needed → destination); reviewer confirms none of the 8 pre-identified duplicates (button, dialog, alert-dialog, dropdown-menu, input, textarea, tabs, table) were re-ported | A |
| Exit-Gate-4 | Governance note (A4) carried forward | Agent-Probe | Phase report contains the `packages/ui/src/cozy/*` attribution-gap note; `git status packages/ui --short` is empty (nothing modified) | A |
| Test-Gap-1 | New `apps/web/components/ui/` primitives render without runtime error | Agent-Probe | Manual/agent smoke check: for each newly ported primitive actually wired into a page (per A3), render the page in dev mode (or a minimal RTL test if time permits) and confirm no console error/thrown exception | B |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist / execute-agent instructions)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies (Fully-Automated / Hybrid / Agent-Probe). No Known-Gap row was needed — every developed behavior in this phase's blast radius has at least a Hybrid or Agent-Probe gate; the Test-Gap-1 row exists specifically so the new-primitives behavior does not rest on the Fully-Automated build gate alone (net-gate vacuous-green ban).

Legacy line form (retained for existing validate-contract consumers):
- UI primitive port: Fully-automated: `corepack pnpm --filter web build` | Hybrid: route-diff check on studio/community/[username] paths | Agent-probe: reconciliation table + governance note + new-primitive render smoke check | known-gap: none

Failing stub (Fully-Automated row only):
```
test("should compile and build with ported primitives included", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: corepack pnpm --filter web build exits 0 with new apps/web/components/ui/ primitives present")
})
```

Dimension findings:
- Infra fit: PASS — no container/proxy/gateway/runtime surface touched; confirmed `apps/web/tailwind.config.ts` has zero existing `animate`/keyframe entries, so A1 is additive-only.
- Test coverage: CONCERN (resolved inline) — no existing test asserts new `components/ui/` primitives render; added Test-Gap-1 Agent-Probe gate above rather than leaving it silent.
- Breaking changes: PASS — no schema/API/route contract changes; confirmed `apps/web/components/studio/` (Creator Studio program) and the 3 placeholder routes are outside this phase's Blast Radius, avoiding cross-program collision.
- Security surface: PASS — no auth/billing/secrets/trust-boundary surface touched; confirmed UI-primitive-only scope via file-level check.
- A1 (Scoped Tailwind merge): PASS — mechanically feasible; confirmed no existing `animate` config to collide with; exact classes still TBD at EXECUTE (appropriate, since primitive selection happens in A2 first).
- A2 (Inventory + reconciliation): CONCERN (resolved inline) — mechanically feasible; enumerated all 79 source files in `21st-dev/apps/web/components/ui/` and cross-referenced against root's `packages/ui/src/cozy/*` (4 files) + shadcn/mantine wrapper dirs (`buttons/`, `dialogs/`, `inputs/`, `tabs/`, `tables/`); found 8 near-certain duplicates by name (button, dialog, alert-dialog, dropdown-menu, input, textarea, tabs, table). Full candidate list attached as Execute-Agent Instruction E1 below so EXECUTE does not need to rediscover this from scratch.
- A3 (Narrow page/component integration): PASS — confirmed all 3 named placeholder route dirs exist untouched (8 files total) and are outside Blast Radius; additionally confirmed `apps/web/components/studio/` belongs to the concurrent Creator Studio program (not named in the original plan, but no collision risk since it's outside Blast Radius — added to the plan's OUT-OF-SCOPE list for clarity).
- A4 (Governance note): PASS — trivially feasible, no file mutation risk; `packages/ui/src/cozy/*` confirmed read-only reference only.

### Proposed Plan Updates (applied inline to the plan above)

| # | What changes | Where in plan | Why |
|---|---|---|---|
| P1 | Added `apps/web/components/studio/*` to the OUT OF SCOPE list | Decisions from INNOVATE, Implementation Checklist A3 | VALIDATE scouting found this is the concurrent Creator Studio program's surface; naming it explicitly prevents future confusion even though no collision currently exists |
| P2 | Added confirmation note to A1 that Tailwind config has zero existing animate/keyframe entries | Implementation Checklist A1 | Removes ambiguity about additive-vs-rewrite risk |
| P3 | Added pointer to Execute-Agent Instruction E1 (pre-enumerated duplicate list) | Implementation Checklist A2 | Saves EXECUTE from re-doing the file enumeration; specificity gap closed |
| P4 | Added Test-Gap-1 row to Verification Evidence table and Test Infra Improvement Notes | Verification Evidence, Test Infra Improvement Notes | Closes the render-correctness test gap found at VALIDATE |

### Execute-Agent Instructions

| # | Instruction | Trigger condition |
|---|---|---|
| E1 | When performing A2 reconciliation, treat these 8 files as PRE-CONFIRMED duplicates — do NOT port: `button.tsx` (exists: `packages/ui/src/cozy/button.tsx`, `packages/ui/src/buttons/{shadcn,mantine}-button.tsx`), `dialog.tsx` (exists: `packages/ui/src/cozy/dialog.tsx`, `packages/ui/src/dialogs/shadcn-dialog.tsx`), `alert-dialog.tsx` (exists: `packages/ui/src/dialogs/shadcn-alert-dialog.tsx`), `dropdown-menu.tsx` (exists: `packages/ui/src/cozy/dropdown-menu.tsx`), `input.tsx` (exists: `packages/ui/src/cozy/input.tsx`, `packages/ui/src/inputs/{shadcn,mantine}-input.tsx`), `textarea.tsx` (exists: `packages/ui/src/inputs/shadcn-textarea.tsx`), `tabs.tsx` (exists: `packages/ui/src/tabs/{shadcn,mantine}-tabs.tsx`), `table.tsx` (exists: `packages/ui/src/tables/{shadcn,mantine}-table.tsx`). Still run the reconciliation pass across the remaining ~71 files, applying the "genuinely missing AND genuinely needed for a drop-in visual upgrade" filter from A3 — many of the 21st-dev-app-specific files (e.g. `checkout-dialog.tsx`, `pricing-table.tsx`, `code-editor-dialog.tsx`, `brand-assets-menu.tsx`, `sandpack`-adjacent files) are likely NOT needed for a primitives-only polish port and should be excluded unless a concrete drop-in use is identified. | Section A2 entry |
| E2 | For the Hybrid Exit-Gate-2 (placeholder route regression), run `git diff --stat -- apps/web/app/studio apps/web/app/community "apps/web/app/[username]"` before declaring the phase done. Empty diff output = pass. If any of these paths show a diff, treat it as a Blocker per the plan's "Blockers That Would Justify BLOCKED Status" section — investigate before proceeding, since this phase must not modify those routes. | Exit Gate check, before phase report is written |
| E3 | For Test-Gap-1, after wiring any ported primitive into an existing page (per A3), do a manual dev-mode render check (or add a minimal RTL smoke test if time allows) for that page and note the result (pass/fail + any console errors) in the phase report under a `## New Primitive Render Verification` heading. This is Agent-Probe tier — judgment-based confirmation, not a full test suite requirement. | Whenever a ported primitive is actually wired into a page (A3) |

### Backlog Artifacts

| Artifact | Location | What it tracks |
|---|---|---|
| (carried forward from plan's own A4 item — not a new artifact created at VALIDATE) | UPDATE PROCESS will write this per A4 | `packages/ui/src/cozy/*` un-attributed 21st.dev replica primitives — governance/attribution gap in the strict-MIT-attribution curated package |

Open gaps: none blocking. Test-Gap-1 (new primitive render coverage) and Exit-Gate-2 (route regression check) were gaps found during VALIDATE and are now resolved as execute-agent instructions (E2, E3) with concrete commands/steps — not deferred as known-gaps.

What this coverage does NOT prove:
- `pnpm --filter web build` (Exit-Gate-1): proves compile success and route-tree completeness (confirmed via Phase 1 EVL precedent that this command asserts full route count as a side effect). Does NOT prove the ported primitives render correctly at runtime, are visually correct, or are accessible — that gap is covered by Test-Gap-1 (Agent-Probe, judgment-based, not exhaustive automated coverage).
- Exit-Gate-2 (route diff check): proves the 3 named placeholder route directories are byte-unchanged. Does NOT prove `apps/web/components/studio/` (Creator Studio program surface) is unaffected beyond a Blast Radius scope confirmation — that program's own validate-contract is the correct place for its regression coverage, not this phase's.
- Exit-Gate-3/4 (Agent-Probe reconciliation/governance checks): prove the reconciliation table and governance note exist and are internally consistent with the pre-enumerated E1 list. Does NOT prove exhaustive correctness of every one of the ~71 non-pre-confirmed files — EXECUTE applies judgment per E1's "genuinely needed" filter, which is inherently not mechanically verifiable.
- Test-Gap-1 (Agent-Probe render check): proves the specific primitives actually wired into pages (per A3) render without thrown errors in the checked scenario. Does NOT prove visual regression safety across all themes (Cozy Daylight / Lofi Dusk / Paper Café) or responsive breakpoints — no automated visual-regression harness exists in this repo (a known, pre-existing repo-wide gap, not specific to this phase).

Gate: CONDITIONAL (2 concerns noted — Test coverage dimension CONCERN and A2 specificity CONCERN — both resolved inline as execute-agent instructions E1 and E3, plus a new Hybrid gate E2; no genuine PVL supplement cycle required since neither concern required re-planning, only additive specificity and gate instructions)
Accepted by: session (autonomous, /goal execution) — accepted concerns: (1) no pre-existing test asserts new-primitive render correctness — mitigated via Test-Gap-1 Agent-Probe gate + E3 instruction rather than left silent; (2) A2 reconciliation table lacked a concrete pre-enumerated duplicate list — mitigated via E1 instruction attaching the full 8-file confirmed-duplicate list plus guidance for the remaining ~71 files.

---

## Autonomous Goal Block

(BRANCH B — umbrella plan with `## Stable Program Goal` exists at `process/features/21st-promotion/active/21st-promotion_08-07-26/21st-promotion-umbrella_PLAN_08-07-26.md`. Per BRANCH B rule, no phase-local goal block is written here. Reference for latest state: `process/features/21st-promotion/active/21st-promotion_08-07-26/21st-promotion-umbrella_PLAN_08-07-26.md`.)
