/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import { getLocalAutoIndexBundleUrl, isAutoIndexControlProfile, isLocalAutoIndexBundle, useAutoIndexControls } from "../use-auto-index-controls"

const globalControls = vi.hoisted(() => ({ publish: vi.fn(), value: {} as Record<string, any> }))
const preview = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock("jotai", async () => ({ ...await vi.importActual("jotai/vanilla"), useSetAtom: () => globalControls.publish }))
vi.mock("@/lib/auto-index-controls-runtime", () => ({
  AUTO_INDEX_ANIMATION_PRESETS: [],
  createAutoIndexPreviewDocument: preview.create,
}))

const origin = window.location.origin
const profile = { version: 1, targets: [{ id: "component", label: "Whole component", kind: "component", signature: "component", controls: [], recommendations: [] }] }
const frame = { current: { contentWindow: {}, srcdoc: "", style: { colorScheme: "", backgroundColor: "" } } } as any
const initial = { demoId: 1, bundleUrl: "/auto-index/example.html", rawCode: "", iframeRef: frame }
let nonce = ""
let childPort: TestMessagePort

class TestMessagePort {
  peer?: TestMessagePort
  messages: any[] = []
  onmessage: ((event: { data: any }) => void) | null = null
  closed = false
  postMessage(data: any) {
    if (this.closed || this.peer?.closed) return
    this.messages.push(data)
    this.peer?.messages.push(data)
    this.peer?.onmessage?.({ data })
  }
  close() { this.closed = true }
  start() {}
}

class TestMessageChannel {
  port1 = new TestMessagePort()
  port2 = new TestMessagePort()
  constructor() { this.port1.peer = this.port2; this.port2.peer = this.port1 }
}

function send(action: string, data: Record<string, unknown> = {}, source: unknown = frame.current.contentWindow, port?: TestMessagePort) {
  if (action === "profile" && childPort) {
    act(() => childPort.postMessage({ type: "hb-auto-index-controls", nonce, action, ...data }))
    return
  }
  const event = new Event("message")
  Object.defineProperties(event, {
    source: { value: source },
    origin: { value: "null" },
    data: { value: { type: "hb-auto-index-controls", nonce, action, ...data } },
    ports: { value: port ? [port] : [] },
  })
  act(() => window.dispatchEvent(event))
}

