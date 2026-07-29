---
phase: phase-04-navigation
date: 2026-07-26
status: COMPLETE_WITH_GAPS
feature: supabase-interconnect
plan: process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-04-navigation_PLAN_25-07-26.md
---

# Phase 04 — Navigation Reconciliation — EXECUTE Report

**TL;DR** — All checklist items done. `/templates` now answers a 308 to `/?tab=templates`; its SEO
metadata moved onto the home route's `generateMetadata({ searchParams })` branch; the orphaned
`TemplatesListSEO` component was deleted; orphan routes are documented and the comments are now
mechanically enforced; the sidebar-count test now proves counts come from the live hook.
Both gates green: `tsc --noEmit` 0 errors, vitest **82/82 across 21 files** (baseline 73/18).
The 308 and the metadata branch are proven by **new server-free unit tests** that I verified fail
under mutation — they are not claimed-but-unproven. The e2e variant of the redirect check is
skipped for a foreign blocker (Clerk dev keys absent) and says so in-file.

---

## Context Envelope

| # | Field | Value |
|---|---|---|
| 1 | feature | supabase-interconnect |
| 2 | phase | EXECUTE |
| 3 | session-goal | Phase 04 navigation reconciliation: `/templates` redirect, SEO preservation, sidebar-count proof |
| 4 | branch | main |
| 5 | worktree | main |
| 6 | context-group | tests |
| 7 | blast-radius-packages | apps/web (app/templates, app/page.tsx, app/public-dashboard, app/import-old, components/features/main-page, components/features/templates, e2e) |
| 8 | active-plan | process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-04-navigation_PLAN_25-07-26.md |
| 9 | test-runner | vitest \| playwright |
| 10 | validate-contract | inline in plan (`Gate: CONDITIONAL`, `generated-by: inner-pvl: phase-4`) |

---

## What Was Done

### Step A — Reconcile with committed work (A1, A2) — confirm-only, no code change
Confirmed by direct read: `sidebar-layout.tsx:165` calls `useCategoryTagCounts()`; zero references
to `demosCount`/`getTagDemosCount` in that file; `isAdmin` gating at the Templates/Bundles/Pro nav
filter present and untouched. No second count-fetching mechanism was introduced by this phase —
the new test consumes the same single hook. **Agent-probe (WIP reconciliation) result: PASS.**

### Step B — `/templates` → 308 redirect (B1, B1a, B2, B3)

`apps/web/app/templates/page.tsx` — replaced the whole page body:

```tsx
import { permanentRedirect } from "next/navigation"
export default function TemplatesPage() {
  permanentRedirect("/?tab=templates")
}
```

Plus a header comment recording the B2 rationale (308 permanent, not 307) and why no `metadata`
export remains here (a 3xx has no body, so it would never reach a crawler).

**B1a pre-check result — the plan's assumption held.** `apps/web/app/page.tsx`'s `generateMetadata`
was a zero-arg async export sitting in the same file as a default export that already destructured
`searchParams: Promise<{ tab?: string }>`. Adding the identical parameter to `generateMetadata` and
awaiting it required no restructuring of the route. No finding to report here.

`apps/web/app/page.tsx` — `generateMetadata` now takes `{ searchParams }`, awaits it, and returns
the templates title/description/keywords/OpenGraph object (previously at `templates/page.tsx:8-27`)
when `tab === "templates"`. The `!tab` / other-tab path falls through to the original default
metadata **including the unchanged `WebSite` JSON-LD `other["script:ld+json"]` block** — asserted
explicitly by the new test (E2 requires confirming this; it is confirmed by assertion, not by eye).

**B3 confirmed:** the nav item already targets `?tab=templates` via `navigateToTab()` — no nav-side
change was needed or made.

### E4 — `TemplatesListSEO` disposition: **DELETED**

`apps/web/components/features/templates/templates-list-seo.tsx` was deleted (the recommended option
in E4). Reasoning: after the redirect its importer count is zero (verified by repo-wide `rg` before
and after — the only two hits were the replaced `templates/page.tsx` import and its own definition
line). Leaving an unimported file in place would not fail `tsc`, so "deprecate in place" would rot
silently; deletion is checked by the build. Its `get_templates_v3` RPC dependency is untouched and
still live via `apps/web/components/features/templates/templates-list.tsx`, which serves the
`?tab=templates` view — confirmed by `rg get_templates_v3` after deletion (3 hits: `templates-list.tsx`,
`types/global.ts`, `types/supabase.ts`).

