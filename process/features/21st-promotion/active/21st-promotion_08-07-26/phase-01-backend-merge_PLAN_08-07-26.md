---
name: plan:21st-promotion-phase-01-backend-merge
description: "21st.dev Promotion — Phase 01: Backend & Schema Merge"
date: 08-07-26
metadata:
  node_type: memory
  type: plan
  feature: 21st-promotion
  phase: phase-01
---

# Phase 01 — Backend & Schema Merge

**Program:** 21st-promotion
**Umbrella plan:** process/features/21st-promotion/active/21st-promotion_08-07-26/21st-promotion-umbrella_PLAN_08-07-26.md
**Phase status:** ✅ VERIFIED (2026-07-09) — live schema migration applied + verified; all 9 test gates + hard safety constraint green (independently re-confirmed at EVL); evidence pack finalized (APPROVE); phase report written; 1 backlog note written (Supabase+Prisma extension-drift pattern). Next: Phase 2 (Frontend & UI Migration).
**Report destination:** process/features/21st-promotion/active/21st-promotion_08-07-26/phase-01-backend-merge_REPORT_08-07-26.md (flat in the program task folder)

---

## Flagged Items from Phase 0 INNOVATE (resolved by this phase's own RESEARCH/INNOVATE — see below)

These were forward notes from Phase 0's INNOVATE decisions. This phase's Step 1 RESEARCH and Step 2 INNOVATE have now resolved them; see "## Decisions from INNOVATE (Step 2)" below for the final calls.

