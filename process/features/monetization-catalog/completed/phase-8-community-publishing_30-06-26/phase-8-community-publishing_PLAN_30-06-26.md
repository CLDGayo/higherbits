---
name: phase-8-community-publishing_PLAN
description: "Execution plan for Phase 8 Community Author Publishing (GitOps approach)"
date: 30-06-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: 8
---

# Phase 8: Community Author Publishing PLAN

## Scope and Blast Radius
- `apps/web/app/(catalog)`: New routes `/submit` and `/author/[username]`
- `apps/web/app/actions/submit-component.ts`: Action for API logic.
- `apps/web/components/submit-form.tsx`: UI for submission.

## Architecture & Approach
We are using **Approach 1 (GitOps)**:
1. Users submit via a Next.js form.
2. Server Action validates fields and formats as Qdrant-optimized markdown with YAML frontmatter.
3. If `process.env.GITHUB_TOKEN` is present, it uses `@octokit/rest` to create a branch, write the file to `docs/evidence-manifest/registry/`, and open a Pull Request.
4. If the token is absent (e.g. local dev), it mocks the API call and logs the payload.

## Verification Gates
- **Level 1**: Action unit test mocks GitHub API and verifies correct markdown formatting.
- **Level 2**: The manual build runs cleanly without bundle bloat regression.

## Phase Ordering
1. Create Server Action (stubbed).
2. Create Submit Form and route.
3. Wire Action to real/mocked GitHub API.
4. Create Author Profile Route.
5. Add unit tests for Action.

## Phase Loop Progress
- [x] Step 1 (RESEARCH)
- [x] Step 2 (INNOVATE)
- [x] Step 3 (PLAN-SUPPLEMENT)
- [x] Step 4 (PVL)
- [ ] Step 5 (EXECUTE)
- [ ] Step 6 (EVL)
- [ ] Step 7 (UPDATE PROCESS)

## Validate Contract
**Status:** PASS
**Generated-by:** inner-pvl: phase-8

### 1. Structural Checks
- Blast radius mapped? Yes (UI, routes, and Server Actions).
- Dependencies verified? Yes (Requires adding `@octokit/rest`).
- Scope constrained? Yes (Confined to `/submit` and `/author/[username]`).

### 2. Required Test Gates (To be run by EVL/Tester)
1. `corepack pnpm --filter web build` (Must exit 0)
2. `corepack pnpm --filter web test` (Must pass the new Server Action unit test mocking Octokit)
3. **Agent-Probe:** Action Mock Check - Verify `apps/web/app/actions/submit-component.ts` successfully falls back to mocking when `process.env.GITHUB_TOKEN` is unset.

### 3. Execution Handoff
Execute agent is clear to proceed with `apps/web/app/actions/submit-component.ts`, `apps/web/components/submit-form.tsx`, `apps/web/app/(catalog)/submit/page.tsx`, and `apps/web/app/(catalog)/author/[username]/page.tsx`.
