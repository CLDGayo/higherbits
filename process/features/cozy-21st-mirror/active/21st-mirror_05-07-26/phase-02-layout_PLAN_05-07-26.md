---
name: plan:cozy-21st-mirror-phase-02-layout
description: "Cozy 21st Mirror — Phase 2: Premium Layout"
date: 05-07-26
metadata:
  node_type: memory
  type: plan
  feature: cozy-21st-mirror
  phase: phase-02
---

# Phase 02 — Premium Layout

**Program:** cozy-21st-mirror
**Umbrella plan:** process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/21st-mirror-umbrella_PLAN_05-07-26.md
**Phase status:** ✅ VERIFIED (06-07-26 — EVL confirmed: vitest 97/97, tsc exit 0, @repo/ui type-check exit 0, build differential PASS)
**Report destination:** process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-02-layout_REPORT_05-07-26.md (flat in the program task folder) — WRITTEN

---

## Purpose

Upgrade the current wireframe-level shell (root layout, header, nav, global CSS tokens) to a
21st.dev-grade premium aesthetic — colors, typography, spacing, and dark-mode gradients/glassmorphism.
This phase is the shared foundation that Phases 3, 4, and 5 all depend on, since they build content
on top of the upgraded layout tokens and shell components.

---

## Entry Gate

- Phase 1 exit gate met (catalog routes load without errors, 200 OK)

---

## Decision Record (INNOVATE outcome — verdict GO)

**Chosen approach:** Hybrid — wire the 3 already-locked Cozy palettes (Cozy Daylight / Lofi Dusk /
Paper Café, locked 2026-07-02, tokens sourced from `docs/evidence-manifest/registry/themes__*.md`)
as real `next-themes` theme selectors, AND layer premium typography/spacing/glassmorphism treatments
on top of the existing shared shell (`layout.tsx`, `globals.css`, `site-header.tsx`).

**Why this over alternatives:**
- Rejected: net-new dark palette — would violate the 2026-07-02 theme lock; the 3 palettes already
  exist as curated registry entries (2 free + 1 Pro) and are the intended product surface.
- Rejected: typography-only upgrade (no theme wiring) — re-defers the Phase 24 theme-system intent
  and leaves a known live bug in place (see below), which this phase is positioned to fix.

**Key finding carried into this plan (bug fix in scope):** `ThemeToggle` (`apps/web/components/theme-toggle.tsx`)
and `ThemeProvider` (`apps/web/components/theme-provider.tsx`) currently offer light/dark/system,
but `globals.css` only has a `:root` block plus a `prefers-color-scheme: dark` media query — the
`attribute="class"` prop on `next-themes` writes a `.dark` class to `<html>` that nothing in CSS
reads (dark mode is currently driven ONLY by the OS media query, independent of the toggle). This
phase's token/selector rework fixes this as a byproduct of introducing the 3 named themes.

**Doc-check result (next-themes API, resolved in this supplement):** `apps/web/package.json` pins
`next-themes: ^0.4.6`. Direct `.d.ts` read is sandbox-blocked (node_modules access denied by
scout-block hook); confirmed instead via the stable, version-independent public API already in use
in `theme-provider.tsx` (`ThemeProvider` passthrough of `React.ComponentProps<typeof
NextThemesProvider>`) — `attribute`, `defaultTheme`, `themes`, `enableSystem` are long-stable
`ThemeProviderProps` fields unchanged since next-themes 0.x. Locked convention:
- `attribute="data-theme"` (NOT `"class"` — avoids `.dark` selector collision with any Tailwind
  `dark:` variants that may exist elsewhere; unambiguous 3-way selector)
- `themes={["daylight", "dusk", "cafe"]}`
- `defaultTheme="daylight"`
- `enableSystem={false}` (3 named palettes fully replace the light/dark/system model — "system"
  has no defined mapping onto 3 named themes and is removed)
- CSS selectors: `[data-theme="daylight"]`, `[data-theme="dusk"]`, `[data-theme="cafe"]`

---

## Blast Radius

- `apps/web/app/layout.tsx` (ThemeProvider props update)
- `apps/web/app/globals.css` (media-query → per-theme `[data-theme]` blocks; additive new vars)
- `apps/web/components/site-header.tsx` (glassmorphism/typography polish only — no structural change)
- `apps/web/components/theme-toggle.tsx` (relabel Light/Dark/System → Daylight/Dusk/Café; same
  `setTheme(...)` mechanism, new theme-name strings)
