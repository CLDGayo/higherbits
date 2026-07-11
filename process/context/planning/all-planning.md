---
name: context:planning
description: Planning context entrypoint — plan-shape calibration (SIMPLE vs COMPLEX) and example plan references.
keywords: [planning, plan, prd, simple, complex, calibration, generate-plan]
date: 2026-06-24
metadata:
  node_type: context-group
  type: context
  group: planning
---

# Planning Context

Canonical planning context entrypoint for Cozy Downloads.

Use it after `process/context/all-context.md` when the task needs plan-shape calibration, planning conventions, or implementation-plan examples.

## Scope

This group covers:

- example plan shapes
- SIMPLE vs COMPLEX plan calibration
- durable planning references that should not stay at the `process/context/` root

It does not cover:

- active implementation plans
- feature reports
- backlog items

Those belong under `process/general-plans/` or `process/features/`.

## Read When

- creating a new plan with `vc-generate-plan`
- checking whether work should be `SIMPLE` or `COMPLEX`
- comparing an active plan against the repo's example plan shapes

## Quick Routing

- use `.claude/skills/vc-generate-plan/references/example-simple-prd.md` to calibrate a one-session plan
- use `.claude/skills/vc-generate-plan/references/example-complex-prd.md` to calibrate a complex or multi-phase plan

## Source Paths

- `.claude/skills/vc-generate-plan/references/example-simple-prd.md`
- `.claude/skills/vc-generate-plan/references/example-complex-prd.md`

## Update Triggers

- the plan artifact contract changes
- `vc-generate-plan` expects different plan sections or statuses
- the example plan shapes move, split, or become stale
