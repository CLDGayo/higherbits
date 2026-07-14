---
name: plan:phase-19-templates-themes
description: Phase 19 — Add Templates and Themes content types to the Cozy Downloads registry, browse grids, and detail views with Pro gating parity.
date: 05-07-26
feature: monetization-catalog
phase: "19"
---

# Phase 19 — Templates & Themes

Date: 2026-07-05
Status: PLAN — pending PVL
Complexity: COMPLEX (multi-package blast radius, new server component, registry schema extension, 4 ordered sub-phases)
**Program:** 21st-clone phase program — inner loop (SPEC skipped; umbrella SPEC governs)

---

## Phase Completion Rules

This phase is complete when ALL of the following are true:

1. `node scripts/validate-registry.mjs` exits 0 with all 4 new seed files present.
2. `corepack pnpm --filter web test` passes with ≥80 tests (baseline preserved + new tests added).
3. `node --test scripts/__tests__/validate-registry.test.mjs` passes all cases including new template/theme/Palette_Tokens cases.
4. `corepack pnpm --filter web type-check` exits 0.
5. `corepack pnpm --filter @repo/ui type-check` exits 0.
6. Local Build Checkpoint: `/templates` and `/themes` browse grids render; theme detail shows swatches + install snippet; Pro theme locked for anonymous users; template detail shows PreviewEngine + demo tabs.
7. Validate-contract written (PVL complete) and Gate: PASS or accepted CONDITIONAL.

Phase status vocabulary: CODE DONE (gates not yet run) → VERIFIED (all gates above green + EVL confirmed).

---

## Overview

Add two new top-level content types — `template` and `theme` — to the Cozy Downloads registry and storefront. Templates reuse the existing Phase 17 PreviewTabs multi-demo machinery unchanged. Themes get a new `ThemeDetail` server component rendering palette swatches + a CSS-variable install snippet. Both surface at `/templates` and `/themes` via the existing dynamic category route (`[category]/page.tsx`) with no new route files. Pro gating parity applies to both, including installSnippet stripping for Pro themes accessed by non-Pro users.

---

## Goals

1. Extend `VALID_CONTENT_TYPES` in `scripts/validate-registry.mjs` to include `template` and `theme`; add optional `Palette_Tokens` validation.
2. Extend `RegistryEntry` type in `apps/web/lib/registry.ts` with `contentType`, `installSnippet`, and `paletteTokens` fields; update `parseRawEntry` to extract them (with theme-specific source-guard opt-out).
3. Add content-type branch to the detail page (`apps/web/app/(catalog)/[category]/[slug]/page.tsx`) rendering `ThemeDetail` for themes, `PreviewEngine` for everything else.
4. Create 4 seed registry files (3 themes + 1 template) in `docs/evidence-manifest/registry/`.
5. Add R2 upload wrapper `ops/upload-seed-entries.mjs`.
6. Extend tests: validate-registry tests for new Content_Types + Palette_Tokens; registry.ts parseRawEntry theme fixture; catalog browse fixture; paywall parity for installSnippet stripping.

**Local Build Checkpoint (from roadmap delivery cadence):**
`corepack pnpm --filter web dev` → browse `/templates` and `/themes`; open one of each; preview renders, source stays Pro-gated for Pro entries.

---

## Sub-Phase Ordering

| Sub-phase | Scope | Dependencies |
|---|---|---|
| 19a | Schema + validator + registry.ts type/parse | none (foundation) |
| 19b | Detail page branch + ThemeDetail component | 19a |
| 19c | 4 seed registry files | 19a; parallel-safe with 19b (disjoint file groups) |
| 19d | R2 upload wrapper + full test coverage | 19c (needs seed files for fixtures) |

---

## Touchpoints

Every file touched or read by this phase:

### Modified / Created

