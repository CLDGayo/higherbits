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

**Scope-honesty note (added by inner-loop supplement, 26-07-26):** SPEC AC4 ("sidebar counts are
live-queried") is ALREADY IMPLEMENTED by committed work — `useCategoryTagCounts()` at
`apps/web/lib/queries.ts:1105-1142`, wired at `sidebar-layout.tsx:181` (commit `813ab13`). The
remaining Phase 4 work is genuinely small: one redirect, one metadata function, two documentation
comments, one test assertion, and several confirm-only checklist items. This phase is not padded
work — the checklist below is intentionally short because most of AC4 is already done.

**Content divergence (RESEARCH finding, folded in 26-07-26):** `/templates` today renders
`TemplatesListSEO` (via RPC `get_templates_v3`, article-style static list) while `?tab=templates`
renders `FilterChips` + `TemplatesContainer` (interactive, filterable). These are two different
components reaching a similar destination, not one component reached two ways — so Step B's
redirect unifies to the tab implementation and retires `TemplatesListSEO` as a rendered surface
(its SEO metadata is separately preserved per the locked decision in Step B1a below).

**Admin-only visibility (context, not scope; folded in 26-07-26):** `sidebar-layout.tsx:349-357`
gates the Templates/Bundles/Pro nav items behind `isAdmin`. Non-admin visitors never see a
Templates nav item today, so the tab-vs-route reconciliation in this phase primarily benefits
admins plus anyone arriving at `/templates` by deep link or crawler. This is documented context
only — this phase does not change the `isAdmin` gating.

---

## Entry Gate

- **Grant-dependency correction (added 26-07-26):** `demo_tags` and `component_tags` — the only two
  tables `useCategoryTagCounts()` reads — are ALREADY in the live 14-relation authenticated grant
  baseline confirmed by Phase 1's research. This phase does **not** require Phase 1's live SQL
  apply to function. The line below is retained only as a conservative statement covering any
  *other* nav-adjacent Supabase read this phase might touch — it is not a hard blocking dependency
  on Phase 1's pending live apply.
- Phase 1 exit gate passed (grants sane — any *other* nav-adjacent Supabase reads beyond
  `demo_tags`/`component_tags` must not hit 42501)
- **Corrected staleness note (26-07-26):** the line below previously described the
  `useCategoryTagCounts()` work as in-flight uncommitted WIP requiring re-verification. It is now
  committed (`813ab13`) and all five blast-radius files listed in this plan are clean per
  `git status --short`. Confirm the committed implementation still matches this description
  (rather than re-reading an uncommitted diff that no longer exists).
- Confirmed the (now-committed) `useCategoryTagCounts()` work in `sidebar-layout.tsx`/`queries.ts`
  does not conflict with this phase's navigation-model changes (already verified this session —
  re-confirm at RESEARCH time in case the tree has changed since)

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

- [ ] A1. **Reworded 26-07-26 (was stale — described committed work as uncommitted WIP):** confirm
      the committed implementation in `sidebar-layout.tsx` and `queries.ts` (commit `813ab13`) still
      matches this plan's description — it adds `useIsAdmin()` + `useCategoryTagCounts()` and hides
      zero-count Explore items, with no `href`/`navigateToTab`/`?tab=`/`router.push` changes. If the
      tree has materially changed since this session's verification, re-verify D3 compatibility
      before proceeding.
- [ ] A2. Build this phase's sidebar-count fix on top of the WIP's `useCategoryTagCounts()` hook —
      do not write a second, competing count-fetching mechanism.

### Step B — `/templates` reconciliation (Fork D3)

