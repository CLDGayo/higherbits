export const DEFAULT_TEMPLATE = "21st-vite";

export const TEMPLATES = {
  "21st-vite": "d5t2cg",
};

export const DEFAULT_DEMO_TSX = `// This is a file with a demo for your component
// That's what users will see in the preview
// Create new files in this directory to add more demos

import { Component } from "@/components/ui/component";

// The sandbox template requires an object export for demos to render correctly
export default {
  DemoOne: function DemoOne() {
    return <Component />;
  }
};
`;

export const DEFAULT_DEFAULT_TSX = `// This is a file with a demo for your component
// That's what users will see in the preview
// Creates new files in this directory to add more demos

import { Component } from "@/components/ui/component";

// ONLY DEFAULT EXPORT WILL BE TREATED AS A DEMO
export default function DemoOne() {
  return <Component />;
}
`;

export const DEFAULT_COMPONENT_TSX = `// This is file of your component
// You can use any dependencies from npm; we import them automatically in package.json

import { cn } from "@/lib/utils";
import { useState } from "react";

export const Component = () => {
  const [count, setCount] = useState(0);

  return (
    <div className={cn("flex flex-col items-center gap-4 p-4 rounded-lg")}>
      <h1 className="text-2xl font-bold mb-2">Component Example</h1>
      <h2 className="text-xl font-semibold">{count}</h2>
      <div className="flex gap-2">
        <button onClick={() => setCount((prev) => prev - 1)}>-</button>
        <button onClick={() => setCount((prev) => prev + 1)}>+</button>
      </div>
    </div>
  );
};
`;

export const DEFAULT_INDEX_CSS = `/* This is Tailwind 4 CSS file */
/* Extending Tailwind configuration */
/* Use shadcn/ui format to extend the configuration */
/* Add only the styles that your component needs */

/* Base imports */
@import "tailwindcss";

/* Custom dark variant for targeting dark mode elements */
@custom-variant dark (&:is(.dark *));

/* CSS variables and theme definitions */
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

/* Light theme variables */
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

/* Dark theme variables */
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

/* Tailwind base styles */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;

// Default hibernation timeout: 60 seconds after disconnect.
//
// Lowered from 300s as part of the CodeSandbox credit-burn fix — every VM
// billing for 5 idle minutes after each disconnect was a large share of the
// measured burn. Raise it per-host with CSB_HIBERNATION_TIMEOUT if 60s proves
// too eager; no code change needed.
export const DEFAULT_HIBERNATION_TIMEOUT =
  Number(process.env.CSB_HIBERNATION_TIMEOUT) || 60;

export const DEFAULT_PACKAGE_JSON = JSON.stringify(
  {
    name: "react-vite-ts",
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      "install-and-dev": "pnpm install && pnpm dev",
      build: "tsc && vite build",
      "generate:registry":
        'node scripts/generate-registry.cjs && shadcn build && echo "FINISH"',
    },
    dependencies: {
      "@radix-ui/react-slot": "^1.2.0",
      "@tailwindcss/vite": "^4.1.4",
      "class-variance-authority": "^0.7.1",
      clsx: "^2.1.1",
      "lucide-react": "^0.503.0",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
      "react-icons": "^5.1.1",
      "tailwind-merge": "^3.2.0",
      tailwindcss: "^4.1.4",
    },
    devDependencies: {
      "@babel/parser": "^7.27.0",
      "@babel/traverse": "^7.27.0",
      "@hiogawa/vite-plugin-error-overlay": "^0.0.1",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      "@vitejs/plugin-react": "^4.3.4",
      shadcn: "latest",
      "tw-animate-css": "^1.2.8",
      typescript: "^5.7.2",
      vite: "^6.0.3",
      "vite-plugin-singlefile": "^2.2.0",
    },
  },
  null,
  2,
);

export const DEFAULT_TASKS_JSON = JSON.stringify(
  {
    setupTasks: [
      {
        name: "Install Dependencies",
        command: "pnpm install",
      },
    ],
    tasks: {
      install: {
        name: "install dependencies",
        command: "pnpm install",
      },
      dev: {
        name: "dev",
        command: "pnpm run install-and-dev",
        runAtStart: true,
        preview: {
          port: 5173,
        },
        restartOn: {
          files: ["package.json"],
        },
      },
      "generate:registry": {
        name: "generate registry",
        command: "pnpm generate:registry",
        runAtStart: false,
      },
      build: {
        name: "build",
        command: "pnpm build",
        runAtStart: false,
      },
      preview: {
        name: "preview",
        command: "pnpm preview",
        runAtStart: false,
      },
    },
  },
  null,
  2,
);

export const DEFAULT_VITE_CONFIG_TS = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { vitePluginErrorOverlay } from "@hiogawa/vite-plugin-error-overlay";
import { viteSingleFile } from "vite-plugin-singlefile";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), vitePluginErrorOverlay(), viteSingleFile()],
  server: {
    hmr: {
      overlay: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
`;

