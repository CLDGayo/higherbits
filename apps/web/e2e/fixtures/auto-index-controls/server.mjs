import { createServer } from "node:http"
import { createRequire } from "node:module"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const directory = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(directory, "../../..")
const port = Number(process.env.AUTO_INDEX_CONTROLS_PORT || 3205)
const require = createRequire(path.join(webRoot, "package.json"))
// Reuse the bundler already installed by Vitest; avoid adding a test-only dependency.
const viteRequire = createRequire(createRequire(require.resolve("vitest/package.json")).resolve("vite/package.json"))
const { build } = viteRequire("esbuild")
const aliases = { "@": webRoot, react: path.dirname(require.resolve("react/package.json")), "react-dom": path.dirname(require.resolve("react-dom/package.json")) }
const common = { bundle: true, write: false, absWorkingDir: webRoot, alias: aliases, target: "es2022", minify: true, define: { "process.env": JSON.stringify({ NODE_ENV: "production" }) }, jsx: "automatic", logLevel: "error" }
const componentSource = await readFile(path.join(directory, "component.tsx"), "utf8")
const componentCss = `html,body,#root{margin:0;width:100%;min-height:100%}body{font-family:Arial,sans-serif;background:#ededf0;color:#24242c}.ghl-component-wrapper{width:100%;min-height:480px;display:grid;place-items:center;padding:24px;box-sizing:border-box;background:#09090b;border:1px solid #333;border-radius:16px}.demo-surface{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#ededf0}.demo-card{width:260px;padding:24px;border:2px solid #858595;border-radius:16px;background:#ffffff;box-shadow:0 10px 20px #0002}.demo-card h2{font-size:24px;color:rgb(25,35,45);margin:0 0 12px}.demo-card p{font-size:16px}.demo-card button{display:flex;gap:6px;padding:10px;border-radius:6px}.moving{display:block;margin-top:16px;animation:drift 3s infinite alternate}@keyframes drift{from{transform:translateX(0)}to{transform:translateX(10px)}}`
const compile = async (source, platform = "browser") => (await build({ ...common, platform, format: platform === "node" ? "cjs" : "iife", stdin: { contents: source, loader: "tsx", resolveDir: webRoot }, ...(platform === "node" ? { packages: "external" } : {}) })).outputFiles[0].text
const app = (await build({ ...common, platform: "browser", format: "iife", entryPoints: [path.join(directory, "app.tsx")] })).outputFiles[0].text
const component = await compile(`import React from 'react';import{createRoot}from'react-dom/client';${componentSource.replace(/import React, \{ useState \} from "react"/, 'import {useState} from "react"').replace("export default function", "function")};window.addEventListener('load',()=>requestAnimationFrame(()=>createRoot(document.getElementById('root')).render(<SampleComponent/>)));`)
const helpers = { exports: {} }
const helperCode = await compile(`export {applyControlsToCode,applyControlsToGhlHtml} from './lib/controls-transform';export {prepareAutoIndexGhlHtml} from './lib/ghl-bundle-export';export {cleanGhlHtml} from './lib/ghl-generator';`, "node")
new Function("require", "module", "exports", helperCode)(require, helpers, helpers.exports)
const { applyControlsToCode, applyControlsToGhlHtml, prepareAutoIndexGhlHtml, cleanGhlHtml } = helpers.exports
const originalHtml = `<!doctype html><html><head><style>${componentCss}</style></head><body><div id="root"></div><script>${component.replaceAll("</script", "<\\/script")}</script></body></html>`
const tailwindConfig = require(path.join(webRoot, "tailwind.config.js"))
const panelCss = (await require("postcss")([require("tailwindcss")({ ...tailwindConfig, content: [path.join(directory, "app.tsx"), path.join(webRoot, "components/features/controls/auto-index-controls.tsx"), path.join(webRoot, "components/ui/select.tsx"), path.join(webRoot, "components/ui/switch.tsx")] })]).process((await readFile(path.join(webRoot, "app/globals.css"), "utf8")).replace(/^@import.*$/gm, ""), { from: undefined })).css
const shellCss = `body{margin:0;font-family:Arial,sans-serif}.fixture-layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;min-height:100vh;gap:16px;padding:16px}.fixture-layout iframe{display:block;height:620px;border:1px solid #888}.fixture-layout aside{height:calc(100vh - 32px);overflow:auto;padding:16px;border:1px solid #aaa;border-radius:12px}.fixture-layout h1{font-weight:bold;margin-bottom:16px}.fixture-layout>section>label{display:block;margin-bottom:16px}.fixture-layout>section select{border:1px solid #aaa;padding:8px}.fixture-layout aside>button{margin-top:16px;border:1px solid #aaa;padding:10px;width:100%}`
const publicBundles = new Set(["edilozi-accordion"])
const saved = new Map()
let sequence = 0

createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`)
  const send = (value, type = "text/html", status = 200) => { response.writeHead(status, { "Content-Type": `${type}; charset=utf-8` }); response.end(value) }
  try {
    if (url.pathname === "/") return send(`<!doctype html><html><head><style>${panelCss}${shellCss}</style></head><body><div id="app"></div><script src="/app.js"></script></body></html>`)
    if (url.pathname === "/app.js") return send(app, "text/javascript")
    if (["/auto-index/controls-fixture.html", "/auto-index/background-fixture.html"].includes(url.pathname)) return send(originalHtml)
    const bundle = /^\/auto-index\/([a-z0-9-]+)\.html$/.exec(url.pathname)?.[1]
    if (bundle && publicBundles.has(bundle)) return send(await readFile(path.join(webRoot, "public/auto-index", `${bundle}.html`), "utf8"))
    if (url.pathname === "/export" && request.method === "POST") {
      const chunks = []
      for await (const chunk of request) chunks.push(chunk)
      const { format, controls, bundle = "controls-fixture" } = JSON.parse(Buffer.concat(chunks).toString())
      let html
      if (format === "react") {
        const transformed = applyControlsToCode(componentSource, controls)
        const compiled = await compile(`${transformed.replace("export default function __HBControlled", "function __HBControlled")}\nimport{createRoot}from'react-dom/client';createRoot(document.getElementById('app')).render(<__HBControlled/>);`)
        html = `<!doctype html><html><head><style>${componentCss}</style></head><body><div id="app"></div><script>${compiled.replaceAll("</script", "<\\/script")}</script></body></html>`
      } else if (format === "html") {
        if (bundle !== "controls-fixture" && !publicBundles.has(bundle)) throw new Error("Unknown fixture")
        const original = bundle === "controls-fixture" ? originalHtml : await readFile(path.join(webRoot, "public/auto-index", `${bundle}.html`), "utf8")
        html = cleanGhlHtml(applyControlsToGhlHtml(cleanGhlHtml(prepareAutoIndexGhlHtml(original)), controls))
      } else throw new Error("Unknown format")
      const resultPath = `/exports/${++sequence}.html`
      saved.set(resultPath, html)
      return send(JSON.stringify({ url: resultPath }), "application/json")
    }
    if (saved.has(url.pathname)) return send(saved.get(url.pathname))
    return send("Not found", "text/plain", 404)
  } catch (error) {
    return send(JSON.stringify({ error: error.message }), "application/json", 422)
  }
}).listen(port, "127.0.0.1", () => console.log(`Auto-index controls fixture ready on http://127.0.0.1:${port}`))
