#!/usr/bin/env node
// Scratch verification: scroll-test the preview bundle and the GHL export to prove the fade-mask
// behavior reacts to real scroll position (not just a static render).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const web = join(repo, 'apps/web')
const root = join(repo, 'ops/phase-e-pinned/linasameer')
const outDir = join(root, 'interaction-check')
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 900, height: 500 } })
const errors = []
page.on('pageerror', error => errors.push(String(error)))
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

// preview bundle: scroll the Radix viewport, expect the top fade mask to turn on
{
  const html = readFileSync(join(web, 'public/auto-index/linasameer-scroll-area-1.html'), 'utf8')
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.screenshot({ path: join(outDir, 'scroll-area-1-preview-initial.png') })
  const viewport = page.locator('[data-slot="scroll-area-viewport"]')
  const maskSizes = () => page.locator('[style*="--top-fade-height"]').evaluate(element => ({
    top: parseFloat(getComputedStyle(element, '::before').height),
    bottom: parseFloat(getComputedStyle(element, '::after').height),
  }))
  const initialMasks = await maskSizes()
  if (initialMasks.top > 0.5 || initialMasks.bottom < 29.5) {
    throw new Error(`preview initial mask sizes are wrong: ${JSON.stringify(initialMasks)}`)
  }
  await viewport.evaluate(element => { element.scrollTop = 200 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(outDir, 'scroll-area-1-preview-scrolled.png') })
  const scrolledTop = await viewport.evaluate(element => element.scrollTop)
  const middleMasks = await maskSizes()
  if (scrolledTop < 1 || middleMasks.top < 29.5 || middleMasks.bottom < 29.5) {
    throw new Error(`preview middle mask sizes are wrong: ${JSON.stringify({ scrolledTop, ...middleMasks })}`)
  }
  await viewport.evaluate(element => { element.scrollTop = element.scrollHeight })
  await page.waitForTimeout(400)
  const endMasks = await maskSizes()
  if (endMasks.top < 29.5 || endMasks.bottom > 0.5) {
    throw new Error(`preview final mask sizes are wrong: ${JSON.stringify(endMasks)}`)
  }
  console.log('preview: viewport scrollTop after programmatic scroll ->', scrolledTop)
}

// GHL export: scroll the viewport, expect data-mask-top/data-mask-bottom to flip
{
  const ghl = readFileSync(join(root, 'ghl/scroll-area-1.html'), 'utf8')
  const html = `<!doctype html><html><body>${ghl}</body></html>`
  await page.setContent(html, { waitUntil: 'networkidle' })
  const area = page.locator('.ghl-scroll-area')
  const initialTop = await area.getAttribute('data-mask-top')
  const initialBottom = await area.getAttribute('data-mask-bottom')
  console.log('GHL: initial data-mask-top/bottom ->', initialTop, initialBottom)
  await page.screenshot({ path: join(outDir, 'scroll-area-1-ghl-initial.png') })

  const viewport = page.locator('.ghl-scroll-viewport')
  await viewport.evaluate(element => { element.scrollTop = 200 })
  await page.waitForTimeout(300)
  const midTop = await area.getAttribute('data-mask-top')
  const midBottom = await area.getAttribute('data-mask-bottom')
  console.log('GHL: after scroll 200px data-mask-top/bottom ->', midTop, midBottom)
  await page.screenshot({ path: join(outDir, 'scroll-area-1-ghl-scrolled.png') })

  await viewport.evaluate(element => { element.scrollTop = element.scrollHeight })
  await page.waitForTimeout(300)
  const endTop = await area.getAttribute('data-mask-top')
  const endBottom = await area.getAttribute('data-mask-bottom')
  console.log('GHL: after scroll to bottom data-mask-top/bottom ->', endTop, endBottom)
  await page.screenshot({ path: join(outDir, 'scroll-area-1-ghl-bottom.png') })
}

await browser.close()
console.log('Console/page errors observed:', errors.length)
for (const e of errors) console.log('  -', e)
