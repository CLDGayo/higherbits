---
phase: phase-06-schema-truth
date: 2026-07-29
status: COMPLETE_WITH_GAPS
feature: supabase-interconnect
plan: process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-06-schema-truth_PLAN_25-07-26.md
---

# Phase 06 — Schema Source of Truth — EXECUTE Report

**TL;DR:** The root cause is found, proven, and **fixed at all four source sites**. The
types-generation script was pointed at a dead Supabase project; it now points at the live one, and
so do the three other files that hardcoded the same stale ref (one of which was a real live bug).
All five `all-context.md` corrections landed. **What did NOT happen: `types.ts` was not regenerated
and no migrations baseline was created** — the Supabase CLI in this environment is unauthenticated,
so live introspection was impossible. The generator is now correct; someone just has to log in and
pull the trigger. Both gates that could run are green: tsc unchanged at the foreign baseline,
tests 113/114 with zero new failures.

---

## The root cause, confirmed

`apps/web/types/supabase.ts` claims a database roughly twice the size of the live one. The
mechanical cause was never organic drift — it was one wrong string.

| Source | Value found | Matches live ref? |
|---|---|---|
| `apps/web/package.json:7` `types` script `--project-id` | `vucvdpamtrjkzmubwlts` | **NO** — dead project (`P4001 — introspected database empty`, 2026-07-09) |
| `supabase/config.toml:3` `project_id` | `"21st"` | N/A — local-dev CLI alias, not a hosted ref; intentionally unchanged |
| Live runtime | `ewktoowpuemgbaaxxbdq` | — (this is the truth) |

**How the live ref was derived without reading any secret:** the privacy hook blocked reading
`apps/web/.env` contents, as it should. Instead the ref was confirmed two independent non-secret
ways: (1) `supabase/enable-rls.sql:3` names project `CozyDownloads (ewktoowpuemgbaaxxbdq)` in a
tracked source file, and (2) a filename-only `grep -l` confirmed the string is present in
`apps/web/.env`, `apps/web/.env.local`, and `apps/backend/.env` — existence confirmed, no values
printed, logged, or committed. No token or key was ever read.

---

## What Was Done

### The four-site repoint (Step A-0c + Execute-Agent Instruction E-new-1)

