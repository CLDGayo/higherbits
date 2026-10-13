# Phase 01 D1 — Complete Unit Gate — 12-10-26

TL;DR: PASS. One complete web unit-suite run exited 0: 117 files, 928 tests passed. Non-fatal pre-existing configuration errors remain disclosed below.

## Scope and gate

Approved scope: D1 complete unit gate only, current shared checkout. Explicit full-command selection supersedes diff-aware mapping. No focused rerun, source/test/config edits, credentials, environment overrides, browser, server or provider probes. Concurrent C2 SVG/consumer work was left untouched. This report does not close Phase 01 or confirm its browser gates.

| Gate | Command | Status | Files | Tests | Failed | Skipped |
| --- | --- | --- | --- | --- | --- | --- |
| D1 complete unit suite | `corepack pnpm --filter web test` | PASS, exit 0 | 117 passed / 117 | 928 passed / 928 | 0 | 0 |

Runner observed: Vitest 4.1.10; package script: `vitest run`. Routed test documentation's older versions/counts are historical, not this run's results. Existing `vitest.setup.ts` and `__tests__/setup.ts` ran unchanged, including their default dotenv loading and mocks.

Neither `timeout` nor `gtimeout` was installed. Command ran under a controlled PTY, repeatedly polled against a 300-second wall limit. Completed naturally within approximately 60 seconds of launch; interruption was unnecessary. Vitest duration: **54.20 seconds**. Vitest start: **19:05:06**, raw-log completion: **2026-10-12 19:06:00 +0900**. Parallel component timings are cumulative, not command wall time.

## Evidence

Full, unfiltered stdout/stderr: `process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/evidence/unit-post-20261012-mv535rkz/command.log` (106 lines; 11,522 bytes). No log truncation or replacement. Shell completion separately returned `UNIT_GATE_EXIT=0`.

SHA-256: `855886012697c257feeea3cc5762070c3ffb1d1e768c31746787cb523a8705b7`.

Raw runner summary:

```text
 Test Files  117 passed (117)
      Tests  928 passed (928)
   Start at  19:05:06
   Duration  54.20s (transform 19.28s, setup 13.86s, import 116.47s, tests 93.52s, environment 174.21s)
```

The default redirected reporter emitted aggregate counts, not individual test names or per-file test counts. No individual case names/counts are invented. The file inventory below was cross-checked against the just-written Vitest 4.1.10 results cache and current files: exactly 117 present entries, none failed. Cache contains 176 historical entries in total; 59 absent-file entries were excluded, including the deleted `app/api/magic/__tests__/route.test.ts` historical failure. Those stale entries are not failures from this invocation.

## Existing errors and warnings

All below are non-fatal; command still exited 0. These originate in configuration/files already present before this invocation; no baseline checkout or rerun was used to establish their age or author.

- Two `TSConfckParseError` / `EXTENDS_RESOLVE` / `MODULE_NOT_FOUND` errors: cannot resolve `extends: @ui/tsconfig/react-library.json` (attempted module `@ui/tsconfig/react-library.json/tsconfig.json`) in:
  - `ops/phase-e-pinned/arikchakma/source/c4779bebc21262556fbd5a4ec3851526395bf829/packages/cromia/tsconfig.json`.
  - `ops/phase-e-pinned/arikchakma/source/c4779bebc21262556fbd5a4ec3851526395bf829/packages/unit-field/tsconfig.json`.
  Full stack traces remain in the raw log.
- pnpm warns that package-level `pnpm` and `resolutions` fields in `apps/web/package.json` do not take effect.
- Node emits `DEP0040`: deprecated `punycode` module.
- jsdom emits `Not implemented: navigation to another Document`.
- Requested compatibility reference `RTK.md` was absent; this did not block the approved gate.

No failing test names or failure stacks exist for this run. No unrelated fixes attempted.

## Performance and limits

Slowest cached file durations (supplementary cache evidence; no per-test timings were emitted):

- `apps/web/app/__tests__/landing-smoke.test.tsx`: 31.260 seconds, passed.
- `apps/web/lib/__tests__/auto-index-controls-export.test.ts`: 13.187 seconds, passed.
- `apps/web/components/features/main-page/__tests__/sidebar-layout.test.tsx`: 3.546 seconds, passed.
- `apps/web/lib/__tests__/auto-index-controls-runtime.test.ts`: 2.655 seconds, passed.
- `apps/web/components/features/libraries/__tests__/libraries-list.test.tsx`: 2.354 seconds, passed.

Line, branch and function coverage: **not measured**; the approved command does not request coverage. Build/typecheck/lint, repeatability/flakiness runs, memory profiling, browser/accessibility and live-provider checks: **not run**, outside this unit-only assignment. A single green run does not prove flake absence or certify concurrent later edits.

