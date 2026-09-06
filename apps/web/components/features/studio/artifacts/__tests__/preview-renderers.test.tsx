import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

// Side-effect imports: each of these registers its kind's renderer at module
// load, the same way the corresponding *-client route does.
import "../gradient-preview"
import "../theme-preview"
import {
  GRADIENT_DEFAULT_PAYLOAD,
  getPreviewRenderer,
  type GradientPayload,
} from "../registry"

/**
 * P11-D8 regression guards.
 *
 * Two separate defects lived here. The renderer map had **zero readers**, so
 * every artifact row rendered an empty frame; and the gradient and ascii
 * renderers named their single props parameter `payload` and spread the whole
 * props object over the defaults, so they would have rendered defaults for
 * every row once the map was finally read. An `as Partial<…>` cast kept the
 * compiler quiet about the second one.
 *
 * These assert the renderer **contract** - shape in, payload honoured - rather
 * than any particular markup, so they survive a redesign of the thumbnail.
 */
const render = (kind: "gradient" | "theme", payload: unknown) => {
  const renderer = getPreviewRenderer(kind)
  expect(renderer, `no renderer registered for ${kind}`).toBeDefined()
  return renderToStaticMarkup(
    <>{renderer!({ payload, className: "test-class" })}</>,
  )
}

describe("registered preview renderers", () => {
  it("registers a renderer for every kind whose module is loaded", () => {
    expect(getPreviewRenderer("gradient")).toBeDefined()
    expect(getPreviewRenderer("theme")).toBeDefined()
  })

  it("renders the payload it is given, not the defaults", () => {
    const payload: GradientPayload = {
      ...GRADIENT_DEFAULT_PAYLOAD,
      stops: [
        { name: "a", hex: "#ff0000" },
        { name: "b", hex: "#0000ff" },
      ],
    }

    const html = render("gradient", payload)

    // The colours from THIS payload must appear. Under the props-spread bug the
    // markup carried GRADIENT_DEFAULT_PAYLOAD's palette instead.
    expect(html).toContain("#ff0000")
    expect(html).toContain("#0000ff")
    for (const stop of GRADIENT_DEFAULT_PAYLOAD.stops) {
      expect(html).not.toContain(stop.hex)
    }
  })

  it("passes className through to the rendered element", () => {
    // The bug swallowed className into the payload, so it never reached the DOM
    // and the thumbnail could not be sized by its container.
    expect(render("gradient", GRADIENT_DEFAULT_PAYLOAD)).toContain("test-class")
  })

  it("renders two different payloads differently", () => {
    // The sharpest form of the props-spread check: under the bug, every row
    // produced identical markup regardless of its payload.
    const a = render("gradient", {
      ...GRADIENT_DEFAULT_PAYLOAD,
      stops: [{ name: "a", hex: "#111111" }, { name: "b", hex: "#222222" }],
    })
    const b = render("gradient", {
      ...GRADIENT_DEFAULT_PAYLOAD,
      stops: [{ name: "a", hex: "#333333" }, { name: "b", hex: "#444444" }],
    })

    expect(a).not.toEqual(b)
  })

  it("creates no canvas element for a list thumbnail", () => {
    // A list can hold dozens of rows; browsers cap live WebGL contexts at 16
    // and evict the oldest, so a shader per card would blank earlier cards and
    // the editor's own preview. The thumbnail must stay CSS-only.
    const html = render("gradient", GRADIENT_DEFAULT_PAYLOAD)
    expect(html).not.toContain("<canvas")
  })
})
