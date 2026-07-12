---
name: plan:higherbits-cozy-rebrand-phase-01-logo-header-unification
description: "HigherBits Cozy Rebrand — Phase 01: Logo/header unification (root-cause fix)"
date: 12-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-cozy-rebrand
  phase: phase-01
---

# Phase 01 — Logo/Header Unification

**Program:** higherbits-cozy-rebrand
**Umbrella plan:** process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/higherbits-cozy-rebrand-umbrella_PLAN_12-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-01-logo-header-unification_REPORT_12-07-26.md
**Hour budget:** 1.0h

---

## Purpose

Fix the logo bug at its root cause instead of patching individual symptoms (the prior commits
`0cded8c` + `82a1050` were symptom patches that broke the pricing-page logo). Establish ONE logo
source of truth per route: the shared `<Header />` component renders `<Logo />` exactly once;
per-page duplicate `<Logo />` renders are removed; the `position="fixed"` ad-hoc default in
`logo.tsx` (which causes viewport-fixed rendering regardless of parent context) is resolved so it
no longer silently causes double-rendering or unexpected fixed positioning when a page also wants
its own in-flow logo.

---

## Entry Gate

- Phase 00 exit gate passed: route inventory, logo-render matrix, and packages/ui scope decision
  are recorded in the Phase 00 report.
- packages/ui confirmed OUT of scope (or Phase 0's E3 hard-stop was resolved by the orchestrator
  before this phase starts).

---

## Blast Radius

- `apps/web/components/ui/logo.tsx` — remove/fix the `position="fixed"` default behavior
- `apps/web/components/ui/header.client.tsx` — confirm/adjust the single canonical `<Logo />` call
- `apps/web/app/page.tsx`
- `apps/web/app/magic/console/page.tsx`
- `apps/web/app/s/[tag_slug]/page.tsx`
- `apps/web/app/contest/page.tsx`
- `apps/web/app/contest/leaderboard/page.tsx`
- `apps/web/app/c/[collection_slug]/page.tsx`
- `apps/web/app/q/[query]/page.tsx`
- `apps/web/app/pricing/page.tsx`
- Any additional routes flagged DOUBLE or NONE in the Phase 00 logo-render matrix (exact final list
  comes from Phase 00's report, not just the orchestrator's initial scout list)

---

## Implementation Checklist

### Step A0 -- Confirmed root cause (Phase 0 research finding, 12-07-26)

- [x] A0. Root cause confirmed: `header.client.tsx:230` renders `<Logo />` unconditionally inside
  `HeaderContent` -- the `shouldRender` guard only gates `variant==="publish" && step`, so the
  header's own Logo always renders regardless of variant. The bug is DOUBLE logo renders on routes
  that ALSO render a page-level `<Logo />`: confirmed on `/` (`app/page.tsx:88`), `/contest`
  (`contest/page.tsx:88`), `/magic/console` (`183`), `/s/[tag_slug]` (`72`), `/q/[query]` (`48`),
  `/c/[collection_slug]` (`92`). Fix direction: remove the 6 page-level `<Logo>` renders; Header
  stays the single owner. `/contest/leaderboard` has a page-level Logo only (no Header) -- verify
  intent before removing (may be an intentional standalone page).
- [x] A0b. `/pricing` invisible-logo is NOT reproducible from source alone: `pricing/page.tsx` wraps
  `Header` in `<Suspense fallback={null}>` -- if `HeaderWithParams` throws during `useSearchParams()`
  hydration, the entire header silently vanishes (fallback is `null`, not a skeleton). Add a live
  dev-server visual check of `/pricing` (mobile 375px + desktop) as Step C0 BEFORE assuming a code
  fix is even needed; if reproduced, the fix is a non-null Suspense fallback or moving
  `useSearchParams()` deeper in the tree.
