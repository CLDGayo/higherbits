import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, join } from 'node:path'
import { createRequire } from 'node:module'

const hash = b => createHash('sha256').update(b).digest('hex')
const root = resolve('.')
const web = join(root, 'apps/web')
const requireWeb = createRequire(join(web, 'package.json'))
const esbuild = createRequire(createRequire(requireWeb.resolve('vite-tsconfig-paths')).resolve('vite'))('esbuild')
const bundleFile = join(web, `.tmp-build-copy-prompts-${process.pid}.cjs`)

let render
try {
  esbuild.buildSync({
    stdin: {
      contents: 'export { getComponentInstallPrompt } from "@/lib/prompts"; export { PROMPT_TYPES } from "@/types/global";',
      resolveDir: web,
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    alias: { '@': web },
    outfile: bundleFile,
    logLevel: 'silent',
  })
  render = requireWeb(bundleFile)
} finally {
  if (existsSync(bundleFile)) unlinkSync(bundleFile)
}

const promptTypes = Object.values(render.PROMPT_TYPES).filter(t => t !== render.PROMPT_TYPES.GOHIGHLEVEL)

// --- 1. 8starlabs open-in-chat ---
const src8 = readFileSync('ops/phase-e-pinned/8starlabs/source/9633e2fa89cdea2da40a81d69ef484ff04d0de63/registry/8starlabs-ui/blocks/open-in-chat.tsx')
const demo8 = readFileSync('ops/phase-e-pinned/8starlabs/demos/open-in-chat.tsx')
const aiIcons8 = readFileSync('ops/phase-e-pinned/8starlabs/source/9633e2fa89cdea2da40a81d69ef484ff04d0de63/registry/8starlabs-ui/ui/ai-icons.tsx', 'utf8')
const lic8 = readFileSync('ops/phase-e-pinned/8starlabs/LICENSE', 'utf8')

const guidance8 = "OpenInChat is a versatile client-side React component that opens a pre-filled prompt in leading conversational AI platforms, including ChatGPT, Claude, Perplexity, Grok, and v0. It supports two primary presentation layouts: a standard dropdown menu triggered by an accessible button, and a compact horizontal bar containing standalone provider icon links. The component handles dynamic URL encoding and query parameter construction for each provider (using 'q' or provider-specific parameters). It provides customizable triggers, tooltips, alignments, and direct provider helper components (OpenInChatGPT, OpenInClaude, OpenInPerplexity, OpenInGrok, OpenInV0). Direct dependencies include lucide-react and simple-icons for provider brand SVGs. The component integrates seamlessly with standard Tailwind CSS and shadcn/ui primitives (Button, DropdownMenu, Tooltip). For installation, place open-in-chat.tsx under your components directory alongside the ai-icons.tsx helper, ensure Tailwind and Radix UI primitives are configured, and pass the target prompt string to the OpenInChat component."

const prompts8 = {}
for (const pt of promptTypes) {
  const p = render.getComponentInstallPrompt({
    promptType: pt,
    codeFileName: 'open-in-chat.tsx',
    componentInstallPath: 'components/auto-index/open-in-chat.tsx',
    demoCodeFileName: 'demo.tsx',
    code: src8.toString('utf8'),
    demoCode: demo8.toString('utf8'),
    registryDependencies: { 'registry/8starlabs-ui/ui/ai-icons.tsx': aiIcons8 },
    npmDependencies: ['lucide-react', 'simple-icons'],
    npmDependenciesOfRegistryDependencies: ['lucide-react', 'simple-icons'],
    tailwindConfig: '',
    globalCss: '',
    indexCss: '',
    userAdditionalContext: '',
  })
  prompts8[pt] = `${p}\n\n### Reviewed component details\n${guidance8}\n\n### Upstream License (MIT) — retain with the component\n${lic8.trim()}\n\nKeep this exact license notice together with the component file(s) wherever you copy them; do not remove or alter it.`
}

const copyPrompts8Path = 'ops/phase-e-pinned/8starlabs/copy-prompts.json'
const cp8 = existsSync(copyPrompts8Path) ? JSON.parse(readFileSync(copyPrompts8Path, 'utf8')) : {}
cp8['open-in-chat'] = {
  sourceSha256: hash(src8),
  demoSha256: hash(demo8),
  prompts: prompts8,
  ...prompts8,
}
writeFileSync(copyPrompts8Path, JSON.stringify(cp8, null, 2) + '\n')
console.log('Saved 8starlabs copy-prompts.json with open-in-chat')

// --- 2. Alwurts chat-input and tool ---
const licAl = readFileSync('ops/phase-e-pinned/alwurts/LICENSE', 'utf8')

const srcAlChat = readFileSync('ops/phase-e-pinned/alwurts/source/2d8292d0ed173727ef88501997f6bcc33773a648/packages/registry/registry/ui/chat-input.tsx')
const demoAlChat = readFileSync('ops/phase-e-pinned/alwurts/demos/chat-input.tsx')
const guidanceAlChat = "ChatInput is an advanced, accessible chat interface component built with the Tiptap rich-text editor engine and Tailwind CSS. It is tailored for modern conversational AI interfaces, featuring an expandable multi-line text editor with placeholder support, interactive @ mention suggestion autocompletion (with configurable trigger, mention item lists, and keyboard navigation), and real-time streaming status management. The input is modularly constructed using InputGroup primitives, supporting flexible addon slots for mention buttons, clear controls, and submit action triggers. Direct dependencies include @tiptap/core, @tiptap/react, @tiptap/starter-kit, @tiptap/extension-mention, @tiptap/extension-placeholder, @tiptap/suggestion, the Vercel AI SDK ('ai') for ChatStatus types, and lucide-react for UI iconography. For installation, add chat-input.tsx to your components directory, ensure Tiptap extensions and peer dependencies are installed, and wrap the component inside your chat interface form with onSubmit and status bindings."

const promptsAlChat = {}
for (const pt of promptTypes) {
  const p = render.getComponentInstallPrompt({
    promptType: pt,
    codeFileName: 'chat-input.tsx',
    componentInstallPath: 'components/auto-index/alwurts-chat-input/chat-input.tsx',
    demoCodeFileName: 'demo.tsx',
    code: srcAlChat.toString('utf8'),
    demoCode: demoAlChat.toString('utf8'),
    registryDependencies: {},
    npmDependencies: [
      '@tiptap/core',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-mention',
      '@tiptap/extension-placeholder',
      '@tiptap/suggestion',
      'ai',
      'lucide-react',
    ],
    npmDependenciesOfRegistryDependencies: [],
    tailwindConfig: '',
    globalCss: '',
    indexCss: '',
    userAdditionalContext: '',
  })
  promptsAlChat[pt] = `${p}\n\n### Reviewed component details\n${guidanceAlChat}\n\n### Upstream License (MIT) — retain with the component\n${licAl.trim()}\n\nKeep this exact license notice together with the component file(s) wherever you copy them; do not remove or alter it.`
}

const srcAlTool = readFileSync('ops/phase-e-pinned/alwurts/source/2d8292d0ed173727ef88501997f6bcc33773a648/packages/registry/registry/ui/tool.tsx')
const demoAlTool = readFileSync('ops/phase-e-pinned/alwurts/demos/tool.tsx')
const guidanceAlTool = "Tool is a structured, collapsible UI component designed for displaying AI agent tool invocations, function executions, and structured execution outputs within a conversational interface. Built with Radix UI Collapsible primitives and Tailwind CSS, it visualizes execution states through distinct status indicators: 'input-available' (in-progress/running state with animated spinner), 'output-available' (successful execution with checkmark badge), and 'output-error' (execution failure with error alert badge). The component is composed of Tool, ToolHeader, ToolContent, ToolInput, and ToolOutput subcomponents. ToolHeader renders readable tool titles and parameters, while ToolInput and ToolOutput present formatted JSON arguments and return values with syntax styling, error message blocks, and record count summaries. Direct dependencies include the Vercel AI SDK ('ai') for ToolUIPart typing and lucide-react for ChevronDown and status icons. For installation, place tool.tsx in your components directory, ensure Radix Collapsible and Tailwind are configured, and feed structured tool invocation events from your AI SDK chat loop into the Tool wrapper."

const promptsAlTool = {}
for (const pt of promptTypes) {
  const p = render.getComponentInstallPrompt({
    promptType: pt,
    codeFileName: 'tool.tsx',
    componentInstallPath: 'components/auto-index/alwurts-tool/tool.tsx',
    demoCodeFileName: 'demo.tsx',
    code: srcAlTool.toString('utf8'),
    demoCode: demoAlTool.toString('utf8'),
    registryDependencies: {},
    npmDependencies: ['ai', 'lucide-react'],
    npmDependenciesOfRegistryDependencies: [],
    tailwindConfig: '',
    globalCss: '',
    indexCss: '',
    userAdditionalContext: '',
  })
  promptsAlTool[pt] = `${p}\n\n### Reviewed component details\n${guidanceAlTool}\n\n### Upstream License (MIT) — retain with the component\n${licAl.trim()}\n\nKeep this exact license notice together with the component file(s) wherever you copy them; do not remove or alter it.`
}

const cpAl = {
  'chat-input': {
    sourceSha256: hash(srcAlChat),
    demoSha256: hash(demoAlChat),
    prompts: promptsAlChat,
    ...promptsAlChat,
  },
  tool: {
    sourceSha256: hash(srcAlTool),
    demoSha256: hash(demoAlTool),
    prompts: promptsAlTool,
    ...promptsAlTool,
  },
}

writeFileSync('ops/phase-e-pinned/alwurts/copy-prompts.json', JSON.stringify(cpAl, null, 2) + '\n')
console.log('Saved Alwurts copy-prompts.json for chat-input and tool')