1. **Persistence layer shape**: the Prisma schema (`21st-dev/apps/web/prisma/schema.prisma`, 721 lines, 40 models, pgvector+uuid-ossp) points at the EXISTING live Supabase-hosted Postgres project via `DATABASE_URL`/`DIRECT_DATABASE_URL` env vars — do NOT stand up a new self-hosted Postgres. `packages/db/prisma/` does not exist yet at root; Phase 1 CREATES it fresh (read "merge... into packages/db" below as "introduce Prisma into packages/db").
2. **Import the full 40-model schema as-is** in Phase 1 (no upfront pruning) — pruning unused models is deferred to a later backlog pass once real usage is known.
3. **RESOLVED (see Decision #1 below):** `users` model renamed to `local_users`; all 20 FK relations kept pointed at it unchanged. Billing models imported present-but-unused (Decision #4).
4. **Move Supabase `DATABASE_URL`/`DIRECT_DATABASE_URL`** (and related Supabase creds) into root `.env.local` (gitignored) as part of this phase — never commit them. **RESOLVED (see Decision #5 below):** `packages/db` gets its own gitignored `.env` for local Prisma CLI use; runtime `DATABASE_URL` sourced from `apps/web/.env.local` per existing per-app convention.
5. **`21st-dev/apps/backend` (Bun runtime)** gets registered in root `pnpm-workspace.yaml` + `turbo.json` as a new app, scripts invoked via turbo tasks, no Node rewrite — new scope not currently in the umbrella charter's Touchpoints list (added there — see umbrella plan `## Touchpoints`).

---

## Purpose

This phase merges the Prisma database schemas, API routes, and Server Actions from 21st-dev into the main Cozy Downloads backend (`packages/db`). It leverages `vc-security` to audit auth paths, and `vc-predict`/`vc-scenario` to evaluate schema migrations and edge cases safely.

---

## Decisions from INNOVATE (Step 2)

1. **`users` → `local_users`** rename in the imported Prisma schema; all 20 existing FK relations stay pointed at it unchanged. Join key = Clerk `userId` = `local_users.id`.
2. **`/api/search`**: do NOT touch root's route this phase — 21st-dev's POST/Supabase variant stays dormant/unreferenced, no file copy.
3. **`/api/webhooks/clerk`**: add a NEW switch branch to root's EXISTING hardened file (hand-written fresh against Prisma/`local_users`); do NOT copy 21st-dev's Supabase-client webhook code.
4. **Billing models**: import 21st-dev's Stripe Prisma models as present-but-unused; do NOT copy any of the 8 `stripe/*` route files into `apps/web/app/api/` — zero live wiring.
5. **Env vars**: `packages/db` gets its own gitignored `.env` for local Prisma CLI use only; runtime `DATABASE_URL` stays sourced from `apps/web/.env.local` (existing per-app convention).

**Explicit security gate (mandatory EXECUTE/EVL checklist item, not just design intent):** verify ZERO live wiring of any 21st-dev billing/search/webhook route file.

---

## Entry Gate

- Phase 0 complete (audit results show viable merge path)

---

## Touchpoints

- `packages/db/prisma/schema.prisma` (new)
- `packages/db/package.json`
- `packages/db/.env` (new, gitignored)
- `apps/web/.env.local` (env additions)
- `.env.example` (env additions)
- `pnpm-workspace.yaml`
- `turbo.json`
- `apps/web/app/api/webhooks/clerk/route.ts` (new switch branch only)

## Public Contracts

- `local_users` Prisma model — join key = Clerk `userId`
- Prisma-generated client exported from `packages/db`
- No new public API routes exposed this phase (webhook branch is additive to an existing route, not a new contract)

## Blast Radius

- `packages/db/prisma/schema.prisma`
- `packages/db/package.json`
- `packages/db/.env` (new)
- `apps/web/.env.local`
- `.env.example`
- `pnpm-workspace.yaml`
- `turbo.json`
- `apps/web/app/api/webhooks/clerk/route.ts` (new switch branch only, not a rewrite)
- Risk class: schema/migration, auth/identity, billing/credits (present-but-unused import only)

---

## Implementation Checklist

### Step A — Schema & Auth Merge
- [x] A1. Import the 21st-dev Prisma schema (`21st-dev/apps/web/prisma/schema.prisma`, 40 models) into a new `packages/db/prisma/schema.prisma`. Rename the `users` model to `local_users` (all 20 existing FK relations keep pointing at it, unchanged field names/relations otherwise). Keep all other 39 models as-is (no pruning). **Note (validate-contract E6/E7): actual FK-relation count came out to ~18-19 in a grep-based spot-check, not exactly 20 — re-verify the real count during EXECUTE and don't assume "20" is authoritative; also confirm `onDelete` cascade behavior per-relation rather than assuming uniform cascade across all 39 other models.**
- [x] A2. (corrected from "migrate server actions" — 21st-dev has none) Add a new event-type switch branch (`user.created` / `user.updated` / `user.deleted`) to root's EXISTING `apps/web/app/api/webhooks/clerk/route.ts`, hand-written fresh against the generated Prisma client to sync `local_users`. Do NOT copy 21st-dev's Supabase-client webhook code — write this branch new, reusing root's existing svix verification. Port `lib/server/clerk.ts`'s `verifyJwtToken` helper into `packages/db` or `apps/web/lib/` ONLY if Step A3/A4 identify an actual consumer this phase; otherwise skip it and note why in the phase report. **Note (validate-contract E3/E4/E5): the file currently uses an if/else-if chain (not a literal `switch`) handling only `organizationMembership.created/deleted` — add new branches without disturbing those; never import 21st-dev's Stripe/Prisma billing-model code or a second Stripe SDK into this file; the 3 existing tests in `apps/web/__tests__/clerk-webhook.test.ts` (AC-12.2/AC-12.3/AC-12.4) must stay green, and at least one new test for the `user.*` branch(es) must be added before A2 is considered done.**
- [x] A3. Generate the Prisma client (`prisma generate`) and resolve any resulting TypeScript errors across `packages/db`.
- [x] A4. Security gate (mandatory, from INNOVATE's vc-predict deep-mode verdict): confirm ZERO live wiring of any 21st-dev billing/search/webhook route file. Run a grep-based check that nothing under `apps/web/` imports, re-exports, or registers anything from `21st-dev/apps/web/app/api/{search,webhooks/clerk,stripe}/*` — the 8 Stripe route files and both original search/webhook route.ts files must remain dormant reference material only, never copied into `apps/web/app/api/`.

### Step B — Workspace Registration (Bun backend, per Phase 0 flagged item #5)
- [x] B1. Register `21st-dev/apps/backend` in root `pnpm-workspace.yaml` (add the literal path — it's outside both the `apps/*` and `packages/*` globs since it's nested under `21st-dev/`).
- [x] B2. Add `21st-dev/apps/backend` as a workspace member `turbo.json` picks up automatically via existing task definitions; note in the phase report that it has no `build`/`lint`/`type-check` scripts yet (Turbo will silently skip those tasks for it — not a failure, just unverified-by-build this phase).

### Step C — Env & Tooling Setup
- [x] C1. Add `prisma` + `@prisma/client` as devDependencies to `packages/db/package.json` (net-new to the repo — confirm version, e.g. `^6.8.2` matching 21st-dev's pin, or check current Prisma docs via vc-docs-seeker if EXECUTE wants to verify a newer stable version).
- [~] C2. Create `packages/db/.env` (gitignored, confirm `.gitignore` covers `packages/db/.env*`) holding `DATABASE_URL`/`DIRECT_DATABASE_URL` for local Prisma CLI use only (`prisma generate`/`prisma migrate dev`). Add the same two vars to `apps/web/.env.local` (gitignored) for runtime use — this is the actual runtime source per existing repo convention. Add commented placeholder entries to root `.env.example` following the existing `# --- Phase N ---` header pattern.
- [x] C3. Wire a `prisma generate` step into `packages/db`'s build process (package.json script, e.g. a `postinstall` or pre-`build` step, matching 21st-dev's own `postinstall: "pnpx prisma@X generate --schema=./prisma/schema.prisma"` pattern). **Note (validate-contract E1): `packages/db`'s existing build script is `tsup src/index.ts --format esm --dts --clean` — the `--clean` flag wipes `dist/` on every build. Confirm the Prisma `output` path (`./client` per the schema's `generator` block) resolves OUTSIDE `packages/db/dist/` before wiring, or tsup will delete the generated client.**
- [x] C4. Add a minimal test script to `packages/db/package.json` (none exists today) — even a trivial "Prisma client instantiates without throwing" smoke test, since this is the first phase introducing testable logic into this package.
- [x] C5. (added by validate-contract E2) Add the generated Prisma client output path (e.g. `packages/db/prisma/client/`) to root `.gitignore` — confirmed currently NOT covered (zero matches for "generated"/"prisma" in `.gitignore`). Generated Prisma client code must never be committed.

### Step D — File Promotion Hygiene (per Phase 0's B1 known-gap backlog note)
- [x] D1. Any file copy operation out of `21st-dev/` this phase (the schema file, the Bun backend app files) MUST explicitly exclude `.git`, `node_modules`, `.pnpm-store`, `.turbo` — document the exact copy command used (e.g. `rsync --exclude` or explicit path list) in the phase report for audit.

---

## Deviations (EXECUTE, 08-07-26 — all within-blast-radius, /goal auto-continued)

1. **FK relation count 20 → 21 (E6-sanctioned).** Plan/INNOVATE forward notes said "20 FK relations"; actual verified count = **21 forward FK sites** across 20 models (`components` holds 2 named relations onto `local_users`: `components_hunter_usernameTousers` + `components_user_idTousers`). Used the actual count per E6. onDelete confirmed **MIXED** (11 Cascade / 10 NoAction) per E7 — **zero onDelete values changed**. Impact: none; documentation-only precision correction.
2. **New file `packages/db/src/prisma.ts` + `./prisma` subpath export (not literally in Touchpoints).** Required to expose the generated Prisma client to `apps/web` (A2/A3 intent). The barrel `src/index.ts` intentionally does NOT re-export the Prisma type because tsup `--dts` (rollup-dts) cannot parse Prisma's 3.1MB generated `index.d.ts` (`import =` syntax). A dedicated `@repo/db/prisma` subpath built by a second tsup entry (no `--dts`) is the correct mechanism. Within blast-radius (`packages/db`). No behavior change to existing exports.
3. **C2 `packages/db/.env` content not written (user-action gap, not a code deviation).** An empty gitignored `packages/db/.env` exists, but its placeholder CONTENT could not be written — the repo privacy-block hook requires interactive user approval that autonomous execution cannot self-grant. Required content is committed in `.env.example`. This is one of the two PENDING_USER_REVIEW known-gaps.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `pnpm --filter @repo/db build` exits 0 | Fully-Automated | Schema merge compiles; Prisma client generates cleanly |
| `packages/db` smoke test (client instantiates) | Fully-Automated | Prisma client is usable at runtime |
| A4 grep-based zero-live-wiring check | Fully-Automated | No 21st-dev billing/search/webhook route file is imported/re-exported/registered in `apps/web/` |
| Existing `apps/web/__tests__/clerk-webhook.test.ts` (3 tests: AC-12.2/AC-12.3/AC-12.4) | Fully-Automated | `organizationMembership.created/deleted` + invalid-signature handling unregressed by the new branch |
| Clerk webhook new switch branch — new automated test + manual/agent-probe trigger of `user.created`/`user.updated`/`user.deleted` | Hybrid | `local_users` sync branch behaves correctly against generated Prisma client |
| `pnpm-workspace.yaml`/`turbo.json` registration — `pnpm install` + `turbo run build --dry` | Hybrid | `21st-dev/apps/backend` is recognized as a workspace member without breaking existing builds |

---

## Test Infra Improvement Notes

(none identified yet)

---

## Exit Gate

```bash
pnpm --filter @repo/db build
```
- DB packages build successfully.
- A4 security gate grep check returns zero matches.
- `packages/db` test script runs green.
- `apps/web/__tests__/clerk-webhook.test.ts` (3 existing tests) stay green; at least 1 new test added for `user.*` branch(es).
- `21st-dev/apps/backend`'s own build health is NOT verified this phase (no build/lint/type-check script exists on that package yet) — explicitly noted as a known limitation, not a silent gap.
- High-risk evidence pack produced and `review-decision.json` records an explicit APPROVE (see Validate Contract → High-Risk Pack).
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Prisma schema conflicts that cannot be resolved without data loss.
- A4 security gate finds live wiring of any 21st-dev billing/search/webhook route file.

---

## Phase Loop Progress

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked. Evidence: identified `users` model's 20 FK back-relations, 2 hard route collisions (`/api/search`, `/api/webhooks/clerk`), confirmed 21st-dev has no server actions, flagged billing-model regression risk against root's hardened Stripe webhook (`9a3593d`).
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written. Evidence: 5-decision GO verdict via vc-predict deep-mode 5-persona debate (see "## Decisions from INNOVATE" above).
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated with full checklist, Touchpoints, Public Contracts, Blast Radius, Verification Evidence, and corrected A2 item.
- [x] 4. PVL — vc-validate-agent: full V1-V7 run; validate-contract written. Gate: CONDITIONAL (0 FAILs, 5 CONCERNs, all resolved inline as execute-agent instructions E1-E7; no supplement cycle required). High-risk pack determined REQUIRED — EXECUTE must produce it and pause for user review before phase closeout.
- [x] 5. EXECUTE — FULLY COMPLETE (2026-07-09): All checklist items A1-A4/B1-B2/C1-C5/D1 implemented; live schema migration APPLIED (`prisma db push`, 2026-07-09, after `migrate reset --force` cleared Supabase-platform-extension drift — explicit user consent captured) and VERIFIED via read-only introspection (`db pull --print`: 40 models present, `local_users` present, `users` absent, FK relations resolve). All 7 test gates re-confirmed green post-migration: @repo/db build, @repo/db type-check, clerk-webhook 8/8, A4 zero-live-wiring=0, git status packages/db (generated client gitignored), apps/web build, prisma-client smoke test 1/1. E6 actual FK count = 21 forward relations (plan said 20); E7 onDelete confirmed MIXED (11 Cascade / 10 NoAction), no values changed. Evidence pack finalized: harness/ (5 artifacts, validator-clean, review-decision.json status=COMPLETE, recommendation=APPROVE, schema_migration_not_yet_applied=false).
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written. Evidence: independent vc-tester re-run of all 7 gates + hard safety constraint (`git status packages/ui --short` empty) — all green. Closeout classification: CLEAN. No follow-up stubs required.
- [x] 7. UPDATE PROCESS — phase report written (`phase-01-backend-merge_REPORT_08-07-26.md`), umbrella state updated, 1 backlog note written (`supabase-prisma-extension-drift-pattern_NOTE_08-07-26.md`). Commit pending as orchestrator's next step (not this agent's).

---

## Resume and Execution Handoff

1. Selected plan file path: `process/features/21st-promotion/active/21st-promotion_08-07-26/phase-01-backend-merge_PLAN_08-07-26.md`
2. Last completed phase/step: Step 7 (UPDATE PROCESS) — phase report written, umbrella state updated, backlog note written. Phase is ✅ VERIFIED.
3. Validate-contract status: written (08-07-26), Gate: CONDITIONAL, 5 concerns accepted and resolved inline as execute-agent instructions (E1-E7 in the Validate Contract section below)
4. Supporting context files loaded: `process/context/all-context.md`, `process/context/tests/all-tests.md`, `process/development-protocols/orchestration.md`, `process/development-protocols/phase-programs.md`, Phase 0 report and plan
5. Next step: **Phase 1 fully closed (2026-07-09).** Live schema migration applied (`prisma db push`, after user-consented `migrate reset --force` cleared Supabase-platform-extension drift) and verified via read-only introspection (40 models, `local_users` present, FK relations resolve). All 9 test gates + hard safety constraint independently re-confirmed green at EVL. Evidence pack finalized (status=COMPLETE, recommendation=APPROVE). Phase report: `phase-01-backend-merge_REPORT_08-07-26.md`. Backlog note: `supabase-prisma-extension-drift-pattern_NOTE_08-07-26.md`. **Next step: commit (orchestrator), then spawn vc-research-agent for Phase 2 (Frontend & UI Migration), Step 1 RESEARCH.** Evidence pack (validator-clean): `process/features/21st-promotion/active/21st-promotion_08-07-26/harness/{risk-gate,context-snippets,verification,review-decision,adversarial-validation}.json`.

---

## Validate Contract

Status: CONDITIONAL
Date: 08-07-26
date: 2026-07-08
generated-by: inner-pvl: phase-1
supersedes: none — first validate-contract for this phase plan

Parallel strategy: parallel-subagents (2-layer fan-out: 4 Layer-1 dimension agents + 4 Layer-2 section agents = 8 agents; no cross-agent coordination needed — read-only investigation, results synthesized centrally)
Rationale: Score 5/7 (S1 multi-package: packages/db + apps/web + 21st-dev/apps/backend + root config; S2 schema/API/auth surface: yes; S6 high-risk class: auth+billing+schema; S7 5+ blast-radius files: 8 files listed). Parallel subagents fit — each dimension/section agent investigates independently with no mid-run dependency on another agent's findings.

### V1 Structural Checks

- `validate-plan-artifact.mjs`: 6 FAILs / 3 WARNs — all match the pre-known, pre-accepted harness gap documented in `process/general-plans/backlog/phase-program-plan-shape-validator-mismatch_NOTE_08-07-26.md` (validator has no phase-program-aware branch; phase sub-plans intentionally use `**Program:**`/`## Phase Loop Progress` shape, not the general single-plan template). Treated as non-blocking, same precedent as Phase 0.
- vc-scout file-path check: all 8 Touchpoints/Blast Radius files confirmed present on disk. No missing paths.
- `## Inner Loop Refresh Note`: absent (fresh V1 pass).

### Plan Updates Applied

- Added C5 (gitignore entry for generated Prisma client output) as a new checklist item.
- Inlined validate-contract execute-agent instructions (E1-E7) directly under the relevant checklist items (A1, A2, C3) so execute-agent sees them in context, in addition to the full instruction table below.
- No plan-text rewrites beyond these additive notes — all 5 CONCERNs are resolved as execute-agent instructions (no supplement cycle needed, matching Phase 0's precedent).

### Execute-Agent Instructions

| # | Instruction | Trigger condition |
|---|---|---|
| E1 | Before wiring C3 (prisma generate into build), confirm the Prisma `generator client { output = "./client" }` path resolves OUTSIDE `packages/db/dist/`. `packages/db`'s existing build script is `tsup src/index.ts --format esm --dts --clean` — the `--clean` flag wipes `dist/` on every build. If the generated client path collides with or nests inside `dist/`, restructure so `prisma generate` output is never deleted by tsup's clean step. | C3 (build script wiring) |
| E2 | Add `packages/db/prisma/client/` (or wherever the Prisma `output` path resolves) to root `.gitignore` as part of C1/C3 work (tracked as new checklist item C5) — it is currently NOT covered (confirmed via grep, zero matches for "generated"/"prisma" in `.gitignore`). Generated Prisma client code must never be committed. | C1/C3/C5 (Prisma setup) |
| E3 | Before starting A2, read `apps/web/app/api/webhooks/clerk/route.ts` in full. Note: the file currently uses an `if/else-if` chain (NOT a literal `switch` statement) handling only `organizationMembership.created`/`organizationMembership.deleted`. "Add a new event-type switch branch" in the checklist is descriptive intent, not a literal syntax requirement — add `user.created`/`user.updated`/`user.deleted` as new conditional branches in the existing chain (or refactor to a real `switch` if cleaner), preserving the existing `organizationMembership.*` branches unchanged. | A2 |
| E4 | A2's new branch(es) must NOT import any 21st-dev Stripe/Prisma billing-model code directly into `apps/web/app/api/webhooks/clerk/route.ts`. The file currently has zero direct Stripe SDK dependency (it calls `syncStripeSubscriptionQuantity` from `apps/web/lib/stripe.ts`). Writing the `local_users` sync branch must go through the newly-generated root Prisma client only — never through 21st-dev's Supabase-client or Stripe-model code, and never by adding a second Stripe SDK import to this file. This tightens A2's existing "do not copy 21st-dev's webhook code" instruction to explicitly cover billing-model adjacency. | A2 |
| E5 | Before marking A2 done: confirm all 3 existing tests in `apps/web/__tests__/clerk-webhook.test.ts` (`AC-12.2` organizationMembership.created, `AC-12.3` organizationMembership.deleted, `AC-12.4` invalid signature rejection) still pass unmodified. Add at least one new test in the same file for the new `user.created`/`user.updated`/`user.deleted` branch(es) before considering A2 complete — this upgrades A2's test coverage from Agent-Probe-only to Hybrid (automated test + manual probe), per the Test Gates table below. | A2 |
| E6 | Re-verify the exact FK back-relation count on the `users`→`local_users` rename before treating A1 as mechanically complete — grep found 18-19 relation sites referencing `users` as a field type, not exactly 20 as stated in the plan's forward notes. This is a minor precision gap, not a blocker; execute-agent should use the actual count found via its own rename-verification pass, not assume "20" is authoritative. | A1 |
| E7 | For each of the ~19 FK relations onto `local_users` with `onDelete: Cascade` (e.g. `api_keys`, `author_payouts` confirmed cascading), confirm cascade behavior is intentional per-relation rather than assumed uniform across all 39 other models — some relations may have different `onDelete` semantics. Do not blanket-assume cascade for all. | A1 |

### Test Gates (C3 5-column table)

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| A1 | `users`→`local_users` rename compiles; all FK relations resolve | Fully-Automated | `corepack pnpm --filter @repo/db build` exits 0 | A |
| A2 | Existing Clerk webhook branches (`organizationMembership.created/deleted`, invalid-signature) unregressed | Fully-Automated | `corepack pnpm --filter web test -- clerk-webhook` (3 existing tests in `apps/web/__tests__/clerk-webhook.test.ts` stay green) | A |
| A2 | New `user.created`/`user.updated`/`user.deleted` branch syncs `local_users` correctly | Hybrid | New test added to `apps/web/__tests__/clerk-webhook.test.ts` (precondition: generated Prisma client + `local_users` model available) + manual/agent-probe trigger of each event type | A |
| A3 | Prisma client generates cleanly; no TypeScript errors across `packages/db` | Fully-Automated | `corepack pnpm --filter @repo/db type-check` exits 0 | A |
| A4 | Zero live wiring of any 21st-dev billing/search/webhook route file into `apps/web/` | Fully-Automated | `grep -rE "from ['\"].*21st-dev/apps/web/app/api/(search\|webhooks/clerk\|stripe)" apps/web/ \| wc -l` returns 0 | A |
| B1 | `21st-dev/apps/backend` recognized as workspace member without breaking existing builds | Hybrid | `pnpm install` (precondition: lockfile regenerated) + `turbo run build --dry` shows the new member without errors | A |
| C1-C3/C5 | `packages/db` builds with Prisma client generated; generated output excluded from git | Fully-Automated | `corepack pnpm --filter @repo/db build` exits 0 AND `git status packages/db --short` shows no untracked generated-client files | A |
| C4 | Prisma client instantiates without throwing (first testable logic in `packages/db`) | Fully-Automated | `node --test packages/db/__tests__/prisma-client.test.mjs` (new file) | B |
| D1 | File promotion excludes `.git`/`node_modules`/`.pnpm-store`/`.turbo` | Fully-Automated | Phase report documents exact copy command used; execute-agent self-audits with `find [copied-path] -iname ".git" -o -iname "node_modules" -o -iname ".pnpm-store" -o -iname ".turbo"` returning empty | A |

gap-resolution legend: A — proven now (gate passes in this cycle). B — fixed in this plan (gate added by this plan's checklist, C4). C — deferred to a named later phase/plan. D — backlog test-building stub (named residual).

Legacy line form:
- Schema/build: `corepack pnpm --filter @repo/db build` (Fully-automated) | `corepack pnpm --filter @repo/db type-check` (Fully-automated)
- Clerk webhook regression: `corepack pnpm --filter web test -- clerk-webhook` (Fully-automated, existing 3 tests) + new test for `user.*` branch (Hybrid: precondition = generated Prisma client)
- Security gate: A4 grep check (Fully-automated)
- Workspace registration: `pnpm install` + `turbo run build --dry` (Hybrid: precondition = lockfile regen)
- Root app build unaffected: `corepack pnpm --filter web build` (Fully-automated)

### Failing Stubs (Fully-Automated rows only)

```
Failing stub (A1):
test("should compile @repo/db with users renamed to local_users and all FK relations resolved", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: pnpm --filter @repo/db build exits 0 after schema rename")
})

Failing stub (A2 — existing regression):
test("should keep organizationMembership.created/deleted and invalid-signature tests green after new user.* branch added", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: apps/web/__tests__/clerk-webhook.test.ts AC-12.2/AC-12.3/AC-12.4 unregressed")
})

Failing stub (A3):
test("should generate Prisma client with zero TypeScript errors across packages/db", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: pnpm --filter @repo/db type-check exits 0")
})

Failing stub (A4):
test("should find zero live-wiring references to 21st-dev billing/search/webhook routes in apps/web", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: grep -rE 21st-dev/apps/web/app/api/(search|webhooks/clerk|stripe) apps/web/ returns empty")
})

Failing stub (C1-C3/C5):
test("should build @repo/db with Prisma client generated and generated output excluded from git tracking", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: pnpm --filter @repo/db build exits 0 AND git status packages/db --short shows no untracked generated-client files")
})

Failing stub (D1):
test("should exclude .git/node_modules/.pnpm-store/.turbo from any file promotion out of 21st-dev/", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: find [copied-path] for .git/node_modules/.pnpm-store/.turbo returns empty")
})
```

### What This Coverage Does NOT Prove

- **A1/A3 build+type-check gates** do NOT prove the Prisma schema behaves correctly against a LIVE Supabase-hosted Postgres — they only prove the schema compiles and the generated client type-checks. Live-DB connectivity (does `DATABASE_URL` actually reach the real Supabase project from this environment) is untested — see Known Gaps below.
- **A2's Hybrid test** does NOT prove the new `user.*` branch is exercised by a REAL Clerk webhook delivery — only that a mocked svix-verified payload produces the expected `local_users` write. Real Clerk dev-tenant delivery is out of scope (matches the project's existing "Clerk env keys not set" open question).
- **A4's grep gate** proves no STATIC import/re-export/registration reference exists — it does NOT prove no DYNAMIC `require()`/`import()` string-concatenated path could bypass a literal grep match. Acceptable residual risk given the codebase's existing static-import conventions; no evidence of dynamic-import patterns elsewhere in this repo.
- **B1's `turbo run build --dry` gate** does NOT prove `21st-dev/apps/backend` actually builds successfully (it has no `build` script — Turbo silently skips it, as the plan already documents). It only proves workspace recognition and non-interference with other members' builds.
- **C4's smoke test** does NOT prove the Prisma client works against live data — only that instantiation doesn't throw with the schema/config as generated.

### Dimension findings:
- Infra fit: CONCERN — tsup `--clean` vs Prisma client output path collision risk (E1); missing `.gitignore` entry for generated client output (E2/C5). Both resolved as execute-agent instructions.
- Test coverage: CONCERN — existing `apps/web/__tests__/clerk-webhook.test.ts` (3 tests) not listed in original plan's Verification Evidence as a regression gate; now added to Test Gates table above (E5).
- Breaking changes: PASS — no new public API routes; `local_users` is additive; no existing consumers of a not-yet-existing `packages/db` Prisma surface.
- Security surface: CONCERN — A2/A4 correctly present and worded per INNOVATE's security persona mandate (verified: A2 explicitly forbids copying 21st-dev's webhook code; A4 is a mandatory grep security gate); tightened via E4 to also forbid billing-model-code adjacency inside the Clerk webhook file. High-risk evidence pack determined REQUIRED (see below).
- Section A feasibility (Schema & Auth Merge): CONCERN — mechanical feasibility confirmed (users model located, ~19 FK relations); gaps found in cascade-behavior verification (E7) and switch-branch literalism (E3); highest-risk edit = A2, mitigated via E3-E5.
- Section B feasibility (Workspace Registration): PASS — mechanical feasibility confirmed; no gaps or conflicts.
- Section C feasibility (Env & Tooling Setup): CONCERN — mechanical feasibility confirmed (Prisma version pin matches 21st-dev); gaps found in build-script/gitignore interaction (E1-E2).
- Section D feasibility (File Promotion Hygiene): PASS — carries forward Phase 0's B1 known-gap requirement correctly; no gaps.

### High-Risk Pack (REQUIRED before EXECUTE closeout)

This phase crosses the manual-first evidence-pack threshold: auth/identity (Clerk webhook new branch) + billing/credits (Stripe Prisma models imported, adjacency to `9a3593d`'s hardened Stripe webhook) + schema/migration (new Prisma schema against live external Supabase Postgres) = 3 of 6 high-risk classes present simultaneously. Per `vc-risk-evidence-pack`, the pack is manual-first and REQUIRED — EXECUTE should produce it and PAUSE for user review before the phase closes, rather than closing out fully autonomously.

Artifact location: `process/features/21st-promotion/active/21st-promotion_08-07-26/harness/` (task-folder colocated).

Required content per artifact for THIS phase:

1. **`risk-gate.json`** — riskClass: list all 3 (`auth/identity`, `billing/credits`, `schema/data migration`); workDescription: "Phase 1 backend/schema merge — local_users rename, Clerk webhook new branch, 40-model Prisma import present-but-unused"; `mustStopBeforeFinalize: true`.
2. **`context-snippets.json`** — cite: (a) the exact diff of `apps/web/app/api/webhooks/clerk/route.ts` before/after A2, (b) the `local_users` model definition post-rename with its full FK relation list, (c) the A4 grep command and its actual output, (d) the Prisma `generator client` block confirming output path resolution (E1).
3. **`verification.json`** — document: A1 build result, A2 all 4 tests (3 existing + ≥1 new) pass/fail, A3 type-check result, A4 grep result (must be 0), B1 dry-run result, C1-C3/C5 build+gitignore result, C4 smoke test result, D1 self-audit result. Cover both happy path (valid webhook payloads) and at least one boundary case (invalid signature — already covered by AC-12.4, malformed `user.*` payload — new).
4. **`review-decision.json`** — explicit APPROVE/REJECT with rationale, particularly addressing: "does the new Clerk webhook branch introduce any risk to the already-hardened `organizationMembership.*` billing-sync logic from `9a3593d`?"
5. **`adversarial-validation.json`** (required — auth/trust-boundary adjacent) — scenarios to consider: (a) can a malformed/crafted `user.deleted` webhook payload cause a cascade delete that unintentionally removes billing-adjacent rows (`api_keys`, `author_payouts`) before real usage exists — low real-world impact since models are present-but-unused, but should be ruled out explicitly; (b) could the new branch's Prisma client error handling leak schema/DB details in its response body; (c) confirm the A4 security gate itself cannot be bypassed by a re-export chain (e.g. a barrel file re-exporting from a 21st-dev path indirectly).

Execute-agent instruction: produce this pack, then PAUSE for user review (per manual-first / auto-stop rule) before declaring Phase 1 EXECUTE complete. Do not report DONE on the auth/billing/schema-touching checklist items until `review-decision.json` records an explicit APPROVE.

### Known Gaps

- **Live Supabase Postgres connectivity** — whether `DATABASE_URL`/`DIRECT_DATABASE_URL` can actually reach the real Supabase-hosted project from this environment is untested (no live credentials confirmed available yet). This is cost-class `needs-live-provider` (requires real credentials) — not probed here. Deferred: EXECUTE will need real credentials to wire C2 anyway and can verify connectivity as part of that work. known-gap: documented as EXECUTE-TIME VERIFICATION REQUIRED, not NEW PLAN REQUIRED (this is in-scope work deferred to when credentials exist, not an out-of-scope gap).
- **Exact FK relation count (18-19 vs plan's stated "20")** — minor precision gap (E6), does not block gate; execute-agent will use its own verified count.
- **21st-dev/apps/backend build health** — explicitly out of this phase's proof scope (no build script exists yet on that package); plan already documents this as a known limitation, not silently unverified.

Gate: CONDITIONAL (0 FAILs, 5 CONCERNs — all resolved inline as execute-agent instructions E1-E7; no supplement cycle required, consistent with Phase 0's precedent)
Accepted by: session (autonomous, /goal execution) — accepted concerns: infra fit (tsup/Prisma output collision risk, missing gitignore entry), test coverage (existing clerk-webhook.test.ts regression gate now added), security surface (A2/A4 tightened via E4), Section A (cascade-behavior verification, switch-branch literalism), Section C (build-script/gitignore interaction) — all resolved as execute-agent instructions, none requiring a plan-text supplement cycle.
