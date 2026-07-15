---
name: plan:claymorphism-3d-redesign-phase-02-asset-generation-pipeline
description: "Claymorphism + 3D Pastel Soft UI — Phase 02: Asset Generation Pipeline (Gemini API)"
date: 14-07-26
metadata:
  node_type: memory
  type: plan
  feature: claymorphism-3d-redesign
  phase: phase-02
---

# Phase 02 — Asset Generation Pipeline (Gemini API)

**Program:** claymorphism-3d-redesign
**Umbrella plan:** process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/claymorphism-3d-redesign-umbrella_PLAN_14-07-26.md
**Phase status:** COMPLETE (CODE DONE — live seed batch deferred, user opt-in pending)
**Report destination:** process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-02-asset-generation-pipeline_REPORT_14-07-26.md (flat in the program task folder)

---

## Purpose

Build an `ops/`-conventioned Node script that calls the Gemini image-generation API using the
Phase 1 prompt templates to produce three asset classes: (a) small 3D soft-clay UI icons (nav,
feature, interaction icons — play button, heart, dashboard tile), (b) larger 3D
illustrations/avatars (characters, plants, abstract shapes) for hero/card decoration, and (c)
subtle matte/soft-noise background textures. The script must be unit-testable with a mocked
fetch, gracefully absent when `GEMINI_API_KEY` is unset (mirrors the existing R2 lazy-init
graceful-absence pattern), and write output as **whatever raw image format the Gemini API
returns** (confirmed `image/png` via `inlineData.mimeType` — see D2 below; NOT force-converted
to WebP; no new image-processing dependency). Gemini calls are ops-time/build-time only — never
wired into any runtime request path.

**Precedent correction (locked 15-07-26):** the closest real ops precedent in this repo is
`ops/seed-placeholder-components.mjs`, NOT `ops/github-ingest.mjs` / `ops/r2-client.mjs` /
`ops/__tests__/github-ingest.test.mjs` — RESEARCH (15-07-26) confirmed those three files do not
exist anywhere in this repo's git history. `seed-placeholder-components.mjs` establishes the
real local pattern: plain Node ESM, secrets read only from shell-exported env vars (never a
`.env` file, never printed), idempotent skip-if-exists behavior, and a never-throw
graceful-absence exit path with structured `console.warn(...)` + `exit 0`. This script follows
that same pattern.

---

## Entry Gate

- Phase 1 exit gate passed (triple-shadow tokens + palette hex codes + Gemini prompt template
  doc all locked)
- `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/gemini-prompt-templates_REF_14-07-26.md` exists and is readable

---

## Blast Radius

- New file: `ops/gemini-asset-gen.mjs`
- New file: `ops/gemini-prompts.mjs` — static data module (see D4/Step B2)
- New file: `ops/__tests__/gemini-asset-gen.test.mjs` — **this is the FIRST test file under
  `ops/__tests__/`** (no sibling pattern exists in this repo to mirror; the 4 test cases below
  stand on their own design, not copied from a prior test)
- New directory: `apps/web/public/clay/` (icons/, illustrations/, textures/ subfolders)
- `.env.example` — confirm/finalize `GEMINI_API_KEY` entry (added in Phase 1); **add
  `GEMINI_IMAGE_MODEL` entry** (new, see D1)
- Possibly: small addition to `package.json` scripts (e.g. `"assets:generate": "node ops/gemini-asset-gen.mjs"`)

---

## Implementation Checklist

### Step A — Confirm Gemini API contract before writing code

- [x] A1. Invoke `vc-docs-seeker` to confirm the exact current Gemini image-generation API
      request/response shape and pick the **DEFAULT** model id for `GEMINI_IMAGE_MODEL` (see D1
      below for the env-var mechanism). RESEARCH (15-07-26) already scoped the candidate model
      ids: `gemini-2.5-flash-image` (retiring ~Oct 2026 — do not select as default),
      `gemini-3.1-flash-image-preview`, `gemini-3-pro-image`. `vc-docs-seeker`'s job here is to
      confirm which of these (or a newer id) is the correct DEFAULT, not to hardcode a
      single id into the script.
