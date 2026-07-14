# Phase 01 — Data Model & Framework Selection

**Program:** creator-studio
**Date:** 07-07-26

## Framework Selection

**Chosen Framework:** Sandpack

### Rationale
Sandpack was chosen as the underlying code editor framework for the in-browser component authoring studio over Monaco and CodeMirror. It is the overwhelming favorite due to built-in React live preview sandboxing and native multi-file data model capabilities (`files: Record<string, string>`). It allows for a fast integration without having to build a manual compiler/sandbox chain for React components.

**Rejected Alternatives:**
- **Monaco**: Lacks native React live preview sandboxing and out-of-the-box multi-file preview capabilities compared to Sandpack.
- **CodeMirror**: Requires significant manual wiring for sandboxed execution and live preview features that Sandpack provides natively.

## Data Model Implementation

### 1. Registry Updates (`apps/web/lib/registry.ts`)
Extended `RegistryEntry` to support `files?: Record<string, string>`.
Implemented the parsing logic to extract multiple files based on the convention:
`## File: <filepath> (<extension>)`
For example:
`## File: components/Button.tsx (.tsx)`

### 2. Database Schema Updates (`@repo/db`)
Added `Has_Multiple_Files?: boolean;` to `ComponentPayload` in `packages/db/src/schema.ts`.
This field stores metadata indicating the presence of multiple files, allowing the vector DB to store this metadata without needing the actual file contents.

## Test Gates (EXECUTE)
The `type-check` validated that the database types and web application compile perfectly with the extended data model fields.
- `@repo/db`: Green
- `web`: Green
