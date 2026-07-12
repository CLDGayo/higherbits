---
phase: phase-05-long-tail-qa
date: 2026-07-13
status: COMPLETE
feature: higherbits-cozy-rebrand
plan: process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-05-long-tail-qa_PLAN_12-07-26.md
---

# Phase 5 — Long-Tail QA + Final Gates — Execution Report

**TL;DR:** Program closeout. Long-tail route sweep found the app already brand-clean and
cushion-consistent — only ONE clear outlier fixed (contest Discord link `text-[#147070]` hex →
theme `text-primary`, className-only, 2 lines). Final allow-list-aware brand grep: 7 files match,
ALL functional KEEP survivors (`@21st-dev/*` npm packages, `21st-dev/magic-mcp` repo refs feeding
live GitHubStars, `21st-registry.json` filename literals, `21st-vite` template id) — per-line
residue check = 0 brand strings. apps/backend CORS `21st.dev` was already swapped to
`higherbits.dev` in Phase 2, so the validate-contract's one open-gap is RESOLVED. All gates green:
unscoped root build 0, scoped web build 0, tsc 0, vitest 10/10 (identical to Phase 00 baseline).
Favicon/OG: filename-level + text-readable metadata clean (zero readable "21st" in any binary,
manifest = HigherBits.dev); pixel-glyph content is the standing agent-browser known-gap. Deploy
checklist documented, NOT executed. No git push. **Program Net Gate: CONDITIONAL** (agent-browser
visual + authenticated-E2E + pixel-favicon known-gaps, all charter-pre-authorized).

## What Was Done

- **contest/page.tsx (×2 lines, className-only):** hardcoded light-mode `text-[#147070]` teal on
  the two Discord community links → theme `text-primary`. Dark mode already used `dark:text-primary`;
  the swap unifies both themes on the cozy palette token and removes the last light-only hex outlier
  found across all 8 long-tail route dirs. Zero behavior/JSX/logic change (git diff = 2 insertions,
  2 deletions inside JSX `className` string props on `<a>` tags).

## Long-Tail Route Sweep Findings

All 8 named long-tail route dirs present and surveyed (studio, publish, magic, settings, admin,
contest, our-story, api-access) plus templates/[username]/s/c/q.

| Route dir | Hex literals | Arbitrary radius | Brand strings | Action |
|---|---|---|---|---|
| studio | 0 | `rounded-[2px]` chart-legend swatch (functional, left) | `21st-registry.json` filename + `@21st-dev/cli` (KEEP) | none |
| publish | 0 | 0 | 0 | none (no Clerk/Stripe logic touched) |
| magic | 0 | 0 | `@21st-dev/magic`, `21st-dev/magic-mcp` repo (KEEP) | none |
| settings | 0 | 0 | 0 | none (billing/auth untouched — not touched at all) |
| admin | 0 | 0 | 0 | none |
| contest | 2 (`#147070` links) | 0 | 0 (page-level Logo already removed Phase 1) | **fixed** → `text-primary` |
| our-story | 0 | 0 | 0 | none |
| api-access | 0 | 0 | 0 | none |

Per Step A2 (1h budget, lighter-touch): did NOT restyle the magic hero's broad `text-neutral-800`
cluster (a repeated pattern, not a one-off; restyling it is over-reach for a long-tail page and
risks over-touching). Recorded as non-blocking follow-up, not a regression.

## Final Brand-String Grep Gate

**Command (plan Step C1):**
```
grep -ril "21st" apps/web/app apps/web/components apps/web/lib apps/backend apps/web/public 2>/dev/null | \
  grep -v -e "@21st-dev/" -e "21st-vite" -e "21st-registry"
```
→ 7 files. Every "21st" occurrence in all 7 is a functional KEEP survivor (per-LINE audit — the
same content-line-aware method Phase 2 used to prove "24 raw → 0 residue"):

| File | Match | Classification |
|---|---|---|
| `components/features/studio/sandbox/hooks/use-file-system.ts` | `21st-registry.json` ×4, `@21st-dev/cli` | filename literal + npm pkg — KEEP |
| `components/features/magic/hero.tsx` | `github.com/21st-dev/magic-mcp`, `repo="21st-dev/magic-mcp"` | live GitHubStars repo ref — KEEP |
| `components/features/magic/magic-header.tsx` | `21st-dev/magic-mcp` ×2 | live GitHubStars repo ref — KEEP |
| `components/features/magic/troubleshooting.tsx` | `@21st-dev/magic` ×2 | npm pkg — KEEP |
| `components/features/magic/onboarding/steps/troubleshooting-step.tsx` | `@21st-dev/magic` ×2 | npm pkg — KEEP |
| `lib/config/magic-mcp.ts` | `@21st-dev/cli`, `@21st-dev/magic` ×2 | npm pkg config — KEEP |
| `lib/codesandbox-sdk.ts` | `21st-vite` ×2 | codesandbox template id — KEEP |