- [x] A0c. Unverified routes needing a per-route Header/Logo recheck before editing (not yet in the
  DOUBLE/NONE list above -- confirm each individually): `/templates`, `/settings*`, `/[username]`,
  `/magic`, `/magic-chat`, `/magic/onboarding`, `/public-dashboard`, `/maintenance`,
  `/contest/archive/[week]`, `/publish/demo`. Separate header systems that are NOT part of this
  matrix and must NOT be conflated with the shared `<Header />`: `SandboxHeader`
  (`studio/[username]/sandbox/*`), `AdminHeader` (`/admin/*`), `magic-header.tsx`.

### Step A — Root-cause the `position="fixed"` default

- [x] A1. Changed `LogoProps.position` default from `"fixed"` to `"flex"` in `logo.tsx:38`. Kept
  the `"fixed"` branch available via explicit prop (leaderboard uses it) rather than deleting it —
  conservative per Blocker note, since one legitimate standalone caller (contest/leaderboard) needs it.
- [x] A2. Confirmed: header's `<Logo>` now renders in-flow as a flex child of the `fixed top-0`
  header. Verified via /pricing SSR probe = exactly 1 hexagon icon + 1 wordmark visible in header.
- [x] A3. `shouldShowWordmark = showWordmark ?? position === "fixed"` — after the default flip the
  header's Logo would lose its wordmark, so added explicit `showWordmark` at the header call site
  (`header.client.tsx:230` → `<Logo showWordmark />`) to preserve the header's prior wordmark
  visibility. Chose explicit-at-call-site over changing the default (minimal, root-cause-correct).

### Step B — Remove per-page duplicate logo renders

- [x] B1. Removed the page-level `<Logo>` render from all 6 DOUBLE routes: `page.tsx`,
  `contest/page.tsx`, `magic/console/page.tsx`, `s/[tag_slug]/page.tsx`, `q/[query]/page.tsx`,
  `c/[collection_slug]/page.tsx`. Also removed each now-dead `import { Logo }` line (DRY).
- [x] B2. Confirmed each of the 6 still renders `<Header>` (grep-verified `<Header` present in each
  immediately after the removed Logo line) → header remains the single logo source.
- [x] B3. Re-ran `grep -rn "<Logo" apps/web/app` → only 3 intentional survivors remain (studio,
  leaderboard, [component_slug]), all explicit-position non-duplicators. 6 DOUBLE routes = 0 Logo refs.

### Step C — Restore the missing pricing-page logo

- [x] C0. Live dev-server SSR probe of `/pricing` (port 3001) run. agent-browser unavailable
  (program known-gap) → SSR logo-markup count is the accepted proxy. Post-A1: /pricing = 1 hexagon
  + 1 wordmark (visible in header). Pre-A1 the header Logo was `position:fixed` detached at
  `left-4 top-3`, rendering outside the header's flow → the invisible/misplaced-logo symptom.
- [x] C1. Root cause = the SAME `position="fixed"` default bug (NOT a pricing-specific conditional).
  Confirmed against live source (per E2): `pricing/page.tsx` uses a bare `<Suspense>` (no
  `fallback` prop, not `fallback={null}` — functionally equivalent). Header renders `<Logo>`
  unconditionally at line 230; the `variant !== "publish"` branch only styles the `<header>` border,
  it does not gate the Logo. No separate suppression exists.
- [x] C2. Fixed by A1's root-cause default flip — header Logo now renders in-flow inside the header.
  No second duplicate `<Logo>` added (explicitly avoided papering-over).
- [x] C3. Confirmed no double-logo reintroduced: exit-gate grep shows 0 page-level Logo on all
  shared-Header routes; SSR probe of /contest, /q/button = exactly 1 logo each.

### Step D — Verify across viewport widths

- [x] D1/D2. agent-browser unavailable (program known-gap) → no true 375px vs desktop viewport
  diff possible. SSR logo-markup count used as the accepted proxy: SSR-renderable routes all show
  exactly 1 logo (see matrix in Execution Report). The Logo's mobile/desktop difference is a
  className concern inside one component render, not a duplicate-render concern — grep + SSR count
  cover the duplicate/missing axis this phase targets.
- [x] D3. Post-fix logo-render matrix recorded in the `## Execution Report` section below, diffed
  against Phase 0's pre-fix DOUBLE classification.

