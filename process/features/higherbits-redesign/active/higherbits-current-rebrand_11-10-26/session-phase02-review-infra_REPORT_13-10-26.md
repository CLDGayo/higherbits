[MODE: VALIDATE]

Dimension: Infra/setup fit
Status: **CONCERN**
Confidence: **HIGH**

Findings:

- **PASS — Installed bundler resolution is feasible.** Read-only package resolution confirmed Vitest **4.1.10**, its Vite **6.3.5**, esbuild **0.28.1**, React/ReactDOM **19.1.0**, and Playwright **1.62.1**. The existing fixture resolves esbuild through Vitest→Vite, aliases React and `@`, and bundles in memory with synthetic production environment definitions (`apps/web/e2e/fixtures/auto-index-controls/server.mjs:8`). No dependency addition is needed.

- **PASS — Secret-free Vitest configuration fits the installed setup.** Existing configuration loads dotenv through `vitest.setup.ts` (`apps/web/vitest.config.ts:19`; `apps/web/vitest.setup.ts:2`). The plan explicitly replaces that setup array, retains safe mocks and discovery, and sets `envDir:false` (Phase02 plan:71,246). Installed Vite accepts `envDir?: string | false`. Implement replacement directly; Vite’s generic configuration merge concatenates arrays, so merging the replacement setup array would retain the prohibited setup.

- **PASS — Paths and ownership are bounded.** The plan distinguishes 17 writable source/test/template paths from read-only shared configuration, fixtures and KEEP consumers (plan:61–89). Current scoped status identifies onboarding/console clients and subscribe tests as pre-existing untracked work, consistent with the persisted research. Preserve their bytes and apply additive changes. Missing explicitly planned helper, tests and fixture/config files are creation targets, not blockers.

- **PASS — Port assignments are distinct.** Planned fixture port **3206** differs from existing controls fixture **3205**; regression port **3101** preserves the other checkout’s **3100** (plan:248,270; `apps/web/e2e/auto-index-controls.config.ts:19`). This establishes configuration separation, not current port availability.

- **CONCERN C1 — Regression commands do not mechanically enforce “never start Next.”** Plan:248 requires an existing server and prohibits starting Next. Shared configuration nevertheless launches `next dev` when unavailable; `CI` also disables server reuse (`apps/web/playwright.config.ts:192–196`). A readiness check cannot prevent the server disappearing before Playwright’s own check. **Mitigation:** specify a fail-closed invocation that prevents the webServer startup branch without editing shared configuration. Explicitly normalize `CI`; if startup suppression requires another owned config/path, return that scope addition to PLAN/PVL. Otherwise retain the affected regression gate as BLOCKED.

- **CONCERN C2 — Unique evidence IDs do not isolate the JSON reporter.** Test attachments use unique run/stage/command directories, but reporter output remains `test-results/results.json` for both regression commands (`apps/web/playwright.config.ts:109–139`). Plan:234 requires preserved JSON and no overwritten evidence. **Mitigation:** persist each command’s reporter JSON into its unique evidence directory immediately after completion, before another command; preserve any prior reporter file before the first invocation.

Mechanical feasibility: **Feasible**, with the two execution-contract corrections above. The existing analytics recorder is selected before provider construction (`apps/web/hooks/use-analytics.ts:17–29`); actual consent code is browser-local (`apps/web/lib/consent.ts:28–61`).

Gaps found: Explicit no-start enforcement and reporter preservation sequencing.

Conflicts found: C1 contradicts the runtime boundary; C2 leaves evidence preservation underspecified. No fixture/dependency/path-ownership conflict found.

Highest-risk edit + mitigation: The regression launch path could start a secret-loading Next process. Make startup impossible before invoking PUBLIC-02/PROTECTED-02; retain correct-checkout identity checks and existing authorized-state prerequisites.

`vc-scenario` assessment: Server disappearance before launch, `CI` disabling reuse, and sequential commands overwriting reporter JSON are concrete failure cases. `vc-predict` assessment: **CAUTION**—architecture favors shared-config preservation; security favors startup prevention; performance flags unintended compilation; UX favors explicit BLOCKED prerequisites; devil’s advocate rejects readiness as a startup guarantee. These align on the mitigations above.

Phase01’s authoritative checkpoint is satisfied: final EVL PASS and completed interphase UP establish local VERIFIED status (`session-phase01-final-evl_REPORT_13-10-26.md:14`; `session-phase01-update-process_REPORT_13-10-26.md:18`).

Skipped edits, product/browser tests, live-port probes, secrets and auth-state contents; no nested agents. Runtime availability and future test outcomes remain unverified.
