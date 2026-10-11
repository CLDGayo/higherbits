# bklitai Dependency & License Review

- 21st Creators source row: 151 (`bklitai`, `auto-index=true`); items: `area-chart`, `bar-chart`, `candlestick-chart`, `funnel-chart`, `sankey-chart`.
- Upstream source: [`bklit/bklit-ui`](https://github.com/bklit/bklit-ui), pinned commit `f7b3bd2999a5c993863f9cc5523c9cf60b9f3bc2`.
- License status: Root `LICENSE` is MIT. Upstream package repository is MIT. Although proprietary restrictions were noted for bklit studio templates, the core chart components under `packages/ui` are open-source MIT. The 21st Creators sheet auto-index=true gate affirms eligibility.
- Direct dependency licenses include `@visx/*` and `clsx` (MIT) plus `d3-sankey@0.12.3` (BSD-3-Clause), verified from package metadata.
- Demo wrappers and standalone GHL previews use standalone SVG structures without external network assets, scripts, or font dependencies.
