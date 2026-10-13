[MODE: VALIDATE]

Section: Layer 2 — Implementation Checklist Step E
Status: **CONCERN**

**Mechanical feasibility:** Feasible with one runner safeguard added.

- E1’s commands fit the existing infrastructure: `apps/web/package.json` defines `test` as `vitest run`; `apps/web/vitest.config.ts:19–21` identifies the setup array and exclusions that the scoped config must preserve. Replacing the dotenv-loading setup is justified by `apps/web/vitest.setup.ts:1–2`.
- The public matrix produces exactly ten audits (`apps/web/e2e/a11y.spec.ts:73–80`). Protected specs supply two identity cases, eight captures and four Axe audits (`higherbits-mcp-route-identity.spec.ts:3–18`, `higherbits-mcp-visual-evidence.spec.ts:3–34`, `higherbits-mcp-a11y.spec.ts:4–48`, all under `apps/web/e2e/`).
- E3’s joint proof is mechanically credible: the production hook already accepts its browser recorder at `apps/web/hooks/use-analytics.ts:20–23`; the installed in-memory bundling pattern exists at `apps/web/e2e/fixtures/auto-index-controls/server.mjs:9–18`. Explicitly new helper/config/spec files are expected work, not blockers.

**Gaps found:**

1. **High — readiness checks do not enforce “never start Next.”** The plan requires reusing an existing verified server and blocking unavailable runtime (`phase-02-first-party-identifiers_PLAN_12-10-26.md:248`). However, `apps/web/playwright.config.ts:192–196` retains a Next startup command and sets `reuseExistingServer: !process.env.CI`. With `CI` set, or if the server disappears between readiness checking and runner startup, these commands can attempt an unauthorized server start. Checking readiness beforehand does not remove that capability.

   **Required plan correction:** authorize a bounded regression configuration that inherits the existing projects, evidence paths and global setup but disables `webServer`. Update the allowlist/file count and exact PUBLIC-02/PROTECTED-02 commands. Missing runtime must fail or remain BLOCKED without spawning Next.

2. **Evidence handling instruction:** archive each command’s JSON reporter output immediately. Project artifacts have unique task paths, but the reporter still writes a shared `test-results/results.json` (`apps/web/playwright.config.ts:109–114`). PUBLIC-02 and PROTECTED-02 must retain separate reporter files before the next invocation overwrites that location. The plan’s preservation requirement at `:234` is sound; make this concrete in execution instructions.

**Conflicts found:**

- The no-start boundary versus shared Playwright `webServer` behavior is the substantive conflict above.
- No conflict with the authoritative Phase 01 checkpoint: `session-phase01-final-evl_REPORT_13-10-26.md:22` accepts ten current public audits, four genuine protected deltas and final affected MCP comparisons; `session-phase01-update-process_REPORT_13-10-26.md:18` establishes local VERIFIED status.
- Phase 02 retains those exact scopes and historical limits at plan `:250`. It correctly distinguishes synthetic migration proof from genuine protected authorization at `:177–181` and `:266–285`. New results must retain matching route/theme/viewport, raw violations and affected targets; historical public evidence must not be fabricated.
- The existing visual spec’s “full-page” naming does not establish full-height nested content coverage. The plan explicitly preserves that accepted limitation (`:250`).

**Highest-risk edit + mitigation:** E2’s regression execution can cross the secret-file/runtime boundary through automatic Next startup. Disable startup in the runner before executing either regression command, then verify checkout identity, bounded readiness and the existing authorized state path without inspecting its contents.

Applied `vc-scenario` to CI-enabled execution, server disappearance after readiness, unavailable/expired protected state, and reporter overwrite. Applied `vc-predict` across architecture, security, performance, UX and assumption checking: **CAUTION**; all favor retaining genuine protected proof while enforcing external-server-only execution. No nested agents used.

Skipped product/browser tests, secrets, auth-state contents and mutations as requested. Runtime availability and future test outcomes remain unverified; this verdict concerns planned feasibility and proof adequacy.
