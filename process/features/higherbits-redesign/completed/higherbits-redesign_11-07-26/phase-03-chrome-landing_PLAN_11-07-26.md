---
name: plan:higherbits-redesign-phase-03-chrome-landing
description: "HigherBits.dev Visual Redesign & Rebrand — Phase 03: Core Chrome + Landing"
date: 11-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-redesign
  phase: phase-03
---

# Phase 03 — Core Chrome + Landing

**Program:** higherbits-redesign
**Umbrella plan:** process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/higherbits-redesign-umbrella_PLAN_11-07-26.md
**Phase status:** ✅ VERIFIED
**Report destination:** process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-03-chrome-landing_REPORT_11-07-26.md (flat in the program task folder)

---

## Purpose

Restyle the site's persistent chrome (header, nav, footer) and the landing page to the
card-based, generously-spaced, extreme-rounded-corner aesthetic — the first surfaces a visitor
sees, and the pattern later phases (4, 5) will replicate across the rest of the site. Wires the
new logo (Phase 2) into header/footer, and consumes the design tokens/fonts (Phase 1) throughout.

---

## Entry Gate

- Phase 01 exit gate passed (tokens + fonts available).
- Phase 02 exit gate passed (logo component + brand strings complete — chrome needs both).

---

## Blast Radius

- `apps/web/components/ui/header.client.tsx` — SOLE owner for THIS phase (layout/styling restyle;
  Phase 2 already handled any brand-string content inside it, if applicable).
- `apps/web/components/ui/navigation-menu.tsx` — SOLE owner.
- `apps/web/components/ui/footer.tsx` — SOLE owner.
- `apps/web/app/page.tsx` and `apps/web/app/page.client.tsx` — SOLE owner (landing page restyle).
- Logo wiring: `apps/web/components/ui/logo.tsx` is CONSUMED here (imported into header/footer),
  not modified — Phase 2 owns the component definition.
- Icon library: `lucide-react` usage restyled (stroke-width/color adjustments) in header/nav/footer
  — no new icon library added, keep outline-based lucide icons per style rules.

---

## Implementation Checklist

### Step A — Header + navigation restyle

- [ ] A1. Wire the Phase-2 `logo.tsx` component into `header.client.tsx`, replacing whatever
      brand-mark/text currently renders there.
- [ ] A2. Apply card-based / rounded-corner (1rem via `--radius`) / soft-shadow styling to the
      header container per the "extreme rounded corners" + "soft shadows" style rules. Restructure the header into a floating card: `fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-white/30 backdrop-blur-md border border-white/20 p-4 shadow-sm`.
- [ ] A3. Apply Urbanist heading font utility to any heading-weight text in the header (e.g. brand
      wordmark if text-based alongside the logo mark); body copy uses Inter.
- [ ] A4. Restyle `navigation-menu.tsx`: generous spacing, rounded interactive elements (buttons,
      pills), aqua-mint/coral accent colors for active/hover states, lucide icons restyled
      (outline stroke, brand-accent stroke colors) without changing which icons are used or their
      click behavior.
- [ ] A5. Confirm dark-mode header/nav rendering — visually sample against the Phase 1 dark-token
      set (no dedicated dark-mode automated test exists; note this as an agent-probe verification
      item for the validate-contract).

### Step B — Footer restyle

- [ ] B1. Wire the logo into the footer.
- [ ] B2. Apply card-based / soft-grid spacing and the new palette to footer links/sections. Update the footer content to use CSS grid with gaps, utilizing the 1rem border radius (Tailwind `rounded-2xl`) for card sections. Set the base background to `#F5F5F0`.
- [ ] B3. Confirm footer support-email/brand-string references (set correctly by Phase 2) render
      correctly in the new styling.

### Step C — Landing page restyle

- [ ] C1. Restyle `apps/web/app/page.tsx`/`page.client.tsx` sections to card-based layouts: white
      (or `--card` token) cards on the `#F5F5F0` base background, 1rem radius, soft shadows. Implement soft-grid layout using CSS grid with gaps for page sections, utilizing the 1rem border radius (Tailwind `rounded-2xl`).
- [ ] C1b. Implement native CSS scroll-driven animations (`animation-timeline: view()`) with layer staggering for the Hero/Parallax section. Add `@supports` check, `prefers-reduced-motion` check, and an `IntersectionObserver` fallback for unsupported browsers.
- [ ] C1c. Update Tab Switching/View Transitions logic in `apps/web/app/page.client.tsx` by wrapping the tab selection logic with `document.startViewTransition`. Add `view-transition-name` to the tab content, ensure focus routing in `.finally()`, and fallback for browsers without startViewTransition.
- [ ] C2. Apply Urbanist to all heading-level copy on the landing page; Inter to body copy.
- [ ] C3. Restyle primary CTAs to use the coral (`--secondary`) accent per "warmth/energy, CTA
      buttons" brand intent; secondary/neutral actions can use the aqua-mint primary or the
      pale-sky tertiary token.
