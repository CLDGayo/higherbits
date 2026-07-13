---
name: plan:higherbits-cozy-rebrand-phase-04-surface-restyle
description: "HigherBits Cozy Rebrand — Phase 04: Surface restyle to textured cushion aesthetic"
date: 12-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-cozy-rebrand
  phase: phase-04
---

# Phase 04 — Surface Restyle

**Program:** higherbits-cozy-rebrand
**Umbrella plan:** process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/higherbits-cozy-rebrand-umbrella_PLAN_12-07-26.md
**Phase status:** ✅ EXECUTED (awaiting EVL confirmation run)
**Report destination:** process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-04-surface-restyle_REPORT_12-07-26.md
**Hour budget:** 2.0h

---

## Purpose

Apply Phase 3's cozy-with-textures claymorphism tokens (palette, radius, dual shadow, and the
`.texture-cushion` utility) to the site's high-traffic surfaces: header, sidebar, footer, landing
page, pricing page, and component/card surfaces. This is the phase where the visual identity
actually becomes visible to users — puffy 20-28px-radius cards with dual soft shadows AND visible
subtle fabric/linen-grain texture, pill-shaped buttons, rounded sidebar rail, rounded inputs,
generous padding, warm typography. CSS/className changes ONLY — no component logic, state, or
behavior changes.

---

## Entry Gate

- Phase 03 exit gate passed: cozy claymorphism tokens (palette/radius/shadow/texture, light +
  dark) confirmed present in `globals.css` and wired through `tailwind.config.js`.

---

## Blast Radius

- `apps/web/components/ui/header.client.tsx` — cushion restyle (CSS/className only, no structural
  refactor per the prior program's known constraint on this 27KB file)
- `apps/web/components/ui/footer.tsx`
- Sidebar component(s) — exact file(s) confirmed by Phase 00's route inventory (likely under
  `apps/web/components/ui/` or `apps/web/components/features/main-page/`)
- `apps/web/app/page.tsx` / `apps/web/app/page.client.tsx` (landing page)
- `apps/web/app/pricing/page.tsx`
- Component/card display primitives — button, card, badge/chip components under
  `apps/web/components/ui/` that render component-marketplace cards on high-traffic surfaces
- `apps/web/components/ui/code.tsx` if in scope for a card-treatment consistency pass (lower
  priority — flag only if budget allows)

---

## Implementation Checklist

### Step A — Header + navigation

- [x] A1. Search input + ⌘K kbd → `rounded-pill` (header.client.tsx:244,256).
- [x] A2. `.texture-cushion` + `bg-background/95 backdrop-blur-sm` on header bar (header.client.tsx:215).
- [x] A3. TG5 diff-review: header.client.tsx diff is 4 className lines only; grep for useAuth/useUser/stripe/SignedIn in the diff returns zero — no logic/structural delta.

### Step B — Sidebar

- [x] B1/B2. E2 resolved: primary nav sidebar is the shared `SidebarMenuButton` primitive in
  `components/ui/sidebar.tsx` (consumed by `features/main-page/sidebar-layout.tsx`; studio/settings
  sidebars out of high-traffic scope). Menu rail radius `rounded-md` → `rounded-pill` (sidebar.tsx:522).
  Full-panel texture skipped — pill menu rows read cozy; heavy texture on the nav rail would compete
  with card surfaces (charter "reserve texture for card/panel" direction).

### Step C — Footer

- [x] C1. Footer panel → `rounded-cushion`, `shadow-cushion`, `border-border/60`, `p-6`→`p-8`
  (footer.tsx:14). Uses `bg-card`/`text-card-foreground` theme tokens (dark-aware).
- [x] C2. No `.texture-cushion` on footer — kept flatter than hero/pricing card surfaces per the
  charter's texture-reservation direction (judgment call, documented).

### Step D — Landing page

