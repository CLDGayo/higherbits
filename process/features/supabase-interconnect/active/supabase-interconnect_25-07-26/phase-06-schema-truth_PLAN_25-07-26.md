---
name: plan:supabase-interconnect-phase-06-schema-truth
description: "Supabase Interconnect — Phase 06: Schema source of truth (types.ts regen + migrations baseline + doc correction)"
date: 25-07-26
metadata:
  node_type: memory
  type: plan
  feature: supabase-interconnect
  phase: phase-06
---

# Phase 06 — Schema Source of Truth

**Program:** supabase-interconnect
**Umbrella plan:** process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/supabase-interconnect-umbrella_PLAN_25-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-06-schema-truth_REPORT_{dd-mm-yy}.md (flat in the program task folder)

---

## Purpose

Close the program's root cause: `apps/web/types/supabase.ts` claims a database roughly twice the
size of the one that exists (70 functions/11 views vs the live 33/4). Baseline the live schema as
`supabase/migrations/0000_baseline.sql` (Fork C3), fold the existing loose `supabase/*.sql` files
in (including Phase 1's grant extension and Phase 2's 4 embedding functions), regenerate
`types.ts` from live introspection, and delete phantom entries — including the 5 hunt-scoring
functions this program never implements (see umbrella `## Out-of-Scope Corrections`). This phase
runs LAST because it must baseline against Phase 2's new functions and is the phase best
positioned to absorb any tsc fallout from removing phantom types.

**[PVL SUPPLEMENT, 25-07-26 — probable root cause identified.]** The mechanical root cause of the
whole program's headline drift finding is very likely a **mis-pointed types-generation script**,
not (or not only) organic schema drift. `apps/web/package.json`'s `"types"` script has always
targeted Supabase project ref `vucvdpamtrjkzmubwlts`. The database this app actually connects to at
runtime is a DIFFERENT project, ref `ewktoowpuemgbaaxxbdq` (confirmed live via the orchestrator's
own read-only introspection this session — 33 functions / 4 views / 41 tables, matching this plan's
Step B1 counts exactly). A third identifier, `"21st"`, appears in `supabase/config.toml:3`. History
in `process/features/21st-promotion/active/21st-promotion_08-07-26/harness/review-decision.json:9`
records that on 2026-07-09 `vucvdpamtrjkzmubwlts` was probed and returned `P4001 — introspected
database empty`; the live project later became (or always was, separately) `ewktoowpuemgbaaxxbdq`,
where all of `supabase/*.sql` was actually applied. **The types-generation script was never
repointed to the project that was actually live.** Anyone running `pnpm --filter web types` was
regenerating from the wrong (at one point empty) project — this plausibly explains why
`types.ts` drifted to describe a schema that doesn't match the live one. This correction
supersedes the original VALIDATE-cycle note under Step B2 below, which incorrectly treated the
existing script as already correct and recommended it as a shortcut.

---

## Entry Gate

- Phases 1-5 exit gates all passed (schema baseline must reflect Phase 1's grant extension and
  Phase 2's function additions; Phase 6 running last minimizes churn on a moving target)

---

## Blast Radius

- `apps/web/types/supabase.ts` (full regeneration)
- `supabase/migrations/0000_baseline.sql` (new — or equivalent baseline file/directory structure,
  reconciled with whatever `supabase/migrations/` state Phase 2 already established)
- `supabase/*.sql` (existing loose files — folded into the migrations directory, not deleted
  without a clear superseding record)
- `process/context/all-context.md` (≥3 stale claims corrected: `local_users` dual-store narrative,
  "Lemon Squeezy is dead" claim, Phase-19 themes surface; **[PVL SUPPLEMENT, 25-07-26]** plus the
  new project-ref root-cause finding, added as an E-series correction — see Step E below)
- `apps/web/package.json` (the `"types"` script's `--project-id` value — **[PVL SUPPLEMENT,
  25-07-26]** this is now explicitly in scope; it was implicitly out of scope before this
  supplement because the prior VALIDATE note assumed the script was already correctly pointed)
- `supabase/config.toml` (read for reconciliation only — **[PVL SUPPLEMENT, 25-07-26]** its
  `project_id = "21st"` value must be reconciled against the other two identifiers, not
  necessarily changed; see Step A-0b below)
