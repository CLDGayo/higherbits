# Phase 01 Report: Install Component Fix

**Date:** 26-07-26
**Program:** registry-enhancements
**Phase:** 01 — Install Component Fix

## Summary of Changes
- Added a `.catch()` block to the `auth.getToken()` call within the `useInstallUrl` hook in `apps/web/components/features/component-page/component-preview.tsx`.
- The URL generation will now correctly fallback to a version without the API key if the Clerk authentication token fetch times out, preventing the "Install component" button from loading indefinitely.

## Explaining Package Managers
As requested by the user, here is an explanation of the package managers seen in the install component dropdown:

- **npm**: The default package manager for Node.js. It installs dependencies from the npm registry.
- **yarn**: An alternative to npm developed by Facebook, often preferred for its speed and deterministic lockfiles.
- **pnpm**: "Performant npm". It uses hard links to save disk space and speed up installations across multiple projects.
- **bun**: A newer, extremely fast all-in-one runtime and package manager designed as a drop-in replacement for Node.js/npm.

## Verification
- Verified that `component-preview.tsx` syntax is correct and builds properly. 
- Validation gate passed successfully.

## Next Steps
- Proceeding to Phase 2: Copy AI Prompt Upgrade.
