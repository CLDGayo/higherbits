---
name: note:submission-card-table-ids-unverified
description: "SubmissionCard.tsx admin deep-links were repointed to the live project but their numeric table IDs are from the old project and unverified"
date: 29-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-06
---

# `SubmissionCard.tsx` dashboard deep-link table IDs are unverified

**TL;DR:** Phase 06 repointed two admin dashboard links from the dead project to the live one, but
the numeric table IDs baked into those URLs came from the dead project and are almost certainly
wrong. The links now land on the right project, possibly the wrong table.

## Detail

`apps/web/components/features/admin/SubmissionCard.tsx:21-22` builds two Supabase dashboard
deep-links for admin convenience:

- `.../project/ewktoowpuemgbaaxxbdq/editor/29179?...` — intended: `components` table
- `.../project/ewktoowpuemgbaaxxbdq/editor/229472?...` — intended: `demos` table

The project ref was corrected from the stale `vucvdpamtrjkzmubwlts`. The numeric IDs (`29179`,
`229472`) are Postgres OIDs / dashboard table identifiers minted against that **old** project. There
is no reason to expect them to match the same tables in `ewktoowpuemgbaaxxbdq`.

## Why it was not fixed

Resolving the correct IDs requires an authenticated session against the live Supabase dashboard or
database. Phase 06 had neither — the Supabase CLI is unauthenticated and no `psql` exists in the
environment. Guessing would be worse than an honest flag.

## Impact

Low and admin-only. These are convenience links in an internal submissions view. A wrong ID means an
admin lands on an unexpected table and has to navigate manually. No user-facing or data-integrity
impact.

## Fix

Open the live Supabase dashboard for project `ewktoowpuemgbaaxxbdq`, navigate to the `components`
and `demos` tables, read the `editor/<id>` segment from the resulting URLs, and substitute. Then
remove the `UNVERIFIED` warning comment in the source.

A more durable alternative: replace the numeric-ID deep links with table-name-based dashboard URLs
if Supabase supports them, so they never drift again.
