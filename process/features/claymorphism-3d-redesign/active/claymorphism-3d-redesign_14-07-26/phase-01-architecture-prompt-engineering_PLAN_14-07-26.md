---
name: plan:claymorphism-3d-redesign-phase-01-architecture-prompt-engineering
description: "Claymorphism + 3D Pastel Soft UI — Phase 01: Architecture & Prompt Engineering"
date: 14-07-26
metadata:
  node_type: memory
  type: plan
  feature: claymorphism-3d-redesign
  phase: phase-01
---

# Phase 01 — Architecture & Prompt Engineering

**Program:** claymorphism-3d-redesign
**Umbrella plan:** process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/claymorphism-3d-redesign-umbrella_PLAN_14-07-26.md
**Phase status:** COMPLETE
**Report destination:** process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-01-architecture-prompt-engineering_REPORT_14-07-26.md (flat in the program task folder)

---

## Purpose

Audit the EXISTING cozy-daylight/cozy-dusk token system (shipped by higherbits-cozy-rebrand,
13-07-26) and extend it with the specific architecture this program needs: exact pastel palette
hex codes for lavenders/soft pinks/warm creams, confirmation/adoption of a rounded geometric sans
typeface (Poppins or Quicksand — repo already uses a Quicksand-family stack), a global CSS
variable system for the claymorphism triple-shadow structure (light inner-shadow top-left + dark
inner-shadow bottom-right + soft outer drop shadow) layered on top of the existing `--radius`
scale, and a versioned library of Gemini prompt templates that will produce consistent matte-clay
3D assets (texture, isometric angle, lighting) in Phase 2. This phase is architecture and
documentation only — no new components, no asset generation, no page changes.

---

## Entry Gate

- Program start (Phase 0 = this umbrella plan)
- `apps/web/app/globals.css` cozy-daylight/cozy-dusk tokens exist and are readable

---

## Blast Radius

- `apps/web/app/globals.css` (extend existing `:root`/`.dark` blocks — add triple-shadow vars, do not remove existing vars)
- New doc file: `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/gemini-prompt-templates_REF_14-07-26.md` (prompt template library, colocated in task folder)
- Repo-root env-example file (NEW FILE — first-ever in this repo) — minimal `GEMINI_API_KEY=` entry (documentation only, no live key)

---

## Implementation Checklist

### Step A — Audit existing token system

- [x] A1. Read `apps/web/app/globals.css` in full; extract the current cozy-daylight/cozy-dusk
      color variables, `--radius`/`--radius-pill`/`--radius-sm` scale, and the existing
      `.texture-cushion` utility definition.
- [x] A2. Read the higherbits-cozy-rebrand Phase 03 (`phase-03-cozy-token-system_PLAN_12-07-26.md`
      and its `_REPORT_`) to confirm exactly which tokens already exist vs. which this phase adds.
- [x] A3. Confirm the current typeface stack (expected: Quicksand-family) via
      `grep -n "font-family\|Quicksand\|Poppins" apps/web/app/globals.css apps/web/app/layout.tsx`.

### Step B — Define exact palette + typeface spec

- [x] B1. Document exact HSL/hex values for: primary lavender, soft pink, warm cream, reusing
      existing `--accent-pink`/`--accent-peach`/`--accent-blue`/`--accent-mint` vars where they
      already match. **LOCKED (INNOVATE decision, 14-07-26): exactly ONE new accent pair** —
      `--accent-yellow` + `--accent-yellow-foreground` (light + dark) — following the existing
      accent HSL structure and light→dark transform pattern already used by the pink/peach/blue/
      mint vars. No other new accent hues in this phase; the existing 4 pairs plus this new
      yellow pair cover the full reference aesthetic. **Acceptance addition:** run an explicit
      WCAG contrast-ratio check on the new `--accent-yellow`/`--accent-yellow-foreground` pair in
      BOTH themes (light + dark) — do not rely on pattern-matching the sibling pairs; the Axe a11y
      gate (existing Playwright suite) is the backstop, not the primary check.
- [x] B2. Confirm typeface: keep Quicksand-family (already shipped) unless a concrete rendering
      gap is found; do not introduce Poppins unless Quicksand is proven insufficient for the 3D
      dashboard look.