- [ ] B1. Confirm `/templates` is a real, working page today (per SPEC Gap 3 — "real page, but nav
      sends `?tab=templates` instead").
- [ ] B1a. **LOCKED DECISION (INNOVATE, 26-07-26) — supersedes the prior open (a)/(b)/(c) choice.**
      Use option (b): move `/templates`'s existing SEO metadata onto the home route via a
      `generateMetadata({ searchParams })` export on `apps/web/app/page.tsx`, returning the existing
      `apps/web/app/templates/page.tsx:8-27` title/description/keywords/OpenGraph object when
      `searchParams.tab === "templates"`.
      **Why option (a) — "keep a `metadata` export + `<link rel="canonical">` on `/templates`
      itself" — is rejected:** a page that calls `redirect()`/`permanentRedirect()` returns a 3xx
      response with no body, so its `metadata` export is never serialized into HTML any crawler
      sees. That option is a no-op that only resembles a fix — the metadata would be dead code.
      **Why option (c) — "accept the SEO regression" — is rejected:** a working alternative (b)
      exists at negligible cost, so accepting a regression is unnecessary.
      **Pre-check (EXECUTE must confirm before implementing, per INNOVATE):** `apps/web/app/page.tsx`
      already exports a `generateMetadata` async function (confirmed via `graphify query` +
      direct read, 26-07-26, lines 10-12) that coexists today with the route's client-heavy
      rendering (`HomePageClient`) — so hosting a second, `searchParams`-aware branch on the same
      export is structurally feasible without restructuring the route. EXECUTE must still verify
      this holds at implementation time; if it cannot without restructuring, that is a real finding
      to report rather than a redesign to improvise.
- [ ] B2. **LOCKED DECISION (INNOVATE, 26-07-26):** convert `/templates` into a thin redirect using
      `permanentRedirect()` (308, from `next/navigation`) — NOT `redirect()` (307) and NOT
      client-only `router.replace` — into `/?tab=templates`. 308 is the correct crawler signal
      because this merge is permanent, not temporary; a 307 would tell crawlers to keep re-checking
      `/templates` indefinitely. Server-side redirect (either status) ensures crawlers and the a11y
      spec both see a single clean redirect and B1a's `generateMetadata` mitigation is preserved.
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
- [ ] D1a. **LOCKED DECISION (INNOVATE, 26-07-26) — supersedes the prior open (a)/(b) choice.**
      RETAIN `getTagDemosCount()` and `lib/navigation.ts`'s `demosCount` field values — do NOT
      migrate `home-layout.tsx` to `useCategoryTagCounts()` in this phase. `home-layout.tsx:226`
      uses `getTagDemosCount(category.id)` for a per-category slider "view all" total-count badge —
      a genuinely different UI surface from the sidebar's category-count list (a slider badge vs. a
      sidebar list item), not duplication of the same feature. Migrating it is out of this phase's
      scope. Scope D2 down to "confirm the sidebar no longer depends on the hardcoded values"; do
      not remove the function or the field values. (Confirmed at VALIDATE time:
      `apps/web/components/features/home/home-layout.tsx:8,226` is the live, in-scope consumer;
      zero test coverage on that file today — see Test Infra Improvement Notes.)
- [x] D2. **Corrected 29-07-26 (UPDATE PROCESS) — this bullet previously read "Remove the hardcoded
      `demosCount` values from `lib/navigation.ts` and the `getTagDemosCount()` call...", which
      directly contradicted D1a's locked RETAIN decision immediately above and Execute-Agent
      Instruction E1.** EXECUTE correctly followed D1a/E1 (retain, confirm-only) and reported this
      contradiction in its phase report rather than executing the literal "remove" text — no bug
      resulted, but a future reader executing D2 literally would have deleted
      `getTagDemosCount()`/`demosCount`, breaking `home-layout.tsx:226`'s per-category slider "view
      all" count badge. Corrected wording (confirm-only, matches what was actually done): Confirm
      the sidebar (`sidebar-layout.tsx`) no longer depends on `lib/navigation.ts`'s hardcoded
      `demosCount` values or `getTagDemosCount()` (`queries.ts:1098-1102`) — confirmed via `rg`,
      zero hits in `sidebar-layout.tsx`. RETAIN both the function and the field values (per D1a) for
      `home-layout.tsx`'s slider badge; do not remove them.
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

- [x] 1. RESEARCH — confirmed `useCategoryTagCounts()` work is committed (`813ab13`), not WIP;
      found content-divergence (`TemplatesListSEO` vs `FilterChips`/`TemplatesContainer`) and
      admin-only nav gating context; confirmed `apps/web/app/page.tsx` already hosts a
      `generateMetadata` export compatible with client-heavy rendering; Phase 1 report re-read.