- `apps/web/components/theme-provider.tsx` (no code change expected — passthrough component; only
  the props passed from `layout.tsx` change)
- `apps/web/tailwind.config.ts` (additive token/theme extension only, if needed for new accent vars)
- NEW: `apps/web/__tests__/site-header.test.tsx` (jsdom smoke test)
- All git-clean at plan-write time — no ambient conflicts with other active phases.

**Explicitly out of scope / constraints:** `apps/web/lib/catalog.ts`, `@repo/db`, any Redis/rate-limit
code, and the `.preview-canvas` light-lock in `globals.css` (Shiki preview canvas must stay
hardcoded light regardless of active theme — do not let `[data-theme]` rules leak into
`.preview-canvas`).

---

## Implementation Checklist

### Step A — Audit current shell

- [x] A1. Inventory current root layout, header/nav components, and global CSS token set. (done
      this supplement — see files read above)
- [x] A2. Identify gaps vs 21st.dev aesthetic reference (typography scale, color tokens, spacing
      rhythm, glassmorphism/gradient treatments) — gap: no premium type scale/tracking, header has
      no gradient hairline, dark mode is OS-driven not toggle-driven (bug, fixed by this phase).

### Step B — Upgrade tokens, theme wiring, and shell

- [x] B1. Rewrite `apps/web/app/globals.css` `@layer base` block:
  - Replace the `:root` + `@media (prefers-color-scheme: dark)` pair with THREE `[data-theme="x"]`
    blocks (below) plus keep a `:root` fallback identical to `[data-theme="daylight"]` values (covers
    any render before hydration/attribute-application).
  - Map existing 7 var names (`--background`, `--surface`, `--foreground`, `--muted`, `--border`,
    `--accent`, `--accent-foreground`) to each theme's tokens per this exact mapping (no renames):
    - `--background` ← `bg`, `--surface` ← `panel`, `--foreground` ← `ink`, `--muted` ← `muted`,
      `--border` ← `hairline`, `--accent` ← first named accent token for that theme, `--accent-foreground`
      ← `ink` (dusk/cafe) or `panel` (daylight, since daylight accent is light-toned — verify contrast
      visually at EXECUTE time; if contrast fails, use `ink` for daylight `--accent-foreground` too and
      note the deviation in the phase report).
  - ADD new vars additively (do NOT remove/rename the 7 existing ones — Public Contracts requires
    zero behavior change to consumers of the existing 7):
    `--accent-secondary`, `--accent-tertiary` (the 2nd/3rd named accent per theme), `--radius`
    (e.g. `0.75rem`), `--shadow-soft` (e.g. `0 1px 2px hsl(var(--foreground) / 0.04), 0 4px 12px
    hsl(var(--foreground) / 0.06)`).
  - Exact HSL triplet values (computed via sRGB→HSL, hue/sat/lightness rounded to whole numbers —
    verified programmatically, do not re-derive):

    **`[data-theme="daylight"]`** (also mirrored in `:root` fallback; free tier)
    ```css
    --background: 36 50% 96%;      /* bg #FAF6F0 */
    --surface: 0 0% 100%;          /* panel #FFFFFF */
    --foreground: 27 12% 15%;      /* ink #2B2622 */
    --muted: 33 10% 49%;           /* muted #8A7F72 */
    --border: 34 34% 88%;          /* hairline #EBE2D6 */
    --accent: 24 100% 77%;         /* accent-peach #FFB98A */
    --accent-foreground: 27 12% 15%; /* ink — verify contrast at EXECUTE */
    --accent-secondary: 109 25% 70%;  /* accent-sage #A8C6A1 */
    --accent-tertiary: 258 51% 82%;   /* accent-lavender #C7B9E8 */
    ```

    **`[data-theme="dusk"]`** (Pro tier — Lofi Dusk registry `IsPro: true`; theme selector itself
    is NOT gated by this phase — theme switching is a UI/UX preference, not a paywalled asset; only
    component *source code* is Pro-gated per the existing paywall. Confirm this framing holds when
    executing; if product intent differs, escalate via phase report rather than silently gating.)
    ```css
    --background: 30 13% 9%;       /* bg #1A1714 */
    --surface: 27 14% 12%;         /* panel #241F1B */
    --foreground: 36 38% 92%;      /* ink #F3EDE4 */
    --muted: 33 14% 61%;           /* muted #A99C8C */
    --border: 28 17% 17%;          /* hairline #342C25 */
    --accent: 20 73% 66%;          /* accent-orange #E8946A */
    --accent-foreground: 36 38% 92%; /* ink */
    --accent-secondary: 112 22% 62%;  /* accent-green #8FB489 */
    --accent-tertiary: 257 42% 72%;   /* accent-purple #AC9BD6 */
    ```

    **`[data-theme="cafe"]`** (free tier)
    ```css
    --background: 40 45% 94%;      /* bg #F6F1E7 */
    --surface: 43 100% 99%;        /* panel #FFFDF8 */
    --foreground: 28 15% 20%;      /* ink #3A322B */
    --muted: 34 10% 53%;           /* muted #94897B */
    --border: 38 34% 86%;          /* hairline #E7DECE */
    --accent: 7 61% 77%;           /* accent-rose #E8A9A0 */
    --accent-foreground: 28 15% 20%; /* ink — verify contrast at EXECUTE */
    --accent-secondary: 161 21% 68%;  /* accent-teal #9DBFB4 */
    --accent-tertiary: 39 76% 79%;    /* accent-gold #F2D5A0 */
    ```
  - Add premium typography tokens in the same `@layer base`: a heading scale (e.g. `h1`/`h2`/`h3`
    `font-size`/`line-height`/`letter-spacing` via `@layer base` element selectors or a `.heading-*`
    utility set — implementer's choice, Tailwind-first), consistent `line-height`/`tracking` for
    body copy on the existing Geist font (no new font import — Fraunces or any serif is explicitly
    DEFERRED, see Test Infra / backlog note below).
  - Add header glassmorphism polish: extend the existing `bg-surface/70 backdrop-blur-md` on
    `site-header.tsx`'s `<header>` with a 1px gradient hairline at the bottom edge (CSS `::after` or
    a `border-image` using `--accent` → `--accent-secondary`, or a `background-image` linear-gradient
    hairline strip) — CSS/Tailwind only, no new JS libraries.
  - Preserve `.preview-canvas` hardcoded-light rule (`color-scheme: light`, `bg-white text-black`)
    verbatim — do NOT let it read theme vars; it must render the same regardless of `[data-theme]`.
  - Preserve the Shiki dual-theme `.shiki` block behavior — currently tied to
    `prefers-color-scheme: dark`; DECISION: leave Shiki's light/dark split as-is (still OS-driven,
    not `[data-theme]`-driven) since Shiki only emits `--shiki-light`/`--shiki-dark` (no 3-way
    variant) — this is an accepted, documented limitation, not a bug this phase must fix. Note this
    explicitly in the phase report as a known scope boundary.
