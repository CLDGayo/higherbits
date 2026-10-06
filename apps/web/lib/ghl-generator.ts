import { createHash } from "node:crypto"
import OpenAI from "openai"
import endent from "endent"
import { load } from "cheerio"
import { parse } from "@babel/parser"
import { prepareBundledGhlHtml } from "@/lib/ghl-bundle-export"

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

/** Restrictive display-only sanitizer. Do not use this to prepare executable GHL exports. */
export function sanitizeGhlHtml(markup: string): string {
  const $ = load(markup, {}, false)
  for (const element of $.root().find("*").toArray()) {
    const node = $(element)
    const tag = element.tagName.toLowerCase()
    if (tag === "iframe" && /^https:\/\/higherbits\.dev\/(?:auto-index\/vgpu-[a-z0-9-]+\.html|api\/ghl-embed\/[1-9][0-9]*(?:\?controls=[A-Za-z0-9_-]+)?)$/.test(element.attribs.src ?? "")) {
      const src = element.attribs.src
      const title = element.attribs.title || "Interactive component preview"
      node.replaceWith(`<iframe src="${src}" title="${title.replace(/[&"<>]/g, "")}" loading="lazy" allow="webgpu; fullscreen" style="display:block;width:100%;height:100%;min-height:480px;border:0"></iframe>`)
      continue
    }
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

function isInlineResource(value: string): boolean {
  return /^#[a-zA-Z0-9_.:-]{1,128}$/.test(value) ||
    /^data:(?:image\/(?:png|jpeg|gif|webp|avif)|font\/(?:woff2?|ttf|otf));base64,[a-z0-9+/=]+$/i.test(value)
}

function validateExportCss(value: string): void {
  const decoded = value.replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\\([0-9a-f]{1,6})\s?|\\([^\r\n])/gi, (_match, hex, escaped) =>
      hex ? String.fromCodePoint(Math.min(Number.parseInt(hex, 16) || 0xfffd, 0x10ffff)) : escaped)
  const resources = [...decoded.matchAll(/url\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi)]
  if (/@import\b|(?:-webkit-)?image-set\s*\(/i.test(decoded) ||
      resources.length !== (decoded.match(/url\s*\(/gi)?.length ?? 0) ||
      resources.some(match => !isInlineResource(String(match[1] ?? match[2] ?? match[3]).trim()))) {
    throw new Error("GHL export must be self-contained; external CSS resources are unsupported")
  }
}

/** Syntax/dependency checks only: this does not certify JavaScript as safe to execute. */
function validateExportScript(code: string, module = false, handler = false): ReturnType<typeof parse> {
  let ast: ReturnType<typeof parse>
  try {
    ast = parse(code, { sourceType: module ? "module" : "script", allowReturnOutsideFunction: handler })
  } catch {
    throw new Error("GHL export contains malformed or truncated JavaScript")
  }
  const loaders = new Set(["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "Worker", "SharedWorker", "importScripts", "sendBeacon", "require", "eval", "Function"])
  const visit = (value: unknown): void => {
    if (!value || typeof value !== "object") return
    if (Array.isArray(value)) { value.forEach(visit); return }
    const node = value as Record<string, unknown>
    if (["Import", "ImportExpression", "ImportDeclaration", "ExportAllDeclaration"].includes(String(node.type)) ||
        (node.type === "ExportNamedDeclaration" && node.source)) {
      throw new Error("GHL export must be self-contained; external module loaders are unsupported")
    }
    if (node.type === "CallExpression" || node.type === "NewExpression" || node.type === "OptionalCallExpression") {
      const callee = node.callee as { type?: string; name?: string; computed?: boolean; property?: { name?: string; value?: string } }
      const name = callee.type === "Identifier" ? callee.name : callee.computed ? callee.property?.value : callee.property?.name
      const args = node.arguments as Array<{ type?: string; value?: string }>
      if (loaders.has(name ?? "") || (name === "createElement" && args[0]?.type === "StringLiteral" &&
          ["script", "link", "iframe", "object", "embed"].includes(args[0].value?.toLowerCase() ?? ""))) {
        throw new Error("GHL export must be self-contained; runtime resource loaders are unsupported")
      }
    }
    Object.values(node).forEach(visit)
  }
  visit(ast.program)
  return ast
}

/**
 * Normalizes and validates executable GHL source for copying/persistence.
 * The result is source text, never safe HTML for the parent app's innerHTML.
 * Script syntax/dependency validation is not a security sandbox or a runtime guarantee.
 */
export function cleanGhlHtml(raw: string): string {
  if (Buffer.byteLength(raw || "") > GHL_MAX_OUTPUT_BYTES) {
    throw new Error("GHL generated output exceeds the supported byte limit")
  }
  let text = (raw || "").trim()
  if (!text) return ""
  const fenced = text.match(/^```(?:html|xml)?\s*([\s\S]*?)\s*```$/i)
  if (fenced) text = fenced[1]!.trim()
  if (!/<[a-z][a-z0-9-]*\b/i.test(text)) return ""

  // Fragment parsing drops document wrappers without touching JavaScript string literals.
  const $ = load(text, { sourceCodeLocationInfo: true }, false)
  if ($("iframe, object, embed, base, link, meta[http-equiv]").length) {
    throw new Error("GHL export must be self-contained HTML; hosted embeds and external resources are unsupported")
  }
  $("meta").remove()
  $("title").filter((_index, element) => $(element).closest("svg").length === 0).remove()
  const executableScripts = $("script").toArray().filter(script =>
    ["", "module", "text/javascript", "application/javascript"].includes((script.attribs.type ?? "").trim().toLowerCase()))
  if (executableScripts.length > 1) {
    throw new Error("GHL export must combine executable JavaScript into one instance-scoped script; cross-script globals are unsupported")
  }
  for (const element of $.root().find("*").toArray()) {
    const node = $(element)
    const tag = element.tagName.toLowerCase()
    if (tag === "script" || tag === "style") {
      const location = (element as typeof element & { sourceCodeLocation?: { endTag?: unknown } }).sourceCodeLocation
      if (!location?.endTag) throw new Error(`GHL export contains an unclosed ${tag} tag`)
    }
    if (tag === "style") validateExportCss(node.text())
    if (tag === "script") {
      if ("src" in element.attribs) throw new Error("GHL export cannot load external scripts")
      const type = (element.attribs.type ?? "").trim().toLowerCase()
      if (["", "module", "text/javascript", "application/javascript"].includes(type)) {
        const code = node.text()
        const ast = validateExportScript(code, type === "module")
        const statement = ast.program.body[0]
        const isIife = ast.program.body.length === 1 && statement?.type === "ExpressionStatement" &&
          statement.expression.type === "CallExpression" &&
          ["ArrowFunctionExpression", "FunctionExpression"].includes(statement.expression.callee.type)
        // Keep the original code/directives intact. The arrow preserves top-level `this`
        // and currentScript while keeping declarations local to this pasted instance.
        if (type !== "module" && ast.program.body.length && !isIife) node.text(`(() => {\n${code}\n})();`)
      } else if (!["application/json", "application/ld+json", "x-shader/x-vertex", "x-shader/x-fragment"].includes(type)) {
        throw new Error("GHL export contains an unsupported script type")
      }
    }
    for (const [name, value] of Object.entries(element.attribs)) {
      const attribute = name.toLowerCase()
      if (attribute.startsWith("on")) {
        validateExportScript(value, false, true)
        if (executableScripts.length) {
          throw new Error("GHL export must bind events inside its instance script; inline handlers cannot depend on script globals")
        }
      }
      if (attribute === "style" || GHL_SVG_PRESENTATION_URL_ATTRIBUTES.has(attribute)) validateExportCss(value)
      if (["src", "poster", "background", "xlink:href"].includes(attribute) ||
          (attribute === "href" && tag !== "a")) {
        if (!isInlineResource(value)) throw new Error("GHL export cannot load external resources")
      }
      if (["srcset", "srcdoc", "ping"].includes(attribute) ||
          (["href", "action", "formaction"].includes(attribute) && /^\s*(?:javascript|vbscript):/i.test(value))) {
        throw new Error("GHL export contains an unsupported resource or executable URL")
      }
    }
  }
  const visible = $.root().clone()
  visible.find("script, style").remove()
  if (visible.find("img").length && !visible.text().trim() && !visible.find("svg, canvas, input, button, select, textarea").length) {
    throw new Error("GHL export cannot substitute a screenshot for the component")
  }
  const output = $.root().html()?.trim() ?? ""
  if (Buffer.byteLength(output) > GHL_MAX_OUTPUT_BYTES) throw new Error("GHL export exceeds the supported byte limit")
  return output
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
  supportingFiles?: Record<string, string>
  bundledHtml?: string
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
    if ((prepared.bundledHtml !== undefined && typeof prepared.bundledHtml !== "string") ||
        (prepared.supportingFiles !== undefined && (!prepared.supportingFiles || typeof prepared.supportingFiles !== "object" ||
          Array.isArray(prepared.supportingFiles) || Object.values(prepared.supportingFiles).some(value => typeof value !== "string")))) {
      throw new Error("GHL supporting files and bundle must be resolved text")
    }
    const supportingFiles = Object.entries(prepared.supportingFiles ?? {})
    const inputBytes = Buffer.byteLength(prepared.componentCode) + Buffer.byteLength(prepared.demoCode) +
      Buffer.byteLength(prepared.bundledHtml ?? "") +
      supportingFiles.reduce((total, [path, content]) => total + Buffer.byteLength(path) + Buffer.byteLength(content), 0)
    if (inputBytes > GHL_MAX_INPUT_BYTES) {
      throw new Error("GHL generation input exceeds the supported byte limit")
    }
    const generationDeadline = prepared.generationSignal ?? AbortSignal.timeout(GHL_GENERATION_DEADLINE_MS)
    const checkDeadline = () => {
      if (generationDeadline.aborted) throw new Error("GHL generation deadline exceeded")
    }
    checkDeadline()
    const sourceFingerprint = computeGhlSourceFingerprint(prepared.componentCode, prepared.demoCode)
    if (prepared.bundledHtml !== undefined) {
      if (Buffer.byteLength(prepared.bundledHtml) > GHL_MAX_OUTPUT_BYTES) {
        throw new Error("GHL bundled output exceeds the supported byte limit")
      }
      const html = cleanGhlHtml(prepareBundledGhlHtml(prepared.bundledHtml))
      if (!html) throw new Error("GHL bundle returned an empty response")
      checkDeadline()
      await prepared.persistOutput(html, sourceFingerprint)
      return html
    }
    const sourceNeedsScript = /\b(?:useState|useReducer|useEffect|useLayoutEffect|requestAnimationFrame|addEventListener)\s*\(|\bon(?:Click|Change|Input|Submit|Pointer\w*|Mouse\w*)\s*=/.test(
      [prepared.componentCode, prepared.demoCode, ...supportingFiles.map(([, content]) => content)].join("\n"),
    )
    const validateOutput = (raw: string) => {
      const html = cleanGhlHtml(raw)
      const $ = load(html, {}, false)
      if (sourceNeedsScript && !$("script").toArray().some(script =>
        ["", "module", "text/javascript", "application/javascript"].includes((script.attribs.type ?? "").trim().toLowerCase()) && $(script).text().trim())) {
        throw new Error("GHL output omitted the JavaScript required by the interactive source")
      }
      return html
    }
    // v3 identifies only component/demo text, so supporting-file changes cannot reuse its cache.
    if (!forceRegenerate && !supportingFiles.length && prepared.savedFingerprint === sourceFingerprint && prepared.savedGhlHtml) {
      try {
        const saved = validateOutput(prepared.savedGhlHtml)
        if (saved) return saved
      } catch {
        // Regeneration is already authorized; obsolete cached substitutes are not reusable exports.
      }
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
    checkDeadline()

    const systemInstruction = endent`
      Convert the supplied React component, demo, and supporting files into one complete, pasteable GoHighLevel Custom HTML snippet.
      Return raw HTML with inline CSS and JavaScript only, without Markdown fences or document wrappers.
      Preserve the original layout, colors, typography, animations, controls, and interactive behavior. Implement React state and event handlers in complete vanilla JavaScript; retain necessary scripts and form controls.
      Use native buttons, inputs, and labels for interactive controls. Keep keyboard operation and ARIA state in sync with the rendered state; never make a non-focusable div the only way to activate a control.
      Compile every Tailwind utility and semantic design token into actual CSS. Do not rely on Tailwind, React, fonts, scripts, stylesheets, or other resources from a CDN or external loader.
      Use a .ghl-component-wrapper root and scope styles, selectors, and event handling to that component. Do not reset or mutate the host page's html/body or global styles. Support multiple pasted instances.
      Put executable JavaScript in one instance-local IIFE inside its root. Capture document.currentScript.parentElement synchronously, use local DOM queries and addEventListener, and avoid cross-script globals and inline event attributes.
      Include inline SVG icons and self-contained assets. Never substitute an iframe, hosted preview, screenshot, or static image for the component.
      Preserve supplied shader/simulation logic exactly where possible. Do not guess missing shader code or replace a simulation with a decorative imitation; if essential source is missing, return no HTML.
      Keep MIT and other required attribution/license comments. Finish every script and tag; do not emit placeholders or truncated code.
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

      Supporting Files (resolve local imports from these exact sources):
      ${JSON.stringify(Object.fromEntries(supportingFiles))}
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
        checkDeadline()
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
    const ghlHtml = validateOutput(rawOutput)

    if (!ghlHtml) {
      throw new Error("AI returned an empty response.")
    }
    if (Buffer.byteLength(ghlHtml) > GHL_MAX_OUTPUT_BYTES) {
      throw new Error("GHL export exceeds the supported byte limit")
    }

    // 4. Save to database
    checkDeadline()
    console.log(`Saving generated GHL HTML to demo ${demoId}...`)
    await prepared.persistOutput(ghlHtml, sourceFingerprint)

    console.log(`Successfully generated and saved GHL template for demo ${demoId}`)
    return ghlHtml
  } catch (error) {
    console.error(`Error generating GHL template for demo ${demoId}:`, error)
    throw error
  }
}
