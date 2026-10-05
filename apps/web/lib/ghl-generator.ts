import { createHash } from "node:crypto"
import OpenAI from "openai"
import endent from "endent"
import { load } from "cheerio"

const GHL_ALLOWED_TAGS = new Set([
  "a", "article", "aside", "b", "blockquote", "br", "button", "canvas", "code", "dd", "del", "details", "div", "dl", "dt", "em",
  "fieldset", "figcaption", "figure", "footer", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "i", "img", "label", "legend",
  "li", "main", "mark", "ol", "p", "path", "polygon", "polyline", "rect", "circle", "ellipse", "line", "g", "defs",
  "lineargradient", "radialgradient", "stop", "svg", "section", "small", "span", "strong", "style", "summary", "table", "tbody",
  "td", "th", "thead", "tr", "u", "ul", "use",
])
const GHL_REMOVE_SUBTREE_TAGS = new Set([
  "base", "embed", "form", "iframe", "input", "link", "meta", "object", "option", "script", "select", "set", "textarea", "foreignobject",
  "animate", "animatemotion", "animatetransform", "title",
])
const GHL_SVG_PRESENTATION_URL_ATTRIBUTES = new Set([
  "fill", "filter", "clip-path", "mask", "marker-start", "marker-mid", "marker-end", "stroke", "cursor",
])

function sanitizeGhlCss(value: string): string {
  return value
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove CSS escapes before checking resource syntax so escaped `url`/`@import`
    // spellings cannot bypass the conservative resource allowlist.
    .replace(/\\(?:[0-9a-f]{1,6}\s?|[\r\n\f]|.)/gi, "")
    .replace(/@import\b[^;]*(?:;|$)/gi, "")
    .replace(/(?:-webkit-)?image-set\s*\([^)]*\)/gi, "")
    .replace(/url\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi, (_match, doubleQuoted, singleQuoted, unquoted) => {
      const resource = String(doubleQuoted ?? singleQuoted ?? unquoted ?? "").trim()
      return /^#[a-zA-Z0-9_.:-]{1,128}$/.test(resource) ? `url(${resource})` : ""
    })
    // Fail closed for malformed or unbalanced URL functions too.
    .replace(/url\s*\((?:(?!\)).)*$/gi, "")
    .replace(/expression\s*\([^)]*\)/gi, "")
    .replace(/(?:javascript|vbscript)\s*:/gi, "")
    .replace(/-moz-binding\s*:[^;}]*/gi, "")
    .replace(/behavior\s*:[^;}]*/gi, "")
}