### Step C — Orphan routes (C1, C1a/E3, C2)

Added an `// INTENTIONALLY-UNLINKED INTERNAL ROUTE` marker comment to
`apps/web/app/public-dashboard/page.tsx` and `apps/web/app/import-old/page.tsx`, each stating the
route is direct-URL-only, deliberately absent from nav, not accidentally orphaned, and not a removal
candidate, with a pointer to this plan.

**E3 taken, not skipped.** New `apps/web/app/__tests__/orphan-route-comments.test.ts` reads both
files and asserts the marker string is present. This makes SPEC AC9's "regression check" literal —
if someone strips the comment, the suite fails. Cost was two lines of glue, so "disproportionate"
did not apply.

**C2 confirmed:** `/c/[collection_slug]` and `/maintenance` untouched; no regression.

### Step D — Sidebar counts (D1, D1a, D2, D3)

**D1a honored — nothing was removed.** `getTagDemosCount()` (`queries.ts:1098-1102`) and every
`demosCount` value in `lib/navigation.ts` are retained, exactly as D1a and E1 require. Re-verified
the live consumer before deciding: `home-layout.tsx:8` imports it and `:226` calls
`getTagDemosCount(category.id)` for the per-category slider `totalCount` badge. Removing them would
have zeroed that badge. **I did not touch `lib/navigation.ts` or `lib/queries.ts` at all.**

**D2 executed as confirm-only:** `rg` over `sidebar-layout.tsx` returns zero hits for both
`demosCount` and `getTagDemosCount` — the sidebar has no remaining dependency on the hardcoded
values. Nothing to remove.

**D3** — extended `apps/web/components/features/main-page/__tests__/sidebar-layout.test.tsx`. The
`useCategoryTagCounts` mock became a mutable ref so a test can supply real counts. Two new cases:
- feeds `{ hero: 42 }`, expands the "Marketing Blocks" category, and asserts the `/s/hero` link
  renders `42` **and does not render `73`** (`73` is that item's hardcoded `demosCount` in
  `lib/navigation.ts`). It also asserts a zero-count sibling (`/s/background`) is filtered out.
- asserts the Explore group is absent entirely when the live query returns `{}`.

---

## Test Gate Outcomes

Baseline re-measured at session start rather than trusted from the handoff (both matched):

| Gate | Baseline | After | Verdict |
|---|---|---|---|
| `corepack pnpm --filter web exec tsc --noEmit` | exit 0, 0 errors | exit 0, **0 errors** | PASS — no new errors |
| `corepack pnpm --filter web test` | 73 passed / 18 files | **82 passed / 21 files** | PASS — no new failures, +9 tests |
| `playwright test e2e/` | not captured pre-change (see gap below) | 19 failed / 13 passed / 2 skipped | INCONCLUSIVE — see below |

Final vitest output, verbatim:

```
 Test Files  21 passed (21)
      Tests  82 passed (82)
```

The +9 = 2 (redirect unit) + 3 (metadata) + 2 (orphan comments) + 2 (sidebar counts).

### Anti-vacuous-green verification (mutation checks I actually ran)

I did not accept first-run green on any new assertion. Each was mutated and observed to fail, then
the source was restored from a backup and `git status` confirmed clean:

1. **Sidebar count** — changed `realCount` to fall back to `item.demosCount ?? 0`:
   `AssertionError: expected 'Heroes73' to contain '42'` → 1 failed. Restored.
2. **Redirect** — swapped `permanentRedirect` → `redirect` in `templates/page.tsx`: both redirect
   tests failed. Restored.
3. **Metadata** — changed the branch condition to `tab === "__no_such_tab__"`: the templates-metadata
   test failed. Restored.

`git status` after restore shows `sidebar-layout.tsx` unmodified; `page.tsx` / `templates/page.tsx`
carry only the intended diffs.