### Step C — Design the triple-shadow CSS variable system (LOCKED — INNOVATE decision, 14-07-26)

**Decision:** NEW additive `--clay-*` var namespace (not a rename/replace of existing
`--shadow-cushion-*` vars — both families coexist; document the distinction in a CSS comment
block mirroring `.texture-cushion` style). True diagonal triple-shadow: light inset top-left +
dark inset bottom-right + soft outer drop. 3 depth tiers, not a continuous scale. Plus a
`--clay-pressed` inverted-shadow state token (consumed by Phase 5 micro-interactions — do not
wire interaction JS in this phase, token only). Both `:root` and `.dark` entries required
(next-themes class toggle already in place).

- [x] C1. Add new CSS custom properties to `:root` and `.dark` in `globals.css`:
      `--clay-shadow-light` (light inset highlight, top-left, e.g. `inset 2px 2px 4px`),
      `--clay-shadow-dark` (dark inset shadow, bottom-right, e.g. `inset -2px -2px 4px`),
      `--clay-shadow-outer` (soft outer drop shadow) — as `box-shadow` value fragments, composable
      via a `.clay-surface` utility class using multiple comma-separated `box-shadow` layers
      (2 inset + 1 outer). Existing `--shadow-cushion-*` vars are left untouched.
- [x] C2. Add 3 discrete depth-tier vars: `--clay-depth-sm` (inputs/small pills), `--clay-depth-md`
      (cards/buttons), `--clay-depth-lg` (hero panels/large dashboard tiles) — each a full
      composed `box-shadow` value (not a scalar multiplier), so components select depth by var
      name only. Add `--clay-pressed` (inverted-shadow state token: light/dark inset positions
      swapped) for Phase 5 consumption — declare the var now, do not wire any interaction.