- [x] 2. INNOVATE — locked 3 decisions: B1a → option (b) dynamic `generateMetadata({searchParams})`
      on the home route (rejecting (a) dead-metadata-on-redirect and (c) accept-regression); B2 →
      `permanentRedirect()` 308 not `redirect()` 307; D1a → retain `getTagDemosCount()`/`demosCount`
      for `home-layout.tsx`, scope D2 to confirm-only. Decision Summary folded into Purpose/Step B/
      Step D checklist text directly (no separate decision-summary doc for this small supplement).
- [x] 3. PLAN-SUPPLEMENT — this inner-loop cycle: 7 RESEARCH/INNOVATE findings folded into Purpose,
      Entry Gate, Step A1, Step B1a, Step B2, Step D1a, and Public Contracts; Inner Loop Refresh
      Note written below (dated 26-07-26, newer than the existing 25-07-26 validate-contract) to
      force PVL re-run from V1.
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` — Gate: CONDITIONAL (first pass, 0 fix cycles) — SUPPLEMENT REQUEST emitted, orchestrator must run one plan-validate-fix cycle before EXECUTE
- [x] 5. EXECUTE — all checklist items done (A-D + E1-E4); `tsc --noEmit` 0 errors; vitest 82/82
      across 21 files (baseline 73/18, +9 new, zero regressions); 3 new assertions mutation-tested
      to confirm non-vacuous. See `phase-04-navigation_REPORT_26-07-26.md`.
- [x] 6. EVL — independent gate re-run confirmed green (`results.tsv`: `1 phase-04-evl tests 0 0
      PASS HALTED_SUCCESS 2026-07-26`); no follow-up plan stubs required — all Execute-Agent
      Instructions (E1-E4) resolved in-phase. Test Infra Gaps (wire-level 308 unprovable — Clerk dev
      keys absent; 58 foreign color-contrast violations on `/?tab=templates`; no pre-change e2e
      baseline) carried to backlog, not blocking.
- [x] 7. UPDATE PROCESS — phase report finalized, umbrella `## Current Execution State` rewritten,
      context docs updated, backlog note written, D2 wording corrected above. Classification: Keep
      in active/testing (code-complete, both automated gates green; e2e/a11y baseline debt and
      wire-level-308 proof are the residual gaps, tracked in backlog — not implementation defects).

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
- **Locked decision (INNOVATE, 26-07-26):** the redirect's HTTP status code is a public contract
  detail in its own right — `/templates` will respond with **308 Permanent Redirect**
  (`permanentRedirect()`), not 307, signaling to crawlers and any external caller that the merge is
  permanent. See Step B2 for the full rationale.
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
- Last completed step: PLAN-SUPPLEMENT (inner loop, 26-07-26) — 7 RESEARCH/INNOVATE findings folded
  in; 3 locked decisions replace prior open (a)/(b)/(c) choices; Inner Loop Refresh Note written
- Validate-contract status: SUPERSEDED pending re-validation — the existing `date: 2026-07-25`
  contract is now stale relative to the 26-07-26 Inner Loop Refresh Note; do NOT treat it as current
- Next step: orchestrator spawns vc-validate-agent for a full PVL re-run from V1 (NOT execute) —
  V1 will detect the newer Inner Loop Refresh Note and proceed to V2 fan-out rather than
  early-exiting on the old contract

---

## Test Infra Improvement Notes

- `apps/web/components/features/home/home-layout.tsx` has **zero test coverage** today (confirmed:
  no `*.test.*` file references `home-layout` or `getTagDemosCount` anywhere in the repo). This
  phase's Step D changes touch a function (`getTagDemosCount()`/`lib/navigation.ts` `demosCount`
  values) that `home-layout.tsx` depends on for its own (unrelated) tag-slider "view all" counts.
  Recommend adding minimal coverage for `home-layout.tsx`'s `sliderGroups` count derivation as a
  follow-up, independent of this phase.

---

## Inner Loop Refresh Note

Date: 26-07-26 (newer than the existing validate-contract's `date: 2026-07-25` — this triggers the
mechanical Step 4b re-validation check; PVL must re-run from V1 before EXECUTE).