### What the tests prove, and what they do not

**Proven.**
- `/templates` calls `permanentRedirect("/?tab=templates")` and never `redirect()` — i.e. 308, not
  307 — proven server-free at `apps/web/app/templates/__tests__/templates-redirect.test.ts`.
- The home route's `generateMetadata` returns templates SEO metadata for `tab=templates`, and
  returns the default metadata **with the `WebSite` JSON-LD intact** for no-tab and for an unrelated
  tab — `apps/web/app/__tests__/home-metadata.test.ts`.
- The sidebar badge value originates from `useCategoryTagCounts()`, not from `demosCount`.
- Both orphan-route marker comments exist.

**Not proven — stated plainly.**
- **No test exercises a real HTTP 308 over the wire.** The unit test proves the route calls Next's
  permanent-redirect helper; it infers the status code from that helper's documented semantics. The
  e2e test that would prove the wire status is skipped (below).
- No test proves a crawler will treat `/?tab=templates` as SEO-equivalent to the retired page. The
  metadata test proves the object is returned, not that it renders into served HTML, and not that
  ranking is preserved. No crawl-simulation harness exists in this repo.
- The sidebar test proves rendering from hook data; it does **not** prove the live Supabase query
  returns correct counts against production data.
- `home-layout.tsx` still has zero test coverage. Its non-regression rests on the fact that I did
  not modify the files it depends on — that is an argument, not a test.

---

## Plan Deviations

1. **a11y route list: replaced, then reverted to removal.** My first edit swapped `/templates` for
   `/?tab=templates` in `e2e/a11y.spec.ts`'s audit list. Running it surfaced **58 pre-existing
   `color-contrast` violations** on the tab-browser surface (same foreign muted-foreground family
   already in this repo's a11y debt), which would have wired 2 permanently-red tests into the gate.
   I reverted to simply **removing** `/templates` from the axe list — auditing a bodyless 3xx is
   meaningless — and added a dedicated redirect spec instead. The removal is documented in-file with
   the reason and a pointer to this report. Within blast radius; no user gate needed.
2. **Added an e2e spec the plan did not call for** (`e2e/templates-redirect.spec.ts`), then marked it
   `test.describe.skip` with an in-file reason. Rationale in the next section. Within blast radius.
3. **Added two unit test files beyond the plan's D3 item** (redirect + metadata). The plan's contract
   classed both behaviors as Agent-Probe / manual review only. I upgraded them to Fully-Automated
   because it was cheap and because "manually eyeballed" was the exact weakness the contract itself
   flagged. Strictly additive coverage.
4. **Self-caught process error:** I initially ran `git rm --cached` on the deleted component, which
   staged the deletion — the handoff forbids staging. I caught it immediately and ran
   `git reset -q HEAD -- <that one path>`. The deletion is now worktree-only and **nothing is
   staged** (`git diff --cached --name-only` is empty). No other file's index entry was touched. No
   file was stashed, reverted, or checked out. `package.json` and `pnpm-lock.yaml` were not modified
   by me.

---

## Test Infra Gaps Found

1. **The 308 cannot be observed end-to-end in this environment (foreign, pre-existing).** Running
   the redirect spec returned HTTP **200** with headers `x-clerk-auth-reason: dev-browser-missing`
   and `x-middleware-rewrite: /templates` — Clerk middleware intercepts every document request and
   rewrites it before the page's `permanentRedirect()` executes, because real Clerk dev keys are not
   provisioned (a blocker already documented in `all-context.md` "Open Questions"). The spec is left
   in the repo, skipped, with that explanation and an unskip condition in the file header. This is
   the honest reason it is skipped — the behavior itself is proven by the unit test.
2. **`/?tab=templates` has 58 WCAG AA `color-contrast` violations** (light and dark). Foreign and
   pre-existing (the tab-browser surface, not anything this phase authored), but it is now a known
   quantity and previously was not audited at all. Worth a backlog item.
3. **The `playwright test e2e/` gate is broadly red and I have no clean pre-change baseline for it.**
   Full run: 19 failed / 13 passed / 2 skipped (3.9m). Every failure is on a route this phase never
   touched (`/`, `/magic`, `/magic-chat`, `/studio`, `/api-access`, `/contest`, `/our-story`) and is
   the same contrast/Clerk-absent family. **I cannot claim "no new e2e failures" with certainty**,
   because I did not capture a pre-change full-e2e baseline before editing — that is a gap in my own
   method, not a finding about the code. What I can say: the plan's documented a11y baseline (6
   pre-existing foreign fails, 18-07-26) is badly stale, and this gate needs a fresh baseline
   recorded before it can function as a regression gate for anyone.
