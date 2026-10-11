# Dependency & License Review: abui

- **Upstream Repository**: `https://github.com/antoniobrandao/abui`
- **Revision**: `243b80762b57311b8eda498979838f61b46a613e`
- **License Status**: Fail-closed hold (`"private": true` in `package.json`, no `LICENSE` file found).
- **Component Dependencies**:
  - `animated-chart`: `motion/react`
  - `scroll-reveal-content-a`: `next/image`, `motion/react` (tight framework coupling)
  - `timeline`: `@radix-ui/react-slot`, `@dnd-kit/core`, `tunnel-rat` (uninstalled dependencies)
- **Disposition**: Held per INGESTION_SOP §1 fail-closed license safeguard.
