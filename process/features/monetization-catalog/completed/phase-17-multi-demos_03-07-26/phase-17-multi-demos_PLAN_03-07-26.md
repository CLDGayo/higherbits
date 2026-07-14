---
name: plan:phase-17-multi-demos
description: "Phase 17: Multiple Demos + Demo Video Support (manual pre-recording) — Demos frontmatter field, demo switcher pill UI, per-demo paywall stripping, Git LFS video workflow"
date: 03-07-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: 17
---

# Phase 17 — Multiple Demos + Demo Video Support (manual pre-recording)

Date: 03-07-26
Status: PLAN
Complexity: COMPLEX (multi-package: apps/web, packages/ui, packages/db, scripts/, ops/, docs/evidence-manifest/registry/, .gitattributes)

## Phase Loop Progress

- [x] Step 1 — RESEARCH (complete)
- [x] Step 2 — INNOVATE (complete)
- [x] Step 3 — PLAN-SUPPLEMENT (this creation)
- [x] Step 4 — PVL (vc-validate-agent writes validate-contract)
- [x] Step 5 — EXECUTE (complete 03-07-26 — all Fully-Automated gates green)
- [x] Step 6 — EVL (confirmed green 03-07-26: vc-tester ×2 independent runs; security scan PASS; 1 fix cycle — 2 findings fixed; see results.tsv + evl-iteration-001 report)
- [x] Step 7 — UPDATE PROCESS

---

## Overview, Goals, Scope

Phase 17 enables complex components to expose **multiple named demo variants** (e.g. "Default", "Advanced") in the component detail page, with per-demo source/CSS viewing via a **pill selector** in the preview toolbar, and manual pre-recorded **MP4 video previews** for non-curated demos. Live interactive renders are reserved exclusively for curated `@repo/ui` variants.

### What This Phase Delivers

