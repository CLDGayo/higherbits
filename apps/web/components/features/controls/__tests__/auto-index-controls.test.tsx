/** @vitest-environment jsdom */
import React, { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { AutoIndexControls } from "../auto-index-controls"
import { ControlsPanel } from "../controls-panel"
import type { AutoIndexPanelControls } from "@/hooks/use-auto-index-controls"

const component = {
  id: "component", label: "Whole component", kind: "component", signature: "component",
  recommendations: [], controls: [
    { key: "removeBackground", label: "Remove background", group: "appearance", type: "boolean", defaultValue: false, recommended: true },
    { key: "backgroundColor", label: "Background color", group: "appearance", type: "color", defaultValue: "#ffffff" },
    { key: "width", label: "Width", group: "layout", type: "text", defaultValue: "auto" },
    { key: "padding", label: "Padding", group: "layout", type: "text", defaultValue: "4px" },
    { key: "motionPaused", label: "Pause animation", group: "motion", type: "boolean", defaultValue: false },
    { key: "animationPreset", label: "Animation", group: "motion", type: "select", defaultValue: "original", options: [{ label: "Original", value: "original" }] },
    { key: "animationDuration", label: "Animation duration", group: "motion", type: "text", defaultValue: "1s" },
  ],
}
const staticComponent = { ...component, controls: component.controls.filter((control) => control.key !== "motionPaused") }
const heading = { id: "heading", label: "Heading: Hello", kind: "text", signature: "h1:Hello", recommendations: [], controls: [
  { key: "text", label: "Text", group: "content", type: "text", defaultValue: "Hello", recommended: true },
  { key: "bold", label: "Bold", group: "appearance", type: "boolean", defaultValue: true },
] }
const typography = { id: "typography", label: "Heading: Hello", kind: "text", signature: "h1:Hello", recommendations: [], controls: [
  { key: "text", label: "Text", group: "content", type: "text", defaultValue: "Hello", recommended: true },
  { key: "lineHeight", label: "Line height", group: "appearance", type: "text", defaultValue: "normal" },
  { key: "letterSpacing", label: "Letter spacing", group: "appearance", type: "text", defaultValue: "normal" },
] }

function Harness({ onChange = vi.fn(), onReplay = vi.fn(), targets = [component, heading], initialTarget = "component" }: { onChange?: any; onReplay?: any; targets?: any[]; initialTarget?: string }) {
  const [selectedTarget, onSelect] = useState(initialTarget)
  const [state, setState] = useState<AutoIndexPanelControls["state"]>({ version: 1, targets: {} })
  const [previewSize, onPreviewSizeChange] = useState<AutoIndexPanelControls["previewSize"]>("desktop")
  const controls: AutoIndexPanelControls = {
    profile: { version: 1, targets } as any,
    state, selectedTarget, onSelect, previewSize, onPreviewSizeChange, onReplay,
    onChange: (target, key, value) => {
      onChange(target, key, value)
      setState((prior) => ({ version: 1, targets: { ...prior.targets, [target]: { ...prior.targets[target], [key]: value } } }))
    },
    onResetControl: (target, key) => setState((prior) => {
      const overrides = { ...prior.targets[target] }; delete overrides[key]
      return { version: 1, targets: { ...prior.targets, [target]: overrides } }
    }),
  }
  return <AutoIndexControls controls={controls} />
}

afterEach(cleanup)

describe("component-aware controls", () => {
  it("shows animation settings together in the open Motion section for a static component", () => {
    const view = render(<Harness targets={[staticComponent]} />)
    const motion = view.getByTestId("auto-index-controls").querySelector("details")!
    const controls = Array.from(motion.querySelectorAll("[aria-label]")).map((field) => field.getAttribute("aria-label"))
    const animationIndex = controls.indexOf("Animation")

    expect(motion.querySelector("summary")?.textContent).toBe("Motion")
    expect(motion.open).toBe(true)
    expect(controls.slice(animationIndex, animationIndex + 2)).toEqual(["Animation", "Animation duration"])
  })

  it("selects independent text parts, shows changes and resets the edited field", () => {
    const view = render(<Harness />)
    const select = view.getByLabelText("Edit part")
    select.focus()
    expect(document.activeElement).toBe(select)
    fireEvent.change(select, { target: { value: "heading" } })
    const text = view.getByLabelText("Text") as HTMLTextAreaElement
    expect(text.value).toBe("Hello")
    fireEvent.change(text, { target: { value: "Xin chào" } })
    expect(text.value).toBe("Xin chào")
    expect(view.getByLabelText("Changed")).toBeDefined()
    fireEvent.click(view.getByRole("button", { name: "Reset Text" }))
    expect(text.value).toBe("Hello")
    expect(view.queryByLabelText("Changed")).toBeNull()
  })

  it("supports width modes, units and independent padding sides", () => {
    const onChange = vi.fn()
    const view = render(<Harness onChange={onChange} />)
    fireEvent.change(view.getByLabelText("Width mode"), { target: { value: "fill" } })
    expect(onChange).toHaveBeenLastCalledWith("component", "width", "100%")
    fireEvent.change(view.getByLabelText("Width mode"), { target: { value: "custom" } })
    fireEvent.change(view.getByLabelText("Width unit"), { target: { value: "rem" } })
    fireEvent.change(view.getByLabelText("Width"), { target: { value: "24" } })
    expect(onChange).toHaveBeenLastCalledWith("component", "width", "24rem")
    fireEvent.click(view.getByRole("button", { name: "Link padding sides" }))
    fireEvent.change(view.getByLabelText("Padding left"), { target: { value: "12" } })
    expect(onChange).toHaveBeenLastCalledWith("component", "padding", "4px 4px 4px 12px")
    fireEvent.click(view.getByRole("button", { name: "Link padding sides" }))
    expect(onChange).toHaveBeenLastCalledWith("component", "padding", "4px")
  })

  it("hides dependent background controls and keeps viewport selection out of edits", () => {
    const onChange = vi.fn()
    const onReplay = vi.fn()
    const view = render(<Harness onChange={onChange} onReplay={onReplay} />)
    expect(view.getByLabelText("Background color")).toBeDefined()
    fireEvent.click(view.getByRole("switch", { name: "Remove background" }))
    expect(view.queryByLabelText("Background color")).toBeNull()
    onChange.mockClear()
    fireEvent.change(view.getByLabelText("Preview width"), { target: { value: "mobile" } })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(view.getByText("Replay animation"))
    expect(onReplay).toHaveBeenCalledOnce()
  })

  it("keeps authored controls first-class, keyboard editable, labeled and resettable", () => {
    const onChange = vi.fn()
    const onResetControl = vi.fn()
    const view = render(<ControlsPanel controls={[
      { key: "speed", label: "Speed", type: "number", defaultValue: 1, min: 0, max: 10, step: 1 },
      { key: "title", label: "Title", type: "string", defaultValue: "Hello" },
    ]} values={{ speed: 2 }} onChange={onChange} onReset={vi.fn()} onResetControl={onResetControl} />)
    fireEvent.keyDown(view.getByRole("slider", { name: "Speed" }), { key: "ArrowRight" })
    expect(onChange).toHaveBeenLastCalledWith("speed", 3)
    fireEvent.click(view.getByRole("button", { name: "Reset Speed" }))
    expect(onResetControl).toHaveBeenCalledWith("speed")
    expect(view.getByLabelText("Title")).toBeDefined()
  })

  it("offers line height and letter spacing presets, hiding the custom fields while a preset is active", () => {
    const onChange = vi.fn()
    const view = render(<Harness onChange={onChange} targets={[typography]} initialTarget="typography" />)
    fireEvent.click(view.getByText("Appearance"))
    fireEvent.change(view.getByLabelText("Line height preset"), { target: { value: "1.5" } })
    expect(onChange).toHaveBeenLastCalledWith("typography", "lineHeight", "1.5")
    expect(view.queryByLabelText("Line height")).toBeNull()
    fireEvent.change(view.getByLabelText("Letter spacing preset"), { target: { value: "-0.05em" } })
    expect(onChange).toHaveBeenLastCalledWith("typography", "letterSpacing", "-0.05em")
    expect(view.queryByLabelText("Letter spacing")).toBeNull()
  })

  it("supports a custom line height/letter spacing value and unit, set in either order, preserving negative tracking", () => {
    const onChange = vi.fn()
    const view = render(<Harness onChange={onChange} targets={[typography]} initialTarget="typography" />)
    fireEvent.click(view.getByText("Appearance"))

    fireEvent.change(view.getByLabelText("Line height preset"), { target: { value: "custom" } })
    expect(view.getByLabelText("Line height unit")).toBeDefined()
    fireEvent.change(view.getByLabelText("Line height unit"), { target: { value: "px" } })
    fireEvent.change(view.getByLabelText("Line height"), { target: { value: "28" } })
    expect(onChange).toHaveBeenLastCalledWith("typography", "lineHeight", "28px")

    fireEvent.change(view.getByLabelText("Letter spacing preset"), { target: { value: "custom" } })
    fireEvent.change(view.getByLabelText("Letter spacing"), { target: { value: "-2" } })
    fireEvent.change(view.getByLabelText("Letter spacing unit"), { target: { value: "em" } })
    expect(onChange).toHaveBeenLastCalledWith("typography", "letterSpacing", "-2em")
  })

  it("favors an authored duplicate over inferred whole-component controls", () => {
    const controls = { profile: { version: 1, targets: [component] }, state: { version: 1, targets: {} }, selectedTarget: "component", previewSize: "desktop", onSelect: vi.fn(), onChange: vi.fn(), onResetControl: vi.fn(), onReplay: vi.fn(), onPreviewSizeChange: vi.fn() } as AutoIndexPanelControls
    const view = render(<AutoIndexControls controls={controls} authoredControls={[{ key: "padding", label: "Padding", type: "number", defaultValue: 4 }]} />)
    expect(view.queryByLabelText("Padding")).toBeNull()
    expect(view.container.querySelector("summary")?.textContent).toBe("Motion")
  })
})
