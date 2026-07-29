---
name: plan:supabase-interconnect-phase-03-scheduler
description: "Supabase Interconnect — Phase 03: Scheduler foundation (embeddings backfill only) + seed data"
date: 25-07-26
metadata:
  node_type: memory
  type: plan
  feature: supabase-interconnect
  phase: phase-03
---

# Phase 03 — Scheduler Foundation (Embeddings Only) + Seed Data

**Program:** supabase-interconnect
**Umbrella plan:** process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/supabase-interconnect-umbrella_PLAN_25-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-03-scheduler_REPORT_{dd-mm-yy}.md (flat in the program task folder)

---

## Purpose

Build a plain-crontab-based scheduler (Fork E1) that invokes the Phase 2 embedding functions on a
recurring schedule, deliver every artifact the operator needs to install it as a repo asset, and
hand off the one privileged VPS install step to the user as a documented, non-blocking checkpoint.
**Scope note (session-locked):** this phase schedules the embeddings backfill job ONLY — no
hunt-scoring cron is built, since the 5 hunt-scoring functions are out of scope (see umbrella
`## Out-of-Scope Corrections`). Seed minimal fixtures needed to make the embedding job's dry-run
verifiable; no contest round is seeded (AC8 is descoped).

**Orchestrator ruling (26-07-26, encoded here per explicit instruction — do not re-litigate):** the
umbrella's prose narrative claims Phase 3 is hard-blocked on Phase 2's *live* apply to Supabase.
That reading is stricter than what Phase 2's own Exit Gate and Phase 3's own Entry Gate /
validate-contract actually require — both treat Phase 2's **scratch-verified** functions (proven
via `ops/pglite-verify-embedding-functions.mjs` against the real `0001_embedding_functions.sql`
migration, EVL-audited) as sufficient to satisfy the F3 dependency. **Ruled: the phase plans
govern; Phase 3 proceeds now on Phase 2's scratch-verified functions.** Nothing changes about the
live legs already deferred elsewhere in this plan — real embedding generation, live schedule
firing on gayo-vps, and applying the seed SQL to the production database all remain gated behind
their existing approval checkpoints (C3/D4, Step B6, and the Agent-Probe rows in the Validate
Contract below). The umbrella's stricter wording is informal closeout narrative, not a locked gate,
and will be corrected for consistency at this phase's UPDATE PROCESS step.

---

## Entry Gate

- Phase 2 exit gate passed **on scratch-verified functions** — hard dependency (F3): no scheduler
  may reference functions that don't yet exist, whether in scratch-schema or live form. Per the
  orchestrator ruling above, Phase 2's `ops/pglite-verify-embedding-functions.mjs` pass against the
  real migration SQL satisfies this gate; a live Supabase apply of Phase 2 is NOT required to enter
  Phase 3.
- Confirmed `pg_cron` is not an installed extension (already established via live-DB audit — no
  re-verification needed)

---

## Blast Radius

- **No new standalone cron script.** Per Step A0 (locked below), the existing
  `apps/web/app/api/cron/gen-usage-embeddings/route.ts` is reused and extended additively — the
  previously-registered `apps/web/scripts/run-embedding-backfill-cron.ts` path is **retracted** and
  is NOT created by this plan (see registry retraction in the umbrella-facing registry file).
- `apps/web/app/api/cron/gen-usage-embeddings/route.ts` — additive-only changes: optional
  `?dryRun=true` query param and an `EMBEDDING_CRON_BATCH_CAP` env-driven cap (default 20) applied
  via `missingItems.slice(0, cap)` before the per-item loop. **Precision correction (PVL cycle
  26-07-26):** the `?dryRun=true` flag is opt-in — omitting it preserves the route's existing
  side effects. The batch cap is NOT opt-in: it applies unconditionally via its env-var default
  (20) whether or not any query param is present, so a plain call with no params now processes at
  most 20 items/run instead of unboundedly many. This is an intentional, safe behavior change, not
  a silent regression — the route has zero live production traffic today (its `vercel.json` cron
  entry never fires; the app runs on gayo-vps pm2, not Vercel — see Step A0), so no live caller
  depends on unbounded processing. Document this explicitly as an intentional default-behavior
  change in the Phase 3 report.
- `apps/web/app/api/cron/gen-usage-embeddings/__tests__/route.test.ts` — new vitest file, Supabase
  client mocked, proving RPC call shape, per-item `functions.invoke` shape, dry-run short-circuit,
  and cap slicing.
- `ops/README-embedding-cron.md` — new crontab install artifact (plain text — a copy-pasteable
  `crontab -e` block), NOT a systemd unit pair (Fork E1 rejects E3/E4). Includes the `CRON_SECRET`
  declaration line, the `flock`-wrapped `curl` command, and log redirection (see Step B).
- New idempotent seed-data SQL file — exact path: `supabase/seed-embedding-verification.sql`
  (`ON CONFLICT DO NOTHING` or existence-guarded), checked in for auditability (Fork F).