4. **`home-layout.tsx` still has zero coverage** — carried forward unchanged from the plan's own
   Test Infra Improvement Notes. Recommend minimal coverage of its `sliderGroups` count derivation
   as an independent follow-up.

---

## Note for UPDATE PROCESS — stale D2 checklist wording

The plan's **Step D2 bullet text still reads "Remove the hardcoded `demosCount` values … and the
`getTagDemosCount()` call"**, which contradicts D1a's locked "RETAIN" decision sitting directly
above it, and contradicts Execute-Agent Instruction E1. The validate-contract already flags this as
a non-scored editorial defect (Section D findings). I executed per D1a/E1 (retain; confirm-only) and
removed nothing.

**Requested cleanup:** rewrite D2 to read approximately —
`D2. Confirm the sidebar no longer depends on lib/navigation.ts's hardcoded demosCount values or
getTagDemosCount(); retain both (per D1a) for home-layout.tsx's slider badge.`

This is a documentation defect only. Left uncorrected, a future reader executing D2 literally would
break the home page's tag-slider counts.

---

## What Was Skipped or Deferred

- **Nothing in the checklist was skipped.** Steps A1-A2, B1-B3 + B1a, C1 + C1a + C2, D1 + D1a + D2 +
  D3 are all complete.
- `home-layout.tsx` migration to `useCategoryTagCounts()` — explicitly out of scope per D1a. Not
  attempted, not added to blast radius.
- `isAdmin` nav gating — untouched, per handoff.
- `lib/queries.ts` `useCategoryTagCounts()` — untouched, per handoff.
- Phases 5-6 — not entered.

## Files Changed

| File | Change |
|---|---|
| `apps/web/app/templates/page.tsx` | M — page body replaced with `permanentRedirect("/?tab=templates")` + rationale comment |
| `apps/web/app/page.tsx` | M — `generateMetadata` gains `{ searchParams }` + `tab === "templates"` branch |
| `apps/web/components/features/templates/templates-list-seo.tsx` | **D** — deleted (E4, orphaned) |
| `apps/web/app/public-dashboard/page.tsx` | M — orphan-route marker comment |
| `apps/web/app/import-old/page.tsx` | M — orphan-route marker comment |
| `apps/web/e2e/a11y.spec.ts` | M — `/templates` removed from audit list + reason comment |
| `apps/web/components/features/main-page/__tests__/sidebar-layout.test.tsx` | M — mutable count mock + 2 new cases |
| `apps/web/app/templates/__tests__/templates-redirect.test.ts` | **A** — 308/307 unit proof |
| `apps/web/app/__tests__/home-metadata.test.ts` | **A** — metadata branch + JSON-LD non-regression |
| `apps/web/app/__tests__/orphan-route-comments.test.ts` | **A** — marker-comment enforcement |
| `apps/web/e2e/templates-redirect.spec.ts` | **A** — e2e redirect proof, skipped w/ reason |

`graphify update .` run after the edits (19114 nodes, 25756 edges).

## Follow-up Plan Stubs Created

None. Every Execute-Agent Instruction (E1-E4) was actionable and resolved within this phase. The
three items in "Test Infra Gaps Found" (1-3) are recorded here for EVL/UPDATE PROCESS triage rather
than pre-emptively filed as plans.

## CONTEXT_PARTIAL Items

None.

## Closeout Packet

- **Selected plan:** `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-04-navigation_PLAN_25-07-26.md`
- **Finished:** all Step A-D checklist items; E1, E2, E3, E4 applied.
- **Verified:** `tsc --noEmit` 0 errors; vitest 82/82 across 21 files; three mutation checks proving
  the new assertions are non-vacuous.
