import React from "react"
import { Icons } from "@/components/icons"
import { PROMPT_TYPES, PromptType } from "@/types/global"
import { PromptRule } from "@/types/prompt-rules"
import endent from "endent"
import { uniq } from "lodash"
import { Sparkles } from "lucide-react"

interface PromptOptionBase {
  type: "option"
  id: string
  label: string
  description: string
  action: "copy" | "open"
  icon: React.ReactElement
}

interface PromptSeparator {
  type: "separator"
  id: string
}

type PromptOption = PromptOptionBase | PromptSeparator

export const promptOptions: PromptOption[] = [
  {
    type: "option",
    id: PROMPT_TYPES.GOHIGHLEVEL,
    label: "GoHighLevel",
    description: "Raw HTML/JS for GoHighLevel",
    action: "copy",
    icon: (
      <Icons.goHighLevelLogo className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
    ),
  },
  {
    id: "separator1",
    type: "separator",
  },
  {
    type: "option",
    id: PROMPT_TYPES.BOLT,
    label: "Bolt.new",
    description: "Optimized for Bolt.new",
    action: "copy",
    icon: (
      <Icons.boltLogo className="min-h-[22px] min-w-[22px] max-h-[22px] max-w-[22px]" />
    ),
  },
  {
    type: "option",
    id: PROMPT_TYPES.EXTENDED,
    label: "Cursor (or any AI IDE)",
    description: "Works with any AI IDE",
    action: "copy",
    icon: (
      <Icons.cursorIcon className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
    ),
  },
  {
    type: "option",
    id: PROMPT_TYPES.LOVABLE,
    label: "Lovable",
    description: "Optimized for Lovable.dev",
    action: "copy",
    icon: (
      <Icons.lovableLogo className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
    ),
  },
  {
    type: "option",
    id: PROMPT_TYPES.V0,
    label: "v0 by Vercel",
    description: "Optimized for v0.dev",
    action: "copy",
    icon: (
      <Icons.v0Logo className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
    ),
  },
  {
    type: "option",
    id: PROMPT_TYPES.REPLIT,
    label: "Replit",
    description: "Optimized for Replit Agent",
    action: "copy",
    icon: (
      <Icons.replit className="min-h-[22px] min-w-[22px] max-h-[22px] max-w-[22px]" />
    ),
  },
  {
    type: "option",
    id: PROMPT_TYPES.MAGIC_PATTERNS,
    label: "Magic Patterns",
    description: "Optimized for Magic Patterns",
    action: "copy",
    icon: (
      <Icons.magicPatterns className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
    ),
  },
  {
    type: "option",
    id: PROMPT_TYPES.SITEBREW,
    label: "sitebrew.ai",
    description: "Optimized for sitebrew.ai",
    action: "copy",
    icon: (
      <Icons.sitebrewLogo className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
    ),
  },
  {
    type: "option",
    id: PROMPT_TYPES.CLAUDE,
    label: "Claude",
    description: "Optimized for Claude",
    action: "copy",
    icon: (
      <Icons.claudeLogo className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
    ),
  },
  {
    type: "option",
    id: PROMPT_TYPES.CODEX,
    label: "Codex",
    description: "Optimized for Codex",
    action: "copy",
    icon: (
      <Icons.codexLogo className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
    ),
  },
  {
    type: "option",
    id: PROMPT_TYPES.ANTIGRAVITY,
    label: "Antigravity",
    description: "Optimized for Antigravity",
    action: "copy",
    icon: (
      <Icons.antigravityLogo className="min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]" />
    ),
  },
]

export type { PromptOption, PromptOptionBase }