**WIP safety note (carried from Phase 1's precedent):** the working tree currently has 23
uncommitted files unrelated to this program (confirmed via orchestrator-verified facts, 26-07-26).
EXECUTE must never stage, commit, stash, or revert any of them — touch only the files listed above.

---

## Implementation Checklist

### Step A — Reuse decision (locked) + cap/dry-run authoring

- [x] **A0. Reuse decision — LOCKED, not conditional.** `apps/web/app/api/cron/gen-usage-embeddings/route.ts`
      already implements almost exactly this phase's target behavior: `CRON_SECRET`-guarded (401 on
      mismatch), non-interactive, calls `supabase.rpc("get_missing_usage_embedding_items")` then
      `supabase.functions.invoke("generate-embeddings", {...})` per missing item — the same Phase-2
      function this phase is gated on, and it already reuses the existing edge function rather than
      calling OpenAI/Gemini directly. `apps/web/vercel.json`'s hourly cron declaration points at this
      exact route (it never fires today because the app runs on gayo-vps pm2, not Vercel).
      **The route is extended additively; no new script is authored.** This is final — not an
      "if A0 concludes" branch. Justification: `apps/web/scripts/tsconfig.json` (the config the
      `generate-embeddings` npm script references) does not exist on disk, so that script is already
      dead code and cannot serve as precedent for a new ts-node script; `ops/` convention across the
      repo (`seed-placeholder-components.mjs`, `pglite-verify-embedding-functions.mjs`,
      `gemini-asset-gen.mjs`, `seed-shadcn.mjs`, `gemini-asset-chroma-key.mjs`) is uniformly plain
      `.mjs`, with zero ts-node ops-script precedent anywhere in the repo. Document this locked
      decision verbatim in the Phase 3 report.
- [x] A1. **Call path — locked, no direct provider call.** The route calls
      `supabase.functions.invoke("generate-embeddings", ...)` — it does NOT call OpenAI/Gemini
      directly. **No new secret is needed in `apps/web`'s runtime.** `GEMINI_API_KEY`/
      `ANTHROPIC_API_KEY` live only in the edge function's own Deno env
      (`supabase/functions/generate-embeddings/index.ts`, `ai-config.ts`) and stay there.
- [ ] A4. **Batch cap + dry-run (mandatory additive change to the reused route).** Add an
      `EMBEDDING_CRON_BATCH_CAP` env var (default **20**) applied as `missingItems.slice(0, cap)`
      before the per-item loop, and an optional `?dryRun=true` query param that returns
      `{ dryRun: true, wouldProcess: N, items: [...] }` with HTTP 200 and makes **no**
      `functions.invoke` call. **Implementation note:** the `dryRun` check must short-circuit
      (return the JSON response) BEFORE entering the per-item `for` loop — not as a per-iteration
      skip — so the "no functions.invoke call" guarantee is structurally enforced, not just
      behaviorally coincidental. **Cap applies unconditionally** (see Blast Radius note above) —
      it is not gated behind `?dryRun=true` or any other flag; this is an intentional default-
      behavior change, safe because the route has zero live traffic today. **Starvation check:**
      because `get_missing_usage_embedding_items()` recomputes missing items from current DB state
      on every call (STABLE SQL function, no external bookkeeping table), items skipped by the cap
      in one run are NOT dropped — they simply remain "missing" and are picked up automatically on
      the next hourly run. No backlog-starvation risk exists as long as the missing-item count
      trends down over time relative to the hourly cap. **Cap justification:** the route's
      `maxDuration = 600`s; at ~5s per item (network + edge-function overhead) that is ≈100s for 20
      items, leaving generous headroom for slow calls while bounding paid-API spend per run — 20 is
      a deliberate, defensible default, not an arbitrary number.
- [ ] A5. **Author the test file (mandatory — closes the test-coverage gap found in this PVL
      cycle).** Write `apps/web/app/api/cron/gen-usage-embeddings/__tests__/route.test.ts`,
      following the existing `vi.hoisted` + `vi.mock("@/lib/supabase", ...)` pattern already used in
      `apps/web/app/api/magic/__tests__/route.test.ts` (mock `.rpc` AND `.functions.invoke` — the
      global `apps/web/__tests__/setup.ts` mock only covers `.from()`, not `.rpc`/`.functions`, so
      this file needs its own local override). Minimum assertions: (1) 401 when the Authorization
      header doesn't match `CRON_SECRET`; (2) happy path calls
      `rpc("get_missing_usage_embedding_items")` then `functions.invoke("generate-embeddings",
      {...})` once per missing item with the correct `{type, id}` body shape; (3) `?dryRun=true`
      returns `{dryRun:true, wouldProcess, items}` and `functions.invoke` is never called
      (`expect(mockInvoke).not.toHaveBeenCalled()`); (4) when missing-item count exceeds
      `EMBEDDING_CRON_BATCH_CAP`, only `cap` items are processed (assert `mockInvoke` call count
      equals the cap, not the full list length).

### Step B — Author the install artifact

- [ ] B1. Write the exact `crontab -e` block:
      ```
      CRON_SECRET=<value>
      0 * * * * flock -n /tmp/embedding-cron.lock -c 'curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://higherbits.dev/api/cron/gen-usage-embeddings' >> /home/higherbits/logs/embedding-cron.log 2>&1
      ```
      Installed as the `higherbits` user's crontab (never root), per deploy memory: install via
      `su - higherbits`, never `sudo -u` (HOME pollution breaks corepack). The `CRON_SECRET=` line
      is a standard crontab variable declaration at the top of the crontab file — it is read by cron
      itself and interpolated into the command via `$CRON_SECRET`.
- [ ] B2. Document the exact schedule cadence — hourly (`0 * * * *`), matching `vercel.json`'s
      original declared cron cadence for continuity.
- [ ] B3. **Log redirection (mandatory).** The crontab line redirects output to
      `/home/higherbits/logs/embedding-cron.log` (see B1). State in the README that the log
      directory must exist first (`mkdir -p /home/higherbits/logs`), and how the operator checks
      this log to confirm a run happened, since cron's default mail behavior is commonly
      unconfigured on a fresh VPS.
