---
name: plan:higherbits-redesign-phase-01-tokens-typography
description: "HigherBits.dev Visual Redesign & Rebrand — Phase 01: Design Tokens + Typography Foundation"
date: 11-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-redesign
  phase: phase-01
---

# Phase 01 — Design Tokens + Typography Foundation

**Program:** higherbits-redesign
**Umbrella plan:** process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/higherbits-redesign-umbrella_PLAN_11-07-26.md
**Phase status:** ✅ VERIFIED
**Report destination:** process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-01-tokens-typography_REPORT_11-07-26.md (flat in the program task folder)

---

## Purpose

Lay the foundational design-token and typography layer every later phase consumes. Swap
`apps/web/app/globals.css` from shadcn-blue defaults to the locked HigherBits palette (light AND
dark), bump `--radius` from 0.5rem to 1rem, add soft-shadow tokens, wire `tailwind.config.js`, and
replace GeistSans/GeistMono with Urbanist (headings) / Inter (body) / Fira Code (code) via
`next/font/google`. This phase touches ZERO component markup — pure token/font plumbing so later
phases can restyle by consuming these values.

---

## Entry Gate

- Phase 00 exit gate passed (packages/ui confirmed unconsumed, context refreshed, smoke tests
  passing and green).

---

## Blast Radius

- `apps/web/app/globals.css` — SOLE owner of `:root`/`.dark` CSS variable blocks (~96 lines).
  Later phases MUST NOT re-edit these variable declarations, only consume them via Tailwind
  classes/CSS var references.
- `apps/web/tailwind.config.js` — SOLE owner of token wiring in this phase.
- `apps/web/app/layout.tsx` — SHARED with Phase 2, but Phase 1 owns ONLY the font import/variable
  lines (removing `GeistSans`/`GeistMono` from `geist/font/*`, adding `next/font/google` imports
  for Urbanist/Inter/Fira Code, and the `className`/`variable` wiring on the root `<html>`/`<body>`
  tags). Phase 1 MUST NOT touch the `metadata` object (template string, title, description) — that
  belongs exclusively to Phase 2.
- `apps/web/package.json` — no new dependency needed (next/font/google ships with Next.js), but
  confirm no stale `geist` reference needs removal from `package.json` deps.

---

## Implementation Checklist

### Step A — Palette tokens (light + dark)

