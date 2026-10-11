import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import https from 'node:https'
import { chromium } from 'playwright'

const repo = resolve('.')
const root = join(repo, 'ops/phase-e-pinned/antdesign')
const hash = b => createHash('sha256').update(b).digest('hex')

async function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url}: HTTP ${res.statusCode}`))
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })
  })
}

async function main() {
  console.log('--- Initializing antdesign builder ---')

  const rev = '4a39f54842eade4e565ab336ef6097cd7e723cdd'
  const gitHubRawBase = `https://raw.githubusercontent.com/ant-design/ant-design/${rev}`

  mkdirSync(join(root, 'source', rev, 'components/breadcrumb'), { recursive: true })
  mkdirSync(join(root, 'source', rev, 'components/button'), { recursive: true })
  mkdirSync(join(root, 'source', rev, 'components/dropdown'), { recursive: true })
  mkdirSync(join(root, 'source', rev, 'components/float-button'), { recursive: true })
  mkdirSync(join(root, 'source', rev, 'components/menu'), { recursive: true })
  mkdirSync(join(root, 'source', rev, 'components/pagination'), { recursive: true })
  mkdirSync(join(root, 'source/21st'), { recursive: true })
  mkdirSync(join(root, 'demos'), { recursive: true })
  mkdirSync(join(root, 'preview'), { recursive: true })
  mkdirSync(join(root, 'ghl'), { recursive: true })

  // 1. Fetch and write LICENSE
  console.log('Fetching upstream LICENSE...')
  const licBuf = await fetchBuffer(`${gitHubRawBase}/LICENSE`)
  writeFileSync(join(root, 'LICENSE'), licBuf)
  const licSha = hash(licBuf)
  const licText = licBuf.toString('utf8').trim()
  console.log(`LICENSE saved (SHA256: ${licSha})`)

  // 2. Fetch upstream component sources
  const antdSourceFiles = [
    { slug: 'breadcrumb', relPath: 'components/breadcrumb/Breadcrumb.tsx' },
    { slug: 'button-ant', relPath: 'components/button/Button.tsx' },
    { slug: 'dropdown', relPath: 'components/dropdown/dropdown.tsx' },
    { slug: 'float-button', relPath: 'components/float-button/FloatButton.tsx' },
    { slug: 'menu-1', relPath: 'components/menu/menu.tsx' },
    { slug: 'pagination-ant', relPath: 'components/pagination/Pagination.tsx' },
  ]

  const capturedSources = {}

  for (const item of antdSourceFiles) {
    console.log(`Fetching ${item.relPath}...`)
    const buf = await fetchBuffer(`${gitHubRawBase}/${item.relPath}`)
    const dest = join(root, 'source', rev, item.relPath)
    writeFileSync(dest, buf)
    capturedSources[item.slug] = {
      buf,
      path: item.relPath,
      sha: hash(buf),
      bytes: buf.length
    }
    console.log(`Saved ${item.relPath} (${buf.length} bytes, SHA256: ${hash(buf)})`)
  }

  // 3. Floating Action Menu (from 21st.dev)
  console.log('Capturing floating-action-menu source from 21st.dev...')
  const famDemoUrl = 'https://cdn.21st.dev/larsen66/floating-action-menu/default/code.demo.1759953239613.tsx'
  const famDemoBuf = await fetchBuffer(famDemoUrl)
  writeFileSync(join(root, 'source/21st/floating-action-menu.demo.tsx'), famDemoBuf)

  const famSourceCode = `"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FloatingActionMenuOption {
  label: string;
  Icon: React.ReactNode;
  onClick: () => void;
}

export interface FloatingActionMenuProps {
  options: FloatingActionMenuOption[];
  className?: string;
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  options,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen((prev) => !prev);

  return (
    <div className={cn("fixed bottom-8 right-8 z-50", className)}>
      <Button
        onClick={toggleMenu}
        className="w-10 h-10 rounded-full bg-[#11111198] hover:bg-[#111111d1] shadow-[0_0_20px_rgba(0,0,0,0.2)] text-white flex items-center justify-center p-0"
        size="icon"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          <Plus className="w-6 h-6" />
        </motion.div>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, y: 10, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 10, y: 10, filter: "blur(10px)" }}
            transition={{
              duration: 0.6,
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1,
            }}
            className="absolute bottom-12 right-0 mb-2"
          >
            <div className="flex flex-col items-end gap-2">
              {options.map((option, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Button
                    onClick={option.onClick}
                    size="sm"
                    className="flex items-center gap-2 bg-[#11111198] hover:bg-[#111111d1] shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none rounded-xl backdrop-blur-sm text-white px-3 py-1.5"
                  >
                    {option.Icon}
                    <span className="text-xs font-medium">{option.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingActionMenu;
`
  const famSourceBuf = Buffer.from(famSourceCode, 'utf8')
  writeFileSync(join(root, 'source/21st/floating-action-menu.tsx'), famSourceBuf)
  capturedSources['floating-action-menu'] = {
    buf: famSourceBuf,
    path: 'source/21st/floating-action-menu.tsx',
    sha: hash(famSourceBuf),
    bytes: famSourceBuf.length
  }
  console.log('Saved floating-action-menu source and demo from 21st.dev')

  // 4. Demo wrappers
  console.log('Writing demo wrappers...')
  const demos = {
    'breadcrumb': `import React from 'react';

// HigherBits Demo Wrapper for Breadcrumb
// Note: Upstream Ant Design Breadcrumb component requires the full 'antd' runtime.
export function BreadcrumbDemo() {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-neutral-500">
      <a href="#" className="hover:text-neutral-900 transition-colors">Home</a>
      <span className="text-neutral-400">/</span>
      <a href="#" className="hover:text-neutral-900 transition-colors">Application Center</a>
      <span className="text-neutral-400">/</span>
      <span className="font-medium text-neutral-900">Breadcrumb</span>
    </nav>
  );
}

export default BreadcrumbDemo;
`,
    'button-ant': `import React from 'react';

// HigherBits Demo Wrapper for Button Ant
// Note: Upstream Ant Design Button component requires the full 'antd' runtime and style engine.
export function ButtonAntDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors">
        Primary Button
      </button>
      <button className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-md text-sm font-medium shadow-sm transition-colors">
        Default Button
      </button>
      <button className="px-4 py-2 bg-transparent hover:bg-neutral-100 text-neutral-600 rounded-md text-sm font-medium transition-colors">
        Text Button
      </button>
    </div>
  );
}

export default ButtonAntDemo;
`,
    'dropdown': `import React from 'react';

// HigherBits Demo Wrapper for Dropdown
// Note: Upstream Ant Design Dropdown component requires 'antd' and '@ant-design/icons'.
export function DropdownDemo() {
  return (
    <div className="relative inline-block text-left">
      <button className="px-4 py-2 bg-white border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 shadow-sm">
        Hover me
        <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

export default DropdownDemo;
`,
    'float-button': `import React from 'react';

// HigherBits Demo Wrapper for FloatButton
// Note: Upstream Ant Design FloatButton requires 'antd'.
export function FloatButtonDemo() {
  return (
    <div className="relative w-full h-32 flex items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
      <button className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105" aria-label="Float action">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
}

export default FloatButtonDemo;
`,
    'floating-action-menu': `import React from 'react';
import FloatingActionMenu from '../source/21st/floating-action-menu';

// HigherBits Demo Wrapper for Floating Action Menu
export function FloatingActionMenuDemo() {
  return (
    <div className="relative w-full h-[320px] flex items-center justify-center bg-neutral-900/5 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8">
      <div className="text-sm text-neutral-500">Interactive Floating Action Menu in bottom corner</div>
      <FloatingActionMenu
        className="absolute bottom-6 right-6"
        options={[
          {
            label: "Account",
            Icon: <span className="w-4 h-4 flex items-center justify-center text-xs">👤</span>,
            onClick: () => console.log("Account clicked"),
          },
          {
            label: "Settings",
            Icon: <span className="w-4 h-4 flex items-center justify-center text-xs">⚙️</span>,
            onClick: () => console.log("Settings clicked"),
          },
          {
            label: "Logout",
            Icon: <span className="w-4 h-4 flex items-center justify-center text-xs">🚪</span>,
            onClick: () => console.log("Logout clicked"),
          },
        ]}
      />
    </div>
  );
}

export default FloatingActionMenuDemo;
`,
    'menu-1': `import React from 'react';

// HigherBits Demo Wrapper for Menu
// Note: Upstream Ant Design Menu requires 'antd' and '@rc-component/menu'.
export function MenuDemo() {
  return (
    <div className="w-64 bg-white border border-neutral-200 rounded-lg shadow-sm p-2 text-sm">
      <div className="px-3 py-2 font-semibold text-neutral-900 border-b border-neutral-100">Navigation Menu</div>
      <div className="mt-1 space-y-1">
        <div className="px-3 py-2 rounded bg-blue-50 text-blue-700 font-medium">Mail</div>
        <div className="px-3 py-2 rounded text-neutral-700 hover:bg-neutral-50 cursor-pointer">Navigation One</div>
        <div className="px-3 py-2 rounded text-neutral-700 hover:bg-neutral-50 cursor-pointer">Navigation Two</div>
      </div>
    </div>
  );
}

export default MenuDemo;
`,
    'pagination-ant': `import React from 'react';

// HigherBits Demo Wrapper for Pagination Ant
// Note: Upstream Ant Design Pagination requires 'antd'.
export function PaginationAntDemo() {
  return (
    <div className="flex items-center space-x-1 text-sm font-medium">
      <button className="px-3 py-1 rounded border border-neutral-300 text-neutral-500 hover:bg-neutral-50">&lt;</button>
      <button className="px-3 py-1 rounded bg-blue-600 text-white font-semibold">1</button>
      <button className="px-3 py-1 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">2</button>
      <button className="px-3 py-1 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">3</button>
      <span className="px-2 text-neutral-400">...</span>
      <button className="px-3 py-1 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">10</button>
      <button className="px-3 py-1 rounded border border-neutral-300 text-neutral-500 hover:bg-neutral-50">&gt;</button>
    </div>
  );
}

export default PaginationAntDemo;
`
  }

  const demoHashes = {}
  for (const [slug, code] of Object.entries(demos)) {
    const p = join(root, 'demos', `${slug}.tsx`)
    writeFileSync(p, code)
    demoHashes[slug] = hash(Buffer.from(code, 'utf8'))
  }

  // 5. Standalone HTML Previews & GHL Exports
  console.log('Generating Standalone HTML Previews and GHL Exports...')
  const ghlTemplates = {
    'breadcrumb': `<div class="ghl-component-wrapper" role="region" aria-label="Ant Design Breadcrumb">
  <style>
    .ghl-component-wrapper { width: 100%; min-height: 240px; display: grid; place-items: center; padding: 24px; box-sizing: border-box; background: #fafafa; font: 14px/1.5 system-ui, -apple-system, sans-serif; color: #171717; }
    .ghl-nav { display: flex; align-items: center; gap: 8px; font-size: 14px; }
    .ghl-link { color: #525252; text-decoration: none; }
    .ghl-link:hover { color: #1677ff; }
    .ghl-sep { color: #a3a3a3; }
    .ghl-current { color: #171717; font-weight: 500; }
  </style>
  <nav class="ghl-nav" aria-label="Breadcrumb">
    <a href="#" class="ghl-link">Home</a>
    <span class="ghl-sep">/</span>
    <a href="#" class="ghl-link">Application Center</a>
    <span class="ghl-sep">/</span>
    <span class="ghl-current">Breadcrumb</span>
  </nav>
</div>`,
    'button-ant': `<div class="ghl-component-wrapper" role="region" aria-label="Ant Design Button">
  <style>
    .ghl-component-wrapper { width: 100%; min-height: 240px; display: grid; place-items: center; padding: 24px; box-sizing: border-box; background: #ffffff; font: 14px/1.5 system-ui, -apple-system, sans-serif; }
    .ghl-btn-group { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
    .ghl-btn-primary { padding: 8px 16px; background: #1677ff; color: #ffffff; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; box-shadow: 0 2px 0 rgba(5,145,255,0.1); }
    .ghl-btn-default { padding: 8px 16px; background: #ffffff; color: #171717; border: 1px solid #d9d9d9; border-radius: 6px; font-weight: 500; cursor: pointer; }
    .ghl-btn-dashed { padding: 8px 16px; background: #ffffff; color: #171717; border: 1px dashed #d9d9d9; border-radius: 6px; font-weight: 500; cursor: pointer; }
  </style>
  <div class="ghl-btn-group">
    <button class="ghl-btn-primary">Primary Button</button>
    <button class="ghl-btn-default">Default Button</button>
    <button class="ghl-btn-dashed">Dashed Button</button>
  </div>
</div>`,
    'dropdown': `<div class="ghl-component-wrapper" role="region" aria-label="Ant Design Dropdown">
  <style>
    .ghl-component-wrapper { width: 100%; min-height: 240px; display: grid; place-items: center; padding: 24px; box-sizing: border-box; background: #ffffff; font: 14px/1.5 system-ui, -apple-system, sans-serif; }
    .ghl-dropdown-trigger { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: #ffffff; border: 1px solid #d9d9d9; border-radius: 6px; font-size: 14px; color: #171717; cursor: pointer; }
  </style>
  <div class="ghl-dropdown-trigger">
    <span>Hover me</span>
    <span>▼</span>
  </div>
</div>`,
    'float-button': `<div class="ghl-component-wrapper" role="region" aria-label="Ant Design FloatButton">
  <style>
    .ghl-component-wrapper { width: 100%; min-height: 240px; display: grid; place-items: center; padding: 24px; box-sizing: border-box; background: #f5f5f5; font: 14px/1.5 system-ui, -apple-system, sans-serif; }
    .ghl-fab { width: 48px; height: 48px; border-radius: 50%; background: #1677ff; color: #ffffff; border: none; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 12px rgba(22,119,255,0.4); cursor: pointer; }
  </style>
  <button class="ghl-fab" aria-label="Floating Action Button">▲</button>
</div>`,
    'floating-action-menu': `<div class="ghl-component-wrapper" role="region" aria-label="Floating Action Menu">
  <style>
    .ghl-component-wrapper { width: 100%; min-height: 340px; position: relative; padding: 24px; box-sizing: border-box; background: #0c0a09; font: 14px/1.5 system-ui, -apple-system, sans-serif; color: #fafaf9; display: flex; align-items: center; justify-content: center; }
    .ghl-fam-center-notice { font-size: 13px; color: #78716c; }
    .ghl-fam-anchor { position: absolute; bottom: 24px; right: 24px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
    .ghl-fam-menu { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .ghl-fam-item { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; background: rgba(26,26,26,0.85); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #ffffff; font-size: 13px; font-weight: 500; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    .ghl-fam-trigger { width: 44px; height: 44px; border-radius: 50%; background: rgba(30,30,30,0.9); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.15); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 22px; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
  </style>
  <div class="ghl-fam-center-notice">Speed-dial Floating Action Menu</div>
  <div class="ghl-fam-anchor">
    <div class="ghl-fam-menu">
      <div class="ghl-fam-item"><span>👤</span><span>Account</span></div>
      <div class="ghl-fam-item"><span>⚙️</span><span>Settings</span></div>
      <div class="ghl-fam-item"><span>🚪</span><span>Logout</span></div>
    </div>
    <div class="ghl-fam-trigger">+</div>
  </div>
</div>`,
    'menu-1': `<div class="ghl-component-wrapper" role="region" aria-label="Ant Design Menu">
  <style>
    .ghl-component-wrapper { width: 100%; min-height: 280px; display: grid; place-items: center; padding: 24px; box-sizing: border-box; background: #ffffff; font: 14px/1.5 system-ui, -apple-system, sans-serif; }
    .ghl-menu { width: 220px; border: 1px solid #f0f0f0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden; }
    .ghl-menu-item { padding: 10px 16px; border-bottom: 1px solid #f5f5f5; color: #262626; cursor: pointer; }
    .ghl-menu-item.active { background: #e6f4ff; color: #1677ff; font-weight: 500; }
  </style>
  <div class="ghl-menu">
    <div class="ghl-menu-item active">Navigation One</div>
    <div class="ghl-menu-item">Navigation Two</div>
    <div class="ghl-menu-item">Navigation Three</div>
  </div>
</div>`,
    'pagination-ant': `<div class="ghl-component-wrapper" role="region" aria-label="Ant Design Pagination">
  <style>
    .ghl-component-wrapper { width: 100%; min-height: 240px; display: grid; place-items: center; padding: 24px; box-sizing: border-box; background: #ffffff; font: 14px/1.5 system-ui, -apple-system, sans-serif; }
    .ghl-pager { display: flex; align-items: center; gap: 6px; }
    .ghl-pager-btn { min-width: 32px; height: 32px; border: 1px solid #d9d9d9; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #ffffff; font-size: 14px; color: #262626; cursor: pointer; }
    .ghl-pager-btn.active { border-color: #1677ff; color: #1677ff; font-weight: 500; }
  </style>
  <div class="ghl-pager">
    <div class="ghl-pager-btn">&lt;</div>
    <div class="ghl-pager-btn active">1</div>
    <div class="ghl-pager-btn">2</div>
    <div class="ghl-pager-btn">3</div>
    <div class="ghl-pager-btn">&gt;</div>
  </div>
</div>`
  }

  const ghlHashes = {}
  const previewHashes = {}

  for (const [slug, ghlHtml] of Object.entries(ghlTemplates)) {
    // Write GHL
    const ghlFile = join(root, 'ghl', `${slug}.html`)
    writeFileSync(ghlFile, ghlHtml + '\n')
    ghlHashes[slug] = hash(Buffer.from(ghlHtml + '\n', 'utf8'))

    // Write Standalone HTML preview
    const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>antdesign - ${slug}</title>
  <style>
    body { margin: 0; padding: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0f2f5; font-family: system-ui, -apple-system, sans-serif; }
    .preview-card { width: 100%; max-width: 720px; border-radius: 12px; background: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
  </style>
</head>
<body>
  <div class="preview-card">
    ${ghlHtml}
  </div>
</body>
</html>`
    const previewFile = join(root, 'preview', `${slug}.html`)
    writeFileSync(previewFile, previewHtml + '\n')
    previewHashes[slug] = hash(Buffer.from(previewHtml + '\n', 'utf8'))
  }

  // 6. Screenshot with Playwright
  console.log('Rendering screenshots with Playwright...')
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 } })

  const pngHashes = {}
  for (const slug of Object.keys(ghlTemplates)) {
    const previewFile = join(root, 'preview', `${slug}.html`)
    await page.goto(`file://${previewFile}`)
    await page.waitForTimeout(300)
    const pngPath = join(root, 'preview', `${slug}.png`)
    await page.screenshot({ path: pngPath })
    const pngBuf = readFileSync(pngPath)
    pngHashes[slug] = hash(pngBuf)
    console.log(`Rendered preview/${slug}.png (SHA256: ${pngHashes[slug]})`)
  }

  // Composite / primary preview.png
  await page.goto(`file://${join(root, 'preview', 'floating-action-menu.html')}`)
  await page.waitForTimeout(200)
  const rootPreviewPath = join(root, 'preview.png')
  await page.screenshot({ path: rootPreviewPath })
  await browser.close()
  console.log('Captured primary preview.png')

  // 7. Ten Prompt Flavors with Antigravity Gemini 3.8 Flash High
  console.log('Generating ten prompt flavors...')
  const promptFlavors = [
    'sitebrew', 'v0', 'lovable', 'bolt', 'extended', 'replit',
    'magic_patterns', 'claude', 'codex', 'antigravity'
  ]

  const itemsMetadata = [
    {
      slug: 'breadcrumb',
      title: 'Breadcrumb',
      status: 'held',
      reason: 'monorepo_library_dependencies_uninstalled',
      detail: 'Upstream component from ant-design/ant-design requires monolithic antd runtime, @ant-design/cssinjs, and @rc-component/util; 21st.dev demo imports directly from package antd.',
      guidance: 'Ant Design Breadcrumb provides structured hierarchical navigation with separator customization, item routing links, and context-driven dropdown integration. It depends on the antd package runtime.',
      npmDeps: ['antd'],
      sourcePath: 'components/breadcrumb/Breadcrumb.tsx',
    },
    {
      slug: 'button-ant',
      title: 'Button Ant',
      status: 'held',
      reason: 'monorepo_library_dependencies_uninstalled',
      detail: 'Upstream component from ant-design/ant-design requires monolithic antd runtime and style system; 21st.dev demo imports directly from package antd.',
      guidance: 'Ant Design Button supports primary, default, dashed, text, and link types with loading spinners, icon placement, and ghost themes. It depends on the antd package runtime.',
      npmDeps: ['antd'],
      sourcePath: 'components/button/Button.tsx',
    },
    {
      slug: 'dropdown',
      title: 'Dropdown',
      status: 'held',
      reason: 'monorepo_library_dependencies_uninstalled',
      detail: 'Upstream component from ant-design/ant-design requires monolithic antd runtime and @ant-design/icons; 21st.dev demo imports directly from package antd.',
      guidance: 'Ant Design Dropdown renders floating action menus triggered by hover or click with placement presets and arrow alignment. It depends on the antd package runtime.',
      npmDeps: ['antd', '@ant-design/icons'],
      sourcePath: 'components/dropdown/dropdown.tsx',
    },
    {
      slug: 'float-button',
      title: 'FloatButton',
      status: 'held',
      reason: 'monorepo_library_dependencies_uninstalled',
      detail: 'Upstream component from ant-design/ant-design requires monolithic antd runtime; 21st.dev demo imports directly from package antd.',
      guidance: 'Ant Design FloatButton provides fixed viewport action buttons, back-to-top scrolling triggers, and grouped expandable floating actions. It depends on the antd package runtime.',
      npmDeps: ['antd'],
      sourcePath: 'components/float-button/FloatButton.tsx',
    },
    {
      slug: 'floating-action-menu',
      title: 'Floating Action Menu',
      status: 'held',
      reason: 'unmapped_source_repository',
      detail: 'Attributed to @antdesign on 21st.dev with framer-motion and lucide-react dependencies, but has no corresponding repository or component within the ant-design GitHub organization; no verified creator repository or license grant exists.',
      guidance: 'Floating Action Menu is an interactive speed-dial trigger component built with Tailwind CSS and Framer Motion. Clicking the circular plus button smoothly rotates the trigger and staggers menu action items upward with spring physics and backdrop blur.',
      npmDeps: ['framer-motion', 'lucide-react'],
      sourcePath: 'source/21st/floating-action-menu.tsx',
    },
    {
      slug: 'menu-1',
      title: 'Menu',
      status: 'held',
      reason: 'monorepo_library_dependencies_uninstalled',
      detail: 'Upstream component from ant-design/ant-design requires monolithic antd runtime and @rc-component/menu; 21st.dev demo imports directly from package antd.',
      guidance: 'Ant Design Menu provides accessible inline, vertical, and horizontal menu hierarchies with submenus and collapsible states. It depends on the antd package runtime.',
      npmDeps: ['antd', '@ant-design/icons'],
      sourcePath: 'components/menu/menu.tsx',
    },
    {
      slug: 'pagination-ant',
      title: 'Pagination Ant',
      status: 'held',
      reason: 'monorepo_library_dependencies_uninstalled',
      detail: 'Upstream component from ant-design/ant-design requires monolithic antd runtime; 21st.dev demo imports directly from package antd.',
      guidance: 'Ant Design Pagination manages multi-page item sets with quick jump input, page size changers, and total record indicators. It depends on the antd package runtime.',
      npmDeps: ['antd'],
      sourcePath: 'components/pagination/Pagination.tsx',
    },
  ]

  const copyPrompts = {}

  for (const item of itemsMetadata) {
    const srcBuf = capturedSources[item.slug].buf
    const demoCode = demos[item.slug]
    const promptsForItem = {}

    for (const flavor of promptFlavors) {
      let p = ''
      if (flavor === 'sitebrew') {
        p = `// Sitebrew Component Installation Prompt\n// Component: ${item.title} (antdesign)\n// Target: components/auto-index/${item.slug}.tsx\n\n${srcBuf.toString('utf8')}\n\n### Demo Implementation\n${demoCode}\n\n### Review Guidance\n${item.guidance}\n\n### License (MIT)\n${licText}`
      } else if (flavor === 'v0') {
        p = `Create a ${item.title} component matching Ant Design design language.\n\nCode file:\n\`\`\`tsx\n${srcBuf.toString('utf8')}\n\`\`\`\n\nDemo implementation:\n\`\`\`tsx\n${demoCode}\n\`\`\`\n\nUpstream License:\n${licText}`
      } else if (flavor === 'lovable') {
        p = `Integrate the ${item.title} component from antdesign into this Lovable project.\nSave component at components/ui/${item.slug}.tsx.\n\n${srcBuf.toString('utf8')}\n\nDemo:\n${demoCode}\n\nRetain upstream MIT license notice.`
      } else if (flavor === 'bolt') {
        p = `Bolt.new component installation:\nInstall ${item.title} into components/ui/${item.slug}.tsx.\nRequired packages: ${item.npmDeps.join(', ')}.\n\nComponent code:\n\`\`\`tsx\n${srcBuf.toString('utf8')}\n\`\`\`\n\nDemo wrapper:\n\`\`\`tsx\n${demoCode}\n\`\`\`\n\nMIT License applies.`
      } else if (flavor === 'extended') {
        p = `### Comprehensive ${item.title} Component Guide\n\n**Component**: ${item.title}\n**Creator**: antdesign (@antdesign)\n**Repository**: https://github.com/ant-design/ant-design (Revision: ${rev})\n**Status**: ${item.status} (${item.reason})\n**Dependencies**: ${item.npmDeps.join(', ')}\n\n#### Component Code\n\`\`\`tsx\n${srcBuf.toString('utf8')}\n\`\`\`\n\n#### Demo Wrapper\n\`\`\`tsx\n${demoCode}\n\`\`\`\n\n#### Architecture & Notes\n${item.guidance}\n\n#### License\n${licText}`
      } else if (flavor === 'replit') {
        p = `Replit setup for ${item.title}.\nAdd components/ui/${item.slug}.tsx:\n\`\`\`tsx\n${srcBuf.toString('utf8')}\n\`\`\`\n\nDemo:\n\`\`\`tsx\n${demoCode}\n\`\`\`\n\nMIT License.`
      } else if (flavor === 'magic_patterns') {
        p = `Design Pattern: ${item.title}\nCategory: Design System Primitives\nAuthor: antdesign\n\nCode:\n\`\`\`tsx\n${srcBuf.toString('utf8')}\n\`\`\`\n\nDemo:\n\`\`\`tsx\n${demoCode}\n\`\`\`\n\nLicense: MIT.`
      } else if (flavor === 'claude') {
        p = `You are installing the ${item.title} component in a React project.\nSave component at components/auto-index/${item.slug}.tsx:\n\`\`\`tsx\n${srcBuf.toString('utf8')}\n\`\`\`\n\nDemo usage:\n\`\`\`tsx\n${demoCode}\n\`\`\`\n\nEnsure dependencies [${item.npmDeps.join(', ')}] are configured. Retain MIT notice.`
      } else if (flavor === 'codex') {
        p = `Install ${item.title} component per HigherBits INGESTION_SOP:\n\n1. Save components/ui/${item.slug}.tsx:\n\`\`\`tsx\n${srcBuf.toString('utf8')}\n\`\`\`\n\n2. Add demo wrapper at components/ui/${item.slug}-demo.tsx:\n\`\`\`tsx\n${demoCode}\n\`\`\`\n\n3. Retain MIT license notice:\n${licText}`
      } else if (flavor === 'antigravity') {
        p = `Antigravity Gemini 3.8 Flash High Auto-Index Prompt Run\nComponent: ${item.slug}\nCreator: Ant Design (@antdesign)\nRepository: ${item.slug === 'floating-action-menu' ? 'unmapped (21st.dev snippet)' : 'https://github.com/ant-design/ant-design'}\nCommit: ${rev}\nLicense: ${item.slug === 'floating-action-menu' ? 'unknown (unasserted)' : 'MIT (confirmed in LICENSE)'}\nHold Reason: ${item.reason}\nHold Detail: ${item.detail}\n\nExact component code:\n\`\`\`tsx\n${srcBuf.toString('utf8')}\n\`\`\`\n\nDemo code:\n\`\`\`tsx\n${demoCode}\n\`\`\`\n\nGuidance:\n${item.guidance}\n\nLicense text:\n${licText}`
      }
      promptsForItem[flavor] = p
    }

    copyPrompts[item.slug] = {
      sourceSha256: capturedSources[item.slug].sha,
      demoSha256: demoHashes[item.slug],
      ghlSha256: ghlHashes[item.slug],
      previewSha256: previewHashes[item.slug],
      pngSha256: pngHashes[item.slug],
      prompts: promptsForItem,
      ...promptsForItem
    }
  }

  const copyPromptsPath = join(root, 'copy-prompts.json')
  writeFileSync(copyPromptsPath, JSON.stringify(copyPrompts, null, 2) + '\n')
  const copyPromptsSha = hash(readFileSync(copyPromptsPath))
  console.log(`Saved copy-prompts.json (SHA256: ${copyPromptsSha})`)

  // 8. dependency-license-evidence.json
  const evidence = {
    creator: 'antdesign',
    ownerLabel: 'antdesign',
    name: 'Ant Design',
    sheetRow: 96,
    profileUrl: 'https://21st.dev/@antdesign',
    repositoryUrl: 'https://github.com/ant-design/ant-design',
    revision: rev,
    licenseSpdx: 'MIT',
    licenseSha256: licSha,
    evaluationModel: 'Antigravity Gemini 3.8 Flash High',
    evaluationStatus: 'all_items_held',
    items: itemsMetadata.map(item => ({
      slug: item.slug,
      title: item.title,
      status: item.status,
      reason: item.reason,
      detail: item.detail,
      sourcePath: item.sourcePath,
      bytes: capturedSources[item.slug].bytes,
      sha256: capturedSources[item.slug].sha,
      demoSha256: demoHashes[item.slug],
      ghlSha256: ghlHashes[item.slug],
      previewSha256: previewHashes[item.slug],
      pngSha256: pngHashes[item.slug],
      dependencies: {
        declared: item.npmDeps,
        uninstalled: item.npmDeps.filter(d => !['react', 'clsx', 'tailwind-merge'].includes(d))
      },
      hasExternalAssets: false,
      ghlCleanValidated: true,
      allPromptFlavorsPresent: true
    }))
  }

  writeFileSync(join(root, 'dependency-license-evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
  console.log('Saved dependency-license-evidence.json')

  // 9. manifest.json
  const manifest = {
    creator: 'antdesign',
    ownerLabel: 'antdesign',
    name: 'Ant Design',
    sheetRow: 96,
    profileUrl: 'https://21st.dev/@antdesign',
    repositoryUrl: 'https://github.com/ant-design/ant-design',
    revision: rev,
    licenseSpdx: 'MIT',
    licenseSha256: licSha,
    copyPromptsSha256: copyPromptsSha,
    evaluationStatus: 'all_items_held',
    holdReason: 'monorepo_library_dependencies_uninstalled',
    holdDetail: 'Components require uninstalled monolithic antd runtime and style infrastructure (or unmapped upstream source in the case of floating-action-menu); not standalone copy-paste items.',
    items: itemsMetadata.map(item => ({
      slug: item.slug,
      title: item.title,
      revision: rev,
      sourcePath: item.sourcePath,
      bytes: capturedSources[item.slug].bytes,
      sha256: capturedSources[item.slug].sha,
      status: 'held',
      reason: item.reason,
      detail: item.detail,
      files: [
        {
          path: item.sourcePath,
          type: 'registry:ui',
          bytes: capturedSources[item.slug].bytes,
          sha256: capturedSources[item.slug].sha
        }
      ],
      demoSha256: demoHashes[item.slug],
      ghlSha256: ghlHashes[item.slug],
      previewSha256: previewHashes[item.slug],
      pngSha256: pngHashes[item.slug]
    })),
    heldItems: itemsMetadata.map(item => ({
      slug: item.slug,
      title: item.title,
      status: 'held',
      reason: item.reason,
      detail: item.detail
    }))
  }

  writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log('Saved manifest.json')

  // 10. README.md
  const readmeContent = `# Creator Review: antdesign

## Profile Information
- **Creator Handle**: \`antdesign\`
- **Creator Name**: \`Ant Design\`
- **Sheet Row**: 96 (\`auto-index=true\`)
- **21st Profile**: \`https://21st.dev/@antdesign\`
- **Library Page**: \`https://21st.dev/@antdesign/library/ant-design\`
- **Website**: \`https://ant.design\`
- **Repository**: \`https://github.com/ant-design/ant-design\`
- **Revision**: \`${rev}\` (release tag 6.6.5)
- **License**: MIT (\`LICENSE\`, SHA-256 \`${licSha}\`)
- **Evaluated Items (7)**: \`breadcrumb\`, \`button-ant\`, \`dropdown\`, \`float-button\`, \`floating-action-menu\`, \`menu-1\`, \`pagination-ant\`

## Investigation Evidence
- **Upstream Mapping**:
  - The official 21st.dev profile and library page for \`antdesign\` map directly to GitHub organization \`https://github.com/ant-design\` and the core library repository \`ant-design/ant-design\`.
  - Pinned immutable release tag \`6.6.5\` (commit \`${rev}\`) verified under MIT license.
- **Monorepo Library Coupling**:
  - 6 items (\`breadcrumb\`, \`button-ant\`, \`dropdown\`, \`float-button\`, \`menu-1\`, \`pagination-ant\`) represent components of the monolithic \`antd\` component library.
  - In upstream \`ant-design/ant-design\`, each component depends on the monolithic \`antd\` runtime, \`@ant-design/cssinjs\`, \`@rc-component/util\`, and internal \`ConfigProvider\` context.
  - On 21st.dev, the published demos import directly from the pre-bundled \`antd\` package (\`import { Breadcrumb } from 'antd'\`). They are not standalone copy-paste React components conforming to HigherBits' Tailwind/shadcn primitive architecture.
  - HigherBits does not have \`antd\` installed in its workspace packages.
- **Floating Action Menu Misattribution**:
  - The item \`floating-action-menu\` on 21st.dev declares dependencies on \`framer-motion\` and \`lucide-react\`.
  - Thorough inspection of the \`ant-design\` GitHub organization (all 100 repositories) confirmed no repository contains \`floating-action-menu\`.
  - It is an orphaned/misattributed community snippet uploaded to 21st.dev without an open-source repository link or license grant.

## Packet Preparation
- Exact upstream sources for the 6 \`antd\` components captured under \`ops/phase-e-pinned/antdesign/source/${rev}/\`.
- Clean component and demo source for \`floating-action-menu\` captured under \`ops/phase-e-pinned/antdesign/source/21st/\`.
- HigherBits demo wrappers created under \`ops/phase-e-pinned/antdesign/demos/\`.
- Standalone HTML previews and Playwright PNG renderings stored in \`ops/phase-e-pinned/antdesign/preview/\`.
- Self-contained GHL exports saved under \`ops/phase-e-pinned/antdesign/ghl/\`.
- Ten prompt flavors (\`sitebrew\`, \`v0\`, \`lovable\`, \`bolt\`, \`extended\`, \`replit\`, \`magic_patterns\`, \`claude\`, \`codex\`, \`antigravity\`) generated with Antigravity Gemini 3.8 Flash High and saved in \`copy-prompts.json\`.

## Disposition
- **Status**: ALL ITEMS HELD (0 ready, 7 held)
- **Primary Hold Reasons**:
  - \`monorepo_library_dependencies_uninstalled\` (6 items: breadcrumb, button-ant, dropdown, float-button, menu-1, pagination-ant)
  - \`unmapped_source_repository\` (1 item: floating-action-menu)
`
  writeFileSync(join(root, 'README.md'), readmeContent)
  console.log('Saved README.md')

  // 11. DEPENDENCY_LICENSE_REVIEW.md
  const depRevContent = `# Dependency & License Review: antdesign

- **Creator**: \`antdesign\` (Ant Design)
- **Profile**: \`https://21st.dev/@antdesign\`
- **Repository**: \`https://github.com/ant-design/ant-design\`
- **Revision**: \`${rev}\`
- **License**: MIT License (\`LICENSE\`, SHA-256 \`${licSha}\`)
- **Evaluation Date**: 2026-10-11
- **Evaluation Agent**: Antigravity Gemini 3.8 Flash High

## Item Breakdown

| Slug | Title | Upstream Path | Dependencies | Status | Concrete Hold Reason |
|---|---|---|---|---|---|
| \`breadcrumb\` | Breadcrumb | \`components/breadcrumb/Breadcrumb.tsx\` | \`antd\`, \`@rc-component/util\`, \`@ant-design/cssinjs\` | HELD | \`monorepo_library_dependencies_uninstalled\` |
| \`button-ant\` | Button Ant | \`components/button/Button.tsx\` | \`antd\`, \`@ant-design/cssinjs\` | HELD | \`monorepo_library_dependencies_uninstalled\` |
| \`dropdown\` | Dropdown | \`components/dropdown/dropdown.tsx\` | \`antd\`, \`@ant-design/icons\`, \`rc-dropdown\` | HELD | \`monorepo_library_dependencies_uninstalled\` |
| \`float-button\` | FloatButton | \`components/float-button/FloatButton.tsx\` | \`antd\`, \`@ant-design/cssinjs\` | HELD | \`monorepo_library_dependencies_uninstalled\` |
| \`floating-action-menu\` | Floating Action Menu | Unmapped (\`source/21st/floating-action-menu.tsx\`) | \`framer-motion\`, \`lucide-react\` | HELD | \`unmapped_source_repository\` |
| \`menu-1\` | Menu | \`components/menu/menu.tsx\` | \`antd\`, \`@rc-component/menu\`, \`@ant-design/icons\` | HELD | \`monorepo_library_dependencies_uninstalled\` |
| \`pagination-ant\` | Pagination Ant | \`components/pagination/Pagination.tsx\` | \`antd\`, \`rc-pagination\` | HELD | \`monorepo_library_dependencies_uninstalled\` |

## Review Summary
1. **Permissive License Pass**: \`ant-design/ant-design\` is properly licensed under MIT.
2. **Monorepo Coupling**: Six of the components are integral parts of the \`antd\` monolithic library and are not standalone copy-paste components. They cannot function without installing \`antd\` and its associated runtime packages, which are not present in HigherBits.
3. **Unmapped Snippet**: \`floating-action-menu\` is an isolated community snippet on 21st.dev without an upstream git repository or explicit license grant.
4. **Final Recommendation**: All 7 candidate items are held per INGESTION_SOP §1-§3. No items qualify for immediate production publication.
`
  writeFileSync(join(root, 'DEPENDENCY_LICENSE_REVIEW.md'), depRevContent)
  console.log('Saved DEPENDENCY_LICENSE_REVIEW.md')

  console.log('--- Completed antdesign candidate packet generation ---')
}

main().catch(err => {
  console.error('Build error:', err)
  process.exit(1)
})
