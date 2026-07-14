---
name: note:supabase-prisma-extension-drift-pattern
description: "Supabase auto-installs 4 platform extensions that always show as Prisma migration drift — future migrate dev/reset will hit the same loop"
date: 08-07-26
metadata:
  node_type: memory
  type: note
  feature: 21st-promotion
  phase: phase-01
---

# Backlog Note — Supabase + Prisma Extension Drift Pattern

## Problem

Any future `prisma migrate dev` or `prisma migrate reset` run against this project's Supabase-hosted Postgres will hit the same drift loop encountered during Phase 1 EXECUTE:

Supabase auto-installs 4 platform-default extensions on every project, regardless of what the Prisma schema declares:

- `pg_stat_statements`
- `pgcrypto`
- `supabase_vault`
- `uuid-ossp`

These extensions are untracked in Prisma migration history (they were never created by a Prisma migration file), so Prisma's drift detector sees them as unexpected schema state and refuses to proceed with an incremental migration — even though they have nothing to do with this repo's actual schema. This is a known, repeatable Supabase + Prisma interaction, not a one-off fluke: it recurred identically on the second attempt after a full `migrate reset --force`.

## What happened in Phase 1

1. `prisma migrate dev` → blocked by drift (4 untracked extensions) + separately required exact consent text for Prisma's own `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` safety guard.
2. User confirmed the project was brand-new/empty and safe to reset.
3. `prisma migrate reset --force` → schema dropped and recreated empty, Prisma client regenerated.
4. `prisma migrate dev` again → **hit the exact same drift** (Supabase re-installs the 4 extensions immediately on schema creation).
5. Fallback: `prisma db push --schema=./prisma/schema.prisma` → **succeeded**. Additive schema application, not another destructive reset.

## Recommendation for future phases

**Option A (recommended, low effort):** Continue using `prisma db push` for schema changes against this Supabase project instead of `migrate dev`/`migrate reset`. It applies schema changes directly without requiring migration-history alignment, and doesn't trigger the extension-drift check. Tradeoff: no migration history file is generated per change (acceptable for this project's current stage — no production data exists yet).

**Option B (more correct, higher effort, do later if the project matures):** Baseline the 4 Supabase-platform extensions into Prisma migration history properly (e.g. a first "baseline" migration that captures existing DB state including the extensions, using `prisma migrate resolve --applied` or an initial baseline migration authored to match current state). Once baselined, `migrate dev` becomes usable again for incremental changes with real migration history.

## Priority

Low — not blocking. Phase 1 already resolved its own migration need via `db push`. This note exists so Phase 2/3 (or any future schema change) doesn't waste time repeating the same discovery loop.