- [ ] A1. Read the existing `:root` block in `apps/web/app/globals.css` (HSL-format
      `hsl(var(--x))` convention) and the existing `.dark` block; confirm HSL is the required
      format (Tailwind's `hsl(var(--x))` wiring depends on bare `H S% L%` triples, not hex).
- [ ] A2. Convert the locked hex palette to HSL triples: `#76E2E2` (aqua mint primary),
      `#F59D8C` (coral secondary/CTA), `#F5F5F0` (base background), `#333A41` (text), `#E0E0E0`
      (subtle borders/dividers), `#C9DCEB` (tertiary/pale-sky — mark explicitly as
      derived/approximate per task instructions, refine visually in this phase's own QA pass, not
      deferred silently).
- [ ] A3. Write light-theme `:root` values: `--background`, `--foreground`, `--primary` (`180 67% 67%`),
      `--primary-foreground` (`180 80% 10%`), `--secondary` (`10 85% 75%`),
      `--secondary-foreground` (`0 0% 10%`), `--muted`/`--accent` (using #E0E0E0 family), `--border`
      (#E0E0E0), `--card` (white or near-white per "white cards on #F5F5F0 base"), etc. Preserve
      any variable NAMES not covered by the locked palette (e.g. `--destructive`) as reasonable
      derivations, not left broken.
- [ ] A4. Write dark-theme `.dark` block equivalents for EVERY new token added in A3 — do not
      leave any token dark-mode-undefined. Use judgment for dark-mode dark base / light text
      inversions consistent with the aqua/coral brand (do not invert to a generic dark-gray theme
      that clashes with the brand).
- [ ] A5. Add `--radius: 1rem;` (was `0.5rem`).
- [ ] A6. Add soft-shadow token(s) (e.g. `--shadow-soft: 0 2px 12px hsl(var(--foreground) / 0.06);`
      or similar) for the "soft shadows" style rule — confirm naming doesn't collide with any
      existing shadow utility.

### Step B — Tailwind wiring

- [ ] B1. Read `apps/web/tailwind.config.js` in full; confirm how `--radius` and color tokens are
      currently consumed (`borderRadius: { lg: "var(--radius)", ... }` pattern likely already
      exists per shadcn convention — confirm exact keys).
- [ ] B2. Update/confirm Tailwind's `borderRadius` scale references `var(--radius)` (1rem) and any
      derived sizes (`md`, `sm`) scale sensibly from the new base.
- [ ] B3. Confirm Tailwind `colors` extend block maps `primary`/`secondary`/`accent`/etc. to the
      updated CSS vars (should already be wired if the vars keep the same NAMES — only values
      changed. If names diverge, update the mapping).
- [ ] B4. Add a `boxShadow` extension entry for the new soft-shadow token if Tailwind's `shadow-*`
      utilities should expose it (e.g. `shadow-soft`).

### Step C — Typography (Urbanist / Inter / Fira Code)

- [ ] C1. Confirm exact current import: `import { GeistSans } from "geist/font/sans"` and
      `import { GeistMono } from "geist/font/mono"` in `apps/web/app/layout.tsx`; identify every
      usage of `GeistSans.variable`/`GeistMono.variable` and any `font-sans`/`font-mono` Tailwind
      class assumptions elsewhere in the codebase (grep for `GeistSans\|GeistMono\|font-geist`).
- [ ] C2. Add `next/font/google` imports for `Urbanist` (headings), `Inter` (body), `Fira_Code`
      (code) with appropriate `subsets`, `variable` names (e.g. `--font-urbanist`, `--font-inter`,
      `--font-fira-code`), and `display: "swap"`.
- [ ] C3. Wire the three font variables onto the root layout element (`<html className={...}>` or
      `<body className={...}>` — match existing convention) alongside/replacing the Geist
      variables.
- [ ] C4. Update `tailwind.config.js` `fontFamily` extension: map `Inter` to `font-sans` (`sans: ["var(--font-inter)", ...]`),
      map `Urbanist` to `font-display` (`display: ["var(--font-urbanist)", ...]`), and
      map `Fira Code` to `font-mono` (`mono: ["var(--font-fira-code)", ...]`).
- [ ] C5. Remove the `geist` package import lines from `layout.tsx`; confirm `geist` can be
      removed from `apps/web/package.json` dependencies (check no other file imports it via grep)
      — if other files still depend on it, leave the dependency installed but flag in the phase
      report as a Phase 2+ cleanup candidate (do not silently leave dead imports elsewhere).
- [ ] C6. Do NOT apply the new `font-heading`/Urbanist utility to any actual heading elements in
      component markup yet — that is Phase 3+'s job (this phase only makes the utility available).

---

## Exit Gate

```bash
# Build gate
corepack pnpm --filter web build
# Expected: exit 0

# Typecheck gate
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

# Test gate (Phase 0 smoke tests must still pass — no regression from token/font swap)
corepack pnpm --filter web test
# Expected: exit 0

# Token verification
grep -n "\-\-radius: 1rem" apps/web/app/globals.css
# Expected: match found

grep -n "font-fira-code\|font-urbanist\|font-inter" apps/web/tailwind.config.js
# Expected: matches found

grep -n "geist/font" apps/web/app/layout.tsx
# Expected: no match (Geist imports removed)
```

- All checklist items (A1-C6) checked.
- Light AND dark theme both have complete token sets (no dark-mode-undefined new tokens).
- Build + typecheck + test gates green.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Phase 0 exit gate not yet passed.
- Existing Tailwind config uses a token-wiring pattern too divergent from shadcn defaults to map
  cleanly onto the new palette without a larger refactor (would need scope escalation).
- `next/font/google` cannot resolve one of the three fonts (rare, but check Google Fonts
  availability for Fira Code / Urbanist specifically before committing to the approach).

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read (Phase 0 report); test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided (e.g. exact HSL conversions, dark-mode derivation strategy); Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated (or "n/a — research clean")
- [ ] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first.

---

## Touchpoints

- `apps/web/app/globals.css`
- `apps/web/tailwind.config.js`
- `apps/web/app/layout.tsx` (font import/variable lines only — NOT metadata object, reserved for Phase 2)
- `apps/web/package.json` (possible geist dependency removal, only if safe)

---

## Public Contracts

- No route, API, or behavior changes. Pure CSS-variable and font-loading changes.
- Existing `next-themes` `.dark` class toggle mechanism unchanged.

---

## Verification Evidence

```bash
corepack pnpm --filter web build
corepack pnpm --filter web exec tsc --noEmit
corepack pnpm --filter web test
# Expected: all exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-01-tokens-typography_PLAN_11-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1), after Phase 0 exit gate confirmed passed

---

## Validate Contract

Status: CONDITIONAL
Date: 11-07-26
date: 2026-07-11
generated-by: inner-pvl: phase-01

Parallel strategy: sequential
Rationale: 1 dominant signal: independent scope

Test gates (C3 5-column table — ADDITIVE; existing consumers still parse the legacy line form below it):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| TG-1 | build passes | Fully-Automated | `corepack pnpm --filter web build` | A |
| TG-2 | types pass | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` | A |
| TG-3 | smoke tests pass | Fully-Automated | `corepack pnpm --filter web test` | A |
| TG-4 | token configuration | Hybrid | grep verifications | A |

Dimension findings:
- Infra fit: PASS — Pure CSS and Tailwind config updates; no infrastructure changes.
- Test coverage: PASS — Existing smoke tests cover regressions; token values verified via explicit commands.
- Breaking changes: PASS — Safe visual updates mapped to variables; no behavioral breaking changes.
- Security surface: PASS — Static styling changes only; no security impact.
- Structural validation: CONCERN — Plan artifact missing Date, Status, Complexity metadata; missing overview, Phase Completion Rules, and Acceptance Criteria sections.

Open gaps: none

What this coverage does NOT prove:
- TG-1, TG-2, TG-3: Does not prove that the UI matches the design intent visually (only that it compiles and passes basic assertions).
- TG-4: Does not prove the correctness of the HSL values themselves, only that they are present in the CSS.

Gate: CONDITIONAL
Accepted by: user (Structural validation failures accepted as non-blocking due to phase program context)

---

## Inner Loop Refresh Note

- **11-07-26:** PLAN-SUPPLEMENT: Added explicit HSL triples for primary/secondary and font wiring mappings.