Sections changed this cycle: Purpose (scope-honesty note, content-divergence note, admin-only
visibility note), Entry Gate (grant-dependency correction, staleness correction), Step A1
(reworded from "uncommitted diff" to "confirm committed implementation"), Step B1a (locked to
option (b) + EXECUTE pre-check), Step B2 (locked to `permanentRedirect()` 308), Step D1a (locked to
retain-and-scope-down), Public Contracts (308 status code recorded as locked decision), Phase Loop
Progress (Steps 1-3 ticked with summaries).

Reason for re-run: 3 of the 3 original CONDITIONAL-gate CONCERNs (B1a SEO mitigation, D1a
home-layout.tsx regression risk) are now resolved by locked decisions rather than open
Execute-Agent Instructions alone — vc-validate-agent should re-check whether these locked decisions
close the corresponding SUPPLEMENT REQUEST gaps (Gap 1 and Gap 2) or whether residual concerns
remain. Gap 3 (orphan-route regression check, minor/non-blocking) is unchanged by this cycle.


## Validate Contract

Status: CONDITIONAL
Date: 26-07-26
date: 2026-07-26
generated-by: inner-pvl: phase-4
supersedes: 2026-07-25 (outer-pvl) — inner PVL re-run triggered by the 26-07-26 Inner Loop Refresh
Note; RESEARCH+INNOVATE+PLAN-SUPPLEMENT ran since the superseded contract and locked 3 decisions
(B1a, B2, D1a) that substantively close 2 of the prior contract's 3 CONCERNs — this contract
carries current evidence.

Parallel strategy: sequential
Rationale: Single self-contained phase plan re-validation, one validate-agent instance, no
cross-agent communication needed (signal count 0/7 — 6 blast-radius files, below the 3+/5+
thresholds; no schema/auth/billing/container surface; not a multi-direction fan-out).

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC4 | Sidebar renders live category tag counts from `useCategoryTagCounts()`, not hardcoded `demosCount` | Fully-Automated | `corepack pnpm --filter web exec vitest run components/features/main-page/__tests__/sidebar-layout.test.tsx` (extend with a case asserting a non-zero `tagCounts` entry renders as the item's count) — baseline confirmed 3/3 passing this session | B |
| AC9 (nav resolution) | Every main-nav item resolves to exactly one destination; `/templates` redirects into `?tab=templates` via `permanentRedirect()` (308) | Fully-Automated | `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` (extend `auditRoute`/route list to assert `/templates` resolves to the `?tab=templates` view content, not `TemplatesListSEO`) — `playwright.config.ts` defines a `webServer` block, so this runs with no manual precondition | B |
| AC9 (orphans documented) | `/public-dashboard`, `/import-old` documented as intentionally-unlinked internal routes | Hybrid | Code comment at each route's entry point + phase-report review; precondition: reviewer manually confirms comment text at both files | B |
| AC4/AC9 (WIP reconciliation) | Phase 4 builds on WIP `useCategoryTagCounts()` rather than duplicating it | Agent-Probe | Code review during EXECUTE confirming no second count-fetching mechanism was introduced; `git diff` shows only 1 hook definition | A |
| (regression guard) | `home-layout.tsx`'s `getTagDemosCount()`-derived tag-slider counts do not regress to 0 when Step D touches `lib/navigation.ts`/`queries.ts` | Hybrid | `corepack pnpm --filter web test` — no dedicated test covers `home-layout.tsx`; precondition: execute-agent manually confirms (Execute-Agent Instruction E1) that `getTagDemosCount()`/`demosCount` are retained before Step D2 is applied | D |
| (SEO preservation) | `/templates`'s existing SEO metadata (title/description/OG/keywords) is preserved via `generateMetadata({searchParams})` on the home route (locked decision B1a) | Agent-Probe | Manual review during EXECUTE per Execute-Agent Instruction E2 — no automated SEO-crawl test exists in this repo; confirmed this pass by direct read that `apps/web/app/page.tsx`'s existing `generateMetadata` export and its sibling default export already destructure `searchParams: Promise<{tab?: string}>` in the same file, so the pattern has an in-file precedent | D |
| (dead-code retirement, NEW this pass) | `TemplatesListSEO` component becomes fully orphaned once `/templates/page.tsx` is converted to a redirect | Agent-Probe | Manual decision + action during EXECUTE per Execute-Agent Instruction E4 — confirmed by repo-wide grep that its only importers are `apps/web/app/templates/page.tsx` (being replaced) and its own file; deletion (recommended) is implicitly checked by the existing `tsc --noEmit` gate (a stray import would fail the build) | D |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist, via Step D3/B2/C1)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue) — all three D-rows are
  resolved for THIS pass via Execute-Agent Instructions (manual guardrail) rather than a new
  automated test, because the underlying files/behaviors sit outside this phase's automation
  boundary (no live DB, no SEO-crawl harness, no dedicated home-layout.tsx test suite) or are a
  one-time deletion decision better made by a human/agent reviewer than a test.

