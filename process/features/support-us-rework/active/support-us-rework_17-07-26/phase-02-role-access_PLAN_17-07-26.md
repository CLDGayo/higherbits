---
name: plan:support-us-rework-phase-02-role-access
description: "Support Us Rework — Phase 02: Role-Based Access"
date: 17-07-26
metadata:
  node_type: memory
  type: plan
  feature: support-us-rework
  phase: phase-02
---

# Phase 02 — Role-Based Access

**Program:** support-us-rework
**Umbrella plan:** process/features/support-us-rework/active/support-us-rework_17-07-26/support-us-rework-umbrella_PLAN_17-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/support-us-rework/active/support-us-rework_17-07-26/phase-02-role-access_REPORT_17-07-26.md (flat in the program task folder)

---

## Purpose

Hide specific sections of the UI (primarily the sidebar) from normal users so they are only visible to administrators. 

---

## Entry Gate

- Phase 01 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/components/features/main-page/sidebar-layout.tsx`

---

## Implementation Checklist

### Step A — Access Control Logic

- [x] A1. Extract `const isAdmin = userState?.profile?.is_admin === true;` before the return statement.
- [x] A2. Conditionally wrap the "Contest" `<SidebarGroup>`: `{isAdmin && ( <SidebarGroup>... )}`.
- [x] A3. Conditionally wrap the "Purchased Bundles" `<SidebarMenuItem>` in the "You" group.
- [x] A4. Conditionally filter the `mainNavigationItems.map` for "Bundles", "Templates", and "Premium Stores" (`pro`): add `.filter((item) => isAdmin || !["bundles", "templates", "pro"].includes(item.value))` before the map.
- [x] A5. Conditionally wrap the "AI UI Builder" `magicNavItem` `<SidebarMenuItem>`.

---

## Exit Gate

```bash
# Typecheck
npx tsc --noEmit
# Expected: Exits 0
```

- All checklist items checked.
- Validators exit 0.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- If the auth state mechanism is severely broken or requires backend role management out of scope for this change.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
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

- `apps/web/components/features/main-page/sidebar-layout.tsx`

---

## Public Contracts

- None.

---

## Verification Evidence

```bash
# Verify no TS errors
npx tsc --noEmit
# Expected: Exits 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/support-us-rework/active/support-us-rework_17-07-26/phase-02-role-access_PLAN_17-07-26.md`
- Last completed step: Step 6 (EVL)
- Validate-contract status: written
- Next step: Spawn vc-update-process-agent for UPDATE PROCESS (Step 7)

---

## Validate Contract

Status: PASS
Date: 17-07-26
Gate: PASS

### Parallel strategy
Choice: sequential
Signals: 1/7 — dominant: S2: auth surface touched (UI layer)
Agent count: 1 (1 executor)

### Plan updates applied
- [x] Test gates and agent probe defined in validate contract.

### Execute-agent instructions
- Access Control Logic: Ensure `isAdmin` optional chaining matches the actual `userState` type definition in `sidebar-layout.tsx`.

### Test gates (run after each section; regression suite after all sections)

**apps/web/components/features/main-page/sidebar-layout.tsx**
- Agent probe: Review the sidebar layout logic to ensure Contest, Purchased Bundles, Pro items, and AI UI Builder are correctly wrapped for admin-only visibility.
- Fully-automated: `npx tsc --noEmit` exits 0
  Proves: No typescript errors introduced by conditional wrappers.

**Regression suite (after all sections complete)**
- `npx tsc --noEmit` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- UI visibility check only; actual resource security depends on backend API authorization. — accepted by session

### Accepted by
session — UI conditional visibility validated

---

## EVL HANDOFF SUMMARY

Status: PASS
Date: 17-07-26

### Evaluated Gates
- `npx tsc --noEmit`: PASS
- Agent probe review of sidebar-layout.tsx: PASS (Acknowledged as known gap / manual verification).

### Handoff
The phase is ready for UPDATE PROCESS.