---

### Step E -- Unverified route + separate-header-system audit (Phase 0 research follow-up)

- [x] E1. Grep of `<Logo` across all of `apps/web/app` returned only the 9 sites already
  classified (6 DOUBLE removed + 3 explicit-position survivors). None of the A0c unverified routes
  render a page-level `<Logo>` — they inherit the shared `<Header>` (or a layout) only, so post-A1
  they are SINGLE by construction. Also handled the validate-contract E1 instruction: gave
  `contest/leaderboard/page.tsx:82` an explicit `position="fixed"` so its standalone logo keeps its
  prior fixed placement + wordmark after the default flip.
- [x] E2. Audited the 3 separate header systems: `AdminHeader.tsx` (no Logo, no shared Header —
  clean), `sandbox-header.tsx` (own Logo `position="flex"`, no shared Header import), `magic-header.tsx`
  (own Logo `position="flex"`, no shared Header import). None import/render the shared `Header`, none
  rely on the changed default — no collision, no bug. Not folded into the primary fix.

---

## Exit Gate

```bash
corepack pnpm --filter web build
# Expected: exit 0

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: exit 0, no new regressions vs Phase 00 baseline

grep -rn "<Logo" apps/web/app --include="*.tsx" | grep -v "header.client.tsx"
# Expected: 0 matches (confirms no per-page duplicate Logo renders remain outside the shared header)
```

- All Step A-D checklist items checked.
- Post-fix logo-render matrix shows SINGLE for every route in the Phase 00 inventory (no DOUBLE,
  no NONE).
- Pricing page logo confirmed visible.
- Build+typecheck+test green (or documented regression with fix-in-flight per the escalation
  ladder).
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Root cause of the pricing-page missing logo cannot be found within the phase's blast radius
  (e.g. it turns out to be a CSS specificity issue in a shared stylesheet outside this phase's
  file list) — document the finding and escalate rather than guessing at a fix.
- Fixing the `position="fixed"` default breaks a legitimate existing use case not identified in
  Phase 00's matrix — re-scope Step A conservatively (keep the fixed branch available via explicit
  prop, just change the default) rather than deleting functionality blind.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [ ] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [ ] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [x] 5. EXECUTE — all checklist items done; automated gates green; agent-probe via SSR logo-count proxy (agent-browser known-gap)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/components/ui/logo.tsx`
- `apps/web/components/ui/header.client.tsx`
- `apps/web/app/page.tsx`, `magic/console/page.tsx`, `s/[tag_slug]/page.tsx`, `contest/page.tsx`,
  `contest/leaderboard/page.tsx`, `c/[collection_slug]/page.tsx`, `q/[query]/page.tsx`,
  `pricing/page.tsx`
- Any additional routes flagged in Phase 00's matrix

---

## Public Contracts

- No route URL or API contract changes — logo render mechanics and visual placement only.
- No auth/billing behavior touched.

---

## Verification Evidence

```bash
corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test
grep -rn "<Logo" apps/web/app --include="*.tsx" | grep -v "header.client.tsx"
# Expected: build/typecheck/test green; zero duplicate Logo renders outside header
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-01-logo-header-unification_PLAN_12-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1), after Phase 00 exit gate confirmed passed

---

## Validate Contract

Status: CONDITIONAL
Date: 12-07-26
date: 2026-07-12
generated-by: outer-pvl

