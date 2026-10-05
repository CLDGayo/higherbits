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