- [x] D1. Landing wrappers → `texture-cushion rounded-cushion bg-card shadow-cushion border-border/60`
  (page.tsx:69,84); root shell `bg-[#F5F5F0]` hardcoded → `texture-cushion bg-background`.
- [x] D2. Pastel `Badge variant="pink"` announcement chip added to hero ("Cozy UI, freshly baked",
  hero-section.tsx) — first live consumer of the Phase-3 accent-chip variants. (Prior on-disk work
  defined the pink/peach/blue/mint variants in badge.tsx but applied none; this makes D2 genuine.)
- [x] D3. Landing card padding `p-6` → `p-8` (page.tsx:84).
- [x] D4. Primary CTAs → `rounded-pill` via the shared Button primitive (button.tsx base + size variants).

### Step E — Pricing page

- [x] E1. Pricing tier card → `texture-cushion rounded-cushion bg-card shadow-cushion border-border/60`;
  hardcoded dark-only `text-neutral-*`/`bg-white/5`/`text-black` all swapped to theme tokens
  (`text-foreground`, `text-muted-foreground`); featured ring `ring-accent/50`→`ring-accent-pink/60`;
  check icons → `text-accent-mint-foreground` (pricing-card.tsx). Also `texture-cushion` on the
  pricing page shell (pricing/page.tsx:11).
- [x] E2. E3-instruction resolved (re-read Phase 1 report): pricing/page.tsx diff is the single
  `texture-cushion` line — zero Header/Logo change; `<Logo>` page-level count = 0; logo.tsx
  `position` default still `"flex"` (Phase 1 fix intact). TG7 = exactly 1 logo (single `<Header/>`).
  Runtime note: Header is `<Suspense>`-wrapped so its client-hydrated Logo isn't in the raw SSR HTML
  — a pre-existing render characteristic, not a regression from this phase.
- [x] E3. Pricing CTA button → `rounded-pill bg-primary text-primary-foreground` (pricing-card.tsx:155).

### Step F — Component/card primitives

- [x] F1. Restyled at the primitive level (DRY): `card.tsx` (`rounded-cushion`+`shadow-cushion`+
  `border-border/60`), `button.tsx` (base `rounded-pill` + all size variants + default variant
  `hover:-translate-y-px shadow-cushion-outer`), `badge.tsx` (4 pastel accent variants added).
- [x] F2. `.texture-cushion` kept off the shared `<Card>` base (applied per-surface on hero/pricing
  wrappers instead) — a global card texture would over-apply grain to every small card site-wide,
  against the charter's "reserve for major surfaces" direction. Documented judgment call.

### Step G — Dark mode consistency pass

- [x] G1. Source-level dark-mode review (TG8): every restyled surface uses theme tokens with `.dark`
  variants — `bg-card`/`text-card-foreground`/`shadow-cushion` (dark shadow at globals.css:334),
  accent-*-foreground pairs (dark rows at globals.css:318-325), and `.dark .texture-cushion::before`
  (globals.css:386). Pricing-card's former hardcoded light-only values were removed, so it now reads
  correctly in cozy-dusk. No hardcoded light-only hex survives on the restyled surfaces.

### Step H — Visual verification (agent-probe, best-effort)

- [x] H1. `vc-agent-browser` unavailable (program-level known-gap per umbrella charter + Phase 1
  precedent). Substitute evidence: build/tsc/test green, TG4 grep = 7, live `next start` HTTP-200
  probe of `/pricing`, source-token/className review of all 6 surface types. TG9 = known-gap (D).
- [x] H2. Judgment vs charter "recognizably cozy-cushion/textured claymorphism" bar: MET at source
  level — every major surface now carries `rounded-cushion` (20-28px), dual `shadow-cushion`,
  `.texture-cushion` grain, pill buttons, and the pastel accent chip. Pixel-level confirmation
  remains the accepted known-gap.

---

## Exit Gate

