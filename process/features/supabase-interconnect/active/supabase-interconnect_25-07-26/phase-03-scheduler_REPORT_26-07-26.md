---
name: report:supabase-interconnect-phase-03-scheduler
description: "Phase 03 execute report — embeddings backfill cron (dry-run + batch cap), install artifact, seed SQL; all gates green"
date: 26-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-03
---

# Phase 03 — Scheduler Foundation: EXECUTE Report

**Status:** COMPLETE (with named, pre-accepted Agent-Probe residuals)
**Plan:** `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-03-scheduler_PLAN_25-07-26.md`
**Date:** 2026-07-26

**TL;DR:** All four artifacts delivered. Both gates green — `tsc --noEmit` exit 0 with **zero**
errors (better than the 1-foreign-error baseline; the foreign error was fixed by concurrent user
work), and `pnpm --filter web test` 73/73 passing across 18 files (62 baseline + 11 new). Nothing
was applied to the live database and no crontab was installed — both remain operator-only. One
additive usability fix was made beyond the plan's literal response shape (see §Plan Deviations).

---

## What Was Done

### 1. Route extended additively — `apps/web/app/api/cron/gen-usage-embeddings/route.ts`

Per locked Step A0, the existing route was reused; **no new standalone script was authored** and
`apps/web/scripts/run-embedding-backfill-cron.ts` was NOT created (retracted from the registry).

Changes, all additive:

- `DEFAULT_BATCH_CAP = 20` + `resolveBatchCap()`, which parses `EMBEDDING_CRON_BATCH_CAP` and falls
  back to 20 for any non-finite or non-positive value.
- The cap is applied via `allMissing.slice(0, cap)` **before** the per-item loop and applies
  **unconditionally** — not gated behind any query param.
- `?dryRun=true` returns a JSON summary and **returns before the loop**. The zero-`functions.invoke`
  guarantee is therefore structural (a control-flow property of the early return), not a
  per-iteration behavioral coincidence.
- `missingItems ?? []` null guard.
- The auth path (`Bearer ${process.env.CRON_SECRET}` comparison → 401) is untouched. `CRON_SECRET`
  is never returned in any response body.

**Intentional default-behavior change (documented per plan Step A4 / Blast Radius):** a plain call
with no query params now processes at most 20 items per run instead of unboundedly many. This is
safe because the route has zero live production traffic today — its `apps/web/vercel.json` cron
entry never fires (the app runs on gayo-vps pm2, not Vercel). No live caller depends on unbounded
processing.

**Starvation:** items skipped by the cap are not dropped. `get_missing_usage_embedding_items()`
recomputes missing items from current DB state on every call, so leftovers are picked up on the
next run.

### 2. Test coverage — `apps/web/app/api/cron/gen-usage-embeddings/__tests__/route.test.ts` (new)

11 tests, all passing. Follows the repo's existing `vi.hoisted` + `vi.mock("@/lib/supabase", ...)`
pattern (precedent: `apps/web/app/api/magic/__tests__/route.test.ts`), with a local override
mocking `.rpc` and `.functions.invoke` — the global `apps/web/__tests__/setup.ts` mock only covers
`.from()`.

Covers all four validate-contract assertions plus extras:

| # | Test | Contract row |
|---|---|---|
| 1 | 401 when Authorization header does not match `CRON_SECRET` | AC6 assertion (1) |
| 2 | RPC then `functions.invoke` once per item with correct `{type, id}` body | AC6 assertion (2) |
| 3 | 500 without invoking the edge function when the RPC errors | extra |
| 4 | `dryRun=true` short-circuits; `functions.invoke` never called | AC6 assertion (3) |
| 5 | Processes normally when `dryRun` is absent or not exactly `'true'` | extra |
| 6 | Caps processed items at `EMBEDDING_CRON_BATCH_CAP` | AC6 assertion (4) |
| 7 | Falls back to default cap of 20 when the env var is unset | extra |
| 8 | Falls back to default cap for a non-positive-integer value | extra |
| 9 | Reports the capped count in the dry-run response | extra |
| 10 | Reports uncapped backlog depth alongside the capped count | extra (added this session) |
| 11 | Never echoes `CRON_SECRET` in any response body | security |

### 3. Install artifact — `ops/README-embedding-cron.md` (new)

Verified against plan Steps B1–B6. Contains, confirmed present:

- The exact two-line crontab block — the `CRON_SECRET=<value>` variable declaration plus the
  `flock -n /tmp/embedding-cron.lock -c '...'`-wrapped `curl -fsS` with
  `>> /home/higherbits/logs/embedding-cron.log 2>&1` redirection.
