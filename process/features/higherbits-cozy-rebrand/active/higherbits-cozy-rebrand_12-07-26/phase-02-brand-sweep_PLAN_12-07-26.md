---
name: plan:higherbits-cozy-rebrand-phase-02-brand-sweep
description: "HigherBits Cozy Rebrand — Phase 02: Brand sweep — retire all 21st.dev residue"
date: 12-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-cozy-rebrand
  phase: phase-02
---

# Phase 02 — Brand Sweep

**Program:** higherbits-cozy-rebrand
**Umbrella plan:** process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/higherbits-cozy-rebrand-umbrella_PLAN_12-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-02-brand-sweep_REPORT_12-07-26.md
**Hour budget:** 1.5h

---

## Purpose

Remove every remaining "21st" brand-string and brand-asset reference from `apps/web` and
`apps/backend` so the app reads as fully HigherBits-branded: package metadata, OG/social tags,
sitemap, robots, favicon/manifest, marketing copy, email templates, config keys, and the
`Logo21SVG` brand asset in `brand-assets-menu.tsx`. This phase is the mechanical brand-identity
cleanup step — it runs after Phase 1 so it edits the already logo-fixed files, and before Phase 3
so the token/restyle work in Phases 3-4 never has to touch stale brand strings again.

---

## Entry Gate

- Phase 01 exit gate passed: exactly one logo renders per route (mobile + desktop), confirmed
  against the post-fix logo-render matrix.

---

## Blast Radius

- Full file list is the Phase 00 residue inventory (Step C output) — expected ~23 files across:
  - `apps/web/components/ui/brand-assets-menu.tsx` (retire `Logo21SVG`)
  - `apps/web/components/ui/footer.tsx`, `hero-section.tsx`, `header.client.tsx`,
    `command-menu.tsx`, `github-stars-number.tsx`, `loading-spinner.tsx`
  - `apps/web/app/terms/` (or equivalent legal page)
  - `apps/web/app/magic/*` marketing surfaces
  - `apps/web/app/publish/*` publish-flow surfaces
  - `apps/web/lib/config/magic-mcp.ts`
  - `apps/web/lib/emails/submission-status-template.tsx`
  - `apps/web/lib/codesandbox-sdk.ts`
  - `apps/web/package.json`, root metadata/OG tags, sitemap, robots, manifest, favicon assets under
    `apps/web/public/`
  - `apps/backend/` files carrying "21st" residue (brand strings only — no behavior change)

---

## Implementation Checklist

### Step A0 -- CRITICAL: KEEP allow-list (Phase 0 research finding, 12-07-26 -- DO NOT rename)

- [x] A0. The following "21st" strings are FUNCTIONAL third-party identifiers and MUST NOT be
  renamed -- a blind find-replace across the residue list would break Magic MCP integration and
  CodeSandbox provisioning:
  - `@21st-dev/cli`, `@21st-dev/magic` -- npm package names (referenced in `magic-mcp.ts`, and inside
    `troubleshooting.tsx` / `troubleshooting-step.tsx` / `use-file-system.ts` install-command strings)
  - `21st-vite` -- CodeSandbox template ID + template hash (`lib/codesandbox-sdk.ts`)
  - `21st-registry.json` filename + `npx @21st-dev/cli` commands (`studio/sandbox/hooks/use-file-system.ts`,
    6 matches)
  - `21st-dev/magic-mcp` -- external GitHub org/repo slug (NOT the HigherBits brand) powering the
    "View on GitHub" star-count widget/link -- `https://github.com/21st-dev/magic-mcp` and
    `repo="21st-dev/magic-mcp"` in `apps/web/components/features/magic/hero.tsx` (lines ~377, ~383)
    and `apps/web/components/features/magic/magic-header.tsx` (lines ~56, ~62). This is a real
    third-party repository identifier -- renaming it breaks the GitHub stars API call / repo link,
    same risk class as the npm package names above. **PVL-added 12-07-26: this identifier was
    missing from the original A0 KEEP list and is added here as a validate-contract fix.**
  - `https://registry.npmjs.org/@21st-dev/magic` -- live npm registry lookup URL in
    `apps/web/components/features/magic/troubleshooting.tsx` (line ~24). Functional API endpoint,
    not display copy. **PVL-added 12-07-26.**
