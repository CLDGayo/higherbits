# Home discovery — VALIDATE V4 review menu

Date: 2026-10-13
Selected plan: `home-discovery-adaptation_PLAN_13-10-26.md`
Status: **CONDITIONAL accepted; Validate Contract written to the selected plan after V5.** This report preserves the V4 findings. The user explicitly entered EXECUTE for this Home plan, invoked Autopilot after the nine concerns were disclosed, and confirmed one sequential implementation stream with local-only hard stops.

The plan is structurally valid (`validate-plan-artifact.mjs`: 0 failures, 0 warnings) and its application targets exist or are explicitly new files. The proposed UI is feasible. The public-count and browser proof must be made executable before their acceptance criteria can be called verified.

## Dimension and section findings

| Review | Verdict | Evidence and required correction |
| --- | --- | --- |
| Infra/setup fit | CONCERN | Clean worktree has no `node_modules` or local web env; `psql` and Docker are absent. Existing PGlite dependency is available in the lockfile, but there is no public-count fixture runner. Name a disposable SQL runner and its setup, or keep count verification conditional. |
| Test coverage | CONCERN | `apps/web/package.json` defines `typecheck`, not `type-check`. Playwright defaults to port 3100 and reuses an existing server, which can test the dirty original checkout. `a11y.spec.ts` does not audit the Home tab and requires stage metadata/route identity. |
| Breaking changes | CONCERN | The counts endpoint keeps its JSON shape but changes semantics to public demo counts, affecting the sidebar. Use `count(DISTINCT d.id)` per tag to match the browse RPC's `EXISTS` filter. Add sidebar error/no-count regression. Cached counts can lag newly approved/delisted content for up to the existing cache window. |
| Security surface | CONCERN | Current service-role raw tag joins can disclose private/unapproved counts. New RPC must use both public-profile joins, public component predicate, and current auto-index approval, with schema-qualified objects, restrictive search path, `service_role`-only EXECUTE, and privilege assertions. |
| Section 1: public count | CONCERN | SQL is feasible; proposed two `psql` commands cannot run on this host and do not bootstrap the required schema, roles, profiles, and approval helper. An isolated PGlite fixture can prove aggregate/filter/grant logic with a deterministic approval stub, paired with the existing 20261008 helper verification; it cannot prove hosted Supabase integration. |
| Section 2: Home composition | CONCERN | Collection/template shapes and existing Home hooks are usable. `LIBRARIES_DATA` is labeled an auto-generated 21st.dev-matching catalog with external icons and unverified descriptions; do not copy those assets or claims into Home. A category subset filtered to positive counts would also exclude all relevant zero-content Coming soon entries. |
| Section 3: interaction/QA | CONCERN | Browser tests need an isolated worktree server and response-controlled error/empty scenarios. Preserve the existing settled-card wait. Use a Home-specific light/dark axe baseline/diff gate because the generic tab surface has known contrast findings. |

No architectural FAIL was found. The category-count security correction is necessary, but validation cannot label AC3 green on a function definition or API mock alone.

## Proposed plan updates at V5

1. Replace `corepack pnpm --filter web type-check` with `corepack pnpm --filter web typecheck`.
2. Run isolated Playwright with `PLAYWRIGHT_PORT=3201 PLAYWRIGHT_BASE_URL=http://localhost:3201`, and assert the server process/worktree identity before accepting screenshots or results. Keep `HIGHERBITS_E2E_STAGE=baseline|post` where the existing a11y harness requires it.
3. Specify one runnable SQL gate. Preferred local route: add a focused PGlite runner using the existing root dependency, minimal fixture schema/roles, a deterministic approval-helper stub, and assertions on DISTINCT counts, private/approved data, and grants. Pair it with the tracked 20261008 approval-helper verification. If no runnable equivalent is available, mark AC3 and numerical category rendering unverified and do not show a fabricated count. Do not apply the migration to production in this task.
4. Require `COUNT(DISTINCT d.id)` per slug, `SET search_path = pg_catalog, pg_temp`, schema qualification, `REVOKE` from `PUBLIC`, `anon`, `authenticated`, and `GRANT EXECUTE` to `service_role` only. Test these privileges.
5. Define AC3 as parity for a **fresh** count response; document existing five-minute cache lag. Add sidebar error/no-count regression after propagating `useCategoryTagCounts` errors.
6. Give new RTL client render tests `// @vitest-environment jsdom`. Force Home requests into loading, empty, and error states in tests; assert the response-driven UI rather than the absence of a spinner.
7. Use a Home-specific axe test/baseline and compare new violations; do not simply add `/?tab=home` to current `a11y.spec.ts` without route identity, URL, and baseline changes. Browser/DB-dependent acceptance gates are **Hybrid**, despite the SPEC's aspirational Fully-Automated labels.
8. Include a small intentional set of relevant disabled Coming soon categories regardless of positive counts. Render real category counts only from successful responses.
9. Replace the proposed first-three `LIBRARIES_DATA` cards with a factual text/local-asset Browse libraries entry unless names, descriptions, logos, and destinations are independently verified as HigherBits content. Do not show the derived 21st.dev icons, popularity, or install claims. Keep template Home cards browse-only.

## Strategy and test gates

Seven-signal score: **3/7** (API/schema surface, high-risk trust boundary, at least five files). Validation fit: **parallel subagents** for four independent dimensions plus three section reviews, followed by synthesis. Agent count: sequential 1; parallel 4 + 3 + up to 3 optional = 7–10; coordinated team up to 6 × 3 = 18; workflow steps × agents × iterations is unnecessary for this bounded review. No cost guard applies. Execution fit after approval: one **sequential** stream, because the count contract precedes honest Home numbers and browser proof.

| Area | Tier and exact proposed gate | What remains outside the gate |
| --- | --- | --- |
| Web count/Home/sidebar logic | Fully-Automated: scoped Vitest command in plan, plus jsdom client tests | Real DB privileges and deployed data |
| Web type/lint | Fully-Automated: `corepack pnpm --filter web typecheck`; `corepack pnpm --filter web lint` | Browser behavior and visual quality |
| SQL aggregate/security | Hybrid: focused disposable PGlite runner or equivalent real disposable Postgres fixture, then privilege assertions | Hosted Supabase configuration and live migration state |
| Home flows, routing, responsive states | Hybrid: Playwright on verified isolated port 3201 with reachable dev services, explicit settled/error/empty scenarios | Production deployment and authenticated features |
| Home a11y/visual fidelity | Hybrid axe baseline/diff; Agent-Probe six desktop/tablet/phone theme screenshots | Pixel-perfect parity with uninspected 21st.dev hover/lazy rails |

Known residual: the local fixture will not prove production Supabase has the new function; deployment is outside scope, so local Home must display error/no number until a corresponding non-production test DB runs the new RPC. Do not silently convert this residual into a PASS.

## V5 disposition

The nine corrections above were applied to the plan, and its `## Validate Contract` records the CONDITIONAL gate and hosted-database residual. No application edits, migration application, or deployment occurred during VALIDATE. The user's separate `ENTER EXECUTE MODE` checkpoint has been satisfied for this Home plan; local EXECUTE can follow this written contract.
