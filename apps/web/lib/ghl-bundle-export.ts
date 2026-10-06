import { parse } from "@babel/parser"
import { load } from "cheerio"

const VGPU_PAGE_CSS = "html,body,#root{height:100%;width:100%;margin:0}#root>div{height:100%;width:100%;overflow:hidden;background:black}canvas{display:block;width:100%;height:100%;touch-action:none}"
const VGPU_DIAGNOSTICS = "window.__errors=[];window.addEventListener('error',e=>window.__errors.push(String(e.message)));window.addEventListener('unhandledrejection',e=>window.__errors.push(String(e.reason)));"

/** Converts trusted, precompiled VGPU documents. This is not an untrusted-script sanitizer. */
export function prepareBundledGhlHtml(raw: string): string {
  const reject = (): never => { throw new Error("Unsupported standalone VGPU bundle: expected a self-contained IIFE with one root mount and no external assets.") }
  if (Buffer.byteLength(raw) > 1024 * 1024) reject()
  const $ = load(raw)
  const scripts = $("script").toArray()
  const root = $("body > div#root")
  if (scripts.length !== 2 || scripts.some(script => Object.keys(script.attribs).length) ||
      $("body").children().length !== 3 || root.length !== 1 || root.html()?.trim() ||
      $("style").length !== 1 || $("style").text().replace(/\s+/g, "") !== VGPU_PAGE_CSS ||
      $(scripts[0]!).text().trim() !== VGPU_DIAGNOSTICS || $("link, iframe, img, object, embed, base").length) reject()

  const code = $(scripts[1]!).text()
  const ast = parse(code, { sourceType: "script" })
  const statement = ast.program.body[0]
  if (ast.program.body.length !== 1 || statement?.type !== "ExpressionStatement" ||
      statement.expression.type !== "CallExpression" || statement.expression.callee.type !== "ArrowFunctionExpression" ||
      statement.expression.callee.async || statement.expression.callee.params.length || statement.expression.arguments.length) reject()

  const mounts: Array<{ start: number; end: number }> = []
  const visit = (value: unknown): void => {
    if (!value || typeof value !== "object") return
    if (Array.isArray(value)) { value.forEach(visit); return }
    const node = value as Record<string, unknown>
    if (node.type === "Import" || node.type === "ImportExpression" ||
        (node.type === "Identifier" && ["eval", "fetch", "XMLHttpRequest", "WebSocket", "EventSource", "Worker", "Function", "__hbVgpuMount"].includes(String(node.name))) ||
        (node.type === "StringLiteral" && typeof node.value === "string" && node.value.startsWith("/") && node.value.length > 2)) reject()
    if (node.type === "CallExpression") {
      const callee = node.callee as { type?: string; computed?: boolean; object?: { name?: string }; property?: { name?: string } }
      const args = node.arguments as Array<{ type?: string; value?: string }>
      if (callee.type === "MemberExpression" && !callee.computed && callee.object?.name === "document" && callee.property?.name === "getElementById" &&
          args.length === 1 && args[0]?.type === "StringLiteral" && args[0].value === "root") {
        if (typeof node.start !== "number" || typeof node.end !== "number") reject()
        mounts.push({ start: node.start as number, end: node.end as number })
      }
    }
    Object.values(node).forEach(visit)
  }
  visit(ast.program)
  if (mounts.length !== 1) reject()
  const mount = mounts[0]!
  const compiled = code.slice(0, mount.start) + "__hbVgpuMount" + code.slice(mount.end)
  const notices = $.root().find("*").addBack().contents()
    .filter((_index, node) => node.type === "comment")
    .map((_index, node) => $.html(node)).get().join("\n")

  return `${notices}
<style>
.hb-vgpu-embed{position:relative;isolation:isolate;width:100%;height:480px;min-height:240px;overflow:hidden;background:#000}
.hb-vgpu-embed>[data-hb-vgpu-mount],.hb-vgpu-embed>[data-hb-vgpu-mount]>div{position:relative;width:100%;height:100%;margin:0;overflow:hidden;background:#000}
.hb-vgpu-embed canvas{display:block;width:100%;height:100%;touch-action:none}
.hb-vgpu-embed>[data-hb-vgpu-status]:not([hidden]){position:absolute;inset:0;display:grid;place-items:center;box-sizing:border-box;margin:0;padding:24px;color:#fff;background:#111;text-align:center;font:16px/1.5 system-ui,sans-serif}
</style>
<div class="ghl-component-wrapper hb-vgpu-embed">
<div data-hb-vgpu-mount></div><p data-hb-vgpu-status role="status" hidden></p>
<script>
(async function(){
const host=document.currentScript.parentElement;
const __hbVgpuMount=host.querySelector('[data-hb-vgpu-mount]');
const status=host.querySelector('[data-hb-vgpu-status]');
const unavailable=()=>{status.textContent='This component requires WebGPU in a supported browser over HTTPS.';status.hidden=false;};
if(!globalThis.isSecureContext||!navigator.gpu){unavailable();return;}
try{
if(!await navigator.gpu.requestAdapter()){unavailable();return;}
${compiled}
}catch(error){status.textContent='Unable to start this WebGPU component.';status.hidden=false;console.error(error);}
})();
</script>
</div>`
}
