# Phase 02: Creator Studio Implementation

The goal of this phase is to completely port the `21st.dev` Creator Studio interface and layout structure over to `HigherBits.dev`. This will resolve current rendering issues (such as the blank white dashboard) by adopting the exact component composition and styling used in 21st.dev.

## User Review Required
- The Studio will use its own specialized `StudioHeader` (with breadcrumbs and user avatar) instead of the global `HigherBits` header, exactly like 21st.dev.
- The Studio will be forced into Dark Mode for the inner content and sidebar, matching the 21st.dev aesthetic.

## Open Questions
- Should the "Developer" section in the sidebar (API Key, CLI) be included now, or hidden for a future phase? (Assuming included for visual parity).

## Proposed Changes

### UI Components

#### [NEW] `apps/web/components/cozy/studio/studio-layout.tsx`
Port the 21st.dev `StudioLayout` wrapper. This will handle the precise flex layout required to render the `StudioHeader`, `StudioSidebar`, and `SidebarInset` correctly without conflicting with the main site's layout.

#### [NEW] `apps/web/components/cozy/studio/studio-header.tsx`
Port the 21st.dev `StudioHeader` which sits at the top of the Studio interface, containing the user avatar, breadcrumbs (e.g. `My Studio / Components`), and the Upgrade button.

#### [MODIFY] `apps/web/components/cozy/studio/studio-sidebar.tsx`
Completely overhaul the sidebar to match 21st.dev:
- Force dark mode styling (`dark` class).
- Add the primary blue "+ New" button.
- Update navigation links: Workspace (Overview, Components, Libraries, Templates, Themes, ASCII art), For public creators (Analytics, Demand, Public profile, Microsite), Developer (API Key, CLI).

### App Routes

#### [MODIFY] `apps/web/app/studio/layout.tsx`
Remove the global `Header` and `MainLayout` wrappers. The layout will simply pass `children` through, allowing individual pages to wrap themselves in the `StudioLayout` component (matching the 21st.dev architecture).

#### [MODIFY] `apps/web/app/studio/page.tsx`
- Wrap the content in the new `StudioLayout`.
- Update the Overview dashboard to exactly replicate the 21st.dev structure (dark theme, 4 stats cards, "Grow your reach" and "Start something" sections).

## Verification Plan

### Manual Verification
- Navigate to `/studio` on localhost.
- Verify the layout exactly matches the provided 21st.dev screenshot.
- Verify the sidebar is fully populated and styled correctly (dark mode).
- Verify the overview cards are visible and correctly styled.
- Verify the global Header is replaced by the `StudioHeader`.