Risk-evidence artifacts were not updated: this assignment authorizes only the new tester report and unique raw-log evidence, not an EVL closeout or risk-gate decision. Protected/admin/browser verification and any required review/adversarial artifacts remain with the main workflow.

Recommendation: retain this result as D1 complete-unit evidence; triage configuration noise separately. Do not infer full Phase 01 verification from unit success.

## Exact passing file inventory

Each path is relative to repository root. All 117 present cache entries show `failed: false`; aggregate run confirms 117/117 files passed.

```text
apps/web/app/@modal/__tests__/intercepted-modal-guard.test.ts
apps/web/app/SessionRecorder.test.tsx
apps/web/app/__tests__/entrance-cascade.test.tsx
apps/web/app/__tests__/font-cozy-sweep.test.tsx
apps/web/app/__tests__/header-scroll-state-ssr.test.tsx
apps/web/app/__tests__/header-scroll-state.test.tsx
apps/web/app/__tests__/home-metadata.test.ts
apps/web/app/__tests__/landing-sidebar-toggle.test.tsx
apps/web/app/__tests__/landing-smoke.test.tsx
apps/web/app/__tests__/landing-ssr.test.tsx
apps/web/app/__tests__/motion-tokens.test.ts
apps/web/app/__tests__/orphan-route-comments.test.ts
apps/web/app/api/cron/gen-usage-embeddings/__tests__/route.test.ts
apps/web/app/api/cron/reap-sandboxes/__tests__/route.test.ts
apps/web/app/api/health/__tests__/health.test.ts
apps/web/app/api/higherbits-mcp/__tests__/route.test.ts
apps/web/app/api/lemonsqueezy/__tests__/webhook.test.ts
apps/web/app/api/magic/__tests__/legacy-routes.test.ts
apps/web/app/api/report/__tests__/route.test.ts
apps/web/app/api/sandbox/connect/__tests__/route.test.ts
apps/web/app/api/sandbox/hibernate/__tests__/route.test.ts
apps/web/app/api/sandbox/new/__tests__/route.test.ts
apps/web/app/api/sandbox/touch/__tests__/route.test.ts
apps/web/app/api/stripe/get-invoices/__tests__/no-lemon-pollution.test.ts
apps/web/app/api/stripe/webhook/__tests__/mutual-exclusion.test.ts
apps/web/app/api/studio/ascii/upload/__tests__/route.test.ts
apps/web/app/api/subscribe/__tests__/route.test.ts
apps/web/app/api/subscription/stripe-cron/__tests__/route.test.ts
apps/web/app/api/tags/counts/__tests__/route.test.ts
apps/web/app/c/[collection_slug]/__tests__/collection-visibility.test.ts
apps/web/app/magic-chat/__tests__/page.client.test.tsx
apps/web/app/providers.test.tsx
apps/web/app/public-dashboard/__tests__/page.client.test.tsx
apps/web/app/s/[tag_slug]/__tests__/page.test.tsx
apps/web/app/templates/__tests__/templates-redirect.test.ts
apps/web/components/analytics/__tests__/consent-banner.test.tsx
apps/web/components/analytics/__tests__/google-analytics-gate.test.tsx
apps/web/components/features/controls/__tests__/auto-index-controls.test.tsx
apps/web/components/features/higherbits-mcp/__tests__/higherbits-mcp-banner.test.tsx
apps/web/components/features/home/__tests__/catalogue-carousel-row.test.tsx
apps/web/components/features/home/__tests__/catalogue-chip-row.test.ts
apps/web/components/features/home/__tests__/home-sections.test.ts
apps/web/components/features/libraries/__tests__/libraries-list.test.tsx
apps/web/components/features/list-card/__tests__/card-hover-parallax.test.tsx
apps/web/components/features/list-card/__tests__/preview-crop.test.ts
apps/web/components/features/main-page/__tests__/sidebar-layout.test.tsx
apps/web/components/features/reports/__tests__/report-dialog.test.tsx
apps/web/components/features/settings/__tests__/settings-sidebar.test.tsx
apps/web/components/features/studio/__tests__/component-status.test.ts
apps/web/components/features/studio/__tests__/library-identity.test.ts
apps/web/components/features/studio/__tests__/nav-config.test.ts
apps/web/components/features/studio/__tests__/prisma-errors.test.ts
apps/web/components/features/studio/__tests__/studio-nav-counts.test.ts
apps/web/components/features/studio/__tests__/template-display.test.ts
apps/web/components/features/studio/__tests__/windowing.test.ts
apps/web/components/features/studio/artifacts/__tests__/artifact-slug.test.ts
apps/web/components/features/studio/artifacts/__tests__/ascii-payload.test.ts
apps/web/components/features/studio/artifacts/__tests__/ascii-render.test.ts
apps/web/components/features/studio/artifacts/__tests__/gradient-color.test.ts
apps/web/components/features/studio/artifacts/__tests__/gradient-form-props.test.ts
apps/web/components/features/studio/artifacts/__tests__/gradient-payload.test.ts
apps/web/components/features/studio/artifacts/__tests__/gradient-randomizers.test.ts
apps/web/components/features/studio/artifacts/__tests__/preview-renderers.test.tsx
apps/web/components/features/studio/artifacts/__tests__/shader-harness.test.ts
apps/web/components/features/studio/artifacts/__tests__/theme-preview.test.ts
apps/web/components/features/studio/publish/__tests__/batch-tags.test.ts
apps/web/components/features/studio/publish/__tests__/collect-form-errors.test.ts
apps/web/components/features/studio/publish/__tests__/publish-submission-gating.test.ts
apps/web/components/features/studio/publish/__tests__/publish-visibility-gating.test.ts
apps/web/components/features/studio/sandbox/hooks/__tests__/use-sandbox.test.ts
apps/web/components/ui/__tests__/accent-word.test.tsx
apps/web/components/ui/__tests__/clay-card.test.tsx
apps/web/components/ui/__tests__/clay-charts.test.tsx
apps/web/components/ui/__tests__/clay-input.test.tsx
apps/web/components/ui/__tests__/clay-pill-button.test.tsx
apps/web/components/ui/__tests__/copy-prompt-section.test.tsx
apps/web/components/ui/__tests__/error-boundary.test.tsx
apps/web/components/ui/__tests__/faq-section.interaction.test.tsx
apps/web/components/ui/__tests__/faq-section.test.tsx
apps/web/components/ui/__tests__/footer-marketing-consent.test.tsx
apps/web/components/ui/__tests__/footer-smoke.test.tsx
apps/web/components/ui/__tests__/header-smoke.test.tsx
apps/web/components/ui/__tests__/hero-section.test.tsx
apps/web/components/ui/__tests__/landing-interactive-elements.test.tsx
apps/web/components/ui/__tests__/landing-section.test.tsx
apps/web/components/ui/__tests__/navigation-progress.test.tsx
apps/web/components/ui/__tests__/newsletter-dialog.test.tsx
apps/web/hooks/__tests__/use-analytics.test.ts
apps/web/hooks/__tests__/use-auto-index-controls.test.tsx
apps/web/hooks/__tests__/use-sidebar-visibility.test.tsx
apps/web/lib/__tests__/auto-index-controls-export-api.test.ts
apps/web/lib/__tests__/auto-index-controls-export.test.ts
apps/web/lib/__tests__/auto-index-controls-runtime.test.ts
apps/web/lib/__tests__/billing-provider-guard.test.ts
apps/web/lib/__tests__/controls-parser.test.ts
apps/web/lib/__tests__/controls-transform.test.ts
apps/web/lib/__tests__/indexeddb-drafts.test.ts
apps/web/lib/__tests__/queries.demo-fallback.test.ts
apps/web/lib/__tests__/r2-ownership.test.ts
apps/web/lib/__tests__/r2-read.test.ts
apps/web/lib/__tests__/r2.test.ts
apps/web/lib/__tests__/rate-limit.test.ts
apps/web/lib/__tests__/upload-security.test.ts
apps/web/lib/amplitude.test.ts
apps/web/lib/api/__tests__/artifacts-actions.test.ts
apps/web/lib/api/server/__tests__/artifacts.test.ts
apps/web/lib/api/server/__tests__/b2-prop-gating.test.ts
apps/web/lib/api/server/__tests__/bulk-library-and-delete.test.ts
apps/web/lib/api/server/__tests__/component-access-invariant.test.ts
apps/web/lib/api/server/__tests__/move-component-to-library.test.ts
apps/web/lib/attribution-tracking.test.ts
apps/web/lib/consent.test.ts
apps/web/lib/posthog.test.ts
apps/web/lib/registry.test.ts
apps/web/lib/seo/__tests__/faq.test.ts
apps/web/lib/submission-visibility.test.ts
apps/web/lib/user-select.test.ts
```

Unresolved questions: none for the approved unit-only gate.

**Status:** DONE
**Summary:** Complete web unit gate passed: 117 files and 928 tests; raw log retained.
**Concerns/Blockers:** Non-fatal existing configuration errors and warnings disclosed; broader Phase 01 proof remains outside scope.

Skipped: coverage, build, browser/provider checks and reruns, per approved scope.
Risk: shared-checkout evidence reflects this run only; non-fatal configuration noise remains.