Legacy line form (retained so existing validate-contract consumers still parse):
- Sidebar counts: Fully-automated: `corepack pnpm --filter web exec vitest run components/features/main-page/__tests__/sidebar-layout.test.tsx` (extended)
- Nav route resolution: Fully-automated: `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` (extended)
- Orphaned routes: hybrid: code comment + phase-report review, precondition: manual reviewer confirmation
- WIP reconciliation: agent-probe: code review during EXECUTE, no second count-fetch mechanism introduced
- home-layout.tsx count regression: known-gap: documented as Execute-Agent Instruction E1 (no automated test exists for home-layout.tsx; out of Blast Radius)
- /templates SEO metadata loss: known-gap: documented as Execute-Agent Instruction E2 (mitigated by locked decision B1a; no automated SEO-crawl test exists in this repo)
- TemplatesListSEO dead-code retirement: known-gap: documented as Execute-Agent Instruction E4 (new this pass; no automated dead-code-detection test exists in this repo)

Dimension findings:
- Infra fit: PASS — all Blast Radius file paths confirmed to exist on disk this pass (direct
  `Read`/`find` of `use-navigation.ts`, `atoms.ts`, `navigation.ts`, `sidebar-layout.tsx`,
  `app/templates/page.tsx`, `queries.ts`, plus the newly-relevant `home-layout.tsx`). No
  container/infra/runtime surface touched. `demo_tags`/`component_tags` confirmed already in the
  live 14-relation authenticated grant baseline (Entry Gate correction) — Phase 1's live apply is
  not a functional blocker for this phase. `phase-blast-radius-registry.md` shows no
  `status: BLOCKED-skipped` on Phase 1 — Dependency-BLOCKED guard does not trip.
- Test coverage: CONCERN — AC4/AC9's primary gates remain Fully-Automated and well-targeted
  (re-ran `sidebar-layout.test.tsx` this session: 3/3 passing, confirmed live not just claimed;
  confirmed `playwright.config.ts` has a `webServer` block so the a11y gate needs no manual
  precondition). The residual gap is the 3 Agent-Probe/Hybrid rows above (home-layout.tsx
  regression, SEO preservation, TemplatesListSEO retirement) which have zero automated coverage
  and sit outside or at the edge of Blast Radius — mitigated via Execute-Agent Instructions
  E1/E2/E4, not silently absorbed.
- Breaking changes: CONCERN — two items: (1) `/templates`'s SEO metadata public contract is now
  addressed by a locked decision (B1a) rather than an open gap, downgrading its severity, but (2) a
  NEW breaking-change-adjacent finding this pass: converting `/templates` to a redirect leaves
  `TemplatesListSEO` (`apps/web/components/features/templates/templates-list-seo.tsx`) with zero
  remaining importers — the plan does not say what happens to this component. Not a functional
  regression (its `get_templates_v3` RPC dependency stays live via the separate `templates-list.tsx`
  consumer used by the `?tab=templates` view), but an unaddressed dead-code gap. See Execute-Agent
  Instruction E4.
- Security surface: PASS — no auth, billing, schema, or secret-handling surface touched.