- `mkdir -p /home/higherbits/logs` as an explicit prior step, with the rationale (cron's default
  mail delivery is typically unconfigured on a fresh VPS, so unredirected output is lost).
- **Dry-run-first instruction** as Step 2, before the install step.
- **"This install is operator-only — no agent performs any step in this document"** stated in the
  TL;DR, reinforced at Step 4 ("the one privileged step").
- Deploy facts (`higherbits` user, `/home/higherbits/htdocs/higherbits.dev`, pm2 app
  `higherbits.dev`, `ssh root@72.62.196.231`, `su -` never `sudo -u`) **with** the standing drift
  warning as its own Step 1: run `pm2 list` and `ls /home/*/htdocs/` and do not trust the
  documented values blindly.
- Both operator-safety notes: (a) a `flock`-skipped run is a **silent** no-op, so an hour with no
  log entry means "previous run still in flight," not "job failed"; (b) `CRON_SECRET` lives only in
  the crontab file (600 spool perms), must not be copied elsewhere, and `-v`/`--trace` must never
  be added to the `curl` since they would print the `Authorization` header into the log.

No defects found. Only change made: the dry-run example JSON was updated to reflect the new
`totalMissing`/`cap` fields (see §Plan Deviations).

### 4. Seed SQL — `supabase/seed-embedding-verification.sql` (new, NOT APPLIED)

Verified against plan Step D1's column-shape note. Confirmed correct:

- **Idempotent** — `ON CONFLICT (user_id, component_slug) DO NOTHING`, matching the real
  `@@unique([user_id, component_slug])` constraint. INSERT-only; never updates or deletes.
- **Satisfies real NOT NULL/FK constraints** — supplies `user_id`, `component_slug`, `name`,
  `component_names`, `preview_url`. Correctly omits `id` (DB-assigned), `fts` (generated), and
  `code` (defaults to `'N/A'`).
- **FK resolved by subquery, not hardcoded** — uses the `INSERT ... SELECT u.id FROM public.users
  AS u LIMIT 1` form, mirroring the runtime-discovery pattern in
  `ops/seed-placeholder-components.mjs`.
- **Empty-database edge case genuinely handled** — because `user_id` comes from the `SELECT`'s own
  `FROM` clause rather than a scalar subquery in a `VALUES` list, zero users means zero source rows
  means a clean 0-row no-op, not a NOT NULL/FK violation. This is documented in the file header.
- `component_names` uses an untyped `'[...]'` literal, which Postgres coerces to the target column
  type in an `INSERT ... SELECT` — correct whether the column is `json` or `jsonb`.
- `is_public = false` keeps the fixture out of the public marketplace UI, and the header correctly
  notes `get_missing_usage_embedding_items()` applies no `is_public` filter, so a private fixture is
  still found.

No defects found. **Not applied** — Step D4's hard stop stands.

---

## Gate Results (real output, re-measured this session)

### `corepack pnpm --filter web exec tsc --noEmit`

```
EXIT:0
error TS count: 0
```

**Exit 0, zero errors.** This is *better* than the plan's documented baseline of 1 foreign error at
`apps/web/components/features/studio/sandbox/components/add-registry-modal.tsx(233,19)` (TS2322) —
that error is gone, fixed by concurrent user work outside this phase. The gate ("no NEW errors")
passes trivially. That file was not touched by this phase.

### `corepack pnpm --filter web test`

```
Test Files  18 passed (18)
     Tests  73 passed (73)
  Duration  3.40s
EXIT:0
```

Scoped run of the new file:

```
corepack pnpm --filter web exec vitest run app/api/cron/gen-usage-embeddings
Test Files  1 passed (1)
     Tests  11 passed (11)
```

**Arithmetic:** 62 baseline + 11 new = 73. Exact match, zero regressions, zero new failures.

### Contract row coverage

| Contract row | Strategy | Result |
|---|---|---|
| 401 on `CRON_SECRET` mismatch | Fully-Automated | PASS |
| RPC → per-item `functions.invoke` body shape | Fully-Automated | PASS |
| `dryRun=true` short-circuit, zero invokes | Fully-Automated | PASS |
| `EMBEDDING_CRON_BATCH_CAP` slicing | Fully-Automated | PASS |
| No regression on `tsc` + `test` | Fully-Automated | PASS (improved) |
| Install artifact correctness (B1–B6) | Hybrid (review) | PASS |
| Seed SQL schema validity | Hybrid (review) | PASS |
| Concurrent-run overlap protection | Hybrid (review) | PASS |
| Full local dry-run incl. embedding-generation leg | Hybrid | NOT RUN — no live key |
| AC7 search returns results after job run | Agent-Probe | NOT RUN — named residual |
| Live schedule firing on gayo-vps | Agent-Probe | NOT RUN — operator-only residual |

