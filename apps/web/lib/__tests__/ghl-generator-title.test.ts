import { readFileSync } from "node:fs"
import { expect, it } from "vitest"
import { cleanGhlHtml, sanitizeGhlHtml } from "@/lib/ghl-generator"

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

it("preserves executable components without rewriting valid JavaScript or license comments", () => {
  const code = 'const name="launch"; const updateKeywordsRef={}; updateKeywordsRef.current = name; new CustomEvent(name); const template="<body>literal</body>";'
  const output = cleanGhlHtml(`<!-- MIT License -->\n<style>.component{color:red}</style><div id="root"><form><label>Color<input value="red"></label><select><option>Red</option></select><textarea>Notes</textarea></form></div><script>/* MIT */${code}</script>`)
  expect(output).toContain(`/* MIT */${code}`)
  expect(output).toContain("<!-- MIT License -->")
  expect(output).toContain('<input value="red">')
  expect(output).toContain("<select><option>Red</option></select>")
  expect(output).toContain("<textarea>Notes</textarea>")
  expect(cleanGhlHtml(output)).toBe(output)
  expect(cleanGhlHtml('<div id="root"></div><script>document.getElementById("root").textContent="Ready";</script>'))
    .toContain("<script>")
})

it.each([
  '<iframe src="https://higherbits.dev/auto-index/vgpu-earth.html"></iframe>',
  '<iframe src="https://higherbits.dev/api/ghl-embed/140"></iframe>',
  '<object data="preview.html"></object>',
  '<embed src="preview.html">',
  '<img src="data:image/png;base64,aGVsbG8=" alt="Static preview">',
])("rejects hosted or screenshot substitutes: %s", substitute => {
  expect(() => cleanGhlHtml(`<div>${substitute}</div>`)).toThrow()
})

it.each([
  '<script src="https://cdn.example/app.js"></script>',
  '<link rel="stylesheet" href="https://cdn.example/app.css">',
  '<style>@import "https://cdn.example/app.css";</style>',
  '<style>.component{background:url(https://cdn.example/bg.png)}</style>',
  '<script>fetch("/api/data")</script>',
  '<script>import("https://cdn.example/app.js")</script>',
  '<script>const s=document.createElement("script");s.src="https://cdn.example/app.js";</script>',
  '<img src="https://cdn.example/image.png">',
])("rejects external dependencies instead of silently removing them: %s", dependency => {
  expect(() => cleanGhlHtml(`<div>Component${dependency}</div>`)).toThrow(/self-contained|resource|external/i)
})

it.each([
  '<script>const value = ;</script>',
  '<script>function render() {</script>',
  '<script>const value = 1;',
  '<button onclick="const value =">Click</button>',
])("rejects malformed or truncated JavaScript: %s", code => {
  expect(() => cleanGhlHtml(`<div>Component</div>${code}`)).toThrow(/JavaScript|unclosed/i)
})

it("retains the restrictive display sanitizer separately", () => {
  const sanitized = sanitizeGhlHtml('<div onclick="alert(1)"><form><input></form><script>alert(1)</script><p>Display</p></div>')
  expect(sanitized).not.toMatch(/script|input|form|onclick/)
  expect(sanitized).toContain("Display")
})

it("enforces the output limit and unwraps fenced documents without changing script literals", () => {
  expect(() => cleanGhlHtml(`<div>${"x".repeat(1_048_576)}</div>`)).toThrow(/byte limit/)
  expect(cleanGhlHtml('```html\n<html><head><title>Document</title></head><body><div>Content</div><script>const fence="```";</script></body></html>\n```'))
    .toBe('<div>Content</div><script>(() => {\nconst fence="```";\n})();</script>')
})