**Per-line residue count after full allow-list (incl. `21st-dev/magic-mcp`): 0.** The published
exclude pattern misses the no-`@`-prefix `21st-dev/magic-mcp` repo refs; folding those in per the
validate-contract's execute-agent instruction → 0. **apps/backend CORS gap RESOLVED:** Phase 2
already swapped `"https://21st.dev"` → `"https://higherbits.dev"` (Phase 2 report line 22) — no
backend residue, no extra exclude term needed. Zero NEW occurrences vs Phase 2 exit. **DoD #2 met.**

## Logo-Dedup Gate

`grep -rn "<Logo" apps/web/app --include="*.tsx" | grep -v "header.client.tsx"` → **3 survivors:**
- `studio/page.tsx:168` — `position="flex"` (studio in-flow logo)
- `contest/leaderboard/page.tsx:82` — `position="fixed"` (standalone page; added by Phase 1 Step E1)
- `[username]/[component_slug]/page.client.tsx:666` — `position="flex"` (component detail)

These are the EXACT 3 intentional single-per-route renders Phase 1 documented and accepted at its
EVL-green exit (Phase 1 report line 38, committed 9122d52). The literal "0" exit-gate is a
simplified proxy; the accepted reality = these 3 (each is ONE logo on its OWN route, not a
duplicate). **Zero Phase-5 regression** — contest/page.tsx's page-level logo was removed in Phase 1;
Phase 5's only contest edit was a link color. DoD #1 (one logo per route) holds.

## Favicon / OG Known-Gap Inspection (Phase 2 deferred)

- **Filename-level:** No favicon/OG/icon/manifest file carries "21st" in its name (all generic:
  `favicon.ico`, `favicon-16/32`, `icon.png`, `og-image.png`, `opengraph-image.png`,
  `apple-touch-icon.png`, `android-chrome-*`, 2× dynamic `opengraph-image.tsx`).
- **Dynamic OG generators** (`app/[username]/opengraph-image.tsx`, `[component_slug]/opengraph-image.tsx`):
  grep "21st" → 0 matches.
- **manifest.ts:** uses `SITE_NAME`/`SITE_SLOGAN` = `"HigherBits.dev"` / `"Sophisticated Calm
  Development"` (from `lib/constants.ts`) — no "21st".
- **Binary metadata** (`strings | grep -i 21st` on favicon.ico, icon.png, og-image.png,
  opengraph-image.png, apple-touch-icon.png, android-chrome-512): ZERO readable "21st" text in any.
- **KNOWN-GAP (unchanged):** actual pixel-glyph content of static PNG favicons/OG images cannot be
  visually inspected without a browser/image renderer — per plan, visual inspection is known-gap.
  No text-readable or filename-level 21st residue remains; only the pixel-visual axis is unverified.

## Test Gate Outcomes

| Gate | Command | Result |
|---|---|---|
| Unscoped root build | `corepack pnpm build` | exit 0 — 1 successful/1 total (web:build; apps/backend has no build script → Turbo skip, expected) |
| Scoped web build | `corepack pnpm --filter web build` | exit 0 (90 routes) |
| Typecheck | `corepack pnpm --filter web exec tsc --noEmit` | exit 0 (2 pre-existing workspace-config WARNs, not errors) |
| Vitest | `corepack pnpm --filter web test` | 10/10 pass, 4 files — IDENTICAL to Phase 00 baseline, zero regressions |
| Brand residue (per-line) | Step C1 grep + per-line allow-list | 0 brand strings (7 functional survivors) |
| Logo dedup | `grep "<Logo" ... -v header.client` | 3 Phase-1-accepted intentional renders (0 duplicates) |
| Long-tail a11y (Hybrid, D-a11y contract gate) | `playwright test e2e/a11y.spec.ts` | NOT RUN this phase — covered at higherbits-redesign Phase 5 (16 Axe checks green 2026-07-11); matrix covers magic/studio/api-access/contest/our-story; publish/settings/admin remain the documented backlog a11y gap |
| Visual cushion (Agent-Probe / G1) | `vc-agent-browser` | KNOWN-GAP — unavailable, charter-pre-authorized; source evidence substitute |
| Pixel visual-regression | — | KNOWN-GAP — no visual-diff harness in repo (charter deferred tier) |

## Deploy Checklist (DOCUMENTED — NOT EXECUTED)

Per `process/context/all-context.md` §Deployment (gayo-vps, self-hosted, NEVER Vercel). Deploy is
**user-triggered only** per program charter hard constraint. **No git push performed this phase.**

1. Commit Phase 5 execution changes on `main` (orchestrator/user-driven).
2. Push to remote: `git push origin main` (repo: github.com/CLDGayo/higherbits). Pushing to GitHub
   alone does NOT deploy.