- **Still unverified:** wire-level 308 status (Clerk-blocked); crawler SEO equivalence (no harness);
  full-e2e regression delta (no pre-change baseline captured).
- **Remaining cleanup:** D2 checklist wording fix (see note above); a11y baseline re-record.
- **Classification:** `Keep in active/testing` — code-complete, both automated gates green, but the
  e2e/a11y picture is unresolved and the plan text needs the D2 correction.

## Forward Preview

**Test Infra Found.** Vitest is the reliable gate here (fast, hermetic, 82/82). Playwright is not
currently a usable regression gate — it needs a fresh recorded baseline and Clerk dev keys. Prefer
server-free unit proofs for route-level behavior in this repo until that changes; the redirect and
metadata tests in this phase are a working pattern for that.

**Blast Radius Changes.** Removed from blast radius: `lib/navigation.ts`, `lib/queries.ts`,
`hooks/use-navigation.ts`, `lib/atoms.ts` — all confirm-only, none modified. Added beyond the plan's
listing: `apps/web/app/public-dashboard/page.tsx`, `apps/web/app/import-old/page.tsx` (C1 comments),
`apps/web/e2e/` (2 files), and 3 new test files. `templates-list-seo.tsx` is deleted.

**Commands to Stay Green.**
```
corepack pnpm --filter web exec tsc --noEmit          # expect exit 0
corepack pnpm --filter web test                        # expect 82 passed / 21 files
```

**Dependency Changes.** None. `package.json` and `pnpm-lock.yaml` untouched by this phase.

## Unresolved Questions

1. Should `/?tab=templates`'s 58 `color-contrast` violations be filed as a backlog note now, or
   folded into a broader a11y-debt item? They are foreign to this phase either way.
2. Who owns re-baselining the Playwright e2e gate? It is currently 19-red and cannot detect
   regressions for any phase.
3. Confirm the D2 wording fix lands in UPDATE PROCESS rather than being carried into Phase 5.

---

## UPDATE PROCESS Addendum (29-07-26)

- **D2 wording fixed** in `phase-04-navigation_PLAN_25-07-26.md` — the checklist bullet now reads
  confirm-only ("retain, confirm sidebar no longer depends on the hardcoded values"), matching
  D1a's locked decision and Execute-Agent Instruction E1, and matching what EXECUTE actually did.
  Marked `[x]` since the confirm-only action was completed.
- **Phase Loop Progress** Steps 5-7 ticked in the plan file.
- **Closeout classification confirmed:** `Keep in active/testing`. Both automated gates green
  (tsc 0 errors; vitest 82/82) and every checklist item + Execute-Agent Instruction resolved, but
  the phase cannot be archived to `completed/` yet — see "Archival judgment" below.
- **Backlog note written:** `process/features/supabase-interconnect/backlog/e2e-suite-no-baseline-and-foreign-red_NOTE_29-07-26.md`
  (the 19-red-of-32 Playwright suite gap, unrelated to this phase's changes).
- **Context docs updated:** `process/context/tests/all-tests.md` (82/21 re-baseline),
  `process/context/all-context.md` (`/templates` 308-redirect fact + a11y route-matrix note).
- **Umbrella `## Current Execution State`** rewritten to reflect Phase 4 complete/EVL-green and
  Phase 5 as next (loop step RESEARCH).

### Archival judgment

Not moved to `completed/` this pass. Reasoning: the program's phase-archival convention observed
in Phases 1-3 (see umbrella `## Program Status Table`) keeps a phase in `active/` until its
residual gaps are either closed or explicitly accepted as operator/out-of-program items with no
further agent-actionable work. Phase 4's residuals (wire-level 308 proof blocked on absent Clerk
dev keys; no e2e regression baseline; 58 foreign contrast violations) are genuine Known Gaps, not
outstanding implementation work — by that reading Phase 4 is at least as "done" as Phase 3, which
also stayed in `active/` pending operator-only items. Kept in `active/` for consistency with the
program's established pattern (all 6 phases stay together in one task folder; individual phase
archival has not been the program's practice so far) — the umbrella plan, not this phase alone,
is the natural unit for eventual archival at program close.
