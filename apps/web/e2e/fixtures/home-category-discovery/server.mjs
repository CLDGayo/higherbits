import http, { createServer } from "node:http"
import https from "node:https"
import net from "node:net"
import { createRequire } from "node:module"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const directory = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(directory, "../../..")
const fixture = (name) => path.join(directory, name)
const source = (name) => path.join(webRoot, name)
const require = createRequire(path.join(webRoot, "package.json"))
const viteRequire = createRequire(createRequire(require.resolve("vitest/package.json")).resolve("vite/package.json"))
const { build } = viteRequire("esbuild")

const stub = fixture("stubs.tsx")
const data = fixture("data.ts")
const overrides = new Map([
  ["next/link", fixture("link.tsx")],
  ["next/cache", stub],
  ["./page.client", stub],
  ["@/components/ui/header.client", stub],
  ["@/components/ui/footer", stub],
  ["@/components/ui/footer-marketing", stub],
  ["@/components/ui/newsletter-dialog", stub],
  ["@/components/seo/json-ld", stub],
  ["@/lib/seo/faq", stub],
  ["@/lib/supabase", stub],
  ["@/lib/constants", stub],
  ["@/lib/landing-catalogue-rows", data],
  ["@/lib/landing-featured-example", data],
  ["@/lib/landing-authors", data],
  ["@/components/ui/landing-page-layout", source("components/ui/landing-page-layout.tsx")],
  ["@/components/features/home/catalogue-chip-row", source("components/features/home/catalogue-chip-row.tsx")],
  ["@/components/features/home/catalogue-carousel-row", source("components/features/home/catalogue-carousel-row.tsx")],
  ["@/components/features/home/catalogue-row-section", stub],
  ["@/components/features/list-card/card", stub],
  ["@/components/ui/carousel", stub],
  ["@/components/ui/skeletons", stub],
  ["@/lib/utils", source("lib/utils.ts")],
  ["./hero-visual", stub],
  ["./faq-section", stub],
  ["./social-proof-counter", stub],
  ["./copy-prompt-section", stub],
  ["./authors-band", stub],
  ["./agents-cta-band", stub],
  ["./component-catalogue", source("components/ui/component-catalogue.tsx")],
  ["./landing-section", source("components/ui/landing-section.tsx")],
  ["./button", stub],
])

const compiled = await build({
  entryPoints: [fixture("app.tsx")],
  absWorkingDir: webRoot,
  bundle: true,
  write: false,
  metafile: true,
  format: "iife",
  platform: "browser",
  target: "chrome120",
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"test"',
    "process.env.NEXT_PUBLIC_APP_URL": '"http://127.0.0.1:3217"',
  },
  plugins: [{
    name: "synthetic-home-import-boundary",
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        const replacement = overrides.get(args.path)
        return replacement ? { path: replacement } : undefined
      })
    },
  }],
  logLevel: "error",
})

const inputs = Object.keys(compiled.metafile.inputs)
for (const required of [
  "app/page.tsx",
  "components/ui/landing-page-layout.tsx",
  "components/ui/component-catalogue.tsx",
  "components/features/home/catalogue-chip-row.tsx",
  "components/features/home/catalogue-carousel-row.tsx",
]) {
  if (!inputs.some((input) => input.endsWith(required))) {
    throw new Error(`Actual Home source missing from isolated bundle: ${required}`)
  }
}
if (inputs.some((input) => /(?:lib\/supabase|@supabase|@clerk|\.env(?:\.|$))/i.test(input))) {
  throw new Error("Provider or environment code entered the isolated Home bundle")
}

const tailwindConfig = require(source("tailwind.config.js"))
const cssInput = (await readFile(source("app/globals.css"), "utf8"))
  .replace(/^@import.*$/gm, "")
const css = (await require("postcss")([
  require("tailwindcss")({
    ...tailwindConfig,
    content: [
      source("app/page.tsx"),
      source("components/ui/landing-page-layout.tsx"),
      source("components/ui/landing-section.tsx"),
      source("components/ui/component-catalogue.tsx"),
      source("components/features/home/catalogue-chip-row.tsx"),
      source("components/features/home/catalogue-carousel-row.tsx"),
      fixture("*.tsx"),
    ],
  }),
]).process(cssInput, { from: source("app/globals.css") })).css + `
  .fixture-banner{position:relative;z-index:10;display:flex;gap:1rem;justify-content:space-between;align-items:center;padding:.75rem 2rem;background:#ede7ff;color:#241b39;font:14px Arial,sans-serif}
  .fixture-banner button{flex:none;border:1px solid currentColor;border-radius:.5rem;padding:.5rem}
  .dark .fixture-banner{background:#302442;color:#fff}
`

// The server only answers loopback requests. Its client networking APIs are
// disabled after the local build, so an accidental runtime fetch fails closed.
const denyEgress = () => { throw new Error("Outbound networking is disabled in the Home fixture") }
globalThis.fetch = denyEgress
http.request = denyEgress
http.get = denyEgress
https.request = denyEgress
https.get = denyEgress
net.connect = denyEgress
net.createConnection = denyEgress

const origin = "http://127.0.0.1:3217"
const allowedSlugs = new Set([
  "background", "gradients", "hero", "navbar-navigation", "shaders", "testimonials", "text",
  "ai-chat", "button", "card", "charts", "form", "input", "number",
])
const shell = '<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><link rel="stylesheet" href="/app.css"><title>Synthetic Home fixture</title></head><body><div id="root"></div><script src="/app.js"></script></body></html>'

const server = createServer((request, response) => {
  const url = new URL(request.url, origin)
  const slug = /^\/s\/([a-z-]+)$/.exec(url.pathname)?.[1]
  const page = slug && allowedSlugs.has(slug)
    ? `<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>Synthetic category route</title></head><body><main><h1>Synthetic category route: ${slug}</h1><article>Fixture card for ${slug}</article><a href="/">Back to Home</a></main></body></html>`
    : null
  const content = request.method !== "GET" ? null
    : url.pathname === "/healthz" ? "ready"
    : url.pathname === "/" ? shell
    : url.pathname === "/app.js" ? compiled.outputFiles[0].text
    : url.pathname === "/app.css" ? css
    : page
  const status = content === null ? 404 : 200
  const contentType = url.pathname === "/app.js" ? "text/javascript; charset=utf-8"
    : url.pathname === "/app.css" ? "text/css; charset=utf-8"
    : "text/html; charset=utf-8"
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; worker-src 'none'; img-src data:; font-src 'none'; base-uri 'none'; form-action 'none'",
    "X-HigherBits-Fixture": "synthetic-local",
  })
  response.end(content ?? "Not found")
})

server.on("error", (error) => { console.error(error); process.exitCode = 1 })
server.listen(3217, "127.0.0.1", () => {
  console.log(`Isolated Home fixture ready at ${origin}; ${inputs.length} bundled local inputs`)
})
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close())
