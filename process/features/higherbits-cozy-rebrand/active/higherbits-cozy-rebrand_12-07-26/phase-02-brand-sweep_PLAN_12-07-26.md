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

- [ ] A1. Re-run `grep -ril "21st" apps/web/app apps/web/components apps/web/lib apps/backend
  2>/dev/null` (plain grep, explicit dirs, never `rg`) to reconfirm the Phase 00 inventory is
  still current (Phase 01's logo edits may have touched some of the same files).
- [ ] A2. Cross-check against Phase 00's Step C category breakdown (source code / asset / metadata
  / config) to plan replacement order.

### Step B — Retire the `Logo21SVG` brand asset

- [ ] B1. In `apps/web/components/ui/brand-assets-menu.tsx`, identify what `Logo21SVG` renders and
  where it's used (the brand-assets right-click menu, per `logo.tsx`'s `BrandAssetsMenu` import).
- [ ] B2. Replace or remove the `Logo21SVG` render with the HigherBits `Hexagon`-based mark (the
  same icon/wordmark pattern already used in `logo.tsx`'s `renderLogo()`) or retire the menu entry
  entirely if it no longer makes sense once 21st.dev branding is gone — execute-agent's call,
  documented in the report.
- [ ] B3. Confirm no other component imports `Logo21SVG` after this edit
  (`grep -rn "Logo21SVG" apps/web`).

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

- [ ] C1. Replace literal "21st.dev" / "21st" occurrences in component copy (footer, hero, command
  menu, github-stars widget, loading spinner) with "HigherBits" / "HigherBits.dev" as
  contextually appropriate (product name vs URL vs support email).
- [ ] C2. Replace occurrences in `lib/config/magic-mcp.ts`, `lib/emails/submission-status-template.tsx`,
  `lib/codesandbox-sdk.ts` — confirm each replacement doesn't change a functional config KEY name
  (e.g. an env var name or external API identifier) vs just display copy; only display-facing
  brand strings are in scope, not functional identifiers tied to actual third-party services.
- [ ] C3. Sweep the terms page and any remaining marketing/publish-flow surfaces for brand-string
  residue.

### Step D — Metadata + assets sweep

- [ ] D1. Fix `apps/web/package.json` name/description fields and any root package metadata
  carrying "21st" branding.
- [ ] D2. Fix OG/social meta tags in `apps/web/app/layout.tsx` or route-level `metadata` exports.
- [ ] D3. Fix sitemap, robots.txt, and manifest.json brand references if present.
- [ ] D4. Confirm/replace favicon and OG image assets under `apps/web/public/` if they carry 21st
  branding (image content, not just filename — flag if a new asset needs manual creation and note
  as a known-gap if outside a text-edit scope).

### Step E0 -- apps/backend CORS/functional-string caution (Phase 0 research finding, 12-07-26)

- [ ] E0. Inspect `apps/backend/src/routes/index.ts`'s `"https://21st.dev"` occurrence specifically
  before any apps/backend sweep. Determine if it is a CORS allow-list origin, redirect target, or
  similar functional config. If functional: leave unchanged and document as an explicit allow-list
  exception (per A0b). If it is genuinely just a comment or dead reference: safe to update.

### Step E — apps/backend residue

- [ ] E1. Sweep `apps/backend` for "21st" brand-string residue (Phase 00's Step C output).
- [ ] E2. Confirm every apps/backend edit is brand-string/copy-only — NO functional/route/config
  behavior change (apps/backend has no build/test gate wired into this program's TEST GATES list,
  so changes here must be conservative text-only edits, verified by a targeted re-grep, not a
  build run).

### Step F — Final verification sweep

- [ ] F1. Run the full residue grep again across ALL scoped dirs
  (`apps/web/app apps/web/components apps/web/lib apps/backend apps/web/public`) and confirm zero
  remaining case-insensitive "21st" matches, OR the explicit documented allow-list from Step A0
  (`@21st-dev/cli`, `@21st-dev/magic`, `21st-vite`, `21st-registry.json`, and the confirmed-
  functional `apps/backend` CORS string from Step E0 if applicable) -- these are functional
  identifiers, not brand residue, and MUST remain.
- [ ] F2. Record the before/after count diff in the phase report as the load-bearing proof for the
  program's Definition of Done criterion #2.

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
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
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
