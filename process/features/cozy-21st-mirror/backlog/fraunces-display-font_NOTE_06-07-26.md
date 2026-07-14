---
name: report:fraunces-display-font-note
description: "Backlog note — deferred premium serif/display font decision for the Cozy 21st Mirror shell"
date: 06-07-26
metadata:
  node_type: memory
  type: references
  feature: cozy-21st-mirror
---

# Backlog Note — Fraunces / Premium Display Font (Deferred)

**Priority:** Low (cosmetic polish, not a functional gap)

**Origin:** Phase 2 — Premium Layout (`phase-02-layout_PLAN_05-07-26.md`), Test Infra Improvement
Notes. Carried forward at Phase 2 UPDATE PROCESS closeout (06-07-26).

## Problem

The Phase 2 INNOVATE decision explicitly scoped OUT adding a new serif/display font (e.g. Fraunces)
to avoid font-loading scope creep while wiring the 3-theme system and premium typography scale.
Geist remains the only font family in the shell. This means the "premium" typography upgrade is
currently spacing/scale/tracking only — no new display typeface differentiates headings the way
21st.dev's reference aesthetic does.

## Root Cause

Deliberate scope boundary, not a defect — font-loading (next/font, FOUT/CLS considerations, license
checking for a display serif) is a separable unit of work from the CSS-token/theme-wiring rework
Phase 2 delivered.

## Fix Options

1. **Add Fraunces via `next/font/google`** as a `--font-display` CSS variable, applied only to
   `h1`/`h2` (or a `.heading-display` utility), leaving body copy on Geist. Lowest-risk option —
   additive CSS variable, no layout restructuring.
2. **Self-host a variable Fraunces subset** if bundle-size/licensing review prefers not depending on
   Google Fonts at request time — more setup, better control.
3. **Skip entirely** if visual QA (deferred Agent-Probe checkpoint) shows the premium typography
   scale alone is sufficient — revisit only if a future phase's visual review flags it as needed.

## Recommended Timing

Revisit after the deferred Phase 2 Agent-Probe visual QA checkpoint (3-theme render + toggle
persistence), which is recommended to run once Phase 3 — Landing Page lands and `/` becomes fully
visually reviewable. If the landing page's hero/heading treatment reads as "premium enough" without
a display serif, this backlog item can be closed as won't-fix.

## Status

Open — no phase currently scoped to pick this up. Not a blocker for Phase 3-5.
