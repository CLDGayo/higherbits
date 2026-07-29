---
name: report:billing-guard-observability-gap
description: "Backlog — the dual-webhook provider-ownership guard is log-only; no alerting exists for real cross-provider conflicts"
date: 29-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-05
---

# Backlog — No alerting on billing provider-guard conflicts

**Raised by:** supabase-interconnect Phase 5 PLAN-SUPPLEMENT inner-loop pass (29-07-26).
Accepted as the mechanism for this phase (log-only conflict handling matches the phase's own
Exit Gate and does not block PASS) — recorded here so the gap is not silently forgotten.

## What

The new provider-ownership guard (`apps/web/lib/billing-provider-guard.ts`, added by Phase 5)
skips a write and logs when an **active** cross-provider conflict is detected (e.g. a Lemon
Squeezy event arrives for a user whose `users_to_plans` row is already actively owned by Stripe,
or vice versa). This is intentionally log-only for Phase 5 — there is no alerting path (Sentry,
Slack, PagerDuty, or equivalent) wired to this log line.

## Why it's a risk

- A real cross-provider conflict — for example, a bug in either provider's checkout flow that
  causes a user to end up with active subscriptions on both providers simultaneously — would
  currently surface only as a server log line with no operator visibility.
- Billing is a named high-risk class (`process/development-protocols/orchestration.md`
  §High-Risk Execution Handoff); silent-log-only handling of a genuine conflict could let an
  incorrect grant/revocation state persist unnoticed for an extended period.

## Suggested resolution (future task, not scoped)

- Wire the guard's conflict-log call site to whatever error/alert channel the repo adopts (none
  currently exists app-wide for this kind of business-logic conflict, not just infra errors).
- Consider surfacing a lightweight internal dashboard or query (`SELECT` against `users_to_plans`
  rows with conflicting provider markers) as a cheap interim alternative to real-time alerting.

## Status

Not fixed. Log-only conflict handling is the accepted Phase 5 mechanism (Exit Gate does not
require alerting). This note exists so a future session picks up the alerting gap deliberately
rather than discovering it needs invented from scratch.