- [x] A2. Record the confirmed API contract facts (locked at INNOVATE 15-07-26, restated here for
      implementers): REST endpoint `POST /v1/models/{model}:generateContent` (use `v1beta` for
      preview model ids); request body sets `generationConfig.responseModalities: ["TEXT",
      "IMAGE"]`; response image is base64-encoded at `candidates[0].content.parts[].inlineData`
      with fields `{mimeType, data}` — expected `mimeType` is `image/png` (see D2); approx cost
      ~$0.039/image at 1024px; Flash-tier free quota 15 RPM / 1500 RPD (relevant for seed-batch
      sizing in Step D).

### Step B — Build the ops script skeleton (mirrors ops/seed-placeholder-components.mjs conventions)

- [x] B1. Create `ops/gemini-asset-gen.mjs`: reads `GEMINI_API_KEY` AND `GEMINI_IMAGE_MODEL`
      from `process.env` only. **The script must NEVER read any `.env*` file** (D3, locked) —
      secrets are shell-exported only, e.g.:
      `GEMINI_API_KEY=... GEMINI_IMAGE_MODEL=... node ops/gemini-asset-gen.mjs`. If
      `GEMINI_API_KEY` is absent, log a structured warn (`console.warn('SKIPPED:
      GEMINI_API_KEY not set')`) and exit 0 (graceful absence — mirrors
      `ops/seed-placeholder-components.mjs`'s never-throw pattern), never throw. If
      `GEMINI_IMAGE_MODEL` is unset, fall back to the DEFAULT confirmed in A1; if the API
      responds 404 for the resolved model id, fail fast with an explicit error naming the env
      var: `"model retired — set GEMINI_IMAGE_MODEL"` (D1, locked — no silent fallback on a
      404, no hardcoded-only id). **PVL addition (15-07-26):** the script must NEVER
      `console.log`/print the raw `GEMINI_API_KEY` value at any point (only presence/absence
      and the resolved model id may be logged); confirm via A1's `vc-docs-seeker` step the
      actual HTTP status/error shape Gemini returns for an invalid/retired model id (may not
      literally be `404`) and match the fail-fast condition on whatever is empirically
      confirmed, rather than assuming exactly `404`.
- [x] B2. Create `ops/gemini-prompts.mjs` as a **static data module** (D4, locked) that
      duplicates the 3 JSON template blocks from
      `gemini-prompt-templates_REF_14-07-26.md` directly in code (drop the earlier
      "or parse the doc" branching — parsing the doc is not the chosen path). Consistency
      requirement: hex values embedded in this module must match the `_REF_` doc / `globals.css`
      palette exactly — lavender `#a490df`, pink `#f6b6c9`, peach `#fbd29d`, blue `#abd7f7`, mint
      `#aae4cf`, yellow `#f9e594`, cream `#ede9f6`. Test-infra note: the existing
      `apps/web/scripts/__tests__/gemini-prompt-templates.check.mjs` cross-check pattern can be
      extended (or mirrored) to assert this data module stays in sync with the `_REF_` doc — flag
      as a test-infra improvement if not done in this phase (see Test Infra Improvement Notes).
- [x] B3. Implement the three asset-class generation functions: `generateIcon(name, promptVars)`,
      `generateIllustration(name, promptVars)`, `generateTexture(name, promptVars)` — each calls
      the Gemini API per the confirmed contract (Step A2), reads the response's
      `inlineData.mimeType` to determine the actual returned format (expected `image/png`), and
      writes the raw bytes to `apps/web/public/clay/{class}/{name}.{ext}` using that mimeType's
      native extension. **No forced WebP conversion and no new image-processing dependency**
      (`sharp` explicitly rejected at INNOVATE) — this is a documented deviation from the
      original plan wording, which assumed WebP output without confirming the API's actual
      format.
- [x] B4. Add a manifest write step, `apps/web/public/clay/manifest.json` (D5, locked shape):
      keyed by `{assetClass}/{name}`; value = `{promptHash, generatedAt, model, format}` where
      `promptHash` = first 12 hex chars of `sha256(resolvedPrompt + model)` via Node's built-in
      `node:crypto`. Skip regeneration if the computed hash matches the manifest entry;
      regenerate if it differs (idempotent, avoids redundant billed API calls).

### Step C — Unit tests (mocked fetch, no live API calls)

- [x] C1. Write `ops/__tests__/gemini-asset-gen.test.mjs` using `node --test` with a mocked
      `fetch`/API client. This is the first test file under `ops/__tests__/` — there is no
      sibling file to mirror; the following 4 cases are the complete, self-contained spec:
      (1) graceful-absence when `GEMINI_API_KEY` is missing (exit 0, warn logged, no throw),
      (2) successful icon generation writes the expected file path with the correct
      mimeType-derived extension, (3) manifest correctly records a new asset (`promptHash`,
      `generatedAt`, `model`, `format` all present and correct), (4) manifest correctly skips an
      already-generated asset when the computed hash matches (idempotency). **PVL addition
      (15-07-26), closes a test-coverage gap found at V2:** (5) `GEMINI_IMAGE_MODEL` unset falls
      back to the A1-confirmed DEFAULT model id, (6) resolved model id returns the confirmed
      invalid-model error → script fails fast with the explicit `GEMINI_IMAGE_MODEL`-naming
      error message (no silent fallback) — this directly tests the D1 design decision.
- [x] C2. Confirm zero live network calls occur during `node --test ops/__tests__/gemini-asset-gen.test.mjs` (grep test file for actual `fetch(` calls — all must be mocked).

### Step D — Seed asset batch (conditional on live key)

- [x] D1. (Deferred — D2 path taken) `apps/web/.env.local` is privacy-gated and a live run is
      billed spend (a /goal hard-stop class); the key was not accessed this session. Live batch
      deferred to a user-approved run. See D2. IF `GEMINI_API_KEY` is set in the actual environment (confirmed present in
      `apps/web/.env.local` per Phase 1 research — value not printed): run the script once,
      via shell-exported env vars per B1, to generate a small seed batch (e.g. 5 icons, 2
      illustrations, 1 texture) sufficient for Phase 3/4 to wire into components. Keep the batch
      deliberately small: this repo has no `.gitattributes`/Git LFS tracking on disk (confirmed
      absent by RESEARCH 15-07-26, correcting the earlier all-context.md claim — flagged
      separately below), so generated binaries commit directly into `apps/web/public/` and ship
      to every VPS deploy; a small seed batch keeps that footprint bounded. Record the exact
      assets generated, their sizes, and the resolved `GEMINI_IMAGE_MODEL` value in the phase
      report.
- [x] D2. (TAKEN) No live assets generated this phase — CODE DONE. Known-gap recorded; Phase 3/4
      use placeholder asset paths until a user-approved live run happens. IF `GEMINI_API_KEY` is NOT set: document this as an explicit known-gap in the phase
      report — code + tests are complete (CODE DONE), but no live assets exist yet; Phase 3/4
      must use placeholder/mock asset paths until a live run happens, and this is called out in
      Phase 3/4's entry gate.

---

## Exit Gate

```bash
# Unit tests, mocked, no live API calls
node --test ops/__tests__/gemini-asset-gen.test.mjs
# Expected: all tests pass, 0 live network calls

# Build unaffected (new ops script is not imported by apps/web build)
corepack pnpm --filter web build
# Expected: exit 0

# Bundle-safety: no new runtime deps leak into apps/web bundle
corepack pnpm --filter web build 2>&1 | grep -E "(three|face-api|matter-js|ogl|gsap)" | wc -l
# Expected: 0
```

- All checklist items (A1-D2) checked
- `ops/gemini-asset-gen.mjs` exists, gracefully no-ops when key absent, never throws
- `ops/gemini-asset-gen.mjs` never reads any `.env*` file (D3 — grep for `dotenv`/`readFileSync.*\.env` returns 0 hits)
- Unit tests pass with mocked fetch
- Phase report documents whether a live seed batch was generated (D1) or the known-gap is
  recorded (D2), including the resolved `GEMINI_IMAGE_MODEL` value

---

## Blockers That Would Justify BLOCKED Status

- Gemini API contract cannot be confirmed via `vc-docs-seeker` (no reliable current
  documentation reachable) — escalate via `VC-FEASIBILITY-PROBE-NEEDED` if a live-provider probe
  is needed to confirm the request/response shape empirically (note: INNOVATE already locked D1/D2
  design decisions without a live probe — a probe would only be needed if `vc-docs-seeker`
  itself cannot confirm the current model id or endpoint shape)
- `GEMINI_API_KEY` absent AND no way to validate the script logic even with mocks — should not
  actually block, since mocked tests do not require a live key; only a true blocker if the API
  contract itself is unconfirmable

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent (15-07-26): confirmed `ops/github-ingest.mjs`,
      `ops/r2-client.mjs`, and `ops/__tests__/github-ingest.test.mjs` do NOT exist in this
      repo's history; identified `ops/seed-placeholder-components.mjs` as the real precedent;
      confirmed `GEMINI_API_KEY` present in `apps/web/.env.local`; confirmed no `.gitattributes`/
      Git LFS tracking exists on disk; scoped 3 candidate Gemini model ids and flagged the
      Oct 2026 retirement of `gemini-2.5-flash-image`.
- [x] 2. INNOVATE — innovate-agent (15-07-26): locked D1 (env-var model id + fail-fast 404),
      D2 (use API's actual returned format, no forced WebP, no new dep), D3 (shell-env secrets
      only, never `.env*`), D4 (`ops/gemini-prompts.mjs` static data module), D5 (manifest shape
      keyed by `{assetClass}/{name}` with sha256-based `promptHash`). Decision Summary written.
- [x] 3. PLAN-SUPPLEMENT — plan-agent (15-07-26): existing phase plan updated with all 5 locked
      decisions, precedent correction, and known-fact updates. See Inner Loop Refresh Note below.
- [x] 4. PVL — vc-validate-agent (15-07-26): full V1-V7 run; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md`. Gate: PASS.
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (D1 live batch deferred to a user-approved run per D2 known-gap; all Fully-Automated gates green)
- [x] 6. EVL — vc-update-process-agent (15-07-26): re-ran all 5 Fully-Automated gates
      independently (unit tests 7/7, zero-live-fetch check, no-dotenv-read check, web build exit
      0, bundle-safety grep 0) — all confirmed green. VE11/VE12 remain deferred per D2 known-gap
      (no follow-up stub needed — inherently sequenced to a user-approved live run, not an
      orphaned gap).
- [x] 7. UPDATE PROCESS — phase report written
      (`phase-02-asset-generation-pipeline_REPORT_14-07-26.md`), umbrella
      `## Current Execution State` updated, context docs updated, commit invoked.

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Inner Loop Refresh Note

**Date:** 15-07-26
**Trigger:** Step 3 PLAN-SUPPLEMENT (inner-loop plan refresh mode — RESEARCH + INNOVATE completed for this phase since the plan was first drafted 14-07-26).

**Sections changed:**
- `Purpose` — corrected output format claim (no forced WebP; API's actual returned format used)
- `Blast Radius` — added `ops/gemini-prompts.mjs`; added `GEMINI_IMAGE_MODEL` to `.env.example`; clarified test file is the first under `ops/__tests__/`
- `Step A` (A1, A2) — added D1 env-var model selection mechanism + full confirmed API contract facts
- `Step B` (B1-B4) — added D3 shell-env-only secrets rule, D4 static-data-module decision, D2 actual-format-write logic, D5 manifest shape with sha256 promptHash
- `Step C` (C1) — removed "4-test pattern" citation to nonexistent `github-ingest.test.mjs`; kept the same 4 test cases, now self-contained
- `Step D` (D1) — added scale/footprint note re: no LFS on disk; added GEMINI_API_KEY-present confirmation
- `Exit Gate` — added `.env*`-read grep check for D3 compliance
- `Phase Loop Progress` — ticked boxes 1-3 with summaries
- New `Inner Loop Refresh Note` section (this one)
- New `Known Context Drift (flag for UPDATE PROCESS)` section

**Effect:** Step 4 (PVL) must re-run from V1 against this updated plan (validate-contract does not
yet exist for this phase, so this is a first PVL pass, not a re-validation).

---

## Known Context Drift (flag for UPDATE PROCESS)

- `process/context/all-context.md` describes an `ops/`-based github-ingest / R2-client /
  docs-evidence-manifest ingestion subsystem (`ops/github-ingest.mjs`, `ops/r2-client.mjs`,
  registry pipeline) that RESEARCH (15-07-26) could not find anywhere in this repo's tracked git
  history. This is a larger drift than the previously-flagged test-count drift note already in
  `all-context.md`'s Open Questions section — needs a `vc-audit-context` pass to confirm scope and
  correct or remove the stale description.
- `all-context.md` also claims Git LFS tracks `apps/web/public/previews/**` via `.gitattributes`
  (attributed to "Phase 17" of an earlier program). RESEARCH (15-07-26) found no `.gitattributes`
  file on disk. This was previously flagged as an open question in `all-context.md`'s Open
  Questions section (15-07-26, `claymorphism-3d-redesign` Phase 01 research) — this phase's
  research independently reconfirms the absence and is directly relevant to Step D1's seed-batch
  sizing decision (small binaries commit directly, no LFS backstop).

---

## Touchpoints

- `ops/gemini-asset-gen.mjs` (new)
- `ops/gemini-prompts.mjs` (new)
- `ops/__tests__/gemini-asset-gen.test.mjs` (new — first test file under `ops/__tests__/`)
- `apps/web/public/clay/` (new directory)
- `.env.example` (confirm `GEMINI_API_KEY` entry; add `GEMINI_IMAGE_MODEL` entry)

---

## Public Contracts

- No runtime API route exposes Gemini generation — this is an ops-time-only script.
- No change to any existing `apps/web` route or component.
- Env var contract: `GEMINI_API_KEY` (required for live calls, else graceful no-op) and
  `GEMINI_IMAGE_MODEL` (optional, falls back to a confirmed default; fail-fast with an explicit
  error if the resolved model id 404s).

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `node --test ops/__tests__/gemini-asset-gen.test.mjs` all pass | Fully-Automated | Script logic correct for graceful-absence, generation, manifest idempotency |
| grep confirms 0 live `fetch(` calls in test file | Fully-Automated | Tests never hit the live billed API |
| grep confirms 0 `.env*`-file reads in `ops/gemini-asset-gen.mjs` | Fully-Automated | D3: secrets are shell-env only, script never reads dotenv files |
| `corepack pnpm --filter web build` exits 0 | Fully-Automated | ops script does not break the web build |
| Live seed batch generation (only if GEMINI_API_KEY present) | Hybrid | Precondition: GEMINI_API_KEY set in env; proves live API integration actually works end-to-end, including actual response mimeType matching D2's `image/png` expectation |
| Manual visual check of 1-2 generated assets against Phase 1 prompt template intent | Agent-Probe | Generated assets match the matte-clay/isometric/soft-lighting spec |

```bash
node --test ops/__tests__/gemini-asset-gen.test.mjs
corepack pnpm --filter web build
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-02-asset-generation-pipeline_PLAN_14-07-26.md`
- Last completed step: Step 3 PLAN-SUPPLEMENT (this update, 15-07-26)
- Validate-contract status: pending (no contract written yet — first PVL pass)
- Supporting context files loaded: `gemini-prompt-templates_REF_14-07-26.md`,
  `ops/seed-placeholder-components.mjs`, umbrella plan `## Current Execution State`
- Next step: Spawn vc-validate-agent for PVL (Step 4)

---

## Test Infra Improvement Notes

- Consider extending `apps/web/scripts/__tests__/gemini-prompt-templates.check.mjs` (or adding a
  mirrored check) to assert `ops/gemini-prompts.mjs` stays in sync with the `_REF_` doc's hex
  palette values — not done in this phase; candidate for a follow-up test-infra task.

---

## Validate Contract

Status: PASS
Date: 15-07-26
date: 2026-07-15
generated-by: inner-pvl: phase-2

Parallel strategy: sequential (execution) — recommended strategy per `vc-agent-strategy-compare`
signal scoring was **parallel subagents** (score 3/7: S4 phase-program classification, S6
secret/trust-boundary handling present — GEMINI_API_KEY read path, S7 blast radius has 6 files).
No Task/Agent-spawn tool was available in this validate-agent session (same constraint
documented at Phase 1's inner PVL) — Layer 1's four dimension checks and the Layer 2 per-section
review below were both performed directly in this single session rather than via separate
parallel subagent transcripts. This does not change the findings, only how they were produced.

Plan updates applied:
- P1: Step B1 — added an explicit "never console.log/print the raw GEMINI_API_KEY value"
  instruction (only presence/absence and the resolved model id may be logged), and softened the
  hardcoded "404" fail-fast assumption to "confirm the actual HTTP status/error shape via A1's
  vc-docs-seeker step, do not assume exactly 404." Closes a Security-surface CONCERN (implicit
  but unstated no-log rule) and an Infra-fit CONCERN (unverified literal 404 assumption).
- P2: Step C1 — added 2 new test cases (5 and 6) covering the D1 design decision's two
  behaviors that had no test coverage in the original 4-case list: GEMINI_IMAGE_MODEL unset →
  falls back to the A1-confirmed DEFAULT; resolved model returns the confirmed invalid-model
  error → script fails fast with the explicit env-var-naming message. Closes a Test-coverage
  CONCERN (D1's fail-fast/fallback logic was designed but unverified by any listed test case).

Execute-agent instructions:
- E1: Before writing `ops/gemini-asset-gen.mjs`, run A1's `vc-docs-seeker` confirmation first and
  record the exact confirmed model id + the exact error status/shape Gemini returns for an
  invalid model id — both are inputs the B1/C1 test-6 implementation depends on. Do not guess.
- E2: When implementing the graceful-absence warn path (B1), the console.warn message text must
  match what test case (1) in `gemini-asset-gen.test.mjs` asserts against — keep the string
  literal in sync between script and test, or assert on a stable substring.
- E3: `ops/gemini-prompts.mjs` (B2) must be diffed byte-for-byte on hex values against
  `gemini-prompt-templates_REF_14-07-26.md`'s 3 JSON blocks before considering B2 complete — a
  transcription slip here silently desyncs the asset style from the locked palette. Flagging the
  `Test Infra Improvement Notes` cross-check script as a nice-to-have, not required to close B2.
- E4: When D1 runs (live seed batch), export `GEMINI_API_KEY` into the shell from
  `apps/web/.env.local` manually for that single command invocation only (e.g. read the value
  from the local env file into a shell variable without printing it) — never copy the key into a
  tracked file, never print it in the phase report. Record only that the key was present and
  which model id resolved.
- E5: Add the `GEMINI_IMAGE_MODEL=` line to `.env.example` (currently only has `GEMINI_API_KEY=`)
  as part of Step B1/blast-radius completion — confirmed missing from `.env.example` as of this
  VALIDATE pass (2026-07-15).

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| VE1 | Graceful absence when GEMINI_API_KEY missing (exit 0, warn, no throw) | Fully-Automated | `node --test ops/__tests__/gemini-asset-gen.test.mjs` — case 1 | A |
| VE2 | Successful icon generation writes correct file path + mimeType-derived extension | Fully-Automated | same suite — case 2 | A |
| VE3 | Manifest records new asset (promptHash/generatedAt/model/format) | Fully-Automated | same suite — case 3 | A |
| VE4 | Manifest idempotency (skip on matching hash) | Fully-Automated | same suite — case 4 | A |
| VE5 (new, P2) | GEMINI_IMAGE_MODEL unset falls back to A1-confirmed DEFAULT | Fully-Automated | same suite — case 5 | B |
| VE6 (new, P2) | Resolved model 404/invalid-model triggers fail-fast with env-var-naming error | Fully-Automated | same suite — case 6 | B |
| VE7 | Zero live network calls in test file | Fully-Automated | grep test file for `fetch(` calls, cross-checked against mock setup (C2) | A |
| VE8 | D3: script never reads any `.env*` file | Fully-Automated | grep `ops/gemini-asset-gen.mjs` for dotenv/readFileSync-on-env patterns, expect 0 hits | A |
| VE9 | ops script does not break the web build | Fully-Automated | `corepack pnpm --filter web build` exits 0 | A |
| VE10 | No heavy runtime deps leak into apps/web output | Fully-Automated | grep the web build output for three/face-api/matter-js/ogl/gsap, expect 0 hits | A |
| VE11 | Live API integration actually works end-to-end (real mimeType matches D2 expectation) | Hybrid | precondition: `GEMINI_API_KEY` set in env; run `node ops/gemini-asset-gen.mjs` once for the D1 seed batch | C (if key absent at EXECUTE time — see D2 known-gap) |
| VE12 | Generated assets visually match the matte-clay/isometric/soft-lighting spec | Agent-Probe | manual visual read of 1-2 generated assets against `gemini-prompt-templates_REF_14-07-26.md` intent | D (deferred to Phase 3/4 first real render if no live batch this phase) |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist, via the P2 update above)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies
(Fully-Automated / Hybrid / Agent-Probe). Known-Gap is never used as a strategy value here — the
only Known-Gap-shaped item (D2: no live key at Phase 2 start) is carried as a named residual on
VE11/VE12 via gap-resolution C/D, not as a silent pass.

Legacy line form (retained so existing validate-contract consumers still parse):
- ops/gemini-asset-gen.mjs core logic: Fully-automated: `node --test ops/__tests__/gemini-asset-gen.test.mjs` | agent-probe: visual fidelity read of 1-2 generated assets | hybrid: live seed batch run + `GEMINI_API_KEY` precondition | known-gap: none silent — D2 documented explicitly if key absent

Failing stubs (Fully-Automated rows only):

```
test("should exit 0 and warn when GEMINI_API_KEY is missing, never throw", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: graceful-absence path (VE1)")
})
test("should write generated icon to the correct path with mimeType-derived extension", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: successful icon generation (VE2)")
})
test("should record promptHash/generatedAt/model/format in manifest.json for a new asset", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: manifest write (VE3)")
})
test("should skip regeneration when computed promptHash matches manifest entry", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: manifest idempotency (VE4)")
})
test("should fall back to the A1-confirmed DEFAULT model when GEMINI_IMAGE_MODEL is unset", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: model fallback (VE5)")
})
test("should fail fast naming GEMINI_IMAGE_MODEL when the resolved model id is invalid/retired", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: fail-fast on invalid model (VE6)")
})
```

Dimension findings:
- Infra fit: PASS — confirmed `ops/` is not a pnpm workspace member (`pnpm-workspace.yaml` lists
  only `apps/*`/`packages/*`), not referenced in `turbo.json`, not in any tsconfig `include`; grep
  confirms zero importers of `ops/gemini*` anywhere under `apps/` or `packages/`; new
  `apps/web/public/clay/` is a plain static asset dir (Next serves `public/` automatically, no
  route/config change needed). Original CONCERN (unverified literal-404 assumption) resolved via
  P1 plan update — execute-agent now confirms the real error shape before hardcoding.
- Test coverage: PASS (after P2 fix) — 4 tiers all represented, no behavior rests solely on
  Known-Gap (vacuous-green scan clean: every Fully-Automated-provable behavior now has a test
  case; only the live-integration/visual-fidelity checks are Hybrid/Agent-Probe, which is
  correct — those genuinely require a live key or human judgment). Original CONCERN (D1's
  fallback/fail-fast logic had no listed test case) resolved via P2 plan update (VE5/VE6 added).
- Breaking changes: PASS — additive-only; all blast-radius files are new creates or additive
  entries (`.env.example` gains one line, `package.json` gains one script). No existing exports,
  routes, or components are touched. Confirmed zero importers of the new ops files.
- Security surface: PASS (after P1 fix) — GEMINI_API_KEY is shell-env-only (D3), never read from
  `.env*` (verified as an exit-gate grep), never committed; `manifest.json` (public, ships to
  every deploy) contains only `{promptHash, generatedAt, model, format}` — no secret material,
  confirmed by the D5 shape spec; Gemini calls are ops-time-only, zero runtime route exposure
  (confirmed via Public Contracts section + grep for importers). Original CONCERN (no explicit
  "never log the key" rule) resolved via P1 plan update.
- Section A (Confirm API contract) feasibility: PASS — mechanical once vc-docs-seeker runs at
  EXECUTE; the locked D1/D2 design facts (endpoint shape, response shape, cost, quota) are
  documented, not empirically probed — correctly treated as a known-gap resolved by EXECUTE-time
  `vc-docs-seeker`, not a VC-FEASIBILITY-PROBE-NEEDED candidate (no live-system behavior is being
  guessed at; this is a documentation-confirmation task).
- Section B (Build ops script skeleton) feasibility: PASS — target files confirmed absent (clean
  create), `ops/gemini-prompts.mjs`'s source JSON blocks read in full and confirmed valid/complete
  in `gemini-prompt-templates_REF_14-07-26.md` (3 templates, matching hex palette). Highest-risk
  edit: the literal-404 fail-fast assumption — mitigated via P1 (confirm real error shape first).
- Section C (Unit tests) feasibility: PASS (after P2 fix) — first file under `ops/__tests__/`, no
  collision; mocked-fetch pattern is standard `node --test` usage, no new tooling needed.
- Section D (Seed asset batch) feasibility: PASS — conditional logic is clear; small batch size
  (5 icons + 2 illustrations + 1 texture, roughly $0.31 estimated) stays within the umbrella's
  "small documented budget" hard-stop threshold without requiring a separate user approval.

Open gaps:
- D2 (GEMINI_API_KEY absent at EXECUTE time): known-gap, explicitly documented in the plan's own
  Step D2 — if the key is unavailable when EXECUTE runs, code+tests still ship CODE DONE and the
  live-integration (VE11) and visual-fidelity (VE12) gates are deferred to whenever a live run
  happens, with Phase 3/4 using placeholder asset paths in the interim (already called out in
  those phases' entry gates per the umbrella). Not a backlog item — inherently sequenced.
- `validate-plan-artifact.mjs` reports 6 structural failures (missing Date/Status/Complexity
  metadata, overview section, Phase Completion Rules, Acceptance Criteria) against this plan.
  SYSTEMIC, non-blocking — this is the phase-stub shape from `vc-generate-phase-program`, not the
  standalone `vc-generate-plan` shape the validator expects. Confirmed:
  `validate-phase-stub.mjs` (the phase-appropriate validator) reports 0 failures / 0 warnings
  against this exact file. Identical finding and identical resolution to Phase 1's inner PVL
  (see Phase 1's `## Validate Contract` → Open gaps). Informational only, no action required.

What this coverage does NOT prove:
- VE1-VE4, VE7-VE10 (Fully-Automated) prove the script's internal logic is correct against mocked
  responses and that it does not break the existing build/output — they do NOT prove the real
  Gemini API request/response shape actually matches what the mocks assume (that assumption is
  locked at INNOVATE from documentation, not from a live probe).
- VE5/VE6 (new) prove the fallback/fail-fast branching logic is correct against a mocked
  404/invalid-model response — they do NOT prove Gemini's real error shape for an invalid model
  id is actually a 404 (P1 requires EXECUTE to confirm this via vc-docs-seeker before relying on
  the assumption).
- VE11 (Hybrid, conditional) proves a live end-to-end call works IF it runs — it does NOT run
  automatically in CI and does NOT prove anything if `GEMINI_API_KEY` is absent at EXECUTE time
  (D2 known-gap).
- VE12 (Agent-Probe) proves a human/agent's subjective visual read of 1-2 sample assets — it does
  NOT prove consistency across a full asset batch, and does NOT prove real browser-rendered
  compositing once assets are wired into components (deferred to Phase 3/4, which is the correct
  sequencing, not a gap in this phase).
- No gate in this table proves cost control beyond "batch is small by design" — there is no
  runtime spend cap or dollar-ceiling enforced in code; the mitigation is procedural (D1's
  explicit small-batch instruction + the umbrella's live-billed-spend hard stop).

Gate: PASS (no FAILs; 2 CONCERNs found at V2 — both resolved via Plan updates applied (P1
security/logging + literal-404 assumption, P2 missing test coverage for D1's fallback/fail-fast
logic) rather than carried forward as open CONCERNs; net gate after fixes is 0 FAILs / 0
unresolved CONCERNs)
Accepted by: session (autonomous, phase-program inner PVL — no interactive user in this subagent
context; standing /goal autonomy active for claymorphism-3d-redesign; net gate computed clean
after the two in-plan fixes applied during this pass)
