---
name: plan:precompiled-registry-phase-01-schema
description: "Precompiled Registry — Phase 01: Schema Updates"
date: 28-07-26
metadata:
  node_type: memory
  type: plan
  feature: precompiled-registry
  phase: phase-01
---

# Phase 01 — Schema Updates

**Program:** precompiled-registry
**Umbrella plan:** process/features/precompiled-registry/active/precompiled-registry_28-07-26/precompiled-registry-umbrella_PLAN_28-07-26.md
**Phase status:** ✅ COMPLETE
**Report destination:** process/features/precompiled-registry/active/precompiled-registry_28-07-26/phase-01-schema_REPORT_28-07-26.md (flat in the program task folder)

---

## Purpose

Update the database schema and type definitions (e.g., `supabase.ts`) so that base components (like Shadcn primitives and community components) can store `bundle_html_url`, `bundle_hash`, and any necessary metadata just like the `demos` table does. This prepares the data layer for Phase 2's compilation pipeline.

---

## Entry Gate

- Phase 0 complete (umbrella plan and all phase stubs created)

---

## Blast Radius

- `apps/web/types/supabase.ts`
- `apps/web/lib/supabase.ts` (if relevant)
- Any SQL migration files if we manage schema migrations via files.

---

## Implementation Checklist

### Step A — Schema Discovery

- [x] A1. Identify how `bundle_html_url` and `bundle_hash` are currently stored in the `demos` table.
- [x] A2. Check if the `components` table already has these fields, or if we need to add them (e.g., `bundle_url` JSON column vs explicit `bundle_html_url` column).
- [x] A3. Ensure we have a way to apply these changes (via Supabase UI if needed, or by modifying the generated `supabase.ts` types).

### Step B — Type Definitions

- [x] B1. Update `apps/web/types/supabase.ts` to include `bundle_html_url` and `bundle_hash` for the `components` table if not already present.

---

## Exit Gate

```bash
# Verify no TS errors
npx tsc --noEmit
# Expected: clean exit
```

- All checklist items checked
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Missing permissions to update the Supabase schema, requiring user intervention.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
  - n/a — research clean
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first.

---

## Touchpoints

- `apps/web/types/supabase.ts`

---

## Public Contracts

- None

---

## Verification Evidence

```bash
npx tsc --noEmit
# Expected: clean exit
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/precompiled-registry/active/precompiled-registry_28-07-26/phase-01-schema_PLAN_28-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

**Status:** PENDING EXECUTION
**Gate:** PASS
**Plan updates applied:** None
**Execute-agent instructions:** 
- Open `apps/web/types/supabase.ts`.
- Add `bundle_html_url?: string | null` and `bundle_hash?: string | null` to the `Row`, `Insert`, and `Update` interfaces for the `components` table.
- Verify `npx tsc --noEmit` succeeds.
**Test gates:**
- **Automated:** `npx tsc --noEmit` (Must exit 0)
- **Hybrid:** None
- **Agent-probe:** None
**High-risk pack:** No
**Backlog artifacts:** None
**Known gaps:** None
**Accepted by:** vc-validate-agent
