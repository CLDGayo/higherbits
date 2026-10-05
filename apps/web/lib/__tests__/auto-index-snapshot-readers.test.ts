import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { expect, it } from "vitest"

const readers = [
  "app/[username]/[component_slug]/page.tsx",
  "app/@modal/(...)[username]/[component_slug]/page.tsx",
  "app/@modal/(...)[username]/[component_slug]/[demo_slug]/page.tsx",
]

it.each(readers)("E21: %s reads approved component and demo bytes from their own snapshot fields", async path => {
  const source = await readFile(join(process.cwd(), path), "utf8")
  expect(source).toContain("component.code = snapshot.code")
  expect(source).toContain("demo.demo_code = snapshot.demoCode")
  expect(source).not.toContain("demo.demo_code = snapshot.code")
})
