---
name: plan:claymorphism-reference-parity-phase-01-assets-css-foundation
description: "Claymorphism Reference Parity — Phase 01: Asset chroma-key + missing CSS foundation"
date: 16-07-26
metadata:
  node_type: memory
  type: plan
  feature: claymorphism-reference-parity
  phase: phase-01
---

# Phase 01 — Assets & CSS Foundation

**Program:** claymorphism-reference-parity
**Umbrella plan:** process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/claymorphism-reference-parity-umbrella_PLAN_16-07-26.md
**Phase status:** ✅ VERIFIED — EXECUTE + EVL complete (commit `f109b3f`), UPDATE PROCESS closed out 17-07-26
**Report destination:** process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-01-assets-css-foundation_REPORT_{dd-mm-yy}.md (flat in the program task folder)

---

## Purpose

Fix the two blocking foundation gaps that every later phase depends on: (1) the 8 Gemini seed
assets under `apps/web/public/clay/{icons,illustrations,textures}/` are JPGs — 7 of the 8 carry a
baked fake transparency checkerboard plus per-asset baked artifacts (no real alpha channel); the
8th (`soft-noise.jpg`, texture) is a full-bleed opaque cream scene with NO checkerboard and is
excluded from chroma-keying (see Step A note below) — this phase chroma-keys the 7 into real-alpha
WebP via a one-time ops script using `sharp` and re-encodes the 8th as a plain lossy WebP; (2)
`.clay-card-icon`/`.clay-card-illustration` CSS
classes are referenced by `ClayCard`'s `iconSrc`/`illustrationSrc` props but are undefined in
`globals.css` — this phase defines them. This phase also adds the new lavender+cream pastel
token pair (light+dark, AA-checked) that Phase 2's chart fills and Phase 3's dashboard tiles
depend on. No other phase can safely proceed without this phase's exit gate passing.

---

## Entry Gate

- Phase 0 complete (umbrella + all 4 phase plans scaffolded, validators pass)
- **CORRECTED at inner RESEARCH (16-07-26): `sharp` IS present in `pnpm-lock.yaml`** (61 matches,
  including ~17 `@img/sharp-*` platform binaries) as Next.js's own OPTIONAL peer dependency — but
  it is NOT linked into `node_modules`, so `node -e "require('sharp')"` still fails with
  `MODULE_NOT_FOUND` from both repo root and `apps/web`; no `package.json` in the repo lists it as
  a direct dependency. (The outer-PVL validate-contract's "0 matches in pnpm-lock.yaml" claim was
  incorrect — corrected here.) The umbrella's premise ("already lockfile-resolvable via Next's own
  dependency tree — zero new package.json entries") is still **effectively false** for direct
  `require()` use, though the version is already pinned in the lock graph, so `corepack pnpm install`
  after Step A0 should resolve cheaply (unverified — EXECUTE confirms). Step A0 (add `sharp` as a
  root `package.json` devDependency) remains the correct fix — see Step A0 and Validate Contract.

---

## Blast Radius

- `apps/web/app/globals.css` (edited — new CSS rules + new token pairs)
- `ops/gemini-asset-chroma-key.mjs` (new ops-time script)
- `apps/web/public/clay/icons/*.jpg` -> `*.webp` (5 files, re-encoded, real alpha)
- `apps/web/public/clay/illustrations/*.jpg` -> `*.webp` (2 files, re-encoded, real alpha)
- `apps/web/public/clay/textures/*.jpg` -> `*.webp` (1 file — `soft-noise.jpg`, plain lossy
  re-encode, NO alpha channel — chroma-key-excluded per A2a/D2)
- `apps/web/public/clay/manifest.json` (updated — `format` field per entry, `image/jpeg` ->
  `image/webp`; entries are keyed by relative path, e.g. `icons/play`, with no literal `filename`
  field — the `.webp` extension is implicit from the key + `format`, nothing else changes shape)
- `package.json` (root — **new**: `sharp` added to `devDependencies`, ops-time-only, never
  imported by app code, not bundled into the Next.js production build)
- `pnpm-lock.yaml` (root — updated by the `sharp` devDependency addition)
- Any component reference to the old `.jpg` asset paths (grep sweep, likely none yet since assets are unconsumed pre-Phase-3)

---

## Implementation Checklist

### Step A — Confirm asset pipeline approach

