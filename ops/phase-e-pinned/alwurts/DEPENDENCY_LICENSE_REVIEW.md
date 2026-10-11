# Alwurts Dependency & License Review

- **21st Creators source**: `Alwurts` (Row 18 in ledger; `auto-index=true`).
- **Target items**:
  - `chat-input` (qualified; exact source in `packages/registry/registry/ui/chat-input.tsx`)
  - `tool` (qualified; exact source in `packages/registry/registry/ui/tool.tsx`)
  - `chat-suggestions`, `editable-handle`, `jsx-renderer`, `model-selector`, `status-edge`, `tool-invocation` (HELD: `source_path_unmapped_in_repo`).
- **Upstream source**: `https://github.com/Alwurts/simple-ai` at commit `2d8292d0ed173727ef88501997f6bcc33773a648`.
- **Root License**: Upstream MIT license (`LICENSE`, 1,064 bytes, sha256: `d2319217dd84baa183682594da1602c1fa53b723042e17d8d6a08abe3c44e50b`).
- **Dependencies**: All direct dependencies (`@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-mention`, `@tiptap/extension-placeholder`, `@tiptap/suggestion`, `ai`, `lucide-react`, `@radix-ui/react-collapsible`) are governed by standard permissive licenses (MIT, ISC, Apache-2.0).
- **Remote assets**: Zero remote fonts, images, or third-party network scripts. All icons and assets are inlined.
- **GoHighLevel & Preview**: Self-contained HTML exports and standalone preview bundles operate without external network requests or localhost references.
