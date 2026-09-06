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
    id: PROMPT_TYPES.BOLT,
    label: "Bolt.new (Partnership)",
    description: "Optimized for Bolt.new",
    action: "copy",
    icon: (
      <Icons.boltLogo className="min-h-[22px] min-w-[22px] max-h-[22px] max-w-[22px]" />
    ),
  },
  {
    id: "separator1",
    type: "separator",
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

  let prompt = ""

  if (promptType === PROMPT_TYPES.GOHIGHLEVEL) {
    prompt =
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

    if (promptRule) {
      if (promptRule.tech_stack && promptRule.tech_stack.length > 0) {
        prompt += `Tech Stack: ${promptRule.tech_stack.map(t => `${t.name}${t.version ? ` ${t.version}` : ""}`).join(", ")}\n`
      }
      if (promptRule.additional_context) {
        prompt += `Prompt Rule Context: ${promptRule.additional_context}\n`
      }
    }
    if (userAdditionalContext) {
      prompt += `User Context: ${userAdditionalContext}\n`
    }

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

    return prompt.trim()
  }

  if (promptType === PROMPT_TYPES.MAGIC_PATTERNS) {
    prompt =
      "Take the following code of a React component and add it to the design.\n" +
      endent`        
        ${componentFileName}
        ${code}
      ` +
      "\n Here is an example of how to use the component:\n" +
      endent`
        ${componentDemoFileName}
        ${demoCode}
      ` +
      "\n"

    if (tailwindConfig) {
      prompt +=
        "\n" +
        endent`
        Extend the existing tailwind.config.js (or create a new one if non-existent) with this code:
        \`\`\`js
        ${tailwindConfig}
        \`\`\`
      ` +
        "\n"
    }

    if (globalCss) {
      prompt +=
        "\n" +
        endent`
        Extend the existing index.css (or create a new one if non-existent) with this code:
        \`\`\`css
        ${globalCss}
        \`\`\`
      ` +
        "\n"
    }

    if (Object.keys(registryDependencies || {}).length > 0) {
      prompt +=
        "\n" +
        endent`
        Copy-paste these files for dependencies:
        ${Object.entries(registryDependencies)
          .map(
            ([fileName, fileContent]) => endent`
            \`\`\`tsx
            ${fileName}
            ${fileContent}
            \`\`\`
          `,
          )
          .join("\n")}
      ` +
        "\n"
    }

    prompt +=
      "\n" +
      endent`
        IMPORTANT:
          - Modify the component as needed to fit the existing codebase + design
          - Extend the tailwind.config.js and index.css if needed to include additional variables or styles
          - You MUST create all mentioned files in full, without abbreviations. Do not use placeholders like "insert the rest of the code here"
      `

    // Apply prompt rule if provided
    if (promptRule) {
      // Add tech stack from prompt rule
      if (promptRule.tech_stack && promptRule.tech_stack.length > 0) {
        const techStackString = promptRule.tech_stack
          .map(
            (tech) => `${tech.name}${tech.version ? ` ${tech.version}` : ""}`,
          )
          .join(", ")

        prompt += `\n\nProject Tech Stack: ${techStackString}`
      }

      // Add theme configuration from prompt rule
      if (promptRule.theme) {
        // Override tailwind config if provided in the prompt rule
        if (promptRule.theme.tailwindConfig) {
          tailwindConfig = promptRule.theme.tailwindConfig
        }

        // Override global CSS if provided in the prompt rule
        if (promptRule.theme.globalCss) {
          globalCss = promptRule.theme.globalCss
        }

        // Add custom colors if provided
        if (
          promptRule.theme.colors &&
          Object.keys(promptRule.theme.colors).length > 0
        ) {
          prompt += `\n\nCustom Colors: ${JSON.stringify(promptRule.theme.colors, null, 2)}`
        }

        // Add custom spacing if provided
        if (
          promptRule.theme.spacing &&
          Object.keys(promptRule.theme.spacing).length > 0
        ) {
          prompt += `\n\nCustom Spacing: ${JSON.stringify(promptRule.theme.spacing, null, 2)}`
        }
      }

      // Add additional context from prompt rule
      if (promptRule.additional_context) {
        prompt += `\n\nAdditional Context: ${promptRule.additional_context}`
      }
    }

    return prompt
  }

  if (promptType === PROMPT_TYPES.REPLIT) {
    prompt += "Build this as my initial prototype\n\n"
  }

  if (promptType === PROMPT_TYPES.SITEBREW) {
    prompt +=
      "Take the following code of a react component and add it to the artifact.\n" +
      endent`        
        ${componentFileName}
        ${code}
        ${componentDemoFileName}
        ${demoCode}
      ` +
      "\n"

    if (Object.keys(registryDependencies || {}).length > 0) {
      prompt +=
        "\n" +
        endent`
        ${Object.entries(registryDependencies)
          .map(
            ([fileName, fileContent]) => endent`
            -------
            ${fileName}
            ${fileContent}
          `,
          )
          .join("\n")}
      ` +
        "\n"
    }
    prompt +=
      "\n" +
      endent`
        REMEMBER TO KEEP THE DESIGN AND FUNCTIONALITY OF THE COMPONENT AS IS AND IN FULL 
      ` +
      "\n"

    // Add prompt rule and additional context for SITEBREW
    if (promptRule) {
      if (promptRule.tech_stack?.length) {
        const techStack = promptRule.tech_stack
          .map(
            (tech) => `${tech.name}${tech.version ? ` ${tech.version}` : ""}`,
          )
          .join(", ")
        prompt +=
          "\n\nPlease use the following technologies in your implementation: " +
          techStack
      }

      if (promptRule.theme) {
        if (promptRule.theme.tailwindConfig) {
          prompt +=
            "\n\nFor context, here is the current Tailwind configuration being used: " +
            promptRule.theme.tailwindConfig
        }
        if (promptRule.theme.globalCss) {
          prompt +=
            "\n\nFor context, here are the global CSS styles being used: " +
            promptRule.theme.globalCss
        }
        if (promptRule.theme.colors) {
          const colors = Object.entries(promptRule.theme.colors)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n")
          prompt += "\n\nPlease use these custom color values: \n" + colors
        }
        if (promptRule.theme.spacing) {
          const spacing = Object.entries(promptRule.theme.spacing)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n")
          prompt += "\n\nPlease use these custom spacing values: \n" + spacing
        }
      }

      if (promptRule.additional_context) {
        prompt +=
          "\n\nAdditional important context to consider: " +
          promptRule.additional_context
      }
    }

    return prompt
  }

  if (
    [
      PROMPT_TYPES.EXTENDED,
      PROMPT_TYPES.BOLT,
      PROMPT_TYPES.CLAUDE,
      PROMPT_TYPES.CODEX,
      PROMPT_TYPES.ANTIGRAVITY,
      PROMPT_TYPES.V0,
      PROMPT_TYPES.LOVABLE,
    ].includes(promptType as any)
  ) {
    prompt +=
      endent`
        You are given a task to integrate an existing React component in the codebase

        The codebase should support:
        - shadcn project structure  
        - Tailwind CSS
        - Typescript

        If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

        Determine the default path for components and styles. 
        If default path for components is not /components/ui, provide instructions on why it's important to create this folder
      ` + "\n"
  }

  prompt +=
    "Copy-paste this component to /components/ui folder:\n" +
    endent`
      \`\`\`tsx
      ${componentFileName}
      ${code}

      ${componentDemoFileName}
      ${demoCode}
      \`\`\`
    ` +
    "\n"

  if (Object.keys(registryDependencies || {}).length > 0) {
    prompt +=
      "\n" +
      endent`
        Copy-paste these files for dependencies:
        ${Object.entries(registryDependencies)
          .map(
            ([fileName, fileContent]) => endent`
            \`\`\`tsx
            ${fileName}
            ${fileContent}
            \`\`\`
          `,
          )
          .join("\n")}
      ` +
      "\n"
  }

  const allDependencies = uniq([
    ...Object.keys(npmDependencies),
    ...Object.keys(npmDependenciesOfRegistryDependencies),
  ])
  if (allDependencies.length) {
    const dependenciesPrompt =
      promptType === PROMPT_TYPES.REPLIT
        ? "Install these NPM dependencies:"
        : "Install NPM dependencies:"

    prompt +=
      "\n" +
      endent`
        ${dependenciesPrompt}
        \`\`\`bash
        ${allDependencies.join(", ")}
        \`\`\`
      ` +
      "\n"
  }

  if (tailwindConfig) {
    prompt +=
      "\n" +
      endent`
        Extend existing tailwind.config.js with this code:
        \`\`\`js
        ${tailwindConfig}
        \`\`\`
      ` +
      "\n"
  }

  if (indexCss) {
    prompt +=
      "\n" +
      endent`
        Extend existing Tailwind 4 index.css with this code (or if project uses Tailwind 3, extend tailwind.config.js or globals.css):
        \`\`\`css
        ${indexCss}
        \`\`\`
      ` +
      "\n"
  }

  if (globalCss) {
    prompt +=
      "\n" +
      endent`
        Extend existing globals.css with this code:
        \`\`\`css
        ${globalCss}
        \`\`\`
      ` +
      "\n"
  }

  if (
    [
      PROMPT_TYPES.EXTENDED,
      PROMPT_TYPES.BOLT,
      PROMPT_TYPES.CLAUDE,
      PROMPT_TYPES.CODEX,
      PROMPT_TYPES.ANTIGRAVITY,
      PROMPT_TYPES.V0,
      PROMPT_TYPES.LOVABLE,
    ].includes(promptType as any)
  ) {
    prompt +=
      "\n" +
      endent`

        Implementation Guidelines
        1. Analyze the component structure and identify all required dependencies
        2. Review the component's argumens and state
        3. Identify any required context providers or hooks and install them
        4. Questions to Ask
        - What data/props will be passed to this component?
        - Are there any specific state management requirements?
        - Are there any required assets (images, icons, etc.)?
        - What is the expected responsive behavior?
        - What is the best place to use this component in the app?

       Steps to integrate
        0. Copy paste all the code above in the correct directories
        1. Install external dependencies
        2. Fill image assets with Unsplash stock images you know exist
        3. Use lucide-react icons for svgs or logos if component requires them
      ` +
      "\n"
  }

  // Add prompt rule and additional context for all other prompt types
  if (promptRule) {
    if (promptRule.tech_stack?.length) {
      const techStack = promptRule.tech_stack
        .map((tech) => `${tech.name}${tech.version ? ` ${tech.version}` : ""}`)
        .join(", ")
      prompt +=
        "\n\nPlease use the following technologies in your implementation: " +
        techStack
    }

    if (promptRule.theme) {
      if (promptRule.theme.tailwindConfig) {
        prompt +=
          "\n\nFor context, here is the current Tailwind configuration being used: " +
          promptRule.theme.tailwindConfig
      }
      if (promptRule.theme.globalCss) {
        prompt +=
          "\n\nFor context, here are the global CSS styles being used: " +
          promptRule.theme.globalCss
      }
      if (promptRule.theme.colors) {
        const colors = Object.entries(promptRule.theme.colors)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")
        prompt += "\n\nPlease use these custom color values: \n" + colors
      }
      if (promptRule.theme.spacing) {
        const spacing = Object.entries(promptRule.theme.spacing)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")
        prompt += "\n\nPlease use these custom spacing values: \n" + spacing
      }
    }

    if (promptRule.additional_context) {
      prompt +=
        "\n\nAdditional important context to consider: " +
        promptRule.additional_context
    }

    // Add user's additional context if provided
    if (userAdditionalContext) {
      prompt += "\n\nUser Additional Context:\n" + userAdditionalContext
    }

    if (promptType === PROMPT_TYPES.REPLIT) {
      prompt +=
        "\n" +
        endent`
        Remember: For the code above, not change the component's code unless it's required to integrate or the user asks you to.
        IMPORTANT: The code above contains the initial prototype desired by the user. Create all mentioned files in full, without abbreviations. Do not use placeholders like "insert the rest of the code here" – output every line of code exactly as it is, so it can be copied and pasted directly into the project.
      `
    } else {
      prompt +=
        "\n" +
        endent`
        Remember: Do not change the component's code unless it's required to integrate or the user asks you to.
        IMPORTANT: Create all mentioned files in full, without abbreviations. Do not use placeholders like "insert the rest of the code here" – output every line of code exactly as it is, so it can be copied and pasted directly into the project.
      `
    }
  }

  return prompt
}
