import { CodeSandbox } from "@codesandbox/sdk"

export const codesandboxSdk = new CodeSandbox(process.env.CSB_API_KEY!)

export const DEFAULT_TEMPLATE = "21st-vite"

export const TEMPLATES = {
  "21st-vite": "d5t2cg",
}

// Seeded into every new sandbox's src/demo.tsx (overrides the template default)
// so the preview renders on a dark backdrop and default components are visible
// out of the box. Notes:
//   - MUST stay an object export: the template's app.tsx renders demos via
//     `Object.entries(default)`, so a bare `export default function` renders
//     nothing.
//   - `color: #fafafa` makes descendant text light via inheritance (the default
//     component uses no explicit text color), and `className="dark"` activates
//     index.css's dark theme for any component that uses theme tokens.
export const DEFAULT_DEMO_TSX = `import { Component } from "@/components/ui/component";

const DemoOne = () => (
  <div
    className="dark"
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0b1020",
      color: "#fafafa",
    }}
  >
    <Component />
  </div>
);

export default { DemoOne };
`

// Seeded into every new sandbox's src/components/ui/component.tsx. Same as the
// template placeholder, but with an explicit light text color so it stays
// readable on the dark demo backdrop even if the demo wrapper is edited.
export const DEFAULT_COMPONENT_TSX = `// This is file of your component

// You can use any dependencies from npm; we import them automatically in package.json
import { useState } from "react";
import { cn } from "@/lib/utils";

import { FaBeer } from "react-icons/fa";

const Button = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
    >
      {children}
    </button>
  );
};

export const Component = () => {
  const [count, setCount] = useState(0);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/5 text-white",
      )}
    >
      <h1 className="text-2xl font-bold mb-2">Component Example</h1>
      <FaBeer />
      <h2 className="text-xl font-semibold">{count}</h2>
      <div className="flex gap-2">
        <Button onClick={() => setCount((prev) => prev - 1)}>-</Button>
        <Button onClick={() => setCount((prev) => prev + 1)}>+</Button>
      </div>
    </div>
  );
};
`

// Keep the VM warm longer between edits so refreshes don't repeatedly land on a
// waking VM (which serves a blank preview until its dev server recompiles).
// Trade-off: a warmer VM burns more VM credits. 300s matches CSB's free default.
export const DEFAULT_HIBERNATION_TIMEOUT = 300
