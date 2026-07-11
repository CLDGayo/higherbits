---
name: plan:higherbits-redesign-phase-02-brand-sweep
description: "HigherBits.dev Visual Redesign & Rebrand — Phase 02: Brand Sweep"
date: 11-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-redesign
  phase: phase-02
  generated-by: inner-pvl: phase-02
---

# Phase 02 — Brand Sweep

**Program:** higherbits-redesign
**Umbrella plan:** process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/higherbits-redesign-umbrella_PLAN_11-07-26.md
**Phase status:** ✅ VERIFIED
**Report destination:** process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-02-brand-sweep_REPORT_11-07-26.md (flat in the program task folder)

---

## Purpose

Replace all "21st.dev" brand identity with "HigherBits.dev — Sophisticated Calm Development":
`SITE_NAME`/constants, the metadata title template, the isometric cube-cluster logo (SVG
component), favicon/OG image/manifest, and the ~69 hardcoded "21st.dev" string occurrences
(including support emails) found across `apps/web` at program start. This phase does NOT touch
component layout/spacing — pure brand-string and logo-asset swap so Phase 3 can build chrome on
top of a fully rebranded foundation.

---

## Entry Gate

- Phase 01 exit gate passed (tokens + fonts available for the new logo/brand components to
  consume).

---

## Blast Radius

- `apps/web/lib/constants.ts` — SOLE owner (SITE_NAME, SITE_URL, SITE_TITLE, SITE_SLOGAN, support
  email constant).
- `apps/web/app/layout.tsx` — SHARED with Phase 1, but Phase 2 owns ONLY the `metadata` object
  (title template string `"%s | 21st.dev"` → wired to `SITE_NAME` constant instead of hardcoded,
  per Context Ground Truth note that layout.tsx currently BYPASSES the constant). Phase 2 MUST NOT
  touch the font-import/variable lines — those belong exclusively to Phase 1 (already done by the
  time Phase 2 starts, per Join Conditions).
- New: `apps/web/components/ui/logo.tsx` (or equivalent) — isometric cube-cluster SVG logo
  component (3 cubes: aqua mint fill, coral fill, outline-only).
- New/updated: `apps/web/public/favicon.ico`, OG image asset, `manifest.json` (or Next.js
  `app/manifest.ts` if that convention is used — confirm during RESEARCH).
