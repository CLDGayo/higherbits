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
**Phase status:** PLANNED
**Report destination:** process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-02-asset-generation-pipeline_REPORT_14-07-26.md (flat in the program task folder)

---

## Purpose

Build an `ops/`-conventioned Node script that calls the Gemini image-generation API using the
Phase 1 prompt templates to produce three asset classes: (a) small 3D soft-clay UI icons (nav,
feature, interaction icons — play button, heart, dashboard tile), (b) larger 3D
illustrations/avatars (characters, plants, abstract shapes) for hero/card decoration, and (c)
subtle matte/soft-noise background textures. The script must be unit-testable with a mocked
fetch (following `ops/github-ingest.mjs` conventions), gracefully absent when `GEMINI_API_KEY`
is unset (mirrors the existing R2 lazy-init graceful-absence pattern), and write output as WebP
into `apps/web/public/clay/`. Gemini calls are ops-time/build-time only — never wired into any
runtime request path.

---

## Entry Gate

- Phase 1 exit gate passed (triple-shadow tokens + palette hex codes + Gemini prompt template
  doc all locked)
- `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/gemini-prompt-templates_REF_14-07-26.md` exists and is readable

---

## Blast Radius

- New file: `ops/gemini-asset-gen.mjs` (or equivalently named per repo convention)
- New file: `ops/__tests__/gemini-asset-gen.test.mjs`
- New directory: `apps/web/public/clay/` (icons/, illustrations/, textures/ subfolders)
- `.env.example` — confirm/finalize `GEMINI_API_KEY` entry (added in Phase 1)
- Possibly: small addition to `package.json` scripts (e.g. `"assets:generate": "node ops/gemini-asset-gen.mjs"`)

---

## Implementation Checklist

### Step A — Confirm Gemini API contract before writing code

- [ ] A1. Invoke `vc-docs-seeker` to resolve the exact current Gemini image-generation API
      method signature, request/response shape, and model id (e.g. `gemini-2.5-flash-image` or
      whatever is current) — do not write API-calling code from memory/training-data assumption.
- [ ] A2. Confirm image output format options (PNG/WebP) and whether the API returns raw bytes,
      base64, or a URL — this determines the WebP-conversion step needed in the script.

### Step B — Build the ops script skeleton (mirrors ops/github-ingest.mjs conventions)

- [ ] B1. Create `ops/gemini-asset-gen.mjs`: reads `GEMINI_API_KEY` from env; if absent, log a
      structured warn (`console.warn('SKIPPED: GEMINI_API_KEY not set')`) and exit 0 (graceful
      absence — mirrors the R2 lazy-init pattern in `ops/r2-client.mjs`), never throw.
- [ ] B2. Load prompt templates from the Phase 1 `_REF_` doc (parse the fenced template blocks,
      or hardcode as a structured JS object if parsing the doc is overkill — prefer a small
      `ops/gemini-prompts.mjs` data module referencing the same hex codes as source of truth).
- [ ] B3. Implement the three asset-class generation functions: `generateIcon(name, promptVars)`,
      `generateIllustration(name, promptVars)`, `generateTexture(name, promptVars)` — each calls
      the confirmed Gemini API (Step A), writes output to the correct `apps/web/public/clay/{class}/`
      subfolder as WebP.
- [ ] B4. Add a manifest write step (`apps/web/public/clay/manifest.json`) recording generated
      asset filenames + prompt hash, so re-runs can skip unchanged prompts (idempotent, avoids
      redundant billed API calls).

### Step C — Unit tests (mocked fetch, no live API calls)

- [ ] C1. Write `ops/__tests__/gemini-asset-gen.test.mjs` using `node --test` with mocked
      `fetch`/API client, following the 4-test pattern in `ops/__tests__/github-ingest.test.mjs`:
      (1) graceful-absence when key missing, (2) successful icon generation writes expected file
      path, (3) manifest correctly records a new asset, (4) manifest correctly skips an
      already-generated asset (idempotency).
- [ ] C2. Confirm zero live network calls occur during `node --test ops/__tests__/gemini-asset-gen.test.mjs` (grep test file for actual `fetch(` calls — all must be mocked).

### Step D — Seed asset batch (conditional on live key)

- [ ] D1. IF `GEMINI_API_KEY` is set in the actual environment: run the script once to generate
      a small seed batch (e.g. 5 icons, 2 illustrations, 1 texture) sufficient for Phase 3/4 to
      wire into components, and record the exact assets generated in the phase report.
- [ ] D2. IF `GEMINI_API_KEY` is NOT set: document this as an explicit known-gap in the phase
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
- Unit tests pass with mocked fetch
- Phase report documents whether a live seed batch was generated (D1) or the known-gap is
  recorded (D2)

---

## Blockers That Would Justify BLOCKED Status

- Gemini API contract cannot be confirmed via `vc-docs-seeker` (no reliable current
  documentation reachable) — escalate via `VC-FEASIBILITY-PROBE-NEEDED` if a live-provider probe
  is needed to confirm the request/response shape empirically
- `GEMINI_API_KEY` absent AND no way to validate the script logic even with mocks — should not
  actually block, since mocked tests do not require a live key; only a true blocker if the API
  contract itself is unconfirmable

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: Phase 1 report read; ops/github-ingest.mjs + ops/r2-client.mjs conventions reviewed; Gemini API docs scoped
- [ ] 2. INNOVATE — innovate-agent: approach decided (script shape, WebP conversion path); Decision Summary written
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [ ] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md`
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `ops/gemini-asset-gen.mjs` (new)
- `ops/__tests__/gemini-asset-gen.test.mjs` (new)
- `apps/web/public/clay/` (new directory)
- `.env.example` (confirm GEMINI_API_KEY entry)

---

## Public Contracts

- No runtime API route exposes Gemini generation — this is an ops-time-only script.
- No change to any existing `apps/web` route or component.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `node --test ops/__tests__/gemini-asset-gen.test.mjs` all pass | Fully-Automated | Script logic correct for graceful-absence, generation, manifest idempotency |
| grep confirms 0 live `fetch(` calls in test file | Fully-Automated | Tests never hit the live billed API |
| `corepack pnpm --filter web build` exits 0 | Fully-Automated | ops script does not break the web build |
| Live seed batch generation (only if GEMINI_API_KEY present) | Hybrid | Precondition: GEMINI_API_KEY set in env; proves live API integration actually works end-to-end |
| Manual visual check of 1-2 generated assets against Phase 1 prompt template intent | Agent-Probe | Generated assets match the matte-clay/isometric/soft-lighting spec |

```bash
node --test ops/__tests__/gemini-asset-gen.test.mjs
corepack pnpm --filter web build
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/phase-02-asset-generation-pipeline_PLAN_14-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1), after Phase 1 exit gate passes

---

## Test Infra Improvement Notes

(none identified yet)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