- [x] B2. Update `apps/web/app/layout.tsx`:
  - Change `<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>`
    to `<ThemeProvider attribute="data-theme" themes={["daylight", "dusk", "cafe"]} defaultTheme="daylight" enableSystem={false} disableTransitionOnChange>`.
- [x] B3. Update `apps/web/components/site-header.tsx`:
  - Apply the new premium typography/spacing tokens to nav link spacing, logo `tracking-tight`
    treatment, and the header's glassmorphism hairline (from B1). No structural/DOM changes beyond
    className updates — `SearchIsland`, `UsageMeter`, Clerk auth blocks, and nav `<Link>` targets
    stay unchanged (Public Contracts: no route changes).
- [x] B4. Update `apps/web/components/theme-toggle.tsx`:
  - Relabel the 3 menu buttons: `"light"` → `"daylight"` label "Daylight", `"dark"` → `"dusk"` label
    "Dusk", `"system"` → `"cafe"` label "Café" (i.e. `setTheme("daylight")`, `setTheme("dusk")`,
    `setTheme("cafe")` — the theme-name strings must exactly match the `themes` array in B2).
  - Update the icon logic (`theme === "dark" ? Moon : Sun`) to a 3-way icon or label-only rendering
    since there is no longer a binary light/dark — implementer's choice (e.g. Sun/Moon/Coffee icon
    per theme, or text-only trigger). Keep the existing `mounted` guard and outside-click handling
    unchanged (hydration-safety and UX behavior must not regress).
