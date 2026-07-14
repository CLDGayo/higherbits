---
name: plan:cozy-21st-mirror-phase-04-component-ui
description: "Cozy 21st Mirror — Phase 4: Component UI"
date: 05-07-26
metadata:
  node_type: memory
  type: plan
  feature: cozy-21st-mirror
  phase: phase-04
---

# Phase 04 — Component UI

**Program:** cozy-21st-mirror
**Umbrella plan:** process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/21st-mirror-umbrella_PLAN_05-07-26.md
**Phase status:** ⏳ PLANNED (research + innovate complete; ready for PVL)
**Report destination:** process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-04-component-ui_REPORT_05-07-26.md (flat in the program task folder)

---

## Purpose

Polish the component detail views and the RSC Preview Engine UI (Preview/Code tabs, PreviewTabs demo
pill selector, paywall lock treatment, theme detail view, and the category grid) to match the
21st.dev card/glassmorphism aesthetic established in Phase 2's premium shell tokens. This phase runs
in parallel with Phase 3 and Phase 5 (all three depend only on Phase 2, not on each other).

---

## Entry Gate

- Phase 2 exit gate met (root layout and globals.css updated to premium tokens)

---

## Decision Record (INNOVATE — 06-07-26)

**GO: Full-scope token migration.** All 5 touchpoint files get the Phase 2 premium recipe
(`rounded shadow-soft`, `--surface`/`--border`/`--accent`/`--radius` theme tokens, glass on chrome),
including a full `stone-*` → theme-token rewrite in `paywall-overlay.tsx` and an explicit blast-radius
expansion to `[category]/page.tsx`'s card grid. Two new jsdom tests lock the paywall/locked-state
visual guarantee so premium styling can never accidentally leak real source or install snippets.

**Rejected alternatives:**
- **Narrow scope (detail page + preview tabs only, skip paywall-overlay and category grid).**
  Rejected — leaves the browse→detail hop visually inconsistent (grid still looks like the old
  flat aesthetic while the detail page is premium), which is the exact seam this phase exists to
  close. Also leaves `paywall-overlay.tsx`'s hardcoded `stone-*` classes broken under Lofi Dusk
  (dark theme) and Paper Café, since those tokens don't participate in the CSS-variable theme system.
- **Minimal paywall polish (leave `stone-*` in place, only adjust surrounding spacing).**
  Rejected — `stone-*` is a hardcoded Tailwind gray scale, not a theme token; it renders identically
  regardless of active theme, so under Lofi Dusk the paywall overlay would show a light-gray card
  floating on a dark background. This is a visible regression, not a style nitpick.
- **Deferring locked-state tests to a later hardening pass.** Rejected — the phase plan's own
  "Blockers That Would Justify BLOCKED Status" section flags exactly this risk: "if any ambiguity
  arises about whether a change touches gate logic vs. presentation only, escalate." Writing 2
  cheap jsdom tests now (following the `site-header.test.tsx` Clerk-mock precedent) is the
  proportionate way to prove presentation-only status empirically rather than by inspection alone,
  and costs less than the escalation/re-verification loop it prevents.

---

## Blast Radius

- `apps/web/app/(catalog)/[category]/[slug]/page.tsx` — shell polish only (see Step A)
- `apps/web/components/preview/preview-tabs.tsx` — premium recipe on tab bar / demo pills / code panel / frame chrome
- `apps/web/components/preview/paywall-overlay.tsx` — full stone-* → theme-token rewrite
- `apps/web/components/preview/theme-detail.tsx` — premium recipe on swatch grid / snippet panel
- `apps/web/app/(catalog)/[category]/page.tsx` — **explicit blast-radius expansion** (see Decision Record) — card grid premium polish, presentation-only
- 2 new test files under `apps/web/__tests__/` (jsdom, Clerk-mock precedent from `site-header.test.tsx` / `preview-demo.test.tsx`)

