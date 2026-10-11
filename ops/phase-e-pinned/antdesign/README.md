# Creator Review: antdesign

## Profile Information
- **Creator Handle**: `antdesign`
- **Creator Name**: `Ant Design`
- **Sheet Row**: 96 (`auto-index=true`)
- **21st Profile**: `https://21st.dev/@antdesign`
- **Library Page**: `https://21st.dev/@antdesign/library/ant-design`
- **Website**: `https://ant.design`
- **Repository**: `https://github.com/ant-design/ant-design`
- **Revision**: `4a39f54842eade4e565ab336ef6097cd7e723cdd` (release tag 6.6.5)
- **License**: MIT (`LICENSE`, SHA-256 `3c82654bb472ebbcacc4c1ff00f94aa8c60c4b7ee011b16bafcbacecc3703458`)
- **Evaluated Items (7)**: `breadcrumb`, `button-ant`, `dropdown`, `float-button`, `floating-action-menu`, `menu-1`, `pagination-ant`

## Investigation Evidence
- **Upstream Mapping**:
  - The official 21st.dev profile and library page for `antdesign` map directly to GitHub organization `https://github.com/ant-design` and the core library repository `ant-design/ant-design`.
  - Pinned immutable release tag `6.6.5` (commit `4a39f54842eade4e565ab336ef6097cd7e723cdd`) verified under MIT license.
- **Monorepo Library Coupling**:
  - 6 items (`breadcrumb`, `button-ant`, `dropdown`, `float-button`, `menu-1`, `pagination-ant`) represent components of the monolithic `antd` component library.
  - In upstream `ant-design/ant-design`, each component depends on the monolithic `antd` runtime, `@ant-design/cssinjs`, `@rc-component/util`, and internal `ConfigProvider` context.
  - On 21st.dev, the published demos import directly from the pre-bundled `antd` package (`import { Breadcrumb } from 'antd'`). They are not standalone copy-paste React components conforming to HigherBits' Tailwind/shadcn primitive architecture.
  - HigherBits does not have `antd` installed in its workspace packages.
- **Floating Action Menu Misattribution**:
  - The item `floating-action-menu` on 21st.dev declares dependencies on `framer-motion` and `lucide-react`.
  - Thorough inspection of the `ant-design` GitHub organization (all 100 repositories) confirmed no repository contains `floating-action-menu`.
  - It is an orphaned/misattributed community snippet uploaded to 21st.dev without an open-source repository link or license grant.

## Packet Preparation
- Exact upstream sources for the 6 `antd` components captured under `ops/phase-e-pinned/antdesign/source/4a39f54842eade4e565ab336ef6097cd7e723cdd/`.
- Clean component and demo source for `floating-action-menu` captured under `ops/phase-e-pinned/antdesign/source/21st/`.
- HigherBits demo wrappers created under `ops/phase-e-pinned/antdesign/demos/`.
- Standalone HTML previews and Playwright PNG renderings stored in `ops/phase-e-pinned/antdesign/preview/`.
- Self-contained GHL exports saved under `ops/phase-e-pinned/antdesign/ghl/`.
- Ten prompt flavors (`sitebrew`, `v0`, `lovable`, `bolt`, `extended`, `replit`, `magic_patterns`, `claude`, `codex`, `antigravity`) generated with Antigravity Gemini 3.8 Flash High and saved in `copy-prompts.json`.

## Disposition
- **Status**: ALL ITEMS HELD (0 ready, 7 held)
- **Primary Hold Reasons**:
  - `monorepo_library_dependencies_uninstalled` (6 items: breadcrumb, button-ant, dropdown, float-button, menu-1, pagination-ant)
  - `unmapped_source_repository` (1 item: floating-action-menu)
