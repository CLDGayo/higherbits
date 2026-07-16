---
name: report:claymorphism-reference-parity-phase-01-assets-css-foundation
description: "EXECUTE report — Phase 01 assets-css-foundation: chroma-key 8 clay JPGs to real-alpha WebP + clay-card CSS utilities + lavender/cream tokens"
phase: phase-01-assets-css-foundation
date: 2026-07-16
status: COMPLETE
feature: claymorphism-reference-parity
plan: process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-01-assets-css-foundation_PLAN_16-07-26.md
metadata:
  node_type: memory
  type: report
  feature: claymorphism-reference-parity
  phase: phase-01
---

# Phase 01 — Assets & CSS Foundation — EXECUTE Report

**TL;DR:** All 15 checklist items done, all gates green, 0 fallbacks. Added `sharp` as a root
devDependency; wrote an idempotent, unit-tested chroma-key ops script that converts the 8 clay JPGs
to real-alpha WebP (7 keyed + 1 plain re-encode); defined `.clay-card-icon`/`.clay-card-illustration`
CSS and AA-passing `--accent-lavender`/`--accent-cream` token pairs (both themes); extended the
clay-card test. build/tsc/vitest(37) all pass; packages/ui untouched.

## What Was Done

- **A0 — sharp devDependency.** Added `"sharp": "^0.34.0"` to root `package.json` devDependencies
  (+ an `assets:chroma-key` script mirroring `assets:generate`). `corepack pnpm install` resolved
  sharp@0.34.5 cheaply (already in the lock graph as Next's optional peer). `require('sharp')` now
  exits 0. Ops-time only — never imported by app code, never bundled.
- **A1/A1a/A2/A2a/A3 — algorithm.** Locked D1–D3. See "Chroma-key algorithm" below.
- **B1/B1a — script + test.** Wrote `ops/gemini-asset-chroma-key.mjs` (idempotent, per-asset config
  map, pure exported classifier + band-detector + despeckle) and
  `ops/__tests__/gemini-asset-chroma-key.test.mjs` (10 `node --test` cases, zero real-asset I/O).
- **B2 — conversion + verification.** Ran the script: 7 chroma-keyed + 1 plain re-encode. Verified
  `hasAlpha` per file programmatically AND visually spot-checked all 8 composited over magenta.
- **B3 — manifest.** All 8 entries flipped `image/jpeg` → `image/webp`.
- **B4 — originals archived.** The 8 `.jpg` originals were committed (commit 3200f85); `git rm`'d
  them — recovery path is git history. WebP outputs are 20–40KB vs the 500–850KB JPGs.
- **C1 — CSS classes.** Added `.clay-card-icon` (2.5rem contained thumbnail) and
  `.clay-card-illustration` (full-width, `max-height:9rem`, `object-fit:contain`, `--radius` rounding)
  after the `.clay-surface` utility.
- **C2/C3 — tokens.** Added `--accent-lavender`/`--accent-cream` (+ `-foreground`) in both `:root`
  and `.dark`. All 4 pairs pass WCAG AA (see table).
- **C4 — test extension.** clay-card.test.tsx VE3 now asserts `img.className` contains
  `clay-card-icon`/`clay-card-illustration`, not just `src`.

### Chroma-key algorithm (as-built)

Empirical corner-sampling revealed the plan's uniform-checkerboard premise was incomplete: the baked
backgrounds are NOT all light. Measured background lightness: `play`/`gear` light (L~0.86–0.95),
`heart` mid-gray (L~0.67), and `bell`/`dashboard-tile`/`mascot`/`potted-plant` **dark** (L~0.17–0.31),
with dark ones carrying grainy, partly-saturated JPEG speckle. A single "high-lightness = background"
rule would have failed 4 assets. As-built pipeline (all within the locked D1 saturation/lightness +
soft-ramp + per-asset-override framing):

1. **Auto-detect** each asset's background lightness band `[bgLo,bgHi]` from low-saturation edge-frame
   pixels (2nd/98th percentile, robust to a subject grazing an edge).
2. **Classify** each pixel: background iff low-saturation AND lightness inside the band; soft
   smoothstep ramp at the saturation and band boundaries (not a hard cutout).
3. **Saturation-keep is lightness-gated** (`satKeepMinL=0.42`): saturated pixels are kept only when
   also bright, so dark saturated grain on the dark-bg assets is keyed out while bright pastel
   subjects survive. This is the key fix that cleaned the dark assets.
4. **Connected-component despeckle:** drop tiny disconnected opaque components (grain clusters),
   keep the large subject blob(s). Asset-agnostic; preserves soft subject edges.

The dark checkerboard **inverts** the A1a potted-plant risk: its cream/white pot body is
high-lightness / out-of-band, so it is protected automatically (no false-positive erasure). A named
`potted-plant` override (lower satKeepLo + warm hue-protection band) is retained as belt-and-suspenders.

## Test Gate Outcomes

| Gate | Command | Result |
|---|---|---|
| clay-card CSS classes | `grep -c "clay-card-icon\|clay-card-illustration" globals.css` | **2** (exit 0) |
| 8 WebP present | `ls .../clay/{icons,illustrations,textures}/*.webp \| wc -l` | **8** |
| sharp resolves | `node -e "require('sharp')"` | sharp 0.34.5 (exit 0) |
| ops classifier unit test | `node --test ops/__tests__/gemini-asset-chroma-key.test.mjs` | **10/10 pass** |
| alpha channel per file | `sharp(file).metadata().hasAlpha` | 7×true, soft-noise×false — all as expected |
| WCAG AA (4 pairs) | `node apps/web/scripts/wcag-contrast.mjs` | all pass (see below) |
| type-check | `corepack pnpm --filter web exec tsc --noEmit` | exit 0 |
| unit suite | `corepack pnpm --filter web test` | **37 passed / 13 files** (baseline held, no regression) |
| production build | `corepack pnpm --filter web build` | exit 0 |
| packages/ui untouched | `git status --short packages/ui/` | empty (clean) |

### Final token values + contrast ratios

| Token pair | Theme | chip-bg (H S% L%) | foreground (H S% L%) | ratio |
|---|---|---|---|---|
| `--accent-lavender` | light | 258 55% 84% | 258 40% 32% | 6.39:1 |
| `--accent-cream` | light | 42 48% 90% | 36 35% 28% | 6.80:1 |
| `--accent-lavender` | dark | 258 42% 68% | 258 35% 15% | 5.67:1 |
| `--accent-cream` | dark | 42 30% 70% | 36 30% 14% | 7.91:1 |

All ≥ 4.5:1 (AA text). Values used verbatim from the D4 candidates — no tuning needed.

### Per-asset conversion outcomes (B2 / A1a)

| Asset | hasAlpha | bg band | visual verdict | fallback |
|---|---|---|---|---|
| icons/play | true | [0.68,1.02] light | subject + bg clean; minor soft-ramp edge fringe (invisible at icon size) | no |
| icons/heart | true | [0.49,0.86] mid | clean, crisp edges | no |
| icons/bell | true | [-0.02,0.43] dark | clean; genuine hollow retained | no |
| icons/gear | true | [0.86,1.02] light | subject + bg clean; minor soft-ramp edge fringe | no |
| icons/dashboard-tile | true | [0.16,0.45] dark | clean; hollow triangle retained | no |
| illustrations/mascot | true | [-0.02,0.40] dark | clean, crisp | no |
| illustrations/potted-plant | true | [-0.02,0.40] dark | clean; **cream pot fully preserved** (A1a resolved) | no |
| textures/soft-noise | false | n/a (skipChromaKey) | plain lossy WebP re-encode, no alpha | n/a |

**Fallback count: 0** (matches the documented expectation; D3 solid-bg fallback not needed).

## What Was Skipped or Deferred

- In-page `<ClayCard>` rendering of the real converted assets — no consumer wired in Phase 1 scope;
  known-gap deferred to Phase 3 (dashboard tiles) / Phase 4 (visual-evidence.spec.ts). Intentional
  scope boundary per the validate-contract, unchanged.

## Plan Deviations

- **sharp devDependency (Step A0)** — genuine deviation from the umbrella's literal "zero new
  package.json entries" wording, but within its "no new **runtime** dependency" intent (devDep only,
  ops-time, never bundled). Accepted CONDITIONAL carried from the validate-contract. Recommend
  update-process-agent correct the umbrella wording at phase closeout.