| File | Change |
|---|---|
| `scripts/validate-registry.mjs` | Line 33 — extend `VALID_CONTENT_TYPES` to `["component", "block", "hook", "template", "theme"]`; add `Palette_Tokens` optional validation block (JSON array of `{name, value}`) |
| `scripts/__tests__/validate-registry.test.mjs` | Add: template/theme Content_Type accepted; Palette_Tokens structure validation (valid + malformed cases) |
| `apps/web/lib/registry.ts` | Add optional fields to `RegistryEntry`: `contentType?: string`, `installSnippet?: string`, `paletteTokens?: Array<{name: string; value: string}>`. Update `parseRawEntry`: (a) extract `Content_Type:` frontmatter → `contentType`; (b) theme opt-out: when `contentType === "theme"`, skip the `if (!source) return null` guard and return entry with `source: ""`; (c) extract `## Install Snippet (.css)` body block → `installSnippet`; (d) parse `Palette_Tokens:` frontmatter JSON → `paletteTokens` |
| `apps/web/__tests__/registry.test.ts` | Add: parseRawEntry theme fixture (no Source block → not null, installSnippet extracted, paletteTokens parsed, contentType = "theme"); contentType extraction for component/template |
| `apps/web/app/(catalog)/[category]/[slug]/page.tsx` | Add content-type branch: when `entry.contentType === "theme"`, render `<ThemeDetail>` instead of `<PreviewEngine>`; strip `installSnippet` for Pro themes when user is not Pro |
| `apps/web/components/preview/theme-detail.tsx` | NEW server component: accepts `paletteTokens`, `installSnippet`, `locked` props; renders swatch grid + code block (no `dangerouslySetInnerHTML`); pure server component |
| `docs/evidence-manifest/registry/themes__cozy-daylight.md` | NEW seed file — Cozy Daylight theme, IsPro: false |
| `docs/evidence-manifest/registry/themes__lofi-dusk.md` | NEW seed file — Lofi Dusk theme, IsPro: true |
| `docs/evidence-manifest/registry/themes__paper-cafe.md` | NEW seed file — Paper Café theme, IsPro: false |
| `docs/evidence-manifest/registry/templates__cozy-landing.md` | NEW seed file — Cozy Landing template, IsPro: true, Demos frontmatter |
| `ops/upload-seed-entries.mjs` | NEW ~25-line script batching uploads of the 4 new registry files via existing `ops/r2-client.mjs`; guards each upload with the same IsPro-skip regex pattern as `ops/github-ingest.mjs` (commit 90fb7ed) |
| `ops/__tests__/upload-seed-entries.test.mjs` | NEW test file (node --test runner) — asserts `uploadToR2` is never invoked for IsPro:true fixture markdown, and IS invoked for IsPro:false fixture markdown |
| `apps/web/__tests__/catalog.test.ts` | Add: getCategoryEntries("templates") + getCategoryEntries("themes") fixtures |
| `apps/web/__tests__/paywall-demo.test.ts` | Add: paywall parity test for theme installSnippet stripping (Pro theme, non-Pro user → installSnippet null/undefined; Pro user → installSnippet present) |

### Read-Only Context

| File | Why |
|---|---|
| `apps/web/app/(catalog)/[category]/page.tsx` | Verify no route-file changes needed (category-as-surface confirmed) |
| `apps/web/lib/catalog.ts` | Confirm existing category routing handles new string categories |
| `ops/r2-client.mjs` | Understand existing API before writing upload wrapper |
| `docs/evidence-manifest/registry/cozy-buttons__soft-button.md` | Frontmatter shape reference |

---

## Public Contracts

These interfaces are visible to other packages or callers — changes must be backward compatible.

### 1. Registry YAML Frontmatter Schema (public contract — extended, backward compatible)

New optional fields added. Existing entries without these fields are valid and unchanged.

```
Palette_Tokens: '[{"name":"bg","value":"#FAF6F0"},...]'   # optional; JSON array {name, value}
```

`Content_Type` now accepts: `component | block | hook | template | theme` (was: `component | block | hook`).

`## Install Snippet (.css)` body section — new optional body block extracted into `installSnippet`.

### 2. RegistryEntry TypeScript interface (apps/web/lib/registry.ts)

New optional fields appended — no existing field renamed or removed:

```typescript
contentType?: string        // extracted from Content_Type frontmatter
installSnippet?: string     // extracted from ## Install Snippet (.css) body block
paletteTokens?: Array<{name: string; value: string}>  // parsed from Palette_Tokens frontmatter JSON
```

### 3. ThemeDetail component props (apps/web/components/preview/theme-detail.tsx)

```typescript
interface ThemeDetailProps {
  paletteTokens?: Array<{name: string; value: string}>;
  installSnippet?: string;
  locked: boolean;
}
```

Pure server component — no client bundle added.

---

## Blast Radius

| Package / Path | Files changed | Risk class |
|---|---|---|
| `scripts/` | validate-registry.mjs, __tests__/validate-registry.test.mjs | LOW — additive only |
| `apps/web/lib/` | registry.ts | MEDIUM — type extension + new parse branch |
| `apps/web/app/(catalog)/[category]/[slug]/` | page.tsx | MEDIUM — new conditional render branch |
| `apps/web/components/preview/` | theme-detail.tsx (new) | LOW — new file |
| `apps/web/__tests__/` | registry.test.ts, catalog.test.ts, paywall-demo.test.ts | LOW — additive tests |
| `docs/evidence-manifest/registry/` | 4 new .md files | LOW — new files only |
| `ops/` | upload-seed-entries.mjs (new), `__tests__/upload-seed-entries.test.mjs` (new) | LOW — new files, Pro-skip guard mirrors hardened pattern |

**Total file count:** ~14 files modified or created.
**Existing test baseline:** 80/80 passing (Phase 18 EVL confirmed). Must remain 80/80 after this phase.
**No schema/DB/auth surface changes.** No new npm dependencies required.

---

## Implementation Checklist

### 19a — Schema + Validator + Registry Type/Parse

