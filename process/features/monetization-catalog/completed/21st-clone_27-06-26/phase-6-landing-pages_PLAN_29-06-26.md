# Phase 6: Landing / marketing pages + 21st.dev visual identity

**TL;DR**: Implement dark theme aesthetic, Next.js Route Groups for marketing vs catalog layouts, and build the marketing components (Hero, ValueProp, TrendingStrip).

## Touchpoints
- `apps/web/app/layout.tsx`
- `apps/web/app/(catalog)/layout.tsx` (new)
- `apps/web/app/(marketing)/page.tsx` or `apps/web/app/page.tsx`
- `apps/web/globals.css`
- `apps/web/components/marketing/Hero.tsx` (new)
- `apps/web/components/marketing/ValueProp.tsx` (new)
- `apps/web/components/marketing/TrendingStrip.tsx` (new)
- `packages/ui/components/PreviewFrame.tsx` or equivalent.

## Public Contracts
- Marketing components will be exposed within `apps/web/components/marketing/` but are internal to the web app.
- Layout route groups will define the DOM structure for the marketing and catalog domains.

## Blast Radius
- **Scope**: Modifying root layouts and global styles. Moving the main catalog layout to a route group.
- **Risk Class**: Low/Medium (UI & Layout changes only).
- **Packages**: `apps/web`

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
| --- | --- | --- |
| Route group layout renders without breaking the app | Hybrid | Catalog and marketing pages resolve successfully |
| `globals.css` dark theme applied | Agent-Probe | Correct aesthetic tokens used for background and text |
| Preview canvas isolation | Agent-Probe | Component previews are not affected by global dark theme |
| Build succeeds | Fully-Automated | Next.js build exits with 0 |

## Test Infra Improvement Notes
(none identified yet)

## Resume and Execution Handoff
1. selected plan file path: `process/features/monetization-catalog/active/21st-clone_27-06-26/phase-6-landing-pages_PLAN_29-06-26.md`
2. last completed phase or step: PLAN step written
3. validate-contract status: pending
4. supporting context files loaded: `process/context/all-context.md`
5. next step for a fresh agent picking up mid-execution: Proceed to PVL (Plan Validation Loop) / VALIDATE mode.

## Validate Contract

- **V1 (Goal Alignment)**: PASS. The implementation steps accurately reflect the stated TL;DR goals of establishing Route Groups, dark theme, and marketing components.
- **V2 (Blast Radius Check)**: PASS. The stated scope (`apps/web` layouts and global CSS) matches the implementation steps and is reasonably isolated.
- **V3 (Rollback Procedure)**: PASS. Changes are easily reversible via a standard git revert of `apps/web/globals.css` and `apps/web/app/layout.tsx`.
- **V4 (Unintended Consequences)**: PASS. The plan proactively identifies the risk of dark theme bleeding into the preview canvas and includes Step 3 (Preview Isolation) to mitigate it.
- **V5 (Test / Verification Gates)**: PASS. Explicit gates exist for route group resolution, global CSS application, preview isolation, and a fully-automated Next.js build check.
- **V6 (Executability)**: PASS. File paths and CSS tokens are clearly defined, making the plan actionable.
- **V7 (Go/No-Go Decision)**: **PASS / GO**. Plan is fully validated and ready for EXECUTE phase.

## Implementation Steps

1. **Step 1: Next.js Route Groups & Layout Adjustments**
   - Create `apps/web/app/(catalog)/layout.tsx`.
   - Move the constrained `max-w-7xl` wrapper and `<CatalogNav>` from the root `apps/web/app/layout.tsx` into the new `(catalog)/layout.tsx`.
   - Leave the root layout `apps/web/app/layout.tsx` clean, allowing full-width marketing pages.
   - Adjust page paths (e.g., ensure the marketing page is at `apps/web/app/page.tsx`).

2. **Step 2: Dark Theme Global Styling**
   - Update `apps/web/globals.css` with 21st.dev dark-theme tokens:
     - Black background.
     - Dark surface colors.
     - Subtle borders.
   - Integrate a modern sans-serif font (Geist or Inter) via `next/font/google` in the root layout.
   - Apply glassmorphism on the sticky header.

3. **Step 3: Preview Isolation**
   - Ensure `<PreviewFrame>` (or equivalent component used for rendering live components) applies a `.preview-canvas` reset class so the global dark theme doesn't bleed into it.

4. **Step 4: Marketing Components**
   - Create `apps/web/components/marketing/Hero.tsx`.
   - Create `apps/web/components/marketing/ValueProp.tsx`.
   - Create `apps/web/components/marketing/TrendingStrip.tsx`. Use hardcoded slugs (e.g., `cozy-buttons/pill-button`) for the MVP trending strip.
   - Integrate these components into the marketing landing page.

5. **Step 5: Test Gates**
   - Run build script to ensure it exits with 0.
