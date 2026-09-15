---
name: plan:settings-navigation-interception-fix-and-role-gating
description: "Fix Settings navigation route interception, enforce strict non-admin role gating across sidebar/settings/avatar, and fix sandbox fullscreen viewport"
date: 08-09-26
metadata:
  node_type: memory
  type: plan
  complexity: COMPLEX
  status: COMPLETED
---

# Settings Navigation, Non-Admin Role-Gating & Sandbox Fullscreen — Phase Plan

**Date:** 08-09-26  
**Complexity:** COMPLEX  
**Status:** ✅ COMPLETED (All Phases 1, 2, and 3 Verified & Passing)  
**Task Folder:** `process/general-plans/completed/settings-navigation-interception-fix_08-09-26/`  

---

## Objective

Deliver a comprehensive three-phase solution addressing:
1. **Phase 1 (Completed):** Fix the Next.js parallel route interception bug that bounced users attempting to navigate to `/settings/profile` back to the homepage.
2. **Phase 2 (Completed):** Strictly enforce non-admin role gating (`isadmin !== true`) so unprivileged accounts cannot view or access AI UI Builder, Magic Chat Waitlist, Magic MCP, Onboarding, Console, Pricing, Bundles, Premium Stores, Contest (Overview/Leaderboard), Settings Billing & Prompt Rules, and the Header Avatar Billing button.
3. **Phase 3 (Completed):** Fix the sandbox editor layout defect where hardcoded viewport height subtraction leaves an empty space at the bottom of the screen, achieving true fullscreen edge-to-edge display.

---

## Problem & Root Cause Breakdown

### 1. Settings Navigation Interception Defect (Phase 1)
- **Root Cause:** Next.js root interceptor `app/@modal/(...)[username]/[component_slug]/page.tsx` intercepted client transitions to `/settings/profile`. When database component lookup returned null, it triggered `redirect("/")`.
- **Resolution:** Added `RESERVED_TOP_LEVEL_SLUGS` check and pre-lookup guard in the 2-segment interceptor to return `null` without redirecting. Converted Settings navigation in `header.client.tsx`, `studio-header.tsx`, and `studio-sidebar.tsx` to direct navigations. Added `/sign-in` fallback in `middleware.ts`.

### 2. Non-Admin Role-Gating Defect (Phase 2)
- **Problem Statement:** "Any account who is not isadmin=true will not be able to view any of the following: AI UI Builder, Magic Chat Waitlist, Magic MCP, Onboarding, Console, Pricing, Bundles, Premium Stores, Contest Section which are Overview and Leaderboard; at the Settings hide the Billing, Prompt Rules; the billing button when you click the avatar at the upper right corner."
- **Root Cause:**
  - `components/features/settings/settings-sidebar.tsx` hardcoded `Billing` and `Prompt Rules` without evaluating admin status.
  - `components/features/settings/settings-mobile-nav.tsx` unconditionally exposed `Billing`.
  - `components/ui/header.client.tsx` unconditionally rendered the `Billing` item in the user avatar dropdown menu.
  - Route handlers (`/settings/billing`, `/settings/rules/*`, `/magic*`, `/contest*`) lacked server-side role gating, allowing direct URL access.
- **Resolution:**
  - Integrated `useIsAdmin` into `settings-sidebar.tsx` and `settings-mobile-nav.tsx` to hide `Billing` and `Prompt Rules` for non-admins.
  - Integrated `isAdmin` check into `header.client.tsx` avatar dropdown to hide `Billing`, and gated the header `Pricing` link.
  - Added server-side admin redirect guards in `app/settings/billing/page.tsx`, `app/settings/rules/page.tsx`, `app/settings/rules/new/page.tsx`, `app/settings/rules/[id]/page.tsx`, `app/magic/layout.tsx`, `app/magic-chat/page.tsx`, and `app/contest/layout.tsx`.
  - Added unit test suite `settings-sidebar.test.tsx` and expanded `sidebar-layout.test.tsx`.

### 3. Sandbox Editor Viewport Space Defect (Phase 3)
- **Problem Statement:** "There is a space at the bottom of the sandbox editor because of that the entire sandbox editor is not in full screen."
- **Root Cause:**
  - `apps/web/app/studio/[username]/sandbox/[sandboxId]/page.client.tsx` line 598 used `className="h-[calc(100vh-56px)] w-full flex flex-col"`.
  - The sandbox route does not render the global 56px site header (it has its own internal `SandboxHeader`), so subtracting 56px left a 56px blank gap at the bottom of the screen.
- **Resolution:**
  - Updated root container in `page.client.tsx` to `h-screen w-full flex flex-col`.

---

## Phase Structure

