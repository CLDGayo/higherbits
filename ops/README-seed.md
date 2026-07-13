# Seed placeholder components

Run: `NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node ops/seed-placeholder-components.mjs`

Env needed: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (service role; never logged).

Inserts 8 cozy-claymorphism components (each + one demo, attributed to the `cozy_downloads` user, discovered at runtime).

Idempotent: skips any component whose `(user_id, component_slug)` already exists — safe to re-run. On failure it deletes only the rows that run inserted.