- [ ] C4. Apply generous, clutter-free "soft grid" padding/spacing throughout — do not change
      section ORDER, copy content, or any data-fetching/interactive logic (search box, feature
      cards linking to routes, etc.) — restyle only.
- [ ] C5. If the landing page renders any code snippets/preview cards, confirm they defer to
      Phase 4's `code.tsx` Shiki theme work rather than being restyled twice — note in the phase
      report if any landing-page code block exists so Phase 4 knows to check it too.

---

## Exit Gate

```bash
# Build gate
corepack pnpm --filter web build
# Expected: exit 0

# Typecheck gate
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

# Test gate (Phase 0 header/footer/landing smoke tests must still pass post-restyle)
corepack pnpm --filter web test
# Expected: exit 0

# Logo wired into chrome
grep -l "logo" apps/web/components/ui/header.client.tsx apps/web/components/ui/footer.tsx
# Expected: matches in both files
```

- All checklist items (A1-C5) checked.
- Header/nav/footer/landing visually match the HigherBits design system in both light and dark
  theme (agent-probe screenshot checkpoint — see below).
- Build + typecheck + test gates green.
- Phase report written to report destination above.

**Agent-probe checkpoint (required for this phase's exit gate, per umbrella "verified" bar):**
Use `vc-agent-browser` to capture screenshots of the landing page and header/footer in both light
and dark theme; visually compare against the locked design system (palette, radius, typography,
spacing rules) from the umbrella Program Goal Charter. Record judgment (pass/concerns) in the
validate-contract's hybrid/agent-probe test tier section.

---

## Blockers That Would Justify BLOCKED Status

- Phase 01 or Phase 02 exit gates not yet passed.
- Header/footer/landing contain interactive logic so tightly coupled to current styling classes
  that a pure CSS/className restyle would require refactoring component structure — if so, STOP
  and route to backlog/scope-clarification rather than silently expanding into a behavioral
  refactor.
- No vc-agent-browser session available for the agent-probe checkpoint — document as a known-gap,
  not a blocker (per the umbrella's "verified" bar, agent-probe is required but the harness itself
  being unavailable is a known infra gap, not a phase failure — see Test Infra Improvement Notes
  in the umbrella plan).

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read (Phase 00, 01, 02); test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided (exact card/shadow/spacing treatment); Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated (or "n/a — research clean")
- [ ] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first.

---

## Touchpoints

- `apps/web/components/ui/header.client.tsx`
- `apps/web/components/ui/navigation-menu.tsx`
- `apps/web/components/ui/footer.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/page.client.tsx`

---

## Public Contracts

- No route, API, or auth behavior changes.
- Interactive elements (search, nav links, CTAs) retain identical click targets and destinations —
  only visual treatment changes.

---

## Verification Evidence

```bash
corepack pnpm --filter web build
corepack pnpm --filter web exec tsc --noEmit
corepack pnpm --filter web test
# Expected: all exit 0

# Agent-probe: vc-agent-browser screenshot comparison, light + dark theme
# Expected: visual match to locked design system (see umbrella Program Goal Charter)
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-03-chrome-landing_PLAN_11-07-26.md`
- Last completed step: Step 3 (PLAN-SUPPLEMENT)
- Validate-contract status: pending
- Next step: Spawn vc-validate-agent for PVL (Step 4) to write the Validate Contract before EXECUTE.

---

## Validate Contract

Status: CONDITIONAL
Date: 2026-07-11
date: 2026-07-11
generated-by: inner-pvl: phase-03

Test gates:
- Fully-Automated: `corepack pnpm --filter web build`
- Fully-Automated: `corepack pnpm --filter web exec tsc --noEmit`
- Fully-Automated: `corepack pnpm --filter web test` (Phase 0 smoke tests)
- Agent-Probe: `vc-agent-browser` screenshot comparison of header/footer/landing against umbrella design system.

Dimension findings:
- infra/setup-fit: PASS
- test-coverage: CONCERN
- breaking-changes: PASS
- security-surface: PASS

Open gaps:
- Structural validation metadata and sections missing (`Date`, `Status`, `Complexity`, overview/context, Phase Completion Rules, Acceptance Criteria).
- No new tier assignments created for the frontend restyle.

What This Coverage Does NOT Prove:
- Does not automatically prove that the new card-based layouts and extreme-rounded corners match the brand visual identity (relies on agent-probe visual check).
- Does not automatically prove that CSS view transitions or scroll-driven animations behave optimally across all browsers.

Accepted by: session (autonomous, /goal execution) — accepted structural gaps as expected for phase plans; accepted missing test tiers due to existing Phase 0 smoke test coverage.
---

## Inner Loop Refresh Note

**11-07-26:** PLAN-SUPPLEMENT: Added glassmorphism header, view transitions for tab switcher, parallax hero, and soft-grid layout instructions with necessary CSS fallbacks based on INNOVATE decisions.
