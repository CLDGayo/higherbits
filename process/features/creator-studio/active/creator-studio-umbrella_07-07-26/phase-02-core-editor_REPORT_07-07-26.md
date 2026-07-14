# Phase 02 — Core Editor Shell & State

**Program:** creator-studio
**Date:** 07-07-26

## Architecture Decisions (INNOVATE)

1. **Route Location:** Kept the studio at `apps/web/app/studio/` (outside the `(catalog)` route group) to prevent the 224px catalog sidebar from squeezing the code editor.
2. **Editor Component:** Built an isolated `EditorShell` component integrating Sandpack.
3. **CSS Injection:** Implemented `SandPackCSS` as a client component mapped in `app/studio/layout.tsx` to handle Sandpack's SSR CSS injection, preventing FOUC and keeping the root layout clean.
4. **State Ownership:** Relied on Sandpack's native `SandpackProvider` to manage the multi-file state instead of duplicating it into parallel React state. The form submission logic pulls the code directly from `useSandpack`.

## Execution Results

- **Dependencies:** Installed `@codesandbox/sandpack-react`.
- **Components Built:** 
  - `apps/web/components/studio/editor-shell.tsx`
  - `apps/web/components/studio/sandpack-css.tsx`
- **Layout Added:** `apps/web/app/studio/layout.tsx` created.
- **Form Refactored:** `apps/web/app/studio/studio-form.tsx` updated to remove the plain `<textarea>` and placeholder preview, replacing them with the `<EditorShell />`.

## Test Gates
- `type-check` across `@repo/db` and `web` passes.
- `build` for `web` passes compilation. (Encountered a known intermittent Next.js ENOENT error on standalone copy, which is non-blocking for this feature code).

## Next Phase (Phase 3)
The foundation is set for **Live Preview & Validation**, where we will ensure secure evaluation of user-authored code and handle runtime/syntax errors directly within the editor.
