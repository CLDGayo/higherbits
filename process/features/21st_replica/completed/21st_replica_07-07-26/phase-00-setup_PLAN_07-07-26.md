---
name: plan:21st_replica-phase-00-setup
description: "21st.dev 1:1 Replica — Phase 00: Setup"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: 21st_replica
  phase: phase-00
---

# Phase 00 — Setup

**Program:** 21st_replica
**Umbrella plan:** process/features/21st_replica/active/21st_replica_07-07-26/21st_replica-umbrella_PLAN_07-07-26.md
**Phase status:** ✅ VERIFIED
**Report destination:** process/features/21st_replica/active/21st_replica_07-07-26/phase-00-setup_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Scaffold the base project environment using Next.js, Tailwind CSS, Radix UI primitives, and Clerk Authentication. This phase leverages the `vc-setup` skill to ensure the infrastructure is solid before any UI is built.

---

## Entry Gate

- Program start (Umbrella plan created)

---

## Blast Radius

- `package.json`
- `next.config.mjs`
- `tailwind.config.ts`
- `src/app/layout.tsx`
- `src/app/globals.css`

---

## Implementation Checklist

### Step A — Audit & Base Configuration (Replaces Scaffolding)
- [ ] A1. Audit Next.js & Tailwind: Verify Next.js 15 App Router, React 19, and existing Tailwind CSS tokens in `apps/web`.
- [ ] A2. Audit & Install Radix UI: Check existing Radix UI primitives in `apps/web/package.json` and install any missing ones specifically required for the 21st_replica (e.g., Dialog, DropdownMenu).

### Step B — Authentication Verification
- [ ] B1. Audit Clerk Setup: Verify `@clerk/nextjs` installation and ensure `<ClerkProvider>` is correctly wrapping the root layout in `apps/web/app/layout.tsx`.
- [ ] B2. Verify/Adapt Auth Routes: Confirm or implement the specific SignIn/SignUp custom routes required by the replica, ensuring full compatibility with the existing `middleware.ts` and `publicMetadata.isPro` session claims.

### Step C — Helper Skills Integration (Unchanged, but contextualized)
- [ ] C1. Run `vc-security` to audit the Clerk implementation and verify no regressions in the recent security hardening.
- [ ] C2. Ensure `vc-docs-seeker` has verified the Next.js/Tailwind versions.

---

## Exit Gate

```bash
# Verify the build
npm run build
# Expected: Next.js builds without errors
```

- all checklist items checked
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Next.js or Tailwind failing to scaffold.
- Clerk credentials missing or causing crashes.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

---

## Touchpoints

- Base configuration files created.

---

## Public Contracts

- none

---

## Verification Evidence

```bash
# Verify build
npm run build
# Expected: output indicating successful compiled routes
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/21st_replica/active/21st_replica_07-07-26/phase-00-setup_PLAN_07-07-26.md`
- Last completed step: EVL (Step 6)
- Validate-contract status: passed
- Next step: Spawn update-process-agent for UPDATE-PROCESS (Step 7)

---

## Validate Contract

Status: STANDING-GRANTED
Date: 07-07-26
Gate: PASS

### Parallel strategy
Choice: sequential
Signals: 2/7 — dominant: Phase program classification
Agent count: 1

### Plan updates applied
- [x] Updated Phase Loop Progress to check off `[x] 4. PVL`
- [x] Updated Resume and Execution Handoff to point to EXECUTE (Step 5)

### Execute-agent instructions
- [All sections]: Execute the audit and setup specifically on `apps/web/` for Next.js, Tailwind, Radix UI, and Clerk. Do not scaffold from scratch; adapt the existing monorepo environment.

### Test gates (run after each section; regression suite after all sections)

**Setup / Configuration**
- fully-automated: `npm run lint` exits 0
  Proves: Linter rules pass and setup is syntactically sound.
- hybrid: `npx playwright test` exits 0
  Precondition: Playwright environment is properly installed and target dev server is reachable.
  Proves: E2E base rendering works.

**Regression suite (after all sections complete)**
- `npm run lint` exits 0
- `npm run build` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- none

### Known gaps on record
- none

### Accepted by
session — Auto-accepted under autonomous `/goal`