async function renderReady(props = initial) {
  expect(isAutoIndexControlProfile(profile)).toBe(true)
  const priorCalls = preview.create.mock.calls.length
  const view = renderHook((value) => useAutoIndexControls(value), { initialProps: props })
  await waitFor(() => expect(preview.create).toHaveBeenCalledTimes(priorCalls + 1))
  await waitFor(() => expect(view.result.current.previewDocument).toBeTruthy())
  nonce = preview.create.mock.calls.at(-1)![1]
  frame.current.srcdoc = view.result.current.previewDocument
  act(() => view.result.current.onFrameLoad())
  const channel = new TestMessageChannel()
  childPort = channel.port1
  send("ready", {}, frame.current.contentWindow, channel.port2)
  send("profile", { profile })
  await waitFor(() => expect(view.result.current.autoControls).toBeDefined())
  return view
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal("MessageChannel", TestMessageChannel)
  nonce = ""
  childPort = undefined as any
  globalControls.value = {}
  globalControls.publish.mockImplementation((value) => { globalControls.value = value })
  preview.create.mockImplementation((_html: string, currentNonce: string) => `<html><head></head><body><div id="root"></div><script>/* hb-auto-index-controls ${currentNonce} */</script></body></html>`)
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('<html><head></head><body><div id="root"></div></body></html>', {
    headers: { "content-type": "text/html", "content-length": "55" },
  })))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe("sandboxed auto-index preview lifecycle", () => {
  it("accepts the bounded font-family list and rejects oversized option lists", () => {
    const fontControl = {
      key: "fontFamily",
      label: "Font Family",
      group: "appearance",
      type: "select",
      defaultValue: "Arial",
      options: Array.from({ length: 107 }, (_, index) => ({ label: `Font ${index}`, value: `Font ${index}` })),
    }
    const fontProfile = {
      version: 1,
      targets: [
        profile.targets[0],
        {
          id: "text-heading-0",
          label: "Heading",
          kind: "text",
          signature: "heading",
          controls: [fontControl],
          recommendations: ["fontFamily"],
        },
      ],
    }
    expect(isAutoIndexControlProfile(fontProfile)).toBe(true)
    fontControl.options = Array.from({ length: 129 }, (_, index) => ({ label: `Font ${index}`, value: `Font ${index}` }))
    expect(isAutoIndexControlProfile(fontProfile)).toBe(false)
  })

  it("qualifies only safe, credential-free, same-origin local HTML without query strings", () => {
    expect(isLocalAutoIndexBundle("/auto-index/creator-demo.html", origin)).toBe(true)
    expect(isLocalAutoIndexBundle("https://higherbits.dev/auto-index/demo.html", "https://higherbits.dev")).toBe(true)
    expect(getLocalAutoIndexBundleUrl("https://higherbits.dev/auto-index/demo.html", "http://localhost:3205"))
      .toBe("http://localhost:3205/auto-index/demo.html")
    expect(getLocalAutoIndexBundleUrl("https://higherbits.dev/auto-index/demo.html", "https://preview.example"))
      .toBeNull()
    for (const url of ["/auto-index/creator-demo.html?v=2", "https://evil.example/auto-index/demo.html", "https://higherbits.dev.evil.example/auto-index/demo.html", `${origin.replace("://", "://user:secret@")} /auto-index/demo.html`.replace(" ", ""), "/auto-index/nested/demo.html", "/auto-index/demo%2fescape.html", "/auto-index/../demo.html", "/other/demo.html", "javascript:alert(1)"]) {
      expect(isLocalAutoIndexBundle(url, origin), url).toBe(false)
    }
  })

  it("fetches stored production URLs from the local auto-index bundle for local previews", async () => {
    const localUrl = new URL("/auto-index/example.html", origin).href
    const view = await renderReady({ ...initial, bundleUrl: "https://higherbits.dev/auto-index/example.html" })
    expect(fetch).toHaveBeenCalledWith(localUrl, expect.objectContaining({ credentials: "same-origin" }))
    expect(view.result.current.previewDocument).toContain("hb-auto-index-controls")
  })

  it("loads an isolated preview document and sends edits through the nonce-bound bridge", async () => {
    const view = await renderReady()
    expect(view.result.current.previewDocument).toContain("hb-auto-index-controls")
    expect(view.result.current.activeControls.__hbControls).toEqual(undefined)
    expect(childPort.messages).toContainEqual(expect.objectContaining({
      type: "hb-auto-index-controls-command", nonce, action: "update",
    }))

    send("ready", {}, window)
    const before = childPort.messages.length
    act(() => view.result.current.onTargetChange("component", "padding", "12px"))
    await waitFor(() => expect(childPort.messages.length).toBeGreaterThan(before))
    expect(childPort.messages.at(-1)).toEqual(expect.objectContaining({
      type: "hb-auto-index-controls-command", nonce, action: "update",
      state: { version: 1, targets: { component: { padding: "12px" } } },
    }))
    view.unmount()
    expect(childPort.messages.at(-1)).toEqual(expect.objectContaining({ action: "dispose", nonce }))
  })

  it("ignores malformed sandbox profiles and closes the command port after iframe navigation", async () => {
    const view = renderHook((value) => useAutoIndexControls(value), { initialProps: initial })
    await waitFor(() => expect(preview.create).toHaveBeenCalledTimes(1))
    nonce = preview.create.mock.calls.at(-1)![1]
    await waitFor(() => expect(view.result.current.previewDocument).toBeTruthy())
    frame.current.srcdoc = view.result.current.previewDocument
    act(() => view.result.current.onFrameLoad())
    const channel = new TestMessageChannel()
    childPort = channel.port1
    send("ready", {}, frame.current.contentWindow, channel.port2)
    send("profile", { profile: { version: 1, targets: [null] } })
    expect(view.result.current.autoControls).toBeUndefined()
    send("profile", { profile })
    await waitFor(() => expect(view.result.current.autoControls).toBeDefined())
    const before = childPort.messages.length
    act(() => view.result.current.onFrameLoad())
    send("ready", { nonce: "" })
    act(() => view.result.current.onTargetChange("component", "padding", "12px"))
    expect(childPort.messages).toHaveLength(before)
    expect(childPort.peer?.closed).toBe(true)
    expect(view.result.current.autoControls).toBeUndefined()
    view.unmount()
  })

  it("ignores a queued ready message if navigation happened before the first handshake", async () => {
    const view = renderHook((value) => useAutoIndexControls(value), { initialProps: initial })
    await waitFor(() => expect(preview.create).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(view.result.current.previewDocument).toBeTruthy())
    nonce = preview.create.mock.calls.at(-1)![1]
    frame.current.srcdoc = view.result.current.previewDocument
    act(() => view.result.current.onFrameLoad())
    const channel = new TestMessageChannel()
    childPort = channel.port1
    childPort.close()
    act(() => view.result.current.onFrameLoad())
    send("ready", {}, frame.current.contentWindow, channel.port2)
    act(() => view.result.current.onTargetChange("component", "padding", "12px"))
    expect(channel.port2.messages).toHaveLength(0)
    expect(view.result.current.autoControls).toBeUndefined()
    view.unmount()
  })

  it("preserves authored edits as code resolves and clears them on component changes", async () => {
    const view = await renderReady()
    act(() => view.result.current.onChange("speed", 7))
    view.rerender({ ...initial, rawCode: "const settings = { speed: 2, color: '#ffffff' }" })
    expect(view.result.current.activeControls.speed).toBe(7)
    act(() => view.result.current.onTargetChange("component", "padding", "12px"))
    view.rerender({ ...initial, demoId: 2 })
    expect(view.result.current.activeControls).toEqual({})
  })

  it("resets one property without erasing another and excludes viewport changes from export state", async () => {
    const view = await renderReady()
    act(() => {
      view.result.current.onTargetChange("component", "padding", "12px")
      view.result.current.onTargetChange("component", "width", "100%")
      view.result.current.onTargetChange("component", "theme", "dark")
      view.result.current.onTargetChange("component", "removeBackground", true)
    })
    expect(frame.current.style).toEqual({ colorScheme: "dark", backgroundColor: "transparent" })
    act(() => view.result.current.autoControls?.onResetControl("component", "width"))
    expect(view.result.current.activeControls.__hbControls.targets.component).toEqual({ padding: "12px", theme: "dark", removeBackground: true })
    const before = view.result.current.activeControls
    act(() => view.result.current.autoControls?.onPreviewSizeChange("mobile"))
    expect(view.result.current.activeControls).toBe(before)
    expect(view.result.current.previewStyle.width).toBe("375px")
    act(() => view.result.current.onReset())
    expect(view.result.current.activeControls).toEqual({})
    expect(frame.current.style).toEqual({ colorScheme: "", backgroundColor: "" })
  })

  it("keeps only the foreground preview in shared copy controls", async () => {
    const behind = renderHook((value) => useAutoIndexControls(value), { initialProps: initial })
    act(() => behind.result.current.onChange("speed", 5))
    const foreground = renderHook((value) => useAutoIndexControls(value), { initialProps: { ...initial, demoId: 2 } })
    act(() => foreground.result.current.onChange("speed", 9))
    act(() => behind.result.current.onChange("speed", 6))
    expect(globalControls.value.speed).toBe(9)
    foreground.unmount()
    expect(globalControls.value.speed).toBe(6)
    behind.unmount()
    expect(globalControls.value).toEqual({})
  })

  it("leaves authored controls visible when fetching the local bundle fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
    const view = renderHook((props) => useAutoIndexControls(props), { initialProps: { ...initial, rawCode: "const settings = { speed: 2 }" } })
    await waitFor(() => expect(view.result.current.unavailableReason).toContain("unavailable"))
    expect(view.result.current.activeControls.speed).toBe(2)
    expect(view.result.current.hasControls).toBe(true)
  })
})