- [ ] **19a.1** Read `scripts/validate-registry.mjs` line 33; change `VALID_CONTENT_TYPES` from `["component", "block", "hook"]` to `["component", "block", "hook", "template", "theme"]`.
- [ ] **19a.2** In `scripts/validate-registry.mjs`, after the existing `Demos` validation block, add `Palette_Tokens` optional validation: if field present and non-empty, parse as JSON; if valid array, verify each entry has a non-empty `name` (string) and non-empty `value` (string); push error strings on failure. Same try/catch pattern as Changelog/Demos.
- [ ] **19a.3** In `apps/web/lib/registry.ts`, add three optional fields to the `RegistryEntry` interface after `demos?`: `contentType?: string`, `installSnippet?: string`, `paletteTokens?: Array<{name: string; value: string}>`.
- [ ] **19a.4** In `parseRawEntry`: extract `Content_Type:` frontmatter line → `contentType` (same regex pattern as other scalar fields: `/^Content_Type:\s*(.+)$/m`).
- [ ] **19a.5** In `parseRawEntry`: add theme source-guard opt-out. Current line ~59: `const source = extractFenced(raw, "Source (.tsx)", "tsx"); if (!source) return null;`. Change to: extract source first; if `!source` AND `contentType !== "theme"`, return null; else continue (source will be `""` for themes).
- [ ] **19a.6** In `parseRawEntry`: extract `## Install Snippet (.css)` body block using existing `extractFenced` helper → `installSnippet`. Call: `extractFenced(raw, "Install Snippet (.css)", "css")`.
- [ ] **19a.7** In `parseRawEntry`: parse `Palette_Tokens:` frontmatter JSON → `paletteTokens`. Pattern: same as `Changelog`/`Demos` — match `/^Palette_Tokens:\s*(.+)$/m`, strip quote wrapper, `JSON.parse`, validate it is an array; on error leave undefined (never throw).
- [ ] **19a.8** In `parseRawEntry` return object: add `contentType`, `installSnippet`, `paletteTokens` fields.
- [ ] **19a.9** Run `corepack pnpm --filter web type-check` — must exit 0 before proceeding to 19b.

### 19b — Detail Page Branch + ThemeDetail Component

- [ ] **19b.1** Create `apps/web/components/preview/theme-detail.tsx` as a pure async server component. Props: `paletteTokens?: Array<{name: string; value: string}>`, `installSnippet?: string`, `locked: boolean`. Renders:
  - When `locked`: show locked placeholder message (consistent with existing `LOCKED_SOURCE` pattern — plain text, no source code).
  - When not locked: swatch grid (`<ul>` or `<div>` with one item per `paletteTokens` entry — each item shows the color as a `<span>` with `backgroundColor` inline style + `name` label + `value` text); install snippet in a `<pre><code>` block (NOT `dangerouslySetInnerHTML`). No client bundle.
- [ ] **19b.2** In `apps/web/app/(catalog)/[category]/[slug]/page.tsx`: import `ThemeDetail` from `@/components/preview/theme-detail`.
- [ ] **19b.3** In `page.tsx`: after the `locked` variable is derived, add server-side installSnippet stripping: `const installSnippet = locked ? undefined : entry.installSnippet`.
- [ ] **19b.4** In `page.tsx` JSX: replace the single `<PreviewEngine ...>` render with a conditional: `entry.contentType === "theme" ? <ThemeDetail paletteTokens={entry.paletteTokens} installSnippet={installSnippet} locked={locked} /> : <PreviewEngine ...>` (PreviewEngine block unchanged).
- [ ] **19b.5** Run `corepack pnpm --filter web type-check` — must exit 0.

### 19c — Seed Registry Files

All 4 files go in `docs/evidence-manifest/registry/`. Use exact palette values from Decision Summary.

- [ ] **19c.1** Create `docs/evidence-manifest/registry/themes__cozy-daylight.md`:
  - Frontmatter: `Component_Name: Cozy Daylight`, `Category: themes`, `Dependencies: []`, `Animation_Library: none`, AI_Behavioral_Summary (2 sentences), `Content_Type: theme`, `Author: CLDGayo`, `Source_Repo: https://github.com/CLDGayo/cozy-downloads`, `License_SPDX: MIT`, `IsPro: false`.
  - `Palette_Tokens` (single-line JSON): 8 tokens — bg #FAF6F0, panel #FFFFFF, ink #2B2622, muted #8A7F72, hairline #EBE2D6, accent-peach #FFB98A, accent-sage #A8C6A1, accent-lavender #C7B9E8.
  - Body: `## Install Snippet (.css)` code block with CSS custom properties. No `## Source (.tsx)` block.

- [ ] **19c.2** Create `docs/evidence-manifest/registry/themes__lofi-dusk.md`:
  - Same structure. `IsPro: true`. Palette: bg #1A1714, panel #241F1B, ink #F3EDE4, muted #A99C8C, hairline #342C25, accent-orange #E8946A, accent-green #8FB489, accent-purple #AC9BD6.
  - Body: `## Install Snippet (.css)` with dark-theme CSS custom properties.