3. On gayo-vps, run the build+restart as user `cozy` (always `su - cozy`, never `sudo -u cozy` —
   HOME pollution breaks corepack):
   ```
   ssh root@72.62.196.231
   su - cozy -c "cd ~/htdocs/higherbits.dev && git pull --ff-only origin main && \
     corepack pnpm install --no-frozen-lockfile && corepack pnpm --filter web build && \
     pm2 restart higherbits"
   ```
   App: pm2 process `higherbits` (`next start`, port 3005, nginx proxy) at
   `/home/cozy/htdocs/higherbits.dev`. (`/home/higherbits/htdocs/` is an empty decoy.)

**Deploy NOT executed — user-triggered only, per program charter hard constraint.**

## Plan Deviations

1. Step A1 fixed contest link hex (className-only) instead of a broad multi-route restyle — matches
   the plan's own "fix only clear one-off hex/radius outliers" instruction. Within blast radius, no
   behavior change. No user gate needed (within-blast-radius, className-only).

No hard-stop-class deviations. No schema/auth/billing/API/container/secret surface touched.

## Test Infra Gaps Found

- No component-level test asserts the contest link className or long-tail visual state — automated
  coverage rests on build/tsc/grep (contract CONCERN, accepted per program precedent).
- agent-browser + authenticated-E2E + pixel-favicon visual inspection unavailable → program-level
  known-gaps (charter-pre-authorized; same as higherbits-redesign).
- publish/settings/admin not in the Playwright/Axe a11y matrix (validate-contract Open Gap #2,
  backlogged: `backlog/pricing-a11y-coverage-gap_NOTE_12-07-26.md` pattern).

## Definition-of-Done Scoring (vs umbrella Program Goal Charter)

| # | Charter DoD criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Exactly ONE logo per route, mobile + desktop | ✅ MET (agent-probe visual = known-gap) | Logo-dedup grep = 3 intentional single-per-route renders; SSR-count proxy; Phase 1 fix intact |
| 2 | Zero non-allow-listed "21st" in apps/web + apps/backend + assets/metadata/config | ✅ MET | Per-line residue = 0; 7 files are functional KEEP survivors; backend CORS swapped Phase 2; favicon/OG text-readable clean |
| 3 | Cozy claymorphism token set (palette/radius/shadow/texture) in globals.css + tailwind, light + dark | ✅ MET | Phase 3 EVL-green (committed d4729dc) |
| 4 | Header/sidebar/footer/landing/pricing/component-card cushion-styled, both themes | ✅ MET (pixel = known-gap) | Phase 4 EVL-green (committed 90a99a0); Phase 5 long-tail consistency confirmed |
| 5 | build + tsc exit 0; vitest green, zero regressions | ✅ MET | build 0 / tsc 0 / vitest 10-10 = Phase 00 baseline |

**Net: all 5 DoD criteria MET at the source/automated tier.** The agent-probe visual tier
(pixel-perfect cushion rendering, favicon glyph pixels, authenticated E2E) is the sole outstanding
axis — a documented, charter-pre-authorized KNOWN-GAP, not a blocker. → **Program Net Gate:
CONDITIONAL (VERIFIED-pending-visual-probe).**

## Closeout Packet

- Selected plan: phase-05-long-tail-qa_PLAN_12-07-26.md
- Finished: all Step A-G checklist items; Phase Loop Progress Step 5 ticked.
- Verified: unscoped+scoped build 0, tsc 0, vitest 10/10; brand residue 0; logo-dedup = Phase-1-accepted 3; favicon/OG text-clean.
- Unverified: pixel-level cushion visual QA + favicon glyph pixels + authenticated E2E (agent-browser gap, accepted); publish/settings/admin a11y (backlogged).
- Cleanup remaining: EVL confirmation run (orchestrator-owned vc-tester re-runs the gate commands), then Phase 5 commit + UPDATE PROCESS + umbrella Program Net Gate → CONDITIONAL. Deploy is user-triggered (NOT this program).
- Classification: **Keep in active/testing** — code-complete + automated-green; awaits EVL confirmation before UPDATE PROCESS archival + program closeout.

## Forward Preview

### Test Infra Found
No new automated test added (thin UI-render coverage per program precedent). Content-line-aware
per-file brand-residue loop is the reusable proof pattern for "functional survivor vs residue."

### Blast Radius Changes
Final phase — no downstream phase. Only source change: contest/page.tsx link className (2 lines).

### Commands to Stay Green
`corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test`
Per-line residue: `for f in $(grep -ril "21st" apps/web/app apps/web/components apps/web/lib apps/backend apps/web/public); do grep -in "21st" "$f" | grep -v -e "@21st-dev/" -e "21st-vite" -e "21st-registry" -e "21st-dev/magic-mcp"; done` → empty.

### Dependency Changes
None. No new npm deps. No schema/auth/API/route changes. No deploy performed.

## Follow-up Stubs / CONTEXT_PARTIAL

- Follow-up plan stubs created: none.
- Non-blocking follow-up (noted, not filed): magic hero `text-neutral-800` cluster could be
  token-migrated in a future polish pass (deliberately left — long-tail, budget, pattern not one-off).
- `CONTEXT_PARTIAL`: none new (all-context.md apps/web staleness already flagged in umbrella charter).
