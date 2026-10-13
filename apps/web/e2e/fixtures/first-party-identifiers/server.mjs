import { createServer } from "node:http"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

const directory = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(directory, "../../..")
const require = createRequire(path.join(webRoot, "package.json"))
const viteRequire = createRequire(createRequire(require.resolve("vitest/package.json")).resolve("vite/package.json"))
const { build } = viteRequire("esbuild")
const result = await build({
  bundle: true,
  write: false,
  absWorkingDir: webRoot,
  entryPoints: [path.join(directory, "app.tsx")],
  alias: {
    "@": webRoot,
    react: path.dirname(require.resolve("react/package.json")),
    "react-dom": path.dirname(require.resolve("react-dom/package.json")),
  },
  platform: "browser",
  format: "iife",
  target: "es2022",
  jsx: "automatic",
  minify: true,
  sourcemap: false,
  define: { "process.env": JSON.stringify({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:1", NEXT_PUBLIC_SUPABASE_KEY: "phase02-synthetic-not-a-provider-key" }) },
  logLevel: "error",
})
const bundle = result.outputFiles[0].text
const shell = '<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>Phase 02 storage fixture</title></head><body><div id="app"></div><script src="/app.js"></script></body></html>'
const server = createServer((request, response) => {
  const allowed = request.method === "GET"
  const isShell = allowed && request.url === "/"
  const isBundle = allowed && request.url === "/app.js"
  response.writeHead(isShell || isBundle ? 200 : 404, {
    "Content-Type": isBundle ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; script-src 'self'; connect-src 'none'; worker-src 'none'; img-src data:; base-uri 'none'; form-action 'none'",
  })
  response.end(isShell ? shell : isBundle ? bundle : "Not found")
})
server.on("error", () => { console.error("Phase 02 fixture failed to bind loopback port 3206"); process.exitCode = 1 })
server.listen(3206, "127.0.0.1", () => console.log("Phase 02 fixture ready on http://127.0.0.1:3206"))
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close())
