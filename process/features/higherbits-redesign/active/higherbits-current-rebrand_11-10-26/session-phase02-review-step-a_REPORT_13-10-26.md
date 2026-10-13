[MODE: VALIDATE]

Section: Layer 2 — Implementation Checklist Step A: Entry and compatibility inventory
Status: **PASS**

**Mechanical feasibility:** A1–A4 are executable as planned.

- Ownership checks match current state: both MCP clients and the subscribe suite are untracked. The plan requires original-byte/owned-hunk capture and additive changes, with an explicit stop on preservation conflicts (`phase-02-first-party-identifiers_PLAN_12-10-26.md:54,85,128`). Persisted research confirms those targets are owner-confirmed rebrand work (`session-phase02-research_REPORT_13-10-26.md:5`).
- The inventory targets match real source: analytics key at `apps/web/hooks/use-analytics.ts:6`; onboarding key at `apps/web/app/higherbits-mcp/onboarding/page.client.tsx:46`; console key at `apps/web/app/higherbits-mcp/console/page.client.tsx:46`; waitlist names and configuration guard at `apps/web/app/api/subscribe/route.ts:5,7,20`.
- A4 has a concrete inheritance target. Current Vitest configuration contains plugins/aliases, two setup files and existing exclusions (`apps/web/vitest.config.ts:7–21`). The excluded setup explicitly loads `.env.local` (`apps/web/vitest.setup.ts:1–2`); the retained setup supplies existing mocks (`apps/web/__tests__/setup.ts:3,48`). Replacing `setupFiles` and setting `envDir: false` is mechanically feasible without changing discovery. The explicitly NEW scoped config’s absence is expected.
- A3 is supported by the authoritative checkpoint: independent final EVL passes the revised local acceptance (`session-phase01-final-evl_REPORT_13-10-26.md:14,22`), and interphase UPDATE PROCESS records Phase 01 VERIFIED (`session-phase01-update-process_REPORT_13-10-26.md:18,39–49`).

**Gaps found:** None requiring a Step A amendment. Adjacent privacy disclosure, both persistence consumers, subscribe tests and the empty-value root template are explicitly included (`phase-02-first-party-identifiers_PLAN_12-10-26.md:59–69`). The inventory also preserves separate storage/auth authority, URL/OS precedence, import-time audience selection and all-three-audience validation (`:73–78`). Deployment files and additional consumers require scope review rather than assumed authorization (`:84`).

**Conflicts found:** None within this section. Persisted R/I/supplement consistently require the same bounded compatibility contracts and fresh PVL before implementation (`session-phase02-innovate_REPORT_13-10-26.md:7–15`; `session-phase02-plan-supplement_REPORT_13-10-26.md:23–29,37`). The historical Phase 01 package result is carried provenance, not the new secret-free baseline; the plan explicitly requires fresh, same-config focused/full results and disclosure of differences (`phase-02-first-party-identifiers_PLAN_12-10-26.md:131,240–246`). Missing RTK.md is already disclosed in the supplement (`session-phase02-plan-supplement_REPORT_13-10-26.md:21`).

**Highest-risk edit + mitigation:** Creating the scoped Vitest config incorrectly could retain dotenv loading or narrow discovery, making the baseline unsafe or misleading. **Replace** the setup list rather than concatenate it; retain inherited aliases/plugins/exclusions and default discovery; set `envDir: false`; inspect the resulting configuration before invoking either baseline. Capture exact commands, discovered suites, raw outcomes and source digests before production edits (`phase-02-first-party-identifiers_PLAN_12-10-26.md:67,131,234,246`). Preserve original bytes of untracked targets first. The existing broad fetch mock is not a strict deny assertion, so retain the planned stricter per-file provider/network guards (`apps/web/__tests__/setup.ts:48–63`; plan `:276`).

Skipped: file edits, product/browser tests, secrets/auth-state inspection and nested agents.
Risk: PASS establishes Step A feasibility and planned-proof adequacy; future baseline and runtime results remain unproven.