- **Direct-invocation guard fix** — the script's `import.meta.url === file://${argv[1]}` guard
  failed because the repo path contains a space (URL-encoded `%20`); switched to resolved-path
  comparison via `fileURLToPath`. Within-blast-radius (same new file), no external impact.
- **Algorithm as-built richer than the plan sketch** — added auto band-detection, a lightness-gated
  saturation-keep, and connected-component despeckle. All within the locked D1 framing (sat/lightness
  classifier + soft ramp + per-asset overrides); necessary because backgrounds are non-uniform
  (light/mid/dark) with saturated dark grain — details above. No change to public contracts.

## Test Infra Gaps Found

- None new. B1a closed the ops-script coverage gap; C4 closed the clay-card className gap.

## Closeout Packet

- **Selected plan:** phase-01-assets-css-foundation_PLAN_16-07-26.md
- **Finished:** all 15 checklist items (A0–C4), Step 5 EXECUTE ticked.
- **Verified:** build/tsc/vitest(37)/ops-test(10)/grep/ls/AA(4)/hasAlpha(8) all green; packages/ui
  clean; 8 assets visually spot-checked (0 fallbacks).
- **Unverified (by design):** in-route `<ClayCard>` rendering of the assets (deferred to Phase 3/4).
- **Remaining:** EVL confirmation run (orchestrator → vc-tester), then UPDATE PROCESS (archive +
  correct umbrella "zero new package.json entries" wording + commit via vc-git-manager).
