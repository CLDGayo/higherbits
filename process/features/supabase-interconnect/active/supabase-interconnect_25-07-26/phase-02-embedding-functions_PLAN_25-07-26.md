---
name: plan:supabase-interconnect-phase-02-embedding-functions
description: "Supabase Interconnect — Phase 02: Author the 4 missing embedding DB functions"
date: 25-07-26
metadata:
  node_type: memory
  type: plan
  feature: supabase-interconnect
  phase: phase-02
---

# Phase 02 — Author the 4 Embedding DB Functions

**Program:** supabase-interconnect
**Umbrella plan:** process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/supabase-interconnect-umbrella_PLAN_25-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-02-embedding-functions_REPORT_{dd-mm-yy}.md (flat in the program task folder)

---

## Purpose

Author, version-control, and locally verify the 4 embedding-generation database functions that are
confirmed absent from the live database: `get_missing_usage_embedding_items`, `insert_embedding`,
`insert_code_embedding`, `vec_dim`. This is a hard F3 dependency — no scheduler work (Phase 3) may
reference these functions until they exist and are verified. **Scope note (session-locked):** the
SPEC's AC5 originally listed 9 functions; the 5 hunt-scoring functions
(`update_all_hunt_scores`, `process_next_round`, `process_single_round`, `update_single_demo_score`,
`update_hunt_demos_metrics`) are explicitly out of scope for this phase — see umbrella
`## Out-of-Scope Corrections` and `process/features/supabase-interconnect/backlog/hunt-scoring-engine_NOTE_25-07-26.md`.
Fork B1 (author fresh) — the upstream port path was proven dead this session.

---

## Entry Gate

- Phase 1 exit gate passed (grants/RLS state is sane before functions that will be called through
  the same relations are authored)
- Confirmed vector columns exist live: `code_embeddings.embedding`, `usage_embeddings.embedding`,
  `backup_code_embeddings.embedding`, `backup_usage_embeddings.embedding`, `demos.embedding`,
  `demos.embedding_oai` (already confirmed via live-DB audit — no re-verification needed to start)

---

## Blast Radius

- `supabase/migrations/` — new directory (or first entries in it) containing 4 new
  `CREATE FUNCTION` migration files, one per function (or logically grouped)
