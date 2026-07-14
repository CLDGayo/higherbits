---
name: plan:higherbits-security-audit-phase-02-critical-high
description: "HigherBits.dev Security Audit — Phase 02: Critical/High Remediation"
date: 14-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-security-audit
  phase: phase-02
---

# Phase 02 — Critical & High Priority Remediation

**Program:** higherbits-security-audit
**Umbrella plan:** process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/higherbits-security-audit-umbrella_PLAN_14-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/phase-02-critical-high_REPORT_14-07-26.md (flat in the program task folder)

---

## Purpose

Iteratively fix all Critical and High severity vulnerabilities identified in Phase 1 using `/vc-security <scope> --fix` or manual targeted remediation.

---

## Entry Gate

- Phase 1 complete (audit report generated).
- Critical and High findings listed in the report.

---

## Blast Radius

- Any files flagged in the Critical/High findings list from Phase 1.

---

## Implementation Checklist

### Step A — Fix Critical Vulnerabilities

- [x] A1. Fix IDOR in `apps/web/app/api/studio/preprocess-component/route.ts`: Replace `request.json().userId` with server-side `auth()` validation.
- [x] A2. Fix vulnerable dependencies: Run `pnpm audit --fix` or `pnpm update` to patch vulnerable versions (`vite`, `ws`, `undici`, etc.).
- [x] A3. Verify `corepack pnpm --filter web build` and `test` remain green.

### Step B — Fix High Vulnerabilities

- [x] B1. Fix XSS in `apps/web/components/features/studio/ui/components-table.tsx`: Remove `dangerouslySetInnerHTML` and use safe React elements.
- [x] B2. Fix DoS in `apps/web/app/api/studio/merge-styles/globals/route.ts` and `tailwind/route.ts`: Add `auth()` validation.
- [x] B3. Verify `corepack pnpm --filter web build` and `test` remain green.

---

## Exit Gate

```bash
# Verify no remaining critical/high
# Re-run vc-security locally or verify manual fixes
corepack pnpm --filter web build
# Expected: Build succeeds
corepack pnpm --filter web test
# Expected: Tests pass
```

- All Critical and High findings remediated.
- Regression tests pass.

---

## Blockers That Would Justify BLOCKED Status

- A fix requires a major architectural rewrite not possible within standard bounds.
- Regression tests consistently fail after a fix.

---

## Phase Loop Progress

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.**

---

## Touchpoints

- `apps/web/app/api/studio/preprocess-component/route.ts`
- `apps/web/components/features/studio/ui/components-table.tsx`
- `apps/web/app/api/studio/merge-styles/globals/route.ts`
- `apps/web/app/api/studio/merge-styles/tailwind/route.ts`
- `package.json` / `pnpm-lock.yaml`

---

## Public Contracts

- none

---

## Verification Evidence

```bash
corepack pnpm --filter web test
# Expected: All tests pass
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-security-audit/active/higherbits-security-audit_14-07-26/phase-02-critical-high_PLAN_14-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

- **Status**: WRITTEN
- **Gate**: PASS (safe to execute)
- **Plan updates applied**: Added specific checklist items from Phase 1 findings.
- **Execute-agent instructions**:
  1. Act as the execute agent to fix the identified IDOR, XSS, DoS, and dependencies.
  2. Map fixes to the checklist and verify tests pass.
- **Test gates**: Verify `corepack pnpm --filter web test` passes after fixes.
- **High-risk pack**: N/A
- **Backlog artifacts**: None
- **Known gaps**: None
- **Accepted by**: orchestrator