- Section A (WIP reconciliation): PASS — re-confirmed by direct code read this pass:
  `sidebar-layout.tsx` calls `useCategoryTagCounts()` and `useIsAdmin()`; zero references to
  `demosCount`/`getTagDemosCount` anywhere in `sidebar-layout.tsx` (grep returned no matches); the
  `isAdmin` gate at the Templates/Bundles/Pro nav-item filter is present and unchanged. No
  conflicts found. Highest-risk edit: none — this step is read/confirm only.
- Section B (`/templates` reconciliation): CONCERN — mechanical feasibility CONFIRMED two ways: (1)
  `permanentRedirect()`/`redirect()` from `next/navigation` already has live precedent elsewhere in
  this repo (`apps/web/app/settings/page.tsx`, `apps/web/app/studio/page.tsx`, and others), so B2 is
  a standard, low-risk pattern; (2) `apps/web/app/page.tsx`'s existing `generateMetadata` export
  (currently zero-arg, static) sits in the same file as a default export that already destructures
  `searchParams: Promise<{tab?: string}>` — adding the same parameter to `generateMetadata` and
  branching on `tab === "templates"` is the same, already-proven pattern, not a restructure. B1a's
  pre-check claim is confirmed sound. Repo-wide grep found exactly ONE inbound reference to the
  literal string `/templates` outside the route's own files: `e2e/a11y.spec.ts:12` — the nav item
  itself already targets `?tab=templates` via `navigateToTab()`/`getMainPageUrlWithTab()`, so there
  is no second path and no redirect loop (the redirect target `/?tab=templates` does not itself
  redirect). Gap found (NEW this pass): the plan does not address `TemplatesListSEO`'s disposition
  once `/templates/page.tsx` no longer imports it — see Breaking changes above and Execute-Agent
  Instruction E4. No other conflicts found. Highest-risk edit + mitigation: B2's redirect
  implementation — mitigate by using `permanentRedirect()` (already locked) and applying
  Execute-Agent Instruction E4 for the orphaned-component question.
- Section C (orphaned routes documentation): CONCERN (minor, unchanged from the prior cycle) —
  mechanically feasible; confirmed `/public-dashboard` and `/import-old` still have zero
  UI-navigation inbound references (only test-file references, consistent with "orphaned from nav"
  framing). Gap unchanged: SPEC AC9's "regression check" language is stronger than a bare code
  comment. Non-blocking; Execute-Agent Instruction E3 (optional) stands unchanged.
