import { describe, it, expect } from "vitest"
import { extractControlsSettings, formatControlLabel, getDefaultControlValues } from "../controls-parser"

describe("controls-parser", () => {
  it("formats camelCase and snake_case labels correctly", () => {
    expect(formatControlLabel("ringWidth")).toBe("Ring Width")
    expect(formatControlLabel("pingEvery")).toBe("Ping Every")
    expect(formatControlLabel("useThemeColor")).toBe("Use Theme Color")
    expect(formatControlLabel("base_opacity")).toBe("Base Opacity")
    expect(formatControlLabel("color")).toBe("Color")
  })

  it("extracts all settings from the 21st.dev SonarGrid demo", () => {
    const sampleDemo = `
const settings = {
  ringWidth: 90,
  speed: 500,
  amplitude: 2.2,
  pingEvery: 2.4,
  interactive: true,
  spacing: 26,
  baseOpacity: 0.28,
  useThemeColor: true,
  color: "#6366f1",
  eyebrow: "Now in public beta",
  headline: "Signals, not noise.",
  subline: "Every ping is a real event from your infrastructure. Tap anywhere to send one.",
}

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props }
  return <div>Demo</div>
}
`
    const controls = extractControlsSettings(sampleDemo)
    expect(controls).toHaveLength(12)

    const keyMap = Object.fromEntries(controls.map((c) => [c.key, c]))

    expect(keyMap.ringWidth).toMatchObject({
      key: "ringWidth",
      label: "Ring Width",
      type: "number",
      defaultValue: 90,
      step: 1,
    })

    expect(keyMap.amplitude).toMatchObject({
      key: "amplitude",
      label: "Amplitude",
      type: "number",
      defaultValue: 2.2,
      step: 0.1,
    })

    expect(keyMap.baseOpacity).toMatchObject({
      key: "baseOpacity",
      label: "Base Opacity",
      type: "number",
      defaultValue: 0.28,
      step: 0.01,
    })

    expect(keyMap.interactive).toMatchObject({
      key: "interactive",
      label: "Interactive",
      type: "boolean",
      defaultValue: true,
    })

    expect(keyMap.color).toMatchObject({
      key: "color",
      label: "Color",
      type: "color",
      defaultValue: "#6366f1",
    })

    expect(keyMap.headline).toMatchObject({
      key: "headline",
      label: "Headline",
      type: "string",
      defaultValue: "Signals, not noise.",
    })

    const defaultValues = getDefaultControlValues(controls)
    expect(defaultValues.ringWidth).toBe(90)
    expect(defaultValues.interactive).toBe(true)
    expect(defaultValues.color).toBe("#6366f1")
  })

  it("returns empty array if code has no settings", () => {
    const code = `export default function Demo() { return <div>Demo</div> }`
    expect(extractControlsSettings(code)).toEqual([])
  })

  it("handles negative numbers in settings", () => {
    const code = `const settings = { offset: -15, scale: 1 }`
    const controls = extractControlsSettings(code)
    expect(controls).toHaveLength(2)
    expect(controls[0]).toMatchObject({
      key: "offset",
      defaultValue: -15,
      type: "number",
    })
  })
})
