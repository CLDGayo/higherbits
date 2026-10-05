/** @vitest-environment jsdom */
import { expect, it } from "vitest"
import { parse } from "@babel/parser"
import postcss from "postcss"
import { isReviewOnlyCopy, withCopyNotice, withPromptNotice } from "../copy-notice"

const notice = { displayText: "Recorded license: MIT License (unverified). Component profile: @creator. Copyright holder and upstream license text have not been verified by HigherBits.", provenanceClass: "recorded-unverified" as const }

it("G12-CLIPBOARD: keeps captured code as an exact prefix and appends a safe comment", () => {
  const code = "export const Button = () => <button>OK</button>"
  const result = withCopyNotice(code, notice, "button.tsx")
  expect(result.startsWith(code)).toBe(true)
  expect(result).toContain(notice.displayText)
  expect(result.endsWith("*/")).toBe(true)
  expect(() => parse(result, { sourceType: "module", plugins: ["typescript", "jsx"] })).not.toThrow()
  expect(() => postcss.parse(withCopyNotice(".x { color: red }", notice, "x.css"))).not.toThrow()
  expect(withCopyNotice("x", { ...notice, displayText: "a */ b" }, "x.css")).toContain("a * /  b")
})

it("G12-CLIPBOARD: labels JSON and unknown syntax as review text before copy", () => {
  for (const path of ["package.json", "config", "LICENSE.txt"]) {
    expect(isReviewOnlyCopy(path)).toBe(true)
    const copied = withCopyNotice('{"ok":true}', notice, path)
    expect(copied.startsWith('{"ok":true}')).toBe(true)
    expect(() => JSON.parse(copied)).toThrow()
    expect(copied).toContain("review text; not valid source")
  }
})
it("G11-PROMPT: GHL notice is inert HTML after the output and malformed closers fail", () => {
  const copied = withPromptNotice("<div>usable GHL</div>", notice, true)
  expect(copied.startsWith("<div>usable GHL</div>")).toBe(true)
  const page = new DOMParser().parseFromString(copied, "text/html")
  expect(page.body.textContent?.trim()).toBe("usable GHL")
  expect(page.body.lastChild?.nodeType).toBe(Node.COMMENT_NODE)
  expect(page.body.lastChild?.textContent).toContain(notice.displayText)
  expect(() => withPromptNotice("<div></div>", { ...notice, displayText: "bad --> leak" }, true)).toThrow("invalid_notice")
})
