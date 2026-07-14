---
name: note:phase-program-plan-shape-validator-mismatch
description: "validate-plan-artifact.mjs produces 6 FAILs/4 WARNs against phase-program sub-plan header shape vs the general single-plan template it expects"
date: 08-07-26
metadata:
  node_type: memory
  type: backlog-note
  feature: general-plans
---

# Backlog Note — `validate-plan-artifact.mjs` vs Phase-Program Sub-Plan Shape

**Filed during:** 21st-promotion Phase 0 (Pre-migration Audit & Scaffold), VALIDATE V1 structural checks.
**Priority:** Low-Medium — harness-level tooling precision gap, not a correctness bug. Not specific to the 21st-promotion program; affects every phase-program sub-plan.

## Problem

`node .claude/skills/vc-generate-plan/scripts/validate-plan-artifact.mjs` reports 6 FAILs and 4 WARNs when run against a phase-program sub-plan file (e.g. `phase-00-pre-migration_PLAN_08-07-26.md`):

- FAILs: missing `Date:`/`Status:`/`Complexity:` metadata fields, missing overview/context section, missing Phase Completion Rules, missing Acceptance Criteria.
- WARNs: does not mention `process/context/all-context.md`, no testing-context mention, "legacy shape" flag (no execute-anchor note), "legacy shape" flag (no supporting-phase-file notes).

## Root cause

Phase-program sub-plans use a DIFFERENT, intentional header convention: `**Program:**` / `**Phase status:**` / `## Phase Loop Progress` / `## Validate Contract`, with the umbrella plan (not the sub-plan) carrying `Date:`/`Status:`/`Complexity:`/Program Goal Charter/acceptance-equivalent content. `validate-plan-artifact.mjs` was written for the general single-plan template and has no phase-program-aware branch, so it always flags phase-program sub-plans as structurally deficient even when they are fully correct for their own convention.

This has been observed identically across multiple phase programs in this repo (cozy_promotion, cozy-21st-mirror, creator-studio, 21st-clone, port-ingested-components, and now 21st-promotion) — it is a systemic validator/template mismatch, not a one-off plan defect.

## Fix options

1. **Validator special-case** — add phase-program-sub-plan detection to `validate-plan-artifact.mjs` (e.g. presence of `**Program:**` + `## Phase Loop Progress` headers) and apply a different, phase-program-aware rule set that checks for `**Program:**`, `**Phase status:**`, `## Phase Loop Progress`, `## Validate Contract` instead of the general-template fields.
2. **Template convergence** — have `vc-generate-phase-program`'s phase-stub template also emit the general template's `Date:`/`Status:`/`Complexity:` metadata lines (redundant with `**Phase status:**` but satisfies the validator) so phase-program sub-plans pass the unmodified general validator.
3. **Suppress/ignore for phase-program sub-plans** — mark this validator as advisory-only (not blocking) when a plan file matches the phase-program shape, documented explicitly rather than silently producing false FAILs every time.

**Recommendation:** Option 1 (validator special-case) is the most durable fix — it keeps both templates intentionally distinct rather than forcing convergence, and stops the recurring false-FAIL noise across every phase program in this repo.

## Verification of fix

- `validate-plan-artifact.mjs` run against a known-good phase-program sub-plan (e.g. this Phase 0 plan) returns 0 FAILs / 0 WARNs (or a phase-program-specific pass state).
- `validate-plan-artifact.mjs` run against a known-bad general single-plan still correctly flags real deficiencies (no regression in the general-template check path).
