import { parse } from "@babel/parser"
import {
  AUTO_INDEX_ANIMATION_PRESETS,
  installAutoIndexControls,
  normalizeAutoIndexControlState,
  type AutoIndexControlState,
} from "./auto-index-controls-runtime"
import { POPULAR_GOOGLE_FONT_FAMILIES } from "./google-fonts"

export function splitPreviewControls(controls?: Record<string, unknown> | null) {
  const authored: Record<string, string | number | boolean> = {}
  let universal: AutoIndexControlState | undefined
  if (!controls || typeof controls !== "object" || Array.isArray(controls)) return { authored, universal }
  if (Object.hasOwn(controls, "__hbControls")) {
    const normalized = normalizeAutoIndexControlState(controls.__hbControls)
    if (!normalized) throw new Error("Invalid component controls: unsupported state, property or value.")
    const targets = Object.fromEntries(Object.entries(normalized.targets).map(([id, edits]) =>
      [id, Object.fromEntries(Object.entries(edits).filter(([key]) => key !== "motionPaused"))] as const,
    ).filter(([, edits]) => Object.keys(edits).length))
    if (Object.keys(targets).length) universal = { version: 1, targets } as AutoIndexControlState
  }
  for (const [key, value] of Object.entries(controls).slice(0, 100)) {
    if (key === "__hbControls" || ["__proto__", "constructor", "prototype"].includes(key)) continue
    if (typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) authored[key] = value
  }
  return { authored, universal }
}

function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029")
}

function installerSource(): string {
  const source = installAutoIndexControls.toString()
  // Remove comments by parsed ranges; only the generated runtime is ignored by TS below.
  const parsed = parse(`(${source})`, { sourceType: "script" })
  let text = `(${source})`
  for (const comment of [...(parsed.comments ?? [])].reverse()) text = text.slice(0, comment.start!) + text.slice(comment.end!)
  return text.replace(/[\r\n]+/g, " ")
}

/** Only the demo export is wrapped; its imported component keeps its own props and exports. */
export function applyAutoIndexControlsToReact(code: string, state: AutoIndexControlState): string {
  const ast = parse(code, { sourceType: "module", plugins: ["jsx", "typescript"] })
  const reserved = ["__HBReact", "__HBAutoIndex", "__HBOriginal", "__HBControlled"]
  if (reserved.some(name => new RegExp(`\\b${name}\\b`).test(code))) throw new Error("Cannot customize this source: reserved export binding already exists.")
  const defaultExport = ast.program.body.find(node => node.type === "ExportDefaultDeclaration")
  let original: string
  let transformed = code
  if (defaultExport?.type === "ExportDefaultDeclaration") {
    const declaration = defaultExport.declaration
    if ((declaration.type === "FunctionDeclaration" || declaration.type === "ClassDeclaration") && declaration.id) {
      original = declaration.id.name
      transformed = code.slice(0, defaultExport.start!) + code.slice(declaration.start!)
    } else if (declaration.type === "Identifier") {
      original = declaration.name
      transformed = code.slice(0, defaultExport.start!) + code.slice(defaultExport.end!)
    } else {
      original = "__HBOriginal"
      transformed = code.slice(0, defaultExport.start!) + `const ${original} = ` + code.slice(declaration.start!, declaration.end!) + ";" + code.slice(defaultExport.end!)
    }
  } else {
    const named = ast.program.body.find(node => node.type === "ExportNamedDeclaration" && node.specifiers.some(specifier =>
      specifier.type === "ExportSpecifier" && (specifier.exported.type === "Identifier" ? specifier.exported.name : specifier.exported.value) === "default"))
    if (named?.type !== "ExportNamedDeclaration" || named.source) throw new Error("Cannot customize this source: a local default demo export is required.")
    const specifier = named.specifiers.find(specifier => specifier.type === "ExportSpecifier" &&
      (specifier.exported.type === "Identifier" ? specifier.exported.name : specifier.exported.value) === "default")!
    if (specifier.type !== "ExportSpecifier") throw new Error("Unsupported demo export")
    original = specifier.local.name
    const retained = named.specifiers.filter(item => item !== specifier).map(item => code.slice(item.start!, item.end!))
    transformed = code.slice(0, named.start!) + (retained.length ? `export {${retained.join(",")}};` : "") + code.slice(named.end!)
  }
  // A use-client directive must precede every import, including an existing source directive.
  return `"use client";\nimport * as __HBReact from "react";\n${transformed}\n// @ts-ignore Generated, validated browser runtime; keep the original component type-checked.\nconst __HBAutoIndex = ${installerSource()};
export default function __HBControlled(props: __HBReact.ComponentProps<typeof ${original}>) {
  const mount = __HBReact.useRef<HTMLDivElement>(null);
  const [error, setError] = __HBReact.useState<string | null>(null);
  __HBReact.useEffect(() => {
    if (!mount.current) return;
    const state = ${scriptJson(state)};
    const googleFonts: string[] = ${scriptJson(POPULAR_GOOGLE_FONT_FAMILIES)};
    const animationPresets = ${scriptJson(AUTO_INDEX_ANIMATION_PRESETS)};
    let available: string[] = [];
    const loadGoogleFont = (family: string) => {
      if (!googleFonts.includes(family)) return;
      const doc = mount.current?.ownerDocument;
      if (!doc || !doc.head || Array.from(doc.querySelectorAll<HTMLLinkElement>("link[data-hb-google-font]")).some(link => link.dataset.hbGoogleFont === family)) return;
      const link = doc.createElement("link"); link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(family).replace(/%20/g, "+") + "&display=swap";
      link.dataset.hbGoogleFont = family; doc.head.append(link);
    };
    const runtime = __HBAutoIndex(mount.current, state, (profile: {targets: {id: string}[]}) => { available = profile.targets.map(target => target.id); }, loadGoogleFont, googleFonts, animationPresets);
    const check = window.setTimeout(() => {
      const missing = Object.keys(state.targets).filter(id => !available.includes(id));
      if (missing.length) setError("Unable to apply customized component controls: target unavailable.");
    }, 2000);
    return () => { window.clearTimeout(check); runtime.dispose(); };
  }, []);
  return <><div ref={mount} data-hb-auto-index-root=""><${original} {...props} /></div>{error && <p role="alert">{error}</p>}</>;
}
`
}

