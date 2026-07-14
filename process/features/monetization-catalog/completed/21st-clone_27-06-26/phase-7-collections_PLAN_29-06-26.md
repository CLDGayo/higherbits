# PLAN: Phase 7 - User collections + favorites
**Date**: 2026-06-29
**Feature**: monetization-catalog / 21st-clone

## 1. Objective
Implement user collections and favorites by allowing authenticated users to save component slugs, which are then stored in their Clerk user profile and displayed on a dedicated Collections page.

## 2. Decisions & Architecture (From INNOVATE)
1. **Storage Strategy**: Clerk `publicMetadata` will be used to store an array of component slugs (`favorites: string[]`).
2. **Mutation Strategy**: Create a Next.js Server Action (`apps/web/app/actions/collections.ts`) to toggle a component slug in `clerkClient().users.updateUserMetadata`.
3. **UI Integration**: 
   - Add `<Link href="/collections">My Collections</Link>` to `apps/web/components/site-header.tsx` inside the `<SignedIn>` block.
   - Create a Client Component `<FavoriteToggle>` that takes `slug` and `initialFavorited` as props, uses React 19's `useOptimistic` for instant feedback, and invokes the Server Action.
   - Inject `<FavoriteToggle>` into the component detail header in `apps/web/app/(catalog)/[category]/[slug]/page.tsx`.
4. **Collections Page**: Create a new route `apps/web/app/(catalog)/collections/page.tsx` that reads `sessionClaims.publicMetadata.favorites`, fetches the matching registry entries, and renders the standard catalog grid.

## 3. Step-by-Step Implementation

### Step 1: Implement Server Action
- Create file: `apps/web/app/actions/collections.ts`
- Implement a server action `toggleFavorite(slug: string)` that:
  - Fetches the current user via `auth()`.
  - Retrieves the user's current `publicMetadata.favorites` via `clerkClient().users.getUser(userId)`.
  - Toggles the provided `slug` (adds if not present, removes if present).
  - Updates the metadata using `clerkClient().users.updateUserMetadata(userId, { publicMetadata: { favorites: newFavorites } })`.
  - Calls `revalidatePath` for relevant routes to update the UI.

### Step 2: Implement Client Component (`FavoriteToggle`)
- Create file: `apps/web/components/favorite-toggle.tsx`
- Implement `<FavoriteToggle slug={string} initialFavorited={boolean} />`.
- Use React 19's `useOptimistic` to instantly toggle the visual state (e.g., filled heart vs outline).
- Call the `toggleFavorite` server action inside a form action or transition.

### Step 3: Inject UI Elements
- **Site Header**: Edit `apps/web/components/site-header.tsx`. Inside the Clerk `<SignedIn>` component, add a navigation link to `/collections`.
- **Component Detail Page**: Edit `apps/web/app/(catalog)/[category]/[slug]/page.tsx`.
  - Extract the user's `favorites` from `auth().sessionClaims.publicMetadata.favorites`.
  - Pass the calculated `initialFavorited` status to `<FavoriteToggle>` within the component header.

### Step 4: Create Collections Page
- Create file: `apps/web/app/(catalog)/collections/page.tsx`
- Ensure the route is protected (or handle unauthenticated states gracefully).
- Read the user's favorites from `auth().sessionClaims.publicMetadata.favorites`.
- Fetch the full component data for each slug from the registry.
- Render the standard catalog grid component to display the favorited items.

## 4. Test Gates & Verification
- [ ] Run `corepack pnpm --filter web build` to verify type safety and build success.
- [ ] Optimistic UI verification: The favorite icon toggles instantly before the network request completes.
- [ ] Data Persistence: Verify that Clerk `publicMetadata` is accurately updated and persists across page reloads.
- [ ] Route verification: Navigating to `/collections` correctly displays the user's saved items.

## Validate Contract

- **V1 (Goal Alignment)**: PASS. The plan accurately implements user collections utilizing Clerk `publicMetadata` as specified.
- **V2 (Blast Radius)**: PASS. Modifications are well isolated to new files and specific areas of the header and component detail page.
- **V3 (Rollback)**: PASS. Revert the git commit. The unused `publicMetadata` entries in Clerk will be dormant and will not break the app.
- **V4 (Unintended Consequences - 8KB Clerk Limit)**: CONDITIONAL PASS. Clerk `publicMetadata` is limited to 8KB. A user could exceed this if no limits are enforced. The server action (`apps/web/app/actions/collections.ts`) MUST enforce a hard limit on the number of favorited items (e.g., max 100-150 items) to prevent `clerkClient` API errors.
- **V5 (Test/Verification Gates)**: PASS. Build steps and visual checks are well defined.
- **V6 (Executability)**: PASS. The step-by-step instructions are clear and target specific file paths.
- **V7 (Net Gate)**: GO. (Subject to enforcing the array size constraint in Step 1).