- [ ] **19c.3** Create `docs/evidence-manifest/registry/themes__paper-cafe.md`:
  - Same structure. `IsPro: false`. Palette: bg #F6F1E7, panel #FFFDF8, ink #3A322B, muted #94897B, hairline #E7DECE, accent-rose #E8A9A0, accent-teal #9DBFB4, accent-gold #F2D5A0.
  - Body: `## Install Snippet (.css)`.

- [ ] **19c.4** Create `docs/evidence-manifest/registry/templates__cozy-landing.md`:
  - Frontmatter: `Component_Name: Cozy Landing`, `Category: templates`, `Dependencies: []`, `Animation_Library: CSS`, `Content_Type: template`, `Author: CLDGayo`, `Source_Repo: https://github.com/CLDGayo/cozy-downloads`, `License_SPDX: MIT`, `IsPro: true`.
  - `Demos: '[{"id":"hero","label":"Hero"},{"id":"features","label":"Features"}]'`
  - Body: `## Source (.tsx)` (minimal placeholder TSX), `## Source (demo: hero) (.tsx)`, `## Source (demo: features) (.tsx)`.

- [ ] **19c.5** Run `node scripts/validate-registry.mjs` after all 4 files — must exit 0 with no errors.

### 19d — R2 Upload Wrapper + Tests

- [ ] **19d.1** Create `ops/upload-seed-entries.mjs`: batch-upload the 4 new registry files via `ops/r2-client.mjs`. Read each file with `readFile`. **Before calling the upload helper for each file, guard with the same IsPro-skip regex used in `ops/github-ingest.mjs` (line 341): `if (!/^IsPro:\s*true\b/m.test(registryMarkdown)) { await uploadToR2({...}); } else { console.warn(`SKIPPED ${path.basename(registryPath)}: IsPro:true — never uploaded to public CDN bucket`); }`.** This means `themes__lofi-dusk.md` and `templates__cozy-landing.md` (both `IsPro: true`) must be SKIPPED with a `SKIPPED...` warn log, while `themes__cozy-daylight.md` and `themes__paper-cafe.md` (both `IsPro: false`) upload normally. Call the r2-client upload helper with key `registry/{category}__{slug}.md`. Log one line per upload or skip. Export the upload function (and the guard check, e.g. as a named export) for testability. Keep under 35 lines.
- [ ] **19d.1b** Create `ops/__tests__/upload-seed-entries.test.mjs` (node --test runner, mocked `uploadToR2` — same mocking pattern as `ops/__tests__/github-ingest.test.mjs`): assert `uploadToR2` mock is NEVER called when processing an `IsPro: true` fixture markdown string (Lofi Dusk / Cozy Landing style fixture); assert `uploadToR2` mock IS called exactly once when processing an `IsPro: false` fixture markdown string (Cozy Daylight / Paper Café style fixture); assert the SKIPPED warn log fires for the IsPro:true case.
- [ ] **19d.2** In `scripts/__tests__/validate-registry.test.mjs`: add test cases for `template` Content_Type accepted, `theme` Content_Type accepted, `Palette_Tokens` valid JSON array of `{name, value}` accepted, `Palette_Tokens` entry missing `name` emits error, `Palette_Tokens` not a JSON array emits error, `Palette_Tokens` entry missing `value` emits error. (Currently 13 tests — add ~6 cases.)
- [ ] **19d.3** In `apps/web/__tests__/registry.test.ts`: add test — `parseRawEntry` with a theme fixture (no `## Source (.tsx)` block) returns non-null entry with `source: ""`, `contentType: "theme"`, `installSnippet` extracted, `paletteTokens` array parsed. Also add test — `parseRawEntry` component fixture returns `contentType: "component"`.
- [ ] **19d.4** In `apps/web/__tests__/catalog.test.ts`: add fixture tests for `getCategoryEntries("templates")` and `getCategoryEntries("themes")` — confirm entries returned for both categories.
- [ ] **19d.5** In `apps/web/__tests__/paywall-demo.test.ts`: add test — theme installSnippet paywall parity: `locked: true` (Pro theme, non-Pro user) → installSnippet passed to ThemeDetail is undefined; `locked: false` → installSnippet is the real value. Unit test of the server-side stripping logic in page.tsx, not a render test (no jsdom needed).
- [ ] **19d.6** Run full test suite: `corepack pnpm --filter web test` — must be ≥80 passing. Run `node --test scripts/__tests__/validate-registry.test.mjs` — must pass. Run `node --test ops/__tests__/github-ingest.test.mjs` — must remain 4/4. Run `node --test ops/__tests__/upload-seed-entries.test.mjs` — must pass, confirming IsPro:true fixtures are never uploaded.
- [ ] **19d.7** Run `node scripts/validate-registry.mjs` — all registry files pass.
- [ ] **19d.8** Run `corepack pnpm --filter web type-check` — exit 0.
- [ ] **19d.9** Run `corepack pnpm --filter @repo/ui type-check` — exit 0.

