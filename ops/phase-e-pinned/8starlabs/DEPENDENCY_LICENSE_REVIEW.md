# 8StarLabs Dependency & License Review

- **21st Creators source**: `8starlabs` (row 11; `auto-index=true`).
- **Remaining target**: `open-in-chat`; `partition-bar` is already published as HigherBits component 131.
- **Pinned upstream**: `https://github.com/8starlabs/ui` at commit `9633e2fa89cdea2da40a81d69ef484ff04d0de63`.
- **Source license**: upstream `LICENSE.md`, MIT, 1,070 bytes, sha256 `392075473ac3a5da2de1035e5dd31e7079518eb0af322e6bed332ed0d7f277f0`.
- **Captured source closure** (each file is byte-checked against its pinned registry response):
  - `registry/8starlabs-ui/blocks/open-in-chat.tsx` — 7,969 bytes; sha256 `c5d9c5efc3590f630c2b67b7be71c5590b79cd945044a9d72e9316be7c193f59`.
  - `registry/8starlabs-ui/ui/ai-icons.tsx` — 3,202 bytes; sha256 `1bda9e7185f479a998091d4f4e7a279e8f7510230a8281151b9dad2acf7df50e`.
  - `registry/8starlabs-ui/blocks/button.tsx` — 3,339 bytes; sha256 `7687945bc170df6473fba3c2f8dd3664cf2eb337f9a6d922a7ced4c10fed3a35`.
  - `registry/8starlabs-ui/ui/dropdown-menu.tsx` — 8,601 bytes; sha256 `860914aa7b757ad6ff2a8ee292eff4f97b446a5ddc3a9b49843397cd79c50a91`.
  - `registry/8starlabs-ui/ui/tooltip.tsx` — 5,047 bytes; sha256 `67c6c3762588ae5124c244bc563d7adb57306babe27a84fb2f2b6adaf1afef84`.
- **Pinned npm dependencies**: `@base-ui/react` 1.6.0 (MIT), `class-variance-authority` 0.7.1 (Apache-2.0), `lucide-react` 0.487.0 (ISC), and `simple-icons` 16.21.0 (CC0-1.0). Versions and licenses are recorded in `dependency-license-evidence.json`.
- **Remote assets**: none. Brand vectors and icons are inlined; no remote fonts, images, or runtime scripts.
- **Export and preview**: the standalone GoHighLevel export, public preview HTML/CSS/SVG, and preview PNG are separate pinned artifacts with individual hashes. The GHL export has no runtime network dependency or localhost reference.
- **Scope**: the emitter accepts only this one unpublished item and validates relative source/target paths before reading or generating SQL. It stages source evidence only; the authenticated HigherBits admin review flow must approve and publish it.