- Read reference only: `apps/web/scripts/generate-embeddings.ts` (existing manual backfill script —
  the new functions must be callable in a way compatible with this script's existing code path, per
  AC6's `proven by:` note)
- Read reference only: `supabase/functions/generate-embeddings` and `ai-search-oai` edge functions
  (deployment status unverified per SPEC Known Gaps — do not assume live; treat as reference only)

**New writable paths this cycle (PVL-supplement, 26-07-26 — feasibility probe VERDICT: VIABLE):**
- `supabase/migrations/0001_embedding_functions.sql` (new file — single-file migration; see Step B0)
- root `package.json` — devDependencies gain `@electric-sql/pglite` and
  `@electric-sql/pglite-pgvector` (ops-time-only local verification tooling; same precedent as the
  root `sharp` devDependency added by `claymorphism-reference-parity` Phase 1 — never bundled into
  `apps/web`'s production build)
- `pnpm-lock.yaml` (changes as a consequence of the devDependency install)
- `ops/pglite-verify-embedding-functions.mjs` (new — local-verification harness script that runs the
  real `0001_embedding_functions.sql` through pglite; see Step C0/C0b)

**Critical safety note:** the working tree has ~245 uncommitted WIP files as of this supplement
cycle. EXECUTE must verify that the root `package.json` and `pnpm-lock.yaml` it touches are not
carrying unrelated user WIP, and must never stage, commit, stash, or revert those files or any
other dirty file outside this phase's blast radius.

---

## Implementation Checklist

### Step A — Design each function's signature from existing call-site expectations

- [ ] A1. `vec_dim` — **not a reimplementation.** pgvector already ships a built-in
      `vector_dims(vector) RETURNS integer`. Author `vec_dim` as a thin SQL wrapper over it:
      `CREATE FUNCTION vec_dim(v vector) RETURNS integer LANGUAGE sql IMMUTABLE AS $$ SELECT
      vector_dims(v); $$;`. Do not hand-roll dimension extraction. Matches the `vector(1536)`
      column type confirmed live per `search-functions.sql`.
- [ ] A2. `get_missing_usage_embedding_items` — **PVL supplement (Gap 1, 25-07-26):** the embedding
      tables `usage_embeddings`/`code_embeddings` are keyed by `(item_id, item_type)` where
      `item_type ∈ {'component', 'demo'}` — confirmed by `apps/web/scripts/generate-embeddings.ts:44-89`,
      which maintains TWO separate existence-check functions for exactly this reason
      (`checkComponentEmbeddingsExist` against `components`, `checkDemoEmbeddingsExist` against
      `demos`). A `demos`-only query silently misses every `components`-sourced gap and fails
      without error — you'd just get half-empty search results. This function MUST be authored as
      a UNION over BOTH source tables: `components` rows with no matching `usage_embeddings` row
      where `item_type = 'component'`, UNIONed with `demos` rows with no matching
      `usage_embeddings` row where `item_type = 'demo'`. Do NOT scope this function to `demos`
      alone. Signature: no args or optional limit/offset; returns a set of `(item_id, item_type)`
      pairs needing embedding. Lock the exact signature during INNOVATE (Step 2 of Phase Loop
      Progress) before this item is implemented in EXECUTE; document the final signature decision
      in the phase report.
- [ ] A3. `insert_embedding` — generic embedding insert (target: `usage_embeddings` per the name
      pairing with `get_missing_usage_embedding_items`). Signature: takes an identifier + item_type
      + a `vector` value, upserts into `usage_embeddings` using `ON CONFLICT (item_id, item_type)
      DO UPDATE`, relying on the `CREATE UNIQUE INDEX IF NOT EXISTS` on `(item_id, item_type)`
      authored in Step B0 (must exist before this function is created, same migration file).
- [ ] A4. `insert_code_embedding` — same pattern, targeting `code_embeddings`. Signature: takes an
      identifier + item_type + a `vector` value, upserts into `code_embeddings` using
      `ON CONFLICT (item_id, item_type) DO UPDATE`, relying on the matching unique index from
      Step B0.
- [ ] A4a. **Evidence note (session-locked, do not re-derive):** the existing edge function's
      `.upsert()` calls in `supabase/functions/generate-embeddings/index.ts` omit an explicit
      `onConflict` target, so PostgREST defaults to the table's PK — NOT `(item_id, item_type)`.
      The "upsert" behavior described elsewhere in this repo's docs may therefore not already be
      deduplicating on that key. This is weaker evidence than earlier drafts assumed; it does not
      block this plan — the new `(item_id, item_type)` unique index + explicit `ON CONFLICT` in
      `insert_embedding`/`insert_code_embedding` is the correct fix regardless.
- [ ] A5. Cross-check each proposed signature against `apps/web/scripts/generate-embeddings.ts` to
      confirm the function shape is compatible with how the script currently calls (or would call)
      embedding generation — this script is the existing manual fallback and AC6 requires the new
      cron path to invoke "the same code path."

### Step B — Author as version-controlled migrations

- [ ] B1. Create `supabase/migrations/` directory if it does not yet exist (coordinate with Phase 6
      — if Phase 6 has already established the baseline migration file by the time this phase
      executes, add these as new migration files on top of that baseline instead of creating a
      competing directory structure).
- [ ] B0. **Author the entire migration as ONE file:** `supabase/migrations/0001_embedding_functions.sql`.
      Sequential numbering (`0001_`, `0002_`, ...), NOT the Supabase-CLI timestamp format — Phase 6
      will later create `0000_baseline.sql` and fold forward without renumbering. Order the
      statements within the file exactly: (1) `CREATE UNIQUE INDEX IF NOT EXISTS` on
      `usage_embeddings(item_id, item_type)`, (2) same for `code_embeddings(item_id, item_type)`,
      (3) `vec_dim`, (4) `get_missing_usage_embedding_items`, (5) `insert_embedding`,
      (6) `insert_code_embedding`, (7) all `REVOKE`/`GRANT` pairs (Step B7). This grouping matches
      the repo's existing `search-functions.sql`/`admin-functions.sql` single-file convention.
      **Fail-closed rationale:** if duplicate `(item_id, item_type)` rows already exist live, the
      unique-index creation fails loudly — this is the desired outcome (surfaces data-quality debt
      instead of silently masking it). Index creation is a metadata operation, not a data mutation,
      and stays behind the phase's existing live-apply approval gate (C5).
- [ ] B2. Write `CREATE FUNCTION vec_dim(...)` migration (ordered after the two unique indexes per B0).
- [ ] B3. Write `CREATE FUNCTION get_missing_usage_embedding_items(...)` migration (UNION over
      `components` + `demos` per A2's locked signature; confirm this ordering — already correct,
      verify and leave — is unchanged).
- [ ] B4. Write `CREATE FUNCTION insert_embedding(...)` migration (`ON CONFLICT (item_id, item_type)
      DO UPDATE`, depends on the Step B0 unique index existing first in the same file).
- [ ] B5. Write `CREATE FUNCTION insert_code_embedding(...)` migration (same `ON CONFLICT` pattern).
- [ ] B6. Ensure each migration follows the existing `supabase/*.sql` file's style/comment
      conventions (Fork C3 baseline consistency).
- [ ] B7. **PVL supplement (Gap 2, 25-07-26) — privilege lockdown, mandatory.** Postgres grants
      `EXECUTE` on new functions to `PUBLIC` by default. Without explicit lockdown, all 4 functions
      — especially `insert_embedding`/`insert_code_embedding` — would be callable by any
      authenticated (or even anon, depending on schema-level grants) user, an embedding/search-
      poisoning vector and exactly the over-permission class Phase 1 exists to fix elsewhere in
      this program. For EACH of the 4 functions, add to the same migration file:
      `REVOKE EXECUTE ON FUNCTION <fn>(...) FROM PUBLIC;` followed by
      `GRANT EXECUTE ON FUNCTION <fn>(...) TO service_role;` (or the narrowest role that will
      actually call them — Phase 3's cron script's connection role, once known). Document the grant
      decision in the phase report alongside the function definitions, consistent with Phase 1's
      per-table grant-hygiene approach (AC13/F5).

### Step C — Verify against a scratch/seeded schema

- [ ] C0. **PVL supplement (26-07-26) — confirmed local-verification path (feasibility probe
      VERDICT: VIABLE).** Primary verification path is `@electric-sql/pglite` +
      `@electric-sql/pglite-pgvector` — a feasibility probe
      (`pglite-local-verification_FEASIBILITY_26-07-26.md`) empirically confirmed all 7 required
      mechanisms work: vector column creation, plpgsql `CREATE FUNCTION`, `RETURNS TABLE`, `UNION`
      across two tables, `vector_dims()`, `CREATE UNIQUE INDEX` + `ON CONFLICT ... DO UPDATE`, and
      `REVOKE`/`GRANT ... TO service_role`. This is no longer an "attempt / confirm first" step —
      proceed directly to setup. Exact details from the probe, do not rediscover:
      - Package is `@electric-sql/pglite-pgvector` (NOT `-pglite-vector`, which does not exist).
      - Its named export is `vector` (NOT `pg_vector`).
      - `GRANT EXECUTE ... TO service_role` fails with `role "service_role" does not exist` until
        you first run `CREATE ROLE service_role;` — this bootstrap line is required in the harness.
      Add `@electric-sql/pglite` and `@electric-sql/pglite-pgvector` as devDependencies to the ROOT
      `package.json` (ops-time-only tooling, never imported by `apps/web` app code — same precedent
      as the root `sharp` devDependency). Author the harness at
      `ops/pglite-verify-embedding-functions.mjs`.
      **Fallback (only if pglite setup itself fails at EXECUTE time, which the probe did not
      predict):** container runtime (`docker`/`podman`/`colima`) or a bare `psql` against a
      disposable instance — none confirmed available on disk as of 25-07-26 (no tracked
      `docker-compose.yml`; `apps/web`'s `supabase` CLI needs a container runtime this environment
      lacks). **Tertiary fallback:** static/parse-only check plus the documented
      `BEGIN … ROLLBACK`-against-live technique (still behind the C5 approval hard-stop) — last
      resort only, since a parse-only check is a vacuous-green for AC5-b's proving test (see the
      Validate Contract test-gate table). If even the pglite primary path fails at EXECUTE time,
      follow the plan's own Known-Gap fallback (see "Blockers That Would Justify BLOCKED Status"
      below and Execute-Agent Instruction E2), document the rationale in the phase report's Test
      Infra Improvement Notes, and create the backlog note described under "Backlog artifacts to
      create during durable capture" in the Validate Contract below.
