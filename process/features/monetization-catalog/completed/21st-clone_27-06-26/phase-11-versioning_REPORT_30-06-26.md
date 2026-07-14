# Tester Report: Phase 11 Versioning (EVL Confirmation Run)
Date: 30-06-26

**Test Results Overview**: 
- `scripts/validate-registry.mjs`: all 69 registry file(s) passed.
- `apps/web`: 9 test files passed, 40 tests passed.

**Gate Status Table (Validate Contract EVL Run)**:

| criterion id | behavior | strategy | proving test | status |
|---|---|---|---|---|
| AC-1 | Registry schema validation allows `changelog` | Fully-Automated | `node scripts/validate-registry.mjs` | PASS |
| AC-2 | `github-ingest.mjs` successfully creates history files | Fully-Automated | `corepack pnpm --filter web test` | PASS |
| AC-3 | UI Component Detail Page shows version switcher | Agent-Probe | Navigate to `/catalog/...` and confirm switcher renders | AGENT-PROBE MANUAL (Not verified programmatically) |

**Risk Evidence**: 
`verification.json` written to `harness/verification.json`. Risk gate is low/medium, manual UI check still required by user.
