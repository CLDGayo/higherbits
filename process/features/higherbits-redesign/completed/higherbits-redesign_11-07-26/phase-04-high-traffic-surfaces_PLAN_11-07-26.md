---
name: plan:higherbits-redesign-phase-04-high-traffic-surfaces
description: "HigherBits.dev Visual Redesign & Rebrand — Phase 04: High-Traffic Surfaces"
date: 11-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-redesign
  phase: phase-04
---

# Phase 04 — High-Traffic Surfaces

**Program:** higherbits-redesign
**Umbrella plan:** process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/higherbits-redesign-umbrella_PLAN_11-07-26.md
**Phase status:** ✅ VERIFIED
**Report destination:** process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-04-high-traffic-surfaces_REPORT_11-07-26.md (flat in the program task folder)

---

## Purpose

Restyle the surfaces users hit most after landing: component/user detail pages, search, tags,
collections, pricing, and the code-block rendering (Shiki) used throughout the marketplace. This
is the phase where the Fira Code / dark snippet-card treatment from the reference image (mac
traffic-light dots, dark `#333A41`-ish background) gets built — a pattern several other surfaces
in Phase 5 will also depend on.

---

## Entry Gate

- Phase 03 exit gate passed (chrome/landing restyle patterns established to reuse).

---

## Blast Radius

- `apps/web/app/[username]/[component_slug]/` (or equivalent detail route — confirm exact path
  during RESEARCH) — SOLE owner.
- `apps/web/app/q/` (search) — SOLE owner.
- `apps/web/app/s/` (tags) — SOLE owner.
- `apps/web/app/c/` (collections) — SOLE owner.
- `apps/web/app/pricing/` — SOLE owner.
- `apps/web/components/ui/code.tsx` — SOLE owner (Shiki theme: Fira Code font, dark
  `#333A41`-ish background, mac traffic-light dots per reference image).
- Any per-feature header components under `apps/web/components/features/{user-page,tag-page}/`
  relevant to these routes.

---

## Implementation Checklist

### Step A — code.tsx Shiki theme

- [ ] A1. Read the current `apps/web/components/ui/code.tsx` custom shiki styling (string-injected
      CSS per Context Ground Truth) in full; identify exactly where font-family, background color,
      and window-chrome (if any exists already) are set.
- [ ] A2. Apply Fira Code (`var(--font-fira-code)` from Phase 1) as the code font.
- [ ] A3. Refactor `code.tsx` into a "Mac traffic-light window" aesthetic. DOM structure requires:
      - Outer wrapper: `rounded-xl bg-[#333A41] text-white shadow-md`
      - Top header bar: container with three colored dots (red, yellow, green) for the traffic-light effect
      - Inner `<pre>` block: `font-mono`
- [ ] A4. Confirm the code-block Pro-gated/paywall-stripped rendering path (per Context Ground
      Truth's server-side paywall notes — if applicable to this app's real marketplace context;
      confirm during RESEARCH whether this app has an equivalent gating mechanism) is UNCHANGED in
      behavior — only the visual chrome around it changes.

### Step B — Detail page restyle

- [ ] B1. Restyle the component/user detail page to card-based layout consuming Phase 1 tokens —
      preview area, metadata panel, code-block area (using the Step A styling).
- [ ] B2. Apply Urbanist headings / Inter body throughout.
- [ ] B3. Restyle any CTA buttons (install, copy, favorite, etc.) with coral/aqua-mint accents per
      brand rules — click behavior unchanged.

### Step C — Search / tags / collections restyle

- [ ] C1. Restyle `q/` search results as rounded cards with generous spacing; search input itself
      restyled (rounded, 1rem radius) but debounce/query logic untouched.
- [ ] C2. Restyle `s/` tag pages: tag pill/badge styling using palette accents.
- [ ] C3. Restyle `c/` collection pages: card-grid layout consistent with detail-page card style.

### Step D — Pricing restyle

- [ ] D1. Restyle `pricing/` route: card-based pricing tiers, coral CTA for primary
      upgrade/subscribe action, aqua-mint or pale-sky for secondary actions — Stripe checkout
      trigger logic and pricing data UNCHANGED, visual only.
- [ ] D2. DOM structural changes for Pricing Cards:
      - Apply `rounded-[var(--radius)]` to the pricing card wrappers.
      - Ensure the "Featured" or "Popular" badge elements use `bg-primary text-primary-foreground`.

### Step E — Component Cards

- [ ] E1. Update `apps/web/components/ui/component-card.tsx` to match the soft-grid aesthetic.
- [ ] E2. DOM structural changes for Component Cards:
      - Apply `rounded-[var(--radius)]` to the main card container.
      - Add interactive states: `hover:shadow-md transition-shadow duration-200`.

### Step F — Magic Chat Waitlist

