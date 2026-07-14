---
name: plan:21st-clone-phase-22-usage-metering
description: "21st.dev Clone — Phase 22: Usage metering"
date: 05-07-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: phase-22
---

# Phase 22 — Usage metering

**Program:** 21st-clone
**Umbrella plan:** process/features/monetization-catalog/active/21st-clone_05-07-26/21st-clone-umbrella_PLAN_05-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/monetization-catalog/active/21st-clone_05-07-26/phase-22-usage-metering_REPORT_05-07-26.md (flat in the program task folder)

---

## Purpose

Move from a binary free/Pro gate to 21st.dev-style metered freemium: daily free-tier allowances and a monthly credit system for AI generation.

---

## Entry Gate

- Phase 21 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/lib/redis.ts`
- `apps/web/app/api/metering/`

---

## Implementation Checklist

### Step A — Redis Usage Counters
- [ ] A1. Implement daily free-tier limits in `apps/web/lib/metering.ts` via Redis Sets (`metering:daily:{YYYY-MM-DD}:{userId|IP}`). Limits: 1 for IP, 3 for Auth Users.
- [ ] A2. Create monthly AI credit ledger via Redis Hashes (`metering:ai:{YYYY-MM}:{userId}`, Default: 50).
- [ ] A3. Create `GET /api/metering/usage` endpoint to serve limits vs usage to the client.

### Step B — Upsell UI
- [ ] B1. In `apps/web/app/(catalog)/[category]/[slug]/page.tsx`, evaluate daily limit and pass `overLimit={true}` to `PaywallOverlay`. Also enforce limit in `route.ts` for registry CLI.
- [ ] B2. In `apps/web/components/site-header.tsx`, inject `<UserButton.UserProfilePage label="Usage" url="usage">` to display usage fetched from `/api/metering/usage`.

---

## Exit Gate

```bash
# Verify tests
corepack pnpm exec vitest run
# Expected: passing tests
```

- all checklist items checked
- validators exit 0
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- upstream phase exit gate not yet passed

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md`
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/lib/redis.ts`
- `apps/web/lib/metering.ts`
- `apps/web/app/api/metering/usage/route.ts`
- `apps/web/app/(catalog)/[category]/[slug]/page.tsx`
- `apps/web/components/site-header.tsx`

---

## Public Contracts

- `/api/metering/usage` (new public endpoint)

---

## Verification Evidence

```bash
corepack pnpm exec vitest run
# Expected: passing tests
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization-catalog/active/21st-clone_05-07-26/phase-22-usage-metering_PLAN_05-07-26.md`
- Last completed step: PVL (Step 4)
- Validate-contract status: WRITTEN
- Next step: Spawn vc-execute-agent for EXECUTE (Step 5)

---

## Validate Contract

### 1. Status: PASS

### 2. Gate: CONDITIONAL PROCEED
- Architecture is viable (Redis sets and hashes).
- Unauth limiting via IP is a sound growth pattern.

### 3. Plan Updates Applied
- Added specifics around limit sizes (1 for IP, 3 for Auth, 50 AI credits).
- Explicitly called out `apps/web/lib/metering.ts` creation.
- Explicitly called out Clerk `<UserButton.UserProfilePage>` injection in `site-header.tsx`.

### 4. Execute-Agent Instructions
- Implement `apps/web/lib/metering.ts` using the Upstash Redis client.
- Expose methods `recordComponentView(userIdOrIp, slug)`, `hasHitDailyLimit(userIdOrIp)`, `consumeAICredits(userId)`, `getAICredits(userId)`.
- Use `headers().get('x-forwarded-for')` to grab IP if user is unauthenticated.
- Inject the logic into `page.tsx` to conditionally pass `overLimit={true}` to `PaywallOverlay`.
- Build the usage endpoint at `api/metering/usage/route.ts`.
- Wrap the Settings UI as an injected component in `site-header.tsx`.

### 5. Test Gates
```bash
corepack pnpm exec vitest run
corepack pnpm exec tsc --noEmit
```

### 6. High-Risk Pack
- N/A

### 7. Backlog Artifacts
- None.

### 8. Known Gaps
- None.

### 9. Accepted By
vc-validate-agent (05-07-26)
