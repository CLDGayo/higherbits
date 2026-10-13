---
feature: higherbits-redesign
phase: SPEC
status: awaiting-user-review
date: 13-10-26
---
# HigherBits sidebar reference adaptation requirements

**Date:** 13-10-26
**Status:** Draft for required user review; not execution approval

Adapt the directly inspected current 21st.dev sidebar structure and applicable interactions to HigherBits' existing product. Keep HigherBits branding, terminology, permission checks and necessary navigation. Changes remain local and sidebar-only. The user explicitly requested investigation, a complete item mapping and a plan before implementation approval.

## User Stories

Visitors can find components and categories in a predictable compact navigation. Users can distinguish real available features from unsupported future catalogs. Signed-in creators can reach current Studio/Bookmarks/publishing workflows. Admins retain existing gated tools without granting new public access. Keyboard and mobile users can navigate, search, expand genuine menus and dismiss the sheet accessibly.

## Acceptance Criteria

AC1: Every observed reference root/control/context item and all78 categories have an individual mapping row, implementation evidence and proposed behavior; omissions explained.
AC2: Main, component and library contexts use applicable reference hierarchy/order with necessary HigherBits additions.
AC3:25 unavailable categories and true unsupported product catalogs visibly say Coming soon with disabled semantics and no navigation; existing zero-count categories stay links. Implemented admin-only surfaces remain hidden for non-admins rather than incorrectly described as unbuilt.
AC4:5 verified category aliases resolve to existing canonical routes/counts/active states; generic Carousels maps accurately to labelled 3D Carousels. Shared homepage category configuration keeps its meaning.
AC5: Existing authentication/admin gates and working Studio/Publish/Bookmarks destinations remain; no missing feature implementation or permission widening.
AC6: Single-click URL/context/active selection, native modified clicks, direct loads and Back/Forward behave consistently.
AC7: Search, real expansion, Help, visible focus and keyboard operation work accessibly.
AC8: Desktop, mobile, independent scrolling and close behavior work at specified widths without clipped badges/footer or horizontal overflow.
AC9: Scoped tests pass, no introduced type errors or out-of-scope edits; no deployment, data change or dependency addition.
AC10: Light/dark HigherBits branding retained; previously rejected pink promotion absent; evidence report explicitly identifies inspection limitations.

Each criterion's named proving scenario and strategy are bidirectionally mapped in the sole selected implementation plan's Acceptance Criteria and Verification Evidence sections.

## Feature Policy

True unsupported root catalogs Themes, Apps, Icons and Video plus HigherBits AI generation show Coming soon. Existing admin-only Templates/Bundles/Premium Stores/MCP/Contest preserve current conditional visibility and real routes, hidden for non-admins. Admin AI Waitlist is separately labelled and retains its existing route. Purchased Bundles is incomplete and shows Coming soon only within its existing admin visibility. Omit proprietary Design Bug Bot and unsupported CLI claim; do not promise an unapproved HigherBits equivalent.

## Scope and Evidence Limits

No new routes/APIs/schema/category seeding/product feature/dependency. Preserve previous dirty work and current header/Studio sidebar. Reference authenticated desktop root and Components context were directly inspected; mobile, keyboard, wheel scrolling, menus, close and search interactions are unverified following lost Chrome connectivity. HigherBits source/DB/HTTP evidence is distinct from visual/runtime verification. Report and mapping are authoritative evidence; local runtime tests follow implementation approval.

## Review Packet

- Investigation and105-row mapping: sidebar-reference-adaptation_REPORT_13-10-26.md
- Sole plan: sidebar-reference-adaptation_PLAN_13-10-26.md
- Direct reference desktop capture:21st-home-desktop.jpg
- Complete observed reference anchor inventory:reference-items.json
