---
phase: settings-navigation-interception-fix-and-role-gating
date: 2026-09-08
status: COMPLETE
feature: ""
plan: process/general-plans/completed/settings-navigation-interception-fix_08-09-26/settings-navigation-interception-fix_PLAN_08-09-26.md
---

# Settings Navigation, Non-Admin Role-Gating & Sandbox Fullscreen — Execution Report

**Date:** 2026-09-08  
**Complexity:** COMPLEX  
**Status:** ✅ COMPLETE  
**Task Folder:** `process/general-plans/completed/settings-navigation-interception-fix_08-09-26/`  

---

## What Was Shipped

### 1. Settings Navigation Parallel Route Interception Fix (Phase 1)
- `apps/web/app/@modal/(...)[username]/[component_slug]/page.tsx`: Added `RESERVED_TOP_LEVEL_SLUGS` check (`settings`, `studio`, `admin`, `api`, `magic`, `pricing`, etc.) and pre-lookup guard returning `null` on failed/missing component lookups to prevent Next.js from throwing `redirect("/")`.
- Standardized direct navigation to `/settings/profile`:
  - `apps/web/components/ui/header.client.tsx`: Settings dropdown item & View Profile fallback.
  - `apps/web/components/features/studio/ui/studio-header.tsx`: Settings dropdown item.
  - `apps/web/components/features/studio/ui/studio-sidebar.tsx`: Replaced `<Link>` with `<a href="/settings/profile">`.
- `apps/web/middleware.ts`: Added `/sign-in` fallback for missing `AUTH_URL_SIGN_IN` env var.
- Created `apps/web/app/@modal/__tests__/intercepted-modal-guard.test.ts` (3/3 passing).

### 2. Strict Non-Admin Role-Gating & State Leak Isolation (Phase 2)
For any account where `is_admin !== true`, or when logged out:
- **Main Sidebar (`apps/web/components/features/main-page/sidebar-layout.tsx`)**:
  - Strictly hides **AI UI Builder** (Magic Chat Waitlist, Magic MCP, Onboarding, Console, Pricing).
  - Strictly hides **Bundles** (`/bundles`).
  - Strictly hides **Premium Stores** (`/pro`).
  - Strictly hides **Contest Section** (Overview and Leaderboard).
  - Strictly hides **Purchased Bundles** under "You".
  - **Sidebar Footer**: Gated the lower-left "Unlock everything / Go Pro / Support Us!" `ClayCard` behind `isAdmin`. Non-admin accounts, non-pro accounts, and logged-out users will NOT see this card.
- **Header Avatar Dropdown & Signed-Out Navigation (`apps/web/components/ui/header.client.tsx`)**:
  - In avatar dropdown: Wrapped **Billing** `DropdownMenuItem` with `{isAdmin && ...}`.
  - In `<SignedOut>` navigation: Gated **Support Us!** and **Pricing** with `{isAdmin && ...}`, ensuring that when nothing is logged in, neither "Support Us!" nor "Pricing" is visible.
- **State Leak Isolation Fix (`header.client.tsx` & `sidebar-layout.tsx`)**:
  - Computed `isAdmin` strictly via `Boolean(clerkUser && isHookAdmin)`.
  - Added user synchronization in `header.client.tsx` that clears `userStateAtom` on user logout or when switching accounts if `userState.profile?.id !== userId`. This fixes a critical vulnerability where cached `localStorage` from an admin account caused non-admin accounts to evaluate `isAdmin = true`.
- **Settings Navigation (`/settings/*`)**:
  - `apps/web/components/features/settings/settings-sidebar.tsx`: Gated `allItems` with `useIsAdmin()`. Both **Billing** and **Prompt Rules** are completely omitted from the sidebar for non-admins.
  - `apps/web/components/features/settings/settings-mobile-nav.tsx`: Gated `settingsLinks` so **Billing** is omitted from the mobile header dropdown.
- **Server-Side Direct URL Protection**:
  - Added `checkIsAdmin(userId)` checks that redirect non-admins to `/settings/profile` or `/`:
    - `apps/web/app/settings/billing/page.tsx`
    - `apps/web/app/settings/rules/page.tsx`
    - `apps/web/app/settings/rules/new/page.tsx`
    - `apps/web/app/settings/rules/[id]/page.tsx`
    - `apps/web/app/magic/layout.tsx`
    - `apps/web/app/magic-chat/page.tsx`
    - `apps/web/app/contest/layout.tsx`
- Created `apps/web/components/features/settings/__tests__/settings-sidebar.test.tsx` (2/2 passing).
- Expanded `apps/web/components/features/main-page/__tests__/sidebar-layout.test.tsx` (8/8 passing).

### 3. Sandbox Editor Viewport Fullscreen Fix (Phase 3)
- `apps/web/app/studio/[username]/sandbox/[sandboxId]/page.client.tsx`:
  - Replaced `className="h-[calc(100vh-56px)] w-full flex flex-col"` with `className="h-screen w-full flex flex-col"`.
  - Eliminates the 56px bottom margin gap and allows the editor, preview pane, and status bar to extend edge-to-edge.

---

## Test Gate Outcomes

| Gate | Command | Result |
|---|---|---|
| **Typecheck** | `pnpm --filter web typecheck` | ✅ **Exit 0 (PASS)** — 0 TypeScript errors |
| **Modal Interceptor Unit Tests** | `vitest run app/@modal/__tests__/intercepted-modal-guard.test.ts` | ✅ **PASS (3/3 tests)** |
| **Settings Sidebar Unit Tests** | `vitest run components/features/settings/__tests__/settings-sidebar.test.tsx` | ✅ **PASS (2/2 tests)** |
| **Main Sidebar Unit Tests** | `vitest run components/features/main-page/__tests__/sidebar-layout.test.tsx` | ✅ **PASS (8/8 tests)** |
| **Total Test Suite** | 3 test files, 13 tests | ✅ **13/13 PASS (100%)** |
| **Live Browser Verification (Chrome DevTools)** | `http://localhost:3000` | ✅ **VERIFIED** (Confirmed via DOM inspection for Gwyn non-admin and Logged-Out states) |

---

## Plan Deviations

None. All changes strictly align with the approved phase plan and user specifications.
