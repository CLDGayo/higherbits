---
name: report:security-definer-rationale-gap
description: "Backlog — document why 3 of Phase 02's 4 embedding functions are SECURITY DEFINER while vec_dim is invoker"
date: 26-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-02
---

# Backlog Note — SECURITY DEFINER Rationale Gap (Phase 02 Embedding Functions)

**Priority:** Low (documentation-only; not a correctness or security defect)

## Problem

`supabase/migrations/0001_embedding_functions.sql` declares
`get_missing_usage_embedding_items`, `insert_embedding`, and `insert_code_embedding` as
`SECURITY DEFINER`, while `vec_dim` is left at the Postgres default (`SECURITY INVOKER`). The
migration file's comments explain what the functions do but never explain **why** this specific
DEFINER/INVOKER split was chosen. EVL judged the split defensible during Phase 02's closeout but
flagged the missing rationale as a documentation gap worth closing before Phase 6 regenerates
`types.ts` and before any future phase adds a 5th function to this file.

## Why EVL judged it defensible (not why it's undocumented)

- `EXECUTE` on all 4 functions is revoked from `PUBLIC` and granted only to `service_role`
  (`REVOKE`/`GRANT` pairs at the end of the migration) — `service_role` is already a privileged,
  RLS-bypassing role, so `SECURITY DEFINER` grants no additional privilege beyond what the caller
  already has.
- All 3 `SECURITY DEFINER` functions set `SET search_path = public`, closing the classic
  search-path-injection hole that makes `SECURITY DEFINER` risky when left unset.
- `vec_dim` touches no table (`SELECT vector_dims(v)` only) and is `IMMUTABLE`, so there is no
  privilege boundary for `SECURITY DEFINER` to cross — `SECURITY INVOKER` (the default) is
  correct and simplest for it.

## Root cause

No design-decision comment exists in the migration file (or the phase plan/report) stating this
reasoning explicitly. A future reader (including Phase 6, which regenerates `types.ts` from this
file) has to re-derive the rationale from first principles instead of reading it.

## Fix options

1. **(Recommended, cheapest)** Add a short comment block above the 3 `SECURITY DEFINER`
   declarations in `0001_embedding_functions.sql` stating: "DEFINER is required only because
   these functions modify/query tables that a bare invoker (service_role, which already bypasses
   RLS) does not need elevated privilege for — kept as DEFINER + SET search_path=public per
   repo convention (see `supabase/rpc-functions.sql`); INVOKER would be equally safe here since
   the only caller is service_role, but DEFINER is retained for consistency with the rest of the
   RPC surface." No functional change.
2. **Ask whether `SECURITY INVOKER` would suffice given the grant lockdown.** Since the only
   caller (`service_role` via `supabaseWithAdminAccess`) already bypasses RLS, `INVOKER` would
   behave identically to `DEFINER` for this specific caller. Switching would be a net-neutral
   security change but would break the stated consistency-with-`rpc-functions.sql` convention.
   Needs a maintainer decision, not just an agent judgment call — this note exists to surface the
   question, not resolve it unilaterally.
3. Leave as-is and only fix if a future phase adds a function where the DEFINER/INVOKER choice
   actually matters (e.g. a function called by a lower-privilege role than `service_role`).

## Recommendation

Option 1 (add the comment) is a same-session, zero-risk fix appropriate for Phase 6 or any phase
that next touches `0001_embedding_functions.sql`. Option 2 is optional and only worth raising if
a maintainer wants to minimize `SECURITY DEFINER` usage repo-wide as a hardening pass.

## Self-contained references

- `supabase/migrations/0001_embedding_functions.sql` — the migration in question
- `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-02-embedding-functions_REPORT_26-07-26.md` — Phase 02 EXECUTE report, "Grant decision" section
- `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-02-embedding-functions_PLAN_25-07-26.md` — Phase 02 plan, Step B7 / Execute-Agent Instruction E3