**Do-not-touch (locked contracts, verified against current source 06-07-26):**
- `.preview-canvas` CSS class and Shiki syntax-highlighting blocks in `globals.css`
- `stripDemoPaywall` (`apps/web/lib/registry.ts`) and its `DEMO_LOCKED_SOURCE` constant
- `LOCKED_SOURCE` / `DEMO_SOURCE` constants in `[slug]/page.tsx` (lines ~19–27)
- The `locked` boolean derivation in `[slug]/page.tsx` line 92: `(entry?.isPro === true && !isProUser) || isOverLimit`
- `installToken` HMAC signing block in `[slug]/page.tsx`
- `catalog.ts` and all ambient routing files
- `@repo/db`, Redis / rate-limit modules

---

## Implementation Checklist

### Step A — `[slug]/page.tsx` shell polish (className-only)

- [ ] A1. Apply Phase 2 premium tokens (glassmorphism, gradient, spacing) to nav/header/attribution
  `className` props on the component detail page shell ONLY. Line 92 `locked` derivation and every
  paywall/auth/metering call (`stripDemoPaywall`, `hasHitDailyLimit`, `recordComponentView`,
  `installToken` HMAC block) and their prop wiring into `PreviewEngine`/`ThemeDetail`/`LivePreview`
  are SACRED — no logic touches, className changes only.
- [ ] A2. Polish the Preview/Code tab UI using premium card styling — preserve zero-hydration RSC
  Shiki syntax highlighting behavior (no client hydration regression).

### Step B — Preview Engine, paywall, and theme-detail UI polish

- [ ] B1. `preview-tabs.tsx`: apply premium recipe (`rounded shadow-soft`, accentSecondary
  hovers/chips, glass on chrome) to the tab bar (`role="tablist"` container), demo pill selector
  (`DemoPill`), code panel wrapper, and outer frame chrome. **Verbatim, unchanged:** the
  `preview-canvas` className string on the preview-tabpanel div (line ~164 — used by external CSS
  and possibly test selectors), `aria-pressed` on `DemoPill`/`LangButton`, `activeDemoId` state
  logic, the `IntersectionObserver` mount-on-scroll effect, and `isValidVideoPath`/`safeVideoSrc`
  video-path guard.
- [ ] B2. `paywall-overlay.tsx`: full `stone-*` → theme-token rewrite. Replace `BUTTON_CLASS` and
  the overlay container/badge/copy classes with `--surface`/`--border`/`--accent`/`--radius`/
  `shadow-soft` equivalents (theme-aware across Cozy Daylight / Lofi Dusk / Paper Café — verify
  visually or via the theme-toggle test precedent). `SignedIn`/`SignedOut`/`CheckoutButton`
  fetch-to-`/api/checkout` logic, the `locked`/`overLimit` props, and all conditional
  render branches stay byte-for-byte identical — CSS classes change, JSX structure/logic does not.
- [ ] B3. `theme-detail.tsx`: upgrade the plain `rounded-md`/`border-hairline` swatch-grid and
  install-snippet panel to the premium recipe (`rounded shadow-soft`, theme tokens). The palette
  swatch grid rendering, `LOCKED_MESSAGE` locked-state substitution, and the escaped
  `<code>{...}</code>` install-snippet logic (no `dangerouslySetInnerHTML`) are untouched.

### Step C — Category grid polish (explicit blast-radius expansion)

- [ ] C1. `[category]/page.tsx`: apply the same premium recipe to the card grid (`<ul>`/`<li>`/
  `<Link>` classNames) established in Steps A–B, so the browse→detail hop is visually consistent.
  Presentation-only — `getCategoryEntries`/`getCategories`/metadata generation logic untouched.

### Step D — New tests (jsdom, Clerk-mock precedent)

- [ ] D1. New test file (e.g. `apps/web/__tests__/paywall-overlay.test.tsx`, `@vitest-environment
  jsdom`): render `<PaywallOverlay>` and assert (a) the lock badge / "Pro Component" text renders,
  and (b) no real component source text appears in the DOM. Mock `@clerk/nextjs`
  (`SignedIn`/`SignedOut`/`SignInButton`) following the `site-header.test.tsx` mock shape — render
  both signed-in and signed-out branches.
- [ ] D2. New test file (e.g. `apps/web/__tests__/theme-detail.test.tsx`, `@vitest-environment
  jsdom`): render `<ThemeDetail locked={true} installSnippet="..." />` and assert the real snippet
  text is ABSENT from the DOM (only `LOCKED_MESSAGE` present); render `<ThemeDetail locked={false}
  installSnippet="..." />` and assert the real snippet text IS present. Pure server component — no
  Clerk mock needed (no client hooks), but still requires jsdom for `render`/`screen`.