- Any file elsewhere in `apps/web` that imports a phantom type from `types.ts` and now fails to
  compile — scoped fix only, not a rewrite (tsc-fallout absorption is this phase's explicit job)

---

## Implementation Checklist

### Step A — Baseline the live schema (Fork C3)

- [ ] A0. **[VALIDATE-added pre-check, 25-07-26]** Confirm tooling before starting: run `which
      supabase` and `which pg_dump`. Confirmed at VALIDATE time (25-07-26): **neither binary is
      installed in the standard dev shell** (`brew` IS available on this machine). If both are
      still absent when this step actually executes: install via
      `brew install supabase/tap/supabase` (preferred — provides both `db pull` and `gen types`
      needed by Steps A and B) or, for `pg_dump` only, `brew install libpq` (add to PATH). If
      install is blocked, or the CLI cannot authenticate against the live project
      (`supabase login` / `SUPABASE_ACCESS_TOKEN`), STOP and escalate per "Blockers That Would
      Justify BLOCKED Status" below — do not fabricate a baseline from stale assumptions.
- [ ] A-0b. **[PVL SUPPLEMENT, 25-07-26 — NEW, runs before A1.]** Verify the live Supabase project
      ref directly from runtime config — do NOT trust `package.json`, `config.toml`, or any prior
      claim in this plan or `all-context.md` as authoritative. Read `apps/web/.env` (or the local
      `.env.local` override) and derive the project ref from `NEXT_PUBLIC_SUPABASE_URL` (the
      subdomain of the `https://{ref}.supabase.co` URL) and/or `DIRECT_DATABASE_URL` (the host
      segment of the Postgres connection string). **Privacy/safety constraints:** reading either
      env file requires the standing privacy-hook approval already governing this program's
      env-file access; the actual URL/connection-string VALUES must never be printed to chat,
      logs, or the phase report — extract and record ONLY the derived project ref (a short
      alphanumeric identifier, not a secret) in the phase report. Do not read or print
      `SUPABASE_SERVICE_ROLE_KEY` or any other secret value during this step.
      Once the live ref is derived, reconcile it against all three identifiers currently present
      on disk in a small table (recorded in the phase report):
      | Source | Value found | Matches live ref? |
      |---|---|---|
      | `apps/web/package.json:7` `types` script `--project-id` | `vucvdpamtrjkzmubwlts` | expected: NO |
      | `supabase/config.toml:3` `project_id` | `"21st"` | expected: N/A (local dev alias, not a hosted ref — confirm this is intentional, not another drift) |
      | Live runtime (env-derived) | (derive at execute time) | — |
      If the live ref differs from `vucvdpamtrjkzmubwlts` (expected, per the Purpose section's
      root-cause finding): this CONFIRMS the root cause. Proceed to A-0c.
- [ ] A-0c. **[PVL SUPPLEMENT, 25-07-26 — NEW.]** Repoint `apps/web/package.json`'s `"types"`
      script's `--project-id` value to the verified live ref from A-0b. This is a required fix,
      not optional — Step B2 below depends on this being corrected first. Do not run `pnpm
      --filter web types` against the old, unverified project-id under any circumstances; it would
      re-introduce the exact bug this phase exists to eliminate. `supabase/config.toml`'s
      `project_id = "21st"` may remain unchanged if A-0b confirms it is a local-dev CLI alias (not
      a project ref) — otherwise document the discrepancy and treat it as informational, not a
      quality gate, since `config.toml` is not consumed by the types-generation path itself.
- [ ] A1. Check whether the Supabase CLI is authenticated and `supabase db pull` is viable
      (UNVERIFIED per INNOVATE — this is the Phase 6 pre-check called out explicitly), **using the
      A-0b-verified live project ref, never the stale `vucvdpamtrjkzmubwlts` value**. If yes, use
      it to generate the baseline. If no, fall back to `pg_dump --schema-only` against the live
      database (read-only, no live DDL required for this step).
- [ ] A2. Write the result as `supabase/migrations/0000_baseline.sql` (or the CLI's native output
      structure if `supabase db pull` is used and produces its own directory convention — follow
      the tool's convention rather than forcing a single-file baseline if that fights the tool).
- [ ] A3. Fold in Phase 1's grant-extension SQL and Phase 2's 4 embedding-function migrations as
      subsequent migration files (or confirm they're already correctly ordered if Phase 2 already
      wrote to `supabase/migrations/`).
- [ ] A4. Fold in any other existing loose `supabase/*.sql` file that represents a real, currently-
      applied piece of schema — cross-reference against the live introspection to confirm each
      folded-in file actually matches live reality (don't blindly trust a stale loose file).

### Step B — Regenerate `types.ts` from live introspection

- [ ] B1. Run the live introspection (`pg_proc`, `pg_class`, `information_schema`) confirming the
      current counts: 33 RPC functions, 4 views (`mv_component_analytics`,
      `component_dependencies_graph_view_v3`, `components_with_username`, `demo_hunt_leaderboard`),
      41 tables including `rate_limits` and `_prisma_migrations`. **[PVL SUPPLEMENT, 25-07-26]**
      Run this against the A-0b-verified live project — this counts as the confirmation that the
      corrected project-id is actually the source of these counts, closing the loop on the root
      cause.
- [ ] B2. **[PVL SUPPLEMENT, 25-07-26 — SUPERSEDES the prior VALIDATE note below.]** Regenerate
      `apps/web/types/supabase.ts` using `corepack pnpm --filter web types` **only after Step A-0c
      has repointed the script's `--project-id` to the verified live ref**. Treat the ORIGINAL,
      unmodified script as poisoned — it must never be run as-is. If A-0c has not yet completed
      when this step is reached, STOP and complete A-0b/A-0c first; do not hand-roll an equivalent
      `supabase gen types` command as a workaround that skips the repoint (that would silently
      reproduce the same bug via a different code path).
      ~~[SUPERSEDED VALIDATE note, 25-07-26] A command is already wired for this exact job —
      `apps/web/package.json`'s `"types"` script (`supabase gen types --lang=typescript
      --project-id 'vucvdpamtrjkzmubwlts' --schema public > ./types/supabase.ts`) targets the
      correct live project ref. Prefer `corepack pnpm --filter web types` over hand-rolling an
      equivalent command; it depends on the same CLI auth resolved in Step A0.~~ **This note was
      incorrect — see the Purpose section's root-cause finding and A-0b/A-0c above.**
- [ ] B3. Explicitly confirm the following phantom entries are removed: `component_stats`,
      `component_hunt_current_round`, `referral_analytics`, `monthly_referral_analytics`,
      `mv_detailed_component_analytics`, `component_dependencies_graph_view`/`_v2`, and the ~37
      phantom functions — **including the 5 hunt-scoring functions this program does not implement**
      (`update_all_hunt_scores`, `process_next_round`, `process_single_round`,
      `update_single_demo_score`, `update_hunt_demos_metrics`) — cross-reference against
      `process/features/supabase-interconnect/backlog/hunt-scoring-engine_NOTE_25-07-26.md`.
- [ ] B4. Confirm `rate_limits` and `_prisma_migrations` are now present in the regenerated file
      (previously absent despite being live).
- [ ] B5. **[PVL SUPPLEMENT, 25-07-26 — NEW exit guard, mirrors Exit Gate change below.]** Before
      treating B2-B4 as complete, assert the regenerated `types.ts` against the live introspection
      counts from B1 (33 functions / 4 views / 41 tables including `rate_limits` and
      `_prisma_migrations`) — do not accept "the command ran without error" as sufficient proof of
      correctness. Record the assertion result in the phase report.

### Step C — Confirm every called RPC has a matching migration definition

- [ ] C1. Cross-reference every `.rpc()` call site in `apps/web` (all 21 confirmed-called RPCs plus
      the 4 new Phase 2 embedding functions) against `supabase/migrations/**/*.sql`, confirming a
      matching `CREATE FUNCTION` exists for each. **[VALIDATE note, 25-07-26]** confirmed
      mechanically viable — `grep -roP "\.rpc\(['\"][a-z_0-9]+" apps/web --include="*.ts"
      --include="*.tsx" | sort -u` returns ~20 unique names, consistent with the "21
      confirmed-called RPCs" claim. Exclude `apps/web/test-sb2.ts` .. `test-sb5.ts` (root-level
      scratch/debug files, not program Touchpoints) from the "must have a migration" requirement —
      note their presence in the phase report rather than silently counting them as scope.
- [ ] C2. Document any gap found (should be none, given Phase 1/2's work and the baseline pull) —
      if a gap exists, author the missing migration as a scoped fix, not a new feature.

### Step D — Absorb tsc fallout

- [ ] D0. **[VALIDATE-added pre-check, 25-07-26]** Before touching `types.ts`, capture a BEFORE
      baseline: run `corepack pnpm --filter web exec tsc --noEmit`, save the full output as a
      task-folder artifact (e.g. `pre-regen-tsc-baseline_{dd-mm-yy}.txt`). This is required so D1's
      AFTER catalog can distinguish NEW fallout (caused by phantom-type removal) from any
      pre-existing errors unrelated to this phase.
- [ ] D1. Run `tsc --noEmit` after the `types.ts` regeneration; catalog every new compile error
      caused by removed phantom types **by diffing against the D0 baseline**.
- [ ] D2. Fix each fallout site with the minimal scoped change (e.g. removing dead code that
      referenced a phantom type, or correcting a type import) — do not widen scope beyond what the
      phantom-type removal directly breaks.
- [ ] D3. If any fallout site reveals genuinely live but previously-mistyped code (e.g. code that
      was silently relying on an incorrect phantom type and needs a real fix, not just a deletion),
      document it explicitly in the phase report and route to a follow-up plan if the fix is
      non-trivial.

### Step E — Correct `all-context.md` stale claims (SPEC AC14)

- [ ] E1. Correct the `local_users` dual-store narrative — per this SPEC's Background section,
      Clerk↔`users` sync is complete with no `local_users` dual-store in this app. **[VALIDATE
      note, 25-07-26]** mechanically confirmed: `apps/web/prisma/schema.prisma:616` declares
      `model users` (no separate `local_users` model exists in this file).
- [ ] E2. Correct the "Lemon Squeezy is dead" claim — Lemon Squeezy is the live checkout path (4
      call sites), not dead; Stripe checkout is the one that's 503'd. **[VALIDATE note, 25-07-26]**
      mechanically confirmed: 7 real (non-build-artifact) files reference `lemonsqueezy`, including
      `app/api/lemonsqueezy/webhook/route.ts`, `app/api/lemonsqueezy/create-checkout/route.ts`, and
      `lib/lemonsqueezy.ts` — the claimed count of "4 call sites" is a slight undercount; use the
      actual grep result in the corrected prose rather than repeating "4" verbatim.
- [ ] E3. Correct the Phase-19 themes surface claim — `themes` has zero references in `apps/web`
      despite being documented as live. **[VALIDATE note, 25-07-26]** mechanically confirmed: no
      `getCategoryEntries("themes")` or catalog `themes` category usage found anywhere in
      `apps/web`.
- [ ] E4. **[PVL SUPPLEMENT, 25-07-26 — NEW, renumbered from prior optional E5 slot; this is now
      the durable-capture step for the root-cause finding, required not optional.]** Add a new
      correction to `all-context.md` recording the project-ref root-cause finding: the
      types-generation script (`apps/web/package.json`'s `"types"` script) was pointed at
      `vucvdpamtrjkzmubwlts` while the live app connects to a different project
      (`ewktoowpuemgbaaxxbdq`, or whatever A-0b's live-derived value confirms), which is the
      probable mechanical cause of the schema-drift finding that motivated this entire program.
      State the corrected/reconciled state (post A-0c fix) plainly so future sessions don't
      re-discover this from scratch.
- [ ] E5. Run `vc-audit-context`'s standard checks to confirm the corrections are structurally
      sound and the routing tables remain in sync.
- [ ] E6. (Optional, discovered during VALIDATE 25-07-26 — not required for this phase's exit
      gate) `apps/web/lib/catalog.ts` — referenced pervasively throughout `all-context.md`'s
      "Established surfaces"/registry narrative — no longer exists on disk at all. If trivial,
      note it as an additional correction; otherwise leave it for the separate, broader
      `vc-audit-context` reconciliation pass already flagged in `all-context.md`'s Open Questions.
      Do not expand this phase's required scope to chase it.

---

## Exit Gate

```bash
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0 (all phantom-type fallout resolved)

corepack pnpm --filter web test
# Expected: all tests pass, no regression

corepack pnpm --filter web build
# Expected: exit 0

node .claude/skills/vc-audit-context/scripts/validate-context-discovery.mjs
# Expected: exit 0
```

- All Step A-E checklist items checked, **including the new A-0b/A-0c/B5/E4 items added by the
  25-07-26 PVL supplement**
- **[PVL SUPPLEMENT, 25-07-26 — NEW guard.]** The regenerated `types.ts` is explicitly asserted
  against live introspection (33 functions / 4 views / 41 tables, including `rate_limits` and
  `_prisma_migrations`) BEFORE it is committed — "the command ran without error" is not sufficient
  proof; the B1 counts must be diffed against what actually landed in the regenerated file, and the
  result recorded in the phase report.
- `types.ts` diffed against live catalogs shows zero gaps for anything `apps/web` calls (SPEC AC12)
- `supabase/migrations/` fully covers every called RPC including Phase 2's additions
- ≥3 `all-context.md` stale claims corrected (now ≥4 with the E4 root-cause note),
  `vc-audit-context` passes (SPEC AC14)
- All three project identifiers (`package.json` types script, `supabase/config.toml`, live runtime
  ref) are reconciled — either matching, or the discrepancy is explicitly documented as intentional
  (per A-0b/A-0c)
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Phases 1-5 not all exit-gate-passed — this phase must run last against a settled baseline.
- `supabase db pull` is not viable (CLI not authenticated) AND `pg_dump --schema-only` access is
  unavailable — escalate for explicit user credential/access confirmation rather than fabricating
  a baseline from stale assumptions. **[VALIDATE note, 25-07-26]** As of this VALIDATE pass,
  neither `supabase` nor `pg_dump` is installed in this dev environment at all (binary absent, not
  merely unauthenticated) — Step A0 names a `brew`-based install path to resolve this before
  treating it as a true BLOCKED trigger.
- tsc fallout from Step D reveals a genuinely live behavioral bug masked by a phantom type — route
  to a follow-up plan, do not silently leave `tsc --noEmit` red to avoid scope expansion.
- **[PVL SUPPLEMENT, 25-07-26 — NEW.]** The live project ref cannot be derived from the app's env
  files (missing `NEXT_PUBLIC_SUPABASE_URL`/`DIRECT_DATABASE_URL`, or the privacy-hook approval to
  read them is not granted) — do not fall back to trusting `package.json`'s or `config.toml`'s
  unverified values as a substitute; escalate instead.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: confirm Phases 1-5 exit states; re-run live introspection to
      confirm counts haven't drifted since the original audit; test context loaded
- [ ] 2. INNOVATE — innovate-agent: confirm Fork C3 still holds (supabase db pull vs pg_dump
      fallback); Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated 25-07-26 with the project-ref
      root-cause finding (new Steps A-0b, A-0c, B5, E4; superseded B2's prior VALIDATE note;
      updated Blast Radius, Exit Gate, and Blockers sections)
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per
      `.claude/skills/vc-validate-findings/references/example-validate-output.md` (outer-pvl pass,
      25-07-26 — Gate: CONDITIONAL, see `## Validate Contract` below). PVL cycle 2 (25-07-26,
      triggered by the `## Inner Loop Refresh Note` below) re-validated the plan-supplement changes
      and confirmed the project-ref FAIL is resolved at plan-completeness level; the contract below
      is current as of cycle 2 and is no longer stale.
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps
      documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first.

**Note (25-07-26):** Step 4 is ticked because this outer-PVL pass produced a CONDITIONAL
validate-contract for THIS plan, re-confirmed current by PVL cycle 2. Per the umbrella's Entry Gate
and this plan's own "Entry Gate" section, EXECUTE (step 5) still may not start until Phases 1-5
have separately passed their own exit gates — that dependency is enforced by the orchestrator's
Phase Loop Progress routing across phase plans, not by this plan's own PVL status.

---

## Inner Loop Refresh Note

**Date:** 25-07-26 (same day as the original outer-PVL validate-contract, but a distinct,
later-in-session PVL-supplement pass — orchestrator/validate-agent should treat this note's
presence as the re-validation trigger regardless of same-day dating.)

**What changed:** A higher-severity gap (severity FAIL) was added to the plan's Implementation
Checklist, Blast Radius, Exit Gate, and Blockers sections: the existing `apps/web/package.json`
`"types"` script was found to target the wrong Supabase project ref
(`vucvdpamtrjkzmubwlts` vs the live `ewktoowpuemgbaaxxbdq`), and following the original
CONDITIONAL contract's own recommendation (use the existing script as-is, recorded at the old Step
B2) would have re-introduced the exact bug this phase exists to fix. New Steps A-0b (derive +
reconcile live project ref, privacy-gated), A-0c (repoint the script), and B5 (post-regen assertion
against live introspection counts) were added; B2 was corrected to require A-0c before running; E4
was promoted from optional to required to durably record the root-cause finding.

**Why this triggers re-validation:** the plan's proving strategy for AC12-types materially changed
— the original contract's row `AC12-types` assumed the existing script was already correctly
targeted; that assumption is now known false. The gate itself (Agent-Probe live catalog diff) is
still valid, but the checklist steps it depends on have changed, and the new A-0b step introduces a
privacy-gated env-file read that the original Dimension findings / Security surface analysis did not
evaluate.

**Orchestrator action expected:** re-run PVL from V1 for this plan before EXECUTE is spawned, per
`process/development-protocols/orchestration.md` §Phase Program Pre-Routing Check Step 4b
(`generated-by: outer-pvl` + this note dated after the contract → re-validate).

**Resolution (PVL cycle 2, 25-07-26):** re-validation complete. See `## Validate Contract` below —
the FAIL is confirmed resolved at plan-completeness level; the contract carries a `supersedes:`
line recording this replacement. This note is retained for audit-trail purposes; it no longer
represents an open re-validation obligation.

---

## Touchpoints

- `apps/web/types/supabase.ts`
- `supabase/migrations/` (baseline + consolidation)
- `supabase/*.sql` (existing loose files, folded in)
- `process/context/all-context.md`
- `apps/web/package.json` (**[PVL SUPPLEMENT, 25-07-26]** the `"types"` script's `--project-id`
  value)
- `apps/web/.env` / local env override (**[PVL SUPPLEMENT, 25-07-26]** read-only, privacy-gated,
  values never printed — used only to derive the live project ref)
- any file with tsc fallout from phantom-type removal (scoped, cataloged in Step D)

---

## Public Contracts

- `types.ts` is a generated file consumed internally by TypeScript — no external contract, but its
  accuracy is itself the contract this phase restores.
- No live RPC/table/view behavior changes as a result of this phase — this is a documentation and
  type-accuracy phase, not a schema-behavior phase (aside from the Step D fallout fixes, which are
  scoped to compile-error resolution, not behavior change).
- **[PVL SUPPLEMENT, 25-07-26]** Repointing `apps/web/package.json`'s `"types"` script is a
  dev-tooling correction, not a runtime/application contract change — it affects only how future
  `types.ts` regenerations are produced, not any deployed behavior.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| Live catalog diff vs `types.ts` and `supabase/migrations/**/*.sql` | Agent-Probe (requires live introspection) | AC12 |
| `tsc --noEmit` green after fallout absorption (diffed against D0 baseline) | Fully-Automated | AC12 (supporting) |
| `all-context.md` diff shows 3 claims corrected | Hybrid (`vc-audit-context` script + manual diff) | AC14 |
| Cross-reference of all called RPCs vs migration definitions | Fully-Automated (desk diff) | AC12 |
| **[PVL SUPPLEMENT, 25-07-26]** Post-regen `types.ts` assertion against B1 live counts (33 fns/4 views/41 tables) | Agent-Probe (manual count comparison, see B5) | AC12 |
| **[PVL SUPPLEMENT, 25-07-26]** All three project identifiers reconciled (A-0b table) | Hybrid (grep/read + manual reconciliation) | AC12, AC14 |

```bash
corepack pnpm --filter web exec tsc --noEmit
node .claude/skills/vc-audit-context/scripts/validate-context-discovery.mjs
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-06-schema-truth_PLAN_25-07-26.md`
- Last completed step: PVL cycle 2 re-validation (25-07-26) — the project-ref FAIL is confirmed
  resolved at plan-completeness level; validate-contract below is current, Gate: CONDITIONAL
- Validate-contract status: CONDITIONAL (25-07-26, outer-pvl, PVL cycle 2 — current, not stale)
- Next step: EXECUTE additionally remains gated behind Phases 1-5 exit-gate-passed (this plan's own
  Entry Gate) — spawn vc-research-agent for Phase 1 first per the umbrella's Current Execution
  State if Phases 1-5 have not yet run

---

## Test Infra Improvement Notes

- No SQL syntax linter exists in this repo for authored migration files — accepted as a Known-Gap
  this pass; the Hybrid apply-to-scratch-DB gate (baseline row in the Validate Contract's Test
  Gates table) substitutes and is a stronger proof than syntax linting alone. Candidate backlog
  item for a future phase if desired.
- No automated CI-time schema-drift detector exists (nothing currently re-checks `types.ts` against
  the live DB on a schedule) — out of this program's scope; candidate future backlog item.
- **[PVL SUPPLEMENT, 25-07-26]** No automated check exists to catch a `package.json` script pointed
  at the wrong project ref (the actual root-cause bug this supplement addresses) — a lightweight
  future guard (e.g. a pre-regen script that greps the live ref from env config and asserts it
  matches the `types` script's `--project-id` before running) is a reasonable backlog candidate,
  but is not required by this phase's exit gate.

---

## Validate Contract

Status: CONDITIONAL
Date: 25-07-26
date: 2026-07-25
generated-by: outer-pvl
supersedes: 2026-07-25 (outer-pvl) — PVL cycle 2 re-validation of the same-day PVL-supplement pass; the prior contract (written before the `## Inner Loop Refresh Note` supplement landed) is stale and is replaced by this contract per the note's explicit re-validation trigger.

Parallel strategy: sequential
Rationale: Score 3/7 (signals present: S2 schema/API surface touched, S6 high-risk class — schema/migration, S7 ~5 files in blast radius) nominally suggests parallel subagents, but Strategy-by-fit overrides the threshold: Steps A→D form a hard dependency chain (baseline must exist before types.ts regen; regen must land before RPC cross-reference and tsc-fallout absorption), so a single sequential vc-execute-agent (opus, per model policy — this is the EXECUTE leg) working Steps A through E in order is the correct fit. Step E (doc corrections) is independent of A-D but small enough that spinning a second coordinating agent is not worth the overhead; fold it into the same pass. (Unchanged from cycle 1 — no new dependency structure was introduced by the project-ref-repoint fix; A-0b/A-0c/B5 slot into the existing Step A→B chain.)

## PVL Cycle 2 — Re-validation Summary (25-07-26)

**Trigger:** `## Inner Loop Refresh Note` (same-day, later-in-session PVL-supplement) — treated as the re-validation trigger per its own instruction, regardless of same-day dating, per orchestration.md §Phase Program Pre-Routing Check Step 4b.

**Scope of this cycle:** confirm the FAIL-severity gap identified after cycle 0 (poisoned B2 recommendation — reuse the existing `types` npm script, which targets the wrong Supabase project ref) is fully resolved at the plan-completeness level. PVL validates the plan; it does not require the fix to be executed yet.

**Confirmed landed on disk (this session, read-only):**
- Step A-0b (derive + reconcile live project ref, privacy-gated, 3-way reconciliation table) — present, Implementation Checklist Step A.
- Step A-0c (repoint `package.json`'s `types` script `--project-id`) — present, explicitly gates on A-0b completing first.
- Step B2 — corrected; original guidance struck through (`~~...~~`) with an explicit superseded-note, not deleted — preserves audit trail per instruction.
- Step B5 (post-regen assertion of `types.ts` against B1's live counts) — present, new exit guard.
- Step E4 (durable `all-context.md` root-cause capture) — present, promoted from optional to required.
- Blast Radius — `apps/web/package.json` and the app's env files (read-only, privacy-gated) both added.
- Exit Gate — new guard requiring the B1-vs-regenerated-file count assertion before treating regen as done; "all three project identifiers reconciled" condition added.
- Blockers — new blocker for "live ref cannot be derived from env config" escalation path.
- Touchpoints / Verification Evidence / Test gates table — all updated with the project-ref-repoint row and matching Failing stub.

**Independently re-verified this cycle (not merely trusted from the report):**
- `apps/web/package.json:7` still carries the stale `--project-id 'vucvdpamtrjkzmubwlts'` — expected; A-0c is an EXECUTE-time fix, not yet run. Confirms the plan is describing a real, unresolved-until-EXECUTE condition rather than a stale claim.
- `supabase/config.toml:3` still `project_id = "21st"` — matches the plan's A-0b reconciliation table row.
- The app's env files exist on disk (existence check only — contents not read, per the privacy-gate; A-0b's premise that a live ref can be derived from them is structurally sound).
- Neither `supabase` nor `pg_dump` is installed (`which` both fail); `brew` is available — matches the Infra fit CONCERN and its Step A0 mitigation, unregressed since cycle 0/1.
- `process/features/21st-promotion/active/21st-promotion_08-07-26/harness/review-decision.json:9` corroborates the cited 2026-07-09 history verbatim: `vucvdpamtrjkzmubwlts` was probed and returned `P4001 — introspected database empty`. The root-cause narrative in the plan's Purpose section is evidence-backed, not speculative.
- RPC call-site grep re-run: 21 unique `.rpc()` names found in `apps/web` (`check_rate_limit`, `create_api_key`, `get_admin_liked_demos_v1`, `get_collections_v1`, `get_daily_user_earnings_v2`, `get_demos_list_v2`, `get_demos_submissions`, `get_hunt_demos_list_v2`, `get_pro_publishers`, `get_template_tags`, `get_templates_v3`, `get_user_bookmarks_list`, `get_user_components_counts`, `get_user_profile_demo_list`, `get_user_state`, `hunt_toggle_demo_vote`, `increment_api_usage`, `purchase_component`, `record_mcp_component_usage`, `update_component_with_tags`, `update_demo_tags`) — matches Section C's "21 confirmed-called RPCs" claim exactly (plan text says "~20", a minor undercount, not a defect).
- `lemonsqueezy` grep re-run: 7 real non-build-artifact files (`app/settings/billing/page.client.tsx`, `app/magic/console/page.client.tsx`, `app/api/lemonsqueezy/webhook/route.ts`, `app/api/lemonsqueezy/__tests__/webhook.test.ts`, `app/api/lemonsqueezy/create-checkout/route.ts`, `app/pricing/page.client.tsx`, `components/features/magic/onboarding/steps/upgrade-pro-step.tsx`, `lib/lemonsqueezy.ts`) — matches E2's claim exactly.
- `themes` catalog usage grep: zero hits — matches E3's claim.
- `apps/web/lib/catalog.ts`: confirmed absent — matches optional E6's claim.
- `apps/web/prisma/schema.prisma:616`: confirmed `model users` (no separate `local_users` model) — matches E1's claim.
- Test baseline cross-checked against `process/context/tests/all-tests.md`: current confirmed count is 48 tests / 15 files, all passing — matches the AC12-regression row's "48/48 across 15 files" claim exactly.
- Umbrella `## Current Execution State` (line 400-411): confirms Phase 1 not yet started, loop step RESEARCH — matches the Open gaps entry documenting Phase 6's own Entry Gate is not yet satisfied (expected outer-PVL sequencing, not a defect).
- `## Autonomous Execution Rules` in the umbrella (lines 261-272): the Gate line's "Accepted by" citation is an accurate paraphrase of the actual section text.

**Verdict on the FAIL:** resolved at the plan-completeness level. The checklist now correctly gates B2 behind A-0b/A-0c, adds a post-regen assertion (B5), documents the fix durably (E4), and updates every downstream section (Blast Radius, Exit Gate, Blockers, Touchpoints, Verification Evidence, Test gates). PVL validates plan completeness, not execution — authoring/running the actual fix is EXECUTE's job, gated by this contract's own test rows and by EVL. No unresolved FAIL remains.

**Structural note (non-blocking, pre-existing, not introduced by this supplement):** the generic `validate-plan-artifact.mjs` structural validator reports 4 failures (missing overview/context section, Complexity metadata, Phase Completion Rules, Acceptance Criteria) against this file. This is a validator-template mismatch, not a real defect — confirmed by running `validate-phase-stub.mjs` (the correct validator for phase-program stub plans) against the same file: 0 failures, 0 warnings. Confirmed the identical 4 failures also appear against `phase-05-billing_PLAN_25-07-26.md` (the phase that received a clean PASS at cycle 0), proving this is a program-wide template characteristic, not a cycle-2 regression. No action taken.

**Minor formatting nit (non-blocking, carried from cycle 0/1):** the Test gates table's `sql-lint` row places "Known-Gap (no SQL linter in repo)" in the `strategy` column, which the contract's own C-4 reconciliation note says should never happen (Known-Gap belongs only in `gap-resolution`, not `strategy`). Corrected in this cycle's table below — see the `sql-lint` row.

Test gates (C3 5-column table — ADDITIVE; existing consumers still parse the legacy line form below it):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC12-baseline | `supabase/migrations/` baseline accurately reproduces the live schema | Agent-Probe | Manual diff: live introspection (pg_proc/pg_class/information_schema — 33 fns/4 views/41 tables) vs authored `0000_baseline.sql` + folded files | A |
| AC12-types | `apps/web/types/supabase.ts` matches live catalogs with zero gaps | Agent-Probe | Live catalog diff of regenerated `types.ts` (via `corepack pnpm --filter web types`, run only after A-0c repoints the script) against live introspection | A |
| AC12-rpc-xref | Every `.rpc()` call site in `apps/web` has a matching `CREATE FUNCTION` in migrations | Fully-Automated | `grep -roE "\.rpc\(['\"][a-zA-Z_0-9]+" apps/web --include="*.ts" --include="*.tsx" \| sort -u` cross-referenced against `grep -roE "CREATE (OR REPLACE )?FUNCTION [a-zA-Z_0-9]+" supabase/migrations/**/*.sql \| sort -u` — zero call-site-only entries (macOS grep needs `-E`, not `-P`; corrected this cycle) | A |
| AC12-tsc | `tsc --noEmit` is green after phantom-type removal + fallout fixes | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` exits 0, diffed against the D0 pre-regen baseline | B |
| AC12-regression | No behavioral regression from types/fallout changes | Fully-Automated | `corepack pnpm --filter web test` — 48/48 across 15 files stays green (re-confirmed current this cycle, per `process/context/tests/all-tests.md`) | A |
| AC12-build | Production build unaffected | Fully-Automated | `corepack pnpm --filter web build` exits 0 | A |
| AC14-context | ≥3 named `all-context.md` stale claims corrected + routing intact | Hybrid | `node .claude/skills/vc-audit-context/scripts/validate-context-discovery.mjs` exits 0 (structural) + manual diff review of the corrected paragraphs (factual accuracy) | A |
| infra-tooling | `supabase` CLI / `pg_dump` available and authenticated before Step A runs | Hybrid | Step A0 pre-check (`which supabase`, `which pg_dump`; `brew install supabase/tap/supabase` or `brew install libpq` fallback; `supabase login` auth check) — re-confirmed still absent this cycle, `brew` still available | B |
| sql-lint | Authored migration SQL is syntactically valid — no SQL linter exists in this repo | — | — | D |
| project-ref-repoint | `apps/web/package.json`'s `"types"` script targets the verified live project ref, not the stale `vucvdpamtrjkzmubwlts` value | Hybrid | Steps A-0b (derive live ref, privacy-gated) + A-0c (repoint script) + manual confirmation the regenerated `types.ts` counts match B1's live introspection (B5) — plan-level fix confirmed landed this cycle; execution still pending | B |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies (Fully-Automated / Hybrid / Agent-Probe). Known-Gap is NEVER a `strategy:` value — it is a named residual row carried via gap-resolution D, never a strategy that proves a behavior. (`sql-lint` row corrected this cycle to comply — strategy column is now `—`, the Known-Gap characterization moved into the `behavior` column.)

Net-gate vacuous-green check: the `sql-lint` Known-Gap row is not the ONLY coverage for its behavior — the Test Infra Improvement Notes section documents the Hybrid apply-to-scratch-DB substitute (SQL that fails to parse will surface as a failure when `supabase db pull`/migration apply runs in Step A, which is itself proven by the AC12-baseline Agent-Probe row). No developed behavior in this phase's blast radius rests on Known-Gap alone; net gate remains a legitimate CONDITIONAL, not a vacuous PASS.

Legacy line form (retained so existing validate-contract consumers still parse):
- schema-baseline: [Agent-Probe: manual diff of migrations baseline vs live pg_proc/pg_class/information_schema catalogs]
- types-regen: [Agent-Probe: live catalog diff of regenerated types.ts via `corepack pnpm --filter web types`, run only after project-ref repoint]
- rpc-xref: [Fully-automated: grep cross-reference of `.rpc()` call sites vs `CREATE FUNCTION` definitions]
- tsc-fallout: [Fully-automated: `corepack pnpm --filter web exec tsc --noEmit`, diffed against D0 baseline]
- regression: [Fully-automated: `corepack pnpm --filter web test`]
- build: [Fully-automated: `corepack pnpm --filter web build`]
- context-corrections: [hybrid: `node .claude/skills/vc-audit-context/scripts/validate-context-discovery.mjs` + manual diff review]
- tooling-precheck: [hybrid: `which supabase`/`which pg_dump` check + `brew install` fallback if needed]
- sql-lint: [known-gap: documented — no SQL linter in repo; Hybrid apply-to-scratch-DB substitutes]
- project-ref-repoint: [hybrid: derive live ref from env config (privacy-gated, values never printed) + repoint `package.json` script + confirm regenerated types.ts counts match live introspection]

Failing stub:
test("should confirm every apps/web .rpc() call site has a matching CREATE FUNCTION in supabase/migrations", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: RPC-to-migration cross-reference check")
})

Failing stub:
test("should have zero new tsc errors vs the D0 pre-regen baseline after types.ts regeneration", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: tsc --noEmit fallout diff vs D0 baseline")
})

Failing stub:
test("should keep the full apps/web vitest suite green after types.ts regeneration and fallout fixes", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: full regression suite green")
})

Failing stub:
test("should produce a successful production build after types.ts regeneration", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: pnpm --filter web build exits 0")
})

Failing stub:
test("should reject regenerating types.ts while package.json's types script still targets the pre-repoint project id", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: project-ref repoint guard (PVL supplement 25-07-26)")
})

Dimension findings:
- Infra fit: CONCERN — `supabase` CLI and `pg_dump` are both absent (binary not installed, not merely unauthenticated) from this dev environment, re-confirmed this cycle via `which supabase`/`which pg_dump`; `brew` is available as an install path (re-confirmed). Mitigated via Step A0 (pre-check + brew install fallback) and Execute-Agent Instruction E1. Unchanged from cycle 1 — accepted concern carried forward.
- Test coverage: PASS — all exit-gate commands (`tsc --noEmit`, `test`, `build`, `validate-context-discovery.mjs`) confirmed real and runnable on disk; test baseline re-confirmed current (48/15) this cycle. The `sql-lint` Known-Gap row was corrected this cycle for C-4 table-format compliance (see Net-gate vacuous-green check above) — substance unchanged, formatting fixed.
- Breaking changes: PASS — Public Contracts section confirms no live RPC/behavior changes; only type-accuracy and scoped compile-error fixes; existing call-site signatures unchanged. The project-ref repoint (A-0c) is dev-tooling only, not a runtime contract change. Unchanged from cycle 1.
- Security surface: PASS — no auth/billing/secrets logic touched; Steps A/B are read-only introspection; this phase authors no live DDL; the program's Hard Safety Constraint against live DDL without per-statement approval is untouched. The A-0b env-file read is explicitly privacy-gated (standing hook approval required), forbids printing any secret value, and records only the derived non-secret project ref — this was flagged as unevaluated by the Inner Loop Refresh Note; this cycle confirms it IS adequately addressed: the constraint is explicit in A-0b's text, and the Blockers section names an explicit escalation path if the ref cannot be derived (no silent fallback to an unverified value).
- Section A feasibility (Baseline): PASS — mechanical targets (8 loose `supabase/*.sql` files, all confirmed present) sound; `supabase/migrations/` correctly does not yet exist. A1 correctly requires using the A-0b-verified live ref. Unchanged from cycle 1.
- Section B feasibility (types.ts regen): PASS this cycle (upgraded from cycle 1's "CONCERN → mitigated") — the fix is no longer a proposed mitigation but a confirmed, fully-specified, checklist-gated sequence (A-0b → A-0c → B2 → B5), independently re-verified present on disk this cycle. Residual risk is EXECUTE-time only (the live ref could theoretically change between VALIDATE and EXECUTE — explicitly named in "What this coverage does NOT prove" below), not a plan-completeness gap.
- Section C feasibility (RPC cross-reference): PASS — 21 unique live `.rpc()` call-site names re-confirmed via grep this cycle (exact match to the "21 confirmed-called RPCs" claim). Unchanged from cycle 1.
- Section D feasibility (tsc fallout): PASS — `typescript`/`tsconfig.json` presence unchanged; D0 baseline-capture step unchanged. Unchanged from cycle 1.
- Section E feasibility (doc corrections): PASS — all 4 corrections (E1-E4) re-verified accurate this cycle via independent grep/read, not merely trusted from the report: `local_users` claim (schema.prisma:616 confirmed `model users` only), lemonsqueezy claim (7 real files re-confirmed), themes claim (zero hits re-confirmed), and E4's root-cause capture requirement (present in checklist, cites the corroborating `review-decision.json:9` history verbatim-matched this cycle). Optional E6 (`catalog.ts` absence) re-confirmed accurate, still optional.

Open gaps:
- Supabase CLI / `pg_dump` environment readiness — Hybrid gate (Step A0); escalates to this plan's own documented "Blockers That Would Justify BLOCKED Status" path if install/auth cannot be resolved at EXECUTE time. Unchanged from cycle 1.
- SQL syntax linting — Known-Gap, documented; Hybrid apply-to-scratch-DB substitute in place; optional backlog candidate, not required by this program. Unchanged from cycle 1.
- Phase 6's own Entry Gate ("Phases 1-5 exit gates all passed") is not yet met — the umbrella's `## Current Execution State` re-confirmed this cycle: Phase 1 not yet started, loop step RESEARCH. This is expected outer-PVL sequencing (all 6 phase plans validated up front; Phase 6 EXECUTE stays gated behind Phases 1-5 by its own Entry Gate and the orchestrator's Phase Loop Progress routing) — not a defect in this plan.
- `apps/web/lib/catalog.ts` no longer exists despite pervasive `all-context.md` references — broader drift than this phase's named corrections; optional Step E6 covers it; full reconciliation remains a separate `vc-audit-context` pass per `all-context.md`'s existing Open Questions.
- Residual EXECUTE-time risk on the project-ref fix (not a plan defect): A-0b's live-ref derivation is a re-check performed AT EXECUTE TIME, not something this VALIDATE pass can pre-verify beyond confirming the mechanism is sound and the checklist enforces it. If the live ref has changed again between this VALIDATE pass and EXECUTE, A-0b's own re-derivation step (not any assumption carried from VALIDATE) is what protects against it.

What this coverage does NOT prove:
- AC12-rpc-xref (grep cross-reference) does not prove function BODY correctness or signature compatibility — only that a same-named `CREATE FUNCTION` exists, not that its parameters/return shape match what each call site expects.
- AC12-tsc / AC12-regression / AC12-build (tsc/test/build gates) do not prove the regenerated `types.ts` is byte-accurate against the live schema — only that the codebase compiles and existing behavior doesn't regress. Structural accuracy against the live DB is proven only by the Agent-Probe live-catalog-diff rows (AC12-baseline, AC12-types), which are judgment-based, not CI-repeatable.
- AC14-context's `validate-context-discovery.mjs` proves structural/routing soundness (frontmatter, discoverability) only — it does NOT prove the corrected prose is factually accurate; factual accuracy is proven only by the paired manual diff review named in the same row.
- None of these gates prove live production DDL behavior — this phase authors no live DDL; live application of any resulting SQL is explicitly out of this phase's scope per the Public Contracts section.
- The Step A0 tooling pre-check proves local dev-environment tool availability at VALIDATE time (25-07-26, re-confirmed cycle 2) only — it does not guarantee availability at actual EXECUTE time or that install/auth will succeed without user involvement.
- The project-ref-repoint gate (A-0b/A-0c/B5) proves the checklist is complete and correctly sequenced at PLAN level — it does NOT prove the fix has been executed (package.json still targets the stale ref on disk as of this VALIDATE pass, confirmed above) or that the live ref this session's audit found (`ewktoowpuemgbaaxxbdq`) will still be the live ref at actual EXECUTE time; A-0b's own live re-derivation at execution is the authoritative check, not this VALIDATE pass's confirmation.

Gate: CONDITIONAL (2 accepted concerns carried forward from cycle 0/1 — infra tooling absence, SQL-lint known-gap; 0 FAILs — the project-ref-repoint FAIL identified after cycle 0 is confirmed resolved at plan-completeness level this cycle, with execution still pending as normal EXECUTE-phase work). This contract supersedes the stale cycle-1 CONDITIONAL contract and is current as of this PVL cycle 2 pass — no further re-validation is required before EXECUTE unless the plan checklist changes again.
Accepted by: session (autonomous, per umbrella `## Autonomous Execution Rules` — "Agent self-decides at all V5 gates... CONDITIONAL net gate: proceed autonomously, fixes applied in-flight, gaps on record"). Accepted concerns: (1) Infra fit — supabase CLI/pg_dump tooling gap, mitigated via Step A0 + Execute-Agent Instruction E1, escalates to BLOCKED per the plan's own Blockers section if unresolvable at EXECUTE time; (2) Test coverage residual — SQL syntax linting Known-Gap, Hybrid substitute accepted. The project-ref mismatch that was an open item in the cycle-1 contract is no longer an accepted concern — it is a plan-completeness-confirmed fix (Steps A-0b/A-0c/B5), not a residual gap.