/** Accepts already checked, instance-scoped HTML; no new executable script is added if one exists. */
export function applyAutoIndexControlsToHtml(html: string, state: AutoIndexControlState): string {
  if (/<iframe\b/i.test(html)) throw new Error("Customized hosted iframe export requires its original local bundle.")
  if (!/data-hb-(?:auto-index-root|vgpu-mount)\b/.test(html)) throw new Error("Customized HTML requires the original component bundle to preserve text targets.")
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].filter(match => {
    const type = match[1]!.match(/\btype\s*=\s*["']([^"']*)["']/i)?.[1]?.toLowerCase()
    return !type || ["module", "text/javascript", "application/javascript"].includes(type)
  })
  if (scripts.length > 1) throw new Error("Customized HTML must have one instance script.")
  if (scripts.some(script => /\btype\s*=\s*["\']module["\']/i.test(script[1]!))) throw new Error("Customized HTML requires a classic instance script.")
  const install = `;(() => {
    const host = document.currentScript.parentElement;
    const state = ${scriptJson(state)};
    queueMicrotask(() => {
      const scope = host.shadowRoot || host;
      const mount = scope.querySelector('[data-hb-auto-index-root], [data-hb-vgpu-mount]');
      if (!mount) throw new Error('Customized component mount is unavailable.');
      let available = [];
      (${installerSource()})(mount, state, profile => { available = profile.targets.map(target => target.id); }, undefined, ${scriptJson(POPULAR_GOOGLE_FONT_FAMILIES)}, ${scriptJson(AUTO_INDEX_ANIMATION_PRESETS)});
      window.setTimeout(() => {
        const missing = Object.keys(state.targets).filter(id => !available.includes(id));
        if (missing.length) {
          const error = document.createElement('p'); error.setAttribute('role', 'alert');
          error.textContent = 'Unable to apply customized component controls: target unavailable.'; host.append(error);
          console.error('Unsupported copied control target:', missing.join(', '));
        }
      }, 2000);
    });
  })();`
  if (scripts.length) {
    const script = scripts[0]!
    const end = script.index! + script[0].lastIndexOf("</")
    return html.slice(0, end) + install + html.slice(end)
  }
  const end = html.lastIndexOf("</div>")
  if (end < 0) throw new Error("Customized HTML root is unavailable.")
  return html.slice(0, end) + `<script>${install}</script>` + html.slice(end)
}