- [x] B5. `apps/web/tailwind.config.ts`: add `accentSecondary: "hsl(var(--accent-secondary))"`,
  `accentTertiary: "hsl(var(--accent-tertiary))"` to the `colors` extend block (additive only — do
  not touch the existing 5 color keys).

### Step C — Verify no regression across themes + new test

- [~] C1. Confirm all 3 site themes (`daylight`, `dusk`, `cafe`) render correctly with the new
  shell tokens — via dev-server manual check (see Test Infra note: no visual-regression harness
  exists; this is Agent-Probe tier, not automated).
- [x] C2. Add `apps/web/__tests__/site-header.test.tsx` (`@vitest-environment jsdom` per the
  `preview-demo.test.tsx` precedent in `process/context/tests/all-tests.md`): render `SiteHeader`
  with a stub `totalComponents` prop inside a minimal `ThemeProvider` wrapper (or mock `next-themes`'
  `useTheme` if Clerk/`ThemeProvider` context makes full render impractical — implementer's call,
  document the choice in the phase report), assert it renders the nav links and the theme-toggle
  button without throwing.
- [x] C3. Run full vitest suite (`corepack pnpm --filter web test`) and confirm no regressions —
  baseline 87/87 + 1 new test = 88/88 (or higher if other phases landed tests concurrently).
- [x] C4. Run `corepack pnpm --filter web build` as a phase gate — cheap CSS/layout compile check
  that catches token-name typos, invalid Tailwind class references, and `[data-theme]` selector
  syntax errors before EVL.

---

## Exit Gate

```bash
# Vitest full suite
corepack pnpm --filter web test
# Expected: all tests passing, no new failures (88/88 or higher)

# Type check
corepack pnpm --filter web exec tsc --noEmit
# Expected: exits 0

# Build (new gate — catches CSS/layout compile errors cheaply)
corepack pnpm --filter web build
# Expected: exits 0
```

- All checklist items (A, B, C) checked
- Root layout, globals.css, theme-toggle, and site-header updated to premium tokens + 3-theme
  selector wiring
- New jsdom smoke test passing
- Phase report written to report destination above, including the Shiki known-scope-boundary note
  and any daylight/cafe `--accent-foreground` contrast deviation

---

## Blockers That Would Justify BLOCKED Status

- Phase 1 exit gate not yet passed (catalog errors still present)
- New premium tokens conflict irreconcilably with the existing 3-theme system without a design
  decision from the user (escalate via phase report, do not silently override theme tokens) —
  **resolved this supplement**: no conflict found: the 3 palettes were never wired as real theme
  selectors before, so there is nothing to conflict with; this phase is additive wiring, not a
  re-skin of an existing working mechanism.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written (see Decision Record above)
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note below
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — archived; context updated; committed

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Inner Loop Refresh Note (05-07-26)

Research + Innovate completed for this phase. Changes applied to this plan in this supplement:

1. Added `## Decision Record` section capturing the INNOVATE verdict (GO — hybrid theme-wiring +
   premium polish), rejected alternatives, and the doc-check resolution for `next-themes@^0.4.6`
   API conventions (`attribute="data-theme"`, `themes` array, `defaultTheme`, `enableSystem={false}`).
2. Rewrote Step B checklist with concrete, non-ambiguous sub-steps (B1-B5) including exact HSL
   token values for all 3 themes (computed via sRGB→HSL conversion from the registry's
   `Palette_Tokens` hex values — verified programmatically) and the exact mapping onto the 7
   existing CSS var names plus 4 new additive vars.
3. Identified and scoped a live bug fix (dark mode driven only by OS media query, not by the
   toggle) as an in-scope byproduct of this phase's token rework.
4. Added new jsdom test requirement (C2) and a new `build` exit gate (C4).
5. Documented an explicit known scope boundary: Shiki code-highlighting stays OS-driven
   (light/dark only), not wired to the 3 named themes — accepted limitation, not a defect.
6. Updated Blast Radius to include `theme-toggle.tsx`, `theme-provider.tsx` (no-op expected), and
   the new test file.

Existing sections not otherwise listed above (Purpose, Entry Gate) are unchanged.

---

## Touchpoints