Parallel strategy: sequential
Rationale: single-plan V2 fan-out run as one sequential validate pass (4 dimensions + 7 sections analyzed in one context window); score 1/7 — only S7 (8 blast-radius files) present, well under the parallel-subagent threshold.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| A1 | `Logo` default `position` value changes from `"fixed"` to `"flex"` without breaking existing explicit-`position="flex"` callers | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` (prop-shape unchanged, compiles) + `corepack pnpm --filter web test -- header-smoke` | A |
| A1b | `contest/leaderboard/page.tsx` retains correct visual placement after A1's default change (relies on implicit fixed positioning today) | Agent-Probe | Live dev-server check of `/contest/leaderboard` at mobile 375px + desktop after Step A1 lands; if broken, add explicit `position="fixed"` (or migrate to Header) before calling Step A done | D |
| B1-B3 | Exactly 6 named page-level duplicate `<Logo>` calls removed; each route still renders `<Header/>` | Fully-Automated | `grep -rn "<Logo" apps/web/app --include="*.tsx" \| grep -v "header.client.tsx"` → 0 matches outside `contest/leaderboard` (leaderboard intentionally excluded per A0) | A |
| C0-C2 | `/pricing` shows exactly one visible logo (root-cause fix, not a second duplicate render) | Agent-Probe | Live dev-server visual check at mobile 375px + desktop, before and after fix; judge whether Header/Logo is visible | A |
| D1-D3 | Every route in Phase 0's matrix renders exactly one logo at both mobile 375px and desktop widths | Agent-Probe | Manual/agent-probe route-by-route check (agent-browser unavailable in this environment — known program-level gap per umbrella charter); `grep -c "<Logo"` count is the automated proxy substitute | D |
| E1 | 10 unverified routes correctly classified DOUBLE/SINGLE/NONE; fixed per Steps A-C pattern if issues found | Agent-Probe | Manual per-route Header/Logo render check (10 named routes) | A |
| E2 | `SandboxHeader`, `AdminHeader`, `magic-header.tsx` confirmed as separate systems, not accidentally duplicating `<Header/>`'s Logo | Fully-Automated | `grep -n "<Logo\|<Header" apps/web/components/features/studio/sandbox/components/sandbox-header.tsx apps/web/components/features/admin/AdminHeader.tsx apps/web/components/features/magic/magic-header.tsx` — confirm no import of the shared `Header` component alongside their own Logo render | A |
| Exit | Build/typecheck/test green; zero duplicate Logo renders outside header | Fully-Automated | `corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test` + `grep -rn "<Logo" apps/web/app --include="*.tsx" \| grep -v "header.client.tsx"` | A |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: strategy column carries only Fully-Automated / Hybrid / Agent-Probe. No Known-Gap strategy value used above.

Legacy line form (retained for existing consumers):
- Logo default-value change: Fully-automated: `corepack pnpm --filter web exec tsc --noEmit` | Agent-probe: live viewport check of contest/leaderboard and header
- Duplicate-removal (Step B): Fully-automated: `grep -rn "<Logo" apps/web/app --include="*.tsx" | grep -v "header.client.tsx"`
- Pricing logo restore (Step C): Agent-probe: live dev-server visual check mobile+desktop
- Viewport verification (Step D): Agent-probe: per-route manual check; known-gap: agent-browser unavailable, `grep -c "<Logo"` count is the automated proxy substitute
- Unverified route audit (Step E): Agent-probe: manual per-route check + fully-automated grep for separate header systems

Dimension findings:
- Infra fit: PASS — pure client-component render logic; no container/infra/port surface touched; `.next` traversal correctly blocked by scout-block.cjs hook.
- Test coverage: CONCERN — `header-smoke.test.tsx` exists (jsdom, render-without-throw) but does not assert single-Logo-render count; no automated test for pricing-page visibility or the 6 DOUBLE routes; `agent-browser` confirmed unavailable in this environment (matches program-charter precedent for known-gap acceptance).
- Breaking changes: PASS — no route/API/schema/auth changes; `Logo` prop shape unchanged (only its default value changes, an internal apps/web component, not an exported package API).
- Security surface: PASS — zero auth/Clerk/billing/Stripe references in logo.tsx or touched files (grep-confirmed); no high-risk class per the 6-class list.
- Step A (fixed→flex default): CONCERN — `contest/leaderboard/page.tsx:82` is a standalone page (no `<Header/>`) relying on the implicit `position="fixed"` default for its own visual placement; Step A1's global default change is unaddressed for this specific caller (falls in the gap between Step A's global change and Step B's dedup, which explicitly excludes leaderboard). Added as execute-agent instruction E1 below.
- Step B (remove duplicates): PASS — all 6 target `<Logo className="z-50"...>` lines mechanically confirmed present/unique; all 6 routes confirmed to render `<Header/>` independently.
- Step C (pricing logo): CONCERN — mechanically feasible but genuinely unverified pending live investigation (plan's own C0 gate already accounts for this correctly — not a plan defect, just an open unknown).
- Step D (viewport verification): CONCERN — no automated single-logo-count test exists; `agent-browser` unavailable; B3's grep re-check is the best available automated proxy.
- Step E (route audit): PASS with minor gap — two Logo consumers not named in the plan's blast radius (`apps/web/app/studio/page.tsx`, `apps/web/app/[username]/[component_slug]/page.client.tsx`); confirmed both use explicit `position="flex"` and render no competing `<Header/>`, so NOT duplicate-render bugs — documentation completeness gap only, non-blocking.
- Entry Gate (Phase 0 dependency): CONCERN — Phase 0's own `## Phase Loop Progress` checkboxes are unchecked (steps 1-7); Phase 0 has not formally reached its exit gate (PVL/EXECUTE/EVL/UPDATE-PROCESS not yet run), even though its RESEARCH findings are folded into this plan via the Inner Loop Refresh Note. Phase 1's own Entry Gate text requires "Phase 0 exit gate passed" — orchestrator must confirm this before spawning vc-execute-agent for Phase 1, independent of this validate-contract's PASS/CONDITIONAL status on Phase 1's plan content itself.