1. `Demos:` optional YAML frontmatter field (JSON array, same encoding pattern as Phase 11 `changelog`) with entries `{id, label, video?: path}`.
2. Per-demo source lives in registry body under `## Source (demo: {id})` heading-keyed blocks; `parseRawEntry` in `apps/web/lib/registry.ts` loops `extractFenced` over those headings.
3. `scripts/validate-registry.mjs` gains optional `Demos` validation (JSON array; each entry requires `id` + `label`).
4. `packages/db/src/schema.ts` gains optional `Demos` field in `ComponentPayload`.
5. PreviewEngine/PreviewTabs gains backward-compatible `demos?: Demo[]` optional prop; absent → existing single-preview path untouched. Demo switcher = PILL CONTROL in preview toolbar (not a nested second tab row).
6. Per-demo Shiki highlights fan out via `Promise.all` in the RSC layer.
7. Pro paywall stripping extends to ALL demo sources/css (every demo's source → `LOCKED_SOURCE`, css → undefined) server-side in `page.tsx`.
8. New curated `@repo/ui` demo variant exports (e.g. `SoftButtonAdvanced`); `COZY_PREVIEWS` map gains `"category/slug/demo-id"` keys. Bundle-safety HARD rule: no ingested component ever imported into `@repo/ui`.
9. Git LFS tracking for `apps/web/public/previews/**` via `.gitattributes`; MP4 storage at `apps/web/public/previews/{category}/{slug}/{demo-id}.mp4`.
10. `ops/copy-demo-video.mjs` helper script: validates + copies MP4 into the correct public path.
11. 5 curated registry files gain `Demos:` entries with video paths where manual recordings exist.

### Out of Scope (Deferred)

- Automated Playwright screen-capture for MP4 generation → Phase 18+ backlog.
- Cloudflare R2 migration for video storage → Phase 18.
- Non-curated ingested component live renders (never — bundle-safety hard rule).

---

## Touchpoints

| File / Path | Change Type |
|---|---|
| `docs/evidence-manifest/registry/*.md` (5 curated files) | Add `Demos:` frontmatter + per-demo body sections |
| `scripts/validate-registry.mjs` | Add optional `Demos` array validation |
| `scripts/__tests__/validate-registry.test.mjs` | New test cases for `Demos` field |
| `ops/github-ingest.mjs` | `Demos` treated as optional pass-through output field |
| `ops/copy-demo-video.mjs` | NEW — MP4 validation + copy helper |
| `packages/db/src/schema.ts` | Add optional `Demos?: Demo[]` to `ComponentPayload` |
| `apps/web/lib/registry.ts` | `parseRawEntry` extended; `parseDemo` + `extractFenced` loop |
| `apps/web/__tests__/registry.test.ts` | New `parseRawEntry` unit test cases WITH Demos field |
| `apps/web/components/preview-engine.tsx` (or equivalent) | `demos?: Demo[]` optional prop; pill selector UI |
| `apps/web/components/preview-tabs.tsx` (or equivalent) | Demo-aware tab extension (backward compat) |
| `apps/web/components/live-preview.tsx` (or equivalent) | Demo-id keying for COZY_PREVIEWS lookup |
| `apps/web/app/(catalog)/[category]/[slug]/page.tsx` | Per-demo paywall strip; pass `demos` prop; Shiki Promise.all fan-out |
| `apps/web/__tests__/preview-demo.test.tsx` | NEW — demo pill switcher render test (vitest+jsdom) |
| `apps/web/__tests__/paywall-demo.test.ts` | NEW — paywall-strips-all-demos unit test |
| `packages/ui/src/index.ts` | Export curated demo variants (e.g. `SoftButtonAdvanced`) |
| `packages/ui/src/{cozy-buttons,lofi-cards,minimalist-layouts}/` | New demo variant component files |
| `apps/web/public/previews/{category}/{slug}/` | NEW directory tree; MP4 files (Git LFS tracked) |
| `.gitattributes` | NEW — `apps/web/public/previews/** filter=lfs diff=lfs merge=lfs -text` |

---

## Public Contracts

1. **Registry frontmatter schema extension:** New OPTIONAL field `Demos:` — single-line JSON array. Each entry: `{id: string, label: string, video?: string}`. Validated by `validate-registry.mjs`. Files without `Demos:` are unchanged and backward-compatible.
2. **Registry body convention:** Per-demo source blocks use heading `## Source (demo: {id}) (.tsx)` and `## CSS (demo: {id})`. `parseRawEntry` reads them; the heading format is the inter-module contract.
3. **`ComponentPayload` (packages/db):** Optional `Demos?: Array<{id: string, label: string, video?: string}>` field. Qdrant one-point-per-component model unchanged.
4. **PreviewEngine props:** `demos?: Demo[]` optional prop. Absent → existing single-preview behavior. Present → pill selector rendered.
5. **`COZY_PREVIEWS` map keys:** Extended to accept `"category/slug/demo-id"` in addition to existing `"category/slug"` keys.
6. **Video storage path:** `apps/web/public/previews/{category}/{slug}/{demo-id}.mp4` — public, no auth gate (marketing previews).

---

## Blast Radius

- **Packages touched:** `apps/web`, `packages/ui`, `packages/db`, `scripts/`, `ops/`
- **New files:** `.gitattributes`, `ops/copy-demo-video.mjs`, `apps/web/public/previews/` tree, `apps/web/__tests__/preview-demo.test.tsx`, `apps/web/__tests__/paywall-demo.test.ts`
- **Modified files:** `scripts/validate-registry.mjs`, `scripts/__tests__/validate-registry.test.mjs`, `ops/github-ingest.mjs`, `packages/db/src/schema.ts`, `apps/web/lib/registry.ts`, `apps/web/__tests__/registry.test.ts`, `apps/web/components/preview-engine.tsx`, `apps/web/components/preview-tabs.tsx`, `apps/web/components/live-preview.tsx` (or their equivalents — agent must confirm exact filenames), `apps/web/app/(catalog)/[category]/[slug]/page.tsx`, `packages/ui/src/index.ts`, 5 curated registry files
- **Risk class:** Medium (multi-package, UI changes, new Git LFS setup, paywall logic extension)
- **High-risk surfaces:** paywall stripping extension (all-demos coverage) — must be unit-tested
- **Rollback:** `Demos:` field is additive only; removing it from registry files restores prior behavior. Git LFS can be reverted by removing `.gitattributes` entries and running `git lfs untrack`.

---

## Sub-phase Grouping (17a–17e)

The INNOVATE decision recommends this sequencing. 17b and 17e are parallel-safe with 17c and 17d (separate packages/files with no shared edits), but must all complete before standalone integration verification.

| Sub-phase | Scope | Files |
|---|---|---|
| 17a | Registry schema: parseRawEntry + validate-registry + github-ingest + tests | `apps/web/lib/registry.ts`, `scripts/validate-registry.mjs`, `scripts/__tests__/`, `ops/github-ingest.mjs` |
| 17b | Qdrant payload: optional Demos field in schema.ts | `packages/db/src/schema.ts` |
| 17c | PreviewEngine/PreviewTabs demo switcher + paywall | `apps/web/components/preview-engine.tsx`, `preview-tabs.tsx`, `live-preview.tsx`, `apps/web/app/(catalog)/[category]/[slug]/page.tsx`, new test files |
| 17d | Curated @repo/ui demo variant exports + COZY_PREVIEWS | `packages/ui/src/`, `apps/web/components/live-preview.tsx` |
| 17e | Demo video workflow: Git LFS, public/previews/ structure, copy script, record MP4s, update registry files | `.gitattributes`, `ops/copy-demo-video.mjs`, `apps/web/public/previews/`, 5 registry `.md` files |

---

## Implementation Checklist

### Prerequisite (MUST DO FIRST)
1. Verify Git LFS is installed: `git lfs version`. If absent, install via Homebrew (`brew install git-lfs`) and run `git lfs install`. Document outcome — this is a hard prerequisite before any MP4 binary is committed.

### Sub-phase 17a — Registry Schema Extension

2. **`apps/web/lib/registry.ts`:** Add `Demo` TypeScript type (`{id: string; label: string; video?: string}`). Extend `RegistryEntry` type to include `demos?: Demo[]`. In `parseRawEntry`, after parsing frontmatter JSON fields: parse `Demos` field as `JSON.parse(entry.Demos)` into `demos` array; for each demo, call `extractFenced(body, '## Source (demo: ' + demo.id + ')')` and `extractFenced(body, '## CSS (demo: ' + demo.id + ')')` to populate per-demo source/css. Return demos array alongside existing `source`, `css`.
3. **`scripts/validate-registry.mjs`:** Add optional `Demos` validation block. If `Demos` key is present in frontmatter: parse JSON; assert array; each item must have `id` (non-empty string) and `label` (non-empty string); `video` is optional string. Validation errors are non-fatal for `Demos` (matches INNOVATE decision: optional field). Add to validator output.
4. **`scripts/__tests__/validate-registry.test.mjs`:** Add 3 new test cases: (a) valid registry with `Demos` JSON array passes; (b) `Demos` with missing `id` fails; (c) registry without `Demos` still passes (backward compat).
5. **`ops/github-ingest.mjs`:** Add `Demos` to the list of frontmatter fields that are passed through as-is to the output entry (optional output field). No structural change to ingest logic.
6. **`apps/web/__tests__/registry.test.ts`:** Add test: `parseRawEntry` with a fixture that includes `Demos:` frontmatter + `## Source (demo: advanced) (.tsx)` body block returns `demos[0].source` correctly. (This closes existing gap noted in 4 pre-existing failures — verify the new test does NOT touch the failing paths; use a new fixture string.)

### Sub-phase 17b — Qdrant Payload Extension

7. **`packages/db/src/schema.ts`:** Add `Demos?: Array<{id: string; label: string; video?: string}>` to `ComponentPayload` type. No migration needed (Qdrant schema is additive; Phase 13 `getComponentsByRegistryPaths` hydration unchanged in structure).

### Sub-phase 17c — PreviewEngine Demo Switcher + Paywall

8. **Locate exact component file paths:** Before editing, agent reads `apps/web/components/` directory listing to confirm filenames for `preview-engine`, `preview-tabs`, `live-preview` (names may differ slightly from the touchpoints table above). Use actual filenames.
9. **`preview-engine.tsx` (or equivalent):** Add optional `demos?: Demo[]` prop. When absent, render existing single-preview path identically (backward-compat). When present, render a PILL CONTROL row in the preview toolbar above the existing Preview/Code tab row; pills show `demo.label`; active pill state tracked via `useState` with first demo as default.
10. **`preview-tabs.tsx` (or equivalent):** Pass selected `demoId` down to the code highlighting section; render the correct per-demo `source`/`css` in the Code tab.
11. **`apps/web/app/(catalog)/[category]/[slug]/page.tsx`:** Extend paywall stripping: when `isPro && !userIsPro`, for EACH demo in `entry.demos`, set `demo.source = LOCKED_SOURCE` and `demo.css = undefined`. Fan out per-demo Shiki highlighting via `Promise.all(entry.demos.map(d => highlightCode(d.source, 'tsx')))`. Pass `demos` prop to `<PreviewEngine>`.
12. **`live-preview.tsx` (or equivalent):** Update `COZY_PREVIEWS` lookup: when `demoId` is provided, try key `"${category}/${slug}/${demoId}"` first; fall back to `"${category}/${slug}"` for backward compat.
13. **NEW `apps/web/__tests__/preview-demo.test.tsx`:** vitest + jsdom. Test: render `<PreviewEngine demos={[{id:'default',label:'Default'},{id:'advanced',label:'Advanced'}]} ... />` — assert both pill labels are present in DOM; assert clicking second pill changes active state. Mock Shiki and child components as needed.
14. **NEW `apps/web/__tests__/paywall-demo.test.ts`:** vitest. Import the paywall-stripping logic (extract to a pure function in `page.tsx` or `registry.ts` for testability). Test: given entry with 3 demos + `isPro: true`, when `userIsPro: false`, all 3 demos have `source === LOCKED_SOURCE` and `css === undefined`. Test: when `userIsPro: true`, sources are preserved.

### Sub-phase 17d — Curated @repo/ui Demo Variant Exports

15. **`packages/ui/src/{cozy-buttons}/`:** Create `SoftButtonAdvanced.tsx` (or similar named variant) — a demonstrably distinct variation of `SoftButton` (e.g. different size/animation). No heavy deps. Export from the category barrel.
16. **`packages/ui/src/index.ts`:** Add named export for the new curated demo variant(s). Run `corepack pnpm --filter @repo/ui type-check` immediately after to confirm no regression.
17. **Bundle-safety gate (MANDATORY):** After any `packages/ui` change, run `corepack pnpm --filter @repo/ui build 2>&1 | grep -E "(three|face-api|matter-js|ogl|gsap)" | wc -l` — output MUST be `0`. If non-zero, ABORT the export and flag as scope violation.
18. **`COZY_PREVIEWS` map in `live-preview.tsx`:** Add `"cozy-buttons/soft-button/advanced": SoftButtonAdvanced` (or equivalent key) entry.

### Sub-phase 17e — Demo Video Workflow

19. **`.gitattributes` (NEW):** Create file at repo root with content: `apps/web/public/previews/** filter=lfs diff=lfs merge=lfs -text`. Run `git lfs track "apps/web/public/previews/**"` to register (or verify `.gitattributes` was updated by the LFS command). Commit `.gitattributes` before any MP4 is added.
20. **`apps/web/public/previews/` directory structure:** Create: `apps/web/public/previews/cozy-buttons/soft-button/`, `apps/web/public/previews/cozy-buttons/pill-button/`, `apps/web/public/previews/lofi-cards/lofi-card/`, `apps/web/public/previews/lofi-cards/polaroid-card/`, `apps/web/public/previews/minimalist-layouts/calm-stack/`. Add a `.gitkeep` in each.
21. **`ops/copy-demo-video.mjs` (NEW):** Node.js script. CLI: `node ops/copy-demo-video.mjs <source-mp4> <category> <slug> <demo-id>`. Validates: (a) source file exists; (b) source file has `.mp4` extension; (c) target directory exists under `apps/web/public/previews/`; then copies to `apps/web/public/previews/{category}/{slug}/{demo-id}.mp4`. Prints success path or descriptive error. No ffmpeg dependency (pure Node fs).
22. **Manual MP4 recording (human step):** Record QuickTime screen captures of each curated component demo. Name source files per convention. Run `node ops/copy-demo-video.mjs <source> <category> <slug> <demo-id>` for each. **Note to EXECUTE agent:** this step requires human action before the registry entries can reference real video paths. If recordings are not yet available, use placeholder paths (e.g. `previews/cozy-buttons/soft-button/advanced.mp4`) and note as known-gap in the EVL report.
23. **5 curated registry files — add `Demos:` frontmatter:** For each of `soft-button`, `pill-button`, `lofi-card`, `polaroid-card`, `calm-stack`: add `Demos: '[{"id":"default","label":"Default"},{"id":"advanced","label":"Advanced","video":"previews/{category}/{slug}/advanced.mp4"}]'` (adapt per component). Add `## Source (demo: advanced) (.tsx)` heading-keyed body block with the variant source code. Run `node scripts/validate-registry.mjs` after each file to confirm no validation errors.

### Integration Verification (after all sub-phases)

24. **Run full test suite:** `corepack pnpm --filter web test` — confirm no new failures beyond the 6 known pre-existing baseline failures.
25. **Type-check all touched packages:** `corepack pnpm --filter web type-check && corepack pnpm --filter @repo/ui type-check && corepack pnpm --filter @repo/db type-check` (run db type check if available, otherwise skip with note).
26. **Registry validation:** `node scripts/validate-registry.mjs` — must exit 0 with all 5 curated files passing.
27. **Next.js build:** `corepack pnpm --filter web build` — exit 0.
28. **Local Build Checkpoint (hybrid/manual):** `corepack pnpm --filter web dev` → http://localhost:3000 → navigate to a curated component detail page → verify: (a) pill selector appears when demos present; (b) switching pills changes source in Code tab; (c) for a Pro component when signed out, all demo sources show LOCKED_SOURCE; (d) video `<video>` tag renders for demos with a `video` path.
29. **`graphify update .`** — keep knowledge graph current.

---


## Phase Completion Rules
Phase is complete when:
- All 4 automated test gates are green: validate-registry new Demos cases, parseRawEntry Demos fixture, preview pill render test, paywall-strips-all-demos test.
- `corepack pnpm --filter web build` exits 0.
- `node scripts/validate-registry.mjs` exits 0 for all 5 curated registry files.
- PreviewEngine renders pill control for multi-demo components and falls back to existing single-demo path when `demos` prop is absent.
- Pro paywall strips all demo sources server-side (unit-tested + manual verification at Local Build Checkpoint).
- `.gitattributes` LFS tracking committed before any MP4 binary.
- `ops/copy-demo-video.mjs` script exists and validated manually.
- Bundle-safety gate passed: no heavy deps in `packages/ui` build output.

---

## Acceptance Criteria

- [ ] Registry files without `Demos:` parse and render identically to pre-Phase 17 behavior (backward compat).
- [ ] Registry files with `Demos:` expose per-demo source/CSS in `parseRawEntry`.
- [ ] `validate-registry.mjs` exits 0 on valid `Demos` field and reports error on invalid structure.
- [ ] `ComponentPayload` in `packages/db` accepts optional `Demos` without TypeScript error.
- [ ] PreviewEngine renders existing single-demo path unchanged when `demos` prop is absent.
- [ ] PreviewEngine renders pill control when `demos` prop is present; pill switching changes visible source.
- [ ] Pill control is visually in the PREVIEW TOOLBAR (same row), NOT a second nested tab row.
- [ ] Pro paywall stripping covers all demo sources — no demo leaks raw source for a Pro component when `userIsPro: false`.
- [ ] At least one curated `@repo/ui` demo variant is exported without bundle-safety violation.
- [ ] `COZY_PREVIEWS` map resolves `"category/slug/demo-id"` keys.
- [ ] `.gitattributes` tracks `apps/web/public/previews/**` via LFS before any MP4 is committed.
- [ ] `ops/copy-demo-video.mjs` copies an MP4 to the correct path or prints a descriptive error.
- [ ] `corepack pnpm --filter web build` exits 0.
- [ ] `corepack pnpm --filter web test` has no new failures (6 pre-existing baseline failures remain acceptable).
- [ ] `node scripts/validate-registry.mjs` exits 0 for all 5 curated registry files.

---

## Dependencies, Risks, Integration Notes

### Dependencies

- Phase 11 (versioning/changelog) — established `parseRawEntry` + `extractFenced` pattern. Phase 17 extends this pattern to demo heading blocks. EXECUTE agent must read Phase 11 implementation of `registry.ts` before editing.
- Phase 5 (component detail page) — `page.tsx` structure and `COZY_PREVIEWS` map already exist. Agent reads current file before adding paywall + demos logic.
- Git LFS installed locally — hard prerequisite for MP4 commits. Verify in step 1.

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| PreviewEngine backward-compat breakage | Medium | High | `demos` prop is strictly optional; absent → identical render path; unit test for absent-demos path |
| Pill-vs-tab UI hierarchy confusion | Medium | Medium | Plan explicitly states: PILL CONTROL in toolbar, NOT nested tab row; validate visually at Local Build Checkpoint |
| Git LFS not installed | Medium | High | Step 1 is a hard prerequisite check; do not proceed to step 19 if LFS is absent |
| MP4 repo bloat (pre-R2) | Low (few files) | Low-Medium | Git LFS mitigates; Phase 18 migrates to R2 — note in EVL report |
| Per-demo Shiki `Promise.all` RSC cost | Low | Low | At current 5-component scale, concurrency is negligible; revisit at Phase 19+ scale |
| Paywall incomplete (misses a demo) | Low | High | Unit test (step 14) covers all demos in a multi-demo fixture; must be green before EXECUTE closes |
| Bundle-safety violation via new @repo/ui export | Low | High | Step 17 is a mandatory bundle-safety gate before merging; abort on any heavy-dep detection |

### Integration Notes

- n8n pipeline unchanged: one upsert per registry file; `Demos` metadata flows as additional payload field if present.
- `getComponentsByRegistryPaths` (Phase 13) reads `ComponentPayload` — optional `Demos` field is additive and won't break existing hydration.
- The 6 pre-existing vitest failures in `registry.test.ts`, `search.test.ts`, `views.test.ts` are baseline debt and must not be made worse. New registry tests must use distinct fixture strings that do not interact with the failing paths.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `validate-registry.test.mjs`: valid `Demos` array passes | Fully-Automated | Registry schema accepts optional Demos field |
| `validate-registry.test.mjs`: `Demos` with missing `id` fails | Fully-Automated | Registry validates Demos structure |
| `validate-registry.test.mjs`: no `Demos` field still passes | Fully-Automated | Backward compatibility — files without Demos unchanged |
| `registry.test.ts`: `parseRawEntry` with Demos fixture returns demo source | Fully-Automated | parseRawEntry correctly reads per-demo source blocks |
| `preview-demo.test.tsx`: pill labels rendered; switching pills changes active state | Fully-Automated | Demo switcher UI renders and responds to interaction |
| `paywall-demo.test.ts`: all demo sources locked when `userIsPro: false` | Fully-Automated | Pro paywall covers all demo variants |
| `paywall-demo.test.ts`: demo sources preserved when `userIsPro: true` | Fully-Automated | Pro unlock works for all demos |
| `corepack pnpm --filter @repo/ui type-check` exit 0 after new exports | Fully-Automated | No TypeScript regression in packages/ui |
| `corepack pnpm --filter web type-check` exit 0 | Fully-Automated | No TypeScript regression in apps/web |
| `corepack pnpm --filter web build` exit 0 | Fully-Automated | Next.js build succeeds |
| `node scripts/validate-registry.mjs` exit 0 | Fully-Automated | All curated registry files conform to schema |
| `corepack pnpm --filter web test` — no new failures vs 6 baseline | Fully-Automated | Test suite health maintained |
| `<video>` tag present in DOM for demos with video path (vitest+jsdom) | Hybrid (precondition: jsdom env) | Video tag renders for video-backed demos |
| Manual: pill control appears in preview toolbar (not nested tab row) | Hybrid (local dev server) | Pill-not-tabs UI hierarchy |
| Manual: MP4 playback in browser for a curated demo | Hybrid (local dev server + recorded MP4) | Video preview renders and plays |
| MP4 file validity (duration, encoding) | Known-Gap | Out of scope — no ffmpeg/browser runtime in test env; manual verification at Local Build Checkpoint |

---

## Test Infra Improvement Notes

- `preview-demo.test.tsx` introduces the first vitest+jsdom component render test for the preview system. If jsdom is not already configured in `apps/web/vitest.config.ts`, add `environment: 'jsdom'` to a new test environment config or use `@vitest/ui`-compatible overrides per-file (`// @vitest-environment jsdom`). EXECUTE agent must verify the current vitest config environment (`apps/web/vitest.config.ts` currently sets `environment: "node"`) and use per-file `@vitest-environment jsdom` override to avoid changing the global environment.
- The paywall stripping logic currently lives inline in `page.tsx`. To make it unit-testable (step 14), extract it to a pure function (`stripDemoPaywall(demos: Demo[], userIsPro: boolean): Demo[]`) in `apps/web/lib/registry.ts` or a co-located utility. This is a testability improvement that does not change external behavior.
- 6 pre-existing vitest failures remain debt. Phase 17 must not add new failures. If new registry test cases accidentally trigger the pre-existing failures, isolate via separate fixture strings.

---

## Resume and Execution Handoff

1. **Selected plan file path:** `process/features/monetization-catalog/active/phase-17-multi-demos_03-07-26/phase-17-multi-demos_PLAN_03-07-26.md`
2. **Last completed phase or step:** EXECUTE (Step 5) COMPLETE — 03-07-26. All 5 sub-phases (17a–17e) implemented. A prior execute agent (killed mid-run by session limit) had completed 17a (registry.ts Demo type + stripDemoPaywall + Demos parse; validate-registry + tests; github-ingest pass-through; registry.test.ts Demos fixture), 17b (schema.ts Demos field), and 17c/17d component UI (preview-engine RSC Promise.all fan-out; preview-tabs pill selector; live-preview demoId keying; soft-button-advanced.tsx + barrel export). The resume agent completed: page.tsx per-demo paywall (E1 stripDemoPaywall wired + demos prop passed); NEW preview-demo.test.tsx (client-component pill test per E2, IntersectionObserver stubbed for jsdom) + paywall-demo.test.ts (all-demos strip); .gitattributes LFS tracking; apps/web/public/previews/ tree (.gitkeep, no MP4 binaries); ops/copy-demo-video.mjs; Demos frontmatter + `## Source (demo: advanced) (.tsx)` blocks on all 5 curated registry files (placeholder video paths — E5 known-gap).
3. **Validate-contract status:** CONDITIONAL (accepted, session). generated-by: inner-pvl: phase-17.

**Gate results (03-07-26, Node 22.22.2 corepack):**
- `node scripts/validate-registry.mjs` → exit 0, all 150 files pass ✓
- `node --test scripts/__tests__/validate-registry.test.mjs` → 10/10 pass (3 new Demos cases) ✓
- `corepack pnpm --filter web test` → 6 fail / 63 pass — all 6 fails are pre-existing baseline debt (registry.test.ts IsPro unstable_cache ×4, search.test.ts re-rank, views.test.ts rateLimitMap); +9 new tests (3 paywall + 3 preview-demo + 3 parseRawEntry Demos) all PASS; NO new failures ✓
- `corepack pnpm --filter @repo/ui type-check` → exit 0 ✓
- bundle-safety `... build | grep -E "(three|face-api|matter-js|ogl|gsap)" | wc -l` → 0 ✓
- `corepack pnpm --filter web build` → exit 0, "Compiled successfully" ✓
- `corepack pnpm --filter web type-check` → only error is pre-existing views.test.ts (rateLimitMap, baseline debt, not touched by Phase 17); all Phase 17 code clean ✓
- `git diff --check` → exit 0 ✓
- git lfs → installed (3.7.1); tracking registered for apps/web/public/previews/**

**Known gaps (accepted):** No real MP4 recordings — registry Demos use placeholder video paths (E5). MP4 validity + copy-demo-video automated test = Known-Gap (Phase 18 backlog). LivePreview passed without demoId in page.tsx (per-demo live render key wired in live-preview.tsx but base preview stays primary; demo videos render for video-backed demos).

**Original handoff (pre-EXECUTE):**
4. **Supporting context files loaded:**
   - `process/context/all-context.md`
   - `process/context/tests/all-tests.md`
   - `process/context/planning/all-planning.md`
   - `process/features/monetization-catalog/completed/21st-clone_27-06-26/phase-11-versioning_PLAN_30-06-26.md` (format + parseRawEntry pattern reference)
   - `process/features/monetization-catalog/completed/21st-clone_27-06-26/21ST-CLONE-ULTIMATE-ROADMAP_27-06-26.md` (Phase 17 entry)
5. **Next step for a fresh agent:** Run `vc-validate-agent` on this plan file to produce the validate-contract (Step 4 — PVL). Do NOT begin EXECUTE without a PASS or accepted CONDITIONAL on the validate-contract. After PVL, EXECUTE agent must: (a) read Phase 11 `registry.ts` implementation; (b) read current `page.tsx` structure; (c) verify Git LFS installed (step 1 of checklist); (d) execute sub-phases 17a → 17b → 17c → 17d → 17e in order, running test gates after each sub-phase before advancing.

### Key Pre-EXECUTE Reads (EXECUTE agent must read these before starting)

- `apps/web/lib/registry.ts` — current `parseRawEntry` implementation (Phase 11 pattern)
- `apps/web/app/(catalog)/[category]/[slug]/page.tsx` — current paywall logic
- `apps/web/components/` directory listing — confirm exact filenames for preview-engine, preview-tabs, live-preview
- `packages/ui/src/index.ts` — current barrel exports

---

## Validate Contract

Status: CONDITIONAL
Date: 03-07-26
date: 2026-07-03
generated-by: inner-pvl: phase-17

Parallel strategy: sequential
Rationale: Single plan inner PVL; 1 agent, no coordination needed. Score 2/7 (S6 high-risk paywall, S7 many files). Sequential is correct.

Plan updates applied:
- P1: Step 17 (bundle-safety gate) updated with exact command: `corepack pnpm --filter @repo/ui build 2>&1 | grep -E "(three|face-api|matter-js|ogl|gsap)" | wc -l` must return `0`. Previously said "inspect output" without a mechanically runnable check.

Execute-agent instructions:
- E1 (Section 17c, steps 11+14): Extract `stripDemoPaywall(demos: Demo[], userIsPro: boolean): Demo[]` as a pure function in `apps/web/lib/registry.ts` (or a co-located utility) BEFORE implementing step 11 and BEFORE writing paywall-demo.test.ts. Step 11 calls this function; step 14 imports and tests it. If this function is not extracted first, the test file will fail to import cleanly from the Next.js server-component page.tsx context.
- E2 (Section 17c, step 13 — preview-demo.test.tsx): PreviewEngine (`apps/web/components/preview/preview-engine.tsx`) is an async React Server Component. It CANNOT be rendered by vitest+jsdom. The pill selector UI MUST be implemented in `PreviewTabs` (client component) or a new `DemoPillSelector` client component. The test in preview-demo.test.tsx MUST target the CLIENT component directly — render `<PreviewTabs ...>` or `<DemoPillSelector ...>` in the test, NOT `<PreviewEngine ...>`. Mock the server component if needed.
- E3 (Section 17a, step 2 — registry.ts Demos parse): Wrap the `JSON.parse(raw.Demos)` call in a try/catch block (same pattern as `changelog` parsing in the existing code). If parsing throws, set `demos` to `undefined` and continue — do not throw from `parseRawEntry`.
- E4 (Section 17a, step 5 — github-ingest.mjs): Read the actual field-mapping section of `ops/github-ingest.mjs` before assuming `Demos` is in a flat list. Confirm whether the output mapping is a loop over allowed fields or a hard-coded struct. Add `Demos` to whichever mechanism is used.
- E5 (Section 17e, step 1 prerequisite): If `git lfs version` fails at EXECUTE time, do NOT proceed to step 19 or commit any MP4 files. Install LFS via `brew install git-lfs && git lfs install`, document the outcome in the EVL report, then continue. Placeholder paths in registry Demos fields are acceptable if no MP4 recordings are yet available.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| C1 | validate-registry accepts valid Demos JSON array | Fully-Automated | `node --test scripts/__tests__/validate-registry.test.mjs` exits 0, Demos-valid case passes | A |
| C2 | validate-registry rejects Demos entry missing id | Fully-Automated | Same run, Demos-missing-id case fails with error | A |
| C3 | validate-registry passes files without Demos (backward compat) | Fully-Automated | Same run, no-Demos case passes | A |
| C4 | parseRawEntry returns demos array with per-demo source | Fully-Automated | `corepack pnpm --filter web test` — new Demos fixture in registry.test.ts passes | A |
| C5 | Pill selector renders labels and responds to click (client component) | Fully-Automated | `corepack pnpm --filter web test` — preview-demo.test.tsx (jsdom, targets client component) | B |
| C6 | Paywall strips ALL demo sources when userIsPro:false | Fully-Automated | `corepack pnpm --filter web test` — paywall-demo.test.ts, 3-demo fixture all locked | B |
| C7 | Paywall preserves demo sources when userIsPro:true | Fully-Automated | Same — paywall-demo.test.ts unlock case | B |
| C8 | No new vitest failures beyond 6 baseline | Fully-Automated | `corepack pnpm --filter web test` — total fail count stays at 6 | A |
| C9 | Next.js build exits 0 | Fully-Automated | `corepack pnpm --filter web build 2>&1 \| tail -5` — exit 0 | A |
| C10 | packages/ui type-check clean + no heavy deps | Fully-Automated | `corepack pnpm --filter @repo/ui type-check && corepack pnpm --filter @repo/ui build 2>&1 \| grep -E "(three\|face-api\|matter-js\|ogl\|gsap)" \| wc -l` — second command returns 0 | A |
| C11 | All 5 registry files pass validator including new Demos fields | Fully-Automated | `node scripts/validate-registry.mjs` exits 0 | A |
| C12 | No git conflict markers | Fully-Automated | `git diff --check` exits 0 | A |
| C13 | Pill control is in toolbar not nested tab row (visual) | Hybrid | `corepack pnpm --filter web dev` → localhost:3000 → curated component → confirm pill placement | A |
| C14 | MP4 video plays in browser | Hybrid | Local dev server + recorded MP4 placed via copy-demo-video.mjs | D |
| C15 | MP4 validity (duration, encoding) | Known-Gap | — | D |
| C16 | ops/copy-demo-video.mjs automated test | Known-Gap | — | D |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

Legacy line form:
- registry validation: Fully-automated: `node --test scripts/__tests__/validate-registry.test.mjs`
- registry.ts Demos parse: Fully-automated: `corepack pnpm --filter web test`
- preview pill UI (client): Fully-automated: `corepack pnpm --filter web test` (preview-demo.test.tsx)
- paywall all-demos strip: Fully-automated: `corepack pnpm --filter web test` (paywall-demo.test.ts)
- Next.js build: Fully-automated: `corepack pnpm --filter web build 2>&1 | tail -5`
- bundle-safety: Fully-automated: `corepack pnpm --filter @repo/ui build 2>&1 | grep -E "(three|face-api|matter-js|ogl|gsap)" | wc -l` (must be 0)
- git diff: Fully-automated: `git diff --check`
- pill placement visual: hybrid: local dev server + manual inspection
- MP4 video validity: known-gap: documented as NEW PLAN REQUIRED (Phase 18 / ops/ test runner)

Failing stubs (Fully-Automated rows only):

C1/C2/C3 — validate-registry.test.mjs additions:
```
test("should accept valid Demos JSON array", () => { throw new Error("NOT IMPLEMENTED — TDD stub: validate-registry accepts valid Demos JSON array") })
test("should reject Demos entry missing id", () => { throw new Error("NOT IMPLEMENTED — TDD stub: validate-registry rejects Demos entry missing id") })
test("should pass file without Demos field (backward compat)", () => { throw new Error("NOT IMPLEMENTED — TDD stub: validate-registry passes files without Demos") })
```

C4 — registry.test.ts addition:
```
test("should return demos array with source when Demos frontmatter present", () => { throw new Error("NOT IMPLEMENTED — TDD stub: parseRawEntry with Demos fixture returns demo source") })
```

C5 — preview-demo.test.tsx (new file, targets client component):
```
test("should render pill labels for multi-demo component", () => { throw new Error("NOT IMPLEMENTED — TDD stub: pill selector renders labels") })
test("should change active state when second pill clicked", () => { throw new Error("NOT IMPLEMENTED — TDD stub: pill interaction changes active state") })
```

C6/C7 — paywall-demo.test.ts (new file):
```
test("should strip all demo sources when userIsPro is false", () => { throw new Error("NOT IMPLEMENTED — TDD stub: paywall strips all demos for locked user") })
test("should preserve demo sources when userIsPro is true", () => { throw new Error("NOT IMPLEMENTED — TDD stub: paywall preserves demos for pro user") })
```

Dimension findings:
- Infra fit: CONCERN — Git LFS not installed locally (git: 'lfs' is not a git command); step 1 is a hard prerequisite and must be resolved before step 19; all other infra (jsdom pattern, @testing-library/react) confirmed working via existing preview.test.tsx
- Test coverage: CONCERN — bundle-safety gate now has exact command (plan updated, P1); paywall stripping coverage is Fully-Automated (exceeds hybrid minimum for auth-adjacent surface); all other gates proven
- Breaking changes: PASS — all new fields/props are optional and additive; no removal or renaming of existing public contracts
- Security surface: PASS — paywall demo-stripping is unit-tested with a 3-demo fixture; public video URLs are an accepted documented decision (marketing previews); no new API routes or auth flows
- Section 17a feasibility: PASS — extractFenced pattern confirmed in registry.ts; Changelog precedent for JSON.parse; try/catch wrapping required (E3)
- Section 17b feasibility: PASS — trivial TypeScript optional field addition; no migration needed
- Section 17c feasibility: CONCERN — PreviewEngine is an async Server Component; pill UI must live in client component PreviewTabs or new DemoPillSelector; test must target client component (E2); paywall extraction sequencing (E1)
- Section 17d feasibility: PASS — packages/ui barrel export pattern established; bundle-safety command specified (P1/E-none)
- Section 17e feasibility: CONCERN — Git LFS not installed; MP4 commits blocked until LFS is installed; placeholder paths acceptable at EXECUTE time (E5)

Open gaps:
- G1 (CONCERN, accepted): Git LFS not installed — hard prerequisite for step 19/22; EXECUTE agent must install before MP4 commits; placeholder paths are acceptable interim state
- G2 (CONCERN, resolved via P1): Bundle-safety command was unspecified — now exact command in step 17 and execute-agent instruction
- G3 (CONCERN, resolved via E1): stripDemoPaywall extraction sequencing not explicit in step 11 — now in execute-agent instructions
- G4 (CONCERN, resolved via E2): Server Component testability issue — pill UI must be in client component; test must target client component
- ops/copy-demo-video.mjs automated test: known-gap: documented as NEW PLAN REQUIRED — no test runner in ops/ yet; Phase 18+ backlog
- MP4 validity (duration/encoding): known-gap: documented as NEW PLAN REQUIRED — requires ffmpeg or browser runtime not available in CI

What this coverage does NOT prove:
- C1/C2/C3 (validate-registry tests): Does not prove n8n pipeline end-to-end ingestion of Demos fields; does not prove validate-registry handles files with Demos AND historical entries simultaneously
- C4 (parseRawEntry Demos): Does not prove Qdrant upsert of Demos payload; does not prove parseRawEntry handles Demos with malformed (non-JSON) value gracefully
- C5 (pill UI): Does not prove pill renders correctly at all viewport sizes; does not prove keyboard navigation of pills; does not prove Server Component rendering of the outer PreviewEngine wrapper
- C6/C7 (paywall): Does not prove live Clerk session integration; does not prove the paywall gate when `entry.demos` is undefined (no demos case) — backward-compat path is proven by TypeScript optional typing only
- C8 (no new failures): Does not prove the 6 pre-existing failures are resolved; does not prove 100% branch coverage
- C9 (build): Does not prove runtime middleware behavior with real Clerk keys; does not prove streaming SSR
- C10 (bundle-safety): Does not prove tree-shaking works correctly for the new export at consumers; does not prove no heavy deps are introduced transitively at runtime
- C11 (registry validator): Does not prove n8n ingestion pipeline handles the extended schema
- C12 (git diff): Does not prove absence of logic errors; does not prove no unintended file changes
- C13 (hybrid visual): Does not prove screen reader/accessibility behavior; does not prove mobile viewport behavior
- C14 (MP4 hybrid): Does not prove LFS download speed under network constraints; does not prove video format compatibility across all browsers

Gate: CONDITIONAL (0 FAILs, 4 CONCERNs — Git LFS environment gap, bundle-safety command gap now resolved in plan, Server Component testability gap now in execute-agent instructions, paywall extraction sequencing gap now in execute-agent instructions)
Accepted by: session (autonomous, /goal execution) — accepted concerns: G1 (Git LFS — known pre-condition, plan accounts for it), G2 (resolved by P1 plan update), G3 (resolved by E1 execute-agent instruction), G4 (resolved by E2 execute-agent instruction)

## Autonomous Goal Block

SESSION GOAL: Phase 17 — Multiple Demos + Demo Video Support for Cozy Downloads storefront
Charter + umbrella plan: process/features/monetization-catalog/completed/21st-clone_27-06-26/21ST-CLONE-ULTIMATE-ROADMAP_27-06-26.md
Autonomy: autonomous execution per phase-programs.md inner loop; self-decide on CONDITIONAL findings; BLOCKED → backlog + continue; irreversible outward-facing actions without explicit contract = hard stop
Hard stop conditions / safety constraints:
- Do NOT commit any MP4 binary file before .gitattributes with LFS tracking is committed
- Do NOT add any ingested component or heavy dep (three, face-api.js, matter-js, ogl, gsap) to packages/ui
- Do NOT modify the Pro paywall gate logic without running paywall-demo.test.ts (must be green)
- Do NOT ship demo source for a Pro component to the client — stripping must happen server-side before render
- If bundle-safety command returns non-zero: ABORT 17d export immediately; flag as scope violation; do not merge
Next phase: EXECUTE: process/features/monetization-catalog/active/phase-17-multi-demos_03-07-26/phase-17-multi-demos_PLAN_03-07-26.md
Validate contract: inline in plan (## Validate Contract section)
Execute start: `corepack pnpm --filter web test` (baseline: 54 pass / 6 fail) | `node scripts/validate-registry.mjs` | `corepack pnpm --filter @repo/ui build 2>&1 | grep -E "(three|face-api|matter-js|ogl|gsap)" | wc -l` (must be 0) | high-risk pack: yes (paywall stripping — extract stripDemoPaywall before testing)