### Post-Execute

- [ ] **PE.1** Local Build Checkpoint: `corepack pnpm --filter web dev` → navigate to `/templates` and `/themes`; confirm browse grid renders entries; open one template detail (PreviewEngine + tabs); open one theme detail (ThemeDetail — swatches + install snippet); open Lofi Dusk (IsPro: true) anonymously — confirm source stays locked.
- [ ] **PE.2** Run `graphify update .` (delivery cadence).
- [ ] **PE.3** Commit via `vc-git-manager` — conventional commit: `feat(catalog): add templates and themes content types with browse and detail views`.

---

## Acceptance Criteria

| # | Criterion | proven by | strategy |
|---|---|---|---|
| AC-1 | `node scripts/validate-registry.mjs` exits 0 with template and theme entries present | `node scripts/validate-registry.mjs` + `node --test scripts/__tests__/validate-registry.test.mjs` | Fully-Automated |
| AC-2 | `parseRawEntry` on a theme file with no Source block returns non-null entry with `contentType: "theme"`, `installSnippet`, `paletteTokens` | vitest registry.test.ts theme fixture | Fully-Automated |
| AC-3 | TypeScript type-check exits 0 across apps/web and @repo/ui | `corepack pnpm --filter web type-check` + `@repo/ui type-check` | Fully-Automated |
| AC-4 | Full vitest suite passes with baseline 80 tests preserved plus new additions | `corepack pnpm --filter web test` | Fully-Automated |
| AC-5 | `/templates` and `/themes` browse grids render entries in dev server | Local Build Checkpoint | Agent-Probe |
| AC-6 | Theme detail page shows palette swatches + install snippet; NO dangerouslySetInnerHTML | Local Build Checkpoint — theme detail browse | Agent-Probe |
| AC-7 | Pro theme (Lofi Dusk) detail page locked for non-Pro user; installSnippet stripping verified by unit test | paywall-demo.test.ts + Local Build Checkpoint | Fully-Automated + Agent-Probe |
| AC-8 | Template detail page shows PreviewEngine + demo tabs (Phase 17 machinery) | Local Build Checkpoint | Agent-Probe |

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `node scripts/validate-registry.mjs` exits 0 — 4 seed files valid | Fully-Automated | AC-1: validator accepts template + theme Content_Types |
| `node --test scripts/__tests__/validate-registry.test.mjs` — template/theme Content_Type accepted; Palette_Tokens valid/invalid cases | Fully-Automated | AC-1: validator logic correct |
| `corepack pnpm --filter web test` — registry.test.ts theme fixture (no source → non-null, contentType/installSnippet/paletteTokens extracted) | Fully-Automated | AC-2: parseRawEntry theme path |
| `corepack pnpm --filter web test` — paywall-demo.test.ts installSnippet stripping for Pro theme | Fully-Automated | AC-7: Pro gating parity for themes |
| `corepack pnpm --filter web test` — catalog.test.ts templates/themes fixture entries returned | Fully-Automated | AC-5: category routing works |
| `corepack pnpm --filter web type-check` exits 0 | Fully-Automated | AC-3: RegistryEntry type extension valid |
| `corepack pnpm --filter @repo/ui type-check` exits 0 | Fully-Automated | AC-3: no unintended blast radius on @repo/ui |
| `node --test ops/__tests__/github-ingest.test.mjs` 4/4 pass | Fully-Automated | Regression: ops/ unaffected |
| `node --test ops/__tests__/upload-seed-entries.test.mjs` — `uploadToR2` never called for IsPro:true fixtures, called once for IsPro:false fixtures | Fully-Automated | GAP-1 fix: R2 Pro-skip guard prevents Pro-gated markdown from reaching public CDN bucket |
| Local Build Checkpoint: `/templates` + `/themes` browse grids render | Agent-Probe | AC-5: category-as-surface works via existing route |
| Local Build Checkpoint: theme detail shows swatches + snippet (not dangerouslySetInnerHTML) | Agent-Probe | AC-6: ThemeDetail renders correctly |
| Local Build Checkpoint: Lofi Dusk (Pro, anonymous) shows locked state | Agent-Probe | AC-7: Pro gating parity |
| Local Build Checkpoint: template detail shows PreviewEngine + demo pills | Agent-Probe | AC-8: templates reuse Phase 17 machinery |

---

## Dependencies

