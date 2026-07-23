import { CodeSandbox } from "@codesandbox/sdk"

export const codesandboxSdk = new CodeSandbox(process.env.CSB_API_KEY!)

export const DEFAULT_TEMPLATE = "21st-vite"

export const TEMPLATES = {
  "21st-vite": "d5t2cg",
}

// Seeded into every new sandbox's src/demo.tsx (overrides the template default)
// so the preview renders on a dark backdrop and default components (e.g. the
// white-snow component) are visible out of the box. MUST stay an object export:
// the template's app.tsx renders demos via `Object.entries(default)`, so a bare
// `export default function` would render nothing.
export const DEFAULT_DEMO_TSX = `import { Component } from "@/components/ui/component";

const DemoOne = () => (
  <div style={{ minHeight: "100vh", background: "#0b1020" }}>
    <Component />
  </div>
);

export default { DemoOne };
`

// Keep the VM warm longer between edits so refreshes don't repeatedly land on a
// waking VM (which serves a blank preview until its dev server recompiles).
// Trade-off: a warmer VM burns more VM credits. 300s matches CSB's free default.
export const DEFAULT_HIBERNATION_TIMEOUT = 300