### Step E — Verify

- [ ] E1. Run full vitest suite (`corepack pnpm --filter web test`), confirm 104/104 passing
  (existing 102 + 2 new: D1 + D2), no regressions — including `preview-demo.test.tsx`,
  `preview-tabs-cdn.test.tsx`, `preview.test.tsx`, `paywall-demo.test.ts`, `site-header.test.tsx`.
- [ ] E2. Manually confirm a Pro component's detail view shows correct polished locked-source
  treatment for a non-Pro session, and correct unlocked source for a Pro session (or documented
  test-mock equivalent) — **Agent-Probe, known-gap**: blocked on missing Clerk dev keys per
  `all-context.md` Open Questions (runtime blocker, not a build defect). Record as an owed
  program-level visual checkpoint in the phase report, not a silent skip.

---

## Exit Gate

```bash
# Vitest full suite
corepack pnpm --filter web test
# Expected: 104/104 passing (102 existing + 2 new), zero new failures

# Type check
corepack pnpm --filter web exec tsc --noEmit
# Expected: exits 0

# @repo/ui type-check (unaffected by this phase but part of program regression gate)
corepack pnpm --filter @repo/ui type-check
# Expected: exits 0

# Build differential
corepack pnpm --filter web build
# Expected: exits 0 — ambient qstash signature check failure (if present) is a known,
# pre-existing gap unrelated to this phase's blast radius; do not treat as a phase blocker.
```

- All checklist items (A, B, C, D, E) checked
- Component detail view, preview tabs, paywall overlay, theme detail, and category grid all use
  updated premium card/glassmorphism UI, theme-aware across all 3 site themes
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Phase 2 exit gate not yet passed (premium shell tokens not available)
- Polishing the paywall lock UI risks weakening the server-side gate logic — if any ambiguity
  arises about whether a change touches gate logic vs. presentation only, escalate via phase report
  rather than proceeding
- The two new locked-state tests (D1/D2) fail to render under jsdom for reasons unrelated to the
  styling change itself (e.g. an unrelated Clerk/DOMPurify import breaks under jsdom) — escalate
  rather than weakening/removing the test to force green

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written (see Decision Record above)
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated (this pass); Inner Loop Refresh Note below
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Inner Loop Refresh Note (06-07-26)

Research + Innovate completed this pass. Sections updated: Purpose (added theme-detail + category
grid to scope), Decision Record (new — GO on full-scope token migration), Blast Radius (expanded
from 3 to 5 touchpoint files + 2 new test files, with explicit Do-not-touch list verified against
live source), Implementation Checklist (fully rewritten from 2 steps/4 items to 5 steps/12 items,
adding Step C category-grid expansion and Step D new tests), Exit Gate (added @repo/ui type-check +
build differential + updated test count 104/104), Blockers (added new-test-failure escalation
clause). Source files read to confirm exact current class names/logic before rewriting:
`preview-tabs.tsx`, `paywall-overlay.tsx`, `theme-detail.tsx`, `[slug]/page.tsx`,
`[category]/page.tsx`, plus test precedents `site-header.test.tsx` and `paywall-demo.test.ts`.
Triggers re-run of PVL from V1.

---

## Touchpoints

- `apps/web/app/(catalog)/[category]/[slug]/page.tsx`
- `apps/web/components/preview/preview-tabs.tsx`
- `apps/web/components/preview/paywall-overlay.tsx`
- `apps/web/components/preview/theme-detail.tsx`
- `apps/web/app/(catalog)/[category]/page.tsx`
- 2 new test files under `apps/web/__tests__/`

---

## Public Contracts

- Server-side Pro paywall gate logic (`entry?.isPro === true` read path, line-92 `locked`
  derivation) unchanged — presentation-only polish
- `stripDemoPaywall` and `DEMO_LOCKED_SOURCE` unchanged
- Zero-hydration RSC Shiki syntax highlighting behavior unchanged
- `PreviewTabs` demoId state, `aria-pressed` accessibility behavior, and `preview-canvas` className
  contract unchanged
