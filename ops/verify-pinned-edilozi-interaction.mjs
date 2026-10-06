#!/usr/bin/env node
// Scratch verification: click-test each preview bundle and each GHL export to prove interactivity.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const web = join(repo, 'apps/web')
const root = join(repo, 'ops/phase-e-pinned/edilozi')
const outDir = join(root, 'interaction-check')
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 900, height: 500 } })
const errors = []
page.on('pageerror', error => errors.push(String(error)))
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

async function snap(name, html) {
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.screenshot({ path: join(outDir, `${name}.png`) })
}

// accordion: preview bundle, click first summary, expect expanded
{
  const html = readFileSync(join(web, 'public/auto-index/edilozi-accordion.html'), 'utf8')
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.getByText('What is HigherBits.dev?').click()
  await page.waitForTimeout(300)
  const text = await page.locator('text=A curated marketplace').isVisible()
  console.log('accordion preview: expanded after click ->', text)
  await page.screenshot({ path: join(outDir, 'accordion-preview-expanded.png') })
}

// accordion GHL
{
  const ghl = readFileSync(join(root, 'ghl/accordion.html'), 'utf8')
  const html = `<!doctype html><html><body>${ghl}</body></html>`
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.getByText('What is HigherBits.dev?').click()
  await page.waitForTimeout(300)
  const expanded = await page.locator('.ghl-accordion-item').first().getAttribute('data-expanded')
  console.log('accordion GHL: data-expanded after click ->', expanded)
  await page.screenshot({ path: join(outDir, 'accordion-ghl-expanded.png') })
}

// drawer: preview bundle, click open, expect panel visible with text
{
  const html = readFileSync(join(web, 'public/auto-index/edilozi-drawer.html'), 'utf8')
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.getByText('Open drawer').click()
  await page.waitForTimeout(300)
  const visible = await page.locator('text=Press Escape or click outside to close.').isVisible()
  console.log('drawer preview: panel visible after click ->', visible)
  await page.screenshot({ path: join(outDir, 'drawer-preview-open.png') })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await page.screenshot({ path: join(outDir, 'drawer-preview-closed-after-escape.png') })
}

// drawer GHL
{
  const ghl = readFileSync(join(root, 'ghl/drawer.html'), 'utf8')
  const html = `<!doctype html><html><body>${ghl}</body></html>`
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.getByText('Open drawer').click()
  await page.waitForTimeout(400)
  const visible = await page.locator('.ghl-drawer-panel').getAttribute('data-visible')
  console.log('drawer GHL: panel data-visible after click ->', visible)
  await page.screenshot({ path: join(outDir, 'drawer-ghl-open.png') })
}

// pricing-card GHL: click button, expect text change
{
  const ghl = readFileSync(join(root, 'ghl/pricing-card.html'), 'utf8')
  const html = `<!doctype html><html><body>${ghl}</body></html>`
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.getByText('Get started').click()
  await page.waitForTimeout(100)
  const text = await page.locator('.ghl-pricing-btn').textContent()
  console.log('pricing-card GHL: button text after click ->', text)
  await page.screenshot({ path: join(outDir, 'pricing-card-ghl-clicked.png') })
}

await browser.close()
console.log('Console/page errors observed:', errors.length)
for (const e of errors) console.log('  -', e)