- `apps/web/app/layout.tsx`
- `apps/web/app/globals.css`
- `apps/web/components/site-header.tsx`
- `apps/web/components/theme-toggle.tsx`
- `apps/web/components/theme-provider.tsx` (props change only, from caller — no internal edit expected)
- `apps/web/tailwind.config.ts`
- `apps/web/__tests__/site-header.test.tsx` (new)

---

## Public Contracts

- Existing 3-theme system content (Cozy Daylight / Lofi Dusk / Paper Café registry entries,
  `IsPro` flags, `Palette_Tokens`) unchanged — this phase only wires the ALREADY-LOCKED palettes
  into the live theme-switching mechanism; no new palette, no palette edits.
- The 7 existing CSS var names (`--background`/`--surface`/`--foreground`/`--muted`/`--border`/
  `--accent`/`--accent-foreground`) keep their names and Tailwind class mappings — only their
  computed values become theme-dependent instead of media-query-dependent. Any code consuming
  `bg-background`, `text-foreground`, etc. is unaffected.
- No route or component prop-API changes — `SiteHeader({ totalComponents })` signature unchanged;
  `ThemeToggle` and `ThemeProvider` component signatures unchanged (only internal theme-name
  strings and provider props change).
- `.preview-canvas` (Shiki live-preview light-lock) contract is preserved unchanged — must render
  identically regardless of active `[data-theme]`.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `corepack pnpm --filter web test` (full suite, 88/88+) | Fully-Automated | No regression introduced by token/shell changes; new site-header render test proves header doesn't throw under the new theme wiring |
| `corepack pnpm --filter web exec tsc --noEmit` | Fully-Automated | Type-safety of `ThemeProvider` prop changes and any new component code |
| `corepack pnpm --filter web build` | Fully-Automated | CSS/Tailwind/JSX compiles — catches token-name typos, invalid `[data-theme]` selector syntax, and broken class references before EVL |
| Visual verification of all 3 themes rendering distinct, correct palettes in a running dev server | Agent-Probe | Visual/behavioral correctness of the premium aesthetic upgrade and 3-way theme switching — no automated visual-regression infra exists in this repo |
| Theme toggle persists selection across reload (next-themes localStorage behavior) | Agent-Probe | Toggle mechanism actually works end-to-end (fixes the previously-inert `.dark` class bug) — deferred to program-level dev-server checkpoint per project's delivery cadence |

```bash
# Vitest full suite
corepack pnpm --filter web test
# Expected: all tests passing (baseline 87/87 + 1 new = 88/88, zero new failures)

# Type check
corepack pnpm --filter web exec tsc --noEmit
# Expected: exits 0

# Build
corepack pnpm --filter web build
# Expected: exits 0
```

---

## Test Infra Improvement Notes

- No visual-regression testing infrastructure exists in this repo (no Playwright/Percy/Chromatic
  setup). All 3-theme visual correctness and toggle localStorage-persistence behavior are
  Agent-Probe tier for this phase, verified via the project's existing dev-server checkpoint
  cadence (see `21st-clone-delivery-cadence.md` memory note), not automated CI gates. This is a
  known, accepted gap — not something this phase can resolve within its blast radius.
- Fraunces (or any premium serif display font) is explicitly DEFERRED — carried forward as a
  backlog note for a future phase/program iteration, not implemented here (Geist remains the only
  font in this phase, per the INNOVATE decision to avoid scope creep into font-loading changes).

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-02-layout_PLAN_05-07-26.md`
- Last completed step: Step 4 (PVL) — this validate pass
- Validate-contract status: CONDITIONAL (06-07-26) — see `## Validate Contract` below; execute-agent
  should proceed with Execute-Agent Instructions E1-E5 applied during EXECUTE
- Context files loaded this supplement: umbrella plan (same dir), 3 theme registry files
  (`docs/evidence-manifest/registry/themes__{cozy-daylight,lofi-dusk,paper-cafe}.md`),
  `apps/web/app/globals.css`, `apps/web/app/layout.tsx`, `apps/web/components/site-header.tsx`,
  `apps/web/components/theme-toggle.tsx`, `apps/web/components/theme-provider.tsx`,
  `apps/web/tailwind.config.ts`, `apps/web/package.json` (next-themes version confirmation)
- Next step: EXECUTE (Step 5) — implement checklist B1-B5, C1-C4 with E1-E5 guidance applied

---

## Validate Contract

