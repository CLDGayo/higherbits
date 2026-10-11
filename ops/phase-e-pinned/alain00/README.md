# Creator Review: alain00

## Profile Information
- **Creator Handle**: `alain00`
- **Creator Name**: `alain00`
- **Sheet Row**: 73
- **21st Profile**: `https://21st.dev/@alain00`
- **Website**: `https://blobatar.dev`
- **Repository**: `https://github.com/Alain00/blobatar`
- **Revision**: `a7fd546ebede49d0a9fa638945b9e534489782a2`
- **License**: MIT (`LICENSE`, SHA-256 `939e45eec9b4a8a904657acccda2beb0ff4c83d451a1e4971608cecaaad4d34a`)
- **Evaluated Items (4)**: `group-chat`, `password-field`, `presence-avatar`, `user-table`

## Investigation Evidence
- Public GitHub query identified upstream repository `Alain00/blobatar` under MIT license.
- Components reside in `apps/site/registry/`: `group-chat.tsx`, `password-field.tsx`, `presence-avatar.tsx`, `user-table.tsx`.
- All 4 items directly import from uninstalled npm packages `blobatar` and `@blobatar/react`, and require host imports of `blobatar/motion.css` and `blobatar/gaze.css`.
- Cannot render cleanly without installing the net-new runtime package. Candidate inventory lacks demo wrappers and GHL exports.

## Disposition
- **Status**: HELD (4 items)
- **Hold Reason**: `uninstalled_package_dependencies`