- **Best next state:** EVL, then Phase 2 (chart-fixes).
- **Follow-up plan stubs created:** none.
- **CONTEXT_PARTIAL items:** none.

## Learnings

- **Gemini seed assets had non-uniform baked backgrounds, not a flat checkerboard.** Corner-sampling
  revealed background lightness split into three bands (light L~0.86-0.95, mid L~0.67, dark
  L~0.17-0.31) rather than one uniform "light checkerboard" as the plan assumed. A single
  high-lightness threshold would have failed the 4 dark-background assets. Lesson: when a batch of
  generated assets shares a nominal spec ("checkerboard transparency placeholder"), verify per-asset
  pixel statistics before locking a single global threshold — visual sameness at a glance does not
  mean uniform underlying pixel data.
- **Saturation/lightness keying alone is insufficient for JPEG-compressed placeholder backgrounds;
  lightness-gating the saturation-keep condition (`satKeepMinL`) was the fix that cleaned the dark
  assets.** Dark backgrounds carry saturated JPEG grain that a naive "low-saturation = background"
  rule keeps as false-positive foreground. Gating saturation-keep on brightness (keep saturated
  pixels only when also bright) resolved this without a hard per-pixel threshold. Reusable pattern
  for any future chroma-key/segmentation script touching compressed source images.
- **Same-day Refresh Note supersession is a legitimate and necessary pattern.** The outer-pvl
  validate-contract and the inner-pvl re-validation both carried the date `16-07-26` — a naive
  "newer than" comparison would have been ambiguous. Writing an explicit `## Inner Loop Refresh
  Note` stating supersession by pass identity (not just date) resolved the ambiguity cleanly and is
  the correct approach whenever RESEARCH+INNOVATE+PLAN-SUPPLEMENT complete within the same PVL
  calendar day as the outer-pvl contract.
- **Direct-invocation guard fix for ESM scripts:** the standard `import.meta.url ===
  file://${process.argv[1]}` guard breaks when the repo path contains a space (URL-encoding
  mismatch). Use a resolved-path comparison via `fileURLToPath(import.meta.url) ===
  path.resolve(process.argv[1])` instead — safe default for any future ops script in a
  space-containing path (this repo's path is `.../Gayo Sphere/HigherBits.dev`).

## Forward Preview

- **Test Infra Found:** `apps/web/scripts/wcag-contrast.mjs` (reusable AA gate); ops unit tests use
  `node --test` with synthetic fixtures (no real-asset I/O). vitest baseline is 37/13.
- **Blast Radius Changes:** new `ops/gemini-asset-chroma-key.mjs` (+ test); root `package.json`/
  `pnpm-lock.yaml` gained sharp; `apps/web/app/globals.css` gained 2 utilities + 4 token pairs (×2
  themes); 8 `.jpg`→`.webp` swap; manifest format fields updated.
- **Commands to Stay Green:** `corepack pnpm --filter web build`, `... exec tsc --noEmit`,
  `... test`, `node --test ops/__tests__/gemini-asset-chroma-key.test.mjs`.
- **Dependency Changes:** `sharp` added to ROOT devDependencies only (ops-time; never bundled).
  Phase 3 will consume `--accent-lavender`/`--accent-cream` and the clay-card image slots with the
  real WebP assets.