- [ ] B4. **Overlap/concurrency protection (mandatory).** The crontab command is wrapped in
      `flock -n /tmp/embedding-cron.lock -c '...'` (see B1) to prevent two overlapping runs if a
      slow run is still in flight when the next fires. Near-zero cost; no DB-level lock is built for
      this phase's scope. **Operator-safety note:** a run skipped due to `flock` contention is a
      silent no-op from cron's perspective (no error, no log line) — the README must say this
      explicitly so a "missing" run can be correctly diagnosed as "another run was still in flight"
      rather than "the job failed."
- [ ] B5. Write the install artifact as `ops/README-embedding-cron.md` with: the exact crontab
      block from B1 (including the `flock` wrapper and log redirection), the required env vars
      (`CRON_SECRET`, `EMBEDDING_CRON_BATCH_CAP`), the `?dryRun=true` flag documented (A4), and a
      dry-run `curl` command the operator can run manually first to confirm the route works before
      installing the schedule. **Operator-safety note:** the `CRON_SECRET` value lives only inside
      the crontab file itself (protected by standard crontab-spool permissions — 600, owner-only);
      do not copy it into any other file, and never log its value anywhere (including the
      `embedding-cron.log` output — the `curl` command must not echo the header).
- [ ] B6. State explicitly in the artifact: this is the ONE privileged step the user runs personally
      on gayo-vps (`ssh root@72.62.196.231` per deploy memory, then `su - higherbits` for the
      crontab edit) — no agent executes this step. Re-verify the live deploy path/user/pm2-name with
      `pm2 list` and `ls /home/*/htdocs/` at install time per the standing drift warning in
      `process/context/all-context.md` §Deployment.

### Step C — Local dry-run verification

- [ ] C1. Run the cron path locally (or in a disposable environment) against Phase 2's
      scratch-verified functions and confirm it successfully invokes
      `get_missing_usage_embedding_items` → calls `supabase.functions.invoke("generate-embeddings",
      ...)` (the edge function itself handles the OpenAI/Gemini call internally) without error.
- [ ] C2. Confirm the exit/response is crontab-friendly (the route returns a clean JSON response and
      the `curl -fsS` flags in B1 make cron treat a non-2xx response as a failure) and that the log
      redirection from B3 actually receives output when run via `curl` locally.
- [ ] C3. If `OPENAI_API_KEY`/`GEMINI_API_KEY` is not available to the edge function in this
      session's environment (per SPEC Known Gaps), document this as a Known Gap for the dry-run's
      live-API leg specifically — the control flow up to the edge-function invoke can still be
      verified.
- [ ] C4. Confirm `?dryRun=true` (A4) correctly lists missing items without invoking the edge
      function — exercise it once as part of this verification (both via the new vitest test from
      Step A5 and, if a local dev server is available, a manual `curl`).

### Step D — Seed minimal fixtures for verification (Fork F)

