# Dependency & License Review: LegionWebDev

- Upstream Repository: `https://github.com/legions-developer/evilcharts`
- Revision: `ecbd6a5db7b25f9a7e070c02b2ef728c378eeb5c`
- License: MIT License (confirmed in `LICENSE`, SHA-256 `7b6baf25f6caa0de061a2c99a47205d6651cdefc6e636910bc51bb3853ed056e`)
- Dependencies:
  - ECharts blocks (`allocation-echarts-sankey-chart`, `pipeline-echarts-sankey-chart`, `cache-tiers-echarts-radial-chart`): `echarts`, `motion`
  - Recharts blocks (`grid-bar-chart`, `hover-trace-bar-chart`, `monospace-bar-chart`): `recharts`
- Status: Permissive license passes; hold applied due to chart runtime dependencies and pending demo/preview pipeline assets.