export const DEFAULT_INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
    <script>
      (function() {
        try {
          var params = new URLSearchParams(window.location.search);
          var t = params.get("theme");
          if (t === "dark") {
            document.documentElement.classList.add("dark");
          } else if (t === "light") {
            document.documentElement.classList.remove("dark");
          }
        } catch (e) {}
      })();
      // Theme bridge: listen for theme-change messages from the parent studio
      window.addEventListener("message", function(e) {
        if (e.data && e.data.type === "theme-change") {
          var root = document.documentElement;
          if (e.data.theme === "dark") {
            root.classList.add("dark");
          } else {
            root.classList.remove("dark");
          }
        }
      });
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

export const DEFAULT_TSCONFIG_JSON = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
`;

export const DEFAULT_MAIN_TSX = `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import "./index.css";

// Listen for theme-change messages from the parent studio window
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "theme-change") {
    const root = document.documentElement;
    if (event.data.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

export const DEFAULT_APP_TSX = `// This is a infrastructure component that renders demos
// Please do not modify this file

import React, { useState, useEffect } from "react";
import DemoComponents from "./demo";

function App() {
  const [controlProps, setControlProps] = useState({});

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "controls-change") {
        setControlProps(event.data.controls || {});
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (typeof DemoComponents === "function") {
    const Demo = DemoComponents as React.ComponentType<any>;
    return <Demo {...controlProps} />;
  }

  if (DemoComponents && typeof DemoComponents === "object") {
    if (typeof (DemoComponents as any).default === "function") {
      const Demo = (DemoComponents as any).default;
      return <Demo {...controlProps} />;
    }
    return (
      <>
        {Object.entries(DemoComponents).map(([name, Component]) => {
          const Comp = Component as React.ComponentType<any>;
          return <Comp key={name} {...controlProps} />;
        })}
      </>
    );
  }

  return null;
}

export default App;
`;

export const DEFAULT_UTILS_TS = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

export const DEFAULT_VITE_ENV_D_TS = `/// <reference types="vite/client" />\n`;

export const DEFAULT_TSCONFIG_NODE_JSON = JSON.stringify(
  {
    compilerOptions: {
      composite: true,
      skipLibCheck: true,
      module: "ESNext",
      moduleResolution: "bundler",
      allowSyntheticDefaultImports: true,
    },
    include: ["vite.config.ts"],
  },
  null,
  2,
);

export const DEFAULT_COMPONENTS_JSON = JSON.stringify(
  {
    $schema: "https://ui.shadcn.com/schema.json",
    style: "new-york",
    rsc: false,
    tsx: true,
    tailwind: {
      config: "",
      css: "src/index.css",
      baseColor: "neutral",
      cssVariables: true,
      prefix: "",
    },
    aliases: {
      components: "@/components",
      utils: "@/lib/utils",
      ui: "@/components/ui",
      lib: "@/lib",
      hooks: "@/hooks",
    },
    iconLibrary: "lucide",
  },
  null,
  2,
);

export const DEFAULT_SCRIPTS_GENERATE_REGISTRY_CJS = `const path = require("path");
const { generateRegistry } = require("./lib/registry-builder.cjs");

// Define paths
const componentsDir = path.resolve(__dirname, "../src/components/ui");
const demoFilePath = path.resolve(__dirname, "../src/demo.tsx");
const registryPath = path.resolve(__dirname, "../registry.json");
const packageJsonPath = path.resolve(__dirname, "../package.json");

// Run the main function
generateRegistry({
  componentsDir,
  demoFilePath,
  registryPath,
  packageJsonPath,
})
  .then(() => {
    // Ensure process exits cleanly
    process.exitCode = 0;
  })
  .catch((err) => {
    console.error("Error generating registry:", err);
    process.exit(1);
  });
`;

export const DEFAULT_SCRIPTS_COMPONENT_UTILS_CJS = `const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const fs = require("fs");
const { getLatestPackageVersion } = require("./package-utils.cjs");

/**
 * Extracts external dependencies from a component file
 */
async function getExternalDependencies(filePath) {
  const dependencies = new Set();
  const code = fs.readFileSync(filePath, "utf-8");

  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    const importSources = [];
    traverse(ast, {
      ImportDeclaration({ node }) {
        const source = node.source.value;
        if (
          !source.startsWith(".") &&
          !source.startsWith("/") &&
          !source.startsWith("@/")
        ) {
          importSources.push(source);
        }
      },
    });

    // First pass - basic package determination for compatibility
    for (const source of importSources) {
      let packageName = source;
      const parts = source.split("/");
      if (source.startsWith("@") && parts.length > 1) {
        packageName = \`\${parts[0]}/\${parts[1]}\`;
      } else if (!source.startsWith("@") && parts.length > 0) {
        packageName = parts[0];
      }
      dependencies.add(packageName);
    }

    // Second pass - validate with npm registry (with a reasonable timeout)
    const validationPromises = importSources.map((source) =>
      Promise.race([
        getLatestPackageVersion(source),
        new Promise((resolve) => setTimeout(() => resolve(null), 10000)),
      ])
    );

    const results = await Promise.all(validationPromises);

    for (const result of results) {
      if (result) {
        dependencies.add(result.packageName);
      }
    }
  } catch (error) {
    console.error(\`Error parsing \${filePath}:\`, error);
  }

  return Array.from(dependencies);
}

/**
 * Gets component files from the components directory
 */
function getComponentFiles(componentsDir) {
  if (!fs.existsSync(componentsDir)) {
    console.warn(\`Components directory not found: \${componentsDir}\`);
    return [];
  }

  return fs
    .readdirSync(componentsDir)
    .filter(
      (file) =>
        (file.endsWith(".tsx") || file.endsWith(".jsx")) &&
        file !== "index.ts" &&
        file !== "index.js"
    );
}

module.exports = {
  getExternalDependencies,
  getComponentFiles,
};
`;

export const DEFAULT_SCRIPTS_PACKAGE_UTILS_CJS = `const https = require("https");
const fs = require("fs");
const path = require("path");

/**
 * Validates and resolves package name by checking npm registry
 */
async function getLatestPackageVersion(packageName) {
  return new Promise((resolve, reject) => {
    if (
      !packageName ||
      packageName.startsWith(".") ||
      packageName.startsWith("/")
    ) {
      return resolve(null);
    }

    let potentialPackageName = packageName;
    const checkPackage = (name) => {
      const req = https.get(
        \`https://registry.npmjs.org/\${name}\`,
        { timeout: 5000 },
        (res) => {
          if (res.statusCode === 200) {
            res.resume();
            resolve({ packageName: name });
          } else if (res.statusCode === 404) {
            res.resume();
            const lastSlashIndex = potentialPackageName.lastIndexOf("/");
            if (lastSlashIndex !== -1) {
              potentialPackageName = potentialPackageName.substring(
                0,
                lastSlashIndex
              );
              checkPackage(potentialPackageName);
            } else {
              resolve(null);
            }
          } else {
            res.resume();
            resolve(null);
          }
        }
      );

      req.on("error", () => resolve(null));
      req.on("timeout", () => {
        req.destroy();
        resolve(null);
      });
      req.end();
    };

    checkPackage(potentialPackageName);
  });
}

/**
 * Checks if dependencies exist in package.json and warns about missing ones
 */
function checkMissingDependencies(packageJsonPath, dependencies) {
  if (!fs.existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const existingDeps = new Set([
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {}),
  ]);

  const missingDeps = [...dependencies].filter((dep) => !existingDeps.has(dep));

  if (missingDeps.length > 0) {
    console.warn(\`
Warning: The following dependencies found in components might be missing from package.json:\`);
    missingDeps.forEach((dep) => console.warn(\`- \${dep}\`));
    console.warn(\`Consider running 'pnpm add \${missingDeps.join(" ")}'\`);
  }
}

module.exports = {
  getLatestPackageVersion,
  checkMissingDependencies,
};
`;

export const DEFAULT_SCRIPTS_REGISTRY_BUILDER_CJS = `const fs = require("fs");
const path = require("path");
const {
  getExternalDependencies,
  getComponentFiles,
} = require("./component-utils.cjs");
const { checkMissingDependencies } = require("./package-utils.cjs");

/**
 * Generates component registry item
 */
function createRegistryItem(
  componentName,
  filePath,
  dependencies,
  excludedDependencies
) {
  // Filter out excluded dependencies before adding to the registry item
  const filteredDependencies = dependencies.filter(
    (dep) => !excludedDependencies.has(dep)
  );

  return {
    name: componentName,
    type: "registry:component",
    title: componentName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    description: \`A \${componentName} component.\`,
    dependencies: filteredDependencies,
    files: [
      {
        path: \`src/components/ui/\${path.basename(filePath)}\`,
        type: "registry:component",
      },
    ],
  };
}

/**
 * Main function to generate the registry
 */
async function generateRegistry(options) {
  const { componentsDir, demoFilePath, registryPath, packageJsonPath } =
    options;
  const registryItems = [];
  let allDependencies = new Set();

  // Define dependencies to always exclude from component's dependency list
  const excludedDependencies = new Set(["react", "react-dom"]);

  // Process UI Components
  const componentFiles = getComponentFiles(componentsDir);

  for (const file of componentFiles) {
    const filePath = path.join(componentsDir, file);
    const componentName = path.basename(file, path.extname(file));
    const dependencies = await getExternalDependencies(filePath);

    dependencies.forEach((dep) => allDependencies.add(dep));

    const registryItem = createRegistryItem(
      componentName,
      filePath,
      dependencies,
      excludedDependencies
    );
    registryItems.push(registryItem);
  }

  // Process Demo File
  if (demoFilePath && fs.existsSync(demoFilePath)) {
    const demoName = path.basename(demoFilePath, path.extname(demoFilePath)); // e.g., 'demo'
    const demoDependencies = await getExternalDependencies(demoFilePath);

    demoDependencies.forEach((dep) => allDependencies.add(dep));

    const filteredDemoDependencies = demoDependencies.filter(
      (dep) => !excludedDependencies.has(dep)
    );

    // Create registry item for the demo
    const demoRegistryItem = {
      name: demoName,
      // Using 'registry:block' as type allows multiple files if needed later
      type: "registry:block",
      title: "Demo",
      description: "Component demo preview.",
      dependencies: filteredDemoDependencies,
      files: [
        {
          // Path relative to project root for registry consumption
          path: path.relative(path.dirname(registryPath), demoFilePath),
          type: "registry:component", // Type for the file itself within the block
        },
      ],
    };
    registryItems.push(demoRegistryItem);
    console.log(\`Processed demo file: \${path.basename(demoFilePath)}\`);
  } else if (demoFilePath) {
    console.warn(\`Demo file not found: \${demoFilePath}\`);
  }

  const registryContent = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "21s-registry",
    homepage: "https://21s.dev",
    items: registryItems,
  };

  fs.writeFileSync(registryPath, JSON.stringify(registryContent, null, 2));
  console.log(\`Registry generated successfully at \${registryPath}\`);

  // Check for missing dependencies in package.json (includes demo deps now)
  checkMissingDependencies(packageJsonPath, allDependencies);
}

module.exports = {
  generateRegistry,
};
`;