```mermaid
graph TD
    subgraph Phase 1 [Phase 1: Interception Defect - COMPLETE]
        P1_1[Reserved Slugs Guard in @modal] --> P1_2[Direct Navigation in Header/Studio]
        P1_2 --> P1_3[Unit Tests & Typecheck PASS]
    end

    subgraph Phase 2 [Phase 2: Role-Gating for Non-Admin - COMPLETE]
        P2_1[Main Sidebar Gating: AI UI Builder, Bundles, Pro, Contest]
        P2_2[Settings Sidebar & Mobile Nav Gating: Billing, Rules]
        P2_3[Avatar Dropdown Menu Gating: Billing]
        P2_4[Server Route Guards: /settings/billing, /settings/rules, /magic, /contest]
        P2_1 --> P2_2 --> P2_3 --> P2_4
    end

    subgraph Phase 3 [Phase 3: Sandbox Editor Fullscreen - COMPLETE]
        P3_1[Replace h-calc 100vh-56px with h-screen]
        P3_2[Verify edge-to-edge layout on Studio Sandbox]
        P3_1 --> P3_2
    end

    Phase 1 --> Phase 2
    Phase 2 --> Phase 3
```

---

## Touchpoints

### Phase 1 (Completed)
- `apps/web/app/@modal/(...)[username]/[component_slug]/page.tsx`
- `apps/web/app/@modal/__tests__/intercepted-modal-guard.test.ts`
- `apps/web/components/ui/header.client.tsx`
- `apps/web/components/features/studio/ui/studio-header.tsx`
- `apps/web/components/features/studio/ui/studio-sidebar.tsx`
- `apps/web/middleware.ts`

### Phase 2 (Completed)
- `apps/web/components/features/main-page/sidebar-layout.tsx` (Main sidebar navigation item gating)
- `apps/web/components/features/main-page/__tests__/sidebar-layout.test.tsx` (Unit test for non-admin gating)
- `apps/web/components/ui/header.client.tsx` (Avatar dropdown Billing item gating, public pricing link)
- `apps/web/components/features/settings/settings-sidebar.tsx` (Settings sidebar items gating)
- `apps/web/components/features/settings/__tests__/settings-sidebar.test.tsx` (Unit test for settings sidebar gating)
- `apps/web/components/features/settings/settings-mobile-nav.tsx` (Settings mobile dropdown gating)
- `apps/web/app/settings/billing/page.tsx` (Server route guard)
- `apps/web/app/settings/rules/page.tsx` (Server route guard)
- `apps/web/app/settings/rules/new/page.tsx` (Server route guard)
- `apps/web/app/settings/rules/[id]/page.tsx` (Server route guard)
- `apps/web/app/magic/layout.tsx` (Server route guard)
- `apps/web/app/magic-chat/page.tsx` (Server route guard)
- `apps/web/app/contest/layout.tsx` (Server route guard)

### Phase 3 (Completed)
- `apps/web/app/studio/[username]/sandbox/[sandboxId]/page.client.tsx` (Sandbox editor root container height -> `h-screen`)

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves Criterion | Status |
|---|---|---|---|
| Phase 1: Reserved slug interception guard | Unit test (`intercepted-modal-guard.test.ts`) | Intercepted route returns `null` for `settings`, `studio`, `admin` | ✅ PASS (3/3 tests) |
| Phase 1: Direct navigation to Settings | Code & Live Browser | Clicking Settings opens `/settings/profile` without bounce-back | ✅ PASS |
| Phase 1: TypeScript typecheck | `pnpm --filter web typecheck` | 0 errors monorepo-wide | ✅ PASS (0 errors) |
| Phase 2: Main sidebar non-admin gating | Automated unit test (`sidebar-layout.test.tsx`) | AI UI Builder, Bundles, Pro, Contest hidden for non-admin | ✅ PASS (7/7 tests) |
| Phase 2: Settings sidebar non-admin gating | Automated unit test (`settings-sidebar.test.tsx`) | Billing and Prompt Rules hidden for non-admin | ✅ PASS (2/2 tests) |
| Phase 2: Avatar dropdown Billing item gating | Code inspection & typecheck | Billing button hidden in dropdown for non-admin | ✅ PASS |
| Phase 2: Route guards for protected paths | Server-side `checkIsAdmin` redirects | Direct access to `/settings/billing`, `/settings/rules/*`, `/magic*`, `/contest*` redirects non-admins | ✅ PASS |
| Phase 3: Sandbox editor fullscreen | Viewport CSS alignment | Replaced `h-[calc(100vh-56px)]` with `h-screen` eliminating bottom whitespace | ✅ PASS |

---

## Resume and Execution Handoff

- **Selected plan file path:** `process/general-plans/active/settings-navigation-interception-fix_08-09-26/settings-navigation-interception-fix_PLAN_08-09-26.md`
- **Status:** COMPLETED
- **All tests passing:** 12/12 automated unit tests across 3 suites.
- **Typecheck:** Clean 0-error `tsc --noEmit`.