The three NOT RUN rows are the plan's pre-accepted D-type residuals, documented in SPEC Known Gaps.
They were never expected to run this phase.

---

## Plan Deviations

**One within-blast-radius deviation. Documented, not escalated** (same file, additive field, no
schema/auth/API-contract/billing/container surface touched).

### Dry-run hid backlog depth — judged a genuine usability defect, fixed additively

**Observation (raised by the orchestrator):** the batch cap was applied before the dry-run branch,
so `wouldProcess` saturated at the cap (20) even when thousands of items were missing.

**Judgment: usability defect worth a small additive change — not acceptable as-designed.**

Reasoning: the plan's own Step A4 tells the operator to rely on the fact that "no
backlog-starvation risk exists **as long as the missing-item count trends down over time relative
to the hourly cap**." That is a monitoring obligation the plan places on the operator — but the API
exposed no uncapped count, so the operator had no way to observe that trend. A dry-run reporting a
flat `20` is consistent with both "backlog is 20 and about to clear" and "backlog is 20,000 and
growing." That is a real operational blind spot on the exact quantity the plan asks a human to
watch, not a cosmetic nit.

**Fix (minimal, additive):** the dry-run response gained two fields, `totalMissing` (uncapped
length) and `cap`. `wouldProcess` and `items` are unchanged in meaning and value.

**Zero-invoke guarantee unaffected:** the early return still sits before the `for` loop; only the
response body changed. Test 4 (`functions.invoke` never called on dry-run) and new test 10 both
still assert it and both pass.

**Scope of the change:** three lines in the route's dry-run branch; one new test; one updated
`toEqual` in the pre-existing dry-run test (it asserted the exact object shape); the README's
example JSON updated with a two-sentence note telling the operator that a flat-or-growing
`totalMissing` across successive dry-runs means the cap is not keeping up.

**Why this is not a hard-stop deviation:** it touches no auth, billing, schema, container, or
external-integration surface, and it is not a public API contract change — this route is internal,
`CRON_SECRET`-guarded, has zero live traffic today, and its only consumer is the crontab line this
same phase authored.

No other deviations. Steps A0, A1, A4, A5, B1–B6, D1–D3 were implemented exactly as specified.

---

## Test Infra Gaps Found

- **No integration-level coverage of the route against a real Postgres.** All 11 tests mock the
  Supabase client. They prove control flow reaches the RPC and edge-function-invoke call boundaries
  with the right shapes; they do not prove `get_missing_usage_embedding_items()` returns the shape
  the route destructures (`item_type`/`item_id`) against a real database. Phase 2's
  `ops/pglite-verify-embedding-functions.mjs` harness proves the function's shape independently, but
  the two are not wired together — nothing tests the route *against* that harness. Extending the
  pglite harness to serve the route would close this; it was explicitly out of this phase's scope
  (the plan chose a dedicated vitest file instead).
- **No test exercises two concurrent runs.** `flock` overlap protection is proven only by review of
  the crontab line, not by execution. This is inherent to a shell-level lock in a crontab file and
  is not economically testable in vitest.
- **No automated proof the README is followed correctly.** The Hybrid review proves the artifact is
  *correct*, not that a human will execute it correctly. Named in the plan's Known Gaps.
- **The embedding-generation leg is untestable in this session.** It runs inside the edge function's
  own Deno process with its own credentials; no `OPENAI_API_KEY`/`GEMINI_API_KEY` is reachable here.
  Pre-accepted per SPEC Known Gaps.
- **Baseline drift observed again.** The plan's documented `tsc` baseline (1 foreign error) was
  already stale by the time EXECUTE ran — the error is gone. Documented baselines in this repo go
  stale within days because of concurrent uncommitted work; re-measure rather than trust them. This
  matches the pattern already recorded for the test-count baseline in
  `process/context/tests/all-tests.md`.

---

## OPERATOR ACTION REQUIRED

> **Nothing in this section was performed by any agent. All of it requires a human on the VPS or
> with database access. The phase is complete without it — none of these are blocking gates for
> program completion.**

**1. Install the crontab on gayo-vps** — the one privileged step.

Follow `ops/README-embedding-cron.md` end to end. In order:

