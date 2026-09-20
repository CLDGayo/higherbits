import { describe, it, expect } from "vitest"
import { applyControlsToCode, applyControlsToGhlHtml } from "../controls-transform"

describe("controls-transform", () => {
  describe("applyControlsToGhlHtml", () => {
    it("preserves complex FBO initializers while updating config keys", () => {
      const ghlSnippet = `
<script>
let velocity = createDoubleFBO(simRes.width, simRes.height, fmtRG.internalFormat, fmtRG.format, halfFloatType, linearFilter);
let dye = createDoubleFBO(dyeRes.width, dyeRes.height, fmtRGBA.internalFormat, fmtRGBA.format, halfFloatType, linearFilter);
let pressure = createDoubleFBO(simRes.width, simRes.height, fmtR.internalFormat, fmtR.format, halfFloatType, gl.NEAREST);
const config = {
  PRESSURE: 0.8,
  CURL: 30,
  SPLAT_RADIUS: 0.25,
  SHADING: true,
};
</script>
`
      const controls = {
        pressure: 0.25,
        curl: 45,
        splatRadius: 0.4,
        shading: false,
      }

      const result = applyControlsToGhlHtml(ghlSnippet, controls)

      // Ensure createDoubleFBO is completely intact
      expect(result).toContain(
        "let pressure = createDoubleFBO(simRes.width, simRes.height, fmtR.internalFormat, fmtR.format, halfFloatType, gl.NEAREST);",
      )
      expect(result).not.toContain("0.25, simRes.height")

      // Ensure config keys are updated
      expect(result).toContain("PRESSURE: 0.25")
      expect(result).toContain("CURL: 45")
      expect(result).toContain("SPLAT_RADIUS: 0.4")
    })

    it("updates primitive variable declarations safely", () => {
      const code = `
let curl = 30;
const SPLAT_RADIUS = 0.25;
let isDark = true;
`
      const result = applyControlsToGhlHtml(code, {
        curl: 50,
        splatRadius: 0.6,
        isDark: false,
      })

      expect(result).toContain("let curl = 50;")
      expect(result).toContain("const SPLAT_RADIUS = 0.6;")
      expect(result).toContain("let isDark = false;")
    })
  })

  describe("applyControlsToCode", () => {
    it("updates settings object and JSX props without altering complex assignments", () => {
      const componentCode = `
const settings = {
  curl: 30,
  pressure: 0.8,
  color: "#ffffff",
}
export function Fluid({ curl = 30, pressure = 0.8 }) {
  let pressureFbo = createDoubleFBO(w, h);
  return <div curl={30} pressure={0.8} />
}
`
      const result = applyControlsToCode(componentCode, {
        curl: 40,
        pressure: 0.25,
        color: "#00ff00",
      })

      expect(result).toContain("curl: 40")
      expect(result).toContain("pressure: 0.25")
      expect(result).toContain('color: "#00ff00"')
      expect(result).toContain("curl = 40")
      expect(result).toContain("pressure = 0.25")
      expect(result).toContain("createDoubleFBO(w, h)")
    })
  })

  describe("security guards (STRIDE & OWASP)", () => {
    it("neutralizes script tag breakout / XSS attempts in HTML scripts", () => {
      const ghlSnippet = `
<script>
const config = {
  COLOR: "#ffffff",
};
</script>
`
      const xssPayload = '</script><script>alert("XSS")</script>'
      const result = applyControlsToGhlHtml(ghlSnippet, {
        color: xssPayload,
      })

      // Must NOT contain literal unescaped closing script tag
      expect(result).not.toContain("</script><script>")
      expect(result).toContain("\\u003c/script\\u003e\\u003cscript\\u003e")
    })

    it("safely ignores invalid regex keys and dangerous prototype keys without crashing", () => {
      const code = `const settings = { curl: 30 };`
      const dangerousControls = {
        "[a-z": 10,
        "((((a+)+)+)+)": 20,
        "__proto__": { polluted: true },
        "constructor": "malicious",
        "prototype": "malicious",
      }

      // Should execute without throwing SyntaxError or polluting prototype
      expect(() => applyControlsToCode(code, dangerousControls)).not.toThrow()
      expect(() => applyControlsToGhlHtml(code, dangerousControls)).not.toThrow()
      expect(({} as any).polluted).toBeUndefined()
    })

    it("prevents attribute breakout in JSX string props", () => {
      const jsxCode = `<Component color="#ffffff" />`
      const breakoutPayload = 'red" onClick={malicious} dummy="'
      const result = applyControlsToCode(jsxCode, {
        color: breakoutPayload,
      })

      // Quotes should be stripped so attribute cannot break out
      expect(result).not.toContain('" onClick={malicious}')
      expect(result).toContain('color="red onClick={malicious} dummy="')
    })
  })
})