- [x] A0. **(Added at VALIDATE 16-07-26 — Plan Update P1.)** Add `sharp` (current stable, e.g.
      `"sharp": "^0.33.0"` or latest) to root `package.json` `devDependencies`. Run
      `corepack pnpm install` and confirm `node -e "const sharp=require('sharp'); console.log(sharp.versions)"`
      exits 0 from repo root. This is a **devDependency only** — never imported by app code, never
      bundled into the `apps/web` production build (ops script is invoked via
      `node ops/gemini-asset-chroma-key.mjs`, matching the existing `assets:generate` ops-script
      pattern in root `package.json`). Document this addition as a deviation from the umbrella's
      original "zero new package.json entries" framing in the phase report — the umbrella's intent
      (no new **runtime** dependency) is preserved; the literal premise was inaccurate.
- [x] A1. **(Decision locked at INNOVATE 16-07-26 — D1.)** Chroma-key algorithm: classify each
      pixel as background via **saturation/lightness thresholding** on a `sharp` raw pixel buffer
      (pixel is background if saturation is low AND lightness is high — sweeps checkerboard gray/white
      AND the per-asset baked artifacts, since both families are desaturated), with a **soft alpha
      ramp** near the classification boundary (not a hard binary cutout, to avoid jagged edges), PLUS
      a per-asset override table for tuning. Document the chosen saturation/lightness thresholds and
      the override table in the phase report.
- [x] A1a. **(D1-risk — named sub-item, not implicit.)** `potted-plant.jpg`'s pot body is warm
      cream/low-saturation — flagged as a **false-positive keying risk** under the generic classifier.
      Add an explicit per-asset override entry for `potted-plant` (tighter lightness ceiling or a
      hue-aware exclusion band) and verify visually via the Agent-Probe gate (B2 visual-quality row)
      before accepting the output.
- [x] A2. Inspect all 8 source JPGs (`apps/web/public/clay/{icons,illustrations,textures}/`) —
      **CONFIRMED at inner RESEARCH: non-uniform.** `soft-noise.jpg` (texture) has NO checkerboard
      (full-bleed opaque cream isometric scene — see A2a). The other 7 all carry checkerboard PLUS
      distinct per-asset baked artifacts: `bell.jpg` — diagonal gray gradient streak; `dashboard-tile.jpg`
      — white blur cloud; `play.jpg` — motion swoosh; `mascot.jpg` — dashed guide-circle;
      `potted-plant.jpg` — faint dashed grid (see A1a); `heart.jpg`/`gear.jpg` — clean checkerboard
      only. All 8 are 1408x768 JPGs. One shared classifier (D1) plus the per-asset override table
      handles this non-uniformity — no bespoke per-asset script is needed.
- [x] A2a. **(Decision locked at INNOVATE 16-07-26 — D2.)** `soft-noise.jpg` is EXCLUDED from
      chroma-keying entirely — it has no checkerboard to remove. Re-encode it as a plain lossy WebP
      with no alpha channel, via a `{ skipChromaKey: true }` config entry in the ops script (see B1).
