---
name: plan:supabase-interconnect-phase-04-navigation
description: "Supabase Interconnect — Phase 04: Navigation reconciliation (tab-vs-route conflicts, sidebar counts)"
date: 25-07-26
metadata:
  node_type: memory
  type: plan
  feature: supabase-interconnect
  phase: phase-04
---

# Phase 04 — Navigation Reconciliation

**Program:** supabase-interconnect
**Umbrella plan:** process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/supabase-interconnect-umbrella_PLAN_25-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-04-navigation_REPORT_{dd-mm-yy}.md (flat in the program task folder)
**Parallel-safe with:** Phase 5 (Billing unification) — disjoint file ownership, see umbrella `## Pre-PVL Conflict Resolution`

---

## Purpose

Make the main navigation tell the truth: keep the tab model canonical, make `/templates` a thin
redirect into `?tab=templates` (Fork D3), and fix sidebar category counts to read from a live
query. This phase MUST reconcile with, not duplicate or overwrite, the in-flight uncommitted
`useCategoryTagCounts()` work already touching `apps/web/lib/queries.ts` and
`sidebar-layout.tsx` — the orchestrator has already verified this session that the WIP diff does
NOT touch the navigation model (no `href`/`navigateToTab`/`?tab=`/`router.push` changes), so Fork
D3 is confirmed compatible; the WIP adds `useIsAdmin()` + `useCategoryTagCounts()` and hides
zero-count Explore items, and it already replaces the hardcoded `getTagDemosCount()` at
`lib/queries.ts:1098-1102` — this phase builds ON that WIP.

---

## Entry Gate

- Phase 1 exit gate passed (grants sane — sidebar count queries and any nav-adjacent Supabase reads
  must not hit 42501)
- Confirmed the uncommitted WIP diff in `sidebar-layout.tsx`/`queries.ts` does not conflict with
  this phase's navigation-model changes (already verified this session — re-confirm at RESEARCH
  time in case the WIP has changed since)

---

## Blast Radius

- `apps/web/hooks/use-navigation.ts` (nav model — tabs remain canonical)
- `apps/web/lib/atoms.ts` (if nav state is atom-backed)
- `apps/web/lib/navigation.ts` (hardcoded `demosCount`/`getTagDemosCount()` removal, reconciled with
  WIP `useCategoryTagCounts()`)
- `apps/web/components/features/main-page/sidebar-layout.tsx` (reconcile with WIP, do not duplicate)
- `apps/web/app/templates/` (new or modified — thin redirect page/route handler into
  `?tab=templates`)
- `apps/web/lib/queries.ts` (sidebar-count read paths only — coordinate with WIP, not a parallel
  reimplementation)
- Documentation-only: note `/public-dashboard` and `/import-old` as intentionally-unlinked internal
  routes (no code change required unless a decision is made to link them)
- **Conditional (added by PVL supplement):** `apps/web/components/features/home/home-layout.tsx`
  (lines 8, 226) — a live consumer of `getTagDemosCount()`/`lib/navigation.ts` `demosCount` values,
  discovered by VALIDATE. Only enters Blast Radius if Step D1a's decision is to migrate it to
  `useCategoryTagCounts()` in-phase; otherwise it stays untouched and out of scope (D1a option b).

---

## Implementation Checklist

### Step A — Reconcile with in-flight WIP

- [ ] A1. Re-read the current uncommitted diff in `sidebar-layout.tsx` and `queries.ts` at RESEARCH
      time — confirm it still only adds `useIsAdmin()` + `useCategoryTagCounts()` and hides
      zero-count Explore items, with no `href`/`navigateToTab`/`?tab=`/`router.push` changes. If the
      WIP has materially changed since this session's verification, re-verify D3 compatibility
      before proceeding.
- [ ] A2. Build this phase's sidebar-count fix on top of the WIP's `useCategoryTagCounts()` hook —
      do not write a second, competing count-fetching mechanism.

### Step B — `/templates` reconciliation (Fork D3)