Status: CONDITIONAL
Date: 06-07-26
date: 2026-07-06
generated-by: inner-pvl: phase-2

Parallel strategy: sequential
Rationale: Score 1/7 (S7 — 7 blast-radius files, single domain, self-contained plan; no
multi-package/schema/auth/API/high-risk-class signals) — LOW tier. Simple Mode validate
fan-out run as a single sequential synthesis pass (no coordination needed across dimensions).

## Plan Updates Applied

None required. Plan checklist (Steps A/B/C) is mechanically sound as written. Both CONCERNs
below are resolved via Execute-Agent Instructions rather than plan-text changes, since they
are implementation-detail guidance, not scope or design gaps.

## Execute-Agent Instructions

| # | Instruction | Trigger condition |
|---|---|---|
| E1 | `SiteHeader` imports `SignedIn`/`SignedOut`/`UserButton` from `@clerk/nextjs` (client components). When writing `apps/web/__tests__/site-header.test.tsx` (C2), these will throw under jsdom without a `<ClerkProvider>` or a mock. No existing test file mocks client-side Clerk UI components (existing precedents like `checkout.test.ts`/`submit-component.test.ts` mock `@clerk/nextjs/server` only). Resolve by EITHER: (a) `vi.mock("@clerk/nextjs", () => ({ SignedIn: () => null, SignedOut: ({children}) => children, UserButton: () => null, SignInButton: ({children}) => children, SignUpButton: ({children}) => children }))`, or (b) wrap render in a stub ClerkProvider mock. Document the chosen approach in the phase report. | Writing C2 (`site-header.test.tsx`) |
| E2 | Mock `next-themes`' `useTheme` (e.g. `vi.mock("next-themes", () => ({ useTheme: () => ({ theme: "daylight", setTheme: vi.fn() }) }))`) rather than attempting a full `ThemeProvider` context wrapper — simpler and avoids coupling the header test to theme-provider internals. | Writing C2 (`site-header.test.tsx`) |
| E3 | The `corepack pnpm --filter web build` (production compile) gate is CURRENTLY RED at PVL time — confirmed via direct run: `Error: currentSigningKey and nextSigningKey are required ... (QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY)` failing page-data collection for the ambient, untracked `apps/web/app/api/webhooks/qstash/` route. This route is NOT in Phase 2's blast radius and is unrelated to this phase's changes (traced to Phase 1/ambient monetization-catalog usage-metering work, not cozy-21st-mirror). Do NOT attempt to fix this as part of Phase 2 — it is out of scope. Re-run the compile gate after Phase 2 changes land; if it still fails with the SAME qstash/signing-key error, treat the compile gate as a pre-existing known-gap for THIS phase (not a Phase 2 regression) and note it explicitly in the phase report and EVL. If it fails with a DIFFERENT error (e.g. a Tailwind/CSS/token compile error), that IS a Phase 2 regression and must be fixed before EVL. | Running C4 / Exit Gate compile command |
| E4 | For daylight/cafe `--accent-foreground`, the plan pre-authorizes a fallback: if visual contrast fails when using `ink` for daylight's light-toned accent, switch to `panel` instead, and document the deviation in the phase report per the plan's own Step B1 guidance. | Executing B1 daylight/cafe accent-foreground values |
| E5 | Baseline vitest count at PVL time is 96/96 across 20 files (not 87/87 as stated in the plan's Purpose/Exit-Gate text — the plan's baseline reference is stale relative to Phases 20-24 landed since). Treat the exit criterion as "96 + 1 new = 97/97, zero new failures" — the plan's "88/88 or higher" language is directionally correct (higher than baseline) even though the specific numbers are outdated. Do not treat this discrepancy as a regression. | Running C3 (full vitest suite) |