- [x] A3. **(Decision locked at INNOVATE 16-07-26 — D3.)** Per-asset fallback policy: an asset falls
      back to a solid-bg chip treatment ONLY IF, after the generic classifier (D1) plus a bounded
      per-asset override attempt, the Agent-Probe visual review (B2) judges residual halo/artifact
      still visible. Fallback = keep the best-effort-alpha WebP behind a matching solid-pastel-token
      CSS backdrop. Expected fallback count: 0 (this is the documented contingency path per the
      umbrella SPEC's AC6 — not the expected outcome). Document actual outcome per asset in the phase
      report.

### Step B — Build and run the chroma-key script

- [x] B1. **(Decision locked at INNOVATE 16-07-26 — D5.)** Write ONE
      `ops/gemini-asset-chroma-key.mjs` with a per-asset config map (thresholds/overrides per A1/A1a,
      plus the `{ skipChromaKey: true }` entry for `soft-noise` per A2a). Reads each source JPG,
      applies the saturation/lightness classifier + soft alpha ramp (D1) for the 7 chroma-keyed
      assets, outputs WebP with a real alpha channel to the same relative path with `.webp`
      extension; re-encodes `soft-noise.jpg` as plain lossy WebP with no alpha. Script must be
      **idempotent** (safe to re-run against the original source JPGs without compounding artifacts).
      Ops-time only — never imported by app code.
- [x] B1a. **(Test-infra gap closure — D5.)** Extract the pixel-classification function as a pure,
      standalone function so it is unit-testable independent of file I/O. Add a `node --test` smoke
      test against a tiny synthetic pixel-buffer fixture (e.g. a hand-built 2x2 or 4x4 RGBA buffer
      with known background/foreground pixels) asserting the classifier correctly flags background
      vs subject pixels. Place at `ops/__tests__/gemini-asset-chroma-key.test.mjs`, following the
      existing `ops/__tests__/gemini-asset-gen.test.mjs` pattern.
- [x] B2. Run the script against all 8 assets (7 chroma-keyed + 1 plain re-encode); visually
      spot-check each output (Read tool on the resulting file, or a manual review step) for
      checkerboard-free edges — pay particular attention to `potted-plant.jpg` per A1a. Additionally
      run `sharp(file).metadata()` per chroma-keyed output and assert `hasAlpha === true` (Hybrid
      gate — see Validate Contract Test Gates); `soft-noise.webp` is expected to have `hasAlpha ===
      false` (plain re-encode, not chroma-keyed).
- [x] B3. Update `apps/web/public/clay/manifest.json`: for each of the 8 entries, change
      `"format": "image/jpeg"` to `"format": "image/webp"`. (Confirmed at VALIDATE: entries have
      no `filename` field — only `promptHash`/`generatedAt`/`model`/`format`; the original plan
      text's "reference the new .webp filenames" is satisfied by the `format` field change alone.)
- [x] B4. Delete or archive the original `.jpg` sources per repo convention (confirm with git
      status before removing — do not lose the only copy without a recovery path; consider keeping
      originals in a `manifest`-referenced `raw/` subfolder if disk space is not a concern).

### Step C — Define missing CSS classes + new pastel tokens

- [x] C1. Add `.clay-card-icon` and `.clay-card-illustration` rules to `apps/web/app/globals.css`
      (sizing, rounding, object-fit — consistent with the existing `.clay-surface`/`clay-*` utility
      conventions already in the file). **Confirmed at VALIDATE: these classes are genuinely
      undefined today** (0 matches in `globals.css`; `ClayCard` at
      `apps/web/components/ui/clay-card.tsx` already applies `className="clay-card-icon"` /
      `"clay-card-illustration"` to its `<img>` elements — no collision risk).
- [x] C2. Add new `--accent-lavender` and `--accent-cream` (plus `-foreground` pairs) token
      definitions in both `:root` and `.dark` blocks, following the existing `--accent-yellow`
      pattern **confirmed present** at `apps/web/app/globals.css:263-264` (light) and `:358` (dark)
      — same structure as `--accent-pink`/`--accent-peach`/`--accent-blue`/`--accent-mint`.
      **Candidate starting values (locked at INNOVATE 16-07-26 — D4, tune via C3's script, not
      final until AA-verified):**
      - Light: `--accent-lavender: 258 55% 84%` / `-foreground: 258 40% 32%`;
        `--accent-cream: 42 48% 90%` / `-foreground: 36 35% 28%`
      - Dark: `--accent-lavender: 258 42% 68%` / `-foreground: 258 35% 15%`;
        `--accent-cream: 42 30% 70%` / `-foreground: 36 30% 14%`
      Follow the existing `@layer base { :root }` / `@layer base { .dark }` nesting convention.
- [x] C3. Run an AA contrast check (>=4.5:1) on every new token pair against its intended
      foreground/background combination in both light and dark mode using the **existing reusable
      script** `apps/web/scripts/wcag-contrast.mjs "H S% L%" "H S% L%"` (confirmed present —
      already used to verify `--accent-yellow` at 5.88:1); adjust values if any pair fails, and
      record the checked values + ratios in the phase report.
- [x] C4. **(Test-gap closure — R4.)** Extend `clay-card.test.tsx`'s existing VE3 assertion to also
      check `img.className` contains `"clay-card-icon"` / `"clay-card-illustration"` (currently only
      `src` is asserted). Small in-blast-radius addition, not a separate backlog item.

---

## Exit Gate

```bash
corepack pnpm --filter web build
# Expected: exit 0

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: exit 0, no regression vs 37-test/13-file baseline (RE-BASELINED at inner RESEARCH
# 16-07-26 — corrects the outer-pvl contract's stale 29/11 figure; new unrelated test files landed
# same day: clay-charts, clay-input, clay-pill-button, hero-section, use-sidebar-visibility,
# public-dashboard/page.client, amplitude, api/magic/route tests)

grep -c "clay-card-icon\|clay-card-illustration" apps/web/app/globals.css
# Expected: >= 2 (both classes defined)

ls apps/web/public/clay/icons/*.webp apps/web/public/clay/illustrations/*.webp apps/web/public/clay/textures/*.webp
# Expected: 8 webp files present

node -e "const sharp=require('sharp'); console.log(sharp.versions)"
# Expected: prints a version object, exit 0 (run AFTER Step A0 lands)
```

- All checklist items (A0-C3) checked
- Both new CSS classes defined and both new token pairs pass AA in light + dark mode
- All 8 assets converted to real-alpha WebP (or explicitly documented solid-bg fallback per asset)
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- ~~`sharp` cannot be resolved without adding a new direct dependency AND the user has not
  approved adding one~~ **RESOLVED at VALIDATE 16-07-26** — see Step A0 and Validate Contract
  (`generated-by: outer-pvl`, date 16-07-26; re-confirmed at inner-pvl re-validation, same date).
  Adding `sharp` as a devDependency for an ops-time-only
  script is accepted as within the umbrella's "no new runtime dependency" intent; self-decided
  under /goal autonomous execution, recorded as an accepted CONDITIONAL concern.
- Chroma-key produces unacceptable artifacts on all 8 assets with no viable threshold — would
  require falling back to solid-bg containers for all assets and documenting that as the Phase 1
  outcome (not a blocker for the phase itself, but a scope note carried to Phase 3).
- New pastel token pair cannot pass AA contrast in any usable combination — would require picking
  different hues (not a hard blocker, but may need INNOVATE re-run).

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked; `sharp` resolvability confirmed (corrected: present in lockfile as optional peer dep, not linked into node_modules)
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written (D1-D5: chroma-key algorithm, fallback policy, script architecture) — vc-predict GO
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated (Purpose, Entry Gate, Blast Radius, Step A/B/C, Exit Gate, Validate Contract dimension findings); Inner Loop Refresh Note written below
- [x] 4. PVL — vc-validate-agent: full V1-V7 run TWICE — outer-pvl pass (16-07-26, Gate: CONDITIONAL, session-accepted) then inner-pvl re-validation (16-07-26, same date, re-run against the RESEARCH/INNOVATE/PLAN-SUPPLEMENT corrections) per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by) — Gate: CONDITIONAL, session-accepted; inner-pvl contract (`generated-by: inner-pvl: phase-1`) supersedes the outer-pvl contract and is authoritative for EXECUTE
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green (14 gate commands + 4 regression validators); a11y GREEN for
      phase attribution (8 pre-existing fails — 5 muted-foreground + 3 link-name/text-primary — 0
      new); follow-up stub registered (a11y baseline documentation undercount); EVL HANDOFF SUMMARY
      written (closeout_classification: CLEAN)
- [x] 7. UPDATE PROCESS — phase report updated with Learnings section; umbrella state rewritten;
      a11y baseline reconciled in tests/all-tests.md; process commit made

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

## Inner Loop Refresh Note

**Date: 16-07-26.** Inner RESEARCH + INNOVATE completed AFTER the outer-pvl validate-contract of
the same date (`date: 2026-07-16`, `generated-by: outer-pvl`) — this note **supersedes that
contract's currency**. Same-day dates make a simple newer-than comparison ambiguous, so this is
stated explicitly: **inner PVL (Step 4) re-run is required before EXECUTE.**

Corrections and additions folded into this plan by this supplement:

- **R1 (Entry Gate correction):** `sharp` IS present in `pnpm-lock.yaml` (61 matches, ~17
  `@img/sharp-*` platform binaries) as Next.js's optional peer dependency, but NOT linked into
  `node_modules` — `require('sharp')` still fails. Step A0 (add as root devDependency) is
  unchanged as the correct fix; only the "0 matches in pnpm-lock.yaml" framing was wrong.
- **R2 (Exit Gate re-baseline):** live test baseline is **37 tests / 13 files**, not 29/11 — new
  unrelated test files landed same day. All baseline references in this plan updated.
- **R3 (asset non-uniformity):** `soft-noise.jpg` has no checkerboard (plain opaque scene,
  excluded from chroma-keying); the other 7 assets each carry checkerboard plus a distinct baked
  artifact. Step A2/A2a updated accordingly.
- **R4 (test gap):** `clay-card.test.tsx` VE3 asserts `img` `src` but not `className` — new
  checklist item C4 closes this gap in-blast-radius.
- **D1 (chroma-key algorithm):** saturation/lightness pixel classification via `sharp` raw buffer,
  soft alpha ramp at the boundary, plus a per-asset override table — locked into Step A1.
- **D1-risk (potted-plant):** named false-positive keying risk for `potted-plant.jpg`'s warm cream
  pot body — new checklist item A1a requires an explicit override entry + Agent-Probe verification.
- **D2 (soft-noise exclusion):** locked into Step A2a — plain lossy WebP re-encode, no alpha,
  `{ skipChromaKey: true }` config entry.
- **D3 (fallback policy):** locked into Step A3 — fallback only after generic classifier + bounded
  override attempt still fails Agent-Probe review; expected fallback count 0 (documented
  contingency, not expected outcome).
- **D4 (token candidate values):** locked into Step C2 — starting HSL values for light/dark
  `--accent-lavender`/`--accent-cream` pairs, tuned via C3's AA script (not final until verified).
- **D5 (script architecture):** locked into Step B1 — ONE `ops/gemini-asset-chroma-key.mjs` with a
  per-asset config map, idempotent; new checklist item B1a extracts the pure classifier function
  for a `node --test` unit smoke test (closes the ops-script coverage gap).

**SUPERSEDED 16-07-26 (inner PVL complete):** the `## Validate Contract` section below was
originally dated 16-07-26 (`generated-by: outer-pvl`) and was left as-is at PLAN-SUPPLEMENT time
per supplement-mode constraints. Inner PVL (this pass) has now run a fresh V1-V7 sequence
reflecting the R1-R4/D1-D5 corrections above and has OVERWRITTEN that section below with a new
contract (`generated-by: inner-pvl: phase-1`, `supersedes: 2026-07-16 (outer-pvl)`). Steps 1-3
above are now checked — inner RESEARCH and INNOVATE ran and produced the corrections/decisions
(R1-R4, D1-D5) folded into this note; PLAN-SUPPLEMENT applied them to this plan file. This
inner-PVL pass is Step 4, run against the corrected plan (not the original Phase 0 stub).

---

## Touchpoints

- `apps/web/app/globals.css`
- `ops/gemini-asset-chroma-key.mjs` (new)
- `apps/web/public/clay/icons/**`, `apps/web/public/clay/illustrations/**`, `apps/web/public/clay/textures/**`
- `apps/web/public/clay/manifest.json`
- `package.json` (root — new `sharp` devDependency)
- `pnpm-lock.yaml` (root)

---

## Public Contracts

- No public API/schema/route changes — none.
- `ClayCard`'s `iconSrc`/`illustrationSrc` prop signature unchanged; only the CSS classes those
  props already reference gain real definitions.

---

## Verification Evidence

```bash
grep -c "clay-card-icon\|clay-card-illustration" apps/web/app/globals.css
# Expected: >= 2

node -e "const sharp=require('sharp'); console.log(sharp.versions)"
# Expected: prints a version object without a module-not-found error (confirms resolvability —
# run AFTER Step A0 lands; CONFIRMED FAILING as of VALIDATE 16-07-26 pre-fix, re-confirmed still
# failing at the inner-PVL re-validation pass, same date, pre-EXECUTE)
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-01-assets-css-foundation_PLAN_16-07-26.md`
- Last completed step: UPDATE PROCESS (Step 7) — phase closed out 17-07-26
- Execution commit: `f109b3f` on `main` (23 files, 592+/60-)
- Validate-contract status: written, `generated-by: inner-pvl: phase-1`, Gate: CONDITIONAL
  (session-accepted); EVL independently confirmed all gates green 17-07-26
- EVL HANDOFF SUMMARY: closeout_classification CLEAN — known gaps: (1) a11y baseline
  documentation undercounted pre-existing failures by 3 (fixed in this UPDATE PROCESS pass, see
  `process/context/tests/all-tests.md`), (2) in-page `<ClayCard>` rendering deferred to Phase 3/4
  by design, (3) Agent-Probe visual review performed by execute-agent, not independently re-run
  by EVL (accepted — no automated visual-regression harness exists in this repo)
- Next step: Phase COMPLETE. Umbrella now points to Phase 2 (chart-fixes), loop step RESEARCH.
  Phase 3 is also unblocked (parallel-safe with Phase 2 per the umbrella's Pre-PVL Conflict
  Resolution — no shared files).

---

## Validate Contract

Status: CONDITIONAL
Date: 16-07-26
date: 2026-07-16
generated-by: inner-pvl: phase-1
supersedes: 2026-07-16 (outer-pvl) — inner PVL has current evidence

Parallel strategy: sequential
Rationale: Signal score 1/7 (single-package, single-app blast radius, no schema/auth/API/billing
surface, <12 files, one investigation direction already resolved by direct empirical checks) —
below the 2-signal MEDIUM threshold. Re-confirmed at this inner-PVL pass: still 1/7 after the
supplement — the new checklist items (A0/A1a/A2a/B1a/C4) are same-package refinements/closures of
already-identified gaps, not new blast-radius areas. Fan-out was run in Simple Mode as a
single-agent sequential V1-V7 pass covering all 4 Layer-1 dimensions + 3 Layer-2 sections directly,
rather than spawning 7 separate subagents for a phase this small.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| C1 | `.clay-card-icon`/`.clay-card-illustration` CSS classes defined in globals.css | Fully-Automated | `grep -c "clay-card-icon\|clay-card-illustration" apps/web/app/globals.css` exits with count >=2 | A |
| C2/C3 | New `--accent-lavender`/`--accent-cream` token pairs pass WCAG AA (>=4.5:1), light+dark | Fully-Automated | `node apps/web/scripts/wcag-contrast.mjs "<bg H S% L%>" "<fg H S% L%>"` exits 0, per pair per theme (4 invocations) | A |
| C4 | `clay-card.test.tsx` VE3 asserts `img.className` contains `clay-card-icon`/`clay-card-illustration`, not just `src` (test-gap closure, R4) | Fully-Automated | `corepack pnpm --filter web test` exits 0 with the extended className assertion present in clay-card.test.tsx | A |
| A0 | `sharp` resolves as a devDependency without polluting the production runtime bundle | Fully-Automated | `node -e "const sharp=require('sharp'); console.log(sharp.versions)"` exits 0 (repo root, after `corepack pnpm install`) — RE-CONFIRMED FAILING pre-fix at this inner-PVL pass (`node -e "require('sharp')"` throws MODULE_NOT_FOUND; `grep '"sharp"' package.json` returns 0 matches), as expected pre-EXECUTE | B |
| B1/B2 | 8 source JPGs (5 icons, 2 illustrations, 1 texture) converted to WebP (7 real-alpha chroma-keyed + 1 plain re-encode) | Fully-Automated | `ls apps/web/public/clay/icons/*.webp apps/web/public/clay/illustrations/*.webp apps/web/public/clay/textures/*.webp` returns exactly 8 files | A |
| B1a | Pure pixel-classifier function is unit-testable independent of file I/O | Fully-Automated | `node --test ops/__tests__/gemini-asset-chroma-key.test.mjs` exits 0 (new file; RE-CONFIRMED at this pass: `ops/__tests__/gemini-asset-gen.test.mjs` exists as the exact pattern precedent, and `ops/gemini-asset-chroma-key.mjs` does not yet exist — clean creation, no collision) | A |
| B2 | Each of the 7 chroma-keyed WebP has a genuine alpha channel (not just file presence); `soft-noise.webp` has `hasAlpha === false` (plain re-encode) | Hybrid — precondition: `sharp` installed (A0 landed) | `node -e "require('sharp')('<file>').metadata().then(m=>{if(m.hasAlpha !== <expected>) process.exit(1)})"` per file, exit 0 for all 8 | A |
| B2/A1a | Converted assets are visually checkerboard/halo-free at the edges, with special attention to `potted-plant.jpg`'s override (named false-positive keying risk) | Agent-Probe | Read tool visual review of each of the 8 output WebP files; judge edge quality against the source checkerboard/baked-artifact pattern per asset; potted-plant judged specifically against its override entry | A |
| C2 | Lavender/cream hues are visually harmonious with the existing pink/peach/blue/mint/yellow pastel rotation | Agent-Probe | Side-by-side visual review of new swatches against existing `--accent-*` chips (e.g. via a scratch HTML swatch page or the Read tool on a rendered preview) | A |
| — | No regression in existing suite | Fully-Automated | `corepack pnpm --filter web test` exits 0 — RE-CONFIRMED via live run at this inner-PVL pass (16-07-26 23:32): 37 tests passed / 37, 13 files passed / 13 | A |
| — | No type errors introduced | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` exits 0 | A |
| — | Production build unaffected by new devDependency + CSS | Fully-Automated | `corepack pnpm --filter web build` exits 0 | A |
| — | `packages/ui` remains untouched (program hard constraint) | Fully-Automated | `git status --short packages/ui/` returns empty after EXECUTE | A |

gap-resolution legend:
- A — proven now (gate passes in this cycle, once EXECUTE lands the change)
- B — fixed in this plan (gate added by this plan's checklist — A0 above)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

Legacy line form:
- CSS classes: Fully-automated: `grep -c "clay-card-icon\|clay-card-illustration" apps/web/app/globals.css`
- AA contrast: Fully-automated: `node apps/web/scripts/wcag-contrast.mjs "H S% L%" "H S% L%"`
- className test extension: Fully-automated: `corepack pnpm --filter web test` (clay-card.test.tsx, extended VE3)
- sharp resolvability: Fully-automated: `node -e "require('sharp')"` (post-A0)
- Chroma-key classifier unit test: Fully-automated: `node --test ops/__tests__/gemini-asset-chroma-key.test.mjs`
- Asset alpha channel: hybrid: `sharp(file).metadata()` — precondition: sharp installed
- Asset visual quality: agent-probe: Read-tool visual review of each WebP, potted-plant override specifically checked
- In-page `<ClayCard>` rendering with real assets: known-gap: deferred to Phase 3/4 (no consumer wired yet in Phase 1 scope)

Dimension findings:
- Infra fit: CONCERN — `sharp` premise in the umbrella and original Entry Gate was empirically
  FALSE (RE-CONFIRMED live at this inner-PVL pass: `node -e "require('sharp')"` still fails with
  MODULE_NOT_FOUND from repo root; `grep '"sharp"' package.json`/`apps/web/package.json` returns 0
  matches; 61 matches remain in `pnpm-lock.yaml` as Next's unlinked optional peer). Mitigated via
  Step A0 (add as root `package.json` devDependency, ops-time-only, never bundled into the
  production build) — already a first-class numbered checklist item, not a deferred instruction.
  Accepted as within the umbrella's "no new runtime dependency" intent (never imported by app code,
  never bundled). Carried forward from the outer-pvl contract as the same accepted concern — no
  new infra risk introduced by the supplement.
- Test coverage: PASS — RE-CONFIRMED live run at this pass: 37 tests / 13 files, all passing
  (matches this plan's re-baselined Exit Gate and Validate Contract text exactly; supersedes the
  outer-pvl contract's stale 29/11 figure). The prior test-gap (VE3 only asserted `img.src`, not
  `className`) is now closed by checklist item C4 (confirmed present in the plan's Step C); the
  ops-script unit-test coverage gap is now closed by checklist item B1a (confirmed `ops/__tests__/`
  directory and the `gemini-asset-gen.test.mjs` node --test precedent both exist for B1a to
  follow). No open test gaps remain in this dimension — both gaps flagged by the outer-pvl pass are
  now checklist items, not residual notes.
- Breaking changes: PASS — no API/schema/route changes; `ClayCard` prop signature confirmed
  unchanged in `apps/web/components/ui/clay-card.tsx` (iconSrc/illustrationSrc already exist and
  already apply `clay-card-icon`/`clay-card-illustration` classNames — re-confirmed via direct file
  read at this inner-PVL pass, no collision risk).
- Security surface: PASS — ops script does local file I/O only (no network calls, no secrets, no
  auth/billing/trust-boundary logic touched); confirmed `ops/gemini-asset-chroma-key.mjs` does not
  yet exist (new file, no pre-existing surface to regress).
- Section A (confirm asset pipeline approach): PASS — D1 (saturation/lightness classifier + soft
  alpha ramp + per-asset override table), D2 (soft-noise exclusion), D3 (fallback policy) are all
  locked with concrete criteria; A1a's potted-plant override is a named, addressed risk (not an
  implicit gap). 8 source JPGs re-confirmed present at stated paths with correct per-asset artifact
  descriptions (bell/dashboard-tile/play/mascot/potted-plant/heart/gear/soft-noise) via a direct
  `ls` at this pass. No conflicts found.
- Section B (build/run chroma-key script): PASS — `ops/gemini-asset-chroma-key.mjs` confirmed to
  not yet exist (clean creation, no collision); `ops/__tests__/gemini-asset-gen.test.mjs` confirmed
  present as the exact pattern precedent B1a should follow; `manifest.json` schema re-confirmed
  (8 entries, `promptHash`/`generatedAt`/`model`/`format` keys only, no `filename` field — B3's
  plan text is accurate). B4 disk-safety language adequate (git status check before delete).
  Highest-risk edit: B1's classifier accuracy across 7 visually-distinct assets — mitigated by
  B1a's unit test + B2's per-asset Agent-Probe visual review + A1a's named override.
- Section C (CSS classes + tokens): PASS — target file (`apps/web/app/globals.css`) confirmed to
  exist; `.clay-card-icon`/`.clay-card-illustration` re-confirmed genuinely undefined (0 matches in
  a fresh grep); `--accent-yellow` precedent re-confirmed present at exact cited lines (263-264
  light, 358-359 dark); `apps/web/scripts/wcag-contrast.mjs` re-confirmed present (644 bytes);
  `clay-card.test.tsx` VE3 re-confirmed to assert `src` only, giving C4 a real, addressable gap to
  close. No conflicts found.

Open gaps:
- In-page `<ClayCard>` rendering of the actual converted icon/illustration assets is not exercised
  in Phase 1 (no consumer wired yet) — known-gap: documented as deferred to Phase 3 (dashboard
  tiles) / Phase 4 (visual-evidence.spec.ts extension) per the umbrella's Cross-Phase Blast-Radius
  table. This is an intentional scope boundary, not an omission — re-confirmed unchanged at this
  inner-PVL pass.
- Exact lavender/cream HSL values are not pre-chosen by this contract (execute-agent picks values
  satisfying C3's AA gate, starting from the D4-locked candidate values in Step C2) — by design,
  matching how `--accent-yellow` was chosen at execute-time in the prior program.
- `sharp` devDependency addition (Step A0) is a genuine deviation from the umbrella's literal
  "zero new package.json entries" wording, though within its "no new runtime dependency" intent.
  Carried forward unchanged from the outer-pvl contract — update-process-agent should still correct
  the umbrella's wording when this phase closes out (not yet done as of this inner-PVL pass).

What this coverage does NOT prove:
- The Fully-Automated CSS-class-presence grep does NOT prove correct visual sizing/rounding/
  object-fit — only that the class rules exist. Visual correctness is covered by the Agent-Probe
  row (edge/checkerboard review) and, for in-page consumer rendering, deferred to Phase 3/4.
- The Fully-Automated file-count `ls` gate does NOT prove the WebP files have a real alpha channel
  — that requires the separate Hybrid `sharp(file).metadata()` gate.
- The Hybrid alpha-channel gate does NOT prove the chroma-key edges are visually clean (no halo)
  — that requires the separate Agent-Probe visual-review row.
- The `node --test` classifier unit test (B1a) proves the pure function's logic on a synthetic
  fixture only — it does NOT prove the real-asset chroma-key output looks correct; that is the
  separate Agent-Probe row (B2/A1a) against the actual 8 converted files.
- The AA contrast script proves mathematical WCAG compliance only — it does NOT prove the chosen
  hues are aesthetically harmonious with the existing pastel rotation; that is a separate
  Agent-Probe judgment call.
- The extended C4 `className` assertion proves the className string is present on the rendered
  `<img>` — it does NOT prove the CSS rule it references actually renders the intended visual
  treatment (covered by the CSS-presence grep + Agent-Probe rows instead).
- None of these gates exercise the assets inside an actual rendered `<ClayCard>` in a live route —
  that is explicitly out of Phase 1 scope (known-gap above).

Gate: CONDITIONAL (1 concern noted — sharp resolvability premise was false at the umbrella level;
resolved via Plan Update A0, unchanged from the outer-pvl pass; no unresolved FAILs; the two
test-coverage gaps flagged by the outer-pvl pass are now closed via checklist items B1a/C4, not
carried forward as gaps)
Accepted by: session (autonomous, /goal execution) — accepted concern carried forward unchanged
from the outer-pvl contract: "sharp is not lockfile-resolvable as originally assumed; adding it as
a root-level devDependency for the ops-time-only chroma-key script is accepted as consistent with
the umbrella's 'no new runtime dependency' intent, since it is never imported by app code and never
bundled into the production build. Documented as a deviation from the umbrella's literal 'zero new
package.json entries' wording; recommend update-process-agent correct that wording in the umbrella
when this phase closes out." Re-affirmed at this inner-PVL pass (16-07-26) after RESEARCH/INNOVATE/
PLAN-SUPPLEMENT folded in the R1-R4/D1-D5 corrections — no new unresolved concerns introduced by
the supplement; the supplement's new checklist items (A0/A1a/A2a/B1a/C4) close residual gaps rather
than opening new ones.