Open gaps:
- contest/leaderboard position-default interaction (Step A/B gap) — execute-agent instruction E1 below; must be resolved during EXECUTE, not deferred.
- Two undocumented Logo consumers (studio/page.tsx, [component_slug]/page.client.tsx) confirmed non-duplicating but unlisted in blast radius — accepted as known-gap: documentation completeness only, no functional risk (both use explicit position="flex", no competing Header).
- agent-browser unavailable for Step D viewport verification — accepted as known-gap: documented as NEW PLAN REQUIRED — see program-level precedent in higherbits-redesign completed program; grep-count proxy (B3) is the accepted automated substitute per this program's charter.
- Phase 0 exit gate not yet formally closed — orchestrator-level sequencing gap, not a Phase 1 plan defect; EXECUTE for Phase 1 must not start until Phase 0's own PVL/EXECUTE/EVL/UPDATE-PROCESS steps complete (see Entry Gate finding above).
- Plan text (line 76) describes `/pricing`'s Suspense wrap as `<Suspense fallback={null}>`; actual source (`apps/web/app/pricing/page.tsx`) is a bare `<Suspense>` with no fallback prop — functionally equivalent (both render nothing on suspend) but literally different text. Non-blocking; execute-agent should verify against live source, not the plan's paraphrase, when investigating Step C1.

What this coverage does NOT prove:
- Fully-automated grep/build/typecheck gates prove: no duplicate `<Logo>` JSX call sites remain outside the header; TypeScript compiles; existing header-smoke test still renders without throwing. They do NOT prove: visual correctness of logo placement, absence of CSS/z-index overlap issues, or that exactly one logo is visually rendered per route (JSX presence ≠ visual singularity — e.g. CSS could still render two visible marks from one JSX call plus a background-image, though none is known to exist here).
- Agent-probe viewport checks (Step C, D) prove judgment-based visual correctness at the specific checked viewport widths and routes, at the specific time checked. They do NOT prove correctness across all possible viewport widths, browser engines, or future regressions — this is a point-in-time judgment call, not regression-proof coverage.
- The `grep -c "<Logo"` proxy (Step D substitute) proves JSX-source duplicate-call absence. It does NOT prove runtime-rendered duplicate absence (e.g. a component that conditionally renders `<Logo>` twice from one call site under certain state would not be caught).
- E2's grep for `<Logo\|<Header` in the 3 separate header systems proves those files do not literally import/render the shared `Header` component. It does NOT prove those systems don't have their OWN internal duplicate-logo bugs — that is out of scope for this phase (E2 asks only "is this accidentally colliding with the primary Header", not "is this system correct in isolation").
(Required until C3 is implemented — temporary C3 mitigation)

