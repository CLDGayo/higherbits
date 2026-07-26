---
name: report:templates-authenticated-grant-scope
description: "Backlog — public.templates has a live authenticated INSERT call site with no tracked grant; needs an ownership/RLS decision"
date: 26-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-01
---

# Backlog — `public.templates` `authenticated` grant/RLS gap

**Raised by:** supabase-interconnect Phase 1, Step A2/A3 audit (26-07-26). NEW gap the plan's own
Step A3 gap list did not name — not fixed this phase; explicitly out of the approved Blast Radius.
Tracks SPEC AC3 ("full audit ... confirms zero remaining ungranted tables/views") — this is the
one genuinely unmet leg of that criterion.

## What

`apps/web/components/features/publish/template/publish-template-form.tsx:119` performs
`client.from("templates").insert({...})` where `client = useClerkSupabaseClient()` (`:29`) — a
real browser write under the Postgres `authenticated` role, reached via Step A2's 250-module
recursive-import closure (not visible to a flat per-file grep).

`templates` **is** in the confirmed 13-relation `authenticated` grant baseline for `SELECT`
(templates are readable), but **no `GRANT INSERT`/`UPDATE`/`DELETE ... TO authenticated` and no
matching `CREATE POLICY` for `authenticated` writes exists anywhere in tracked `supabase/*.sql`.**
If the live DB matches tracked state, template publishing is 42501-broken today.

Phase 1's only tracked statement about `templates` is Step B8:
`REVOKE INSERT, UPDATE, DELETE ON public.templates FROM anon;` — a defense-in-depth hygiene fix
for the `anon` role, unrelated to this gap and safe regardless of how this note resolves.

## Why it was excluded from Phase 1

Authoring an `authenticated` write grant requires choosing an ownership/RLS model for a table
whose ownership column was not confirmed within Phase 1's approved scope. Phase 1's Blast Radius
was audit + grant-restoration for the confirmed 13-relation baseline plus a small number of
explicitly-approved new relations (`demo_bookmarks`, `prompt_rules`, `feedback`, 2 views, 2 read
carve-outs) — `templates` writes were not on that list and adding an undirected ownership decision
mid-phase would have exceeded the approved scope.

## What is needed

A narrow follow-up plan or PVL supplement cycle (can be folded into a later phase, e.g. Phase 6
schema-source-of-truth, or run standalone) that:
- confirms the ownership column on `public.templates` (likely `user_id`, matching the
  `components_insert_own` own-row pattern already used elsewhere in
  `supabase/restore-authenticated-grants.sql` — the probable exemplar for this fix);
- authors `GRANT INSERT` (and `UPDATE`/`DELETE` if the publish flow needs them) to `authenticated`
  plus an own-row `CREATE POLICY`, mirroring the `demo_bookmarks`/`prompt_rules` shape from Phase 1;
- re-runs the recursive-closure audit (Step A2 methodology) to confirm no further gap remains
  once this one is closed, satisfying SPEC AC3 in full.

## Related

- Phase 1 report: `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_REPORT_26-07-26.md` — "NEW GAP — `public.templates`" section
- Phase 1 plan: `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_PLAN_25-07-26.md` Step A3, Step B8
- `supabase/restore-authenticated-grants.sql` — Step B8 REVOKE statement (unaffected by this note)