```bash
corepack pnpm --filter web build
# Expected: exit 0

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: exit 0, no new regressions

grep -n "texture-cushion" apps/web/components/ui/header.client.tsx apps/web/app/page.tsx apps/web/app/pricing/page.tsx 2>/dev/null | wc -l
# Expected: >0 — confirms the texture utility is actually consumed on at least these high-traffic surfaces
```

- All Step A-H checklist items checked.
- header/sidebar/footer/landing/pricing/component-card surfaces visually reflect the cushion
  aesthetic (radius, dual shadow, texture, pill buttons) in both themes.
- Agent-probe checkpoint attempted (known-gap documented if unavailable).
- Build+typecheck+test green.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- header.client.tsx's cushion restyle genuinely requires structural changes beyond CSS/className
  (per the prior program's documented 27KB-file constraint) — STOP, do not refactor structure;
  document the limitation and route the deeper restructuring to backlog.
- Texture utility causes a measurable dark-mode legibility regression that cannot be tuned within
  budget — reduce texture opacity toward zero on the affected surface rather than shipping an
  unreadable state; document as a known-gap for Phase 5 or backlog follow-up.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [ ] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [ ] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [x] 5. EXECUTE — all Step A-H checklist items done; gates green (build 0 / tsc 0 / test 10/10 / TG4=7 / TG5 zero-logic-delta / TG7=1 logo)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/components/ui/header.client.tsx`, `footer.tsx`, sidebar component(s)
- `apps/web/app/page.tsx` / `page.client.tsx`
- `apps/web/app/pricing/page.tsx`
- Card/button/badge primitive components under `apps/web/components/ui/`

---

## Public Contracts

- No behavior/logic/state changes — CSS/className/token consumption only.
- No route or API changes.

---

## Verification Evidence

```bash
corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test
grep -n "texture-cushion" apps/web/components/ui/header.client.tsx apps/web/app/page.tsx apps/web/app/pricing/page.tsx 2>/dev/null | wc -l
# Expected: build/typecheck/test green; texture utility consumed on high-traffic surfaces
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-04-surface-restyle_PLAN_12-07-26.md`
- Last completed step: 5 EXECUTE (resumed + completed after dead-agent crash)
- Validate-contract status: CONDITIONAL (accepted), gates green
- Next step: EVL confirmation run (orchestrator spawns vc-tester to re-run TG1-TG4/TG7), then commit + UPDATE PROCESS

---

## Validate Contract

Status: CONDITIONAL
Date: 12-07-26
date: 2026-07-12
generated-by: outer-pvl

Parallel strategy: sequential
Rationale: signal score 1/7 — single feature-scoped restyle plan, bounded checklist, primitive
files (Card/Button/Badge) shared across Steps D/E/F so parallel EXECUTE would risk edit collision;
no schema/auth/API changes made by this plan (header.client.tsx contains auth code but the plan
scope excludes touching it).

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| TG1 | Build succeeds after restyle across all touched surfaces | Fully-Automated | `corepack pnpm --filter web build` exits 0 | A |
| TG2 | No new TypeScript errors introduced | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` exits 0 | A |
| TG3 | No vitest regressions (123-test baseline) | Fully-Automated | `corepack pnpm --filter web test` exits 0 | A |
| TG4 | `.texture-cushion` utility actually consumed on high-traffic surfaces | Fully-Automated | `grep -n "texture-cushion" apps/web/components/ui/header.client.tsx apps/web/app/page.tsx apps/web/app/pricing/page.tsx 2>/dev/null \| wc -l` returns >0 | A |
| TG5 | header.client.tsx restyle does not alter auth/billing conditional logic | Hybrid | Manual diff review — precondition: execute-agent must diff-review the file's `useAuth`/`useUser`/`stripe_*` blocks pre- and post-edit to confirm zero logic delta (not automatable; no existing test asserts this file's render conditions) | B |
| TG6 | Sidebar target file(s) correctly identified before edit | Hybrid | execute-agent confirms exact file(s) against Phase 0's route inventory / Phase 0 report before starting Step B — precondition: Phase 0 report available | B |
| TG7 | Pricing page Phase 1 logo fix still renders correctly post-restyle | Hybrid | execute-agent re-reads Phase 1 report and re-checks `/pricing` logo render — precondition: Phase 1 complete | B |
| TG8 | Dark mode legibility holds on all 6 restyled surface types | Agent-Probe | Spot-check header/sidebar/footer/landing/pricing/cards in "cozy dusk" dark mode; judge contrast/legibility against charter bar | A |
| TG9 | Visual cushion aesthetic recognizable per charter | Agent-Probe | Attempt `vc-agent-browser` screenshot checkpoints in light+dark; if unavailable, known-gap per prior program precedent — source-level token/className grep evidence substitutes | D |
| TG10 | `/pricing` route covered by automated a11y regression | Known-Gap | — not in current Playwright a11y matrix (`e2e/a11y.spec.ts` covers `/`, `/magic`, `/magic-chat`, `/studio`, `/api-access`, `/contest`, `/our-story`, `/templates` only) | D |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist / execute-agent instruction)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