- [ ] B1. Confirm `/templates` is a real, working page today (per SPEC Gap 3 — "real page, but nav
      sends `?tab=templates` instead").
- [ ] B1a. Before implementing B2, decide and document (in the phase report) how `/templates`'s
      existing SEO metadata export (`apps/web/app/templates/page.tsx:8-27` — title, description,
      keywords, OpenGraph) is preserved or intentionally sacrificed by the redirect. Choose one:
      (a) keep a server-side redirect but retain a `metadata` export with a
      `<link rel="canonical">` pointing at `/?tab=templates`, (b) move equivalent metadata onto the
      home page's `?tab=templates` render path via dynamic `generateMetadata` keyed on the `tab`
      search param, or (c) accept the SEO regression explicitly with recorded rationale. Do not
      implement B2 until one of these three is chosen and recorded (see Execute-Agent Instruction
      E2, which this item now makes an explicit checklist gate rather than only an instruction).
- [ ] B2. Convert `/templates` into a thin redirect (server-side redirect — not client-only
      `router.replace`, so crawlers and the a11y spec both see a single clean redirect and B1a's
      chosen mitigation is preserved) into `/?tab=templates`, so the tab model stays canonical and
      the standalone route no longer disagrees with the nav item's actual destination.
- [ ] B3. Confirm the nav item itself already points at `?tab=templates` (per `use-navigation.ts:96-105`
      → `navigateToTab()`) — no change needed on the nav-item side, only the route side.

### Step C — Document orphaned routes (no redirect)

- [ ] C1. Document `/public-dashboard` and `/import-old` explicitly as intentionally-unlinked
      internal/admin routes — add a short code comment at each route's entry point stating this, and
      note it in the phase report. Do not redirect or delete them (Fork D3 explicitly rejects
      promoting them to nav or silently orphaning them further).
- [ ] C1a (optional, non-blocking). Add a lightweight mechanical assertion confirming the
      orphan-route comments exist and persist — e.g. a one-line grep-based test, or extending
      `e2e/a11y.spec.ts`'s existing route-list assertions to check for the comment marker text at
      `/public-dashboard` and `/import-old`. This makes SPEC AC9's "regression check" language
      literal rather than only documentation-based. Skip if judged disproportionate at EXECUTE time;
      note the decision either way in the phase report (see Execute-Agent Instruction E3).
- [ ] C2. Confirm `/c/[collection_slug]` and `/maintenance` remain correctly wired (per SPEC Gap 3 —
      already confirmed, no action needed, just re-verify no regression).

### Step D — Sidebar counts

- [ ] D1. Confirm `useCategoryTagCounts()` (WIP) queries `demo_tags`/`component_tags` live, per SPEC
      AC4's requirement.
- [ ] D1a. Before applying D2, grep for all remaining call sites of `getTagDemosCount` and any
      reader of `lib/navigation.ts`'s `demosCount` field. Confirmed at VALIDATE time:
      `apps/web/components/features/home/home-layout.tsx:8,226` is a live, in-scope consumer
      (unrelated tag-slider "view all" counts, zero test coverage on that file). Choose one: (a)
      migrate `home-layout.tsx` to `useCategoryTagCounts()` within this same phase and add it to
      Blast Radius (note the addition in the phase report), or (b) retain `getTagDemosCount()`/the
      `demosCount` field values in `lib/navigation.ts` for `home-layout.tsx`'s sake and scope D2
      down to "confirmed the sidebar no longer depends on them" only. Do not remove the function or
      field values unless (a) is chosen (see Execute-Agent Instruction E1, which this item now
      makes an explicit checklist gate).
- [ ] D2. Remove the hardcoded `demosCount` values from `lib/navigation.ts` and the
      `getTagDemosCount()` call at `queries.ts:1098-1102` once the WIP hook fully supersedes them —
      confirm no other consumer still depends on the hardcoded values before removing (per D1a's
      decision).
- [ ] D3. Write/extend a component test asserting the sidebar renders counts from the live-query
      hook, not the hardcoded values (following the existing landing-page test pattern per SPEC
      AC4 `proven by:` note).

---

## Exit Gate

```bash
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: all tests pass including new sidebar-count assertion, no regression

corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts
# Expected: extended route-reachability check (or new spec) confirms every nav-declared
# destination resolves to expected page content, including /templates redirect
```

- All Step A-D checklist items checked
- Every main-nav item resolves to exactly one destination (SPEC AC9)
- Sidebar counts render from a live-query hook (SPEC AC4)
- WIP is built upon, not duplicated or clobbered
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- The in-flight WIP has materially diverged from this session's verified state and now DOES touch
  the navigation model in a way that conflicts with Fork D3 — route back to INNOVATE for a fresh
  fork decision rather than proceeding on a stale assumption.
- Phase 1 exit gate not yet passed and sidebar-count queries hit 42501 — blocked on Phase 1.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: re-verify WIP diff state; read Phase 1 report; test context loaded
- [ ] 2. INNOVATE — innovate-agent: confirm Fork D3 still holds given current WIP state; Decision Summary written
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` — Gate: CONDITIONAL (first pass, 0 fix cycles) — SUPPLEMENT REQUEST emitted, orchestrator must run one plan-validate-fix cycle before EXECUTE
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first.

---

## Touchpoints

- `apps/web/hooks/use-navigation.ts`
- `apps/web/lib/atoms.ts`
- `apps/web/lib/navigation.ts`
- `apps/web/components/features/main-page/sidebar-layout.tsx`
- `apps/web/app/templates/`
- `apps/web/lib/queries.ts` (sidebar-count reads only)

---

## Public Contracts

- Nav item hrefs/route destinations are the user-facing contract being fixed — `/templates`'s
  redirect target changes from "a disagreeing standalone page" to "the canonical tab view," which
  is the intended behavior change, not a regression.
- No API route contracts change.
- **Added by VALIDATE (V2 finding, not in original plan):** `/templates` currently exports
  page-specific SEO metadata (`generateMetadata`-style static export: title "shadcn/ui Templates
  Collection", description, keywords, OpenGraph) via `apps/web/app/templates/page.tsx:8-27`. A
  redirect target is a public SEO contract too — converting the route to a redirect without a
  stated mitigation silently drops this metadata for crawlers. See Execute-Agent Instruction E2.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| Route-reachability check across all nav-declared destinations | Fully-Automated (Playwright) | AC9 |
| Sidebar renders counts from live-query hook (component test) | Fully-Automated (vitest/RTL) | AC4 |
| `/public-dashboard`, `/import-old` documented as intentional | Hybrid (doc + code comment review) | AC9 |
| WIP reconciliation confirmed (no duplication) | Agent-Probe (code review) | AC4, AC9 |

```bash
corepack pnpm --filter web test
corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-04-navigation_PLAN_25-07-26.md`
- Last completed step: V1-V7 VALIDATE pass complete (outer PVL) — Gate: CONDITIONAL, first pass
- Validate-contract status: written (CONDITIONAL) — requires one plan-validate-fix supplement cycle before EXECUTE
- Next step: Orchestrator routes SUPPLEMENT REQUEST (below) to vc-plan-agent (PVL-supplement mode), then re-spawns vc-validate-agent from V1

---

## Test Infra Improvement Notes

- `apps/web/components/features/home/home-layout.tsx` has **zero test coverage** today (confirmed:
  no `*.test.*` file references `home-layout` or `getTagDemosCount` anywhere in the repo). This
  phase's Step D changes touch a function (`getTagDemosCount()`/`lib/navigation.ts` `demosCount`
  values) that `home-layout.tsx` depends on for its own (unrelated) tag-slider "view all" counts.
  Recommend adding minimal coverage for `home-layout.tsx`'s `sliderGroups` count derivation as a
  follow-up, independent of this phase.

---

## Validate Contract

Status: CONDITIONAL
Date: 25-07-26
date: 2026-07-25
generated-by: outer-pvl

Parallel strategy: sequential
Rationale: Single self-contained phase plan, one validate-agent instance, no cross-agent
communication needed for this PVL pass (Layer 1/Layer 2 findings synthesized directly by one
agent — signal count 1/7: only S7 marginally applies at 6 blast-radius files, below the 3+
threshold for parallel fan-out).

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC4 | Sidebar renders live category tag counts from `useCategoryTagCounts()`, not hardcoded `demosCount` | Fully-Automated | `corepack pnpm --filter web exec vitest run components/features/main-page/__tests__/sidebar-layout.test.tsx` (extend with a case asserting a non-zero `tagCounts` entry renders as the item's count) | B |
| AC9 (nav resolution) | Every main-nav item resolves to exactly one destination; `/templates` redirects into `?tab=templates` | Fully-Automated | `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` (extend `auditRoute`/route list to assert `/templates` resolves to the `?tab=templates` view, not a distinct page) | B |
| AC9 (orphans documented) | `/public-dashboard`, `/import-old` documented as intentionally-unlinked internal routes | Hybrid | Code comment at each route's entry point + phase-report review; precondition: reviewer manually confirms comment text at both files | B |
| AC4/AC9 (WIP reconciliation) | Phase 4 builds on WIP `useCategoryTagCounts()` rather than duplicating it | Agent-Probe | Code review during EXECUTE confirming no second count-fetching mechanism was introduced; `git diff` shows only 1 hook definition | A |
| (regression guard, VALIDATE finding) | `home-layout.tsx`'s `getTagDemosCount()`-derived tag-slider counts do not silently regress to 0 when `lib/navigation.ts` `demosCount` values are touched by Step D2 | Hybrid | `corepack pnpm --filter web test` — no existing test covers `home-layout.tsx`; precondition: execute-agent manually confirms (per Execute-Agent Instruction E1) that `getTagDemosCount()`/`demosCount` are retained for `home-layout.tsx`'s sake before Step D2 is applied | D |
| (SEO regression guard, VALIDATE finding) | `/templates`'s existing SEO metadata (title/description/OG/keywords) is not silently dropped by the Step B2 redirect | Agent-Probe | Manual review during EXECUTE per Execute-Agent Instruction E2 — no automated SEO-crawl test exists in this repo | D |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist, via Step D3/B2/C1 or the
  plan-validate-fix supplement this CONDITIONAL gate requires)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue) — both D-rows above are
  resolved for THIS pass via Execute-Agent Instructions (manual guardrail) rather than a new
  automated test, because the underlying files (`home-layout.tsx`, `/templates` SEO crawl) sit
  outside this phase's Blast Radius and adding real automated coverage for them is out of scope.

Legacy line form (retained so existing validate-contract consumers still parse):
- Sidebar counts: Fully-automated: `corepack pnpm --filter web exec vitest run components/features/main-page/__tests__/sidebar-layout.test.tsx` (extended)
- Nav route resolution: Fully-automated: `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` (extended)
- Orphaned routes: hybrid: code comment + phase-report review, precondition: manual reviewer confirmation
- WIP reconciliation: agent-probe: code review during EXECUTE, no second count-fetch mechanism introduced
- home-layout.tsx count regression: known-gap: documented as Execute-Agent Instruction E1 (no automated test exists for home-layout.tsx; out of Blast Radius)
- /templates SEO metadata loss: known-gap: documented as Execute-Agent Instruction E2 (no automated SEO-crawl test exists in this repo)

Dimension findings:
- Infra fit: PASS — all Blast Radius file paths confirmed to exist on disk (`use-navigation.ts`,
  `atoms.ts`, `navigation.ts`, `sidebar-layout.tsx`, `app/templates/page.tsx`, `queries.ts`). No
  container/infra/runtime surface touched. `demo_tags` and `component_tags` (the two tables
  `useCategoryTagCounts()` reads) are ALREADY in the confirmed 14-relation authenticated grant
  baseline (per SPEC Background) — this phase's count-query mechanism does not actually require
  Phase 1's grant fix to function, reducing the practical risk of the stated Phase 1 dependency
  (kept as a conservative Entry Gate per the umbrella's join conditions, not loosened here).
- Test coverage: CONCERN — AC4/AC9's primary gates are Fully-Automated and well-targeted (extending
  two files that already exist and already pass: `sidebar-layout.test.tsx` — 3/3 passing baseline
  confirmed this session — and `e2e/a11y.spec.ts`). The gap is in the two VALIDATE-discovered
  regression surfaces (home-layout.tsx, /templates SEO) which have zero test coverage and sit
  outside Blast Radius — see Execute-Agent Instructions E1/E2 for the accepted mitigation.
- Breaking changes: CONCERN — `/templates`'s dedicated SEO metadata export
  (`apps/web/app/templates/page.tsx:8-27`) is a public contract not listed in the original plan's
  Public Contracts section; converting the route to a redirect risks silently dropping it for
  crawlers. Added to Public Contracts above; mitigation is Execute-Agent Instruction E2.
- Security surface: PASS — no auth, billing, schema, or secret-handling surface touched by this
  phase.
- Section A (WIP reconciliation): PASS — mechanical feasibility confirmed by direct file read:
  `git status --short` on the 3 claimed WIP files (`sidebar-layout.tsx`, `sidebar-layout.test.tsx`,
  `queries.ts`) matches exactly; `sidebar-layout.tsx` calls `useCategoryTagCounts()` (not
  `getTagDemosCount()`); no `href`/`navigateToTab`/`?tab=`/`router.push` changes found in the WIP
  diff scope. No conflicts found. Highest-risk edit: none — this step is read/confirm only.
- Section B (`/templates` reconciliation): CONCERN — mechanically feasible (a server-side redirect
  via `next/navigation`'s `redirect()` is a standard, low-risk implementation, and Playwright's
  `page.goto()` + `waitForLoadState("networkidle")` in `e2e/a11y.spec.ts` will correctly follow a
  server-side redirect before auditing, so the existing test is NOT expected to break — only to
  start auditing the destination content, which is the intended behavior). Gap found: SEO metadata
  loss (see Breaking changes above) is unaddressed by the checklist. No conflicts found beyond that
  gap. Highest-risk edit + mitigation: B2's redirect implementation — mitigate by using a
  server-side `redirect()` (not a client-only `router.replace`) so crawlers and the a11y spec both
  see a single clean redirect, and apply Execute-Agent Instruction E2 for the metadata question.
- Section C (orphaned routes documentation): CONCERN (minor) — mechanically feasible (a code
  comment is trivial to add at both `apps/web/app/public-dashboard/page.tsx` and
  `apps/web/app/import-old/page.tsx`). Confirmed genuinely zero non-test inbound references to
  `/import-old`; `/public-dashboard` has zero UI-navigation inbound links but IS referenced by
  `e2e/a11y.spec.ts` and `e2e/visual-evidence.spec.ts` (test-only, consistent with "orphaned from
  nav" framing). Gap found: SPEC AC9's `proven by:` note asks for "a regression check," and a bare
  code comment has no verifiable regression signal (nothing fails if it's later deleted). Highest-
  risk edit + mitigation: none high-risk; low-severity gap, mitigated via Execute-Agent Instruction
  E3 (optional, non-blocking).
- Section D (sidebar counts): CONCERN — mechanically feasible; `D1`/`D3` are straightforward given
  the WIP already implements `useCategoryTagCounts()` and `sidebar-layout.test.tsx` already mocks
  it. Gap found: `D2`'s instruction to "confirm no other consumer still depends on the hardcoded
  values before removing" is correct in spirit but the plan's own Blast Radius does not list the
  consumer VALIDATE found: `apps/web/components/features/home/home-layout.tsx:8,226` calls
  `getTagDemosCount(category.id)` for its own (unrelated) tag-slider "view all" counts, reading the
  same `lib/navigation.ts` `demosCount` values D2 proposes to remove. If D2 is applied literally
  (remove the hardcoded values), `home-layout.tsx`'s counts silently regress to 0 with no test to
  catch it (zero test coverage on that file, confirmed by search). Highest-risk edit + mitigation:
  D2 is the single highest-risk edit in this phase — mitigate via Execute-Agent Instruction E1
  (retain `getTagDemosCount()`/`demosCount` for `home-layout.tsx`'s sake; only remove the
  now-already-absent sidebar dependency, i.e. treat D2 as effectively already satisfied for the
  sidebar and do not touch `lib/navigation.ts`'s `demosCount` field values or the exported
  `getTagDemosCount()` function itself unless `home-layout.tsx` is also migrated within this
  phase's scope).

What this coverage does NOT prove:
- The Fully-Automated sidebar-count test proves the component renders `tagCounts` values when
  present — it does NOT prove the live Supabase query itself returns correct counts against
  production data (that requires a live/seeded DB, out of this phase's automation boundary per the
  SPEC's Cross-Cutting Requirement).
- The Fully-Automated route-reachability test proves `/templates` resolves to expected page
  content — it does NOT prove search-engine crawlers will index the redirect target with
  equivalent SEO value to the current dedicated page (no crawl-simulation harness exists in this
  repo).
- The Hybrid orphan-route documentation gate proves a comment exists at review time — it does NOT
  prove the comment will be preserved on future edits (no automated enforcement).
- The Agent-Probe WIP-reconciliation review proves no duplicate mechanism exists at EXECUTE time —
  it does NOT prove no future PR reintroduces a second count-fetch path (no lint rule enforces
  this).
- The Hybrid `home-layout.tsx` regression guard proves a human/execute-agent manually checked the
  dependency before touching `lib/navigation.ts` — it does NOT prove automated regression coverage
  exists for `home-layout.tsx` going forward (Test Infra Improvement Note above tracks this gap).

Execute-Agent Instructions (apply during EXECUTE regardless of which plan-validate-fix supplement
cycle folds these into the checklist text):
- E1. Before applying Step D2, grep for all remaining call sites of `getTagDemosCount` and any
  reader of `lib/navigation.ts`'s `demosCount` field. Confirmed today: `home-layout.tsx:8,226` is a
  live, in-scope consumer. Do NOT delete `getTagDemosCount()` or the `demosCount` field values
  unless `home-layout.tsx` is migrated to a live-count source within this same phase (out of the
  current Blast Radius — if migrating it, add it to Blast Radius and note the addition in the
  phase report; if not migrating it, leave the function and hardcoded values in place and scope D2
  down to "confirmed sidebar no longer depends on them" only).
- E2. Before applying Step B2, decide and document (in the phase report) how `/templates`'s
  existing SEO metadata (`page.tsx:8-27` — title, description, keywords, OpenGraph) is preserved
  or intentionally sacrificed: options are (a) keep a server-side redirect but retain the
  `metadata` export with a `<link rel="canonical">` pointing at `/?tab=templates`, (b) move the
  equivalent metadata onto the home page's `?tab=templates` render path via dynamic
  `generateMetadata` keyed on the `tab` search param, or (c) accept the SEO regression explicitly
  as a documented trade-off with rationale. Do not implement B2 silently without one of these three
  being chosen and recorded.
- E3 (optional, non-blocking). When applying Step C1, consider adding a trivial assertion (e.g. a
  one-line grep check in a test, or extending `e2e/a11y.spec.ts`'s existing route list assertions)
  that the orphan-route comment text is present, so SPEC AC9's "regression check" language is
  literally satisfied rather than only documented. Skip if judged disproportionate; note the
  decision either way in the phase report.

Backlog Artifacts: none required this cycle — E1/E2/E3 are resolved as Execute-Agent Instructions,
not deferred to backlog, because they are actionable within this phase's own EXECUTE step.

Known gaps: none pre-classified via a `## Known Gaps (Resolved via Backlog)` section in this plan
(no such section exists) — see the two `D`-gap-resolution rows above (home-layout.tsx regression
guard, /templates SEO regression guard), which are carried as Hybrid/Agent-Probe manual gates via
Execute-Agent Instructions E1/E2, not silent known-gaps.

Gate: CONDITIONAL (first pass, 0 prior plan-validate-fix cycles — per protocol this is NOT
terminal; requires one plan-validate-fix supplement cycle before EXECUTE unless the orchestrator
explicitly accepts these concerns as resolved via the Execute-Agent Instructions above without a
plan-text rewrite)
Accepted by: session (autonomous, /goal execution) — concerns E1/E2/E3 above are structured as
Execute-Agent Instructions rather than blocking FAILs; net gate is CONDITIONAL because 3 CONCERNs
(0 FAILs) were found and the phase's Blast Radius does not yet list the two files VALIDATE found
as coupled to this phase's changes (`home-layout.tsx`, `/templates` metadata regression).

---

## SUPPLEMENT REQUEST (for orchestrator routing — see V7)

- Gap 1: Section: implementation-checklist (Step D — Sidebar counts) | Concern: `home-layout.tsx`
  (outside Blast Radius) depends on `getTagDemosCount()`/`lib/navigation.ts` `demosCount` values;
  Step D2 as written risks silently breaking `home-layout.tsx`'s tag-slider counts if the function
  and field values are removed. | Severity: CONCERN | Suggested addition: add a checklist item
  under Step D confirming `getTagDemosCount()`/`demosCount` are retained for `home-layout.tsx`'s
  sake (or add `home-layout.tsx` to Blast Radius and migrate it in-phase).
- Gap 2: Section: implementation-checklist (Step B — `/templates` reconciliation) | Concern:
  Converting `/templates` into a redirect discards its dedicated SEO metadata export with no
  stated mitigation. | Severity: CONCERN | Suggested addition: add a checklist item requiring an
  explicit SEO-preservation decision (canonical tag, migrated metadata, or documented trade-off)
  before B2 is implemented.
- Gap 3: Section: implementation-checklist (Step C — Document orphaned routes) | Concern: SPEC
  AC9's "regression check" language is stronger than the checklist's bare code-comment mitigation.
  | Severity: CONCERN (minor, non-blocking) | Suggested addition: optionally add a one-line
  assertion (grep-based or extended a11y spec check) confirming the orphan-route comments exist.
