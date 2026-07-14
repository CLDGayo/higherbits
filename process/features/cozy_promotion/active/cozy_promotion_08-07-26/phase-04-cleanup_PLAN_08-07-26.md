---
name: plan:cozy_promotion-phase-04-cleanup
description: "Cozy Promotion — Phase 04: Cleanup"
date: 08-07-26
metadata:
  node_type: memory
  type: plan
  feature: cozy_promotion
  phase: phase-04
---

# Phase 04 — Cleanup

**Program:** cozy_promotion
**Umbrella plan:** process/features/cozy_promotion/active/cozy_promotion_08-07-26/cozy_promotion-umbrella_PLAN_08-07-26.md
**Phase status:** ✅ COMPLETE
**Report destination:** process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-04-cleanup_REPORT_08-07-26.md (flat in the program task folder)

---

## Purpose

Clean up remaining dead code from the old legacy layout (SiteHeader, SiteFooter) and run a final EVL (test and lint sweep) to ensure the newly promoted application is perfectly stable.

---

## Entry Gate

- Phase 3 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/components/site-header.tsx` (deleted)
- `apps/web/components/site-footer.tsx` (deleted)
- `apps/web/components/theme-toggle.tsx` (deleted)
- `apps/web/components/usage-meter.tsx` (deleted)
- `apps/web/components/catalog-nav.tsx` (deleted)
- `apps/web/components/cozy/layout/TopNav.tsx`
- `apps/web/app/21st` (folder deleted)
- `apps/web/__tests__/site-header.test.tsx` (deleted)

---

## Implementation Checklist

### Step A — Dead Code Removal

- [ ] A1. Delete legacy layout components (SiteHeader, SiteFooter, theme-toggle.tsx, usage-meter.tsx, catalog-nav.tsx)
- [ ] A2. Delete the empty `apps/web/app/21st` directory
- [ ] A3. Wire up Clerk authentication in `apps/web/components/cozy/layout/TopNav.tsx` using `<SignedIn>`, `<SignedOut>`, `<SignInButton>`, and `<UserButton>`.
- [ ] A4. Delete `apps/web/__tests__/site-header.test.tsx` to prevent build failure.

### Step B — Verification

- [ ] B1. Run `npm run lint` and resolve any missing imports or unused variables
- [ ] B2. Run `npm run build` and ensure Next.js builds flawlessly

---

## Exit Gate

```bash
# Lint exit 0 check
npm run lint
# Expected: 0 failures / 0 warnings

# Build exit 0 check
npm run build
# Expected: successful Next.js production build output
```

- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Build failing due to lingering dependencies.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")

**Inner Loop Refresh Note:** Added more components to delete (theme-toggle.tsx, usage-meter.tsx, catalog-nav.tsx) and added a new step to wire up Clerk authentication in TopNav.tsx.
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/components/site-header.tsx`
- `apps/web/components/site-footer.tsx`
- `apps/web/components/theme-toggle.tsx`
- `apps/web/components/usage-meter.tsx`
- `apps/web/components/catalog-nav.tsx`
- `apps/web/components/cozy/layout/TopNav.tsx`
- `apps/web/app/21st`
- `apps/web/__tests__/site-header.test.tsx`

---

## Public Contracts

- External behavior unchanged.

---

## Verification Evidence

```bash
# Build exit 0 check
npm run build
# Expected: Build completes without errors
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-04-cleanup_PLAN_08-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

Status: PASS
Date: 08-07-26
Gate: PASS — no FAILs, all fixes applied

### Parallel strategy
Choice: sequential
Signals: 1/7 — dominant: trivial dead code removal
Agent count: 1 (1 executor)

### Plan updates applied
- [x] Added `apps/web/__tests__/site-header.test.tsx` to Blast Radius and Touchpoints since we found it tests the deleted `site-header.tsx`.
- [x] Added step A4 to delete `apps/web/__tests__/site-header.test.tsx` to the Implementation Checklist to prevent build failures.

### Execute-agent instructions
- Section A: Verify no other files import the deleted components before deleting.
- Section A: Execute auth wiring strictly using `<SignedIn>`, `<SignedOut>`, `<SignInButton>`, `<UserButton>` from `@clerk/nextjs` as specified.

### Test gates (run after each section; regression suite after all sections)

**Dead Code & Auth**
- Fully-automated: `npm run lint` exits 0
  Proves: No missing imports or unused variables from deleted files.
- Fully-automated: `npm run build` exits 0
  Proves: Next.js builds flawlessly after removals and TopNav changes.
- Agent probe: Inspect TopNav visual rendering or source to confirm Clerk elements are wired correctly.
- Known-gap: Integration tests for Clerk auth in the new TopNav are out of scope for this cleanup phase.

**Regression suite (after all sections complete)**
- `npm run lint` exits 0
- `npm run build` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- E2E testing of the full auth flow using the new TopNav is deferred.

### Accepted by
vc-validate-agent — added `site-header.test.tsx` to deletions