Legacy line form:
- Build/typecheck/test: `corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test` | expected exit 0, no regressions
- Texture consumption: `grep -n "texture-cushion" apps/web/components/ui/header.client.tsx apps/web/app/page.tsx apps/web/app/pricing/page.tsx | wc -l` | expected >0
- header.client.tsx auth-safety: hybrid — manual diff review of useAuth/useUser/stripe_* blocks pre/post edit
- Visual cushion verification: agent-probe — vc-agent-browser screenshot checkpoints light+dark; known-gap if unavailable
- Pricing route a11y coverage: known-gap — documented, not in e2e/a11y.spec.ts route matrix

Dimension findings:
- Infra fit: PASS — all blast-radius files confirmed present on disk; no container/infra/runtime surfaces touched.
- Test coverage: CONCERN — zero existing test files cover header/footer/sidebar/pricing-card/landing components; `/pricing` absent from the Playwright a11y route matrix; automated coverage rests on build/typecheck/grep, not component-level assertions.
- Breaking changes: PASS — plan scoped to className/CSS only; Public Contracts confirm no route/API/behavior changes.
- Security surface: CONCERN — `apps/web/components/ui/header.client.tsx` mixes JSX markup with Clerk (`useAuth`, `useUser`) and Stripe (`stripe_customer_id`, `stripe_subscription_id`, `/api/stripe/get-subscription`) logic in one 717-line file; plan's own Step A3 blocker language already gates structural changes correctly, but execute-agent needs an explicit no-touch instruction for auth/billing code paths.
- Step A (Header) feasibility: CONCERN — mechanically feasible (78 existing className attributes); highest-risk edit is any change near the useAuth/useUser conditional blocks — mitigate by scoping strictly to JSX className props.
- Step B (Sidebar) feasibility: CONCERN — plan says target file "confirmed by Phase 0's route inventory" but currently only guesses between 4 candidate files (`ui/sidebar.tsx`, `settings-sidebar.tsx`, `sidebar-layout.tsx`, `studio-sidebar.tsx`); needs disambiguation before Step B starts.
- Step C (Footer) feasibility: PASS — file exists, no auth/billing hooks present, low risk.
- Step D (Landing) feasibility: PASS — page.tsx/page.client.tsx exist; card/badge/button primitives confirmed with existing rounded-*/shadow-* patterns to extend.
- Step E (Pricing) feasibility: CONCERN — pricing-card.tsx exists and is mechanically feasible; Step E2's cross-phase regression check against Phase 1's logo fix requires Phase 1 to actually be complete and its report available — currently Phase 1 has not run (program is at Phase 0).
- Step F (Primitives) feasibility: PASS — Card/Button/Badge confirmed genuinely shared; DRY consolidation approach sound.
- Step G (Dark mode) feasibility: PASS — `.dark` block already exists in globals.css; spot-check is a reasonable agent-probe task.
- Step H (Visual verification) feasibility: PASS — plan already documents the known-gap fallback path matching prior program precedent.