- ~69 files across `apps/web` containing "21st.dev" string occurrences (support emails,
  our-story/studio/magic/settings/privacy/terms/api-access pages, etc. — confirmed count from
  Phase-0-adjacent ground truth grep at umbrella-plan-write time; RE-confirm exact count during
  this phase's RESEARCH since Phase 0/1 changes may shift counts slightly).
- `apps/web/app/sitemap.ts` if it contains brand-string references.

---

## Implementation Checklist

### Step A — Constants + metadata wiring

- [ ] A1. Update `apps/web/lib/constants.ts`: `SITE_NAME = "HigherBits.dev"`,
      `SITE_URL = "https://higherbits.dev"`, `SITE_SLOGAN`/tagline = `"Sophisticated Calm
      Development"`, `SITE_TITLE` derived template unchanged in structure.
- [ ] A2. Update `apps/web/lib/constants.ts` by explicitly exporting `SUPPORT_EMAIL = "support@higherbits.dev"`. Centralize as a constant if not already one.
- [ ] A3. Fix `apps/web/app/layout.tsx` line 22 `template: "%s | 21st.dev"` to read
      `` `%s | ${SITE_NAME}` `` (or equivalent import-and-interpolate pattern) — wiring the
      previously-bypassed constant in, per Context Ground Truth.

### Step B — Isometric cube-cluster logo

- [ ] B1. Build `apps/web/components/ui/logo.tsx` with a `<Hexagon>` from `lucide-react` and `<span className="font-bold text-foreground">Higher</span><span className="font-bold text-primary">Bits</span>`. Keep the `BrandAssetsMenu` context menu wrapper if it exists.
- [ ] B2. Do NOT wire the logo into header/footer yet — that's Phase 3's job. Phase 2 only builds
      the reusable component.

### Step C — Favicon / OG image / manifest

- [ ] C1. Generate a favicon using the `generate_image` tool (1:1 aspect ratio, aqua-mint and coral palette). Replace `apps/web/public/favicon.ico` or equivalent.
- [ ] C2. Generate an OG (Open Graph) share image using the `generate_image` tool (1200x630, aqua-mint and coral palette). Replace existing OG image asset.
- [ ] C3. Update `manifest.json` (or `app/manifest.ts`) — `name`, `short_name`, `theme_color`
      (aqua mint or base bg — pick per platform convention), `background_color` (#F5F5F0), icon
      references pointing at the new favicon/logo assets.

### Step D — Full-repo brand-string sweep

- [ ] D1. Codebase-wide replacement of "21st.dev" -> "HigherBits.dev" and "21st Design" -> "HigherBits Design", explicitly excluding `.env*` to protect underlying Auth domains. (Write a script or use bulk replace).
- [ ] D2. Systematically replace each "21st.dev" occurrence with the correct new value: brand name
      → `SITE_NAME`/"HigherBits.dev" (prefer importing the constant over re-hardcoding where the
      context is a display string; hardcode is acceptable in things like example/mock data or
      test fixtures where the constant import would be awkward — use judgment, but prefer the
      constant), URLs → `SITE_URL`/`https://higherbits.dev`, emails → the new support-email
      constant. Ensure exclusion of `.env*` files during these updates.
- [ ] D3. Cover named pages explicitly called out in the task: `our-story`, `studio`, `magic`,
      `settings`, `privacy`, `terms`, `api-access` — confirm each of these route segments' brand
      references is caught by the D1 grep sweep, don't rely on D1 alone if any of these use a
      non-literal string construction (template interpolation, i18n keys, etc.) that grep might
      miss.
- [ ] D4. Update `apps/web/app/sitemap.ts` if it references the old domain/brand.
- [ ] D5. Re-run the D1 grep after all edits; confirm zero remaining "21st.dev" occurrences in
      `apps/web` (excluding intentional exceptions like a changelog/history note referencing the
      OLD name for historical accuracy — if any such exception exists, document it explicitly in
      the phase report; do not silently leave unexplained matches).

---

## Exit Gate

```bash
# Build gate
corepack pnpm --filter web build
# Expected: exit 0

# Typecheck gate
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

# Test gate
corepack pnpm --filter web test
# Expected: exit 0

# Brand-string sweep gate — the critical gate for this phase
grep -rc "21st\.dev" apps/web --include="*.ts" --include="*.tsx" | grep -v ":0"
# Expected: empty output (zero files with remaining occurrences), OR explicitly documented
# exceptions listed in the phase report

# Logo component exists
test -f apps/web/components/ui/logo.tsx && echo "logo exists"
# Expected: "logo exists" printed
```

- All checklist items (A1-D5) checked.
- Zero unexplained "21st.dev" occurrences remain.
- Logo component built (not yet wired into chrome — that's Phase 3).
- Favicon/OG/manifest updated.
- Build + typecheck + test gates green.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Phase 01 exit gate not yet passed.
- Actual production domain / support email address cannot be confirmed and no reasonable default
  exists — would require user input to avoid guessing a wrong external-facing value (flag as a
  CONCERN in validate, not necessarily a hard BLOCKED, since a placeholder value can ship and be
  corrected without code-structure changes).
- A "21st.dev" occurrence is found in a location that is NOT plain source (e.g. baked into a
  compiled asset, or dependent on an external package's default export) — would need scope
  clarification.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read (Phase 00, Phase 01 reports); re-confirm exact brand-string occurrence count and locations; test context loaded
- [x] 2. INNOVATE — innovate-agent: approach decided (logo color strategy — hardcoded hex vs CSS-var derived; support-email/domain final values); Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first.

---

## Touchpoints

- `apps/web/lib/constants.ts`
- `apps/web/app/layout.tsx` (metadata object only — NOT font lines, reserved to Phase 1)
- `apps/web/components/ui/logo.tsx` (new)
- `apps/web/public/favicon.ico` / `app/icon.tsx` / OG image asset / manifest
- ~69 files across `apps/web` carrying brand-string occurrences (final list confirmed during RESEARCH)
- `apps/web/app/sitemap.ts` (if applicable)

---

## Public Contracts

- No route, API, schema, or behavior changes. Pure string/asset replacement.
- Support-email address change is technically an outward-facing detail (if this address is live
  and monitored) — flag as a CONCERN for the validate-contract to confirm before EXECUTE, since it
  affects a real external contact point, even though it's a "visual/brand" change per program
  scope.

---

## Verification Evidence

```bash
corepack pnpm --filter web build
corepack pnpm --filter web exec tsc --noEmit
corepack pnpm --filter web test
grep -rc "21st\.dev" apps/web --include="*.ts" --include="*.tsx" | grep -v ":0"
# Expected: build/typecheck/test all exit 0; grep sweep empty (or documented exceptions)
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-02-brand-sweep_PLAN_11-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1), after Phase 01 exit gate confirmed passed

---

## Validate Contract

Status: CONDITIONAL
Date: 11-07-26
date: 2026-07-11
generated-by: inner-pvl: phase-02

Parallel strategy: sequential
Rationale: 1/7 signals present (S7: 5+ files in blast radius); straightforward string replacement phase suitable for a sequential agent.

Test gates:

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| B-1 | Code builds successfully | Fully-Automated | `corepack pnpm --filter web build` | A |
| T-1 | Types check successfully | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` | A |
| T-2 | Existing tests pass | Fully-Automated | `corepack pnpm --filter web test` | A |
| S-1 | No old brand strings remain | Fully-Automated | `grep -rc "21st\.dev" apps/web --include="*.ts" --include="*.tsx" \| grep -v ":0"` | A |

Dimension findings:
- Infra fit: PASS — No new infrastructure required, purely visual and brand-string replacements.
- Test coverage: PASS — Existing build/typecheck/test gates will run; grep verifies the exact string replacement completion.
- Breaking changes: CONCERN — Support email address change affects external users; user confirmed default.
- Security surface: PASS — Static frontend asset and constant replacements pose no new security risks.

Open gaps: none

What this coverage does NOT prove:
- B-1: Does not prove application functionality at runtime.
- T-1: Does not prove behavior, only type safety.
- T-2: Does not prove new string logic is tested if tests don't explicitly assert it.
- S-1: Does not prove visual layout or aesthetics of the logo component.

Gate: CONDITIONAL
Accepted by: user (Accept with noted concerns: support email confirmed as support@higherbits.dev)

---

## Inner Loop Refresh Note

**11-07-26**: PLAN-SUPPLEMENT: Added logo DOM structure, bulk replacement exclusions, and asset generation strategy.

---

## Test Infra Improvement Notes

None identified yet. To be updated if any infrastructure changes are made.