- Section D (sidebar counts): PASS — re-confirmed by direct code read this pass that
  `home-layout.tsx:8,226` genuinely calls `getTagDemosCount(category.id)`, and `getTagDemosCount()`
  (`queries.ts:1098-1102`) genuinely reads `lib/navigation.ts`'s hardcoded `demosCount` field via the
  `categories` array — so D1a's locked decision (retain both, do not migrate `home-layout.tsx` in
  this phase) is confirmed necessary and correctly targeted, and Execute-Agent Instruction E1
  correctly governs D2's literal execution. Editorial note (non-scored): the Implementation
  Checklist's own D2 bullet text still reads "Remove the hardcoded `demosCount` values..." which,
  read in isolation, contradicts D1a's locked "retain, scope down to confirm-only" text directly
  above it. This is not scored as a gate-affecting CONCERN because two independent, more specific
  and more recent instructions (D1a's own prose, and Execute-Agent Instruction E1) already govern
  actual EXECUTE behavior and both correctly say "retain" — but it is worth a future one-line
  cleanup of D2's checklist wording for clarity. No functional risk found.

What this coverage does NOT prove:
- The Fully-Automated sidebar-count test proves the component renders `tagCounts` values when
  present — it does NOT prove the live Supabase query itself returns correct counts against
  production data (requires a live/seeded DB, out of this phase's automation boundary).
- The Fully-Automated route-reachability test proves `/templates` resolves to expected page
  content via a real browser (Playwright + its own dev server) — it does NOT prove search-engine
  crawlers will index the redirect target with equivalent SEO value to the current dedicated page
  (no crawl-simulation harness exists in this repo).
- The Hybrid orphan-route documentation gate proves a comment exists at review time — it does NOT
  prove the comment will be preserved on future edits (no automated enforcement).
- The Agent-Probe WIP-reconciliation review proves no duplicate mechanism exists at EXECUTE time —
  it does NOT prove no future PR reintroduces a second count-fetch path (no lint rule enforces
  this).
- The Hybrid `home-layout.tsx` regression guard proves a human/execute-agent manually checked the
  dependency before touching `lib/navigation.ts` — it does NOT prove automated regression coverage
  exists for `home-layout.tsx` going forward (Test Infra Improvement Note tracks this gap).
- The Agent-Probe SEO-preservation review proves the `generateMetadata` branch was implemented and
  manually eyeballed — it does NOT prove the resulting HTML actually satisfies real crawler
  requirements (no crawl-simulation harness exists in this repo).
- The Agent-Probe dead-code-retirement review proves a human/execute-agent made and recorded an
  explicit decision about `TemplatesListSEO` — it does NOT prove no other, not-yet-written code will
  re-import it in the future (no lint rule enforces this); it also does not prove deletion is
  complete beyond what `tsc --noEmit` would catch (a broken import fails the build, but an unused
  file that nothing imports would not fail the build if merely left in place undeleted).

Execute-Agent Instructions (apply during EXECUTE regardless of which plan-validate-fix supplement
cycle folds these into the checklist text):
- E1. Before applying Step D2, grep for all remaining call sites of `getTagDemosCount` and any
  reader of `lib/navigation.ts`'s `demosCount` field. Confirmed this pass: `home-layout.tsx:8,226`
  is a live, in-scope consumer. Do NOT delete `getTagDemosCount()` or the `demosCount` field values
  unless `home-layout.tsx` is migrated to a live-count source within this same phase (out of the
  current Blast Radius — if migrating it, add it to Blast Radius and note the addition in the
  phase report; if not migrating it, leave the function and hardcoded values in place and scope D2
  down to "confirmed sidebar no longer depends on them" only). This instruction is authoritative
  over the Implementation Checklist's D2 bullet text where the two appear to conflict — D1a's
  locked decision and this instruction both say "retain."
- E2. **Updated this pass — B1a is now a locked decision, not an open choice.** Implement Step B1a
  exactly as locked: add a `searchParams` parameter to `apps/web/app/page.tsx`'s existing
  `generateMetadata` export (mirroring the default export's own
  `searchParams: Promise<{tab?: string}>` destructuring pattern already in the same file), await
  it, and when `tab === "templates"` return the metadata object currently defined at
  `apps/web/app/templates/page.tsx:8-27` (title/description/keywords/OpenGraph) instead of the
  default WebSite metadata. Do not re-litigate options (a) keep-metadata-on-redirect or (c)
  accept-the-regression — both are rejected per B1a's rationale. Confirm in the phase report that
  the branch was implemented and that the existing `generateMetadata` JSON-LD `WebSite` behavior is
  unaffected for the `!tab` case.
- E3 (optional, non-blocking, unchanged). When applying Step C1, consider adding a trivial
  assertion (e.g. a one-line grep check in a test, or extending `e2e/a11y.spec.ts`'s existing route
  list assertions) that the orphan-route comment text is present, so SPEC AC9's "regression check"
  language is literally satisfied rather than only documented. Skip if judged disproportionate;
  note the decision either way in the phase report.
- E4 (NEW this pass). Before or immediately after applying Step B2, decide and document (in the
  phase report) the disposition of `apps/web/components/features/templates/templates-list-seo.tsx`
  (the `TemplatesListSEO` component), which becomes fully orphaned once
  `apps/web/app/templates/page.tsx` stops importing it. Confirmed this pass via repo-wide grep: its
  only importers today are `apps/web/app/templates/page.tsx` (being replaced) and its own file — no
  other file imports it. Its `get_templates_v3` RPC dependency remains safely in use elsewhere via
  `apps/web/components/features/templates/templates-list.tsx` (the `?tab=templates` view's live
  consumer), so deleting `TemplatesListSEO` does not touch that RPC contract. Recommended: delete
  the file. Acceptable alternative: leave it in place with an explicit `// ORPHANED — no longer
  imported after the /templates redirect (see phase-04-navigation plan)` comment. Do not leave it
  silently in place undocumented.

Backlog Artifacts: none required this cycle — E1/E2/E3/E4 are all resolved as Execute-Agent
Instructions actionable within this phase's own EXECUTE step; none require a separate backlog note
or a follow-up phase.

Known gaps: none pre-classified via a `## Known Gaps (Resolved via Backlog)` section in this plan
(no such section exists) — see the three `D`-gap-resolution rows above (home-layout.tsx regression
guard, /templates SEO preservation, TemplatesListSEO retirement), which are carried as
Hybrid/Agent-Probe manual gates via Execute-Agent Instructions E1/E2/E4, not silent known-gaps.

### Net Gate Derivation

| Layer 1 dimensions | Status |
|---|---|
| Infra fit | PASS |
| Test coverage | CONCERN |
| Breaking changes | CONCERN |
| Security surface | PASS |

| Layer 2 sections | Status |
|---|---|
| Section A — WIP reconciliation | PASS |
| Section B — `/templates` reconciliation | CONCERN |
| Section C — orphaned routes documentation | CONCERN (minor) |
| Section D — sidebar counts | PASS |

**Totals: 0 FAILs / 4 CONCERNs / 4 PASSes**

**→ Net Gate: CONDITIONAL**

Gate: CONDITIONAL (this is inner-PVL cycle 1 for this phase, run immediately after the
RESEARCH+INNOVATE+PLAN-SUPPLEMENT cycle that already resolved 2 of the prior contract's 3 original
CONCERNs — B1a SEO mitigation and D1a home-layout.tsx risk — via locked decisions folded into plan
text. This pass found 0 FAILs and 4 CONCERNs: 1 residual/downgraded (test coverage, unchanged in
kind), 1 partially-resolved-but-newly-surfaced (breaking changes — SEO gap closed, but
TemplatesListSEO orphan gap newly found), 1 carried-over-minor-unchanged (Section C orphan-route
regression check), and the Section B concern tracking the same TemplatesListSEO finding. All 4
CONCERNs are resolved via Execute-Agent Instructions (E1-E4) rather than requiring a further
plan-text rewrite, consistent with this plan's own established precedent from the prior cycle.
Recommend the orchestrator accept this CONDITIONAL gate and proceed to EXECUTE without an
additional supplement loop, since the residual items are small, actionable, execute-time
decisions rather than open design questions — but this is the orchestrator's call to make per its
own PVL cycle-count bookkeeping.)
Accepted by: session (autonomous, /goal execution) — concerns are structured as Execute-Agent
Instructions E1 (home-layout.tsx retention, carried), E2 (SEO metadata via locked decision B1a,
updated), E3 (orphan-route regression check, carried, optional), and E4 (TemplatesListSEO
retirement decision, new this pass) rather than blocking FAILs or open plan-text gaps.

---

## SUPPLEMENT REQUEST (for orchestrator routing — see V7; informational this pass, see Gate note above)

- Gap 4 (NEW this pass): Section: implementation-checklist (Step B — `/templates` reconciliation) |
  Concern: `TemplatesListSEO` becomes a fully orphaned component (zero importers) once
  `/templates/page.tsx` is converted to a redirect; the plan does not state its disposition. |
  Severity: CONCERN | Suggested addition: resolved via Execute-Agent Instruction E4 this pass
  (delete or explicitly mark deprecated); no plan-text checklist rewrite required.
- Gap 3 (carried, unchanged): Section: implementation-checklist (Step C — Document orphaned
  routes) | Concern: SPEC AC9's "regression check" language is stronger than the checklist's bare
  code-comment mitigation. | Severity: CONCERN (minor, non-blocking) | Suggested addition:
  Execute-Agent Instruction E3 (optional, unchanged) — add a one-line assertion if not judged
  disproportionate.
- Gap 1 and Gap 2 from the superseded 25-07-26 contract are RESOLVED this cycle: Gap 1
  (home-layout.tsx regression risk) closed by locked decision D1a + Execute-Agent Instruction E1;
  Gap 2 (SEO metadata loss) closed by locked decision B1a + updated Execute-Agent Instruction E2.