- `installToken` HMAC signing block unchanged
- `ThemeDetail`'s escaped install-snippet rendering (no `dangerouslySetInnerHTML`) unchanged

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `corepack pnpm --filter web test` (104/104) | Fully-Automated | All existing behavior (paywall gate, demo pills, Shiki, theme install-snippet parity) unregressed by premium styling pass |
| `corepack pnpm --filter web exec tsc --noEmit` | Fully-Automated | No type errors introduced by className/JSX changes |
| `corepack pnpm --filter @repo/ui type-check` | Fully-Automated | Program-level regression gate unaffected by this phase |
| D1 — PaywallOverlay locked-state test (new) | Fully-Automated | Premium-styled paywall overlay still renders lock UI and never leaks real source text in DOM |
| D2 — ThemeDetail locked-state test (new) | Fully-Automated | Premium-styled theme detail view still strips install snippet server-side when locked |
| Manual Pro/non-Pro visual check (E2) | Agent-Probe (known-gap — Clerk dev keys missing) | Visual paywall/theme-detail lock treatment renders correctly across 3 themes for both session states |

```bash
# Vitest full suite
corepack pnpm --filter web test
# Expected: 104/104 passing (102 existing + 2 new), zero new failures
```

---

## Test Infra Improvement Notes

(none identified yet)

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-04-component-ui_PLAN_05-07-26.md`
- Last completed step: Step 4 (PVL) — this pass
- Validate-contract status: PASS (written this pass — see `## Validate Contract` below)
- Supporting context files loaded: `apps/web/components/preview/{preview-tabs,paywall-overlay,theme-detail}.tsx`, `apps/web/app/(catalog)/[category]/page.tsx`, `[category]/[slug]/page.tsx`, `apps/web/__tests__/{paywall-demo.test.ts,site-header.test.tsx}`, phase-03 report token recipe (referenced, not re-read this pass — assume `rounded shadow-soft` + `--surface`/`--border`/`--accent`/`--radius` tokens per prior phase convention)
- Next step: Spawn vc-execute-agent for Step 5 (EXECUTE) — all checklist items A through E

---

## Validate Contract

Status: PASS
Gate: PASS
Date: 06-07-26
date: 2026-07-06
generated-by: inner-pvl: phase-4

Parallel strategy: sequential
Rationale: Score 0-1/7 — single feature area (component UI presentation polish), no schema/auth/API/billing surface, no new dependencies, 5 blast-radius files + 2 new test files, all mechanically verified against live source in Simple Mode. No fan-out coordination needed.

Plan updates applied: none — 0 CONCERNs, 0 FAILs found. Plan's own claims (blast radius, do-not-touch list, mock precedent) were verified accurate against live source during V2 and required no correction.