- [ ] D1. Write an idempotent SQL seed file at `supabase/seed-embedding-verification.sql`
      (`ON CONFLICT DO NOTHING` or existence-guarded) adding at least one `components` row with no
      existing embedding, so `get_missing_usage_embedding_items()` has something real to find during
      verification. **Column-shape note (added this PVL cycle — `components` has real NOT NULL/FK
      constraints per `ops/seed-placeholder-components.mjs`'s documented schema-recon comment):**
      the insert must supply `user_id` (NOT NULL, FK to `users.id` — resolve via a subquery, e.g.
      `(SELECT id FROM public.users LIMIT 1)`, mirroring the runtime-discovery pattern in
      `ops/seed-placeholder-components.mjs` rather than hardcoding a UUID), `component_slug` (NOT
      NULL, unique with `user_id`), `name` (NOT NULL), `component_names` (JSON, NOT NULL — e.g.
      `'["Embedding Verification Fixture"]'`), and `preview_url` (NOT NULL, NO DEFAULT — any
      placeholder string is fine, e.g. a neutral image URL). `code`/`description` are nullable or
      defaulted (`code` defaults to `"N/A"`) and do not need explicit values. Guard the insert with
      `ON CONFLICT (user_id, component_slug) DO NOTHING`, and make the insert a no-op (not an error)
      if the `SELECT id FROM public.users LIMIT 1` subquery returns no row (empty database with zero
      users) — document this edge case in the seed file's header comment. Do not seed a `demos` row
      unless it is needed — a `components`-only seed row is sufficient to give
      `get_missing_usage_embedding_items()` something to find.
- [ ] D2. Check the seed file into `supabase/`, following the existing repo's seed-file pattern
      (`ops/seed-placeholder-components.mjs` precedent — confirmed present on disk, 26.9K).
- [ ] D3. **No contest round is seeded in this phase** — AC8 is descoped (see umbrella
      `## Out-of-Scope Corrections`); do not create `component_hunt_rounds` seed data here.
- [ ] D4. **HARD STOP — request explicit user approval before running the seed SQL against the live
      database.** Present the exact seed statements for review before execution.

---

## Exit Gate

```bash
# Local vitest coverage for the reused route's additive changes (cap + dry-run)
corepack pnpm --filter web test -- app/api/cron/gen-usage-embeddings
# Expected: exit 0, all new tests pass

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0 — no NEW errors beyond the 1 known foreign error at
# apps/web/components/features/studio/sandbox/components/add-registry-modal.tsx(233,19) (TS2322,
# from uncommitted user WIP, outside this program's blast radius — do not fix; mirrors Phase 1's
# ruling on foreign errors)

corepack pnpm --filter web test
# Expected: 62/62 passing baseline (26-07-26) plus new tests, no regression
```

- All Step A-D checklist items checked (A0/A1 locked decisions documented in the Phase 3 report)
- Cron path + install artifact (crontab block w/ `flock` + log redirection + README) delivered as
  repo files (SPEC AC6)
- Local dry-run confirms the path invokes `get_missing_usage_embedding_items` →
  `generate-embeddings` edge-function invoke (SPEC AC6 `proven by:` note)
- `?dryRun=true` flag and `EMBEDDING_CRON_BATCH_CAP` verified functional (A4/C4)
- Minimal seed fixtures added (idempotent, checked in) enabling AC7's search-result verification
- Phase report explicitly states the VPS crontab install is NOT YET DONE and is not a blocking gate
  for this program's completion (SPEC AC6, Constraints)
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Phase 2 exit gate not yet passed on scratch-verified functions — hard F3 dependency (see
  orchestrator ruling above; live apply is NOT required), cannot proceed.
- `OPENAI_API_KEY`/`GEMINI_API_KEY` genuinely unavailable to the edge function and no mocking
  strategy can meaningfully verify the control flow — document as Known Gap, do not block the whole
  phase; the artifact delivery (Step A/B) and DB-only verification (function calls without the
  embedding-generation leg) can still satisfy most of the exit gate.
- User does not approve the seed SQL (Step D4) — AC7's search-result verification is deferred with
  a documented reason; the cron artifact delivery itself is not blocked by this.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: read Phase 2 report; confirmed functions are scratch-verified
      (per orchestrator ruling, live apply not required); confirmed `apps/web/app/api/cron/gen-usage-embeddings/route.ts`
      exists and is reusable; confirmed `apps/web/scripts/tsconfig.json` absent (disqualifies new
      ts-node script); confirmed `ops/` convention is uniformly `.mjs`; test context loaded (62/62
      passing baseline, 1 foreign tsc error)
- [x] 2. INNOVATE — decision locked: Step A0 (reuse the existing route, no new script) and Step A1
      (call path is `functions.invoke`, no direct provider call, no new secret) are final per this
      supplement; Fork E1 (plain crontab) + Fork F (committed idempotent seed SQL) confirmed still
      hold
- [x] 3. PLAN-SUPPLEMENT — plan-agent: this inner-loop supplement pass (26-07-26) applied 7 edits —
      (1) locked Step A0 reuse decision + registry retraction of the standalone-script path,
      (2) locked Step A1 call-path clarification, (3) exact `?dryRun=true`/`EMBEDDING_CRON_BATCH_CAP`
      parameter shape with justified cap=20, (4) exact crontab block (CRON_SECRET declaration +
      flock-wrapped curl + log redirection), (5) two operator-safety notes (secret handling,
      flock-skip silent no-op), (6) new local verification approach via a dedicated vitest file
      instead of extending the pglite harness, (7) confirmed Step D2's `ops/seed-placeholder-components.mjs`
      precedent is real (26.9K, on disk). Blast Radius, Touchpoints, registry, and Resume/Handoff
      updated accordingly.
- [x] 4. PVL — vc-validate-agent: fresh V1-V7 pass completed 26-07-26 (inner-PVL cycle 1 against
      this PLAN-SUPPLEMENT). Read the actual `route.ts` and `generate-embeddings/index.ts` source,
      the `get_missing_usage_embedding_items()` migration SQL, the vitest config + 2 precedent test
      files, and `ops/seed-placeholder-components.mjs`'s schema-recon comment. Found 0 FAILs and 3
      real CONCERN-class gaps (a checklist gap — no step actually instructed authoring
      `route.test.ts` despite it being referenced in Blast Radius/Touchpoints/Exit Gate; a
      self-contradiction between "default behavior unchanged" and the cap's unconditional env-var
      default; and an under-specified seed SQL against `components`' real NOT NULL/FK schema) —
      fixed all 3 directly in the plan text this cycle (new Step A5, Step A4 precision note + Blast
      Radius correction, Step D1 column-shape note). Gate: PASS. See `## Validate Contract` below
      for full findings.
- [x] 5. EXECUTE — execute-agent delivered 4 artifacts: additive `?dryRun=true` +
      `EMBEDDING_CRON_BATCH_CAP` (default 20) extension to
      `apps/web/app/api/cron/gen-usage-embeddings/route.ts`; new
      `apps/web/app/api/cron/gen-usage-embeddings/__tests__/route.test.ts`; the operator install
      artifact `ops/README-embedding-cron.md`; and `supabase/seed-embedding-verification.sql`. A
      review-driven additive fix added `totalMissing`/`cap` to the dry-run response (the capped
      count alone couldn't show operators the true backlog trend). Gates: `tsc --noEmit` exit 0 /
      0 errors; vitest 73/73 across 18 files (62 baseline + 11 new).
- [x] 6. EVL — independent confirmation run: all 5 gates green. Verified structurally that the
      zero-invoke dry-run guarantee holds (early return precedes the `functions.invoke` loop) and
      via 4 tests asserting `mockInvoke` was never called on dry-run. Confirmed
      `get_missing_usage_embedding_items()` is `STABLE` (capped items reappear next run, not
      dropped). Confirmed seed SQL is idempotent and safe on an empty DB (`user_id` sourced via a
      `FROM public.users LIMIT 1` in-statement, not a scalar subquery — zero users is a clean
      no-op). Scope confirmed: only the 4 named artifacts touched, `package.json`/`pnpm-lock.yaml`
      untouched, stash empty.
- [x] 7. UPDATE PROCESS — phase report finalized; umbrella `## Current Execution State` rewritten;
      `process/context/tests/all-tests.md` re-baselined to 73/18; `all-context.md` updated. Also
      corrected a real umbrella defect: its claim that Phase 3 was hard-blocked on Phase 2's live
      apply contradicted Phase 2's own Exit Gate (accepts scratch verification) and Phase 3's own
      Entry Gate — orchestrator ruled the phase plans govern; Phase 3 then completed with every
      gate green on zero live database access, settling it. Committed as `19d06d1` (execution) and
      `a282d55` (process).

**Validate-contract is current.** The `## Validate Contract` below is dated 26-07-26
(`generated-by: inner-pvl: phase-3`, Gate: PASS) and supersedes the prior 25-07-26 outer-pvl
CONDITIONAL contract. Orchestrator may proceed to spawn `vc-execute-agent` for Step 5 (EXECUTE).

---

## Touchpoints

- `apps/web/app/api/cron/gen-usage-embeddings/route.ts` (existing — reused per locked A0, extended
  additively with A4's `EMBEDDING_CRON_BATCH_CAP`/`?dryRun=true` addition)
- `apps/web/app/api/cron/gen-usage-embeddings/__tests__/route.test.ts` (new — mocked-Supabase vitest
  coverage for the additive changes, authored per Step A5)
- `ops/README-embedding-cron.md` (new install artifact)
- `supabase/seed-embedding-verification.sql` (new idempotent seed SQL, following the
  `ops/seed-placeholder-components.mjs` precedent's spirit, checked into `supabase/`)

---

## Public Contracts

- No new API routes or public interfaces — this phase delivers an operator-facing install artifact
  and a small additive change (two optional params) to an existing internal cron route, neither of
  which is a runtime-facing contract for external callers.
- The seed data added is additive-only (idempotent) and does not alter any existing row.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| Local dry-run of cron path invokes correct code path | Fully-Automated (DB leg) / Hybrid (embedding-generation leg, may be mocked) | AC6 |
| `?dryRun=true` lists missing items without invoking edge function; `EMBEDDING_CRON_BATCH_CAP` respected | Fully-Automated (new vitest file, Step A5) | AC6 (test-coverage gap closure) |
| Install artifact reviewed for correctness (crontab block incl. `flock` + log redirection, README) | Hybrid | AC6 (B3/B4 gap closure) |
| Search returns results after job run against seeded fixture | Agent-Probe (requires OPENAI_API_KEY/GEMINI_API_KEY + live Qdrant/Supabase) | AC7 |
| Live schedule firing confirmation | Agent-Probe (operator-run, non-blocking) | AC6 |
| No regression on tsc/test baseline | Fully-Automated | AC6 (no-regression gate) |

```bash
corepack pnpm --filter web test -- app/api/cron/gen-usage-embeddings
corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test
# Expected: exit 0 (tsc: no NEW errors beyond the 1 known foreign add-registry-modal.tsx error),
# DB-leg function calls succeed
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-03-scheduler_PLAN_25-07-26.md`
- Last completed step: UPDATE PROCESS — 26-07-26. Phase is CODE-COMPLETE and EVL-CONFIRMED (all
  5 gates green on the independent EVL re-run); phase report finalized and umbrella state updated.
  Task folder intentionally stays in `active/` (not archived) pending two operator-only actions
  (see below) — this is a deliberate archival-timing choice, not an incomplete phase.
- Validate-contract status: 26-07-26, `generated-by: inner-pvl: phase-3` — **PASS** (supersedes the
  25-07-26 outer-pvl CONDITIONAL contract)
- Next step: no further agent action required for this phase. Two OPERATOR-ONLY actions remain
  outstanding and are explicitly out of any agent's authority: (1) install the crontab per
  `ops/README-embedding-cron.md` on the target host, and (2) apply
  `supabase/seed-embedding-verification.sql` to a live database (gated by Step D4's hard stop —
  explicit user approval required before any live seed-SQL execution). A fresh agent resuming here
  should treat the phase as done and move to Phase 4's Step 0, not re-run EXECUTE/EVL.
- Supporting context files loaded: Phase 2 report, umbrella plan `## Current Execution State` and
  `## Program-Wide Learnings`, `process/context/all-context.md`, `phase-blast-radius-registry.md`

---

## Test Infra Improvement Notes

- No vitest coverage exists yet for the cron pathway (`apps/web/app/api/cron/gen-usage-embeddings/route.ts`)
  today. This plan closes that gap directly by adding
  `apps/web/app/api/cron/gen-usage-embeddings/__tests__/route.test.ts` (Touchpoints, authored per
  Step A5), which `apps/web`'s existing vitest glob (`**/__tests__/**/*.test.ts`) will pick up
  automatically — no vitest-config change needed. Precedent confirmed on disk:
  `apps/web/app/api/magic/__tests__/route.test.ts` uses the identical `vi.hoisted` +
  `vi.mock("@/lib/supabase", ...)` pattern this new file should follow.

---

## Inner Loop Refresh Note

**Date: 2026-07-26** (strictly newer than the existing Validate Contract's `date: 2026-07-25` below
— this is the mechanical Step 4b trigger that forces the orchestrator to re-run PVL from V1 before
EXECUTE.)

This is an inner-loop PLAN-SUPPLEMENT pass (Phase Loop Progress Step 3), not a PVL-supplement pass.
Research (Step 1) and Innovate (Step 2) findings were folded into the plan directly:

- **Orchestrator ruling recorded:** Phase 3 proceeds on Phase 2's scratch-verified functions; the
  umbrella's stricter "live apply required" narrative is informal closeout prose, not a locked gate,
  and will be corrected at this phase's UPDATE PROCESS. See `## Purpose` for the full ruling text.
- **7 edits applied** (see Phase Loop Progress Step 3 checkbox summary above for the full list):
  Step A0 locked (reuse the existing route, no new script — with the `apps/web/scripts/tsconfig.json`
  absence and repo-wide `.mjs`-only `ops/` convention as justification), Step A1 locked (call path is
  `functions.invoke`, no new secret), Step A4 given an exact parameter shape and a justified cap of
  20, Step B given the exact crontab block, two new operator-safety notes added (B4/B5), a new local
  verification approach specified (dedicated vitest file, not an extension of the pglite harness),
  and Step D2's precedent citation confirmed accurate.
- **Blast Radius / Touchpoints corrected:** `apps/web/scripts/run-embedding-backfill-cron.ts` is
  retracted — it is not created by this plan. `supabase/seed-embedding-verification.sql` is named
  explicitly (was "path TBD"). `apps/web/app/api/cron/gen-usage-embeddings/__tests__/route.test.ts`
  is added as a new Touchpoint.
- **Baselines corrected:** `corepack pnpm --filter web test` = 62/62 passing (not stale figures from
  other phases); `tsc --noEmit` = 1 known foreign error at `add-registry-modal.tsx:233` (TS2322,
  outside this program's blast radius, from uncommitted WIP) — the Exit Gate and Verification
  Evidence commands above are updated to gate on "no NEW errors" rather than a bare `tsc --noEmit`
  exit-0 expectation, mirroring Phase 1's precedent for foreign errors.

Because this is a plan-content change (not a V7 SUPPLEMENT REQUEST gap-fix), the existing
`## Validate Contract` section below is left untouched by this pass — vc-validate-agent supersedes
it wholesale on the forced re-run from V1.

---

## Validate Contract

Status: PASS
Date: 26-07-26
date: 2026-07-26
generated-by: inner-pvl: phase-3
supersedes: 2026-07-25 (outer-pvl, CONDITIONAL) — this inner-PVL pass re-ran V1-V7 against the
26-07-26 PLAN-SUPPLEMENT (the outer-pvl pass could not have seen the 3 gaps closed below, since
they were introduced or exposed by the supplement itself)

Parallel strategy: sequential
Rationale: Signal score 2/7 (S4 phase-program classification; S6 high-risk data-mutation-adjacent
class — the seed SQL writes to a production table pending Step D4 approval, and `CRON_SECRET` is a
trust-boundary-adjacent secret) → nominal MEDIUM tier would suggest parallel subagents (4 Layer 1 +
4 Layer 2 = 8 agents), but this validate-agent instance has no Agent/Task spawn tool available in
its own tool grant for this invocation (Read/Bash/Write only) — the four Layer 1 dimension checks
and the four Layer 2 section checks were performed sequentially by this agent using Read/Bash
fact-finding: read `apps/web/app/api/cron/gen-usage-embeddings/route.ts`,
`supabase/functions/generate-embeddings/index.ts`, `supabase/migrations/0001_embedding_functions.sql`
(confirmed `get_missing_usage_embedding_items()`'s exact return shape), `apps/web/vitest.config.ts`
+ `apps/web/vitest.setup.ts` + `apps/web/__tests__/setup.ts`, two precedent test files
(`apps/web/app/api/magic/__tests__/route.test.ts`, `apps/web/app/api/lemonsqueezy/__tests__/webhook.test.ts`),
`ops/seed-placeholder-components.mjs`'s schema-recon comment (full `components`/`demos` column
list), `apps/web/vercel.json`, `phase-blast-radius-registry.md`, and the Phase 2 plan's Exit Gate
text. Findings quality is not degraded by the missing spawn tool; only wall-clock parallelism is.

Test gates (C3 5-column table — ADDITIVE; existing consumers still parse the legacy line form below it):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC6 | 401 returned when Authorization header doesn't match `CRON_SECRET` | Fully-Automated | `apps/web/app/api/cron/gen-usage-embeddings/__tests__/route.test.ts` — Step A5 assertion (1) | A |
| AC6 | Happy path calls `rpc("get_missing_usage_embedding_items")` then `functions.invoke("generate-embeddings", {...})` once per missing item with correct `{type, id}` body | Fully-Automated | Step A5 assertion (2) | A |
| AC6 (test-coverage gap closure) | `?dryRun=true` short-circuits before the loop; zero `functions.invoke` calls | Fully-Automated | Step A5 assertion (3) | A |
| AC6 (test-coverage gap closure) | `EMBEDDING_CRON_BATCH_CAP` caps processed items when missing-count exceeds cap | Fully-Automated | Step A5 assertion (4) | A |
| AC6 (no-regression gate) | No regression on baseline | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` (no NEW errors beyond the 1 known foreign error) && `corepack pnpm --filter web test` (62/62 + new tests) | A |
| AC6 (B3/B4 gap closure) | Install artifact correctness (crontab line incl. `flock` wrapper + log redirection, README, env vars, secret-handling note) | Hybrid | Manual review of `ops/README-embedding-cron.md` against Steps B1-B6 | B |
| AC6 (predecessor) | Full local dry-run including the embedding-generation leg | Hybrid — precondition: reachable `OPENAI_API_KEY`/`GEMINI_API_KEY` to the edge function | Local/disposable run against seeded fixture (Step D1) | B |
| AC7 | Search returns non-empty results after a real job run | Agent-Probe — requires live `OPENAI_API_KEY`/`GEMINI_API_KEY` + live Qdrant/Supabase (absent per SPEC Known Gaps) | Operator/agent-run job against seeded fixture, then `/api/search` check | D — named residual; may end INCONCLUSIVE if no live key is ever provisioned this program |
| AC6 | Live schedule firing on gayo-vps | Agent-Probe — operator-only, non-blocking per SPEC Constraints | Operator confirms post-install (Step B6) | D — named residual; explicitly non-blocking for program completion |
| — | Concurrent cron-run overlap protection | Hybrid | Manual review of the `flock`-wrapped crontab line (Step B4) | B |
| — | Seed SQL is schema-valid against `components`' real NOT NULL/FK constraints | Hybrid | Manual review of `supabase/seed-embedding-verification.sql` against Step D1's column-shape note; any live application is separately gated by Step D4 | B |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies (Fully-Automated /
Hybrid / Agent-Probe). Known-Gap is never a `strategy:` value — the 2 Agent-Probe rows above (AC7,
live schedule firing) are named D-type residuals with an explicit SPEC-documented rationale, not
silent Known-Gap passes.

Failing stub:
```
test("should return 401 when Authorization header does not match CRON_SECRET", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: 401 on Authorization header mismatch")
})
```

Failing stub:
```
test("should call rpc then functions.invoke once per missing item with correct body shape", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: RPC call shape, per-item functions.invoke shape")
})
```

Failing stub:
```
test("should short-circuit before the loop and never call functions.invoke when dryRun=true", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: dry-run short-circuit, zero functions.invoke calls")
})
```

Failing stub:
```
test("should only process cap items when missing count exceeds EMBEDDING_CRON_BATCH_CAP", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: batch cap slicing respected")
})
```

(No stub for the no-regression row — it runs the existing repo-wide `tsc`/`test` gate commands, not
a new single-scenario unit test; a `test("should have no regression", ...)` stub would be a
meaningless placeholder for a whole-suite CI check, contrary to the stub rule's intent of a red-first
starting point for one new behavior.)

Legacy line form (retained so existing validate-contract consumers still parse):
- Cron path DB-leg control flow: Fully-automated: `apps/web/app/api/cron/gen-usage-embeddings/__tests__/route.test.ts` (Step A5) | Hybrid: embedding-generation leg requires reachable credentials to the edge function | agent-probe: search-result verification (AC7), live cron firing (AC6) | Hybrid: concurrent-run locking via `flock` (Step B4, reviewed not executed) | Hybrid: seed SQL schema validity (Step D1, reviewed not executed against live DB)

Dimension findings:
- Infra fit: PASS — route reuse confirmed byte-for-byte against the on-disk
  `apps/web/app/api/cron/gen-usage-embeddings/route.ts` (read this cycle); call path confirmed to
  use `supabase.functions.invoke("generate-embeddings", ...)`, matching the edge function's real
  signature at `supabase/functions/generate-embeddings/index.ts`; `apps/web/scripts/tsconfig.json`
  absence and the repo-wide `.mjs`-only `ops/` convention (7 files checked, 0 `.ts`) both
  independently re-confirmed this cycle.
- Test coverage: PASS (was the checklist's silent gap this cycle) — found the Implementation
  Checklist had NO step actually instructing authoring of `route.test.ts`, despite it being listed
  in Blast Radius/Touchpoints/Exit Gate/Verification Evidence and referenced by Step C4 as if it
  already existed. Closed by adding Step A5 with 4 concrete assertions and the exact mocking
  pattern needed, confirmed against 2 real precedent files on disk.
- Breaking changes: PASS (was a real self-contradiction this cycle) — found the plan claimed
  "Default behavior (neither param present) is unchanged" while independently describing an
  `EMBEDDING_CRON_BATCH_CAP` env-var default that applies unconditionally (not gated behind any
  query param) — these two claims cannot both be true once the cap default is nonzero. Closed by
  correcting the wording in Blast Radius + Step A4 and stating explicitly why the change is safe
  (the route has zero live production traffic today; `vercel.json`'s cron entry never fires because
  the app runs on gayo-vps pm2, not Vercel).
- Security surface: PASS — `CRON_SECRET` is never logged or echoed in any response body (confirmed
  by reading `route.ts` — the header is read and compared, never returned); `curl -fsS` doesn't
  print request headers; Step D4 hard-stops before any live DB write; no new secret is needed in
  `apps/web`'s runtime (confirmed via reading `generate-embeddings/index.ts` — `GEMINI_API_KEY`/
  `ANTHROPIC_API_KEY`/`SUPABASE_SERVICE_ROLE_KEY` are read only from the edge function's own Deno
  env, never passed through from `apps/web`).
- Section A feasibility (Reuse decision + cap/dry-run authoring): PASS (was CONCERN pre-fix) — same
  root-cause fixes as Test coverage/Breaking changes above, applied at the checklist-step level
  (new Step A5; Step A4 precision + starvation-check note).
- Section B feasibility (Install artifact): PASS — `flock -n /tmp/embedding-cron.lock` reboot
  safety verified correct: advisory locks are released by the OS when the holding process exits or
  is killed (including on reboot), so a stale lock file surviving in `/tmp` does not cause a false
  "still locked" state — `/tmp` is an idiomatic, safe location for this. `curl -fsS` failure
  visibility verified correct: `-f` fails on HTTP >=400, `-S` still prints curl's own error message
  to stderr even with `-s`, and B1's `2>&1` redirect captures it into the log — a broken run is
  visible. No conflicts found with other program phases (registry `## Conflict Check` confirms
  disjoint file sets from Phases 4/5/6).
- Section C feasibility (Local dry-run verification): PASS — mechanically feasible now that
  Section A's test-authoring gap is closed (Step A5); C3's Known-Gap language for missing API keys
  is appropriately scoped and consistent with SPEC's documented Known Gaps.
- Section D feasibility (Seed fixtures): PASS (was CONCERN pre-fix) — found Step D1 did not account
  for `components`' real NOT NULL/FK schema (`user_id` FK NOT NULL, `component_slug` NOT NULL
  unique, `name` NOT NULL, `component_names` JSON NOT NULL, `preview_url` NOT NULL no default — all
  confirmed via `ops/seed-placeholder-components.mjs`'s documented schema-recon comment, itself
  sourced from `apps/web/prisma/schema.prisma`). A hand-rolled INSERT following only the plan's
  original one-line description risked failing against these constraints, or silently hardcoding a
  fragile `user_id`. Closed by adding the column-shape note (subquery-based `user_id` resolution
  mirroring the existing ops script's runtime-discovery pattern, explicit NOT NULL column list,
  conflict target, and the empty-database edge case).

