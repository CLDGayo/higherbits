# Creator Review: abui

## Profile Information
- **Creator Handle**: `abui`
- **Creator Name**: `abui`
- **Sheet Row**: 52
- **21st Profile**: `https://21st.dev/@abui`
- **Website**: `https://abui.io`
- **Repository**: `https://github.com/antoniobrandao/abui`
- **Revision**: `243b80762b57311b8eda498979838f61b46a613e`
- **License**: Unasserted / Private (`package.json` has `"private": true`, no `LICENSE` file)
- **Evaluated Items (3)**: `animated-chart`, `scroll-reveal-content-a`, `timeline`

## Investigation Evidence
- Public GitHub query located upstream repository `antoniobrandao/abui` (homepage `https://abui.io`).
- Component source files identified under `registry/abui/marketing/animated-chart.tsx`, `registry/abui/marketing/scroll-reveal-content-a.tsx`, and `registry/abui/ui/timeline.tsx`.
- Root `package.json` explicitly specifies `"private": true` with no SPDX license identifier or license file. Under copyright law and INGESTION_SOP §1, this lacks permissive open-source redistribution rights.
- Furthermore, `scroll-reveal-content-a` couples directly to `next/image` with unbundled images, and `timeline` requires uninstalled peer packages `@dnd-kit/core` and `tunnel-rat`.

## Disposition
- **Status**: HELD (3 items)
- **Hold Reason**: `unasserted_private_source_license`