- **Phase 18 complete (confirmed):** R2 migration done; `ops/r2-client.mjs` exists and exports upload helper; vitest baseline 80/80.
- **19a before 19b:** `RegistryEntry` type must have `contentType` field before `page.tsx` branch can reference it.
- **19a before 19c:** `Content_Type: theme` / `template` must pass validator before seed files can be committed cleanly.
- **19c before 19d.3:** Seed files must exist before registry.test.ts fixture tests are meaningful.
- **No new npm dependencies required.** All patterns use existing code: `extractFenced`, regex frontmatter extraction, JSON.parse try/catch, `vi.mock`.

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Theme source-guard opt-out causes existing component tests to regress (parseRawEntry change) | LOW | 19a.5 is narrowly scoped — only skips guard when `contentType === "theme"`; component path unchanged |
| `page.tsx` branch breaks existing component pages | LOW | Branch keyed on `entry.contentType === "theme"` — existing entries have no `contentType` field (undefined), so they fall through to PreviewEngine unchanged |
| `Palette_Tokens` JSON parse fails for malformed values | HANDLED | try/catch pattern (same as Demos/Changelog) — malformed leaves `paletteTokens: undefined`, no throw |
| `registry.test.ts` pre-existing 4 failures interfere with new tests | LOW | New tests are additive; pre-existing failures are in unrelated registry fetch paths (baseline-confirmed) |
| `ThemeDetail` accidentally included in client bundle | LOW | No `"use client"` directive; Next.js App Router treats RSC as server component by default; verify in build output |

---

## Test Infra Improvement Notes

- The 4 pre-existing failures in `registry.test.ts` are baseline-confirmed (file-read path, not the parse path). New `parseRawEntry` theme fixture tests are additive and do not interact with failing tests.
- `apps/web` has NO ESLint gate — `tsc --noEmit` is the working type gate. Do not add an ESLint step.
- `ThemeDetail` render test could be added with jsdom (`@vitest-environment jsdom`) in a future phase — not required for Phase 19 (Agent-Probe via Local Build Checkpoint is sufficient for this phase).

---

## Resume and Execution Handoff

1. **Selected plan file path:** `process/features/monetization-catalog/active/phase-19-templates-themes_05-07-26/phase-19-templates-themes_PLAN_05-07-26.md`
2. **Last completed phase or step:** PLAN written — not yet started
3. **Validate-contract status:** pending — vc-validate-agent writes this section (PVL next)
4. **Supporting context files loaded:**
   - `process/context/all-context.md`
   - `process/context/tests/all-tests.md`
   - `apps/web/lib/registry.ts` (full file — line numbers confirmed)
   - `scripts/validate-registry.mjs` (VALID_CONTENT_TYPES at line 33, Demos validation pattern for reference)
   - `apps/web/app/(catalog)/[category]/[slug]/page.tsx` (full file — branch insertion point at JSX return, line ~123 `<PreviewEngine ...>`)
5. **Next step for a fresh agent picking up mid-execution:**
   - Sub-phase 19a: edit `scripts/validate-registry.mjs` (line 33 + Palette_Tokens block); edit `apps/web/lib/registry.ts` (add 3 interface fields + parseRawEntry changes 19a.4–19a.8). Type-check.
   - Sub-phase 19b: create `apps/web/components/preview/theme-detail.tsx`; update `page.tsx` (import + installSnippet strip + conditional render). Type-check.
   - Sub-phase 19c: write 4 registry files; run `node scripts/validate-registry.mjs`.
   - Sub-phase 19d: write `ops/upload-seed-entries.mjs`; add all new test cases (19d.2–19d.5); run full test suite.
   - Finish: Local Build Checkpoint → `graphify update .` → commit.

---

## Phase Loop Progress

- [x] Step 1: RESEARCH
- [x] Step 2: INNOVATE (Decision Summary locked — DONE)
- [x] Step 3: PLAN (this document)
- [x] Step 4: PVL (validate-contract) — PASS (cycle 2, GAP-1 resolved via supplement)
- [x] Step 5: EXECUTE — PHASE_COMPLETE 05-07-26 (29/29 steps, agent-reported gates green)
- [x] Step 6: EVL — 6/6 gates green, independent vc-tester run 05-07-26 (vitest 87/87, validate-registry 20/20, ingest 5/5, upload-seed 2/2, registry lint 154 files exit 0, type-checks exit 0)
- [x] Step 7: UPDATE PROCESS — archived; context updated; committed

---

## Validate Contract

Status: PASS
Date: 05-07-26
date: 2026-07-05
generated-by: inner-pvl: phase-19
supersedes: 2026-07-05 (inner-pvl: phase-19) — inner PVL has current evidence (cycle 2, GAP-1 supplement applied)

