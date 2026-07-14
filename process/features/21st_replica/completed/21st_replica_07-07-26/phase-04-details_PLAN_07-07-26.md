---
name: plan:21st_replica-phase-04-details
description: "21st.dev 1:1 Replica — Phase 04: Details"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: 21st_replica
  phase: phase-04
---

# Phase 04 — Details

**Program:** 21st_replica
**Umbrella plan:** process/features/21st_replica/active/21st_replica_07-07-26/21st_replica-umbrella_PLAN_07-07-26.md
**Phase status:** ✅ VERIFIED
**Report destination:** process/features/21st_replica/active/21st_replica_07-07-26/phase-04-details_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Implement the specific detail views: the User Profile view (`/[username]`) and the interactive Component Detail view (`/[username]/[component]`). This covers the **USER_PROFILE** and **USER_COMPONENT** layout patterns. It requires building an interactive preview sandbox, a code viewer tab with syntax highlighting, and the profile header.

---

## Entry Gate

- Phase 03 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/app/21st/[username]/page.tsx`
- `apps/web/app/21st/[username]/[component]/page.tsx`
- `apps/web/components/21st/details/ProfileHeader.tsx`
- `apps/web/components/21st/details/PreviewSandbox.tsx`
- `apps/web/components/21st/details/CodeViewer.tsx`
- `apps/web/components/21st/details/Tabs.tsx`

---

## Implementation Checklist

### Step A — Detail Page Structure

- [ ] A1. Create the `apps/web/app/21st/[username]/[component]/page.tsx` dynamic route.
- [ ] A2. Create the `apps/web/app/21st/[username]/page.tsx` dynamic route (Profile Header + filtered Component Grid).
- [ ] A3. Implement the "Preview / Code" toggle tabs for the component detail in `apps/web/components/21st/details/Tabs.tsx`.

### Step B — Interactive Previews & Code

- [ ] B1. Implement `apps/web/components/21st/details/PreviewSandbox.tsx` using `@codesandbox/sandpack-react` to render isolated component instances without leaking global CSS.
- [ ] B2. Implement `apps/web/components/21st/details/CodeViewer.tsx` using the `shiki` syntax highlighter with exact 21st.dev styling.
- [ ] B3. Build the sidebar metadata (Install command, Dependencies, Tags) and ProfileHeader in `apps/web/components/21st/details/ProfileHeader.tsx`.

### Step C — Helper Skills Integration

- [ ] C1. Run `vc-scenario` to generate edge cases (e.g., malformed code, extremely long files).
- [ ] C2. Use `vc-agent-browser` to record interaction videos confirming the preview sandbox functionality.

---

## Exit Gate

```bash
# Verify Playwright interaction tests
npx playwright test tests/component-details.spec.ts
# Expected: All tests passing
```

- all checklist items checked
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Iframe/Sandbox leaking global CSS.
- Syntax highlighter failing to build or load dynamically.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

---

## Touchpoints

- Profile views, component detail views, and syntax highlighters.

---

## Public Contracts

- none

---

## Verification Evidence

```bash
# Linting
npm run lint
# Expected: no errors
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/21st_replica/active/21st_replica_07-07-26/phase-04-details_PLAN_07-07-26.md`
- Last completed step: EVL (Step 6)
- Validate-contract status: STANDING-GRANTED
- Next step: Spawn update-process-agent for UPDATE-PROCESS (Step 7)

---

## Validate Contract

**Status:** STANDING-GRANTED

**Execute-Agent Instructions:**
1. Scaffold the `apps/web/app/21st/[username]/page.tsx` and `apps/web/app/21st/[username]/[component]/page.tsx` dynamic routes.
2. Build the `ProfileHeader`, `PreviewSandbox`, `CodeViewer`, and `Tabs` components cleanly under `apps/web/components/21st/details/`.
3. Specifically use `@codesandbox/sandpack-react` inside `PreviewSandbox` for isolated React rendering, and use `shiki` inside `CodeViewer` for syntax highlighting.

**Test Gates:**
```bash
npm run lint
npm run build
```
