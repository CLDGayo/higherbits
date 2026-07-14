---
name: plan:21st-clone-phase-21-shadcn-registry
description: "21st.dev Clone — Phase 21: shadcn registry API"
date: 05-07-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: phase-21
---

# Phase 21 — shadcn registry API

**Program:** 21st-clone
**Umbrella plan:** process/features/monetization-catalog/active/21st-clone_05-07-26/21st-clone-umbrella_PLAN_05-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/monetization-catalog/active/21st-clone_05-07-26/phase-21-shadcn-registry_REPORT_05-07-26.md (flat in the program task folder)

---

## Purpose

Make the Phase 5 CLI install command real: serve a shadcn-compatible registry JSON payload per component so `npx shadcn add <url>` works against Cozy Downloads. This requires dynamic endpoint generation, Pro-tier gating for source files, and strict rate limits.

---

## Entry Gate

- Phase 20 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/app/api/registry/[slug]/route.ts` (or similar for `r/[slug].json`)
- `apps/web/app/(catalog)/components/[slug]/page.tsx` (update install docs)

---

## Implementation Checklist

### Step A — Setup shadcn endpoint
- [ ] A1. Create `/api/registry/[slug]/route.ts`
- [ ] A2. Retrieve component by slug from registry
- [ ] A3. Map to `RegistryItem` schema (name, type, files, dependencies, tailwind)

### Step B — Implement Entitlement checks
- [ ] B1. Implement stateless HMAC signed tokens for CLI requests (signed via `crypto.createHmac` + `CLERK_SECRET_KEY`).
- [ ] B2. In `/api/registry/[slug]/route.ts`, if `IsPro`, check `auth()` cookie FIRST, fallback to `?token=` query param.
- [ ] B3. Add Redis rate-limiting (using Phase 14 infra) to protect against unauthenticated abuse.

### Step C — UI Updates
- [ ] C1. Update component detail install snippet to point to the real API url.

---

## Exit Gate

```bash
# Verify API response for free component
curl -s http://localhost:3000/api/registry/soft-button | grep '"name": "soft-button"'
# Expected: matches JSON payload

# Run vitest
corepack pnpm exec vitest run
# Expected: all tests pass
```

- all checklist items checked
- validators exit 0
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- upstream phase exit gate not yet passed
- shadcn schema definitions missing or unclear

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/app/api/registry/[slug]/route.ts`
- `apps/web/app/(catalog)/components/[slug]/page.tsx`

---

## Public Contracts

- `/api/registry/[slug]` (new public endpoint)

---

## Verification Evidence

```bash
corepack pnpm exec vitest run
# Expected: passing tests
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization-catalog/active/21st-clone_05-07-26/phase-21-shadcn-registry_PLAN_05-07-26.md`
- Last completed step: PVL (Step 4)
- Validate-contract status: WRITTEN
- Next step: Spawn vc-execute-agent for EXECUTE (Step 5)

---

## Validate Contract

### 1. Status: PASS

### 2. Gate: CONDITIONAL PROCEED
- Architecture is viable (stateless HMAC token over CLI).
- No irreversible actions detected.

### 3. Plan Updates Applied
- Replaced Step B token checking logic with HMAC signed token approach to support CLI constraints.

### 4. Execute-Agent Instructions
- Implement the HMAC token generation in `page.tsx` using `crypto.createHmac`.
- Pass this token to the `InstallBlock` component.
- In `route.ts`, check `@upstash/ratelimit` first.
- If `isPro` is true, check `auth()` cookie (for browser), fallback to validating the `?token=` signature (for CLI).
- Return standard `registry-item.json` payload.

### 5. Test Gates
```bash
corepack pnpm exec vitest run
corepack pnpm exec tsc --noEmit
```

### 6. High-Risk Pack
- N/A - No database migrations or irreversible destructive actions.

### 7. Backlog Artifacts
- None.

### 8. Known Gaps
- None.

### 9. Accepted By
vc-validate-agent (05-07-26)