Parallel strategy: parallel-subagents
Rationale: Signal score 3/7 (S1 multi-package: scripts/ + apps/web/lib/ + apps/web/app/ + apps/web/components/ + docs/ + ops/; S6 high-risk class present — permission/secret/trust-boundary via Pro-gated public CDN exposure, now closed by the GAP-1 supplement; S7 14 files in blast radius). Layer 1 (4 dimension agents) + Layer 2 (4 section agents: 19a/19b/19c/19d) run independently with no cross-agent coordination needed — parallel subagents fit, not agent-team.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC-1 | validate-registry.mjs accepts template/theme Content_Type + Palette_Tokens schema | Fully-Automated | `node scripts/validate-registry.mjs` (exit 0, confirmed baseline live at cycle 1) + `node --test scripts/__tests__/validate-registry.test.mjs` (confirmed 14/14 passing at baseline) | A |
| AC-2 | parseRawEntry theme fixture (no Source block) returns non-null entry with contentType/installSnippet/paletteTokens | Fully-Automated | `corepack pnpm --filter web test` — registry.test.ts theme fixture (new); source-guard opt-out confirmed at exact lines 59-60 of apps/web/lib/registry.ts in this re-validate pass | A |
| AC-3 | TypeScript type-check exits 0 across apps/web and @repo/ui | Fully-Automated | `corepack pnpm --filter web type-check` (confirmed exit 0 at baseline) + `corepack pnpm --filter @repo/ui type-check` (confirmed exit 0 at baseline) | A |
| AC-4 | Full vitest suite passes with baseline preserved plus new additions | Fully-Automated | `corepack pnpm --filter web test` (confirmed 80/80 passing at baseline, 19 files) | A |
| AC-5 | /templates and /themes browse grids render entries via existing dynamic [category] route | Agent-Probe | Local Build Checkpoint: `corepack pnpm --filter web dev` → navigate /templates, /themes | A |
| AC-6 | Theme detail shows palette swatches + install snippet, no dangerouslySetInnerHTML | Agent-Probe | Local Build Checkpoint — open one theme detail page; grep theme-detail.tsx for `dangerouslySetInnerHTML` (must be 0 matches) | B |
| AC-7 | Pro theme (Lofi Dusk) installSnippet stripped server-side for non-Pro users; parity with existing source/demos stripping | Fully-Automated + Agent-Probe | `corepack pnpm --filter web test` — paywall-demo.test.ts new stripping test + Local Build Checkpoint anonymous view | B (server-render path only — R2 write-path now separately covered by GAP-1 row below) |
| AC-8 | Template detail shows PreviewEngine + demo tabs (Phase 17 machinery reused unchanged) | Agent-Probe | Local Build Checkpoint — open template detail page, confirm demo pill tabs render | A |
| GAP-1 | ops/upload-seed-entries.mjs must never upload IsPro:true registry markdown to the public R2 bucket (regression guard matching commit 90fb7ed) | Fully-Automated | `ops/__tests__/upload-seed-entries.test.mjs` (checklist 19d.1b, node --test, mocked uploadToR2) — asserts uploadToR2 is never invoked for IsPro:true fixture markdown and IS invoked once for IsPro:false fixture markdown; guard implementation specified in 19d.1 mirrors `ops/github-ingest.mjs:341` regex (`/^IsPro:\s*true\b/m`), confirmed exact line match in this re-validate pass | B — resolved this cycle: guard + test both now specified in plan checklist (19d.1, 19d.1b) |

Failing stub (AC-2, Fully-Automated):
```
test("should return non-null entry for theme fixture with no Source block, extracting contentType/installSnippet/paletteTokens", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: parseRawEntry theme fixture extraction")
})
```

Failing stub (GAP-1, Fully-Automated):
```
test("should never call uploadToR2 for IsPro:true fixture markdown, and should call it once for IsPro:false fixture markdown", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: upload-seed-entries.mjs IsPro-skip guard")
})
```

gap-resolution legend:
- A — proven now (gate passes in this cycle, baseline confirmed live in this VALIDATE session)
- B — fixed in this plan (gate added by this plan's checklist, now fully specified — no outstanding supplement)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies (Fully-Automated / Hybrid / Agent-Probe). No Known-Gap rows in this contract — all gaps are A (proven at baseline) or B (fixed-in-plan, fully specified after this cycle's supplement).

Legacy line form (retained so existing validate-contract consumers still parse):
- scripts/validate-registry.mjs + tests: Fully-automated: `node scripts/validate-registry.mjs` + `node --test scripts/__tests__/validate-registry.test.mjs`
- apps/web/lib/registry.ts parseRawEntry: Fully-automated: `corepack pnpm --filter web test` (registry.test.ts)
- apps/web/app/(catalog)/[category]/[slug]/page.tsx + theme-detail.tsx: Agent-probe: Local Build Checkpoint (theme detail render, no dangerouslySetInnerHTML)
- Pro gating parity (source/demos/installSnippet): Fully-automated: `corepack pnpm --filter web test` (paywall-demo.test.ts)
- ops/upload-seed-entries.mjs Pro-skip guard: Fully-automated: `node --test ops/__tests__/upload-seed-entries.test.mjs` (RESOLVED this cycle — was known-gap/blocking, now specified and gated)
- Type gates: Fully-automated: `corepack pnpm --filter web type-check` + `corepack pnpm --filter @repo/ui type-check`
- Regression: Fully-automated: `node --test ops/__tests__/github-ingest.test.mjs`