- [x] C3. Write ONE hand-written `.clay-surface` CSS class (CSS-only, no JS, no Tailwind config
      changes) in `globals.css` — mirrors the existing `.texture-cushion` precedent: doc comment
      block explaining the light-TL/dark-BR/outer layering and the coexistence with
      `--shadow-cushion-*`, theme-aware (`.dark .clay-surface` override reads from the `.dark`
      block's `--clay-*` vars). **Tailwind `shadow-clay-*` utility registration in
      `tailwind.config.js` is explicitly DEFERRED to Phase 3 on-demand — do not touch
      `tailwind.config.js` in this phase.**

### Step D — Write the Gemini prompt template library (LOCKED — INNOVATE decision, 14-07-26)

**Decision:** ONE `_REF_` doc combining human-readable prose PLUS an embedded machine-parseable
JSON block per template: `{id, stylePrefix, subjectTemplate, negativePrompt, aspectRatio,
paletteHex[]}`. A single shared `stylePrefix` block is reused across all templates and locks:
matte clay 3D render, soft pastel colors, no gloss/specular, single soft key light, isometric or
3/4 angle, transparent background, plus the exact palette hexes from Step B.

- [x] D1. Draft prompt templates (in the new `_REF_` doc) for exactly 3 per-asset-type templates:
      (a) 3D soft-clay UI icons (nav/feature/interaction icons — play button, heart, dashboard
      tile), (b) larger 3D illustrations/avatars (characters, plants, abstract shapes), (c)
      subtle matte/soft-noise background textures. Each template = prose description + the JSON
      block shape above. Each `negativePrompt` MUST explicitly ban baked-in drop shadows (CSS
      supplies the real shadow via `.clay-surface` — generated assets must not carry their own).
- [x] D2. Include the exact palette hex codes from Step B in each template's `paletteHex[]` array
      so generated assets color-match the token system.
- [x] D3. Note the target Gemini model as the literal placeholder text `"CONFIRM AT PHASE 2"` —
      **never hardcode a real model id in this doc.** Phase 2 confirms the exact model id via
      `vc-docs-seeker` before wiring it into the ops script.

### Step E — Env gap documentation (LOCKED — INNOVATE decision, 14-07-26; NEW FACTS folded in)

**Confirmed by research (14-07-26): no repo-root env-example file exists anywhere in this repo —
this is the repo's FIRST-EVER one.** Keep it minimal per the locked decision: `GEMINI_API_KEY=` +
one-line comment only. Do NOT attempt a full ~15-var backfill (Clerk, Stripe, Qdrant, R2, etc.) in
this phase — that is separate housekeeping, out of scope here (see Backlog note below).

**NEW FACT (confirmed 14-07-26): `GEMINI_API_KEY` now EXISTS in `apps/web/.env.local`** (user
provisioned it same-day). Phase 2's prior "key absent" hard-stop is CLEARED for live generation —
Phase 2 can proceed to live Gemini calls once its own pre-conditions are met.

**NEW ENV-LOADING WRINKLE (record as a Phase 2 pre-condition/research item, do not resolve now):**
plain Node scripts under `ops/` do NOT auto-load `apps/web/.env.local` (that's Next.js-only
runtime behavior). Phase 2's asset-generation pipeline (a Node/ops script) must either explicitly
load env from `apps/web/.env.local`, or the user duplicates the key to a root env file. Do not
resolve this in Phase 1 — carry it into Phase 2's RESEARCH step as an explicit pre-condition.

- [x] E1. Create a repo-root env-example file (first-ever) with a minimal single entry:
      `GEMINI_API_KEY=` plus one comment line noting it's required for Phase 2 asset generation.
      Do not add any other vars in this phase.
- [x] E2. Record in the phase report that `GEMINI_API_KEY` is now present in
      `apps/web/.env.local` (do not print the value) and flag the env-loading wrinkle above as a
      Phase 2 pre-condition. Also file a backlog NOTE (or note inline in this plan if a backlog
      artifact is disproportionate) for the deferred full env-example var backfill as separate
      housekeeping, out of scope for this program.

---

## Exit Gate

```bash
# Build must stay green after token additions (additive only, no removals)
corepack pnpm --filter web build
# Expected: exit 0

# Type gate
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

# No regression in existing tests
corepack pnpm --filter web test
# Expected: same pass count as baseline (123/123) or higher, zero new failures

# No new heavy deps introduced (should be none in this phase — CSS/doc only)
git diff --stat apps/web/package.json
# Expected: no diff, or no new heavy 3D/animation deps added
```

- All checklist items (A1-E2) checked
- Palette hex codes, typeface decision, triple-shadow CSS vars, and Gemini prompt template doc
  all exist and are internally consistent (same hex codes appear in both globals.css and the
  prompt template doc)
- Phase report written to report destination above, including the GEMINI_API_KEY presence/absence
  finding from E2

---

## Blockers That Would Justify BLOCKED Status

- `apps/web/app/globals.css` structure has diverged so far from the documented cozy-rebrand
  shape that "extend, don't replace" is not safely possible without a wider refactor (escalate to
  plan-supplement, do not silently widen scope)
- No accessible reference for confirming Quicksand vs Poppins rendering fidelity (accept as
  known-gap, keep Quicksand, document rationale)

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read (higherbits-cozy-rebrand Phase 03); test context loaded; plan drift checked against current globals.css; confirmed GEMINI_API_KEY now present in apps/web/.env.local and no repo-root env-example file exists
- [x] 2. INNOVATE — innovate-agent: approach decided (extend with new `--clay-*` namespace, one new accent pair, single `.clay-surface` utility, combined prose+JSON prompt template doc); Decision Summary locked 14-07-26
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated with locked INNOVATE decisions (Steps B/C/D/E) and new facts (GEMINI_API_KEY present, env-loading wrinkle, no env-example precedent, stale-context-doc note, optional hex-crosscheck script)
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md`
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — 5/6 gates independently confirmed green by vc-tester; a11y gate FAIL accepted as known-gap (4 pre-existing muted-foreground contrast violations, not caused by this phase's additive-only diff); follow-up stubs registered; EVL HANDOFF SUMMARY written (see phase-01-architecture-prompt-engineering-evl-iteration-001_REPORT_15-07-26.md)
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/app/globals.css` (extended)
- `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/gemini-prompt-templates_REF_14-07-26.md` (new)
- Repo-root env-example file (new — first-ever in this repo; add GEMINI_API_KEY entry)

---

## Public Contracts

- No changes to existing color variable names or values — only additive new vars.
- No component behavior change — this phase is tokens + docs only.
- Existing `--shadow-cushion-*` family stays untouched; `--clay-*` is a fully separate, additive namespace.
- No `tailwind.config.js` changes in this phase (deferred to Phase 3).

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `corepack pnpm --filter web build` exits 0 after token additions | Fully-Automated | Extended tokens are additive, not breaking |
| `corepack pnpm --filter web exec tsc --noEmit` exits 0 | Fully-Automated | No type regressions from CSS changes (n/a for CSS but confirms no incidental file breakage) |
| `corepack pnpm --filter web test` — no new failures vs 123/123 baseline | Fully-Automated | No behavioral regression from token extension |
| Manual read-through: palette hex codes match between globals.css and prompt-templates doc | Agent-Probe | Prompt templates will color-match the shipped token system |
| `.clay-surface` utility renders 3 distinct shadow layers (2 inset + 1 outer) | Agent-Probe | Triple-shadow structure matches the claymorphism spec (light TL / dark BR / soft outer) |
| WCAG contrast-ratio check on `--accent-yellow`/`--accent-yellow-foreground` in both themes | Agent-Probe | New accent pair meets accessibility bar independent of sibling-pattern assumption |
| Axe a11y Playwright suite (existing) — no new violations | Hybrid | Backstop confirmation of accessible contrast/markup across affected routes |

```bash
corepack pnpm --filter web build
corepack pnpm --filter web exec tsc --noEmit
corepack pnpm --filter web test
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-01-architecture-prompt-engineering_PLAN_14-07-26.md`
- Last completed step: Step 4 (PVL) — validate-contract written, Gate: PASS
- Validate-contract status: written (14-07-26) — Gate: PASS
- Supporting context loaded: umbrella plan charter/hard stops; higherbits-cozy-rebrand token history (referenced, not re-read line-by-line this pass); repo-root env-example absence confirmed via file listing
- Next step: Spawn vc-execute-agent for Step 5 (EXECUTE) against this validated plan

---

## Test Infra Improvement Notes

- Optional (nice-to-have, not gate-blocking): a small Node script cross-checking hex values
  between `globals.css` custom properties and the `gemini-prompt-templates_REF_14-07-26.md` JSON
  blocks — would convert the current Agent-Probe "hex codes match" check into a Fully-Automated
  gate. Not required for this phase's exit gate; consider adding during EXECUTE if time permits,
  otherwise carry to backlog.
- (Added at PVL, 14-07-26) A second optional script: validate each prompt-template JSON block is
  parseable and carries the required fields (`id, stylePrefix, subjectTemplate, negativePrompt,
  aspectRatio, paletteHex[]`) — see validate-contract Execute-agent instruction E2.

---

## Known Context Drift (for UPDATE PROCESS follow-up)

- `process/context/all-context.md` currently claims Git LFS + `.gitattributes` +
  `apps/web/public/previews/**` tracking exists (from the Phase 17 multi-demos note). Research for
  this phase found no such tracking on disk. Do not fix in this phase (out of blast radius) — flag
  as a `vc-audit-context` follow-up item at UPDATE PROCESS.

---

## Validate Contract

Status: PASS
Date: 14-07-26
date: 2026-07-14
generated-by: inner-pvl: phase-1

Parallel strategy: sequential
Rationale: Signal score 1/7 (only S4 — phase-program classification present; no multi-package
scope, no schema/API/auth surface, no 3+ open directions since INNOVATE already locked the
approach, no high-risk class, blast radius is 3 files not 5+). Layer 1's four dimension agents
and the Layer 2 section review were both performed sequentially in this single validate-agent
session (no Task/Agent-spawn tool available in this run) — findings below reflect that analysis
performed directly rather than via separate parallel subagent transcripts.

Plan updates applied:
- P1: Corrected the Tailwind config filename reference (the actual file on disk is
  `apps/web/tailwind.config.js`, Tailwind v3.4.14 classic JS config — confirmed via
  `find apps/web -maxdepth 1 -iname "tailwind*"`; the plan had referenced a nonexistent `.ts`
  file). Fixed at Step C3 and the Public Contracts section so Phase 3 does not go looking for a
  file that does not exist. Applied directly to the plan body during this VALIDATE pass (2 sites
  in Step C3, 1 site in Public Contracts).

Execute-agent instructions:
- E1: When adding the `--accent-yellow`/`--accent-yellow-foreground` pair (B1), compute the WCAG
  contrast ratio by hand (HSL → relative luminance → ratio) against the paired background/foreground
  token in BOTH `:root` and `.dark` before committing the chosen hex/HSL values — do not
  pattern-match the sibling accent pairs without checking. If a contrast-ratio helper script is
  quick to add (mirrors the existing "Test Infra Improvement Notes" hex-crosscheck idea), prefer
  writing it under `apps/web/scripts/` or `ops/` so it becomes reusable for future accent pairs;
  otherwise the manual calculation is sufficient for this architecture-only phase.
- E2: Optional (non-blocking): if time permits during EXECUTE, add a tiny `node --test` script
  validating that each JSON block in `gemini-prompt-templates_REF_14-07-26.md` is valid JSON with
  the required fields (`id, stylePrefix, subjectTemplate, negativePrompt, aspectRatio,
  paletteHex[]`) — converts an Agent-Probe check into Fully-Automated for Phase 2's benefit. If
  skipped, carry forward via the plan's existing "Test Infra Improvement Notes" section.
- E3: Confirm the exact `:root`/`.dark` insertion points before editing — current line numbers in
  `apps/web/app/globals.css` (as of this VALIDATE pass, 14-07-26) are approximately: accent chip
  block `:root` lines 250-257, `--shadow-cushion-*` `:root` lines 270-274, `.dark` accent chips
  318-325, `.dark` `--shadow-cushion-*` 334-338, `.texture-cushion` utility ~350-390. Lines will
  have drifted slightly by EXECUTE time — re-grep for `--shadow-cushion-outer` and
  `--accent-mint-foreground` to find the live insertion point rather than trusting these numbers
  verbatim.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| A1-A3 | Existing cozy-daylight/cozy-dusk token system + Quicksand typeface confirmed before extension | Fully-Automated | `grep -n "font-family\|Quicksand\|Poppins" apps/web/app/globals.css apps/web/app/layout.tsx` shows Quicksand wired | A |
| B1 | New `--accent-yellow`/`--accent-yellow-foreground` pair added (light+dark), WCAG contrast checked | Agent-Probe | Manual HSL→luminance→contrast-ratio calculation against paired background token in both themes (see Execute-agent instruction E1) | A |
| C1-C3 | `--clay-*` triple-shadow tokens (light/dark/outer + 3 depth tiers + `--clay-pressed`) and `.clay-surface` utility added, additive-only, no `--shadow-cushion-*` mutation | Fully-Automated + Agent-Probe | `corepack pnpm --filter web build` exits 0 (additive-safety) AND agent visual read of the composed `box-shadow` value confirms 2 inset layers (light TL, dark BR) + 1 outer drop | A |
| Downstream consumer regression | Existing `--shadow-cushion-*`/`.texture-cushion` consumers (9 files: card.tsx, footer.tsx, pricing-card.tsx, hero-section.tsx, header.client.tsx, button.tsx, globals.css, page.tsx, pricing/page.tsx) stay unaffected | Fully-Automated | `corepack pnpm --filter web test` — no new failures vs 123/123 baseline | A |
| D1-D3 | Gemini prompt template REF doc: 3 per-asset-type templates, shared stylePrefix, negative prompts banning baked-in shadows, palette hexes embedded, model id literal placeholder | Agent-Probe | Manual read-through: hex codes in JSON `paletteHex[]` match `globals.css` declared values; each `negativePrompt` explicitly bans drop shadows; model id field is literal text `"CONFIRM AT PHASE 2"`, not a real model id | A |
| E1-E2 | Repo-root env-example file created (first-ever), minimal `GEMINI_API_KEY=` + comment; GEMINI_API_KEY presence + env-loading wrinkle recorded in phase report | Fully-Automated | env-example file exists and contains a `GEMINI_API_KEY=` line | A |
| Type/build regression | No TS/build breakage from CSS/doc-only changes | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` exits 0 | A |
| No new heavy deps | Bundle-safety unaffected — this phase is CSS/doc only | Fully-Automated | `git diff --stat apps/web/package.json` shows no diff | A |
| A11y regression backstop | Existing 8-route a11y suite stays green (does NOT prove new tokens are accessible — nothing in Phase 1 wires `.clay-surface`/`--accent-yellow` into a rendered route yet; this is a pure regression backstop for this phase, real coverage of the new tokens lands with Phase 4's page assembly) | Hybrid | `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` — precondition: dev server running; green, zero new violations | A |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: all rows above use Fully-Automated, Hybrid, or Agent-Probe — no row uses
Known-Gap as a proving strategy. The one genuine Known-Gap for this phase (real cross-browser
visual rendering of the triple-shadow claymorphism spec) is carried in "Open gaps" below, not
smuggled into a strategy column.

Legacy line form (retained so existing validate-contract consumers still parse):
- Token audit: [Fully-automated: `grep -n "font-family\|Quicksand\|Poppins" apps/web/app/globals.css apps/web/app/layout.tsx`]
- Accent pair contrast: [agent-probe: manual WCAG contrast-ratio calc on --accent-yellow pair, both themes]
- Triple-shadow tokens: [Fully-automated: `corepack pnpm --filter web build`] | [agent-probe: visual read of composed box-shadow]
- Downstream consumer regression: [Fully-automated: `corepack pnpm --filter web test`]
- Prompt template doc: [agent-probe: hex/JSON/negative-prompt/model-placeholder read-through]
- env-example: [Fully-automated: file existence + content check]
- Type/build regression: [Fully-automated: `corepack pnpm --filter web exec tsc --noEmit`]
- Bundle safety: [Fully-automated: `git diff --stat apps/web/package.json`]
- A11y backstop: [hybrid: `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` + precondition: dev server running]

Failing stub (A1-A3 — Fully-Automated):
```
test("should keep Quicksand typeface wired after Phase 1 token audit", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: font-family/Quicksand grep confirms typeface unchanged")
})
```

Failing stub (C1-C3 build-safety leg — Fully-Automated):
```
test("should keep build green after additive --clay-* triple-shadow token additions", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: build exits 0 after --clay-* vars added to :root/.dark")
})
```

Failing stub (Downstream consumer regression — Fully-Automated):
```
test("should not regress existing shadow-cushion/texture-cushion consumers", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: vitest suite stays at 123/123 or higher, zero new failures")
})
```

Failing stub (E1-E2 env-example — Fully-Automated):
```
test("should create repo-root env-example file with a GEMINI_API_KEY entry", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: env-example file exists and contains GEMINI_API_KEY=")
})
```

Failing stub (Type/build regression — Fully-Automated):
```
test("should keep tsc --noEmit clean after CSS/doc-only changes", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: tsc --noEmit exits 0")
})
```

Failing stub (No new heavy deps — Fully-Automated):
```
test("should introduce zero new dependencies in apps/web/package.json", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: git diff --stat apps/web/package.json shows no diff")
})
```

Dimension findings:
- Infra fit: PASS — no container/worker/port/proxy surfaces touched; this phase is CSS custom
  properties, one new doc file, and one new root config file only.
- Test coverage: PASS — all 4 tiers represented (Fully-Automated majority, 1 Hybrid regression
  backstop, Agent-Probe for judgment-only checks); no behavior rests solely on Known-Gap (vacuous-
  green scan clean). One improvement opportunity folded into Execute-agent instructions (E1/E2)
  rather than left as an open CONCERN.
- Breaking changes: PASS — additive-only; confirmed 9 existing files consume
  `--shadow-cushion-*`/`.texture-cushion` and none are touched by this phase's checklist; no
  variable renames or removals; no `tailwind.config.js` changes (corrected filename, see Plan
  updates applied).
- Security surface: PASS — the new env-example file is documentation-only (no live key value
  committed); no auth/billing/schema/secret-handling surface touched.
- Section A (Audit) feasibility: PASS — mechanical, target files confirmed present and readable
  (`apps/web/app/globals.css`, `apps/web/app/layout.tsx`, prior higherbits-cozy-rebrand Phase 03
  plan+report both exist on disk).
- Section B (Palette/typeface) feasibility: PASS — Quicksand already wired (`layout.tsx:2,26`,
  confirmed via grep); no rendering gap found; new accent-pair insertion point is clear
  (alongside existing `--accent-mint`/`--accent-mint-foreground` block).
- Section C (Triple-shadow tokens) feasibility: CONCERN → RESOLVED — plan referenced a
  nonexistent `.ts` Tailwind config file; actual file is `apps/web/tailwind.config.js` (Tailwind
  v3.4.14, classic JS config, confirmed via package.json + file listing). Corrected in Plan
  updates applied; mechanical feasibility otherwise clean — `.texture-cushion` precedent read in
  full and confirmed as a valid structural model for `.clay-surface`.
- Section D (Prompt template doc) feasibility: PASS — new file, no naming/path collisions.
- Section E (env-example) feasibility: PASS — confirmed no env-example file exists anywhere in
  the repo (first-ever); root-level creation is unambiguous and collision-free.
- Structural plan validator: `validate-plan-artifact.mjs` reports 6 failures (missing
  Date/Status/Complexity metadata, overview section, Phase Completion Rules, Acceptance Criteria)
  — this is a SYSTEMIC, non-blocking finding: every phase-stub plan in this program (confirmed by
  spot-checking Phase 2's plan, which fails identically) uses the `vc-generate-phase-program`
  phase-stub shape, not the standalone `vc-generate-plan` shape that this validator expects. The
  phase-appropriate validator, `validate-phase-stub.mjs`, reports 0 failures / 0 warnings against
  this exact file. Both umbrella (`validate-umbrella-artifact.mjs`) and this phase stub
  (`validate-phase-stub.mjs`) pass clean. Reported here per the mandatory V1-3b instruction; not
  treated as a gate-blocking FAIL because the correct validator for this artifact shape passes.

Open gaps:
- Real cross-browser visual rendering of the triple-shadow claymorphism spec cannot be verified
  in this architecture-only phase (nothing is rendered on any route yet). known-gap: covered by
  Phase 3 (component build, first real render) and Phase 4/5 (page assembly + final a11y QA) —
  not a backlog item, it is inherently sequenced into the program's own later phases.
- `validate-plan-artifact.mjs` structural-shape mismatch noted above — informational only, no
  action required (correct validator passes clean).

What this coverage does NOT prove:
- The build/typecheck/test trio proves additive-safety and zero regression — it does NOT prove
  the new `--clay-*` tokens or `--accent-yellow` pair look correct or match the reference pastel-
  3D aesthetic; nothing consumes them yet.
- The Agent-Probe visual read of the composed `box-shadow` value proves the CSS *structure*
  matches the light-TL/dark-BR/outer spec — it does NOT prove real browser-rendered visual
  fidelity (no screenshot/visual-regression harness exists in this repo).
- The manual WCAG contrast-ratio calculation proves the *chosen* HSL pair meets the accessibility
  bar at authoring time — it does NOT prove the Axe a11y Playwright suite will independently catch
  a mistake, since no route renders the new pair yet (Phase 1 has no consuming markup).
- The Hybrid a11y backstop proves the EXISTING 8 routes stay regression-free — it does NOT
  exercise any of this phase's new tokens at all.
- The prompt-template read-through proves internal consistency (hex codes, JSON shape, negative
  prompts, model-id placeholder) — it does NOT prove Gemini will actually produce style-consistent
  matte-clay output; that is empirically tested in Phase 2.

Gate: PASS (no FAILs, plan updated — Tailwind config filename corrected; test coverage and
dimension findings clean; open gaps are inherently deferred to later in-program phases, not
backlog items)
Accepted by: session (autonomous, phase-program inner PVL — no interactive user in this
subagent context; net gate computed 0 FAILs / 0 unresolved CONCERNs after the one plan
correction applied during this pass)
