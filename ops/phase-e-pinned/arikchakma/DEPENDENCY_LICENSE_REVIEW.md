# arikchakma Dependency & License Review

- 21st Creators source row: 106 (`arikchakma`, `auto-index=true`); items: `cromia-channels`, `cromia-color-picker`, `cromia-compact`, `cromia-swatches`, `unit-field`.
- Upstream source: [`arikchakma/ui`](https://github.com/arikchakma/ui), pinned commit `c4779bebc21262556fbd5a4ec3851526395bf829`.
- Upstream license: root `LICENSE` is MIT. Both `packages/cromia/package.json` and `packages/unit-field/package.json` declare zero production runtime dependencies (peer dependency on React 18/19 only).
- HigherBits demo wrappers and standalone GHL previews are self-contained and require no remote scripts, fonts, images, or third-party assets.
- All five components pass local integrity and review requirements.
