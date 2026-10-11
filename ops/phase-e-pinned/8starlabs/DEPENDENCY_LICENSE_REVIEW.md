# 8StarLabs Dependency & License Review

- **21st Creators source**: `8starlabs` (Row 11 in ledger; `auto-index=true`).
- **Target item**: `open-in-chat` (previously blocked as `uncaptured_source_item`).
- **Upstream source**: `https://github.com/8starlabs/ui` at commit `9633e2fa89cdea2da40a81d69ef484ff04d0de63`.
- **Source closure**:
  - `registry/8starlabs-ui/blocks/open-in-chat.tsx` (7,969 bytes, sha256: `c5d9c5efc3590f630c2b67b7be71c5590b79cd945044a9d72e9316be7c193f59`)
  - `registry/8starlabs-ui/ui/ai-icons.tsx` (3,202 bytes, sha256: `1bda9e7185f479a998091d4f4e7a279e8f7510230a8281151b9dad2acf7df50e`)
  - Verified byte-for-byte against the candidate evidence capture and upstream repository.
- **Root License**: Upstream MIT license (`LICENSE.md`, 1,070 bytes, sha256: `392075473ac3a5da2de1035e5dd31e7079518eb0af322e6bed332ed0d7f277f0`).
- **Dependencies**: All direct dependencies (`lucide-react`, `simple-icons`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip`, `class-variance-authority`) are governed by standard permissive open source licenses (MIT, ISC, Apache-2.0, CC0-1.0).
- **Remote assets**: Zero remote fonts, images, or third-party network scripts. All brand SVGs and icons are inlined.
- **GoHighLevel & Preview**: Self-contained HTML exports and standalone preview bundles operate without external network requests or localhost references.
