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
**Phase status:** ⏳ PLANNED
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

- [ ] A1. Apply pill-shaped radius to header buttons/search input using the wired tokens.
- [ ] A2. Apply `.texture-cushion` (or the Phase 3 texture utility) to the header background or
  header-adjacent surface where it reads naturally — do not over-apply texture to every element;
  reserve it for card/panel surfaces per the charter's "visible soft grain" direction.
- [ ] A3. Confirm no structural/behavioral change to header.client.tsx — className/CSS edits only.
  If the cushion restyle appears to require restructuring the component, STOP and route to
  backlog per the prior program's documented constraint on this file.

### Step B — Sidebar

- [ ] B1. Apply rounded sidebar rail treatment (large radius on sidebar container/panel edges)
  per the charter's "rounded sidebar rail" requirement.
- [ ] B2. Apply cushion card treatment (radius + dual shadow + `.texture-cushion`) to sidebar
  panel sections if visually appropriate.

### Step C — Footer

- [ ] C1. Apply cushion token palette (pastel accents, warm typography) to footer surface.
- [ ] C2. Confirm footer remains a low-texture/flatter surface if texture would compete visually
  with more prominent card surfaces — execute-agent's judgment call, documented in report.

### Step D — Landing page

- [ ] D1. Apply cushion card treatment (20-28px radius, dual soft shadow, `.texture-cushion`) to
  landing-page component preview cards / feature cards.
- [ ] D2. Apply pastel accent chips (pink/peach/blue/mint) to badges, tags, or small UI accents on
  the landing page per the charter's accent-chip direction.
- [ ] D3. Apply generous padding/spacing per Phase 3's spacing-generosity note.
- [ ] D4. Apply pill-button radius to primary CTAs.

### Step E — Pricing page

- [ ] E1. Apply cushion card treatment to pricing tier cards (this is the highest-visibility card
  surface on the page — prioritize getting radius + shadow + texture right here).
- [ ] E2. Confirm the Phase 1 logo-restoration fix on this route is still correctly rendering
  after the restyle (regression check against Phase 1's fix).
- [ ] E3. Apply pill-button radius to pricing CTAs.

### Step F — Component/card primitives

- [ ] F1. Identify the shared card/button/badge primitive components consumed across multiple
  high-traffic surfaces (Step D/E likely reuse the same underlying `<Card>`/`<Button>` primitives
  — restyle at the primitive level where possible instead of per-surface overrides, to keep the
  change DRY and consistent).
- [ ] F2. Apply `.texture-cushion` to the shared card primitive if it is genuinely shared (avoids
  repeating the texture-application work per surface in Steps A-E).

### Step G — Dark mode consistency pass

- [ ] G1. Spot-check each restyled surface (header, sidebar, footer, landing, pricing, cards) in
  dark ("cozy dusk") mode — confirm the texture utility's dark variant (Phase 3 Step C5) reads
  correctly and contrast/legibility holds.

### Step H — Visual verification (agent-probe, best-effort)

- [ ] H1. Attempt `vc-agent-browser` (or equivalent) screenshot checkpoints of the 5 restyled
  surfaces in both light and dark mode. If unavailable, document as known-gap (per the prior
  higherbits-redesign program's precedent) — source-level token/className evidence substitutes.
- [ ] H2. Record the agent-probe judgment (or known-gap note) in the phase report against the
  charter's "recognizably cozy-cushion/textured claymorphism" bar.

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
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
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
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1), after Phase 03 exit gate confirmed passed

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