Open gaps: none blocking (0 unresolved CONCERNs, 0 FAILs). All CONCERN-class gaps found this cycle
were closed via direct plan-text edits during this PVL pass (gap-resolution B, "fixed in this
plan"), not accepted as residuals.

Known Gaps (named residuals, gap-resolution D — do NOT count toward CONDITIONAL/BLOCKED):
- AC7 search-result verification: requires live `OPENAI_API_KEY`/`GEMINI_API_KEY` + live
  Qdrant/Supabase; per SPEC Known Gaps this leg may end INCONCLUSIVE this program if no live key is
  ever provisioned. Not blocking — the DB-leg control flow up to the edge-function-invoke boundary
  is Fully-Automated-proven independent of this.
- Live schedule firing on gayo-vps: operator-only, explicitly non-blocking per SPEC Constraints
  (Step B6) — no agent executes the crontab install.
- Full embedding-generation-leg local dry-run (Hybrid): gated on the same live-key precondition as
  AC7.
- Human-operator-follows-the-README-correctly: no automated test proves a human will correctly
  copy-paste and install the crontab block — the Hybrid review proves the artifact is *correct*,
  not that it will be *executed* correctly by the operator.
- Live schema parity for the seed SQL: the Hybrid review proves the INSERT is valid against the
  documented (scratch-verified) `components` schema — it does not prove the live database's actual
  current schema matches until Phase 2 is live-applied, which remains deferred per the orchestrator
  ruling and is out of this phase's scope.

**Structural plan-artifact check (informational, not a real gap, unchanged from prior pass):**
`node .claude/skills/vc-generate-plan/scripts/validate-plan-artifact.mjs` reports 4 FAILs for
missing SIMPLE/COMPLEX-plan metadata (overview/context section, Complexity metadata, Phase
Completion Rules, Acceptance Criteria) — this is the wrong validator for a phase-program sub-plan.
Re-ran this cycle: the correct validator,
`node .claude/skills/vc-generate-phase-program/scripts/validate-phase-stub.mjs`, still passes with
0 failures / 0 warnings against this file (487 lines pre-edit / current line count post-edit). No
action needed.

What this coverage does NOT prove:
- The 4 new Fully-Automated tests (Step A5) prove control flow reaches the RPC/edge-function-invoke
  call boundary without throwing, and prove the dry-run/cap logic in isolation with a mocked
  Supabase client — they do NOT prove the embedding-generation leg (the edge function's internal
  OpenAI/Gemini/Claude calls) succeeds, since that leg runs inside the edge function's own Deno
  process and depends on credentials this session cannot verify are live.
- The no-regression gate (`tsc --noEmit` + `pnpm test`) proves no NEW errors are introduced beyond
  the 1 known foreign `add-registry-modal.tsx` error — it does NOT prove the foreign error itself is
  benign; it is explicitly out of this program's blast radius and untouched.
- The Hybrid install-artifact review proves the crontab block is *correctly specified* — it does NOT
  prove concurrent-run safety under real load (no test exercises two overlapping cron firings) and
  does NOT prove a human operator will follow the README correctly during the actual VPS install.
- The Hybrid seed-SQL review proves the INSERT is schema-valid against the documented (scratch-
  verified) NOT NULL/FK constraints for `components` — it does NOT prove the *live* database's
  current schema matches until Phase 2 is live-applied (deferred, out of this phase's scope), and it
  does NOT execute the insert (Step D4 gates any live application behind explicit user approval).
- The Agent-Probe rows (AC7 search results, live schedule firing) may end INCONCLUSIVE this program
  if live API keys/live cron install are never provisioned — this is a named, accepted residual per
  SPEC Known Gaps, not a silent gap invisible to the reader.

Gate: PASS
Net Gate Derivation: 0 FAILs / 0 unresolved CONCERNs (3 CONCERN-class gaps found this cycle —
missing test-authoring checklist step, "default behavior unchanged" self-contradiction, under-
specified seed-SQL schema — were all closed via direct plan-text edits during this same V6 pass,
gap-resolution B) / 2 named D-type Agent-Probe residuals (SPEC-documented, non-blocking) → PASS.
Proceed to EXECUTE.
Accepted by: N/A — Gate is PASS; no CONCERN was accepted as a residual, all were resolved in-plan
this cycle. The 2 Agent-Probe residuals (AC7, live schedule firing) were pre-accepted by SPEC's own
Known Gaps section, not newly accepted here.

## Autonomous Goal Block

(BRANCH B — this phase belongs to the `supabase-interconnect` phase program, which has an umbrella
plan containing `## Stable Program Goal` at
`process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/supabase-interconnect-umbrella_PLAN_25-07-26.md`.
Per the BRANCH B rule, no separate `## Autonomous Goal Block` is written into this phase plan — the
umbrella's `## Stable Program Goal` governs. Reference for latest state: the umbrella plan path
above, `## Current Execution State` section.)