- [ ] C0b. **Close the probe's 3 known-gaps as explicit EXECUTE sub-checks** (the feasibility probe
      used isomorphic mirrors, not the real migration file):
      (a) run the actual `supabase/migrations/0001_embedding_functions.sql` through pglite
      end-to-end — this is the step that converts "verified locally" from partially-proven to
      proven, since the probe only proved the mechanisms in isolation;
      (b) exercise any pgvector similarity operator/index the migration actually uses (the probe
      only proved column creation + `vector_dims()`, not `<=>` or ivfflat/hnsw index types);
      (c) bootstrap any additional Supabase roles the migration references beyond `service_role`
      (the probe did not exercise `authenticated`/`anon` roles, RLS, or `auth.uid()`).
- [ ] C1. **HARD STOP — no live DDL against production without explicit approval.** Apply these
      migrations against a scratch/local/disposable schema first (local Supabase CLI instance, or
      a disposable Postgres container) — never directly against the live database for initial
      verification.
- [ ] C2. Seed a minimal test row (e.g. one `demos` row and one `components` row lacking an
      embedding) and invoke `get_missing_usage_embedding_items()` — confirm it returns BOTH seeded
      rows (validates the A2 UNION fix).
- [ ] C3. Invoke `insert_embedding()` and `insert_code_embedding()` with a test vector value —
      confirm the row lands in `usage_embeddings`/`code_embeddings` without error.
- [ ] C4. Invoke `vec_dim()` against a known vector — confirm it returns the expected dimension
      (1536, matching the confirmed live vector columns).
- [ ] C5. **HARD STOP — request explicit user approval before applying these migrations to the
      live production database.** Present the exact migration file diff for review.
- [ ] C6. Upon approval, apply against live; re-run the same C2-C4 checks (adjusted for real table
      state) against the live database as a final confirmation.

---

## Exit Gate

```bash
# Local/scratch schema verification (run before requesting live approval)
# psql or supabase CLI invocation of each new function against seeded test data
# Expected: all 4 functions execute without error, return expected shapes

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0, no regression

corepack pnpm --filter web test
# Expected: all tests pass, no regression
```

- All Step A-C checklist items checked (including B7 privilege lockdown and C0 runtime pre-check)
- 4 `CREATE FUNCTION` migrations exist in `supabase/migrations/`, each with an explicit
  REVOKE/GRANT EXECUTE pair
- Each function verified callable without error against a scratch/seeded schema (SPEC AC5) — or,
  if C0 finds no runtime available, a documented Known-Gap per the Blockers section
- Live application only if explicitly approved (Step C5) — otherwise phase exit gate is met by the
  scratch-schema verification alone, live application deferred to Phase 3's needs with a documented
  reason in the phase report
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- No disposable/scratch Postgres/Supabase instance is available for Step C0-C4 verification —
  route to a documented Known Gap with rationale (per `vc-test-coverage-plan` gap resolution
  format), do not skip verification silently. The `BEGIN … ROLLBACK`-against-live fallback
  described at Step C0 remains available but stays behind the existing C5 live-DDL approval
  hard stop — it does not bypass user approval.
- A function's expected signature cannot be determined from any existing reference (script, edge
  function, or app code) with confidence — document the design decision explicitly in the phase
  report as an INNOVATE-level choice, not a blocker, unless genuinely ambiguous enough to need user
  input.
- User does not approve live application (Step C5) — phase is NOT blocked; the scratch-verified
  migrations still satisfy the exit gate; live application is deferred and documented, and Phase 3
  proceeds against the scratch-verified function definitions with a noted dependency on eventual
  live application before the cron can actually run.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: read Phase 1 report; confirm live grant state is settled; test context loaded
