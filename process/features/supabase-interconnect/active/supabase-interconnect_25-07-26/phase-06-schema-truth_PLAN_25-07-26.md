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

- **[PLAN-SUPPLEMENT, 29-07-26]** `apps/web/types/supabase.ts`'s 4 embedding-function
  declarations (`vec_dim`, `get_missing_usage_embedding_items`, `insert_embedding`,
  `insert_code_embedding`) — merged back post-regeneration with a PENDING MIGRATION comment
  per Step B2b, since `supabase/migrations/0001_embedding_functions.sql` is authored but not
  yet applied live

---

## Implementation Checklist

### Step A — Baseline the live schema (Fork C3)

- [ ] A0. **[PLAN-SUPPLEMENT, 29-07-26 — CORRECTS the prior VALIDATE-added pre-check below,
      which was based on a false premise.]** The prior note claimed neither `supabase` nor
      `pg_dump` was installed and recommended `brew install supabase/tap/supabase`. This is
      **incorrect** — verified on disk this session: `supabase` is a **workspace devDependency**
      (`apps/web/package.json:137`, pinned `2.22.6`) and runs via
      `corepack pnpm --filter web exec supabase --version` (confirmed: exits 0, prints `2.22.6`,
      with an informational "newer version available" notice only — not an error). Note also that
      `supabase gen types --project-id` calls the Supabase **Management API over HTTPS** — it needs
      **neither Docker nor `pg_dump`** to run. `pg_dump` genuinely IS absent (`which pg_dump` fails)
      and so is a local `psql`, but neither blocks `gen types`; only `supabase db pull` (if used
      instead, per Step A1's fallback framing) would need CLI DB access, which is a separate,
      lower-priority path.
      **The real pre-check is authentication, not availability.** Before Step A1, run
      `corepack pnpm --filter web exec supabase projects list` (or equivalent session check). If it
      returns a project list without prompting for login, the CLI is already authenticated —
      proceed directly, no install step needed. If it fails with an auth error, that IS a genuine
      escalation: run `corepack pnpm --filter web exec supabase login` (interactive) or set
      `SUPABASE_ACCESS_TOKEN`; credentials cannot be fabricated by an agent. If that install/auth
      path is blocked, STOP and escalate per "Blockers That Would Justify BLOCKED Status" below —
      do not fabricate a baseline from stale assumptions. Keep `pg_dump --schema-only` mentioned
      only as a fallback-of-a-fallback (Step A1); it remains genuinely absent from this dev shell.
      ~~[SUPERSEDED VALIDATE note, 25-07-26] Confirm tooling before starting: run `which supabase`
      and `which pg_dump`. Confirmed at VALIDATE time (25-07-26): neither binary is installed in
      the standard dev shell (`brew` IS available on this machine). If both are still absent when
      this step actually executes: install via `brew install supabase/tap/supabase` (preferred —
      provides both `db pull` and `gen types` needed by Steps A and B) or, for `pg_dump` only,
      `brew install libpq` (add to PATH).~~ **This note was based on an unverified premise — see
      the correction above.**
**[PLAN-SUPPLEMENT, 29-07-26 — ROOT-CAUSE EMPHASIS, do not miss this.]** This single line is the whole program's root cause: `apps/web/package.json:7`'s `types` script hardcodes `--project-id 'vucvdpamtrjkzmubwlts'`, while the live project the app actually runs against is `ewktoowpuemgbaaxxbdq` ("CozyDownloads", cited non-secretly at `supabase/enable-rls.sql:3`) — confirmed empty/wrong via `P4001` on 2026-07-09. Every prior phase's "types.ts is stale fiction" finding traces back to this one mis-pointed ref. The repoint (A-0c) MUST land before any regeneration, or the whole problem silently reproduces.
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
- [ ] A4b. **[PLAN-SUPPLEMENT, 29-07-26 — NEW, explicit two-tier baseline rule.]**
      `supabase/migrations/0000_baseline.sql` must contain ONLY what live introspection actually
      returns. Phase 1's grants, Phase 2's functions, and Phase 3's seed are authored-but-**not
      applied-live** and sit behind outstanding user approvals — they MUST stay as separately
      numbered, explicitly commented migration files (e.g. `0001_embedding_functions.sql`,
      whatever Phase 1's grant file becomes) and must **never** be folded into the baseline file
      itself. A baseline that silently includes unapplied SQL would misrepresent the live schema —
      the exact failure this phase exists to end. If Phase 1's grants or Phase 2's functions are
      confirmed applied live by the time this step executes, they belong in the live-introspected
      baseline naturally (via A1's live pull); if they are NOT yet applied, they stay in their own
      separately numbered files per A3, never merged into `0000_baseline.sql`.

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
- [ ] B2b. **[PLAN-SUPPLEMENT, 29-07-26 — NEW, prevents a real regression.]** Merge back
      Phase 2's not-yet-live embedding functions before finalizing. `apps/web/types/supabase.ts`
      currently declares Phase 2's four embedding functions — `vec_dim`,
      `get_missing_usage_embedding_items`, `insert_embedding`, `insert_code_embedding` — but these
      exist ONLY in `supabase/migrations/0001_embedding_functions.sql`, which is authored and
      **not yet applied live** (see Phase 2's own status). A wholesale regeneration against the live
      DB (Step B2) will therefore **delete** these four declarations from `types.ts`, silently
      breaking anything that references them, with no obvious cause at compile time until much
      later.
      Required: immediately after B2's regeneration and before B3/B4 checks are treated as final,
      re-insert declarations for these four functions into the regenerated `types.ts`, each tagged
      with a `// PENDING MIGRATION — not yet live, see supabase/migrations/0001_embedding_functions.sql`
      comment so a future reader knows why a "phantom-looking" entry is intentionally present.
      Record in the phase report that this patch step exists ONLY because the migration is
      unapplied, and that it should be REMOVED (i.e. these functions should regenerate naturally
      from live introspection, with the comment deleted) once Phase 2's migration is actually
      applied to the live database — do not let this patch become a permanent fixture.
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

- [ ] D0. **[PLAN-SUPPLEMENT, 29-07-26 — CORRECTS methodology; the prior VALIDATE-added
      pre-check below is insufficient on the live working tree.]** The current working tree carries
      roughly **1165 foreign tsc errors** (the user's uncommitted `package.json`/`pnpm-lock.yaml`
      changes causing duplicate React types / `TS2786`, plus a stale `.next` cache) — a BEFORE/AFTER
      capture taken directly on this dirty tree would bury any real regeneration fallout in that
      noise. Required: take BOTH the D0 BEFORE and D1 AFTER `tsc --noEmit` captures **in a
      disposable scratch worktree checked out from the committed tree** (`git worktree add
      /tmp/phase06-tsc-scratch <commit>` or equivalent), not the live dirty working tree — this is
      the same technique already recorded as a durable lesson in `all-context.md` §Deployment
      (scratch-worktree tsc verification). Run `corepack pnpm --filter web exec tsc --noEmit` in
      that scratch worktree, save the full output as a task-folder artifact (e.g.
      `pre-regen-tsc-baseline_{dd-mm-yy}.txt`).
      ~~[SUPERSEDED VALIDATE note, 25-07-26] Before touching `types.ts`, capture a BEFORE baseline:
      run `corepack pnpm --filter web exec tsc --noEmit`, save the full output as a task-folder
      artifact.~~ **Insufficient as written — see the scratch-worktree correction above; this note
      did not account for the ~1165 foreign errors already present on the dirty working tree.**
- [ ] D1. Run `tsc --noEmit` after the `types.ts` regeneration **in the same scratch worktree**;
      catalog every new compile error caused by removed phantom types **by diffing against the D0
      baseline, keyed by (file, error-code) pairs — not by raw error count**. A raw-count comparison
      masks errors that shift between files while numerically cancelling out (e.g. 3 errors
      disappearing from file A while 3 different errors appear in file B looks like "no change" by
      count alone, but is a real regression). Compare the set of `(file, TSxxxx)` tuples between the
      D0 and D1 captures; any tuple present in D1 but absent from D0 is genuine new fallout.
- [ ] D2. Fix each fallout site with the minimal scoped change (e.g. removing dead code that
      referenced a phantom type, or correcting a type import) — do not widen scope beyond what the
      phantom-type removal directly breaks.
- [ ] D3. If any fallout site reveals genuinely live but previously-mistyped code (e.g. code that
      was silently relying on an incorrect phantom type and needs a real fix, not just a deletion),
      document it explicitly in the phase report and route to a follow-up plan if the fix is
      non-trivial.

### Step E — Correct `all-context.md` stale claims (SPEC AC14)

**[PLAN-SUPPLEMENT, 29-07-26]** Scope of this step is now explicitly **5** corrections, not 3: (a) `local_users` dual-store claim (E1); (b) the Lemon Squeezy self-contradiction, not just staleness (E2/E2b); (c) the Phase-19 themes surface claim (E3); (d) `apps/web/lib/catalog.ts` referenced but absent from disk (E6, promoted required); (e) the project-ref root-cause finding, arguably the single most valuable fact this program produced (E4).

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
- [ ] E2b. **[PLAN-SUPPLEMENT, 29-07-26 — NEW, corrects an internal self-contradiction, not just a
      stale claim.]** `all-context.md` currently contradicts itself on Lemon Squeezy: the top
      identity section (lines ~28, ~244 in the "Scan Metadata" narrative) says "legal/policy pages
      are live... Lemon Squeezy boilerplate ready", while the `## Open Questions / Outstanding Work`
      section (line ~272) says "Lemon Squeezy checkout integration NOT built (blocked on user LS
      account creds)" — while lines ~385-413 elsewhere correctly and accurately describe 11 real
      files implementing genuinely live LS checkout/webhook code. E2's grep-confirmed finding (7+
      real non-build-artifact files) makes the "NOT built" framing in `## Open Questions` flatly
      wrong, not merely stale. Required: remove or rewrite the `## Open Questions` "Lemon Squeezy
      checkout integration NOT built" bullet to match the accurate lines ~385-413 description
      (live, working LS checkout/webhook — CSB_API_KEY / Clerk gaps are the separate genuinely
      outstanding items, not LS itself), so the file no longer says two different things about the
      same subsystem.
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
- [ ] E6. **[PLAN-SUPPLEMENT, 29-07-26 — PROMOTED from optional to required; this phase's
      documentation-correction scope is now explicitly 5 items, not 3.]** `apps/web/lib/catalog.ts`
      — referenced pervasively throughout `all-context.md`'s "Established surfaces"/registry
      narrative — no longer exists on disk at all (confirmed absent this session). Add a targeted,
      one-paragraph correction noting this file does not exist and that routing references to it
      throughout the "Established surfaces" section are stale — do NOT attempt a full rewrite of
      that narrative in this phase (the broader `vc-audit-context` reconciliation pass already
      flagged in `all-context.md`'s Open Questions remains the right place for the wholesale
      rewrite). This is a scoped "file does not exist, flag it" correction, not scope expansion.
      ~~[SUPERSEDED VALIDATE note, 25-07-26] Optional, not required for this phase's exit gate.~~
      **Now required — see the 5-item Step E scope note above.**

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

- [x] 1. RESEARCH — 29-07-26: verified `supabase` CLI is a workspace devDependency (works via
      `corepack pnpm --filter web exec supabase ...`, no brew install needed — prior premise was
      false); confirmed the `compile-missing-bundles.ts` column-name bug (unrelated, backlogged);
      confirmed the `all-context.md` Lemon Squeezy self-contradiction on disk
- [x] 2. INNOVATE — 29-07-26: decided to correct A0's tooling premise in place (auth-check, not
      install-check), add a merge-back step (B2b) for Phase 2's unapplied functions, require
      scratch-worktree + (file, code)-keyed tsc diffing (D0/D1), state the two-tier baseline rule
      explicitly (A4b), and expand Step E to its true 5-item scope — no new design tradeoffs, all
      corrections to existing plan content
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated 25-07-26 with the project-ref
      root-cause finding (new Steps A-0b, A-0c, B5, E4; superseded B2's prior VALIDATE note;
      updated Blast Radius, Exit Gate, and Blockers sections). **Second supplement pass, 29-07-26:**
      corrected A0's tooling premise, added B2b (embedding-function merge-back), corrected D0/D1
      methodology (scratch worktree + file+code-keyed diff), added A4b (two-tier baseline rule),
      wrote a backlog note for the `compile-missing-bundles.ts` bug, and expanded Step E to 5 items
      (added E2b, promoted E6) — see `## Inner Loop Refresh Note (29-07-26)` below.
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per
      `.claude/skills/vc-validate-findings/references/example-validate-output.md` (outer-pvl pass,
      25-07-26 — Gate: CONDITIONAL, see `## Validate Contract` below). PVL cycle 2 (25-07-26,
      triggered by the `## Inner Loop Refresh Note` below) re-validated the plan-supplement changes
      and confirmed the project-ref FAIL is resolved at plan-completeness level; the contract below
      was current as of cycle 2. **PVL cycle 3 required** — see the new
      `## Inner Loop Refresh Note (29-07-26)` below; the 29-07-26 supplement changes have not yet
      been re-validated.
- [x] 5. EXECUTE — 29-07-26, **COMPLETE_WITH_GAPS**. Done: four-site project-ref repoint
      (A-0b/A-0c + E-new-1 — `package.json:7`, `scripts/embed-all-demos.js`,
      `SubmissionCard.tsx:21-22`; one was a live bug), all 5 Step E `all-context.md` corrections
      (E1/E2/E2b/E3/E4/E6), Step C RPC cross-reference (2 real gaps found + backlogged),
      blast-radius registry extended, 3 backlog notes. **BLOCKED and NOT done: Steps A1-A4b,
      B1-B5, D0-D3** — the Supabase CLI is unauthenticated (`gen types` → "Access token not
      provided") and no `pg_dump`/`psql`/`docker` fallback exists, so `types.ts` was NOT
      regenerated and no baseline was created. Gates green: tsc 1165 = foreign baseline exactly
      (zero net new), tests 113/114 (zero NEW failures), `validate-context-discovery.mjs` exit 0,
      repoint-completeness grep clean. See `phase-06-schema-truth_REPORT_29-07-26.md`.
- [x] 6. EVL — 29-07-26: all reachable gates confirmed green (tsc 1165 = foreign baseline exactly,
      zero net new; tests 113/114, zero new failures; `validate-context-discovery.mjs` exit 0;
      repoint-completeness grep clean, 1 hit = explanatory comment). Blocked steps (types.ts
      regen, migrations baseline) are Known-Gap, not EVL failures — no gate exists to fail since no
      regeneration occurred. 3 follow-up stubs registered as backlog notes. EVL HANDOFF SUMMARY
      written by orchestrator and passed to UPDATE PROCESS.
- [x] 7. UPDATE PROCESS — 29-07-26: phase report finalized (no changes needed, already complete),
      program-level closeout written in umbrella plan, `## Current Execution State` rewritten,
      program-wide learnings appended, archival judged (stays active — see Program Closeout),
      `process/context/all-context.md` reviewed (no further edit needed beyond Phase 6's own 5
      corrections — see Program Closeout rationale). Commit handled by orchestrator.

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
- Last completed step: PLAN-SUPPLEMENT (inner loop, 29-07-26) — corrected A0's tooling premise,
  added B2b (embedding-function merge-back), corrected D0/D1 tsc methodology (scratch worktree +
  file+code-keyed diff), added A4b (two-tier baseline rule), expanded Step E to 5 items (E2b, E6
  promoted), and wrote a backlog note for the unrelated `compile-missing-bundles.ts` column bug.
- Validate-contract status: SUPERSEDED pending re-validation — the existing contract below
  (25-07-26, outer-pvl, PVL cycle 2, Gate: CONDITIONAL) is stale as of the new
  `## Inner Loop Refresh Note (29-07-26)` above; it addresses only the project-ref finding, not the
  29-07-26 supplement's additional changes (A0, B2b, D0/D1, A4b, E2b/E6).
- Next step: PVL re-run from V1 (spawn vc-validate-agent), NOT EXECUTE — per
  `process/development-protocols/orchestration.md` §Phase Program Pre-Routing Check Step 4b, a
  newer `## Inner Loop Refresh Note` than the existing contract date means re-validation is
  required before EXECUTE can be spawned. EXECUTE additionally remains gated behind Phases 1-5
  exit-gate-passed (this plan's own Entry Gate) — spawn vc-research-agent for Phase 1 first per the
  umbrella's Current Execution State if Phases 1-5 have not yet run.

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

## Inner Loop Refresh Note (29-07-26)

**Date:** 2026-07-29 (strictly newer than the existing contract's `date: 2026-07-25` and the prior
25-07-26 Inner Loop Refresh Note above — this is the current re-validation trigger.)

**What changed:** A second PLAN-SUPPLEMENT pass corrected several items in the plan's own
methodology and scope, none of which change the phase's overall approach but several of which
change what EXECUTE must actually do:
1. Step A0's tooling premise was **factually wrong** (claimed `supabase`/`pg_dump` both absent;
   `supabase` is actually a workspace devDependency, runs fine via `corepack pnpm --filter web
   exec`) — corrected to an auth-check, not an install-check.
2. New Step B2b — a merge-back guard preventing Step B2's regeneration from silently deleting
   Phase 2's 4 not-yet-live embedding-function type declarations.
3. Steps D0/D1's tsc-fallout methodology was insufficient on the current dirty working tree
   (~1165 foreign errors would mask real fallout) — corrected to require a disposable scratch
   worktree and (file, error-code)-keyed diffing instead of raw-count diffing.
4. New Step A4b — explicit two-tier baseline rule (unapplied SQL never folds into the baseline
   file).
5. Step E's scope was clarified as 5 corrections (not 3) — added E2b (Lemon Squeezy
   self-contradiction, not just staleness) and promoted E6 (`catalog.ts` absence) from optional to
   required.
6. A new backlog note was written for an unrelated, out-of-scope bug found during research
   (`apps/web/scripts/compile-missing-bundles.ts:234`'s wrong column name) — no plan-file impact
   beyond a Blast Radius reference is intended, since the fix itself is explicitly out of this
   phase's scope.

**Why this triggers re-validation:** items 1-4 change EXECUTE's actual required actions (a false
tooling premise could have caused EXECUTE to waste time on an unnecessary `brew install`; the
merge-back step (B2b) is a genuinely new checklist item with its own gate; the D0/D1 methodology
change affects how AC12-tsc's proof is gathered; A4b adds an explicit constraint not previously
stated as a checklist item). These are plan-completeness changes to the checklist and Blast Radius,
not just prose polish — per the same "proving strategy materially changed" test the prior
Refresh Note used for the project-ref finding.

**Orchestrator action expected:** re-run PVL from V1 for this plan before EXECUTE is spawned, per
`process/development-protocols/orchestration.md` §Phase Program Pre-Routing Check Step 4b
(`generated-by: outer-pvl` + this note dated after the existing contract → re-validate). The
existing `## Validate Contract` below (Gate: CONDITIONAL, cycle 2) is now stale as of this note —
a PVL cycle 3 pass must confirm the new/changed steps (A0, B2b, D0/D1, A4b, E2b/E6) before EXECUTE.

---

## Validate Contract

Status: CONDITIONAL
Date: 29-07-26
date: 2026-07-29
generated-by: inner-pvl: phase-6
supersedes: 2026-07-25 (outer-pvl) — PVL cycle 3, triggered by the `## Inner Loop Refresh Note (29-07-26)` above (the 29-07-26 plan-supplement pass corrected Step A0's tooling premise, added B2b, corrected D0/D1 methodology, added A4b, and expanded Step E to 5 items). The cycle-2 contract (25-07-26, outer-pvl) addressed only the project-ref finding and is stale as of these additional changes.

Parallel strategy: sequential (unchanged from cycle 0-2 for the EXECUTE leg)
Rationale: Score 4/7 for THIS validate pass (S2 schema/API surface, S4 phase-program, S6 high-risk schema/migration class, S7 5+ blast-radius files) nominally suggests parallel-subagents/workflow for the Layer 1+2 fan-out itself, but this validate pass ran in a single agent context (no sub-agent spawn tool available in this invocation) — consistent with cycles 0-2's own single-context synthesis pattern recorded in their "independently re-verified this cycle" language. EXECUTE's own strategy is unchanged: Steps A→D remain a hard dependency chain, so sequential vc-execute-agent (opus) working Steps A→E in order is still correct — no new dependency structure was introduced by the 29-07-26 supplement.

## PVL Cycle 3 — Re-validation Summary (29-07-26)

**Trigger:** `## Inner Loop Refresh Note (29-07-26)` — the second plan-supplement pass (A0 tooling-premise correction, B2b merge-back guard, D0/D1 scratch-worktree + (file,code)-keyed methodology, A4b two-tier baseline rule, Step E expanded to 5 items). Full V1-V7 re-run per this session's task brief (do not early-exit).

**V1 pre-check (this cycle):**
- Plan file exists, readable, 16 `##` headings / 721 lines confirmed unchanged from the task brief's stated baseline.
- `validate-plan-artifact.mjs` (generic structural validator): 2 failures ("missing overview/context section", "missing Complexity metadata") — same validator-template mismatch flagged since cycle 0/2; confirmed non-blocking by cross-running `validate-phase-stub.mjs` (the correct validator for phase-program stubs): **0 failures, 0 warnings**. No action needed — pre-existing, program-wide characteristic (identical result pattern to `phase-05-billing_PLAN_25-07-26.md`, which passed cycle 0 cleanly).
- No `## Phase Ordering` section exists in this plan, so the Dependency-BLOCKED registry guard does not apply. Checked `phase-blast-radius-registry.md` anyway: only Phase 5 shows `status: DONE`; no phase shows `status: BLOCKED-skipped`. This plan's own Entry Gate ("Phases 1-5 exit-gate-passed") remains unmet outside PVL's own scope — confirmed still an Open Gap below, not a V1 blocker (PVL validates plan completeness, independent of sibling-phase execution state, per this plan's own Resume/Execution-Handoff text).
- No existing-contract early-exit: an Inner Loop Refresh Note dated 29-07-26 is strictly newer than the cycle-2 contract (25-07-26) — full V1-V7 re-run required and performed below, not an auto-proceed.

**Independently re-verified this cycle (not merely trusted from the plan text):**
- `supabase` CLI: `which supabase` fails, but `corepack pnpm --filter web exec supabase --version` exits 0 and prints `2.22.6` — confirms the 29-07-26 A0 correction is factually accurate (the CLI is a working workspace devDependency, not absent). `pg_dump`/`psql`/`docker` genuinely absent (`which` fails for all three) — matches the corrected A0 text, which now treats these as a lower-priority fallback path only.
- `apps/web/package.json:7` still carries the stale `--project-id 'vucvdpamtrjkzmubwlts'` — expected, A-0c is an EXECUTE-time fix.
- `supabase/config.toml:3` still `project_id = "21st"` — matches A-0b's reconciliation table.
- `apps/web/types/supabase.ts`: independently confirmed all 4 Phase-2 embedding functions present (`vec_dim`, `get_missing_usage_embedding_items`, `insert_embedding`, `insert_code_embedding`) and confirmed **zero** other authored-but-unapplied objects (checked specifically for Phase 1's `public_profiles` view — **0 matches**, not present). This confirms B2b's merge-back scope is complete: no other in-flight-but-unapplied schema object would be silently deleted by a wholesale regen beyond the 4 functions B2b already names.
- `supabase/*.sql` loose-file count is now **9**, not the "8" cited in the cycle-2 contract — the ninth is `supabase/seed-embedding-verification.sql` (Phase 3's authored-but-not-applied seed file, added to disk after cycle 2). Confirmed this is exactly the scenario A4b's two-tier baseline rule is designed for: this file must stay a separately-numbered migration, never folded into `0000_baseline.sql`. No plan defect — A4b's existing generic language ("Phase 3's seed") already covers it. Non-blocking drift, noted for audit trail.
- `apps/web/prisma/schema.prisma` — confirmed via `phase-05-billing_REPORT_29-07-26.md:371` that Phase 5 already independently found and is handling its own stale-column gap in this file. Phase 6's Blast Radius correctly excludes `schema.prisma` — this is a deliberate, evidence-backed scope boundary (Phase 5's job, not Phase 6's), not a completeness gap. Recorded as an Open Gap acknowledgment below for audit-trail completeness, not a defect.
- **NEW FINDING — repoint completeness (Blast Radius gap).** Repo-wide grep for `vucvdpamtrjkzmubwlts` (excluding node_modules/.next/tmp/.git) found the stale ref in **2 additional live files not in this plan's declared Blast Radius/Touchpoints**: `scripts/embed-all-demos.js:36` (a hardcoded Edge Function fetch URL — `https://vucvdpamtrjkzmubwlts.supabase.co/functions/v1/embed-oai` — reached by `node scripts/embed-all-demos.js`, a standalone ops script outside the `apps/*`/`packages/*` pnpm workspace but still a real, runnable live code path) and `apps/web/components/features/admin/SubmissionCard.tsx:21-22` (two hardcoded Supabase-dashboard deep-link URLs for admin convenience). Confirmed this script reads its Supabase client env correctly (`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_KEY` from `apps/web/.env`, so the DB read is against the correct live project) but then POSTs to a hardcoded Edge Function URL on the WRONG (stale) project — the same bug class this phase exists to fix, in a file the plan never named. See **Execute-Agent Instruction E-new-1** below.
- **NEW FINDING — test-baseline exit-gate ambiguity.** The current contract's AC12-regression row and Exit Gate text ("all tests pass, no regression") cite "48/48 across 15 files" — this is stale. The authoritative current baseline per `process/context/tests/all-tests.md` (re-confirmed twice independently by Phase 05's own EVL, same-day 29-07-26) is **114 tests / 24 files, 113 PASSING / 1 pre-existing failing** (`apps/web/lib/registry.test.ts`, carried since Phase 01, unrelated to this program). Taken literally, "all tests pass" is currently impossible to satisfy and could cause EXECUTE to either chase a phantom regression or leave the gate ambiguously interpreted. This is judged CONCERN, not FAIL, because execute-agent's mandatory context-loading step always re-reads `process/context/tests/all-tests.md` before running gates (so the correct current baseline will be visible regardless of what number is baked into this contract) — but the Exit Gate's literal wording still needs the explicit "zero NEW failures vs. the current baseline, 1 known pre-existing failure carried forward" framing so there is no ambiguity about what "pass" means. See **Execute-Agent Instruction E-new-2** below.
- **NEW FINDING — D0/D1 scratch-worktree copy-step gap.** Steps D0/D1 (corrected this supplement to use a disposable scratch worktree + (file, error-code)-keyed diffing) do not explicitly state that the regenerated `types.ts` (and any Step D2 fallout fixes) must be copied into the scratch worktree before running D1's AFTER `tsc --noEmit` capture. As literally written, an executor could run D1 in the scratch worktree without ever placing the new `types.ts` there, producing a diff identical to D0 (vacuously "zero new errors") regardless of what the actual regeneration did to the live working tree — the exact "vacuous green" failure pattern the harness's Net-Gate rule bans. This does not invalidate AC12's primary proof (the Agent-Probe live-catalog-diff rows, AC12-baseline/AC12-types, are unaffected and remain the authoritative accuracy proof), so it is judged CONCERN rather than FAIL — AC12-tsc is explicitly tagged "(supporting)" in the Verification Evidence table, not the primary proof. See **Execute-Agent Instruction E-new-3** below.
- **NEW FINDING — missing B2b-specific test gate.** No row in the current Test Gates table specifically proves the 4 Phase-2 embedding-function declarations (with their `// PENDING MIGRATION` comment) survive the B2 regeneration. Added as a new Fully-Automated row (`AC12-b2b-mergeback`) below.
- RPC call-site grep re-run (macOS `-E`, not `-P`): 21 unique `.rpc()` names, unchanged, matches the "21 confirmed-called RPCs" claim exactly.
- `lemonsqueezy` / `themes` / `local_users` claims: not independently re-verified again this cycle (already re-verified twice, cycles 1 and 2, byte-identical results both times) — no reason to expect drift since these are static prose corrections, not live-state facts; carried forward as PASS.

**Verdict on the two carried FAILs from cycles 0-1:** both remain resolved at plan-completeness level (project-ref repoint checklist chain A-0b→A-0c→B5 is intact and unchanged; B2b's merge-back scope is now independently confirmed *complete*, not just present). **Zero FAILs found this cycle.** Four NEW CONCERNS found (repoint completeness, test-baseline exit-gate ambiguity, D0/D1 copy-step gap, missing B2b test gate) — none block the phase's own stated purpose or its primary (Agent-Probe) proof of correctness; all four are closeable via Execute-Agent Instructions without further plan-structure rewrites.

Test gates (C3 5-column table — ADDITIVE; existing consumers still parse the legacy line form below it):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC12-baseline | `supabase/migrations/` baseline accurately reproduces the live schema (and excludes unapplied SQL per A4b) | Agent-Probe | Manual diff: live introspection (pg_proc/pg_class/information_schema — 33 fns/4 views/41 tables) vs authored `0000_baseline.sql` + folded files | A |
| AC12-types | `apps/web/types/supabase.ts` matches live catalogs with zero gaps | Agent-Probe | Live catalog diff of regenerated `types.ts` (via `corepack pnpm --filter web types`, run only after A-0c repoints the script) against live introspection | A |
| AC12-b2b-mergeback | Phase 2's 4 not-yet-live embedding-function declarations survive B2's regeneration, tagged `// PENDING MIGRATION` | Fully-Automated | `grep -c "PENDING MIGRATION" apps/web/types/supabase.ts` returns ≥4, cross-checked against `grep -cE "vec_dim|get_missing_usage_embedding_items|insert_embedding|insert_code_embedding" apps/web/types/supabase.ts` returning ≥4 | B (new gate this cycle) |
| AC12-rpc-xref | Every `.rpc()` call site in `apps/web` has a matching `CREATE FUNCTION` in migrations | Fully-Automated | `grep -roE "\.rpc\(['\"][a-zA-Z_0-9]+" apps/web --include="*.ts" --include="*.tsx" \| sort -u` cross-referenced against `grep -roE "CREATE (OR REPLACE )?FUNCTION [a-zA-Z_0-9]+" supabase/migrations/**/*.sql \| sort -u` — zero call-site-only entries | A |
| AC12-tsc | `tsc --noEmit` is green after phantom-type removal + fallout fixes, captured in a scratch worktree with the regenerated `types.ts` and Step D2 fixes copied in before the AFTER capture | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` exits 0 in the scratch worktree, diffed against the D0 baseline by (file, error-code) tuples — see Execute-Agent Instruction E-new-3 for the required copy step | B |
| AC12-regression | No NEW test failures vs. the current baseline (114 tests / 24 files, 113 passing / 1 known pre-existing failure in `lib/registry.test.ts`, unrelated to this phase) | Fully-Automated | `corepack pnpm --filter web test` — confirm zero new failures vs. the count in `process/context/tests/all-tests.md` at EXECUTE time (NOT a literal "100% pass" bar — see Execute-Agent Instruction E-new-2) | A |
| AC12-build | Production build unaffected | Fully-Automated | `corepack pnpm --filter web build` exits 0 | A |
| AC14-context | ≥5 named `all-context.md` stale claims corrected (E1-E4, E2b, E6 per the 29-07-26 supplement's expanded scope) + routing intact | Hybrid | `node .claude/skills/vc-audit-context/scripts/validate-context-discovery.mjs` exits 0 (structural) + manual diff review of the corrected paragraphs (factual accuracy) | A |
| infra-tooling | `supabase` CLI available and authenticated before Step A runs (via workspace `corepack pnpm --filter web exec`, not global PATH) | Hybrid | Step A0's corrected auth-check (`corepack pnpm --filter web exec supabase projects list`); re-confirmed this cycle that the CLI itself works fine (`--version` exits 0) — only the live-auth state is genuinely unknown until EXECUTE | B |
| sql-lint | Authored migration SQL is syntactically valid — no SQL linter exists in this repo | — | — | D |
| project-ref-repoint | `apps/web/package.json`'s `"types"` script targets the verified live project ref, not the stale `vucvdpamtrjkzmubwlts` value | Hybrid | Steps A-0b + A-0c + B5 — plan-level fix confirmed complete and unchanged this cycle; execution still pending | B |
| repoint-completeness | No OTHER live code path still hardcodes the stale project ref after A-0c lands | Hybrid | Repo-wide `grep -rn "vucvdpamtrjkzmubwlts" --exclude-dir={node_modules,.next,tmp,.git}` — confirmed this cycle: 2 residual instances (`scripts/embed-all-demos.js:36`, `SubmissionCard.tsx:21-22`) exist outside this plan's declared scope; see Execute-Agent Instruction E-new-1 | B (new gate this cycle) |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies (Fully-Automated / Hybrid / Agent-Probe). Known-Gap is NEVER a `strategy:` value — it is a named residual row carried via gap-resolution D, never a strategy that proves a behavior. (`sql-lint` row unchanged from cycle 2, still compliant.)

Net-gate vacuous-green check: the `sql-lint` Known-Gap row is not the ONLY coverage for its behavior — the Hybrid apply-to-scratch-DB substitute (Step A) remains in place. The new `AC12-tsc` copy-step concern is itself a vacuous-green RISK, not a realized vacuous-green state — it is closed by Execute-Agent Instruction E-new-3 before AC12-tsc is trusted, and AC12's primary proof (AC12-baseline/AC12-types, Agent-Probe) does not depend on AC12-tsc at all. No developed behavior in this phase's blast radius rests on Known-Gap alone; net gate remains a legitimate CONDITIONAL, not a vacuous PASS.

Legacy line form (retained so existing validate-contract consumers still parse):
- schema-baseline: [Agent-Probe: manual diff of migrations baseline vs live pg_proc/pg_class/information_schema catalogs]
- types-regen: [Agent-Probe: live catalog diff of regenerated types.ts via `corepack pnpm --filter web types`, run only after project-ref repoint]
- b2b-mergeback: [Fully-automated: grep confirms 4 embedding-function declarations + PENDING MIGRATION comments survive regen]
- rpc-xref: [Fully-automated: grep cross-reference of `.rpc()` call sites vs `CREATE FUNCTION` definitions]
- tsc-fallout: [Fully-automated: `corepack pnpm --filter web exec tsc --noEmit` in a scratch worktree with regenerated types.ts + D2 fixes copied in, diffed against D0 baseline]
- regression: [Fully-automated: `corepack pnpm --filter web test`, zero NEW failures vs the 114/24 (1 known pre-existing) baseline]
- build: [Fully-automated: `corepack pnpm --filter web build`]
- context-corrections: [hybrid: `node .claude/skills/vc-audit-context/scripts/validate-context-discovery.mjs` + manual diff review]
- tooling-precheck: [hybrid: `corepack pnpm --filter web exec supabase projects list` auth check]
- sql-lint: [known-gap: documented — no SQL linter in repo; Hybrid apply-to-scratch-DB substitutes]
- project-ref-repoint: [hybrid: derive live ref from env config (privacy-gated, values never printed) + repoint `package.json` script + confirm regenerated types.ts counts match live introspection]
- repoint-completeness: [hybrid: repo-wide grep for the stale ref after A-0c lands, confirming no other live code path still hardcodes it — or the 2 known residual instances are explicitly documented as out-of-scope with a backlog note]

Failing stub:
test("should confirm every apps/web .rpc() call site has a matching CREATE FUNCTION in supabase/migrations", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: RPC-to-migration cross-reference check")
})

Failing stub:
test("should have zero new tsc errors vs the D0 pre-regen baseline (scratch worktree, regenerated types.ts + D2 fixes copied in) after types.ts regeneration", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: tsc --noEmit fallout diff vs D0 baseline in scratch worktree")
})

Failing stub:
test("should introduce zero NEW vitest failures vs the 114/24 (1 known pre-existing) baseline after types.ts regeneration and fallout fixes", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: full regression suite, zero new failures vs current baseline")
})

Failing stub:
test("should produce a successful production build after types.ts regeneration", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: pnpm --filter web build exits 0")
})

Failing stub:
test("should reject regenerating types.ts while package.json's types script still targets the pre-repoint project id", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: project-ref repoint guard (PVL supplement 25-07-26)")
})

Failing stub:
test("should preserve vec_dim/get_missing_usage_embedding_items/insert_embedding/insert_code_embedding declarations tagged PENDING MIGRATION after types.ts regeneration", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: B2b merge-back guard")
})

Failing stub:
test("should find zero remaining live references to the stale project ref vucvdpamtrjkzmubwlts after the repoint, excluding explicitly-documented residual/backlog instances", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: repoint-completeness repo-wide grep")
})

Dimension findings:
- Infra fit: PASS (upgraded from CONCERN, cycle 0-2) — re-confirmed this cycle that the 29-07-26 A0 correction is factually accurate: `supabase` CLI IS available (workspace devDependency, works via `corepack pnpm --filter web exec supabase --version`, exit 0). The only remaining unknown is live authentication, which is correctly handled as a Hybrid gate (Step A0's auth-check), not a plan-completeness concern. `pg_dump`/`psql`/`docker` remain genuinely absent but are explicitly a lower-priority fallback-of-a-fallback per the corrected A0 text, not required for the primary `gen types` path.
- Test coverage: CONCERN (downgraded from PASS, cycle 2) — new finding: AC12-regression's baseline count and the Exit Gate's literal "all tests pass" wording are stale/ambiguous against the current 114/24 (1 known pre-existing failure) baseline. Also: no dedicated test gate existed for B2b's merge-back guarantee (added this cycle as AC12-b2b-mergeback). Both closed via Execute-Agent Instructions + new gate rows, not a plan-structure defect.
- Breaking changes: PASS (unchanged) — no live RPC/behavior changes; project-ref repoint is dev-tooling only.
- Security surface: PASS (unchanged) — no auth/billing/secrets touched; A-0b's env-file read remains privacy-gated (this session independently confirmed only file EXISTENCE was checked via `ls`, no env-file CONTENTS were read or printed, consistent with the privacy-gate requirement — a `.env` read attempt was in fact blocked by the standing privacy hook mid-session, confirming the gate is live and enforced).
- Section A feasibility (Baseline): PASS — mechanical targets re-confirmed (now 9 loose `supabase/*.sql` files, up from 8 at cycle 2 — the ninth, `seed-embedding-verification.sql`, is Phase 3's authored-but-unapplied seed file and is correctly excluded from the baseline by A4b's existing two-tier rule; no plan defect, confirmed by direct inspection this cycle).
- Section B feasibility (types.ts regen): PASS — B2b's merge-back scope independently confirmed *complete* this cycle (grepped current `types.ts` for other authored-but-unapplied objects, e.g. Phase 1's `public_profiles` view — zero matches, confirms nothing else needs a similar guard).
- Section C feasibility (RPC cross-reference): PASS — 21 unique `.rpc()` call-site names re-confirmed via grep this cycle, unchanged.
- Section D feasibility (tsc fallout): CONCERN (downgraded from PASS, cycle 2) — new finding: the scratch-worktree D0/D1 methodology, while correctly identifying the need for a disposable worktree, does not explicitly instruct copying the regenerated `types.ts` + Step D2 fixes into that worktree before the AFTER capture, risking a vacuously-green diff. Closed via Execute-Agent Instruction E-new-3.
- Section E feasibility (doc corrections): CONCERN (downgraded from PASS, cycle 2) — new finding: 2 additional live stale-ref instances exist outside this plan's declared Blast Radius (`scripts/embed-all-demos.js:36`, `SubmissionCard.tsx:21-22`); if E4's "root-cause now corrected" claim doesn't name these residual instances, it would be factually incomplete. Closed via Execute-Agent Instruction E-new-1. All 5 named corrections (E1-E4, E2b, E6) remain independently accurate per cycles 1-2's verification (not re-run this cycle — static prose facts, no drift expected).

Execute-Agent Instructions (new this cycle — apply during EXECUTE, in addition to all prior-cycle instructions still in force):
- E-new-1: Before finalizing Step E, either (preferred, low-risk, ~3-line change) fix the 2 residual stale-ref instances found this cycle (`scripts/embed-all-demos.js:36`'s hardcoded Edge Function URL; `SubmissionCard.tsx:21-22`'s 2 hardcoded dashboard deep links) to use the verified live ref from A-0b, OR explicitly document both as named residual instances of the same root-cause bug in the E4 correction (not silently omitted), with a backlog note if not fixed. Do not let E4 claim the project-ref problem is "fully resolved" without addressing or naming these 2 instances.
- E-new-2: Before treating AC12-regression as green, read the CURRENT baseline from `process/context/tests/all-tests.md` (as of this contract: 114 tests / 24 files, 113 passing / 1 known pre-existing failure in `lib/registry.test.ts`, unrelated to this program) and require zero NEW failures relative to that baseline — not a literal 100%-pass bar, since the pre-existing failure is out of this phase's scope to fix.
- E-new-3: Before treating AC12-tsc/D1 as green, explicitly copy the regenerated `types.ts` (and any Step D2 fallout-fix files) into the scratch worktree used for D0, so the AFTER capture actually reflects the regeneration — do not run D1 against an unmodified scratch worktree.

Open gaps:
- Supabase CLI / `pg_dump` environment readiness — Hybrid gate (Step A0); the CLI itself is now confirmed working via workspace exec, so only live-auth state remains genuinely unknown until EXECUTE. Unchanged risk profile from cycle 1-2, improved evidence this cycle.
- SQL syntax linting — Known-Gap, documented; Hybrid apply-to-scratch-DB substitute in place. Unchanged.
- Phase 6's own Entry Gate ("Phases 1-5 exit gates all passed") is not yet fully met — Phase 5 shows `status: DONE` in the registry; Phases 1-4 do not yet show a completion marker there. This is expected outer-PVL sequencing (all 6 phase plans validated up front, Phase 6 EXECUTE gated behind Phases 1-5 by its own Entry Gate and the orchestrator's routing) — not a defect in this plan.
- `apps/web/lib/catalog.ts` absence — covered by (now-required) E6, unchanged.
- `apps/web/prisma/schema.prisma` is out of this phase's Blast Radius by deliberate scope choice — Phase 5 already found and is separately handling its own stale-column gap in this file (confirmed via `phase-05-billing_REPORT_29-07-26.md:371` this cycle). Not a Phase 6 completeness gap.
- Residual EXECUTE-time risk on the project-ref fix (not a plan defect): A-0b's live-ref derivation happens AT EXECUTE TIME; if the live ref has changed again since this VALIDATE pass, A-0b's own re-derivation step protects against it, not any assumption carried from VALIDATE.
- NEW — 2 residual stale-ref instances outside declared scope (`scripts/embed-all-demos.js:36`, `SubmissionCard.tsx:21-22`) — see Execute-Agent Instruction E-new-1; resolvable in-plan (preferred) or via backlog note.
- NEW — test-baseline citation staleness is expected to recur (multiple sibling phases are landing tests concurrently); execute-agent must always re-read `process/context/tests/all-tests.md` at EXECUTE time rather than trusting any number baked into this contract, per Execute-Agent Instruction E-new-2.

What this coverage does NOT prove:
- AC12-rpc-xref (grep cross-reference) does not prove function BODY correctness or signature compatibility — only that a same-named `CREATE FUNCTION` exists.
- AC12-tsc / AC12-regression / AC12-build (tsc/test/build gates) do not prove the regenerated `types.ts` is byte-accurate against the live schema — only that the codebase compiles and existing behavior doesn't regress beyond the known pre-existing failure. Structural accuracy against the live DB is proven only by the Agent-Probe live-catalog-diff rows (AC12-baseline, AC12-types).
- AC14-context's `validate-context-discovery.mjs` proves structural/routing soundness only — factual accuracy is proven only by the paired manual diff review.
- None of these gates prove live production DDL behavior — this phase authors no live DDL.
- The Step A0 tooling pre-check proves local dev-environment tool availability at VALIDATE time (29-07-26, re-confirmed this cycle) only — it does not guarantee live-auth success at EXECUTE time without user involvement.
- The project-ref-repoint gate (A-0b/A-0c/B5) and the new repoint-completeness gate prove the checklist covers every KNOWN instance of the stale ref found by this cycle's repo-wide grep — they do NOT prove no further undiscovered instance exists anywhere in the repo (e.g. in binary artifacts, generated build output, or third-party vendored code not grepped this cycle).
- AC12-b2b-mergeback proves the 4 named function declarations survive regeneration — it does NOT prove their TYPE SHAPES remain byte-accurate to what Phase 2's actual migration will produce once applied live; that can only be confirmed after Phase 2's migration is genuinely applied and types.ts is regenerated again without the PENDING MIGRATION patch.

Gate: CONDITIONAL (0 FAILs — both cycle-0/1 FAILs remain resolved at plan-completeness level, independently re-confirmed this cycle; 6 accepted concerns total: 2 carried forward — infra tooling note now improved-but-still-open on live-auth, SQL-lint known-gap — plus 4 new this cycle — repoint completeness, test-baseline exit-gate ambiguity, D0/D1 copy-step gap, missing B2b gate — all four new concerns are closed via Execute-Agent Instructions E-new-1/2/3 and the new AC12-b2b-mergeback/repoint-completeness test-gate rows added above, not by further plan-structure rewrites). This contract supersedes the stale cycle-2 CONDITIONAL contract.

SUPPLEMENT REQUEST:
- Gap 1: Section E (doc corrections) | Concern: E4's root-cause correction may claim the stale-ref problem is fully resolved without naming 2 residual live instances (`scripts/embed-all-demos.js:36`, `SubmissionCard.tsx:21-22`) found by this cycle's repo-wide grep, outside the plan's declared Blast Radius | Severity: CONCERN | Suggested addition: Add an explicit checklist sub-item under Step E (e.g. E4b) requiring either a fix to both files or an explicit named-residual note with a backlog reference before E4 is treated as complete.
- Gap 2: Exit Gate / AC12-regression | Concern: "all tests pass, no regression" is stale/ambiguous against the current 114/24 (1 known pre-existing failure) baseline and could block the phase on an unrelated pre-existing failure if read literally | Severity: CONCERN | Suggested addition: Reword the Exit Gate's test-suite line to "zero NEW test failures vs. the current `process/context/tests/all-tests.md` baseline (1 known pre-existing failure in `lib/registry.test.ts` carried forward, unrelated to this phase)".
- Gap 3: Step D0/D1 (tsc fallout methodology) | Concern: the scratch-worktree instructions do not explicitly require copying the regenerated `types.ts` + Step D2 fixes into the worktree before the AFTER capture, risking a vacuously-identical D0/D1 diff | Severity: CONCERN | Suggested addition: Add one explicit sentence to D1: "Before running the AFTER capture, copy the regenerated `apps/web/types/supabase.ts` and any Step D2 fallout-fix files into the scratch worktree so the diff reflects the actual regeneration."
- Gap 4: Test Gates table | Concern: no dedicated gate proves the B2b merge-back guarantee (4 embedding-function declarations + PENDING MIGRATION comment survive regeneration) | Severity: CONCERN | Suggested addition: Add the `AC12-b2b-mergeback` row (already reflected in this contract's Test Gates table above) to the plan's own Verification Evidence section for consistency.

Accepted by: session (autonomous, per umbrella `## Autonomous Execution Rules` — "Agent self-decides at all V5 gates... CONDITIONAL net gate: proceed autonomously, fixes applied in-flight, gaps on record"). Accepted concerns, this cycle: (1) Infra fit residual — live-auth state unknown until EXECUTE, Hybrid gate in place; (2) SQL-lint Known-Gap, Hybrid substitute accepted (both carried unchanged from cycle 0-1); (3) repoint completeness — 2 residual stale-ref instances, closeable via Execute-Agent Instruction E-new-1; (4) test-baseline exit-gate wording — closeable via Execute-Agent Instruction E-new-2; (5) D0/D1 copy-step gap — closeable via Execute-Agent Instruction E-new-3; (6) missing B2b test gate — closed by adding the AC12-b2b-mergeback row in this same contract. Per the routing table's "Gate: CONDITIONAL after N≥1 cycles" row (this plan already completed 2 prior supplement cycles), the orchestrator may elect either to run one more lightweight plan-supplement cycle folding the 4 SUPPLEMENT REQUEST items above into the checklist text (recommended, since 3 of the 4 are one-sentence additions), or to accept this contract's Execute-Agent Instructions as sufficient mitigation and proceed directly to EXECUTE once Phases 1-5's own exit gates are satisfied. No FAILs are outstanding either way.
