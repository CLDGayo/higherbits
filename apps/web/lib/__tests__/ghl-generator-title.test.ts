import { readFileSync } from "node:fs"
import { expect, it } from "vitest"
import { cleanGhlHtml } from "@/lib/ghl-generator"

for (const fixture of [
  { file: "partition-bar.html", title: "Fruit harvest — HigherBits local adaptation", content: "Fruit harvest" },
  { file: "timeline.html", title: "Project timeline — HigherBits local adaptation", content: "Project milestones" },
]) {
  it(`removes the document title from copied ${fixture.file} while preserving the component`, () => {
    const raw = readFileSync(new URL(`../../public/auto-index/${fixture.file}`, import.meta.url), "utf8")
    const copied = cleanGhlHtml(raw)

    expect(copied).not.toContain(fixture.title)
    expect(copied).not.toMatch(/<title\b/i)
    expect(copied).toContain(fixture.content)
    expect(copied).toContain("<style>")
    expect(cleanGhlHtml(copied)).toBe(copied)
  })
}

it("rejects a JavaScript-only preview after scripts are removed", () => {
  expect(cleanGhlHtml('<style>#root{height:100%}</style><div id="root"></div><script>render()</script>')).toBe("")
  expect(cleanGhlHtml('<div class="ghl-component-wrapper"><img src="data:image/png;base64,aGVsbG8=" alt="Static preview"></div>'))
    .toContain('alt="Static preview"')
})