export const getComponentInstallPrompt = ({
  promptType,
  codeFileName,
  demoCodeFileName,
  code,
  demoCode,
  registryDependencies,
  npmDependencies,
  npmDependenciesOfRegistryDependencies,
  tailwindConfig,
  globalCss,
  promptRule,
  userAdditionalContext,
  indexCss,
}: {
  promptType: PromptType
  codeFileName: string
  demoCodeFileName: string
  code: string
  demoCode: string
  npmDependencies: Record<string, string>
  registryDependencies: Record<string, string>
  npmDependenciesOfRegistryDependencies: Record<string, string>
  tailwindConfig?: string
  globalCss?: string
  promptRule?: PromptRule
  userAdditionalContext?: string
  indexCss?: string
}) => {
  const componentFileName = codeFileName.split("/").slice(-1)[0]
  const componentDemoFileName = demoCodeFileName.split("/").slice(-1)[0]

  const allDependencies = uniq([
    ...Object.keys(npmDependencies || {}),
    ...Object.keys(npmDependenciesOfRegistryDependencies || {}),
  ]).filter(Boolean)

  const renderRegistryDeps = (heading: string = "### Registry Dependencies (Helper Components):") => {
    if (!registryDependencies || Object.keys(registryDependencies).length === 0) return ""
    return (
      `\n${heading}\n` +
      Object.entries(registryDependencies)
        .map(
          ([fileName, fileContent]) => endent`
            \`\`\`tsx
            // ${fileName}
            ${fileContent}
            \`\`\`
          `,
        )
        .join("\n\n") +
      "\n"
    )
  }

  const renderStylesBlock = () => {
    let styles = ""
    if (tailwindConfig) {
      styles +=
        "\n### Tailwind Configuration Extension (`tailwind.config.js` or `tailwind.config.ts`):\n" +
        endent`
          \`\`\`js
          ${tailwindConfig}
          \`\`\`
        ` +
        "\n"
    }
    if (indexCss) {
      styles +=
        "\n### Tailwind 4 / Index CSS (`index.css` or `globals.css`):\n" +
        endent`
          \`\`\`css
          ${indexCss}
          \`\`\`
        ` +
        "\n"
    }
    if (globalCss) {
      styles +=
        "\n### Global CSS Styles (`globals.css`):\n" +
        endent`
          \`\`\`css
          ${globalCss}
          \`\`\`
        ` +
        "\n"
    }
    return styles
  }

  const renderPromptRuleBlock = () => {
    let ruleText = ""
    if (promptRule) {
      if (promptRule.tech_stack && promptRule.tech_stack.length > 0) {
        ruleText += `\n**Project Tech Stack**: ${promptRule.tech_stack.map((t) => `${t.name}${t.version ? ` ${t.version}` : ""}`).join(", ")}\n`
      }
      if (promptRule.theme) {
        if (promptRule.theme.colors && Object.keys(promptRule.theme.colors).length > 0) {
          ruleText += `\n**Custom Theme Colors**:\n\`\`\`json\n${JSON.stringify(promptRule.theme.colors, null, 2)}\n\`\`\`\n`
        }
        if (promptRule.theme.spacing && Object.keys(promptRule.theme.spacing).length > 0) {
          ruleText += `\n**Custom Spacing**:\n\`\`\`json\n${JSON.stringify(promptRule.theme.spacing, null, 2)}\n\`\`\`\n`
        }
      }
      if (promptRule.additional_context) {
        ruleText += `\n**Additional Rule Context**:\n${promptRule.additional_context}\n`
      }
    }
    if (userAdditionalContext) {
      ruleText += `\n**User Instructions / Context**:\n${userAdditionalContext}\n`
    }
    return ruleText
  }

  // 1. Antigravity Agent
  if (promptType === PROMPT_TYPES.ANTIGRAVITY) {
    let prompt = endent`
      # Antigravity Task: Integrate React Component into Workspace

      You are Antigravity, an agentic AI coding assistant. Your task is to autonomously integrate this React component into the current workspace codebase using your available tools.

      ## Autonomous Workflow:
      1. **Inspect Workspace Context**:
         - Determine the component directory structure (e.g. \`components/ui/\`, \`src/components/ui/\`, or \`components/\`).
         - Detect the active package manager from lockfiles (\`pnpm\`, \`npm\`, \`yarn\`, or \`bun\`).
         - Check the styling configuration (Tailwind v3 in \`tailwind.config.{js,ts}\` or Tailwind v4 in \`globals.css\` / \`index.css\`).

      2. **Write Component Files**:
         - Use \`write_to_file\` to create the component at \`components/ui/${componentFileName}\` (or the project's corresponding path) with the complete implementation below.
         - If any registry dependencies are provided, write each helper file to its proper path.
         - Create or update an example showcase page/view using the demo code below so the component can be tested immediately.

      3. **Install Dependencies**:
         - Run the installation command via \`run_command\`:
           \`\`\`bash
           ${allDependencies.length ? `npm install ${allDependencies.join(" ")}  # (adapt to detected pnpm / yarn / bun)` : "# No external dependencies required"}
           \`\`\`

      4. **Configure Styling & Animations**:
         - If custom keyframes, animations, or Tailwind extensions are specified below, use \`replace_file_content\` to merge them into the project's Tailwind config or CSS file.

      5. **Verification**:
         - Verify zero TypeScript or lint errors.
         - Ensure all icon imports (e.g. from \`lucide-react\`) and helper utilities resolve cleanly.

      ---

      ### Component Code (\`${componentFileName}\`):
      \`\`\`tsx
      ${code}
      \`\`\`

      ### Demo Usage (\`${componentDemoFileName}\`):
      \`\`\`tsx
      ${demoCode}
      \`\`\`
    `

    prompt += renderRegistryDeps("### Registry Dependencies (Helper Components):")
    if (allDependencies.length) {
      prompt +=
        "\n### Required NPM Packages:\n" +
        endent`
          \`\`\`bash
          ${allDependencies.join(", ")}
          \`\`\`
        ` +
        "\n"
    }
    prompt += renderStylesBlock()
    prompt += renderPromptRuleBlock()

    return prompt.trim()
  }

  // 2. Cursor (or any AI IDE)
  if (promptType === PROMPT_TYPES.EXTENDED) {
    let prompt = endent`
      Integrate the following React component into the codebase using Cursor Composer or your AI IDE.

      ## Composer Instructions:
      1. Create the component file at \`@components/ui/${componentFileName}\` (or your project's standard component directory).
      2. Install the necessary NPM dependencies:
         \`\`\`bash
         ${allDependencies.length ? `npm install ${allDependencies.join(" ")}` : "# No external dependencies required"}
         \`\`\`
      3. If custom Tailwind extensions, keyframes, or CSS variables are listed below, apply them to \`tailwind.config.js\` or \`globals.css\`.
      4. Review the demo usage to integrate and render the component with its appropriate props.
      5. Generate all code completely without placeholders, abbreviations, or omitted lines.

      ### Component Code (\`${componentFileName}\`):
      \`\`\`tsx
      ${code}
      \`\`\`

      ### Demo Usage (\`${componentDemoFileName}\`):
      \`\`\`tsx
      ${demoCode}
      \`\`\`
    `

    prompt += renderRegistryDeps()
    if (allDependencies.length) {
      prompt += `\n### Dependencies:\n\`\`\`bash\n${allDependencies.join(" ")}\n\`\`\`\n`
    }
    prompt += renderStylesBlock()
    prompt += renderPromptRuleBlock()

    return prompt.trim()
  }

  // 3. Bolt.new
  if (promptType === PROMPT_TYPES.BOLT) {
    let prompt = endent`
      Add and integrate this React component into the Bolt.new project.

      ## Bolt.new Setup Instructions:
      1. **Component File**: Create \`src/components/ui/${componentFileName}\` with the complete component code below.
      2. **Install Dependencies**: In the WebContainer terminal, install the required packages:
         \`\`\`bash
         ${allDependencies.length ? `npm install ${allDependencies.join(" ")}` : "# No extra packages required"}
         \`\`\`
      3. **Tailwind & Styles**: Merge any Tailwind extensions or CSS rules below into \`tailwind.config.js\` or \`src/index.css\`.
      4. **Preview**: Integrate the demo usage into \`src/App.tsx\` (or your current active route) so the component renders in the preview pane.
      5. **Full Fidelity**: Output all files in full without placeholders or truncated sections.

      ### Component Code (\`${componentFileName}\`):
      \`\`\`tsx
      ${code}
      \`\`\`

      ### Demo Usage (\`${componentDemoFileName}\`):
      \`\`\`tsx
      ${demoCode}
      \`\`\`
    `

    prompt += renderRegistryDeps()
    if (allDependencies.length) {
      prompt += `\n### Dependencies:\n\`\`\`bash\n${allDependencies.join(" ")}\n\`\`\`\n`
    }
    prompt += renderStylesBlock()
    prompt += renderPromptRuleBlock()

    return prompt.trim()
  }

  // 4. Lovable
  if (promptType === PROMPT_TYPES.LOVABLE) {
    let prompt = endent`
      Integrate the following React component into this Lovable project.

      ## Lovable Implementation Steps:
      1. **Component File**: Create \`src/components/ui/${componentFileName}\` with the complete code below.
      2. **Dependencies**: Ensure the following packages are installed:
         \`\`\`bash
         ${allDependencies.length ? `npm i ${allDependencies.join(" ")}` : "# No extra packages required"}
         \`\`\`
      3. **Tailwind Config**: Extend \`tailwind.config.ts\` and \`src/index.css\` with the animations, colors, and keyframes provided below.
      4. **Showcase on Index**: Import and render the component in \`src/pages/Index.tsx\` using the demo code below.
      5. **Design Fidelity**: Preserve all interactive state, micro-interactions, responsive classes, and full TypeScript types.

      ### Component Code (\`${componentFileName}\`):
      \`\`\`tsx
      ${code}
      \`\`\`

      ### Demo Usage (\`${componentDemoFileName}\`):
      \`\`\`tsx
      ${demoCode}
      \`\`\`
    `

    prompt += renderRegistryDeps()
    if (allDependencies.length) {
      prompt += `\n### Dependencies:\n\`\`\`bash\n${allDependencies.join(" ")}\n\`\`\`\n`
    }
    prompt += renderStylesBlock()
    prompt += renderPromptRuleBlock()

    return prompt.trim()
  }

  // 5. v0 by Vercel
  if (promptType === PROMPT_TYPES.V0) {
    let prompt = endent`
      Create a modern, interactive React component using Next.js App Router, Tailwind CSS, and shadcn/ui.

      ## v0 Prompt Requirements:
      - Build a self-contained, previewable implementation based on the component and demo below.
      - Use \`lucide-react\` for icons and standard Tailwind utility classes.
      - Ensure the component is fully interactive, accessible, and responsive across all viewports.
      - Render an interactive preview showing the component in action with realistic sample data.

      ### Component Implementation:
      \`\`\`tsx
      // ${componentFileName}
      ${code}
      \`\`\`

      ### Demo Usage:
      \`\`\`tsx
      // ${componentDemoFileName}
      ${demoCode}
      \`\`\`
    `

    prompt += renderRegistryDeps()
    if (allDependencies.length) {
      prompt += `\n### Required Dependencies:\n\`\`\`bash\n${allDependencies.join(" ")}\n\`\`\`\n`
    }
    prompt += renderStylesBlock()
    prompt += renderPromptRuleBlock()

    return prompt.trim()
  }

  // 6. Claude
  if (promptType === PROMPT_TYPES.CLAUDE) {
    let prompt = endent`
      Please integrate the following React component into the codebase.

      ## Instructions:
      1. Provide the complete code for the component without placeholders, \`// ... rest of code\`, or omissions.
      2. Recommend placing the component in \`components/ui/${componentFileName}\` (or the appropriate modular directory).
      3. Specify the terminal command to install any required dependencies:
         \`\`\`bash
         ${allDependencies.length ? `npm install ${allDependencies.join(" ")}` : "# No external dependencies required"}
         \`\`\`
      4. Detail any required Tailwind configuration extensions or CSS variables needed for styling/animations.
      5. If executing in Claude Code CLI, create the files and execute the install commands directly.

      ### Component Code (\`${componentFileName}\`):
      \`\`\`tsx
      ${code}
      \`\`\`

      ### Demo Usage (\`${componentDemoFileName}\`):
      \`\`\`tsx
      ${demoCode}
      \`\`\`
    `

    prompt += renderRegistryDeps()
    if (allDependencies.length) {
      prompt += `\n### Dependencies:\n\`\`\`bash\n${allDependencies.join(" ")}\n\`\`\`\n`
    }
    prompt += renderStylesBlock()
    prompt += renderPromptRuleBlock()

    return prompt.trim()
  }

  // 7. Codex
  if (promptType === PROMPT_TYPES.CODEX) {
    let prompt = endent`
      # Codex Task: React Component Integration

      Implement and integrate the following React component into the codebase.

      ## Specifications:
      1. Target path: \`components/ui/${componentFileName}\` (or project equivalent).
      2. Dependencies to install:
         \`\`\`bash
         ${allDependencies.length ? `npm install ${allDependencies.join(" ")}` : "# No external dependencies required"}
         \`\`\`
      3. Apply any required Tailwind CSS animations or custom styles from the configuration block below.
      4. Wire up the component according to the provided demo usage.
      5. Ensure strict TypeScript types and complete code output without abbreviations.

      ### Component Code (\`${componentFileName}\`):
      \`\`\`tsx
      ${code}
      \`\`\`

      ### Demo Usage (\`${componentDemoFileName}\`):
      \`\`\`tsx
      ${demoCode}
      \`\`\`
    `

    prompt += renderRegistryDeps()
    if (allDependencies.length) {
      prompt += `\n### Dependencies:\n\`\`\`bash\n${allDependencies.join(" ")}\n\`\`\`\n`
    }
    prompt += renderStylesBlock()
    prompt += renderPromptRuleBlock()

    return prompt.trim()
  }

  // 8. Replit
  if (promptType === PROMPT_TYPES.REPLIT) {
    let prompt = endent`
      Build and integrate this component as my prototype in Replit.

      ## Replit Agent Instructions:
      1. Add the component file to \`client/src/components/ui/${componentFileName}\` (or the project's frontend component directory).
      2. Install the necessary dependencies:
         \`\`\`bash
         ${allDependencies.length ? `npm install ${allDependencies.join(" ")}` : "# No external dependencies required"}
         \`\`\`
      3. Add any required Tailwind extensions or keyframes to \`tailwind.config.js\` or \`globals.css\`.
      4. Connect the demo usage into the active page so it can be previewed immediately in the Replit Webview.
      5. Output every line of code in full without placeholders.

      ### Component Code (\`${componentFileName}\`):
      \`\`\`tsx
      ${code}
      \`\`\`

      ### Demo Usage (\`${componentDemoFileName}\`):
      \`\`\`tsx
      ${demoCode}
      \`\`\`
    `

    prompt += renderRegistryDeps()
    if (allDependencies.length) {
      prompt += `\n### Dependencies:\n\`\`\`bash\n${allDependencies.join(" ")}\n\`\`\`\n`
    }
    prompt += renderStylesBlock()
    prompt += renderPromptRuleBlock()

    return prompt.trim()
  }

  // 9. Magic Patterns
  if (promptType === PROMPT_TYPES.MAGIC_PATTERNS) {
    let prompt = endent`
      Take the following code of a React component and add it to the design.

      ${componentFileName}:
      \`\`\`tsx
      ${code}
      \`\`\`

      Here is an example of how to use the component:
      \`\`\`tsx
      ${componentDemoFileName}
      ${demoCode}
      \`\`\`
    `

    prompt += renderRegistryDeps("Copy-paste these files for dependencies:")
    if (allDependencies.length) {
      prompt += `\nInstall these NPM dependencies:\n\`\`\`bash\n${allDependencies.join(", ")}\n\`\`\`\n`
    }
    prompt += renderStylesBlock()
    prompt += "\n" + endent`
      IMPORTANT:
        - Modify the component as needed to fit the existing codebase + design
        - Extend the tailwind.config.js and index.css if needed to include additional variables or styles
        - You MUST create all mentioned files in full, without abbreviations. Do not use placeholders like "insert the rest of the code here"
    `
    prompt += renderPromptRuleBlock()

    return prompt.trim()
  }

  // 10. sitebrew.ai
  if (promptType === PROMPT_TYPES.SITEBREW) {
    let prompt = endent`
      Take the following code of a react component and add it to the artifact.

      ${componentFileName}:
      \`\`\`tsx
      ${code}
      \`\`\`

      ${componentDemoFileName}:
      \`\`\`tsx
      ${demoCode}
      \`\`\`
    `

    prompt += renderRegistryDeps()
    prompt += "\nREMEMBER TO KEEP THE DESIGN AND FUNCTIONALITY OF THE COMPONENT AS IS AND IN FULL\n"
    prompt += renderStylesBlock()
    prompt += renderPromptRuleBlock()

    return prompt.trim()
  }

  // 11. GoHighLevel (HTML conversion guidance fallback)
  if (promptType === PROMPT_TYPES.GOHIGHLEVEL) {
    let prompt =
      "Convert the following React component and its demo into a production-ready GoHighLevel HTML snippet.\n\n" +
      endent`
        CRITICAL INSTRUCTIONS:
        1. Output a single, consolidated HTML block containing the component and the trigger from the demo.
        2. WRAPPER CONTAINER: GHL users expect the component to be a self-contained widget exactly like the preview. DO NOT let small components (like tabs or separators) stretch elongated across the whole page. If the component is a small block, use \`w-fit mx-auto\` or a fixed \`max-w-md\`. 
        3. KEEP the component's internal styling (like \`px-4\`, \`py-2\`, \`gap-4\`, etc.) fully intact.
        4. Include \`<script src="https://cdn.tailwindcss.com"></script>\` at the top.
        5. CRITICAL: You MUST disable Tailwind's global preflight to prevent it from destroying the host GHL site's CSS: \`<script>tailwind.config = { corePlugins: { preflight: false }, theme: { /* variables */ } }</script>\`.
        6. SCOPED PREFLIGHT & CARD: Because global preflight is disabled, components like \`<hr>\` or \`<a>\` will look broken unless you provide a scoped reset. Wrap your ENTIRE component in this exact container to make it an intact card widget: \`<div class="ghl-component-wrapper bg-background text-left text-base font-sans text-foreground antialiased w-fit mx-auto border border-border rounded-xl p-6 shadow-sm">\`. Then, inject this exact \`<style>\` block to reset styles locally:
        \`\`\`css
        .ghl-component-wrapper *, .ghl-component-wrapper *::before, .ghl-component-wrapper *::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: hsl(var(--border, 214.3 31.8% 91.4%)); }
        .ghl-component-wrapper hr { height: 0; color: inherit; border-top-width: 1px; margin: 0; }
        .ghl-component-wrapper a { color: inherit; text-decoration: inherit; }
        .ghl-component-wrapper button, .ghl-component-wrapper [role="button"] { cursor: pointer; background: transparent; padding: 0; }
        .ghl-component-wrapper h1, .ghl-component-wrapper h2, .ghl-component-wrapper h3, .ghl-component-wrapper h4, .ghl-component-wrapper h5, .ghl-component-wrapper h6, .ghl-component-wrapper p { margin: 0; font-size: inherit; font-weight: inherit; }
        .ghl-component-wrapper ul, .ghl-component-wrapper ol { list-style: none; margin: 0; padding: 0; }
        .ghl-component-wrapper svg { display: block; }
        \`\`\`
        7. Include a \`<style>\` block defining Shadcn default CSS variables (like \`--background\`, \`--primary\`) so the colors actually work. Add an HTML comment above the wrapper explaining: \`<!-- To use Dark Mode, add the 'dark' class to the ghl-component-wrapper div below -->\`.
        8. Convert all React hooks/state into vanilla JavaScript. Use relative DOM traversal (e.g., \`onclick="this.nextElementSibling..."\` or \`this.closest(...)\`) instead of \`getElementById\` to avoid script conflicts if the user duplicates the element in the GHL builder.
      ` +
      "\n\n"

    prompt +=
      "\n" +
      endent`
        Component Code (${componentFileName}):
        \`\`\`tsx
        ${code}
        \`\`\`

        Demo Usage (${componentDemoFileName}):
        \`\`\`tsx
        ${demoCode}
        \`\`\`
      `

    prompt += renderRegistryDeps()
    prompt += renderStylesBlock()
    prompt += renderPromptRuleBlock()

    return prompt.trim()
  }

  // Fallback default
  return endent`
    Integrate the following React component into the codebase.

    ### Component Code (${componentFileName}):
    \`\`\`tsx
    ${code}
    \`\`\`

    ### Demo Usage (${componentDemoFileName}):
    \`\`\`tsx
    ${demoCode}
    \`\`\`
  `
}