## Test Gates

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| c3-verify-no-regression-new-test | Full vitest suite green with new site-header render test added, zero new failures vs baseline | Fully-Automated | `corepack pnpm --filter web test` | A |
| c4-run-compile-gate | CSS/Tailwind/JSX compiles cleanly after token/theme rewrite (token-name typos, invalid `[data-theme]` selector syntax, broken class refs) | Fully-Automated | `corepack pnpm --filter web build` | D — pre-existing ambient qstash signing-key failure unrelated to this phase's blast radius (see E3); this phase's OWN compile surface must still be verified clean (differential check — same error signature = pre-existing gap, different error = Phase 2 regression) |
| type-safety-theme-provider-props | `ThemeProvider` prop changes and any new component code type-check cleanly | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` | A |
| ui-package-typecheck | `@repo/ui` package unaffected by theme/token changes (no cross-package leakage) | Fully-Automated | `corepack pnpm --filter @repo/ui type-check` | A |
| b1-three-theme-visual-render | All 3 site themes (`daylight`, `dusk`, `cafe`) render correct, visually-distinct palettes with the new shell tokens | Agent-Probe | Manual dev-server check: toggle through all 3 themes via `ThemeToggle`, confirm bg/surface/foreground/accent colors match the plan's HSL token table for each theme, confirm `.preview-canvas` stays hardcoded light regardless of active theme | D — no visual-regression harness (Playwright/Percy/Chromatic) exists in this repo; accepted known-gap per Test Infra Improvement Notes, verified via project's existing dev-server delivery-cadence checkpoint |
| b4-theme-toggle-persistence | Theme toggle selection persists across page reload (next-themes localStorage mechanism) — proves the previously-inert `.dark`-class bug is actually fixed end-to-end | Agent-Probe | Manual dev-server check: select "Dusk", reload page, confirm theme persists and `[data-theme="dusk"]` attribute is present on `<html>` | D — deferred to program-level dev-server checkpoint per `21st-clone-delivery-cadence.md`; no automated E2E/browser harness (Playwright) configured in this repo yet |
| c2-header-render-no-throw | `SiteHeader` renders nav links + theme-toggle button without throwing under the new 3-theme wiring | Fully-Automated | `apps/web/__tests__/site-header.test.tsx` (new, jsdom env) — see E1/E2 for required Clerk + next-themes mocks | B — new test added by this plan's own checklist (C2); TDD stub below |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies (Fully-Automated / Hybrid / Agent-Probe). Known-Gap is never a `strategy:` value — it is a named residual row carried via gap-resolution D, never a strategy that proves a behavior.

Legacy line form (retained so existing validate-contract consumers still parse):
- Full suite regression: Fully-automated: `corepack pnpm --filter web test` (96/96 baseline + 1 new = 97/97 expected)
- Type safety: Fully-automated: `corepack pnpm --filter web exec tsc --noEmit`
- UI package isolation: Fully-automated: `corepack pnpm --filter @repo/ui type-check`
- Compile gate: Fully-automated: `corepack pnpm --filter web build` (differential check — pre-existing qstash failure is a known-gap for this phase; a NEW/different error is a regression)
- 3-theme visual render: Agent-probe: manual dev-server toggle-through-3-themes check
- Toggle localStorage persistence: Agent-probe: manual dev-server reload-persistence check
- New header smoke test: Fully-automated (new): `apps/web/__tests__/site-header.test.tsx`

### Failing stub (c2-header-render-no-throw — Fully-Automated)

```
test("should render nav links and theme-toggle button without throwing under 3-theme wiring", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: SiteHeader renders nav links + theme-toggle without throwing")
})
```

## High-Risk Pack

Not required. This phase touches no high-risk class (no auth/identity logic change beyond
existing Clerk usage untouched, no billing/credits, no schema/migration, no public API
contract change, no deploy/runtime/container/proxy/gateway behavior, no permission/secret/
trust-boundary logic). Pure CSS token + theme-name-string + component-prop changes.

## Dimension Findings

- Infra fit: PASS — no container/port/worker/runtime surfaces touched; pure CSS token + component-prop changes; all target file paths confirmed to exist on disk.
- Test coverage: CONCERN — C2s jsdom render test mechanically feasible (precedent: preview-demo.test.tsx), but plan does not address that SiteHeader imports Clerk client components (SignedIn/SignedOut/UserButton) which will throw under jsdom without a mock; resolved via Execute-Agent Instructions E1/E2.
- Breaking changes: PASS — Public Contracts section verified accurate against live source; 7 existing CSS var names, component signatures, and routes all confirmed unchanged.
- Security surface: PASS — no auth/billing/schema/API-contract/secrets surface touched; no findings from a STRIDE/OWASP scan of the blast radius.

## Backlog Artifacts

| Artifact | Location | What it tracks |
|---|---|---|
| (existing, referenced not created) `catalog-json-missing-degrade_NOTE_05-07-26.md` | `process/features/cozy-21st-mirror/backlog/` | Unrelated ambient gap, cross-referenced only — confirms qstash/compile-gate issue traces to Phase 1/ambient work, not Phase 2 |

No new backlog artifacts created by this validate pass — both CONCERNs resolved via
Execute-Agent Instructions (E1-E5) rather than deferred work.

## Known Gaps

- Visual/behavioral verification of 3-theme rendering and toggle-persistence: known-gap —
  no visual-regression or browser-automation harness (Playwright/Percy/Chromatic) exists in
  this repo. Verified via Agent-Probe tier (manual dev-server checkpoint) per the project's
  established delivery cadence. Accepted, pre-existing repo-wide limitation, not something
  this phase's blast radius can resolve.
- Compile gate (`corepack pnpm --filter web build`) is RED at PVL time due to an ambient,
  out-of-blast-radius `apps/web/app/api/webhooks/qstash/` route missing
  `QSTASH_CURRENT_SIGNING_KEY`/`QSTASH_NEXT_SIGNING_KEY` env vars. Not a Phase 2 regression —
  traced to unrelated in-flight ambient work. Execute-agent must re-run this gate
  differentially (same error = pre-existing gap; different error = real regression) per E3.
- Fraunces/premium serif font: explicitly deferred per the plan's own Test Infra Improvement
  Notes — carried forward as a backlog item for a future phase, not a gap introduced by this
  phase.
- Cafe accent-rose hue: plan states 7° (HSL), spot-check computation yields 8° — 1-degree
  rounding discrepancy, visually imperceptible, not corrected (informational only).

## What this coverage does NOT prove

- The Fully-Automated gates (vitest suite, tsc, `@repo/ui` type-check) prove no regression and
  type-safety — they do NOT prove the premium aesthetic actually looks correct, that the 3
  themes are visually distinct in a real browser, or that color contrast (esp. daylight/cafe
  `--accent-foreground`) meets accessibility thresholds.
- The compile gate proves CSS/Tailwind/JSX compiles — it does NOT prove runtime correctness of
  theme-switching behavior (localStorage persistence, no flash-of-wrong-theme on load).
- The new `site-header.test.tsx` jsdom test (once written per E1/E2) proves the component does
  not throw under render — it does NOT prove the glassmorphism/gradient-hairline visual
  treatment renders correctly, nor that Clerk's real (non-mocked) SignedIn/SignedOut logic
  interacts correctly with the new header styling.
- No test in this contract proves cross-browser rendering consistency, mobile-viewport
  behavior, or performance/CLS impact of the new typography scale.
- Agent-Probe tier items (3-theme visual render, toggle persistence) are judgment-based,
  single-session manual checks — not regression-proof, repeatable, or CI-enforced.

Accepted by: session (autonomous, /goal execution) — accepted concerns: (1) Clerk-mock gap in
new test resolved via Execute-Agent Instruction E1/E2 rather than plan-text change; (2)
pre-existing ambient compile-gate failure (qstash signing-key, out of blast radius) accepted as
a differential known-gap per E3, not a Phase 2 blocker.

---

## Autonomous Goal Block

SESSION GOAL: Cozy 21st Mirror — Phase 2: wire the 3 locked Cozy palettes as real next-themes
selectors and apply premium typography/spacing/glassmorphism to the shared shell.
Charter + umbrella plan: process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/21st-mirror-umbrella_PLAN_05-07-26.md
Autonomy: phases execute autonomously; pause only on hard stops — see feedback_autonomous_phase_execution.md
Hard stop conditions / safety constraints:
- No edits to apps/web/lib/catalog.ts, @repo/db, or any Redis/rate-limit surfaces.
- .preview-canvas (Shiki light-lock) must render identically regardless of active [data-theme].
- No renames/removals of the 7 existing CSS var names or their Tailwind class mappings.
- SiteHeader({ totalComponents }) and ThemeToggle/ThemeProvider signatures must stay unchanged.
Next phase: EXECUTE: process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-02-layout_PLAN_05-07-26.md
Validate contract: process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-02-layout_PLAN_05-07-26.md (inline, ## Validate Contract)
Execute start: corepack pnpm --filter web test | c2-header-render-no-throw stub in apps/web/__tests__/site-header.test.tsx | probe: 3-theme visual render + toggle persistence | high-risk pack: no