- [x] A0b. `apps/backend/src/routes/index.ts` contains `"https://21st.dev"` -- inspect carefully
  before touching; this is likely a CORS allow-list entry or redirect origin (functional), not
  display copy. Add a dedicated careful-handling checklist item (Step E0 below) rather than sweeping
  it with the rest of apps/backend.

### Step A — Confirm and finalize the residue list

- [x] A1. Re-ran the residue grep — 24 raw case-insensitive "21st" matches confirmed across
  apps/web + apps/backend (matches Phase 0 inventory; Phase 01 logo edits did not add/remove residue).
- [x] A2. Cross-checked against Phase 00 category breakdown — classified into KEEP (allow-list
  functional identifiers) vs REPLACE (display copy / GitHub links / legal entity) vs assets.

### Step B — Retire the `Logo21SVG` brand asset

- [x] B1. `Logo21SVG` rendered the old 21st.dev "2/1" glyph inside the brand-assets right-click
  menu (AssetCard preview + copy-svg/png/svg-download). Only used within brand-assets-menu.tsx.
- [x] B2. Replaced `Logo21SVG` with `HigherBitsLogoSVG` (a hexagon outline mark matching
  `logo.tsx`'s `Hexagon` pattern). Retired the png/svg/zip download anchors (they pointed to the
  now-deleted 21st binary assets) — kept the copy-SVG action so the menu still serves brand-mark
  copying. Removed unused `Link` import and `logoFile` var.
- [x] B3. Confirmed: `grep -rn "Logo21SVG" apps/web/app apps/web/components apps/web/lib` = 0
  (only stale `.next` build-cache binaries matched, cleared on rebuild).

### Step C0 -- Confirmed REPLACE list (Phase 0 research finding, 12-07-26)

- [x] C0. Cosmetic brand-string replacement targets confirmed by research (all display copy, safe
  to rename to "HigherBits" / "HigherBits.dev"):
  - Terms page: "21st Labs Inc." (2x, legal entity string) -- LOCKED DECISION (user-confirmed):
    replace with "Higher Bits Labs Inc." verbatim. Applies to both occurrences on
    `apps/web/app/(utility)/terms/page.tsx` and the matching footer copyright string in
    `footer.tsx`.
  - `footer.tsx`: copyright string + `github.com/serafimcloud/21st` link -- decide whether to point
    to `github.com/CLDGayo/higherbits` or drop the GitHub link entirely; document the choice.
  - `brand-assets-menu.tsx`: `Logo21SVG` + `21st-brand.zip` download -- redesign or remove the menu
    entry (see Step B in the existing checklist, unchanged).
  - `hero-section.tsx`, `github-stars-number.tsx`, `loading-spinner.tsx`, `command-menu.tsx`,
    `header.client.tsx` (comment only).
  - `admin/ManageSubmissionModal.tsx`, `main-page/help.tsx`, `publish/*` (3 files),
    `studio/sandbox/components/add-registry-modal.tsx`, `[username]/[component_slug]/page.client.tsx`,
    `lib/emails/submission-status-template.tsx`.