Open gaps:
- Sidebar target file(s) unconfirmed — execute-agent must disambiguate against Phase 0's route inventory before Step B (see execute-agent instruction E2 below).
- header.client.tsx auth/billing logic proximity risk — execute-agent must diff-review pre/post to confirm zero logic delta (execute-agent instruction E1).
- `/pricing` route not in Playwright a11y matrix: known-gap: documented as NEW PLAN REQUIRED — see backlog/pricing-a11y-coverage-gap_NOTE_12-07-26.md
- Program sequencing: this contract validates the Phase 4 plan artifact; EXECUTE for Phase 4 cannot legally start until Phase 3's exit gate is confirmed passed (Entry Gate dependency, umbrella Join Conditions) — this is expected sequential-program state, not a plan defect.

Execute-agent instructions (from Layer 2 CONCERNs, cannot be fixed in plan text alone):
- E1: Before editing header.client.tsx (Step A), diff-review the file's useAuth/useUser/stripe_* hook calls and any conditional JSX branches gated on them. Confirm zero logic/behavior delta pre- vs post-edit. Document confirmation in the phase report. Trigger: any edit inside or near lines containing useAuth/useUser/stripe_ references.
- E2: Before Step B, confirm the exact sidebar file(s) in scope by reading Phase 0's ground-truth report (route/component inventory). Do not guess between the 4 candidate files found during PVL (ui/sidebar.tsx, settings-sidebar.tsx, sidebar-layout.tsx, studio-sidebar.tsx) — settings/studio-specific sidebars are likely OUT of "high-traffic surface" scope; only the primary nav sidebar (main-page/sidebar-layout.tsx is the current best-guess primary candidate) should be restyled unless Phase 0 says otherwise. Trigger: Step B entry.
- E3: Before Step E2 (Phase 1 logo-fix regression check), re-read the Phase 1 phase report (`phase-01-logo-header-unification_REPORT_12-07-26.md`) rather than relying on this contract's knowledge — Phase 1 had not executed as of this PVL pass. Trigger: Step E2 entry.

What this coverage does NOT prove:
- TG1-TG3 (build/typecheck/test): do not prove the restyle is visually correct, only that it doesn't break compilation or existing logic-level tests. No existing test asserts header/footer/sidebar/pricing-card className values.
- TG4 (texture grep): proves the utility class string is present in the touched files' source; does not prove it renders visibly correct or with correct opacity/contrast at runtime.
- TG5 (auth diff review): a manual/hybrid check, not automated — relies on execute-agent diligence, not a test assertion. No regression test exists to catch a future accidental logic change in this file.
- TG6-TG7 (sidebar/pricing hybrid checks): depend on Phase 0/Phase 1 reports being accurate and available at EXECUTE time; if those reports are incomplete, these checks degrade to best-effort.
- TG8-TG9 (agent-probe): subjective judgment calls against the charter's "recognizably cozy-cushion" bar, not pixel-perfect or automated visual-regression proof; if `vc-agent-browser` is unavailable, TG9 is not proven at all beyond source-level grep evidence.
- TG10 (pricing a11y): genuinely unproven by any current automated gate — the `/pricing` route (this phase's highest-visibility card surface per Step E1) has zero WCAG/axe coverage.

Gate: CONDITIONAL (concerns noted, accepted per umbrella autonomous execution rules)
Accepted by: session (autonomous, /goal execution) — accepted concerns: test-coverage thinness on header/footer/sidebar/pricing-card/landing (TG10 known-gap backlogged), header.client.tsx auth-proximity risk (mitigated via execute-agent instruction E1, not blocking), sidebar file ambiguity (mitigated via execute-agent instruction E2, not blocking), pricing cross-phase dependency check (mitigated via execute-agent instruction E3, not blocking).