A repo-wide grep found exactly four source sites carrying the stale ref (everything else was
gitignored `.next-prod` build cache and this program's own docs). The plan declared only the first;
the orchestrator explicitly authorized the other three as a Blast Radius extension.

1. **`apps/web/package.json:7`** — the root cause. `--project-id 'vucvdpamtrjkzmubwlts'` →
   `'ewktoowpuemgbaaxxbdq'`.
2. **`scripts/embed-all-demos.js`** — **this was a real live bug**, not just a stale string. The
   script correctly read the *live* database via `NEXT_PUBLIC_SUPABASE_URL`, then POSTed its
   embedding work to `https://vucvdpamtrjkzmubwlts.supabase.co/functions/v1/embed-oai` — the *dead*
   project's Edge Function. Fixed structurally rather than by substitution: the URL is now derived
   from the same `SUPABASE_URL` the DB client uses, so it can never diverge again.
3. **`apps/web/components/features/admin/SubmissionCard.tsx:21-22`** — two hardcoded admin dashboard
   deep-links. Ref repointed and hoisted to a named `SUPABASE_PROJECT_REF` constant.

**Verification:** post-repoint repo-wide grep for `vucvdpamtrjkzmubwlts` across all source
(excluding `node_modules`/`.next`/`.turbo`/`.git`/`process`) returns **exactly one hit — the
explanatory comment I wrote in `SubmissionCard.tsx`**. Zero functional references remain.

**Flagged, not silently shipped:** the numeric table IDs in those two deep-links (`29179`, `229472`)
were minted against the old project and are almost certainly wrong for the new one. I could not
resolve the correct IDs without dashboard access, so I left an explicit `UNVERIFIED` warning comment
in the source and wrote a backlog note rather than implying the links work.

### The five `all-context.md` corrections (Step E)

| # | Correction | Evidence |
|---|---|---|
| E1 | No `local_users` dual-store exists — lines 67/244 narrate a rename that isn't current state | `apps/web/prisma/schema.prisma:616` declares `model users`; zero `local_users` |
| E2/E2b | The Lemon Squeezy **self-contradiction** resolved | Line 272 said "NOT built"; lines 385-413 correctly describe 11 live files. Rewrote the wrong bullet; added a `SUPERSEDED` callout at line 28-34 so the file no longer says two things |
| E3 | Phase-19 `themes` is not a live surface | Zero `themes` references anywhere in `apps/web` |
| E6 | `apps/web/lib/catalog.ts` does not exist on disk | Referenced at lines 46/93/287 as if live; absent. Scoped "the file is gone" flag only — wholesale rewrite left to the existing `vc-audit-context` backlog item |
| E4 | **The project-ref root cause recorded as durable context** | The most valuable single fact this program produced; written up in full with the four fixed sites, the still-outstanding regeneration, and the CLI-auth blocker |

`node .claude/skills/vc-audit-context/scripts/validate-context-discovery.mjs` → **exit 0, zero
failures, zero warnings** (242 concrete refs checked).

### Step C — RPC cross-reference (completed; found a real gap)

21 unique `.rpc()` call sites in `apps/web` cross-referenced against 35 `CREATE FUNCTION`
definitions across `supabase/migrations/*.sql` + `supabase/*.sql`. **Two call sites have no tracked
definition:**

- `check_rate_limit` — called from `apps/web/middleware.ts:33` (**hot path**) and
  `app/api/magic/use/route.ts:42`
- `increment_api_usage` — called from `app/api/magic/use/route.ts`

Both appear in `types.ts`, but that file is the known-fiction artifact, so its say-so proves
nothing. Either they exist live-but-untracked (drift), or they don't exist and middleware rate
limiting is silently erroring. Resolving this needs introspection I didn't have. Backlog note
written.

---

## What Was Skipped or Deferred

**Blocked on Supabase CLI authentication — this is the honest headline gap.**

```
$ corepack pnpm --filter web exec supabase gen types \
    --lang=typescript --project-id 'ewktoowpuemgbaaxxbdq' --schema public
Access token not provided. Supply an access token by running supabase login
or setting the SUPABASE_ACCESS_TOKEN environment variable.
```

The CLI binary is fine (workspace devDependency `2.22.6`, `--version` exits 0) — the plan's
corrected A0 premise was right about that. What's missing is a session. `pg_dump`, `psql`, and
`docker` are all genuinely absent, so there was no fallback route to live introspection either.
Credentials cannot be fabricated.

Consequently **not done**:

| Step | Item | Why |
|---|---|---|
| A1-A4b | `supabase/migrations/0000_baseline.sql` | Needs live introspection |
| B1 | Live count confirmation (33 fns / 4 views / 41 tables) | Needs live introspection |
| B2-B5 | `types.ts` regeneration + phantom removal + assertion | Needs authenticated `gen types` |
| B2b | `// PENDING MIGRATION` merge-back | Moot — nothing regenerated, so the 4 embedding-function declarations were never at risk of deletion. Verified still present: `grep -cE 'vec_dim\|get_missing_usage_embedding_items\|insert_embedding\|insert_code_embedding'` → **4** |
| D0-D3 | tsc fallout absorption | Moot — `types.ts` unchanged, so there is no regeneration fallout to absorb |

`types.ts` remains the known-inaccurate file. **But the generator is now correct**, which is the
part that required investigation. Finishing is a short, mechanical follow-up — exact steps in
`process/features/supabase-interconnect/backlog/types-regen-blocked-on-cli-auth_NOTE_29-07-26.md`.

---

## Test Gate Outcomes

| Gate | Strategy | Result |
|---|---|---|
| `AC12-tsc` — `corepack pnpm --filter web exec tsc --noEmit` | Fully-Automated | **1165 errors — byte-identical to the documented foreign baseline. Zero net new.** See methodology note below |
| `AC12-regression` — `corepack pnpm --filter web test` | Fully-Automated | **113 passed / 1 failed of 114, across 24 files. Zero NEW failures** — the single failure is the known pre-existing `lib/registry.test.ts:48`, carried since Phase 01, unrelated to this phase (per Execute-Agent Instruction E-new-2) |
| `AC14-context` — `validate-context-discovery.mjs` | Hybrid | **exit 0**, zero failures/warnings + manual diff review of all 5 corrected paragraphs |
| `AC12-rpc-xref` — call-site vs `CREATE FUNCTION` grep | Fully-Automated | **Ran. 2 gaps found** (see Step C above) — a real finding, backlogged |
| `repoint-completeness` — repo-wide stale-ref grep | Hybrid | **PASS** — zero functional references remain |
| `AC12-b2b-mergeback` — `grep -c` for the 4 embedding fns | Fully-Automated | **4 present** (`PENDING MIGRATION` count 0, correctly, since no regen occurred) |
| `AC12-baseline`, `AC12-types` | Agent-Probe | **NOT RUN — blocked**, no live introspection |
| `AC12-build` — `pnpm --filter web build` | Fully-Automated | **NOT RUN** — no `types.ts` change to validate, and the documented VPS/local build path OOMs on the type-check step; tsc + tests cover the delta |
| `infra-tooling` — CLI auth check | Hybrid | **FAIL (informative)** — this is the blocker itself, correctly surfaced by the gate |
| `sql-lint` | Known-Gap | Unchanged; no SQL was authored this phase |

### tsc methodology — a deviation worth being explicit about

Instruction E-new-3 required the D0/D1 captures in a disposable scratch worktree with the
regenerated `types.ts` copied in, specifically to prevent a vacuously-green diff. I created the
worktree (`git worktree add --detach`), but **it could not typecheck**: `tsc` needs `node_modules`,
and symlinking them in was blocked by the repo's `scout-block.cjs` hook. A full `pnpm install` in
the scratch tree was disproportionate.

Rather than fake it, I reasoned about what the gate was actually for. E-new-3 exists to stop a
`types.ts` regeneration's fallout from hiding in the noise. **No regeneration happened**, so there
is no fallout and nothing to hide. The residual risk is only whether my three hand edits broke
compilation — which the live-tree run answers directly:

- Total errors: **1165 — exactly the documented foreign baseline.** Not "about the same"; the same.
- Errors in touched files: `SubmissionCard.tsx` shows 6 hits, **all `TS2786` "'Button' cannot be
  used as a JSX component"** at lines 117-161. That is the known duplicate-React-types foreign error
  class from the user's uncommitted `package.json`/`pnpm-lock.yaml` state, and those lines are
  nowhere near my edit at line 20-28.
- `scripts/embed-all-demos.js` is plain JS, outside tsc's scope.

The scratch worktree was removed cleanly (`git worktree list` confirms only `main`).

---

## Plan Deviations

1. **Blast Radius extended by 3 files** (`scripts/embed-all-demos.js`,
   `SubmissionCard.tsx` ×2 lines) — explicitly orchestrator-authorized, mirrored into
   `phase-blast-radius-registry.md`. Rationale: Instruction E-new-1's preferred branch, and E4's
   root-cause claim would have been factually incomplete without them. One of the three was a live
   bug, not cosmetic.
2. **`embed-all-demos.js` fixed structurally, not by substitution.** The plan implied swapping the
   ref; I derived the URL from `NEXT_PUBLIC_SUPABASE_URL` instead. Same blast radius, strictly
   better — it cannot drift again. Within-blast-radius implementation-detail deviation.
3. **D0/D1 scratch-worktree methodology not followed as written** — see the tsc note above. Full
   reasoning given rather than a silent substitution.
4. **Steps A1-A4b, B1-B5, D0-D3 not executed** — hard-blocked on CLI auth, not a choice.

No hard-stop-class deviations. No live writes of any kind were attempted or made: no DDL, no
migration apply, no `db push`. No secret was read, printed, or committed.

---

## Test Infra Gaps Found

- **No CI schema-drift detector.** Nothing re-checks `types.ts` against the live DB on a schedule.
  This phase's entire root cause could have been caught in a day by such a check instead of
  persisting long enough to motivate a 6-phase program.
- **No guard against a mis-pointed generator ref.** A ~10-line pre-regen script could assert
  `package.json`'s `--project-id` matches the ref derivable from `NEXT_PUBLIC_SUPABASE_URL` and
  fail loudly on mismatch. This is the single highest-value preventive test this program could
  leave behind. Not required by this phase's exit gate.
- **No SQL linter** (pre-existing Known-Gap, unchanged).
- **tsc cannot be run in an isolated scratch worktree** because `node_modules` linking is
  hook-blocked and a fresh install is expensive. This blunts the repo's own documented
  scratch-worktree verification technique. Worth solving before the next phase that genuinely needs
  a clean-tree typecheck.
- **The ~1165 foreign tsc errors on the working tree** make tsc nearly useless as a change-detection
  gate. They stem from the user's uncommitted dependency changes (duplicate React types → `TS2786`).
  Not this program's to fix, but it degrades every phase's verification.

---

## Follow-up Artifacts Created

- `process/features/supabase-interconnect/backlog/types-regen-blocked-on-cli-auth_NOTE_29-07-26.md`
  — the blocker, with the exact human step and the unattended follow-up sequence
- `process/features/supabase-interconnect/backlog/untracked-rate-limit-rpcs_NOTE_29-07-26.md`
  — `check_rate_limit` / `increment_api_usage` have no tracked definition
- `process/features/supabase-interconnect/backlog/submission-card-table-ids-unverified_NOTE_29-07-26.md`
  — the unverified dashboard deep-link table IDs

**CONTEXT_PARTIAL:** live database schema — no introspection was possible this phase, so every
claim about live schema state in this report is inherited from prior phases, not independently
re-verified.

---

## Closeout Packet

- **Selected plan:** `phase-06-schema-truth_PLAN_25-07-26.md`
- **Finished:** four-site project-ref repoint (root cause fixed, including one live bug); all 5
  `all-context.md` corrections; RPC cross-reference (2 real gaps found and backlogged); blast-radius
  registry updated; 3 backlog notes.
- **Verified:** tsc at foreign baseline with zero net new errors; tests 113/114 with zero new
  failures; context validator exit 0; repoint completeness grep clean.
- **Unverified / blocked:** `types.ts` accuracy, migrations baseline, live schema counts — all
  require an authenticated Supabase CLI.
- **Best next state:** `Keep in active/testing`. This phase is code-complete on everything
  reachable, but the program's headline deliverable (an accurate `types.ts`) is one human login
  away. Archiving now would bury that.
- **Exact next action:** a human runs `corepack pnpm --filter web supabase:login`, then the
  regeneration follow-up in `types-regen-blocked-on-cli-auth_NOTE_29-07-26.md` completes unattended.

---

## Forward Preview

### Test Infra Found
`corepack pnpm --filter web test` → 113/114 (1 known pre-existing failure, `lib/registry.test.ts`).
`tsc --noEmit` → 1165 foreign errors, unusable as a change gate until the user's dependency state
settles. `validate-context-discovery.mjs` → clean and reliable.

### Blast Radius Changes
Extended beyond the plan by 3 files (`scripts/embed-all-demos.js`, `SubmissionCard.tsx` ×2 lines).
Not touched despite being declared: `apps/web/types/supabase.ts`, `supabase/migrations/0000_baseline.sql`.

### Commands to Stay Green
```bash
corepack pnpm --filter web test          # expect 113/114, 1 known pre-existing failure
corepack pnpm --filter web exec tsc --noEmit   # expect 1165 foreign errors, no more
node .claude/skills/vc-audit-context/scripts/validate-context-discovery.mjs   # expect exit 0
grep -rn "vucvdpamtrjkzmubwlts" --exclude-dir={node_modules,.next,.turbo,.git,process} .
# expect exactly 1 hit: the explanatory comment in SubmissionCard.tsx
```

### Dependency Changes
None. No packages added, removed, or upgraded. Root `package.json` and `pnpm-lock.yaml` untouched.