Execute-agent instructions:
- E1: Preserve the `preview-canvas` className substring verbatim within any expanded className string on the preview-tabpanel div (`preview-tabs.tsx` line ~164) — grep for `preview-canvas` after editing to confirm it survived.
- E2: `BUTTON_CLASS` in `paywall-overlay.tsx` is referenced in 2 places (SignInButton child button + CheckoutButton) — rewrite the constant once, do not fork into two separate class strings.
- E3: Do not touch the `entry?.contentType === "theme"` conditional (`[slug]/page.tsx` line 151) while adjusting surrounding header/nav/attribution className strings in Step A.
- E4: For D1 (`paywall-overlay.test.tsx`), follow the `site-header.test.tsx` Clerk mock shape exactly: `vi.mock("@clerk/nextjs", () => ({ SignedIn: ..., SignedOut: ..., SignInButton: ... }))`. Render both branches; assert lock badge/copy text present AND real component source text absent from the DOM.
- E5: D2 (`theme-detail.test.tsx`) needs NO Clerk mock — `ThemeDetail` is a pure server component with zero client imports (verified). Use `@vitest-environment jsdom` only for `render`/`screen`.
- E6: Run `corepack pnpm --filter web test` after each step (A through D) to confirm the running total stays green before moving to the next step, per the plan's per-section test-gate convention.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| E1 (Exit Gate) | Full regression suite unregressed by premium styling pass across paywall/demo-pill/Shiki/theme-install-snippet behavior | Fully-Automated | `corepack pnpm --filter web test` (expect 104/104) | A |
| E1 (Exit Gate) | No type errors introduced by className/JSX changes | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` | A |
| E1 (Exit Gate) | Program-level regression gate unaffected (packages/ui untouched this phase) | Fully-Automated | `corepack pnpm --filter @repo/ui type-check` | A |
| D1 | PaywallOverlay premium-styled overlay still renders lock UI and never leaks real source text in DOM (signed-out branch) | Fully-Automated | `apps/web/__tests__/paywall-overlay.test.tsx` — signed-out case | B |
| D1 | PaywallOverlay premium-styled overlay still renders lock UI and never leaks real source text in DOM (signed-in branch) | Fully-Automated | `apps/web/__tests__/paywall-overlay.test.tsx` — signed-in case | B |
| D2 | ThemeDetail strips install snippet server-side when locked=true | Fully-Automated | `apps/web/__tests__/theme-detail.test.tsx` — locked case | B |
| D2 | ThemeDetail shows real install snippet when locked=false | Fully-Automated | `apps/web/__tests__/theme-detail.test.tsx` — unlocked case | B |
| E1 (Exit Gate) | Build stays green under presentation-only changes | Hybrid — precondition: local env file has a format-valid Clerk publishable key | `corepack pnpm --filter web build` | C — pre-existing ambient qstash signing-key differential is a documented, unrelated known-gap; not blocking this phase |
| E2 (Exit Gate) | Visual paywall/theme-detail lock treatment renders correctly across 3 themes for both session states | Agent-Probe | Manual browser check — BLOCKED on missing real Clerk dev keys (`process/context/all-context.md` Open Questions — runtime blocker, not a build defect) | D — backlog test-building stub: record as owed program-level visual checkpoint in phase report, revisit once Clerk dev keys are configured |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist, D1/D2)
- C — deferred to a named later phase/plan (pre-existing ambient qstash differential, unrelated to this phase)
- D — backlog test-building stub (named residual; keep-active; continue — Clerk dev keys program-level blocker)

C-4 reconciliation: strategy column carries only Fully-Automated / Hybrid / Agent-Probe. The Agent-Probe row (E2 visual check) is a named residual proven via gap-resolution D, not a silent pass — see "What this coverage does NOT prove" below.

Legacy line form (retained for existing consumers):
- Full vitest suite: Fully-automated: `corepack pnpm --filter web test` (104/104)
- Type check: Fully-automated: `corepack pnpm --filter web exec tsc --noEmit`
- @repo/ui type-check: Fully-automated: `corepack pnpm --filter @repo/ui type-check`
- Build differential: hybrid: `corepack pnpm --filter web build` + precondition: format-valid Clerk key present in the local env file
- Manual Pro/non-Pro visual check across 3 themes: agent-probe: known-gap: documented — blocked on missing Clerk dev keys

Failing stub (D1 — paywall-overlay.test.tsx, Fully-Automated):
```
test("should render lock badge and never leak real source text in DOM (signed-out)", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: PaywallOverlay signed-out branch renders lock UI, no source leak")
})
test("should render lock badge and never leak real source text in DOM (signed-in)", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: PaywallOverlay signed-in branch renders CheckoutButton, no source leak")
})
```

Failing stub (D2 — theme-detail.test.tsx, Fully-Automated):
```
test("should show LOCKED_MESSAGE and hide real install snippet when locked=true", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: ThemeDetail locked state strips real snippet")
})
test("should show real install snippet when locked=false", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: ThemeDetail unlocked state shows real snippet")
})
```

Dimension findings:
- Infra fit: PASS — no container/infra/worker surfaces touched; pure Next.js RSC/client component styling
- Test coverage: PASS — D1 mock precedent (site-header.test.tsx Clerk mock shape) directly transferable; D2 needs no mock (pure server component, verified); baseline 102/102 green confirmed live
- Breaking changes: PASS — no public contract, schema, or API changes; component prop signatures unchanged (verified against source)
- Security surface: PASS — paywall/auth/metering logic verified byte-for-byte unchanged at cited locations (line 92 `locked` derivation, installToken HMAC block lines 94-102, stripDemoPaywall/DEMO_LOCKED_SOURCE in registry.ts, SignedIn/SignedOut/CheckoutButton branches)
- Section A ([slug]/page.tsx shell): PASS — className targets findable and isolated from sacred logic block; highest-risk edit: accidental touch to contentType ternary at line 151, mitigated by className-only scope discipline
- Section B1 (preview-tabs.tsx): PASS — tablist/DemoPill/code-panel/frame-chrome targets uniquely matchable; highest-risk edit: preview-canvas className survival at line ~164
- Section B2 (paywall-overlay.tsx): PASS — BUTTON_CLASS + overlay classes cleanly separable from SignedIn/SignedOut/CheckoutButton JSX; highest-risk edit: BUTTON_CLASS used in 2 places, must stay unforked
- Section B3 (theme-detail.tsx): PASS — swatch grid + snippet pre-block are the only styled surfaces; zero risk to LOCKED_MESSAGE/escaped-code logic
- Section C ([category]/page.tsx): PASS — card grid classNames isolated from getCategoryEntries/getCategories/metadata; no auth/paywall logic present in this file
- Section D (new tests): PASS — mock precedent identified and confirmed transferable for D1; no-mock pure-SSR pattern confirmed for D2

High-risk pack: N/A — this phase is presentation-only (className/JSX styling); no auth, billing, schema/migration, public API, deploy/runtime, or secret/trust-boundary logic is modified. No 5-artifact evidence pack required per `vc-risk-evidence-pack` (no high-risk class touched). Security surface dimension confirms all sacred paywall/auth/metering call sites and their prop wiring remain byte-for-byte identical.

Backlog artifacts: none created this pass. The E2 manual visual check known-gap is tracked inline in this contract and the phase report (see below), not as a separate backlog note — it is the same pre-existing program-level Clerk-dev-keys blocker already documented in `process/context/all-context.md` Open Questions, not a new gap introduced by this phase.

Known gaps:
- Manual Pro/non-Pro visual check across 3 themes (E2): known-gap: documented — blocked on missing real Clerk dev keys (pre-existing program-level runtime blocker, not a build defect; see `process/context/all-context.md` Open Questions). Owed as a program-level visual checkpoint once Clerk dev keys are configured. Does NOT gate this phase's PASS status because the developed behavior it would visually confirm (lock treatment rendering) already has Fully-Automated proof (D1/D2) that the correct DOM state (real source absent / present) is achieved — the known-gap only concerns the CSS/visual polish layer on top, not the security-critical lock enforcement.
- Ambient qstash signing-key build differential (Hybrid gate, pre-existing): documented as inherited from prior phases, unrelated to this phase's blast radius; does not block this phase's PASS.

What this coverage does NOT prove:
- `corepack pnpm --filter web test`: does not prove the premium Tailwind classNames render correctly in a browser (visually) — only that no behavioral regression occurred and DOM structure/text-content assertions pass.
- `corepack pnpm --filter web exec tsc --noEmit`: does not catch className string typos (e.g. `shadow-sof` vs `shadow-soft`) — Tailwind classes are untyped strings, not type-checked.
- `corepack pnpm --filter @repo/ui type-check`: does not test anything new — sanity gate confirming this phase's changes (scoped entirely to apps/web) have zero blast radius into packages/ui.
- D1/D2 new tests: do not prove visual correctness of the glassmorphism/premium treatment itself, or color-accuracy of the ThemeDetail palette swatch rendering — only that DOM text-content and locked/unlocked branching remain correct under the new styling.
- `corepack pnpm --filter web build`: does not prove runtime correctness beyond successful compilation; does not resolve the pre-existing ambient qstash signing-key differential (tracked separately, unrelated to this phase).
- Agent-Probe (E2): explicitly NOT proven by any automated gate in this cycle — this is the one named residual, carried forward as a known-gap per above.

Accepted by: session (autonomous, /goal execution) — no CONCERNs required acceptance; net gate is PASS with 0 FAILs and 0 CONCERNs. The one Known Gap (E2 manual visual check) is a pre-existing, previously-documented program-level blocker (missing Clerk dev keys), not a new gap requiring fresh acceptance this cycle.
