---
name: plan:supabase-interconnect-compile-missing-bundles-registry-dependencies-column
description: "Backlog — apps/web/scripts/compile-missing-bundles.ts:234 selects a non-existent column registry_dependencies; the real column is direct_registry_dependencies"
date: 29-07-26
metadata:
  node_type: memory
  type: plan
  feature: supabase-interconnect
  phase: backlog
---

# Backlog Note — `compile-missing-bundles.ts` wrong column name

**Found during:** Phase 6 (Schema Source of Truth) PLAN-SUPPLEMENT research, 29-07-26 — out of
Phase 6's scope, self-contained.

**The bug:** `apps/web/scripts/compile-missing-bundles.ts:234` runs:

```ts
const { data: dbComp } = await supabaseAdmin.from("components").select("code, registry_dependencies").eq("component_slug", dep).single()
...
if (dbComp.registry_dependencies) {
  depsQueue.push(...dbComp.registry_dependencies)
}
```

The live `components` table does not have a `registry_dependencies` column — it has
`direct_registry_dependencies` (confirmed present in `apps/web/types/supabase.ts:853`). This is
**not** an instance of the types-staleness pattern this program otherwise addresses —
`types.ts` has the correct name; this is a genuine, pre-existing bug in the script itself, unrelated
to the schema-drift root cause Phase 6 is fixing.

**Impact:** the `select("code, registry_dependencies")` call will silently return `undefined` for
`registry_dependencies` (Supabase/PostgREST does not error on selecting an unknown column? if it does
error, this fallback branch of `compile-missing-bundles.ts` fails outright) — either way, the
transitive-dependency queue (`depsQueue.push(...)`) at this fallback (DB-based) path never gets
populated with a component's registry dependencies, meaning nested/transitive component deps are
silently dropped when the primary API path (`compRes`) is unavailable and this DB fallback is used.

**Fix:** rename the selected column and the field reference to `direct_registry_dependencies` at
both call sites (the `select()` string and the `dbComp.registry_dependencies` read).

**Why not fixed now:** out of Phase 6's declared blast radius (this phase's scope is
`types.ts`/migrations/`all-context.md`, not `apps/web/scripts/`); a self-contained, low-risk,
one-file fix suitable for a QUICK FIX lane pass whenever picked up.
