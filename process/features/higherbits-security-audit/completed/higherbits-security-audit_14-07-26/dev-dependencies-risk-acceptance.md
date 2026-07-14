# DevDependencies Risk Acceptance

**Date:** 14-07-26
**Program:** higherbits-security-audit
**Phase:** 03

## Purpose
This document formally accepts the risk for remaining Medium, Low, and non-production High severity vulnerabilities surfaced by `pnpm audit` that are strictly confined to `devDependencies`.

## Vulnerability Details
The following categories of vulnerabilities were identified during Phase 3 but are excluded from active remediation via overrides:
- **Build Tools / CLI Tools:** Vulnerabilities in transitive dependencies of testing and build tools (e.g., `vitest`, `@turbo/gen`, `eslint`, `tailwindcss`) including packages like `basic-ftp`, `handlebars`, `glob`, `minimatch`, and `tar`.
- **Reasoning:** These packages are executed exclusively during local development, CI/CD builds, or testing phases. They are not bundled into the production artifacts shipped to the browser or Node.js runtime environments. 
- **Risk Assessment:** The risk of exploitation is theoretically constrained to the build pipeline and requires local attacker access or compromised code pushes. The impact to the end-user or live production data is zero.

## Decision
We **Accept the Risk** for these vulnerabilities. Attempting to force overrides on deep sub-dependencies of complex toolchains (like Vite, ESLint, or Turbo) typically results in broken local builds and degraded developer experience without any tangible improvement to production security.

## Mitigation
- We will continue to upgrade root `devDependencies` (like `vite`, `turbo`, `typescript`, `eslint`) to their latest major/minor versions during regular maintenance windows, which will naturally resolve these transitive dependency issues over time.