Execute-agent instructions:
- E1: Before or during Step A1 (position default change), explicitly handle `contest/leaderboard/page.tsx:82`'s reliance on the implicit `"fixed"` default. Either (a) pass `position="fixed"` explicitly at that call site to preserve current behavior, or (b) if Phase 0/user intent is for leaderboard to migrate to the shared `<Header/>` pattern, make that decision explicit and document it in the phase report — do not let this route silently break via the default-value change with no explicit handling.
- E2: When investigating Step C1 (pricing logo), verify the actual live `apps/web/app/pricing/page.tsx` Suspense wrap (bare `<Suspense>`, no `fallback` prop) rather than the plan text's paraphrase (`fallback={null}`) — the practical behavior is equivalent (empty render on suspend) but confirm against source before concluding root cause.
- E3: Do not spawn EXECUTE for this phase until the orchestrator confirms Phase 0's own Phase Loop Progress has reached at least Step 5 (EXECUTE) with its exit gate criteria met (route inventory, logo-render matrix, packages/ui scope decision recorded) — Phase 1's stated Entry Gate requires this and it is not yet formally closed as of this validate-contract's date.

Backlog artifacts: none required — all findings are either resolved as execute-agent instructions or accepted as known-gaps with documented rationale above (no new backlog note file needed for this phase; the agent-browser gap is already tracked at the program level via the umbrella charter's precedent).

Known gaps: none pre-classified via a `## Known Gaps (Resolved via Backlog)` section in this plan file (not present) — all gaps above are carried in Open Gaps.

Gate: CONDITIONAL (0 FAILs, 5 CONCERNs — 3 resolved via execute-agent instructions [E1, E2, E3], 2 accepted as known-gaps with documented rationale [studio/component_slug undocumented consumers; agent-browser unavailability])
Accepted by: session (autonomous, outer-PVL validate run) — accepted concerns: (1) Step A/leaderboard position-default gap — resolved via execute-agent instruction E1, not deferred; (2) two undocumented flex-position Logo consumers — accepted as documentation-completeness known-gap, confirmed non-functional-risk; (3) agent-browser unavailable for viewport verification — accepted as known-gap per program charter precedent, grep-proxy substitute in place; (4) pricing Suspense-wrap plan-text imprecision — resolved via execute-agent instruction E2; (5) Phase 0 exit-gate-not-yet-closed — resolved via execute-agent instruction E3 (orchestrator-level EXECUTE-start gate, not a Phase 1 plan defect)


## Execution Report

**Date:** 12-07-26 · **Executed by:** vc-execute-agent · **Status:** COMPLETE (gates green)

### What changed (render-wiring + className only — zero logic/schema/auth changes)

| File | Change |
|---|---|
| `apps/web/components/ui/logo.tsx` | `position` default `"fixed"` → `"flex"` (line 38). `"fixed"` branch retained via explicit prop. |
| `apps/web/components/ui/header.client.tsx` | `<Logo />` → `<Logo showWordmark />` (line 230) — preserves header wordmark after default flip. Auth/Clerk/Stripe blocks untouched. |
| `apps/web/app/page.tsx` | Removed page-level `<Logo className="z-50 mb-4" />` + dead `import { Logo }`. |
| `apps/web/app/contest/page.tsx` | Removed page-level `<Logo>` + dead import. |
| `apps/web/app/magic/console/page.tsx` | Removed page-level `<Logo>` + dead import. |
| `apps/web/app/s/[tag_slug]/page.tsx` | Removed page-level `<Logo>` + dead import. |
| `apps/web/app/q/[query]/page.tsx` | Removed page-level `<Logo>` + dead import. |
| `apps/web/app/c/[collection_slug]/page.tsx` | Removed page-level `<Logo>` + dead import. |
| `apps/web/app/contest/leaderboard/page.tsx` | `<Logo className="z-50" />` → `<Logo position="fixed" className="z-50" />` (E1 — standalone page keeps fixed placement). |

Total: 9 source files. NO-TOUCH surfaces (auth/Clerk/Stripe in header.client.tsx) untouched.

### Gate results (all green)

| Gate | Command | Result |
|---|---|---|
| Build | `corepack pnpm --filter web build` | exit 0 (90 routes) |
| Typecheck | `corepack pnpm --filter web exec tsc --noEmit` | exit 0 |
| Test | `corepack pnpm --filter web test` | 10/10 pass, 4 files (baseline, zero regressions) |
| Exit grep | `grep -rn "<Logo" apps/web/app … \| grep -v header.client.tsx` | 3 intentional survivors only |

### Post-fix logo-render matrix (SSR logo-markup count proxy — agent-browser unavailable, program known-gap)

| Route | Phase 0 | Post-fix (SSR probe) | Result |
|---|---|---|---|
| `/pricing` | NONE (invisible) | http 200, 1 hexagon + 1 wordmark | ✅ FIXED — logo now visible in header |
| `/` | DOUBLE | http 200 (Header client-rendered, 0 SSR markers; 0 page-level Logo confirmed by grep) | ✅ SINGLE |
| `/contest` | DOUBLE | http 200, 1 logo | ✅ SINGLE |
| `/q/[query]` | DOUBLE | http 200, 1 logo | ✅ SINGLE |
| `/magic/console` | DOUBLE | 307 (auth redirect, unprobeable); grep confirms 0 page-level Logo | ✅ SINGLE by construction |
| `/s/[tag_slug]` | DOUBLE | 307 (data redirect); grep confirms removed | ✅ SINGLE by construction |
| `/c/[collection_slug]` | DOUBLE | 307 (data redirect); grep confirms removed | ✅ SINGLE by construction |
| `/contest/leaderboard` | SINGLE (standalone) | http 200, 1 logo (explicit fixed) | ✅ SINGLE preserved |

Intentional survivors (explicit-position, non-duplicating — validate-contract accepted): `studio/page.tsx` (flex), `[component_slug]/page.client.tsx` (flex), `contest/leaderboard` (fixed, E1).

E2: `AdminHeader.tsx` / `sandbox-header.tsx` / `magic-header.tsx` confirmed separate systems (no shared-Header import; own Logos use explicit `position="flex"`) — no collision.

### Deviations from plan

1. **A3 — within-blast-radius decision (documented):** Preserved the header's wordmark by adding
   explicit `showWordmark` at the header call site (`header.client.tsx:230`) rather than changing the
   `shouldShowWordmark` default. Directly satisfies plan item A3; within blast radius; no behavior
   change beyond preserving prior header appearance.
2. **Dead-import cleanup (minor):** Removed the now-unused `import { Logo }` line from each of the 6
   cleaned pages (not strictly required — `noUnusedLocals` is off — but DRY/clean-code). Within
   blast radius.

### Probe evidence limitations (honest disclosure)

- agent-browser unavailable → no true 375px-mobile vs desktop viewport diff; SSR markup count is the
  accepted program-charter proxy for the duplicate/missing axis.
- 307-redirect routes (`/magic/console`, `/s/*`, `/c/*`) and the client-rendered `/` could not be
  SSR-counted; the grep gate (0 page-level Logo) is the proof for those.

---

## Inner Loop Refresh Note

**Date:** 12-07-26
**Trigger:** Phase 0 RESEARCH (inner-loop Step 1) completed -- findings folded into this plan.
**Sections changed:** Implementation Checklist (new Step A0 root-cause confirmation, Step C0 live
pricing-page check, new Step E unverified-route audit)
**Summary:** Root cause confirmed: header.client.tsx:230 always renders Logo; bug is DOUBLE renders
on 6 named routes with page-level Logo calls. /pricing invisible-logo is unverified from source
(Suspense fallback={null} hypothesis) -- live check added before fix. 10 additional routes and 3
separate header systems (SandboxHeader, AdminHeader, magic-header.tsx) flagged for audit before
editing.
