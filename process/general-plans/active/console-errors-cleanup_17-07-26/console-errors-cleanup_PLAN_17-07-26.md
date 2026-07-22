# Console Errors Cleanup Plan

## Objective
Fix all console errors and warnings appearing during component submission and site navigation, including Next.js viewport warnings, Supabase 406 Not Acceptable errors, DialogTitle accessibility warnings, Sandbox API 404 errors, and Sandbox build timeouts.

## Touchpoints
- `apps/web/app/layout.tsx` (Viewport warning)
- `apps/web/lib/supabase.ts` (Supabase `.single()` error & `checkIsAdmin` return type)
- `apps/web/lib/queries.ts` (Supabase `.single()` errors)
- `apps/web/components/ui/dialog.tsx` (DialogTitle warning)
- `apps/web/app/api/sandbox/connect/route.ts` (Sandbox API `isAdmin` bug)
- `apps/web/app/api/sandbox/edit/route.ts` (Sandbox API `isAdmin` bug)
- `apps/web/components/features/studio/sandbox/hooks/use-file-system.ts` (`21st-registry.json` warning and build timeout)

## Public Contracts
- No changes to public contracts. Internal API changes only to fix types (e.g. `const { isAdmin } = await checkIsAdmin()`).

## Blast Radius
- Moderate: Touches core query utility files (`lib/queries.ts`, `lib/supabase.ts`), Sandbox API routes, and Sandbox file system hook.

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)

## Proposed Changes

1. **Next.js Viewport Warning:**
   - In `apps/web/app/layout.tsx` (and any other layout with the same issue), extract `viewport: { viewportFit: "cover" }` from `export const metadata` to its own `export const viewport` object.

2. **Supabase 406 Errors:**
   - In `apps/web/lib/supabase.ts` (`checkIsAdmin`) and `apps/web/lib/queries.ts` (e.g. `authUsername`, `getUserData`, `getComponent`), replace `.single()` with `.maybeSingle()` on `.eq("id", ...)` or `.eq("username", ...)` queries to prevent 406 HTTP errors in the console when 0 rows are found.

3. **Sandbox API `isAdmin` Bug:**
   - In `apps/web/app/api/sandbox/connect/route.ts` and `edit/route.ts`, the destructured assignment of `isAdmin` is missing. Change `const isAdmin = await checkIsAdmin(userId)` to `const { isAdmin } = await checkIsAdmin(userId)`.

4. **DialogTitle Warning:**
   - In `apps/web/components/ui/dialog.tsx`, add `aria-describedby={undefined}` to `DialogPrimitive.Content` to suppress the missing description/title warning when no `DialogTitle` is provided.

5. **Sandbox Hooks Errors:**
   - In `use-file-system.ts`, wrap the `21st-registry.json` fetch in a `stat` check so `sandbox.fs.readTextFile` isn't called when the file doesn't exist, preventing the console error.
   - For the build timeout, ensure the timeout is sufficiently long and gracefully handles cases where the build output string might not perfectly match `"built in"`.

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
| --- | --- | --- |
| Next.js server start | Fully-Automated (`pnpm dev`) | Viewport warning is removed from server logs |
| Sandbox connection | Hybrid | Connecting to a sandbox via UI no longer throws 404 or `isAdmin` errors |
| Supabase queries | Hybrid | Loading user profiles and components no longer logs 406 errors |

## Resume and Execution Handoff

- Selected plan file path: `process/general-plans/active/console-errors-cleanup_17-07-26/console-errors-cleanup_PLAN_17-07-26.md`
- Last completed phase or step: 3. PLAN-SUPPLEMENT
- Validate-contract status: pending
- Supporting context files loaded: `apps/web/lib/supabase.ts`, `apps/web/app/api/sandbox/connect/route.ts`
- Next step for a fresh agent picking up mid-execution: Run PVL (Step 4) to validate the plan.