1. `pm2 list` and `ls /home/*/htdocs/` to re-verify the deploy path/user/pm2 app name. These have
   drifted before. Do not trust the documented values without checking.
2. Confirm `CRON_SECRET` is set in the `apps/web` runtime env on the host (otherwise every run 401s).
3. Run the dry-run `curl` manually **first** and confirm HTTP 200 plus a sane JSON body. Note
   `totalMissing` — that is your real backlog depth.
4. `mkdir -p /home/higherbits/logs`.
5. `ssh root@72.62.196.231` → `su - higherbits` (never `sudo -u`) → `crontab -e` → paste the exact
   two-line block from the README, substituting the real secret for `<value>`.
6. After the next hour boundary, `tail -n 50 /home/higherbits/logs/embedding-cron.log` to confirm a
   run happened. Remember an hour with no entry may mean a `flock` skip, not a failure.

**2. Decide on `EMBEDDING_CRON_BATCH_CAP`.** Default is 20/hour. If the dry-run's `totalMissing` is
large, either raise the env var or accept a longer catch-up window. Re-check `totalMissing` after a
few hours — if it is not trending down, the cap is too low.

**3. Approve the seed SQL before it touches any database (plan Step D4 hard stop).**
`supabase/seed-embedding-verification.sql` is authored and reviewed but **has not been run
anywhere**. Read it, then apply it yourself if you want the verification fixture. It is idempotent
and a clean no-op on a database with zero users.

**4. Note the live-apply dependency for AC7.** Verifying that search returns results after a real
job run requires Phase 2's migration applied live, live embedding-provider credentials reachable by
the edge function, and this seed fixture in place. None of those exist yet. That verification stays
deferred.

---

## Files Changed

| File | Status |
|---|---|
| `apps/web/app/api/cron/gen-usage-embeddings/route.ts` | modified (additive) |
| `apps/web/app/api/cron/gen-usage-embeddings/__tests__/route.test.ts` | new (11 tests) |
| `ops/README-embedding-cron.md` | new |
| `supabase/seed-embedding-verification.sql` | new (authored, not applied) |
| `process/features/.../phase-03-scheduler_REPORT_26-07-26.md` | new (this file) |

Not touched, deliberately: `package.json`, `pnpm-lock.yaml`, `add-registry-modal.tsx`, and the ~24
uncommitted WIP files in the working tree. Nothing was staged, committed, stashed, or reverted.
`apps/web/scripts/run-embedding-backfill-cron.ts` was **not** created (retracted path).

---

## Follow-Up Stubs

None created — no new work was discovered that requires a plan stub. The residuals above are all
pre-existing named Known Gaps in the plan and SPEC.

---

## Closeout Packet

- **Selected plan:** `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-03-scheduler_PLAN_25-07-26.md`
- **Finished:** all Step A/B/C/D checklist items except the operator-only and live-DB legs.
- **Verified:** `tsc --noEmit` 0 errors; 73/73 vitest; all 5 Fully-Automated contract rows green;
  3 Hybrid review rows passed.
- **Unverified:** the 3 Agent-Probe / live-key residuals, all pre-accepted.
- **Remaining:** operator crontab install (§OPERATOR ACTION REQUIRED); user approval + apply of the
  seed SQL; the umbrella's stale "Phase 3 hard-blocked on Phase 2 live apply" prose, which the plan
  says to correct at UPDATE PROCESS.
- **Best next state:** `Ready for EVL`, then UPDATE PROCESS.

---

## Forward Preview

**Test Infra Found:** vitest 4.1.10 in `apps/web`; glob `**/__tests__/**/*.test.ts` picks up new
files with no config change. `vi.hoisted` + `vi.mock("@/lib/supabase", ...)` is the established
pattern for Supabase-touching routes; the global `apps/web/__tests__/setup.ts` mocks only `.from()`,
so any route using `.rpc`/`.functions` needs a local override. Suite is now 73 tests / 18 files.

**Blast Radius Changes:** `apps/web/scripts/run-embedding-backfill-cron.ts` was retracted and never
created — remove it from any downstream registry expectation. `supabase/seed-embedding-verification.sql`
and `ops/README-embedding-cron.md` are new and owned by this phase. Phase 4 (navigation), Phase 5
(billing), and Phase 6 (schema truth) have disjoint file sets; no contested files.

**Commands to Stay Green:**
```bash
corepack pnpm --filter web exec tsc --noEmit          # expect exit 0, 0 errors
corepack pnpm --filter web test                       # expect 73/73
```

**Dependency Changes:** none. No package was added, removed, or upgraded; `package.json` and
`pnpm-lock.yaml` were not touched.