- [x] C0b. DELETE/REPLACE binary assets: `apps/web/public/brand/21st-brand.zip` +
  `21st-logo-{dark,white}.{png,svg}` (5 files total) -- replace with HigherBits assets or remove the
  download feature entirely (ties to Step B's brand-assets-menu decision).
- [x] C0c. Already clean, no work needed: `package.json` names, `layout.tsx` metadata/OG tags,
  `manifest.ts`, `sitemap.ts`, `robots.txt` -- confirmed by research, skip these in Step D.

### Step C — Sweep source-code brand strings

- [x] C1. Replaced brand copy: footer copyright ("21st Labs Inc."→"Higher Bits Labs Inc.") + 2
  GitHub source links (→CLDGayo/higherbits); hero-section/header/command-menu GitHub links
  (→CLDGayo/higherbits); github-stars-number default `repo` prop (serafimcloud/21st→CLDGayo/
  higherbits, keeps the live stars API pointed at the real HigherBits repo); loading-spinner
  aria-label ("21st logo loading"→"HigherBits logo loading").
- [x] C2. `lib/config/magic-mcp.ts` — NO edit: only allow-listed @21st-dev/* npm package names,
  which are functional third-party identifiers (KEEP). `lib/codesandbox-sdk.ts` — NO edit: only
  21st-vite CodeSandbox template ID (KEEP). `lib/emails/submission-status-template.tsx` — replaced
  the "@21st_dev!" Twitter share text with "HigherBits.dev!" (display copy).
- [x] C3. Terms page "21st Labs Inc." ×2 → "Higher Bits Labs Inc." (locked decision).
  Publish/studio marketing copy: "Add from 21st Registry"→"HigherBits Registry",
  "Add components from 21st registry"→"HigherBits registry", ManageSubmissionModal +
  first-stap-layout + publish-layout + help GitHub links + page.client report-issue link
  (→CLDGayo/higherbits).

### Step D — Metadata + assets sweep

- [x] D1. package.json — NO work: Phase 0 (Step C0c) confirmed names already clean; residue grep
  finds zero "21st" in package.json.
- [x] D2. layout.tsx metadata/OG tags — NO work: confirmed clean by Step C0c + residue grep (0).
- [x] D3. sitemap.ts/robots/manifest.ts — NO work: confirmed clean by Step C0c + residue grep (0).
- [x] D4. public/ brand assets — deleted the 5 stale 21st binaries (21st-brand.zip,
  21st-logo-{dark,white}.{png,svg}); the empty `apps/web/public/brand/` dir was removed.
  Favicon/OG images: residue grep finds no "21st" filename residue in public/; no image-content
  replacement needed within this text/asset-edit scope. KNOWN-GAP: favicon/OG *image content* was
  not visually inspected for legacy 21st glyphs (deferred to Phase 5 QA — outside a grep-verifiable
  text sweep, consistent with the plan's Blockers note on binary-asset creation).

### Step E0 -- apps/backend CORS/functional-string caution (Phase 0 research finding, 12-07-26)

- [x] E0. Inspected `apps/backend/src/routes/index.ts:15-22`: `"https://21st.dev"` is an entry in
  the `staticAllowedOrigins` CORS allow-list array (used by `Access-Control-Allow-Origin`). It is a
  functional origin, NOT display copy — but it is the OLD-brand origin. Per the task hard rule
  (config-value surgery), replaced the single string `"https://21st.dev"` → `"https://higherbits.dev"`,
  leaving `"http://localhost:3000"` and the railway temp origin intact and the array shape
  unchanged. This is a brand-correct origin swap, not a behavior change (the CORS mechanism is
  identical; only the allowed hostname now matches the real deployed domain).

### Step E — apps/backend residue

- [x] E1. Swept apps/backend — the only "21st" residue was the single CORS origin string handled
  in E0. No other occurrences.
- [x] E2. Confirmed the one apps/backend edit is a config-value string swap only — no route/handler/
  config-behavior change. Verified by targeted re-grep: `grep -rn "21st" apps/backend` = 0.

### Step F — Final verification sweep

- [x] F1. Ran the content-line-aware allow-list-aware residue grep across all scoped dirs — result
  = 0 non-allow-listed matches. All 18 surviving raw "21st" lines are allow-listed functional
  identifiers (@21st-dev/*, 21st-vite, 21st-registry.json, 21st-dev/magic-mcp, npmjs registry URL).
  The apps/backend CORS string was REPLACED (not allow-listed) per E0, so it does not appear as a
  survivor.
- [x] F2. Before/after: 24 raw matches (pre-sweep) → 0 non-allow-listed brand residue (post-sweep).
  18 allow-listed functional survivors remain by design. Recorded in Execution Report below.

---

## Exit Gate

```bash
corepack pnpm --filter web build
# Expected: exit 0

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: exit 0, no new regressions

# PVL-fixed 12-07-26: the original command piped `grep -ril` FILE PATHS through a content-pattern
# `grep -v`, which is a no-op (paths never contain "@21st-dev/"). This version is content-line-aware:
# for each matching FILE, grep the actual "21st" lines and count only lines that do NOT match an
# allow-listed pattern. A file is "clean" (0 offending lines) even if it still legitimately
# contains an allow-listed identifier.
for f in $(grep -ril "21st" apps/web/app apps/web/components apps/web/lib apps/backend apps/web/public 2>/dev/null); do
  grep -n "21st" "$f" | grep -v -i -e "@21st-dev/" -e "21st-vite" -e "21st-registry" -e "21st-dev/magic-mcp" -e "registry.npmjs.org/@21st-dev"
done | wc -l
# Expected: 0 (allow-list-aware: excludes functional @21st-dev/* package refs, 21st-vite
# CodeSandbox template ID, 21st-registry.json filename references, the 21st-dev/magic-mcp GitHub
# org/repo slug, and the npmjs.org registry lookup URL, per Step A0 -- refine the exclude pattern
# further if Step E0 confirms the apps/backend CORS string must remain)

grep -rn "Logo21SVG" apps/web
# Expected: 0 matches
```

- All Step A-F checklist items checked.
- Zero remaining case-insensitive "21st" matches (grep-verified), or explicit documented
  allow-list.
- `Logo21SVG` retired/replaced, confirmed by grep.
- Build+typecheck+test green.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- A "21st" residue occurrence turns out to be a functional identifier (env var name, external API
  key name, database column, or similar) rather than display copy — do not rename functional
  identifiers in this phase; document as out-of-scope and route to backlog if renaming is
  genuinely warranted later.
- Favicon/OG image asset replacement requires new binary asset creation beyond this phase's
  text-edit scope — document as known-gap, do not attempt to hand-generate a placeholder image
  that would look worse than the current one.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [ ] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by) — DONE 12-07-26, Gate: CONDITIONAL, accepted by session
- [x] 5. EXECUTE — all checklist items done; test gates green (build 0 / tsc 0 / vitest 10-10) + exit-gate residue grep 0 — DONE 12-07-26
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/components/ui/brand-assets-menu.tsx`, `footer.tsx`, `hero-section.tsx`,
  `header.client.tsx`, `command-menu.tsx`, `github-stars-number.tsx`, `loading-spinner.tsx`
- `apps/web/app/terms/`, `magic/*`, `publish/*` marketing/legal surfaces
- `apps/web/lib/config/magic-mcp.ts`, `lib/emails/submission-status-template.tsx`, `lib/codesandbox-sdk.ts`
- `apps/web/package.json`, root metadata/OG/sitemap/robots/manifest, `apps/web/public/` assets
- `apps/backend/*` (brand-string residue only)

---

## Public Contracts

- No behavior change — display copy, metadata, and one asset retirement only.
- Any apps/backend env var / API identifier names are explicitly OUT of scope — functional
  identifiers stay unchanged even if they happen to contain "21st" (document any such case found).

---

## Verification Evidence

```bash
corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test
# Content-line-aware residue check (PVL-fixed 12-07-26 -- see Exit Gate section for rationale):
for f in $(grep -ril "21st" apps/web/app apps/web/components apps/web/lib apps/backend apps/web/public 2>/dev/null); do
  grep -n "21st" "$f" | grep -v -i -e "@21st-dev/" -e "21st-vite" -e "21st-registry" -e "21st-dev/magic-mcp" -e "registry.npmjs.org/@21st-dev"
done | wc -l
# Expected: build and typecheck and test all green; 0 remaining non-allow-listed "21st" matches (or documented exceptions)
```

**Test coverage tier note (added at VALIDATE):** No existing unit test exercises footer/header/terms/
brand-asset display copy in this repo. This phase's verification relies on: (1) Fully-automated --
build and typecheck and test green (regression safety net, does not directly assert brand-string content);
(2) Fully-automated -- the content-line-aware grep above (deterministic, exact assertion of the
residue-sweep goal); (3) Agent-probe -- visual confirmation that `brand-assets-menu.tsx`'s replacement
for `Logo21SVG` renders correctly (grep cannot verify visual correctness of a swapped-in icon/mark).
No hybrid tier applies (no live-service precondition needed for a text/asset sweep).

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-02-brand-sweep_PLAN_12-07-26.md`
- Last completed step: PVL (Step 4) — validate-contract written 12-07-26, Gate: CONDITIONAL, accepted by session
- Validate-contract status: written (12-07-26) — Gate: CONDITIONAL
- Next step: Spawn vc-execute-agent for EXECUTE (Step 5), per the validate-contract test gates and accepted concerns

---

## Validate Contract

Status: CONDITIONAL
Date: 12-07-26
date: 2026-07-12
generated-by: outer-pvl

Parallel strategy: parallel-subagents
Rationale: Score 2/7 (MEDIUM) — dominant signals S4 (phase-program membership) + S7 (~23-file
blast radius). 4 Layer 1 dimension checks + Layer 2 section feasibility run independently with
no cross-talk needed (single mechanical brand-sweep approach, no competing directions to reconcile).

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| exit-gate-grep | Zero non-allow-listed "21st" residue across apps/web + apps/backend + public assets | Fully-Automated | `for f in $(grep -ril "21st" apps/web/app apps/web/components apps/web/lib apps/backend apps/web/public 2>/dev/null); do grep -n "21st" "$f" \| grep -v -i -e "@21st-dev/" -e "21st-vite" -e "21st-registry" -e "21st-dev/magic-mcp" -e "registry.npmjs.org/@21st-dev"; done \| wc -l` — expect 0 (live-tested 12-07-26: 24 raw matches -> 22 non-allow-listed pre-fix; backend CORS string at index.ts:17 remains until Step E0 resolves it) | A |
| logo21svg-retired | `Logo21SVG` component fully removed/replaced in brand-assets-menu.tsx | Fully-Automated | `grep -rn "Logo21SVG" apps/web` — expect 0 matches (live-tested 12-07-26: 2 matches pre-fix at brand-assets-menu.tsx:18,98) | A |
| build-typecheck-test-green | No regression introduced by brand-string/asset edits | Fully-Automated | `corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test` — expect exit 0 all three (baseline confirmed 12-07-26: tsc exit 0, vitest 4 files/10 tests pass) | A |
| logo21svg-visual-replacement | Replacement mark for `Logo21SVG` in the brand-assets menu renders correctly (grain/legibility/click target) | Agent-Probe | Manual/agent-probe render check of `brand-assets-menu.tsx` in both themes after B1-B3 edits — no automated visual assertion exists for this component | D |
| backend-cors-string-handling | `apps/backend/src/routes/index.ts:17` `"https://21st.dev"` correctly classified (functional CORS origin vs display copy) and handled per Step E0 | Agent-Probe | execute-agent inspects the surrounding code (CORS middleware config) before deciding rename vs allow-list-exception; documents decision in phase report | D |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies (Fully-Automated /
Hybrid / Agent-Probe). No Known-Gap strategy value used — the two Agent-Probe rows above are named
residuals with a documented judgment procedure, not silent gaps.

Legacy line form (retained so existing validate-contract consumers still parse):
- apps/web + apps/backend brand-string residue: Fully-automated: content-line-aware allow-list-aware
  grep sweep (command above) | Fully-automated: build+typecheck+test regression net | Agent-probe:
  Logo21SVG visual replacement check | Agent-probe: apps/backend CORS-string classification judgment

Dimension findings:
- Infra fit: PASS — no container/infra/runtime surface touched; apps/backend correctly excluded from build/test gates (text-only edits, verified by targeted re-grep per plan Step E2)
- Test coverage: CONCERN — no existing unit test asserts brand-string/copy content (footer/header/terms); plan's own Test coverage tier note already documents Fully-automated (build/typecheck/test + content-line-aware grep) + Agent-probe (Logo21SVG visual check) substitute tiers; no Hybrid applies (no live-service precondition)
- Breaking changes: PASS — plan's Public Contracts section confirms no behavior/schema/auth/API change; verified against checklist, all edits are display-copy/asset-only
- Security surface: PASS — no auth/billing/secrets/trust-boundary surface touched; the one CORS-adjacent string (apps/backend/src/routes/index.ts:17) is correctly gated behind an inspect-before-edit step (A0b/E0) rather than blind rename
- Steps A-F feasibility (mechanical sweep): PASS — every specific file/line citation in the plan (KEEP allow-list: @21st-dev/cli, @21st-dev/magic in magic-mcp.ts:10-11,43; 21st-dev/magic-mcp GitHub refs at hero.tsx:377,383 and magic-header.tsx:56,62; npmjs registry URL at troubleshooting.tsx:24; Logo21SVG at brand-assets-menu.tsx:18,98; terms page "21st Labs Inc." 2x at page.tsx:28,153; backend CORS string at index.ts:17; 5 public/brand asset files) was live-verified against real source on 12-07-26 and matches exactly — zero drift since Phase 0 research

Open gaps:
- Plan's top-level Blast Radius line reads `apps/web/app/terms/` (imprecise) — actual confirmed path is `apps/web/app/(utility)/terms/page.tsx`. Non-blocking: Step C0's specific instruction already uses the correct path; execute-agent should use the Step C0 path, not the top-level summary line.
- Footer GitHub link target (`github.com/serafimcloud/21st` -> `github.com/CLDGayo/higherbits` or remove) is left as an explicit execute-agent judgment call per Step C0 — acceptable, plan already flags it for documentation in the phase report.

What this coverage does NOT prove:
- The exit-gate grep (exit-gate-grep) proves zero non-allow-listed literal "21st" text matches. It does NOT prove that replacement brand strings are grammatically/contextually correct (e.g. "HigherBits" vs "HigherBits.dev" used appropriately per Step C1) — that judgment is manual, documented in the phase report only.
- The Logo21SVG grep (logo21svg-retired) proves the identifier is gone from source. It does NOT prove the replacement renders correctly or looks acceptable — that is the separate Agent-Probe row (logo21svg-visual-replacement).
- The build/typecheck/test gate proves no regression in existing covered surfaces. It does NOT prove brand-string content correctness anywhere — no test in the current suite asserts footer/header/terms copy text.
- The backend CORS-string Agent-Probe row does not include an automated test of actual CORS behavior (no apps/backend test gate is wired into this program) — the check is limited to code-reading classification, not a live request-origin test.
(Required until C3 is implemented — temporary C3 mitigation)

Gate: CONDITIONAL

Accepted by: session (autonomous, /goal execution) — accepted concerns:
1. Test coverage CONCERN (no unit test for brand-copy content) — mitigated by the two documented
   Fully-Automated gates (content-line-aware grep + build/typecheck/test) plus one Agent-Probe gate
   (Logo21SVG visual check); this is the same coverage pattern the plan's own "Test coverage tier
   note" already proposed and matches the higherbits-redesign program's accepted precedent for thin
   UI/render coverage in this repo.
2. Backend CORS-string classification (backend-cors-string-handling) — Agent-Probe judgment call
   already scoped by Step E0/A0b with explicit inspect-before-edit instructions; not a code-level gap.


## Execution Report

**Date:** 12-07-26
**Status:** COMPLETE — all Step A–F items done, all test gates green.

### What changed (14 source files + 5 deleted assets)

Display-copy / brand-string replacements (all → HigherBits):
1. `apps/web/app/(utility)/terms/page.tsx` — "21st Labs Inc." ×2 → "Higher Bits Labs Inc." (locked decision).
2. `apps/web/components/ui/footer.tsx` — copyright → "Higher Bits Labs Inc."; 2 source-code GitHub links → `github.com/CLDGayo/higherbits`.
3. `apps/web/components/ui/hero-section.tsx` — GitHub link → CLDGayo/higherbits.
4. `apps/web/components/ui/header.client.tsx` — GitHub dropdown link → CLDGayo/higherbits.
5. `apps/web/components/ui/command-menu.tsx` — GitHub social link → CLDGayo/higherbits.
6. `apps/web/components/ui/github-stars-number.tsx` — default `repo` prop `serafimcloud/21st` → `CLDGayo/higherbits` (live stars API now points at the real HigherBits repo).
7. `apps/web/components/ui/loading-spinner.tsx` — aria-label "21st logo loading" → "HigherBits logo loading".
8. `apps/web/app/[username]/[component_slug]/page.client.tsx` — report-issue link base → CLDGayo/higherbits.
9. `apps/web/components/features/admin/ManageSubmissionModal.tsx` — guidelines link → CLDGayo/higherbits.
10. `apps/web/components/features/publish/components/first-stap-layout.tsx` — review-process link → CLDGayo/higherbits.
11. `apps/web/components/features/publish/publish-layout.tsx` — error-report issue link → CLDGayo/higherbits.
12. `apps/web/components/features/main-page/help.tsx` — bug-report link → CLDGayo/higherbits.
13. `apps/web/components/features/studio/sandbox/components/add-registry-modal.tsx` — "Add from 21st Registry" → "Add from HigherBits Registry".
14. `apps/web/components/features/publish/version-selector-dialog.tsx` — "Add components from 21st registry" → "HigherBits registry".
15. `apps/web/lib/emails/submission-status-template.tsx` — Twitter share text "@21st_dev!" → "HigherBits.dev!".

Brand-asset retirement (Step B + C0b):
16. `apps/web/components/ui/brand-assets-menu.tsx` — replaced `Logo21SVG` glyph with `HigherBitsLogoSVG` (hexagon outline matching logo.tsx); retired png/svg/zip download anchors (pointed to now-deleted 21st binaries); kept copy-SVG action; removed unused `Link` import + `logoFile` var.
17. DELETED 5 stale binaries: `apps/web/public/brand/21st-brand.zip`, `21st-logo-{dark,white}.{png,svg}` (empty `public/brand/` dir removed).

Backend CORS config (Step E0):
18. `apps/backend/src/routes/index.ts:17` — CORS allow-list origin `"https://21st.dev"` → `"https://higherbits.dev"` (single string swap; localhost + railway entries + array shape unchanged).

### Gate results

| Gate | Command | Result |
|---|---|---|
| Build | `corepack pnpm --filter web build` | exit 0 (90 routes) |
| Typecheck | `corepack pnpm --filter web exec tsc --noEmit` | exit 0 |
| Test | `corepack pnpm --filter web test` | 10/10 pass (4 files) |
| Residue (allow-list-aware) | content-line-aware exit-gate grep | 0 non-allow-listed matches |
| Logo21SVG | `grep -rn "Logo21SVG" apps/web/app apps/web/components apps/web/lib` | 0 |

Before→after residue: 24 raw "21st" matches → 0 brand residue; 18 allow-listed functional survivors remain by design.

### Survivors (allow-listed functional identifiers — intentionally kept)

- `use-file-system.ts` — `21st-registry.json` (×5), `@21st-dev/cli` command
- `magic/hero.tsx`, `magic/magic-header.tsx` — `21st-dev/magic-mcp` GitHub repo refs (live stars API + repo link)
- `magic/troubleshooting.tsx`, `troubleshooting-step.tsx` — `registry.npmjs.org/@21st-dev/magic` URL + `@21st-dev/magic` npm package
- `lib/codesandbox-sdk.ts` — `21st-vite` CodeSandbox template ID + hash
- `lib/config/magic-mcp.ts` — `@21st-dev/cli`, `@21st-dev/magic` npm package names

Renaming any of these would break Magic MCP integration or CodeSandbox provisioning — per Step A0 KEEP allow-list.

### Deviations from plan

None material. All within-blast-radius decisions the plan explicitly delegated to execute-agent:
- **GitHub link target:** chose `github.com/CLDGayo/higherbits` (the real HigherBits repo per all-context.md deployment note) over dropping the links — applied uniformly to all `serafimcloud/21st` display links AND the `github-stars-number` default prop.
- **brand-assets-menu redesign:** retired the png/svg/zip binary downloads (their target files were deleted) rather than regenerate HigherBits binaries; kept the copy-SVG action with a HigherBits hexagon mark.
- **CORS origin:** replaced (brand-correct swap) rather than allow-listed, per the task's explicit config-value-surgery hard rule.

### Known gaps

- Favicon/OG *image content* not visually inspected for legacy 21st glyphs (outside a grep-verifiable text sweep; deferred to Phase 5 QA per the plan's binary-asset Blockers note).
- `HigherBitsLogoSVG` visual correctness in the brand-assets menu (both themes) is the Agent-Probe row `logo21svg-visual-replacement` — not asserted by any automated test; recommend visual check at Phase 4/5.

---

## Inner Loop Refresh Note

**Date:** 12-07-26
**Trigger:** Phase 0 RESEARCH (inner-loop Step 1) completed -- findings folded into this plan.
**Sections changed:** Implementation Checklist (new Step A0 KEEP allow-list, new Step C0 confirmed
REPLACE list with per-file detail, new Step E0 apps/backend CORS caution item), Exit Gate (allow-list-
aware grep command)
**Summary:** Critical KEEP allow-list identified: @21st-dev/cli, @21st-dev/magic (npm packages),
21st-vite (CodeSandbox template ID), 21st-registry.json (filename) are FUNCTIONAL and must NOT be
renamed -- a blind find-replace would break Magic MCP + CodeSandbox integration. apps/backend's
"https://21st.dev" CORS-adjacent string needs careful inspection before touching. Full REPLACE list
of ~15 files confirmed as safe cosmetic brand-string targets, plus 5 binary brand assets to
delete/replace. package.json/layout.tsx metadata/manifest/sitemap/robots already confirmed clean --
no work needed there.
