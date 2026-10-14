# Home discovery hosted count integration — test-building backlog

Date: 2026-10-13
Source: Home discovery VALIDATE V6 conditional gate.

The local PGlite fixture planned in `home-discovery-adaptation_PLAN_13-10-26.md` proves the new aggregate's public filtering, distinct-count semantics, and grants against an isolated minimal schema. It does **not** prove that the hosted Supabase project has the migration or that the actual current auto-index approval helper and all production schema objects interoperate with the new function.

Before a separate authorized production release, run the additive migration and a read-only public count-versus-browse smoke check on a **non-production full-schema** Supabase target, including one approved and one unapproved auto-index row. Capture function definition/grants and an API error-path check. Production application is outside the local Home discovery task. Keep runtime count errors visible without invented zeroes until the function is installed.
