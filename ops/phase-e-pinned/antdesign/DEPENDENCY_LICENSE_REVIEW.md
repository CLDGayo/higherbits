# Dependency & License Review: antdesign

- **Creator**: `antdesign` (Ant Design)
- **Profile**: `https://21st.dev/@antdesign`
- **Repository**: `https://github.com/ant-design/ant-design`
- **Revision**: `4a39f54842eade4e565ab336ef6097cd7e723cdd`
- **License**: MIT License (`LICENSE`, SHA-256 `3c82654bb472ebbcacc4c1ff00f94aa8c60c4b7ee011b16bafcbacecc3703458`)
- **Evaluation Date**: 2026-10-11
- **Evaluation Agent**: Antigravity Gemini 3.8 Flash High

## Item Breakdown

| Slug | Title | Upstream Path | Dependencies | Status | Concrete Hold Reason |
|---|---|---|---|---|---|
| `breadcrumb` | Breadcrumb | `components/breadcrumb/Breadcrumb.tsx` | `antd`, `@rc-component/util`, `@ant-design/cssinjs` | HELD | `monorepo_library_dependencies_uninstalled` |
| `button-ant` | Button Ant | `components/button/Button.tsx` | `antd`, `@ant-design/cssinjs` | HELD | `monorepo_library_dependencies_uninstalled` |
| `dropdown` | Dropdown | `components/dropdown/dropdown.tsx` | `antd`, `@ant-design/icons`, `rc-dropdown` | HELD | `monorepo_library_dependencies_uninstalled` |
| `float-button` | FloatButton | `components/float-button/FloatButton.tsx` | `antd`, `@ant-design/cssinjs` | HELD | `monorepo_library_dependencies_uninstalled` |
| `floating-action-menu` | Floating Action Menu | Unmapped (`source/21st/floating-action-menu.tsx`) | `framer-motion`, `lucide-react` | HELD | `unmapped_source_repository` |
| `menu-1` | Menu | `components/menu/menu.tsx` | `antd`, `@rc-component/menu`, `@ant-design/icons` | HELD | `monorepo_library_dependencies_uninstalled` |
| `pagination-ant` | Pagination Ant | `components/pagination/Pagination.tsx` | `antd`, `rc-pagination` | HELD | `monorepo_library_dependencies_uninstalled` |

## Review Summary
1. **Permissive License Pass**: `ant-design/ant-design` is properly licensed under MIT.
2. **Monorepo Coupling**: Six of the components are integral parts of the `antd` monolithic library and are not standalone copy-paste components. They cannot function without installing `antd` and its associated runtime packages, which are not present in HigherBits.
3. **Unmapped Snippet**: `floating-action-menu` is an isolated community snippet on 21st.dev without an upstream git repository or explicit license grant.
4. **Final Recommendation**: All 7 candidate items are held per INGESTION_SOP §1-§3. No items qualify for immediate production publication.