Dimension findings:
- Infra fit: PASS — `[category]/page.tsx` already generic/dynamic (getCategoryEntries filters by string match); /templates and /themes require zero route registration; REGISTRY_DIR path resolution unchanged and correct. Unchanged from cycle 1 (no code touched by this supplement).
- Test coverage: PASS — the cycle-1 CONCERN ("no test planned for the R2 upload guard because the guard itself was missing from the plan") is now resolved: 19d.1 specifies the guard, 19d.1b specifies the asserting test (`ops/__tests__/upload-seed-entries.test.mjs`, node --test, mocked uploadToR2, same pattern as `ops/__tests__/github-ingest.test.mjs`). All 5 previously-confirmed baseline test gates remain green and were not re-run this cycle since the supplement changed plan prose only, not code (vitest 80/80 across 19 files, validate-registry.test.mjs 14/14, github-ingest.test.mjs 5/5 confirmed by test-count grep this cycle, validate-registry.mjs exit 0, both type-checks exit 0 — all cited from cycle 1 baseline, re-affirmed by file-existence and line-number spot checks in this cycle rather than a full re-run).
- Breaking changes: PASS — all new RegistryEntry fields optional/additive; parseRawEntry guard change re-verified at exact lines 59-60 in this cycle (`const source = extractFenced(...)` / `if (!source) return null;`); catalog.ts confirmed already dynamic/generic; VALID_CONTENT_TYPES confirmed at exact line 33 in this cycle. Unchanged from cycle 1 — no new breaking-change surface introduced by the supplement (prose-only change).
- Security surface: PASS — the cycle-1 FAIL ("ops/upload-seed-entries.mjs had no IsPro-skip guard before uploadToR2") is resolved: checklist 19d.1 now specifies the guard mirroring `ops/github-ingest.mjs:341`'s exact regex (`/^IsPro:\s*true\b/m`, confirmed exact-line match again in this cycle), plus an explicit `console.warn("SKIPPED...")` log (a plan-specified enhancement over the source hook, which has no warn-on-skip — this is additive rigor, not a factual misquote, since 19d.1 describes new code being written, not a claim about existing hook behavior). 19d.1b adds the asserting unit test. Both new seed files that are IsPro:true (`themes__lofi-dusk.md`, `templates__cozy-landing.md`) are now covered by an explicit skip-guard requirement before any upload path exists.

Open gaps: none blocking. All prior FAIL/CONCERN items resolved by the GAP-1 supplement.

Minor (non-blocking, informational, carried from cycle 1 — still accurate, not itself gating):
- `process/context/tests/all-tests.md` still shows a stale pre-Phase-18 baseline (65/71 passing); actual current baseline is 80/80 across 19 files. Does not affect this plan; refresh at UPDATE PROCESS.
- Plan's task-note references to "13 tests" for validate-registry.test.mjs are stale (actual: 14, confirmed again this cycle) — harmless since the gate is "must remain passing," not a fixed-count assertion; worth a plan touch-up at EXECUTE for accuracy.

What this coverage does NOT prove:
- `node scripts/validate-registry.mjs` + validate-registry.test.mjs: proves frontmatter schema correctness only — does NOT prove the seed files' actual palette/CSS content is visually correct or that install snippets apply cleanly in a real browser.
- registry.test.ts theme fixture: proves parseRawEntry's extraction logic in isolation — does NOT prove the R2 hydration fallback path (fetchRegistryFromR2) behaves identically for theme entries, since that path is untested by this gate (real network call, mocked out).
- type-check gates: prove type correctness only — do NOT prove runtime behavior, render correctness, or that ThemeDetail avoids client-bundle inclusion (that requires inspecting build output, an Agent-Probe step not currently listed as a distinct gate).
- paywall-demo.test.ts stripping test: proves the in-request server-render stripping logic only — does NOT prove the R2 write-path (upload-seed-entries.mjs) in a live network sense; `ops/__tests__/upload-seed-entries.test.mjs` proves the guard logic against a mocked `uploadToR2`, not an end-to-end call against a real R2 bucket.
- `ops/__tests__/upload-seed-entries.test.mjs` (GAP-1 gate): proves the guard's decision logic (skip vs upload) against mocked fixtures — does NOT prove the real 4 seed files, once written in 19c, actually match the `IsPro:` frontmatter format the regex expects (that is confirmed separately by `node scripts/validate-registry.mjs` passing on the real files, and should be spot-checked again at EXECUTE once 19c and 19d land together).
- Local Build Checkpoint (Agent-Probe rows): proves visual/interactive correctness once, manually, in dev mode — does NOT prove production build behavior, does NOT prove behavior under concurrent access, and is not repeatable/regression-safe the way a Fully-Automated gate is.
- github-ingest.test.mjs regression check: proves the existing MIT-ingestion tool's R2 guard still works — does NOT prove `upload-seed-entries.mjs` (a separate, new code path) behaves identically at runtime beyond what its own dedicated test (19d.1b) asserts against mocks.

Gate: PASS
Accepted by: session — no CONCERN or FAIL items remain; GAP-1 fully resolved via plan-validate-fix cycle 2 (checklist 19d.1 + 19d.1b).
