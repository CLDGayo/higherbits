---
name: note:default-privileges-anon-grant-audit
description: "Backlog — this database's ALTER DEFAULT PRIVILEGES rule grants ALL on new public-schema relations to anon; audit existing relations and add an explicit REVOKE step to future migrations"
date: 29-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: live-apply
---

# Backlog — generalize the default-privileges trap found during Phase 1 live apply

**Raised by:** the `supabase-interconnect` live-apply session (29-07-26), after the
`public_profiles` anon-write regression was found and closed. See
`process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/live-apply_REPORT_29-07-26.md`
(`## CRITICAL follow-up`) for the full incident writeup.

## What was found

`ewktoowpuemgbaaxxbdq` (the live HigherBits Supabase project) carries an
`ALTER DEFAULT PRIVILEGES` rule (visible in `pg_default_acl`, objtype `r`, grantor `postgres`)
granting **ALL** privileges to `anon`, `authenticated`, and `service_role` on any **newly created**
relation in the `public` schema. This is a database-level default, not something any individual
migration file sets.

During Phase 1's live apply, `views.sql` created a genuinely new view, `public.public_profiles`.
It inherited this default and shipped with `anon` holding INSERT/UPDATE/DELETE/TRUNCATE — an
unintended anonymous write path into `public.users`, since the view is auto-updatable and runs as
its owner (`security_invoker = off`). The other three views `views.sql` touches were
`CREATE OR REPLACE` over **pre-existing** views, which preserves the prior ACL instead of applying
the default — so they were unaffected. This is why the hole was specific to one view rather than
a repo-wide problem, but the underlying rule is repo-wide and will bite the next new relation too.

The immediate incident was fixed (two-statement REVOKE/GRANT, applied and verified 29-07-26,
documented in `supabase/views.sql:73-74`). This note tracks the **generalized** risk, which is not
closed.

## What is needed

1. **Audit existing relations for unintended `anon` grants.** Query
   `information_schema.role_table_grants` (and `pg_class.relacl` for materialized views) for every
   relation where `anon` holds INSERT/UPDATE/DELETE/TRUNCATE, and confirm each one is either
   intentional or needs the same REVOKE treatment `public_profiles` got.
2. **Add an explicit REVOKE/narrow-GRANT step to any future migration or SQL file that creates a
   new relation in `public`.** Do not rely on hand-picking the right grants after the fact — the
   default-privileges rule means "new relation" and "anonymously writable" are the same thing here
   unless proven otherwise.
3. **Optionally, consider narrowing the default-privileges rule itself** (e.g.
   `ALTER DEFAULT PRIVILEGES ... GRANT SELECT ...` instead of `ALL`) so future relations are
   safe-by-default. This is a more invasive change and needs its own review — not assumed safe by
   this note.

## Related

- Live-apply report:
  `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/live-apply_REPORT_29-07-26.md`
- Fixed file: `supabase/views.sql` (lines 73-74 carry the fix + an explanatory comment)
- `process/context/all-context.md` — durable operational fact recorded under the
  `supabase-interconnect` program bullet
