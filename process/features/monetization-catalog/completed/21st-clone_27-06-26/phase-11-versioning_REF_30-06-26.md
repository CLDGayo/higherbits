# Backlog / Deferred Work Note

## Context
Phase: 11 (Component versioning + changelog)
Plan: `phase-11-versioning_PLAN_30-06-26.md`
Date: 30-06-26

## Issue
**Testing Gap on AC-3:** "UI Component Detail Page shows version switcher"
The implementation is complete, but verification currently relies on an `Agent-Probe manual` check. Because it rests on a Known-Gap residual, the vacuous-green ban applies and archival of the phase is blocked.

## Required Work
Build an E2E test or an automated component test (e.g., using Vitest + React Testing Library or Playwright) that specifically mounts the `apps/web/app/(catalog)/[category]/[slug]/page.tsx` component (or its version switcher child component) with a mocked `changelog` array.

The test must assert:
1. The version switcher renders when multiple versions exist.
2. The user can select a different version.

Once this test is built and passes, Phase 11 can be properly verified and archived.
