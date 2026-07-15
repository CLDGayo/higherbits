---
name: plan:claymorphism-3d-redesign-preexisting-muted-foreground-contrast
description: "Backlog — pre-existing muted-foreground AA contrast failure on 4 routes, unrelated to this program"
date: 15-07-26
metadata:
  node_type: memory
  type: backlog-note
  feature: claymorphism-3d-redesign
---

# Pre-existing `--muted-foreground` contrast failure — 4 routes

**Date:** 15-07-26
**Source:** Phase 01 (Architecture & Prompt Engineering) EVL confirmation run,
`claymorphism-3d-redesign` program. See
`process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-01-architecture-prompt-engineering-evl-iteration-001_REPORT_15-07-26.md`
and the Phase 01 phase report.

**Gap:** The Axe a11y Playwright suite (`apps/web/e2e/a11y.spec.ts`) fails AA contrast on 4
routes — `/magic`, `/api-access`, `/contest`, `/templates` — for `text-muted-foreground`
rendered over chip backgrounds. Measured ratio: `4.41`, required: `4.5`. Foreground color
`#78695e` on background `#ede9f6`.

**Why deferred / not fixed in Phase 01:** This failure predates the `claymorphism-3d-redesign`
program. Confirmed:
- None of the failing routes render `.clay-surface` or consume `--accent-yellow` — Phase 01's
  new tokens are declared-only, not yet wired into any route.
- Phase 01's `globals.css` diff is purely additive (+75/−0); it could not have altered any
  existing rendered color.
- Fixing `--muted-foreground` requires changing an EXISTING token value, which is outside
  Phase 01's additive-only public contract and outside its declared blast radius.

**Suggested resolution:**
1. Adjust the `--muted-foreground` HSL/hex value (or the chip background it pairs with) in
   `apps/web/app/globals.css` `:root` (and check `.dark` for the same pairing) until the
   contrast ratio is ≥ 4.5:1, using the same WCAG contrast-ratio helper introduced in Phase 01
   (`apps/web/scripts/wcag-contrast.mjs`).
2. Re-run `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` to confirm all 4
   routes pass.
3. This is a small, independent housekeeping fix — does not require phase-program scoping,
   but should be scheduled before or during the `claymorphism-3d-redesign` program's Phase 5
   (final a11y QA) if not resolved sooner, since Phase 5's exit gate requires a fully green
   a11y run.
