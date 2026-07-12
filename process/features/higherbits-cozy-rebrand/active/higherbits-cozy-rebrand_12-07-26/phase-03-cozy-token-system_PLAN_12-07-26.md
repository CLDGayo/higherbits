---
name: plan:higherbits-cozy-rebrand-phase-03-cozy-token-system
description: "HigherBits Cozy Rebrand — Phase 03: Cozy claymorphism token system with texture utility (light + dark)"
date: 12-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-cozy-rebrand
  phase: phase-03
---

# Phase 03 — Cozy Token System

**Program:** higherbits-cozy-rebrand
**Umbrella plan:** process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/higherbits-cozy-rebrand-umbrella_PLAN_12-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-03-cozy-token-system_REPORT_12-07-26.md
**Hour budget:** 1.5h

---

## Purpose

Build the design-token foundation for the "cozy with textures" claymorphism visual language: a
soft pastel lavender/purple base palette with cream/off-white surfaces and pastel accent chips
(pink, peach/butter yellow, baby blue, mint); puffy card tokens (20-28px radius, dual soft shadow —
light outer drop + subtle inner highlight) PLUS a reusable CSS-only texture utility class (e.g.
`.texture-cushion`) that applies a subtle fabric/linen-grain or fine-noise surface overlay — via
layered radial/repeating gradients or a low-opacity inline SVG `feTurbulence` data-URI, never a
heavy image asset — so cards and page backgrounds read as tactile, not flat; rounded-everything
primitives (pill button radius, rounded input radius); warm friendly typography variables. A
derived dark mode ("cozy dusk": deep plum/charcoal surfaces with the same pastel accents and
texture) replaces the current near-black/teal dark identity. This phase is TOKENS ONLY — no
component-level restyle happens here (that's Phase 4); this phase's job is to make the tokens AND
the texture utility exist and be correctly wired through Tailwind so Phase 4 can consume them via
className.

---

## Entry Gate

- Phase 02 exit gate passed: zero remaining "21st" brand-string residue confirmed.

---

## Blast Radius

- `apps/web/app/globals.css` — `:root` and `.dark` CSS variable blocks
- `apps/web/tailwind.config.js` — token wiring into Tailwind's theme
- Possibly `apps/web/app/layout.tsx` if a new `next/font/google` rounded-sans font is added (must
  be explicitly noted and approved within this phase's plan before adding — see charter's hard
  safety constraint on new dependencies)

---

## Implementation Checklist

### Step A0 -- Confirmed current token state (Phase 0 research finding, 12-07-26)

- [x] A0. Current tokens confirmed at `apps/web/app/globals.css` lines ~220-306 (`:root` +
  `.dark`) and `apps/web/tailwind.config.js` lines ~47-107. Current baseline: light cream base
  `hsl(60 20% 95.1%)`, teal primary `hsl(180 67% 67%)`, `--radius: 1rem` (16px, single value, no
  scale), one `--shadow-soft` variable, NO texture utility class exists yet. This is the exact
  "before" state Steps A-C2b below must diff against and replace.
- [x] A0b. Fonts are already wired via `next/font/google` (Inter/Urbanist/Fira Code) -- Step D
  should evaluate whether these already read as warm/friendly enough before adding a new font;
  keep the existing `next/font/google` mechanism either way (do not switch font-loading strategy).

### Step A — Palette tokens (light)

- [ ] A1. Define the light-mode base surface tokens: cream/off-white background
  (e.g. `--background`), soft pastel lavender/purple as the primary accent
  (e.g. `--primary`), with a readable foreground/text color pairing confirmed for contrast.
- [ ] A2. Define pastel accent-chip tokens: pink, peach/butter yellow, baby blue, mint — as
  named CSS variables (e.g. `--accent-pink`, `--accent-peach`, `--accent-blue`, `--accent-mint`)
  usable for badges/chips/small UI accents.
- [ ] A3. Confirm the existing shadcn-style HSL CSS-variable convention (matching Phase 00's
  ground-truth read of the current `globals.css`) is followed so downstream Tailwind consumption
  (`hsl(var(--primary))` etc.) keeps working without a Tailwind-config restructure.

### Step B — Palette tokens (dark — "cozy dusk")

- [ ] B1. Define the dark-mode surface tokens: deep plum/charcoal background replacing the current
  near-black, with the SAME pastel accent hues from Step A2 adjusted for dark-mode contrast
  (typically lighter/more saturated versions).
- [ ] B2. Confirm dark-mode primary/accent contrast ratios are readable (do not silently regress
  accessibility — a mid-lightness pastel like lavender needs a carefully chosen foreground color).
- [ ] B3. Write the `.dark` variable block mirroring Step A's variable names with dark-appropriate
  values.

### Step C — Radius + shadow tokens (claymorphism)

- [ ] C1. Set `--radius` to a cushion-appropriate large value in the 20-28px range (or the
  equivalent rem value — confirm against Phase 00's "before" baseline of `--radius: 0.5rem` or
  whatever was found, and pick a value that reads as puffy without breaking existing layout
  assumptions that depend on `--radius`).
- [ ] C2. Define dual soft-shadow tokens for the puffy "cushion" card effect: a soft outer drop
  shadow (`--shadow-cushion-outer` or similar) plus a subtle inner highlight
  (`--shadow-cushion-inner` or similar, using `inset` box-shadow) — both light and dark variants,
  since dark-mode shadows typically need different opacity/color to read correctly against a dark
  background.
- [ ] C3. Define a rounded-pill button radius token if distinct from the general `--radius` (e.g.
  `--radius-pill: 9999px` for fully-rounded buttons) if Phase 4's pill-button requirement needs a
  separate value from card radius.

### Step C2b — Texture utility (CSS-only, no image assets)

- [ ] C4. Design a reusable `.texture-cushion` utility class (or equivalent named token/class) in
  `globals.css` that overlays a subtle fabric/linen-grain or fine-noise texture at very low opacity
  (e.g. 3-8%) using ONE of: (a) layered `repeating-linear-gradient`/`repeating-radial-gradient`
  CSS-only grain simulation, or (b) an inline SVG `feTurbulence` filter encoded as a `data:` URI
  background-image — no external/binary image assets, no new dependencies.
- [ ] C5. Define a dark-mode-appropriate texture variant (adjust opacity/blend-mode so the grain
  reads correctly against the deep plum/charcoal "cozy dusk" background — a texture tuned for cream
  will likely need lower opacity or a different blend-mode on dark surfaces).
- [ ] C6. Confirm the texture utility is genuinely reusable (a single class applied to any card/
  surface element) rather than a per-component one-off — this is the Phase 4 consumption contract.

### Step D — Typography tokens

- [ ] D1. Evaluate whether the existing font stack already reads as "warm/friendly/rounded" or
  whether a new `next/font/google` rounded-sans font (e.g. a font in the Quicksand/Comfortaa/
  Nunito family) is needed to hit the cozy direction — if adding a new font, this is the ONE
  explicitly sanctioned new-dependency case per the charter (Next.js built-in `next/font/google`,
  not an npm install) — document the choice and rationale in the phase report.
- [ ] D2. If a new font is added, wire it via `next/font/google` in `layout.tsx` following the same
  pattern as any existing font import, and expose it as a CSS variable for Tailwind consumption.
- [ ] D3. Increase base padding/spacing generosity via token or Tailwind spacing-scale note if the
  existing scale is too tight for the "generous padding" cushion direction — document as a Phase 4
  consumption note rather than changing the Tailwind spacing scale itself (spacing scale changes
  are higher-risk; prefer Phase 4 applying more generous spacing via existing scale values).

### Step E — Tailwind wiring

- [ ] E1. Wire all new CSS variables (Steps A-C2b) into `apps/web/tailwind.config.js`'s theme config
  so they're consumable as Tailwind utility classes (`bg-accent-pink`, `shadow-cushion`, etc.) —
  follow the exact pattern already used for existing tokens (Phase 00's ground truth read of the
  current config is the reference).
- [ ] E2. Confirm the pill-button radius and rounded-sidebar-rail direction from the charter can be
  expressed via the wired tokens without needing new arbitrary Tailwind values scattered through
  Phase 4's component edits.

### Step F — Verify tokens don't break existing rendering

- [ ] F1. Confirm build/typecheck/test still pass after the token swap — tokens changing values
  should not break any test that asserts specific color/class values (if any exist, they need
  updating as part of this phase, not deferred).
- [ ] F2. Spot-check (agent-probe or manual) that at least the landing page renders without visual
  breakage (not full restyle yet — just confirm nothing is broken, e.g. text becomes invisible due
  to a bad contrast token).

---

## Exit Gate

```bash
corepack pnpm --filter web build
# Expected: exit 0

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: exit 0, no new regressions

grep -n "radius" apps/web/app/globals.css
# Expected: matches confirming the new cushion-radius value is present

grep -n "shadow" apps/web/app/globals.css
# Expected: matches confirming dual soft-shadow tokens are present

grep -n "texture-cushion" apps/web/app/globals.css
# Expected: matches confirming the reusable texture utility class is present
```

- All Step A-F checklist items checked (including Step C2b texture utility).
- Light + dark palette tokens present (pastel lavender/cream base + pink/peach/blue/mint accents,
  cozy-dusk dark variant).
- Cushion radius (20-28px range), dual soft-shadow tokens, AND `.texture-cushion` reusable CSS-only
  texture utility (light + dark variants) present.
- Tokens wired through `tailwind.config.js` and consumable as utility classes.
- Build+typecheck+test green.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- A dark-mode pastel accent combination fails basic contrast/readability and cannot be resolved
  within budget — document the specific token and defer final tuning to Phase 4 or 5 rather than
  blocking the whole phase.
- Adding a new Google Font would require more than the sanctioned `next/font/google` built-in
  mechanism (e.g. a font not available via Google Fonts) — fall back to an existing system/Tailwind
  font stack and document the decision rather than adding an unsanctioned dependency.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked. COMPLETE 12-07-26 -- current token locations + values confirmed (see supplement below).
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

- `apps/web/app/globals.css`
- `apps/web/tailwind.config.js`
- `apps/web/app/layout.tsx` (only if a new font is added — explicitly sanctioned, documented case)

---

## Public Contracts

- No component behavior changes — CSS variable values and Tailwind theme wiring only.
- Any new font addition uses `next/font/google` (Next.js built-in), not a new npm dependency.

---

## Verification Evidence

```bash
corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test
grep -n "radius\|shadow" apps/web/app/globals.css
# Expected: build/typecheck/test green; cushion radius + dual shadow tokens present
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-03-cozy-token-system_PLAN_12-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1), after Phase 02 exit gate confirmed passed

---

## Validate Contract

Status: CONDITIONAL
Date: 12-07-26
date: 2026-07-12
generated-by: outer-pvl

Parallel strategy: sequential
Rationale: Score 0-1/7 (single-domain CSS token plan, self-contained, no schema/auth/API surface,
<5 blast-radius files, no multi-package scope, no container/infra touch). Sequential (one
vc-execute-agent) is correct; no fan-out needed for EXECUTE.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| A1-A3 | Light-mode pastel lavender/cream palette + accent-chip tokens defined | Fully-Automated | `command grep -n "background\|primary\|accent-pink\|accent-peach\|accent-blue\|accent-mint" apps/web/app/globals.css` + build/tsc | A |
| B1-B3 | Dark-mode "cozy dusk" palette mirrors light tokens with dark-appropriate values | Fully-Automated | `command grep -c "accent-pink\|accent-peach\|accent-blue\|accent-mint" apps/web/app/globals.css` (matches must appear inside BOTH `:root` and `.dark` blocks) + build | A |
| B2 | Dark-mode pastel accent contrast/readability | Agent-Probe | Manual/agent visual judgment of rendered accent-on-background contrast in dark mode — no automated WCAG contrast tool exists in this repo | D |
| C1-C3 | Cushion radius (20-28px range) + dual soft-shadow tokens + optional pill-radius token | Fully-Automated | `command grep -n "radius" apps/web/app/globals.css` (plan's own exit-gate command) | A |
| C4-C6 | `.texture-cushion` CSS-only reusable texture utility, light+dark variants, no image assets | Fully-Automated | `command grep -c "texture-cushion" apps/web/app/globals.css` — confirmed 0 pre-EXECUTE (baseline), must be ≥1 post-EXECUTE | A |
| D1-D3 | Typography evaluation; optional new font strictly via `next/font/google` (no npm install) | Hybrid | `command grep -n "next/font/google" apps/web/app/layout.tsx` — precondition: only applies if Step D1 decides a new font is needed | A |
| E1-E2 | Tokens wired into `tailwind.config.js` theme, consumable as Tailwind utility classes | Fully-Automated | `command grep -n "var(--radius)\|var(--shadow" apps/web/tailwind.config.js` + build | A |
| F1 | Build/typecheck/test remain green after token value swap, zero regressions | Fully-Automated | `corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test` | A |
| F2 | Landing page renders without visual breakage post-token-swap | Agent-Probe | Manual/agent-browser screenshot spot-check of `/` in light+dark mode — known-gap substitute: source-token grep evidence, per `higherbits-redesign` program precedent, if `agent-browser` is unavailable | D |
| downstream-consumers | `--radius`/`--shadow-soft` value change does not break the 3+6 files outside this phase's blast radius that consume these variables by name (`shimmer-button.tsx`, `lib/defaults.ts`, `lib/sandpack.tsx`, plus 6 `shadow-soft` consumers) | Fully-Automated | Same F1 build/typecheck/test run — variable NAMES are unchanged (values only), so breakage would surface as a build/type error or visual regression | B |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist — execute-agent instruction E1 below)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies (Fully-Automated /
Hybrid / Agent-Probe). Known-Gap is never a `strategy:` value — the two Agent-Probe rows above
(B2, F2) carry their known-gap substitute inline in the "proving test" cell per program-charter
precedent, not as a separate strategy.

Legacy line form (retained so existing validate-contract consumers still parse):
- Token palette + radius/shadow/texture: Fully-automated: `corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test` + `command grep -n "radius\|shadow\|texture-cushion" apps/web/app/globals.css`
- Dark-mode contrast + visual spot-check: Agent-probe: manual/agent-browser judgment; known-gap substitute is source-token grep evidence per program precedent if `agent-browser` unavailable

Failing stub:
```
test("should define light-mode pastel lavender/cream palette + accent chip tokens", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: light-mode pastel lavender/cream palette + accent chips defined")
})
```

Failing stub:
```
test("should mirror dark-mode cozy-dusk palette with same accent hues", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: dark-mode cozy dusk palette mirrors light tokens")
})
```

Failing stub:
```
test("should set cushion radius 20-28px range and dual soft-shadow tokens", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: cushion radius + dual soft-shadow tokens present")
})
```

Failing stub:
```
test("should define reusable .texture-cushion CSS-only utility for light and dark", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: .texture-cushion reusable texture utility present, light+dark variants")
})
```

Failing stub:
```
test("should wire new tokens into tailwind.config.js theme for utility-class consumption", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: tokens wired through tailwind.config.js")
})
```

Failing stub:
```
test("should keep build/typecheck/test green after token value swap with zero regressions", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: build+typecheck+test pass after token swap")
})
```

Dimension findings:
- Infra fit: PASS — pure CSS/design-token files (`globals.css`, `tailwind.config.js`), no container/runtime/infra surface touched
- Test coverage: CONCERN — dark-mode contrast (B2) and visual spot-check (F2) are agent-probe only; no automated WCAG contrast tool exists in this repo. Acceptable per the umbrella charter's own "agent-probe tier ... known-gap if unavailable" allowance
- Breaking changes: CONCERN — `--radius` (3 consumer files: `shimmer-button.tsx`, `lib/defaults.ts`, `lib/sandpack.tsx`) and `--shadow-soft` (6 consumer files, incl. `studio/page.tsx`, `magic-chat/page.client.tsx`, `features/magic/*`) are consumed by name outside this phase's Blast Radius list. Safe only if variable NAMES stay stable (values only change) — plan already commits to this; recorded as execute-agent instruction E1 below to make it explicit rather than assumed
- Security surface: PASS — zero auth/billing/schema/API/secrets/trust-boundary surface touched

Open gaps:
- Automated WCAG contrast-ratio tooling does not exist in this repo (known-gap: documented, agent-probe substitute accepted)
- `agent-browser` availability for the F2 visual spot-check is unconfirmed in this environment (known-gap: documented, source-token grep evidence accepted as substitute per `higherbits-redesign` program precedent)

Execute-agent instructions:
| # | Instruction | Trigger condition |
|---|---|---|
| E1 | Do NOT rename `--radius` or `--shadow-soft` CSS variable names — only change their values. `shimmer-button.tsx`, `lib/defaults.ts`, `lib/sandpack.tsx` (radius) and 6 files consuming `shadow-soft` (`studio/page.tsx`, `magic-chat/page.client.tsx`, `features/magic/features.tsx`, `features/magic/how-it-works.tsx`, `features/magic/magic-header.tsx`, `globals.css` itself) depend on these exact names outside this phase's blast radius. Confirm F1 build/typecheck/test catches any accidental rename before reporting DONE. | Steps C1-C2 |
| E2 | If Step D1 decides a new font is needed, use `next/font/google` only (no npm install) and document the choice/rationale in the phase report — this is the one charter-sanctioned new-dependency case for this program. | Step D |
| E3 | Run exit-gate greps with `command grep` or explicit path scoping — never bare `rg` (shadowed by BSD grep on this machine), never traverse `.next`. | All exit-gate verification |

What this coverage does NOT prove:
- Fully-Automated build/typecheck/test gates prove the tokens exist, are syntactically valid, and
  do not break the build or any existing test — they do NOT prove the tokens visually read as
  "cozy claymorphism" (puffy, pastel, tactile) to a human viewer; that judgment is deferred to
  Phase 4 (surface restyle, where tokens are actually applied via className) and this phase's F2
  agent-probe spot-check.
- The `texture-cushion` grep proves the class exists in source; it does NOT prove the texture is
  visually subtle/correct at the specified opacity range or that the `feTurbulence`/gradient
  technique renders without performance cost — no automated visual-diff tool exists in this repo.
- The `--radius`/`--shadow-soft` downstream-consumer safety net (F1) proves no build/type error and
  no test regression; it does NOT prove those 9 consumer files still look visually correct at the
  new radius/shadow values — visual correctness for consumers outside this phase's scope is
  implicitly deferred to whichever later phase or manual check first renders them.
- Dark-mode contrast (B2) has no automated WCAG ratio check — a technically-passing build could
  still ship a low-contrast pastel/background pairing that a human would flag.
(Required until C3 is implemented — temporary C3 mitigation)

Gate: CONDITIONAL (concerns noted, user accepted)
Accepted by: session (autonomous PVL run per delegated VALIDATE task) — accepted concerns: (1) test-coverage agent-probe-only gap on dark-mode contrast (B2) and visual spot-check (F2), resolution: known-gap substitute per `higherbits-redesign` program precedent; (2) breaking-changes downstream-consumer note on `--radius`/`--shadow-soft`, resolution: execute-agent instruction E1 requires name-stability + F1 gate coverage


## Inner Loop Refresh Note

**Date:** 12-07-26
**Trigger:** Phase 0 RESEARCH (inner-loop Step 1) completed -- findings folded into this plan.
**Sections changed:** Implementation Checklist (new Step A0 confirmed current token state)
**Summary:** Confirmed exact current token locations and values: globals.css lines ~220-306,
tailwind.config.js lines ~47-107. Current baseline is light cream hsl(60 20% 95.1%) background,
teal primary hsl(180 67% 67%), single --radius: 1rem (16px), single --shadow-soft variable, no
texture utility. Fonts already use next/font/google (Inter/Urbanist/Fira Code) -- keep mechanism,
just evaluate whether a new rounded font is still needed for the cozy direction.