function hasOnlyLocalSvgUrlReferences(value: string): boolean {
  const decoded = value
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\\([0-9a-f]{1,6})\s?|\\([\r\n\f])|\\(.)/gi, (_match, hex, newline, escaped) => {
      if (hex) {
        const codePoint = Number.parseInt(hex, 16)
        return String.fromCodePoint(codePoint > 0 && codePoint <= 0x10ffff ? codePoint : 0xfffd)
      }
      return newline ? "" : escaped ?? ""
    })
  const urlCount = decoded.match(/url\s*\(/gi)?.length ?? 0
  if (!urlCount) return true
  if (value.includes("\\")) return false
  return (sanitizeGhlCss(value).match(/url\s*\(/gi)?.length ?? 0) === urlCount
}

/** Sanitizes generated markup before persistence or copy; it is never executed in the app. */
export function sanitizeGhlHtml(markup: string): string {
  const $ = load(markup, {}, false)
  for (const element of $.root().find("*").toArray()) {
    const node = $(element)
    const tag = element.tagName.toLowerCase()
    if (GHL_REMOVE_SUBTREE_TAGS.has(tag)) {
      node.remove()
      continue
    }
    if (!GHL_ALLOWED_TAGS.has(tag)) {
      node.replaceWith(node.contents())
      continue
    }
    if (tag === "style") node.text(sanitizeGhlCss(node.text()))
    for (const [name, rawValue] of Object.entries(element.attribs)) {
      const value = rawValue ?? ""
      const lowerName = name.toLowerCase()
      if (lowerName.startsWith("on") || ["action", "background", "formaction", "poster", "srcdoc", "srcset", "target", "download", "ping"].includes(lowerName)) {
        node.removeAttr(name)
        continue
      }
      if (GHL_SVG_PRESENTATION_URL_ATTRIBUTES.has(lowerName) && !hasOnlyLocalSvgUrlReferences(value)) {
        node.removeAttr(name)
        continue
      }
      if (lowerName === "href" || lowerName === "xlink:href") {
        if (/^#[a-zA-Z0-9_.:-]{1,128}$/.test(value)) continue
        node.removeAttr(name)
        continue
      }
      if (lowerName === "src") {
        if (/^data:image\/(?:png|jpeg|gif|webp|avif);base64,[a-z0-9+/=]+$/i.test(value)) continue
        node.removeAttr(name)
        continue
      }
      if (lowerName === "style") node.attr(name, sanitizeGhlCss(value))
    }
  }
  return $.root().html()?.trim() ?? ""
}

/**
 * Robustly clean and extract raw embeddable HTML from model output.
 * Strips markdown code blocks, surrounding prose, and accidental document wrappers (<!DOCTYPE>, <html>, <body>).
 */
export function cleanGhlHtml(raw: string): string {
  let text = (raw || "").trim()

  if (!text || (!text.includes("<div") && !text.includes("<button") && !text.includes("<section") && !text.includes("<style") && !text.includes("<script"))) {
    return ""
  }

  // 1. Extract content from markdown code blocks if present
  const codeBlockMatch = text.match(/```(?:html|xml)?\s*([\s\S]*?)\s*```/i)
  if (codeBlockMatch && codeBlockMatch[1]) {
    text = codeBlockMatch[1].trim()
  } else {
    // Strip leading fence (e.g. ```html) and trailing fence (```) even if trailing fence was omitted
    text = text.replace(/^```[a-zA-Z0-9_-]*\s*/i, "").replace(/\s*```\s*$/i, "").trim()
  }

  // 2. If the model accidentally outputted full document tags (<!DOCTYPE html>, <html>, <head>, <body>),
  // extract and concatenate head content + body content to make it a valid embedded snippet
  if (/<!DOCTYPE/i.test(text) || /<html/i.test(text) || /<body/i.test(text)) {
    const headMatch = text.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i)

    if (bodyMatch && bodyMatch[1]) {
      const headContent = headMatch && headMatch[1] ? headMatch[1].trim() : ""
      const bodyContent = bodyMatch[1].trim()
      text = headContent ? `${headContent}\n${bodyContent}` : bodyContent
    } else {
      text = text
        .replace(/<!DOCTYPE[^>]*>/gi, "")
        .replace(/<\/?(?:html|head|body)[^>]*>/gi, "")
        .trim()
    }
  }

  // 3. Auto-heal any high-specificity button resets (replace with zero-specificity :where)
  text = text.replace(
    /\.ghl-component-wrapper\s+button,\s*\.ghl-component-wrapper\s+\[role=["']?button["']?\]\s*\{[^}]*background:\s*transparent[^}]*padding:\s*0[^}]*\}/gi,
    `:where(.ghl-component-wrapper) :where(button, [role="button"]) {
    cursor: pointer;
    background-color: transparent;
    background-image: none;
    border-style: solid;
    border-width: 0;
    padding: 0;
    color: inherit;
  }`
  )

  // 4b. Inject Shadcn semantic fallback utilities into style block so unmapped tokens never break layout
  if (!text.includes(".ghl-component-wrapper .bg-primary") && !text.includes(":where(.ghl-component-wrapper) .bg-primary") && text.includes("</style>")) {
    const shadcnFallbacks = `
    /* Shadcn Semantic Fallbacks for GoHighLevel */
    :where(.ghl-component-wrapper) .bg-primary { background-color: #f4f4f5 !important; color: #09090b !important; }
    :where(.ghl-component-wrapper) .text-primary-foreground { color: #09090b !important; }
    :where(.ghl-component-wrapper) .bg-secondary { background-color: rgba(24, 24, 27, 0.8) !important; color: #e4e4e7 !important; }
    :where(.ghl-component-wrapper) .text-secondary-foreground { color: #f4f4f5 !important; }
    :where(.ghl-component-wrapper) .border-border { border-color: rgba(63, 63, 70, 0.6) !important; }
    :where(.ghl-component-wrapper) .text-muted-foreground { color: #a1a1aa !important; }
    `
    text = text.replace("</style>", `${shadcnFallbacks}\n  </style>`)
  }

  // 5. Ensure .ghl-component-wrapper has isolation: isolate to protect stacking context
  if (text.includes(".ghl-component-wrapper {") && !text.includes("isolation: isolate;")) {
    text = text.replace(".ghl-component-wrapper {", ".ghl-component-wrapper {\n    isolation: isolate;")
  }

  // 6. Ensure font-family Inter is protected on the component wrapper and all children
  if (text.includes(".ghl-component-wrapper {") && !text.includes("font-family: 'Inter'") && !text.includes('font-family: "Inter"')) {
    text = text.replace(
      ".ghl-component-wrapper {",
      `.ghl-component-wrapper, .ghl-component-wrapper * {
    font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  }
  .ghl-component-wrapper {`
    )
  }

  // 7. Strip accidental/awkward split-screen viewport bleed blocks that cut across the hero (e.g. w-[100vw], -right-[50vw], -left-[50vw])
  text = text.replace(/<div[^>]*?(?:w-\[100vw\]|-right-\[50vw\]|-left-\[50vw\])[^>]*?>\s*(?:<\/div>)?/gi, "")

  // 8. Auto-heal unquoted inline string arguments in event handlers (e.g. new CustomEvent(fluid-trigger-burst) or window.open(https://...))
  text = text.replace(/new\s+CustomEvent\(\s*([a-zA-Z0-9_-]+)\s*\)/g, "new CustomEvent('$1')")
  text = text.replace(/window\.open\(\s*(https?:\/\/[^\s,)'"]+)\s*,\s*([_a-zA-Z0-9]+)\s*\)/g, "window.open('$1', '$2')")
  text = text.replace(/window\.open\(\s*(https?:\/\/[^\s,)'"]+)\s*\)/g, "window.open('$1')")

  // 9. Strip React ref leaks in vanilla script (e.g. updateKeywordsRef.current = ...)
  text = text.replace(/[a-zA-Z0-9_$]+Ref\.current\s*=\s*([^;]+);/g, "/* ref assignment stripped */")

  // 9b. Auto-heal any corrupted pressure FBO declarations
  text = text.replace(
    /let\s+pressure\s*=\s*[\d.]+\s*,\s*simRes\.height\s*,/g,
    "let pressure = createDoubleFBO(simRes.width, simRes.height,",
  )

  // 10. Auto-heal missing closing tags if accidentally omitted
  const openScripts = (text.match(/<script\b/gi) || []).length
  const closeScripts = (text.match(/<\/script>/gi) || []).length
  if (openScripts > closeScripts) {
    text += "\n</script>"
  }
  const openDivs = (text.match(/<div\b/gi) || []).length
  const closeDivs = (text.match(/<\/div>/gi) || []).length
  if (openDivs > closeDivs) {
    text += "\n" + "</div>".repeat(openDivs - closeDivs)
  }

  const sanitized = sanitizeGhlHtml(text.trim())
  const $ = load(sanitized, {}, false)
  if ($("#root").length && !$("#root").html()?.trim()) {
    $("style").remove()
    if (!$.root().text().trim() && !$("img, svg, video").length) return ""
  }
  return sanitized
}

export const GHL_TEMPLATE_VERSION = "higherbits-ghl-template-v3"
const GHL_PROVIDER_TIMEOUT_MS = 90_000
export const GHL_GENERATION_DEADLINE_MS = 100_000
const GHL_MAX_INPUT_BYTES = 2_097_152
const GHL_MAX_PROVIDER_RESPONSE_BYTES = 2_097_152
const GHL_MAX_OUTPUT_BYTES = 1_048_576

async function readGhlProviderResponseText(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length"))
  if (Number.isFinite(declaredLength) && declaredLength > GHL_MAX_PROVIDER_RESPONSE_BYTES) {
    await response.body?.cancel().catch(() => undefined)
    throw new Error("GHL provider response exceeds the supported byte limit")
  }

  const reader = response.body?.getReader()
  if (!reader) return ""
  const decoder = new TextDecoder()
  let byteLength = 0
  let text = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    byteLength += value.byteLength
    if (byteLength > GHL_MAX_PROVIDER_RESPONSE_BYTES) {
      await reader.cancel().catch(() => undefined)
      throw new Error("GHL provider response exceeds the supported byte limit")
    }
    text += decoder.decode(value, { stream: true })
  }
  return text + decoder.decode()
}

export function computeGhlSourceFingerprint(componentCode: string, demoCode: string): string {
  if (typeof componentCode !== "string" || typeof demoCode !== "string") {
    throw new TypeError("GHL source must be resolved text")
  }
  const hash = createHash("sha256").update(GHL_TEMPLATE_VERSION).update(Buffer.from([0]))
  for (const part of [componentCode, demoCode]) {
    const bytes = Buffer.from(part, "utf8")
    const length = Buffer.allocUnsafe(4)
    length.writeUInt32BE(bytes.byteLength)
    hash.update(length).update(bytes)
  }
  return hash.digest("hex")
}

export type PreparedGhlSource = {
  componentCode: string
  demoCode: string
  savedGhlHtml?: string | null
  savedFingerprint?: string | null
  generationSignal?: AbortSignal
  persistOutput: (html: string, sourceFingerprint: string) => Promise<void>
}

export async function generateGhlTemplate(demoId: number, forceRegenerate: boolean, prepared: PreparedGhlSource): Promise<string> {
  console.log(`Starting GHL template generation for demo ${demoId} (forceRegenerate: ${forceRegenerate})`)
  
  try {
    if (typeof prepared.componentCode !== "string" || typeof prepared.demoCode !== "string" ||
        typeof prepared.persistOutput !== "function") {
      throw new Error("Authorized source and fenced output persistence are required")
    }
    if (Buffer.byteLength(prepared.componentCode) + Buffer.byteLength(prepared.demoCode) > GHL_MAX_INPUT_BYTES) {
      throw new Error("GHL generation input exceeds the supported byte limit")
    }
    const sourceFingerprint = computeGhlSourceFingerprint(prepared.componentCode, prepared.demoCode)
    if (!forceRegenerate && prepared.savedFingerprint === sourceFingerprint && prepared.savedGhlHtml) {
      const saved = cleanGhlHtml(prepared.savedGhlHtml)
      if (saved) return saved
    }

    const relmioToken = process.env.RELMIO_AUTH_TOKEN
    const apiKey = process.env.OPENAI_API_KEY
    if (!relmioToken && (!apiKey || apiKey === "sk-placeholder")) {
      throw new Error("Neither RELMIO_AUTH_TOKEN nor OPENAI_API_KEY is configured in .env.local. Please configure at least one provider.")
    }

    let openai: OpenAI | null = null
    if (apiKey && apiKey !== "sk-placeholder") {
      const defaultHeaders: Record<string, string> = {}
      if (process.env.OPENAI_BASE_URL?.includes("openrouter.ai")) {
        defaultHeaders["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "https://higherbits.dev"
        defaultHeaders["X-Title"] = "HigherBits"
      }

      openai = new OpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL || undefined,
        defaultHeaders: Object.keys(defaultHeaders).length ? defaultHeaders : undefined,
        timeout: GHL_PROVIDER_TIMEOUT_MS,
      })
    }

    // Callers provide the exact authorized snapshot; never re-fetch source locators here.
    const componentCode = prepared.componentCode
    const demoCode = prepared.demoCode
    const generationDeadline = prepared.generationSignal ?? AbortSignal.timeout(GHL_GENERATION_DEADLINE_MS)
    if (generationDeadline.aborted) throw new Error("GHL generation deadline exceeded")

    // 2. Construct the system prompt
    const systemInstruction = endent`
      You are an expert Frontend Developer who specializes in transpiling modern React components into vanilla HTML, JavaScript, and Tailwind CSS for GoHighLevel (GHL) Custom HTML blocks.

      Your task is to take a React component (and its demo usage) and output a clean, single-file HTML snippet that can be directly pasted into a GoHighLevel Custom HTML element.

      CRITICAL RULES:
      1. OUTPUT FORMAT:
      - Output ONLY the raw embeddable HTML snippet.
      - DO NOT wrap the output in Markdown code blocks (NO \`\`\`html and NO \`\`\`).
      - DO NOT include <!DOCTYPE html>, <html>, <head>, or <body> tags. This is an embedded snippet for an existing page.

      2. FONTS & SCRIPTS:
      - Use system font stacks and inline CSS only. Never include remote fonts, scripts, stylesheets, images, or other resources.

      3. SCOPED STYLES & ZERO-SPECIFICITY RESETS:
      Include a <style> block with CSS variables, keyframe animations, and reset:
      <style>
        .ghl-component-wrapper,
        .ghl-component-wrapper * {
          font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        .ghl-component-wrapper {
          position: relative;
          width: 100%;
          box-sizing: border-box;
          isolation: isolate;
        }
        :where(.ghl-component-wrapper) :where(*, *::before, *::after) {
          box-sizing: border-box;
        }
        :where(.ghl-component-wrapper) :where(button, [role="button"]) {
          cursor: pointer;
          background-color: transparent;
          border-width: 0;
          padding: 0;
          color: inherit;
        }
      </style>

      4. WRAPPER CONTAINER & BACKGROUNDS:
      Wrap the entire component markup inside:
      <div class="ghl-component-wrapper w-full">
      - NEVER add artificial borders, rounded corners, padding, or shadow to this outer wrapper.
      - Preserve the component's internal styling, background colors (e.g. dark bg-[#030712] or light bg-white), text colors, padding, and layout completely intact.
      - NO SPLIT-SCREEN VIEWPORT BLOCKS: Do NOT include awkward, off-center viewport-bleed background blocks (e.g. w-[100vw], -right-[50vw], -left-[50vw]).

      5. ICONS & SVGS:
      - Convert all React SVG icon components (Lucide icons, custom SVG components) into inline <svg> elements.
      - Keep their width, height, viewBox, stroke, fill, and className attributes intact.

      6. SHADCN & SEMANTIC DESIGN TOKEN TRANSLATION:
      React components frequently rely on Shadcn UI / Tailwind CSS semantic design tokens. Since standard GoHighLevel pages lack Shadcn root CSS variables, you MUST translate these semantic tokens into exact, high-fidelity Tailwind utility classes:
      - Primary Button / CTA (\`bg-primary text-primary-foreground\`):
        * On dark themes (e.g. \`bg-[#030712]\`, \`bg-zinc-950\`, \`bg-black\`): Translate to an ultra-clean, high-contrast off-white pill: \`bg-[#f4f4f5] text-zinc-900 font-semibold shadow-lg hover:bg-white\`.
        * On light themes: Translate to \`bg-zinc-900 text-white font-semibold shadow-sm hover:bg-zinc-800\`.
        * STRICT PROHIBITION: NEVER substitute generic Bootstrap/Tailwind \`bg-blue-600\` or \`bg-indigo-600\` unless that specific color was explicitly written in the source React component!
      - Secondary / Outline Button (\`bg-secondary text-secondary-foreground border border-border\`):
        * On dark themes: Translate to \`bg-[#18181b]/80 border border-zinc-700/60 text-zinc-200 font-medium backdrop-blur-sm hover:bg-zinc-800/80\`.
        * On light themes: Translate to \`bg-zinc-100 border border-zinc-200 text-zinc-800 font-medium hover:bg-zinc-200\`.
      - Muted text (\`text-muted-foreground\`): Translate to \`text-zinc-400\` (dark) or \`text-zinc-500\` (light).
      - Maintain rounded pill geometry (\`rounded-full\`) and comfortable spacing (\`px-6 py-2.5\`) so buttons remain sleek and refined.

      7. CANVAS, SHADERS & FLUID DYNAMICS (NEGATIVE SPACE & FIDELITY):
      When converting WebGL fluid dynamics, generative canvas shaders, or particle systems:
      - PRESERVE PRISTINE NEGATIVE SPACE:
        * Simulations must breathe against a deep, clean background void (e.g. \`#030712\` or \`#000000\`).
        * Calibrate dissipation rates (\`DENSITY_DISSIPATION\`, \`VELOCITY_DISSIPATION\` around 0.98 to 0.992) so color ribbons and vortex swirls linger luxuriously for 4–7 seconds before dissolving completely into the dark void.
        * FORBIDDEN: NEVER set dissipation to near 1.0 (e.g. 0.999+) or inject continuous high-frequency \`Math.random()\` splat intervals that turn the canvas into an opaque rainbow soup/fog.
      - BUFFER & FBO SIZING ORDER:
        * ALWAYS call \`resizeCanvas()\` and establish true canvas pixel dimensions BEFORE allocating WebGL Framebuffers (FBOs) or Double-FBOs. Querying canvas width/height before resizing leads to default 300x150 buffers, destroying visual clarity.
      - TONE MAPPING & VELVETY BLEND:
        * For fluid simulations, apply Reinhard tone mapping (\`color / (color + 1.0)\`) or soft luminance clamps in the display shader so luminous emerald, cyan, and violet ribbons blend like silk without blowing out into harsh clipped white or muddy neon blobs.

      8. INTERACTIVITY & JAVASCRIPT:
      - Convert React interactive state and animations (spotlights, mouse tracking, ripples, magnetic cursor pull, tabs, dropdowns, accordions, mobile navigation menu toggle, WebGL/canvas) into clean Vanilla JavaScript inside a <script> block at the bottom.
      - PURE VANILLA JAVASCRIPT ONLY:
        * NEVER output React hooks (\`useRef\`, \`useState\`, \`useEffect\`, \`useCallback\`) or \`.current\` property accesses in the vanilla script.
        * NEVER leave undeclared variables (like \`isDark\`, \`props\`, \`ref\`). All identifiers must be explicitly declared (\`const\`, \`let\`, \`var\`).
        * STRICT INLINE ATTRIBUTE QUOTING: In inline HTML handlers (e.g. onclick="..."), all string parameters MUST be wrapped in quotes: onclick="window.dispatchEvent(new CustomEvent('fluid-trigger-burst'))", onclick="window.open('https://example.com', '_blank')". NEVER emit unquoted strings.
        * BOUNDING CLIENT RECT FOR POINTERS: For canvases, interactive cards, and cursor tracking, always calculate normalized UV coordinates using element.getBoundingClientRect(): (e.clientX - rect.left) / (rect.width || 1) and (e.clientY - rect.top) / (rect.height || 1). NEVER use raw e.clientX / window.innerWidth.
        * THEME COMPLIANCE: If the component is dark-themed by default (e.g. bg-[#030712]), default the JS configuration to dark mode. GoHighLevel pages typically do NOT have a \`dark\` class on <html> or <body>.
      - For tabs, accordions, or hidden menus, toggle the \`hidden\` class or style display property dynamically on click.

      9. COMPLETION GUARANTEE:
      - You MUST generate the ENTIRE component completely from top to bottom. Never cut off or truncate. Every tag opened must be closed.
    `

    const userMessage = endent`
      Convert the following React component and its demo into a production-ready GoHighLevel HTML snippet following the critical instructions.

      Component Code:
      \`\`\`tsx
      ${componentCode}
      \`\`\`

      Demo Usage:
      \`\`\`tsx
      ${demoCode}
      \`\`\`
    `

    let rawOutput = ""

    // Option A: Use local ChatGPT subscription via Relmio Codex Chat Adapter if configured
    if (relmioToken) {
      const relmioEndpoint = process.env.RELMIO_CHAT_ENDPOINT || "http://127.0.0.1:14501/chat"
      console.log(`Calling Relmio Codex Chat Adapter (${relmioEndpoint}) using ChatGPT subscription for demo ${demoId}...`)
      try {
        const relmioRes = await fetch(relmioEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${relmioToken}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.any([generationDeadline, AbortSignal.timeout(GHL_PROVIDER_TIMEOUT_MS)]),
          body: JSON.stringify({
            input: `${systemInstruction}\n\n${userMessage}`,
          }),
        })

        if (!relmioRes.ok) {
          await readGhlProviderResponseText(relmioRes)
          throw new Error(`Relmio request failed (${relmioRes.status})`)
        }

        const relmioData = JSON.parse(await readGhlProviderResponseText(relmioRes))
        rawOutput = relmioData.output || ""
      } catch (relmioErr) {
        if (openai) {
          console.warn("Relmio call failed; falling back to OpenAI/OpenRouter...", relmioErr)
        } else {
          throw relmioErr
        }
      }
    }

    // Option B: OpenAI / OpenRouter API
    if (!rawOutput && openai) {
      let model = process.env.OPENAI_MODEL || "cohere/north-mini-code:free"
      const configuredMaxTokens = Number(process.env.OPENAI_MAX_TOKENS) || 16384

      const executeCompletion = async (targetModel: string, tokens: number) => {
        console.log(`Calling OpenAI/OpenRouter API (${targetModel}, max_tokens: ${tokens}) to generate GHL template for demo ${demoId}...`)
        
        const extraBody: Record<string, any> = {}
        if (targetModel.includes("nemotron") || targetModel.includes("ultra") || targetModel.includes("super")) {
          // Disable internal reasoning to reserve all output tokens for HTML generation
          extraBody.reasoning = { effort: "none" }
        } else if (targetModel.includes("minimax") || targetModel.includes("deepseek") || targetModel.includes("r1") || targetModel.includes("reasoning")) {
          // Limit reasoning effort so tokens are dedicated to actual HTML generation
          extraBody.reasoning = { effort: "minimal" }
        }

        const completion = await openai.chat.completions.create({
          model: targetModel,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userMessage },
          ],
          max_tokens: tokens,
          temperature: 0.1,
          // @ts-ignore
          extra_body: Object.keys(extraBody).length ? extraBody : undefined,
        }, { signal: generationDeadline })

        if (!completion?.choices || !completion.choices[0]) {
          console.error(`OpenAI/OpenRouter raw response with missing choices from ${targetModel}:`, JSON.stringify(completion))
          const errorMsg = (completion as any)?.error?.message || `Model ${targetModel} returned a response without completion choices.`
          throw new Error(errorMsg)
        }

        const choice = completion.choices[0]
        if (choice?.finish_reason === "length") {
          throw new Error(`Model ${targetModel} hit token limit (${tokens} tokens) and output was truncated.`)
        }

        let output = choice?.message?.content || ""

        // If content was empty/null but model put code inside reasoning, extract code from reasoning
        if (!output) {
          const reasoningText = (choice?.message as any)?.reasoning || ""
          const codeBlockMatch = reasoningText.match(/```(?:html|xml)?\s*([\s\S]*?)\s*```/i)
          if (codeBlockMatch && codeBlockMatch[1]) {
            output = codeBlockMatch[1]
          } else if (reasoningText && (reasoningText.includes("<div") || reasoningText.includes("<section") || reasoningText.includes("<style"))) {
            output = reasoningText
          }
        }
        return output
      }

      try {
        rawOutput = await executeCompletion(model, configuredMaxTokens)
      } catch (err: any) {
        const errMsg = String(err?.message || "")
        console.warn(`OpenAI/OpenRouter call to ${model} failed:`, errMsg)

        // 1. If OpenRouter returned 402 with affordable token count, only retry if affordable >= 2000
        const affordMatch = errMsg.match(/can only afford (\d+)/i)
        if (affordMatch && affordMatch[1]) {
          const affordable = parseInt(affordMatch[1], 10)
          if (affordable >= 2000) {
            const retryTokens = Math.min(affordable - 200, configuredMaxTokens)
            console.log(`OpenRouter 402 credit threshold detected. Retrying ${model} with affordable max_tokens: ${retryTokens}...`)
            try {
              rawOutput = await executeCompletion(model, retryTokens)
            } catch (retryErr: any) {
              console.warn(`Retry with reduced tokens failed:`, retryErr?.message)
            }
          } else {
            console.warn(`OpenRouter 402 affordable tokens (${affordable}) is too low to produce complete HTML. Skipping retry and switching to fallback models.`)
          }
        }

        // 2. If still no output (or output was truncated due to token limit, 402 credits, or 429 rate limit), fallback to verified free OpenRouter models with high token budget
        if (!rawOutput) {
          const fallbackCandidates = [
            process.env.OPENAI_FALLBACK_MODEL,
            "cohere/north-mini-code:free",
            "nvidia/nemotron-3-super-120b-a12b:free",
            "nvidia/nemotron-3-ultra-550b-a55b:free",
            "google/gemma-4-31b-it:free",
          ].filter(Boolean) as string[]

          const uniqueFallbacks = Array.from(new Set(fallbackCandidates)).filter(m => m !== model)

          for (const fallbackModel of uniqueFallbacks) {
            console.log(`Attempting fallback to free model (${fallbackModel}, max_tokens: 16384)...`)
            try {
              rawOutput = await executeCompletion(fallbackModel, 16384)
              if (rawOutput) break
            } catch (fallbackErr: any) {
              console.warn(`Fallback to ${fallbackModel} failed:`, fallbackErr?.message)
            }
          }

          if (!rawOutput) {
            throw new Error(
              `OpenRouter generation failed across primary and fallback models (${errMsg}). Please top up credits or try again.`
            )
          }
        }
      }
    }

    if (Buffer.byteLength(rawOutput) > GHL_MAX_OUTPUT_BYTES) {
      throw new Error("GHL generated output exceeds the supported byte limit")
    }
    const ghlHtml = cleanGhlHtml(rawOutput)

    if (!ghlHtml) {
      throw new Error("AI returned an empty response.")
    }
    if (Buffer.byteLength(ghlHtml) > GHL_MAX_OUTPUT_BYTES) {
      throw new Error("GHL sanitized output exceeds the supported byte limit")
    }

    // 4. Save to database
    console.log(`Saving generated GHL HTML to demo ${demoId}...`)
    await prepared.persistOutput(ghlHtml, sourceFingerprint)

    console.log(`Successfully generated and saved GHL template for demo ${demoId}`)
    return ghlHtml
  } catch (error) {
    console.error(`Error generating GHL template for demo ${demoId}:`, error)
    throw error
  }
}