- [ ] F1. Restyle the Magic Chat waitlist form.
- [ ] F2. DOM structural changes for Magic Chat Waitlist:
      - Wrap the input and button in a centralized soft-shadow card wrapper.
      - Apply styling to the wrapper: `shadow-sm hover:shadow-md rounded-[var(--radius)]`.

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

# Fira Code wired into code blocks
grep -n "font-fira-code\|Fira" apps/web/components/ui/code.tsx
# Expected: match found
```

- All checklist items (A1-D1) checked.
- Detail/search/tags/collections/pricing/code-block surfaces visually match design system.
- Build + typecheck + test gates green.
- Phase report written to report destination above.

**Agent-probe checkpoint (required for this phase's exit gate):** `vc-agent-browser` screenshots
of the detail page, search results, and a code-block rendering (light + dark theme), compared
against the locked design system.

---

## Blockers That Would Justify BLOCKED Status

- Phase 03 exit gate not yet passed.
- The paywall/Pro-gating mechanism for code blocks (if this app has an equivalent to the Context
  Ground Truth's "server-side paywall" pattern) is discovered to be so tightly coupled to current
  code.tsx markup that a pure visual restyle risks breaking the gate — STOP and route to
  backlog/scope-clarification rather than touching gating logic.
- Stripe/pricing data-fetching logic in `pricing/` is discovered to be inline with styling in a way
  that can't be cleanly separated — same STOP-and-clarify rule.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read (Phase 00-03); confirm exact route paths and existing code.tsx structure; test context loaded
- [x] 2. INNOVATE — innovate-agent: approach decided (code-block bg token strategy, traffic-light-dot implementation); Decision Summary written
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

- `apps/web/app/[username]/[component_slug]/` (detail route — exact path confirmed during RESEARCH)
- `apps/web/app/q/`
- `apps/web/app/s/`
- `apps/web/app/c/`
- `apps/web/app/pricing/`
- `apps/web/components/ui/code.tsx`
- `apps/web/components/features/{user-page,tag-page}/` (headers, if applicable)

---

## Public Contracts

- No route, API, schema, auth, or billing-flow logic changes.
- Search debounce/query params, Stripe checkout triggers, and any paywall gating mechanism
  UNCHANGED in behavior — visual restyle only.

---

## Verification Evidence

```bash
corepack pnpm --filter web build
corepack pnpm --filter web exec tsc --noEmit
corepack pnpm --filter web test
# Expected: all exit 0

# Agent-probe: vc-agent-browser screenshots of detail/search/code-block, light + dark
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-04-high-traffic-surfaces_PLAN_11-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1), after Phase 03 exit gate confirmed passed

---

## Validate Contract

Status: CONDITIONAL
Date: 11-07-26
date: 2026-07-11
generated-by: inner-pvl: phase-04

Parallel strategy: sequential
Rationale: 1 signal (UI restyling phase requires highly coupled execution)

Test gates:

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| build-01 | Web app builds cleanly | Fully-Automated | `corepack pnpm --filter web build` | A |
| type-01 | Web app typechecks cleanly | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` | A |
| test-01 | Web app test suite passes | Fully-Automated | `corepack pnpm --filter web test` | A |
| visual-01 | High-traffic surfaces match design | Agent-Probe | `vc-agent-browser` screenshots of detail/search/code-block (light/dark) | A |

Failing stub:
`test("should Web app builds cleanly", () => { throw new Error("NOT IMPLEMENTED — TDD stub: Web app builds cleanly") })`
`test("should Web app typechecks cleanly", () => { throw new Error("NOT IMPLEMENTED — TDD stub: Web app typechecks cleanly") })`
`test("should Web app test suite passes", () => { throw new Error("NOT IMPLEMENTED — TDD stub: Web app test suite passes") })`

Dimension findings:
- Infra fit: PASS — Pure visual restyle using existing tokens; no infrastructure changes required.
- Test coverage: PASS — Existing test suites run; visual changes covered by vc-agent-browser agent-probe checkpoint.
- Breaking changes: PASS — Explicitly states no route, API, schema, auth, or billing logic changes.
- Security surface: PASS — No new data vectors or authorization logic; styling only.
- Structural Validation: FAIL — Plan file is missing required formal RIPER-5 structure elements (metadata, context, completion rules).

Open gaps: none

What this coverage does NOT prove:
- Visual edge cases (e.g., extremely long user names, unexpected component slugs)
- Accessibility regression on the restyled tags/buttons
- Exact alignment of gradients/shadows on non-standard device widths

Gate: CONDITIONAL
Accepted by: user (Structural validation failures accepted as expected for phase plans in this program context.)

---

## Inner Loop Refresh Note

**Date:** 11-07-26
**Summary:** PLAN-SUPPLEMENT: Added Mac traffic-light window layout for code blocks and soft-grid parameters for Component Cards, Pricing cards, and Magic Chat waitlist form based on INNOVATE findings.