- [ ] 2. INNOVATE — innovate-agent: confirm Fork B1 (author fresh) still holds; lock exact function signatures (including A2's UNION shape per Gap 1); Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated (25-07-26, PVL-supplement mode — 3 gaps applied: A2 UNION scope, B7 privilege lockdown, C0 runtime pre-check); Inner Loop Refresh Note not required (PVL-supplement mode, not inner-loop refresh mode)
- [x] 3a. INNER LOOP PLAN-SUPPLEMENT (26-07-26) — plan-agent: 8 edits applied incorporating
      completed RESEARCH+INNOVATE+feasibility-probe findings — vec_dim as thin `vector_dims()`
      wrapper (A1), unique-index + `ON CONFLICT` design for insert functions (A3/A4/A4a), single-file
      migration ordering (B0), confirmed pglite-primary local-verification path (C0/C0b), AC5-b
      test-gate row updated, provider-name + `.upsert()`/`onConflict` evidence notes recorded, and
      Blast Radius + registry updated with 4 new writable paths. `## Inner Loop Refresh Note` written
      below — this IS inner-loop refresh mode (not PVL-supplement), so the note is required.
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md`
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first.

---

## Touchpoints

- `supabase/migrations/*.sql` (new — 4 function migrations)
- Read-only: `apps/web/scripts/generate-embeddings.ts`, `supabase/functions/generate-embeddings`,
  `supabase/functions/ai-search-oai`

---

## Public Contracts

- 4 new `CREATE FUNCTION` definitions become part of the database's public RPC surface — signatures
  documented in the migration files and cross-referenced in Phase 6's `types.ts` regeneration.
- No existing function or table contract is altered.
- Per Gap 2 (B7): none of the 4 functions are `PUBLIC`-executable — each carries an explicit
  `REVOKE EXECUTE ... FROM PUBLIC` + `GRANT EXECUTE ... TO service_role` (or narrowest caller role)
  pair.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| Migration file diff shows 4 functions created | Fully-Automated | AC5 |
| Local invocation of each function against a scratch/seeded row (incl. both `components` + `demos` seed rows) | Fully-Automated | AC5 |
| Cross-check against `generate-embeddings.ts` code path compatibility | Hybrid | AC6 (predecessor) |
| Each function's EXECUTE grant is locked to service_role (not PUBLIC) | Fully-Automated | Security surface (Gap 2) |
| Live application + re-verification (if approved) | Agent-Probe | AC5, AC13-adjacent |

```bash
# Scratch-schema function invocation, per function — exact commands recorded by execute-agent
# once the local/disposable instance is chosen (local Supabase CLI vs container)
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-02-embedding-functions_PLAN_25-07-26.md`
- Last completed step: PLAN-SUPPLEMENT (inner loop, 26-07-26) — 8 edits applied incorporating
  RESEARCH+INNOVATE+feasibility-probe findings (see `## Inner Loop Refresh Note` above for the full
  summary)
- Validate-contract status: 25-07-26 outer-pvl CONDITIONAL — SUPERSEDED PENDING: the
  `## Inner Loop Refresh Note` dated 26-07-26 requires re-validation from V1 before EXECUTE
- Next step: PVL re-run from V1 (orchestrator re-spawns vc-validate-agent for this phase plan) —
  NOT execute. The re-run must confirm: the pglite-primary verification path, the single-file
  migration ordering (B0), the unique-index/ON CONFLICT design (A3/A4), and the updated Blast
  Radius/registry entries, before the gate can move from CONDITIONAL to PASS.

---

## Test Infra Improvement Notes

- No local Postgres/pgvector scratch-verification harness (Docker, Podman, Colima, `psql`,
  `testcontainers`, `pg-mem`/`pglite`, or a tracked `docker-compose.yml`) was found in this
  environment during PVL (25-07-26). `apps/web/package.json` ships the `supabase` CLI
  (`2.22.6`) as a devDependency and `supabase/config.toml` exists, but `supabase start` requires
  a container runtime that this environment does not have. This is a repo-level test-infra gap
  worth closing independently of this phase (Phase 6 will hit the identical constraint). See the
  Validate Contract's Known Gaps / Test Coverage Plan below for the immediate resolution path, and
  Step C0 above for the mandatory EXECUTE-time re-check + documented fallback (`BEGIN … ROLLBACK`
  against live, still behind the C5 approval hard stop).
- **Provider-name correction (26-07-26):** `apps/web/lib/ai-config.ts:19`'s `openaiConfig` is the
  OpenAI SDK pointed at Gemini's OpenAI-compatible endpoint (`gemini-embedding-001`, 1536 dims) —
  the "OpenAI" naming is misleading; the actual embedding provider is Gemini. Relevant to any
  future work that assumes real OpenAI usage from this config.
- **`.upsert()` / `onConflict` evidence note (26-07-26):** the existing edge function's `.upsert()`
  calls in `supabase/functions/generate-embeddings/index.ts` omit an explicit `onConflict` target,
  so PostgREST defaults to the table's PK — NOT `(item_id, item_type)`. The pre-existing "upsert"
  behavior may therefore not already be deduplicating on that key. This is weaker evidence than
  earlier drafts assumed; it does not block this plan and does not change the Step B0/A3/A4 design
  (the new unique index + explicit `ON CONFLICT` is correct regardless of what the edge function
  currently does).


---

## Inner Loop Refresh Note

Date: 2026-07-26 (strictly newer than the existing validate-contract's `date: 2026-07-25`) — this
date is the mechanical Step 4b trigger forcing PVL to re-run from V1 before EXECUTE.

Applied by vc-plan-agent, inner-loop RESEARCH+INNOVATE+feasibility-probe supplement (Step 3 of the
7-step inner loop). Feasibility VERDICT artifact:
`process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/pglite-local-verification_FEASIBILITY_26-07-26.md`
(VERDICT: VIABLE).

Summary of changes: (1) Step A1 rewritten — `vec_dim` is a thin wrapper over pgvector's built-in
`vector_dims()`, not a hand-rolled implementation; (2) Steps A3/A4 updated to specify `ON CONFLICT
(item_id, item_type) DO UPDATE` against a new unique index, plus new A4a evidence note on the edge
function's `.upsert()`/`onConflict` gap; (3) new Step B0 consolidates the migration into ONE
sequentially-numbered file (`0001_embedding_functions.sql`) with an explicit statement order
(indexes → functions → grants); (4) Step C0 rewritten from "attempt-first" framing to a confirmed
pglite-primary local-verification path (container runtime demoted to fallback, static-only to
tertiary), citing exact package/export/bootstrap details from the probe; (5) new Step C0b closes
the probe's 3 known-gaps (real migration file, similarity operators/index types, additional
Supabase roles) as explicit EXECUTE sub-checks; (6) Verification Evidence / validate-contract AC5-b
row updated to reflect the confirmed pglite path; (7) provider-name correction (Gemini, not real
OpenAI) and `.upsert()`/`onConflict` evidence note recorded in Test Infra Improvement Notes;
(8) Blast Radius section and `phase-blast-radius-registry.md` updated with 4 new writable paths
(new migration file, root `package.json`, `pnpm-lock.yaml`, new `ops/` harness script).

This refresh does not change the Gate verdict text below (still CONDITIONAL from the prior outer-pvl
pass) — PVL must re-run from V1 to confirm these changes and determine whether the gate can move to
PASS.

---

## Validate Contract

Status: CONDITIONAL
Date: 25-07-26
date: 2026-07-25
generated-by: outer-pvl

Parallel strategy: sequential
Rationale: Nominal signal score is 4/7 (S2 schema/API surface, S4 phase-program classification,
S5 explicit user-requested depth, S6 high-risk class present) — normally a Workflow/Agent-team
tier. Overridden to sequential for this phase's own EXECUTE fan-out: Steps A → B → C are a single
tightly-sequential SQL-authoring chain (design → author → verify, each depending on the prior) with
no independent parallelizable directions inside the phase. The 4/7 score reflects the *program's*
overall risk classification (drives the Hybrid-minimum test tier and mandatory validate-contract
below), not this phase's internal shape. One `vc-execute-agent` (opus, execution leg) runs Steps
A→B→C in order. This VALIDATE pass itself was run as a single-agent sequential synthesis (Layer 1 +
Layer 2 combined) because no Agent/Task subagent-spawn tool was available in this session — noted as
a strategy deviation from the normally-recommended parallel Layer 1/Layer 2 fan-out.

Test gates (C3 5-column table — ADDITIVE; existing consumers still parse the legacy line form below it):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC5-a | 4 CREATE FUNCTION migrations exist (vec_dim, get_missing_usage_embedding_items, insert_embedding, insert_code_embedding) | Fully-Automated | `grep -c "CREATE FUNCTION" supabase/migrations/*.sql` returns 4 (one per function, or a grouped file naming all 4) | B |
| AC5-b | Each function invokes without error against a seeded scratch/disposable schema | Hybrid | PRIMARY (confirmed VIABLE via feasibility probe, 26-07-26): `node ops/pglite-verify-embedding-functions.mjs` — runs the real `0001_embedding_functions.sql` through `@electric-sql/pglite` + `@electric-sql/pglite-pgvector`, seeds 1 `demos` row + 1 `components` row lacking embeddings, invokes each function, exits 0 with expected shapes. FALLBACK: container runtime (Docker/Podman/Colima) or disposable Postgres. TERTIARY: static/parse-only + `BEGIN … ROLLBACK`-against-live (behind C5 approval). A parse-only check alone is a vacuous green — it does not prove AC5-b. | A (pglite path proven feasible; EXECUTE runs C0/C0b to close the remaining real-file/operator/role gaps) |
| AC5-c | `vec_dim()` returns 1536 for a 1536-dim test vector, matching the tracked-SQL dimension lock | Fully-Automated | `psql -c "SELECT vec_dim(array_fill(0, ARRAY[1536])::vector);"` returns `1536` — corroborated by `supabase/search-functions.sql:25-26` (`ALTER TABLE ... TYPE vector(1536)`, comment: "gemini-embedding-001 @ 1536 dims") | A |
| AC6-predecessor | `insert_embedding`/`insert_code_embedding` signatures are compatible with the existing embedding-write shape | Hybrid | Desk cross-check: confirm `(item_id bigint, item_type text, embedding vector(1536), metadata jsonb)` argument shape matches the `.upsert()` calls in `supabase/functions/generate-embeddings/index.ts:156-168,179-191,276-291,303-318` | B — resolved via plan Step A2 UNION fix + INNOVATE (Step 2) signature-locking, see Execute-Agent Instruction E1 below |
| Security-1 | Each of the 4 functions has EXECUTE revoked from PUBLIC and granted only to service_role (or the narrowest caller role) | Fully-Automated | `psql -c "\df+ <fn>"` (or `information_schema.routine_privileges`) shows no PUBLIC EXECUTE grant for any of the 4 functions | B — fixed by plan Step B7, see Execute-Agent Instruction E3 below |
| AC5-d (live) | Live application + re-verification, if approved | Agent-Probe | Present exact migration diff for explicit per-statement user approval (Step C5 hard stop); on approval, apply live and re-run AC5-a/b/c/Security-1 against production | C — deferred to Phase 3's needs if not approved this phase, per the plan's own Blockers section |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies (Fully-Automated / Hybrid / Agent-Probe). Known-Gap is NEVER a `strategy:` value — it is a named residual row carried via gap-resolution D, never a strategy that proves a behavior.

Legacy line form (retained so existing validate-contract consumers still parse):
- `supabase/migrations/*.sql`: Fully-automated: `grep -c "CREATE FUNCTION" supabase/migrations/*.sql` == 4 | Hybrid: local/disposable-schema invocation of all 4 functions, precondition: container runtime or equivalent available | Agent-probe: live application + re-verification after Step C5 approval | Known-gap: none accepted preemptively — EXECUTE must attempt the scratch-schema path first (see Known Gaps below)
- `apps/web` regression baseline: Fully-automated: `corepack pnpm --filter web exec tsc --noEmit` exits 0 | Fully-automated: `corepack pnpm --filter web test` — all 17 existing test files pass, no regression
- Privilege lockdown: Fully-automated: `\df+` / `information_schema.routine_privileges` shows no PUBLIC EXECUTE grant on any of the 4 functions

Failing stub (Fully-Automated rows only):

AC5-a:
```
-- TDD stub (SQL-level, not vitest): run after Step B, before Step C
-- test: "should have exactly 4 CREATE FUNCTION migrations for vec_dim,
--        get_missing_usage_embedding_items, insert_embedding, insert_code_embedding"
-- NOT IMPLEMENTED until supabase/migrations/*.sql contains all 4
```

AC5-c:
```
-- TDD stub (SQL-level, not vitest): run after Step B2 (vec_dim authored)
-- test: "vec_dim() should return 1536 for a 1536-dim test vector"
-- NOT IMPLEMENTED until vec_dim() migration exists and is applied to a scratch schema
```

Security-1:
```
-- TDD stub (SQL-level, not vitest): run after Step B7 (privilege lockdown authored)
-- test: "none of the 4 new functions should be EXECUTE-able by PUBLIC"
-- NOT IMPLEMENTED until each migration's REVOKE/GRANT EXECUTE pair exists and is applied
```

Dimension findings:
- Infra fit: PASS — no container/infra/worker-lifecycle surface touched; `supabase/migrations/` is a
  new directory with no existing consumer to conflict with; Phase 6 coordination clause (Step B1) is
  well-formed and creates no ordering conflict (Phase 2 runs before Phase 6 in the program's
  sequential ordering, so Phase 2 will create the directory Phase 6 later folds a baseline into).
- Test coverage: CONCERN — RESOLVED via Step C0 (Gap 3 supplement, 25-07-26). The plan's Step C
  verification path (local Supabase CLI instance or disposable Postgres container) could not be
  confirmed mechanically feasible in this validate session: no Docker, Podman, Colima, `psql`,
  `testcontainers`/`pg-mem`/`pglite`, or tracked `docker-compose.yml` was found anywhere in this
  repo or environment (all-context.md's "Local Qdrant: docker compose up -d qdrant" claim is itself
  unconfirmed on disk — no `docker-compose.yml` is tracked in git). `apps/web` does ship the
  `supabase` CLI as a devDependency with a `supabase/config.toml` already present, but
  `supabase start` needs a container runtime this environment doesn't have. The plan now has an
  explicit Step C0 pre-check requiring EXECUTE to independently re-verify runtime availability
  before assuming this constraint holds, with a documented `BEGIN … ROLLBACK`-against-live fallback
  (still behind the existing C5 approval hard stop) and a Known-Gap route if no runtime is found.
  See Execute-Agent Instruction E2 below.
- Breaking changes: PASS — all 4 functions are net-new; Public Contracts section correctly states no
  existing function/table contract is altered; confirmed via `search-functions.sql`/`rpc-functions.sql`
  that none of the 4 proposed names collide with any of the 33 confirmed-live functions.
- Security surface: CONCERN — RESOLVED via Step B7 (Gap 2 supplement, 25-07-26). Postgres grants
  `EXECUTE` on new functions to `PUBLIC` by default unless explicitly revoked; without an explicit
  `REVOKE EXECUTE ... FROM PUBLIC` + `GRANT EXECUTE ... TO service_role` pair per function,
  `insert_embedding`/`insert_code_embedding` could become callable by `authenticated` (or even
  `anon`, depending on schema-level grants) — letting any signed-in user write arbitrary vectors
  into the search index (embedding/search poisoning), which is exactly the class of grant-hygiene
  bug Phase 1 exists to fix elsewhere in this program. The plan's Step B now includes an explicit
  B7 checklist item requiring this lockdown for all 4 functions. See Execute-Agent Instruction E3
  below.
- Section A — Design signatures: CONCERN — RESOLVED via Step A2 rewrite (Gap 1 supplement,
  25-07-26). Mechanical feasibility of authoring is fine (no edit-target collisions; this is
  greenfield SQL), but a genuine plan gap was found: Step A2's original
  `get_missing_usage_embedding_items` description ("rows in `demos` (or the relevant source table)
  lacking a corresponding `usage_embeddings` row") under-described the real schema. Confirmed via
  `apps/web/scripts/generate-embeddings.ts:44-89`: `usage_embeddings`/`code_embeddings` are keyed by
  `(item_id, item_type)` where `item_type` is `'component' | 'demo'` — the script has TWO separate
  existence-check functions (`checkComponentEmbeddingsExist` against the `components` table AND
  `checkDemoEmbeddingsExist` against the `demos` table), not one. A function that only scans `demos`
  would silently miss all `components`-sourced embedding gaps. The plan's Step A2 now explicitly
  requires a UNION over both `components` and `demos`. This finding is still routed as an
  instruction into Step 2 (INNOVATE) for final signature-locking rather than treated as fully
  closed by the plan text alone — see Execute-Agent Instruction E1 below. Highest-risk edit in this
  section: authoring `get_missing_usage_embedding_items` against the wrong table scope — mitigate
  by resolving E1 before Step A2/A3 are implemented, not after.
- Section B — Author as migrations: CONCERN — RESOLVED via Step B7 (same fix as Security surface
  finding above); otherwise PASS (B1 Phase-6-coordination clause is sound, B6's convention-following
  is well-grounded against `supabase/rpc-functions.sql`'s existing header/style and its explicit
  note that "signatures must not drift from types/supabase.ts (PostgREST matches args by name)" —
  worth carrying forward since Phase 6 will regenerate `types.ts` from these same functions).
- Section C — Verify against scratch schema: CONCERN — RESOLVED via Step C0 (same fix as Test
  coverage finding above); the hard-stop structure (C1, C5) is correctly designed and matches the
  program's hard safety constraints exactly — no fix needed there; C0 is additive, not a
  replacement for C1/C5.

Open gaps:
- Scratch/disposable Postgres+pgvector verification environment not confirmed available in the
  current sandbox (Docker/Podman/Colima/psql/testcontainers/pglite all absent; no tracked
  `docker-compose.yml`). EXECUTE must independently re-check its own environment at Step C0 (was
  C1) before assuming this is blocked — the constraint may not hold in EXECUTE's actual runtime. If
  truly unavailable there too: route to the plan's own documented Known-Gap fallback (Blockers
  section) with the same rationale, not a silent skip — the `BEGIN … ROLLBACK`-against-live
  technique is one documented option, still behind the C5 approval hard stop. Recorded here rather
  than accepted as known-gap now because it is untested at EXECUTE time, not confirmed-impossible.

What this coverage does NOT prove:
- AC5-a (migration file count) proves files exist and are named correctly; it does NOT prove the SQL
  inside them is semantically correct — that is AC5-b's job.
- AC5-b (scratch invocation) proves the 4 functions execute without error against a small seeded
  fixture; it does NOT prove correctness at real data volume, under concurrent access, or against the
  live schema's actual RLS/grant state (that requires AC5-d, live application).
- AC5-c (vec_dim dimension check) proves the utility function itself is correct; it does NOT prove any
  caller actually invokes `vec_dim()` before an insert — no caller exists until Phase 3.
- AC6-predecessor (signature cross-check) proves the new RPC functions' argument shape COULD replace
  the inline `.upsert()` calls the edge function currently performs; it does NOT prove Phase 3's cron
  script actually wires them together correctly — that is Phase 3's own exit gate.
- Security-1 (grant lockdown) proves EXECUTE is not PUBLIC-grantable; it does NOT prove the
  service_role (or narrower) grant target is itself correctly scoped to the eventual Phase 3 caller
  — that is confirmed only once Phase 3's actual calling role is known.
- AC5-d (live application) is Agent-Probe and conditional on explicit user approval this phase; if not
  approved, none of AC5-a/b/c/Security-1's local proof extends to the live database until Phase 3 or a
  later approval round applies it.
- The regression baseline (`tsc --noEmit`, `pnpm test`) proves no existing `apps/web` behavior
  regressed; it does NOT exercise any of the 4 new SQL functions at all (they have no JS/TS caller in
  this phase's scope).

Gate: CONDITIONAL (2 unresolved CONCERN root-causes from the original PVL pass — table-scope
under-specification and missing privilege lockdown — both now fixed directly in the plan checklist
via this 25-07-26 PVL-supplement pass, not merely deferred to execute-agent instructions; 1
environment risk carried as an open gap pending EXECUTE's own re-check at Step C0; 0 FAILs). Gate
verdict is unchanged by this supplement pass — PVL must re-run from V1 to confirm the 3 gap fixes
land correctly before the gate can move to PASS.
Accepted by: session (autonomous outer-PVL pass, no interactive user present this session) — accepted
concerns: (1) `get_missing_usage_embedding_items` table-scope gap — resolved via plan Step A2 rewrite
+ Execute-Agent Instruction E1, routed through the already-scheduled INNOVATE step for final
signature lock; (2) missing EXECUTE-privilege lockdown — resolved via plan Step B7 + Execute-Agent
Instruction E3; (3) scratch-environment availability — carried as an Open Gap via plan Step C0, not
accepted as a preemptive known-gap, pending EXECUTE's independent re-check.

### Execute-Agent Instructions

- E1 (triggers at Step A2/INNOVATE Step 2): `get_missing_usage_embedding_items` must UNION across
  BOTH source tables — `components` (filtered to rows with no matching `usage_embeddings` row where
  `item_type = 'component'`) AND `demos` (filtered to rows with no matching `usage_embeddings` row
  where `item_type = 'demo'`) — mirroring `checkComponentEmbeddingsExist`/`checkDemoEmbeddingsExist`
  in `apps/web/scripts/generate-embeddings.ts:44-89`. Do NOT scope the function to `demos` alone. Lock
  this during INNOVATE (Step 2) before Step A2/A3 are written in EXECUTE; document the final signature
  decision in the phase report. (Plan Step A2 has been rewritten to state this requirement directly.)
- E2 (triggers at Step C0, was C1): before attempting local/disposable-schema verification, check for
  a container runtime (`docker`, `podman`, or `colima`) or `psql` in the EXECUTE environment. If none is
  found, do NOT silently skip — apply the plan's own Blockers-section Known-Gap route (document
  rationale, do not fabricate a "verified" result), consider the documented `BEGIN … ROLLBACK`
  against-live fallback (still gated by the C5 approval hard stop), and note the gap in the phase
  report's Test Infra Improvement Notes, since the same constraint will recur for Phase 6.
- E3 (triggers at Step B7, before Step C): for each of the 4 new functions, explicitly
  `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC;` and `GRANT EXECUTE ON FUNCTION ... TO service_role;`
  (or the narrowest role that will actually call them — Phase 3's cron script's connection role, once
  known) as part of the same migration file. Do not leave these at the Postgres default
  (PUBLIC-executable). Document the grant decision in the phase report alongside the function
  definitions, consistent with Phase 1's per-table grant-hygiene approach (AC13/F5). (Plan Step B7
  has been added to state this requirement directly.)
- E4 (informational, no action required this phase): `supabase/rpc-functions.sql`'s header notes
  "Signatures must not drift from types/supabase.ts (PostgREST matches args by name)" — keep this in
  mind since Phase 6 regenerates `types.ts` from these same 4 functions; named-argument consistency
  now avoids Phase 6 rework.

### Backlog artifacts to create during durable capture

- `process/features/supabase-interconnect/backlog/scratch-pg-verification-env_NOTE_25-07-26.md` —
  if Execute-Agent Instruction E2 confirms no container runtime is available in the actual EXECUTE
  environment either, create this note documenting the repo-wide gap (affects Phase 2 now, Phase 6
  later) and the viable remediation options observed during PVL: (a) a tracked
  `docker-compose.yml` for local Postgres+pgvector (mirroring the documented-but-unconfirmed Qdrant
  compose pattern), (b) `supabase start` once a container runtime is installed on the executing
  machine, or (c) the `BEGIN … ROLLBACK`-against-live fallback technique documented at plan Step C0
  (still behind the C5 approval hard stop).

### Known gaps on record

- Scratch/disposable Postgres+pgvector verification environment: unconfirmed in this validate
  session's sandbox (no Docker/Podman/Colima/psql/testcontainers/pglite, no tracked
  `docker-compose.yml`). Not accepted as a terminal known-gap — carried as an Open Gap pending
  EXECUTE's independent environment check (Execute-Agent Instruction E2, plan Step C0). If confirmed
  absent there too, the plan's own Blockers section governs the fallback (documented Known-Gap
  route, not a silent skip), and a backlog note is created per above.

### Structural validator note

`node .claude/skills/vc-generate-plan/scripts/validate-plan-artifact.mjs` was run against this plan
file (mandatory V1 step) and reported 6 failures + 4 warnings (missing Date/Status/Complexity
metadata, missing overview section, missing "Phase Completion Rules", missing "Acceptance Criteria").
These are false positives for this artifact's shape: the identical 6 failures appear on
`phase-01-grant-repair_PLAN_25-07-26.md` (same generator, same phase-program shape), and the
phase-program-specific validator —
`node .claude/skills/vc-generate-phase-program/scripts/validate-phase-stub.mjs` — passes this file
with 0 failures / 0 warnings. `validate-plan-artifact.mjs` checks for standalone SIMPLE/COMPLEX plan
sections this phase-stub shape intentionally uses different section names for (e.g. "Phase status:"
inline field instead of "Status:", SPEC-linked "Verification Evidence" table instead of a standalone
"Acceptance Criteria" section). No plan-quality issue found; no action required.

### Accepted by

session (autonomous outer-PVL pass) — see Gate line above for the full accepted-concerns list.

### PVL-Supplement Log (25-07-26)

Applied by vc-plan-agent in PVL-supplement mode (SUPPLEMENT REQUEST from outer PVL, `Gate:
CONDITIONAL`, 0 FAILs). All 3 gaps were in-scope (no new files outside blast-radius, no new public
API surface beyond the already-planned 4 functions) — no bright-line trip.

- Gap 1 (implementation-checklist, CONCERN): Step A2 rewritten in place to require the
  `components`+`demos` UNION scope, citing `apps/web/scripts/generate-embeddings.ts:44-89`. Step A3/A4
  and B3 updated to reflect the `(item_id, item_type)` keying. Step C2 updated to seed both a
  `demos` row and a `components` row.
- Gap 2 (implementation-checklist, CONCERN — security): new Step B7 added requiring
  `REVOKE EXECUTE ... FROM PUBLIC` + `GRANT EXECUTE ... TO service_role` for each of the 4 functions.
  Public Contracts, Verification Evidence, and the validate-contract's test-gate table were all
  updated with a corresponding `Security-1` row/stub.
- Gap 3 (implementation-checklist, CONCERN): new Step C0 added as a mandatory pre-check for a
  container/Postgres runtime before C1-C4 begin, falling back to the plan's existing Known-Gap route
  (Blockers section) if absent, with the `BEGIN … ROLLBACK`-against-live technique documented as one
  fallback verification option (still behind the C5 approval hard stop).

No section outside `implementation-checklist` (plus its directly dependent Public Contracts /
Verification Evidence / Validate Contract mirrors) required editing. Validate-contract Gate verdict
text is unchanged (still CONDITIONAL) — PVL must re-run from V1 to confirm the fixes and potentially
move to PASS.
