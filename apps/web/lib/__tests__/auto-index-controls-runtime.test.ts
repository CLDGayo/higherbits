// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { AUTO_INDEX_ANIMATION_PRESETS, createAutoIndexPreviewDocument, getAutoIndexPreviewLayout, installAutoIndexControls, normalizeAutoIndexControlState, type AutoIndexControlProfile } from "../auto-index-controls-runtime"
import { loadGoogleFont, POPULAR_GOOGLE_FONT_FAMILIES, preloadGoogleFontCatalog } from "../google-fonts"

const active: ReturnType<typeof installAutoIndexControls>[] = []
class TestMessagePort {
  peer?: TestMessagePort
  onmessage: ((event: { data: unknown }) => void) | null = null
  closed = false
  postMessage(data: unknown) {
    if (this.closed || this.peer?.closed) return
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
function mount(markup: string) {
  document.body.innerHTML = `<div id="root">${markup}</div>`
  let profile: AutoIndexControlProfile = { version: 1, targets: [] }
  const runtime = installAutoIndexControls(window, undefined, (value) => { profile = value }, undefined, [], AUTO_INDEX_ANIMATION_PRESETS)
  active.push(runtime)
  return { runtime, profile: () => profile, root: document.getElementById("root")! }
}
afterEach(() => {
  active.splice(0).forEach((runtime) => runtime.dispose())
  document.documentElement.removeAttribute("class")
  document.documentElement.removeAttribute("style")
  document.documentElement.removeAttribute("data-theme")
  document.body.removeAttribute("style")
  document.body.innerHTML = ""
  document.head.querySelectorAll("link[data-hb-google-font]").forEach((link) => link.remove())
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("auto-index controls runtime", () => {
  it("serializes a runnable isolated iframe bridge that announces its profile", async () => {
    const nonce = "0123456789abcdef0123456789abcdef"
    const preview = createAutoIndexPreviewDocument(
      '<html><head></head><body><div id="root"><h1>Preview</h1></div></body></html>',
      nonce,
      "https://higherbits.dev/auto-index/",
      POPULAR_GOOGLE_FONT_FAMILIES,
      AUTO_INDEX_ANIMATION_PRESETS,
    )
    const messages: MessageEvent[] = []
    const listener = (event: MessageEvent) => messages.push(event)
    window.addEventListener("message", listener)
    vi.stubGlobal("MessageChannel", TestMessageChannel)
    vi.spyOn(window, "postMessage").mockImplementation(((data: unknown, _target: string, ports?: Transferable[]) => {
      const event = new Event("message")
      Object.defineProperties(event, {
        source: { value: window },
        data: { value: data },
        ports: { value: ports ?? [] },
      })
      window.dispatchEvent(event)
    }) as typeof window.postMessage)
    const parsed = new DOMParser().parseFromString(preview, "text/html")
    document.head.innerHTML = parsed.head.innerHTML
    document.body.innerHTML = parsed.body.innerHTML
    const script = document.querySelector("body script")!.textContent!
    document.querySelector("body script")!.remove()
    window.eval(script)
    window.dispatchEvent(new Event("load"))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(messages.map((message) => message.data.action)).toEqual(["ready"])
    expect(messages[0]?.data.nonce).toBe(nonce)
    expect(messages[0]?.ports).toHaveLength(1)
    const parentPort = messages[0]!.ports[0]!
    const profileMessage = new Promise<MessageEvent>((resolve) => { parentPort.onmessage = resolve })
    parentPort.postMessage({ type: "hb-auto-index-controls-command", nonce, action: "connect" })
    const profile = (await profileMessage).data
    expect(profile).toMatchObject({ type: "hb-auto-index-controls", nonce, action: "profile" })
    expect(profile.profile.targets[0].id).toBe("component")
    parentPort.postMessage({ type: "hb-auto-index-controls-command", nonce, action: "dispose" })
    parentPort.close()
    window.removeEventListener("message", listener)
  })

  it("centers ordinary previews and makes background and shader previews full-bleed", () => {
    const html = '<html><head></head><body><div id="root"><main>Preview</main></div></body></html>'
    const centered = createAutoIndexPreviewDocument(html, "0123456789abcdef0123456789abcdef", "https://higherbits.dev/auto-index/")
    const background = createAutoIndexPreviewDocument(html, "0123456789abcdef0123456789abcdef", "https://higherbits.dev/auto-index/", [], [], getAutoIndexPreviewLayout([{ slug: "backgrounds", name: "Backgrounds" }]))
    const shader = createAutoIndexPreviewDocument(html, "0123456789abcdef0123456789abcdef", "https://higherbits.dev/auto-index/", [], [], getAutoIndexPreviewLayout([{ tag_name: "Shader" }]))
    const centeredLayout = centered.match(/<style id="higherbits-preview-layout">([\s\S]*?)<\/style>/)?.[1] ?? ""

    expect(centered).toContain("place-items:center!important")
    expect(centeredLayout).not.toMatch(/(?:^|[;{])height:100vh!important/)
    expect(background).toContain("higherbits-preview-layout")
    expect(background).toContain("height:100vh!important")
    expect(background).toContain(".ghl-component-wrapper>*{width:100%!important;height:100%!important;min-height:100vh!important}")
    expect(centered).toContain(".ghl-component-wrapper{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-height:100vh!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;display:grid!important;place-items:center!important}")
    expect(shader).toContain("height:100vh!important")
    expect(getAutoIndexPreviewLayout([{ slug: "buttons", name: "Buttons" }])).toBe("centered")
  })

  it("animation-presets-runtime-and-reset keeps the original option and exactly 20 allowlisted presets on static components", () => {
    const view = mount("<section>Static</section>")
    const animation = view.profile().targets[0]!.controls.find((control) => control.key === "animationPreset")!
    expect(animation.defaultValue).toBe("original")
    expect(animation.options?.map((option) => option.label)).toEqual(["Original", ...AUTO_INDEX_ANIMATION_PRESETS.map((preset) => preset.label)])
    expect(AUTO_INDEX_ANIMATION_PRESETS).toHaveLength(20)
    expect(normalizeAutoIndexControlState({ version: 1, targets: { component: { animationPreset: "fade-up" } } })).not.toBeNull()
    expect(normalizeAutoIndexControlState({ version: 1, targets: { component: { animationPreset: "custom-css" } } })).toBeNull()
  })

  it("animation-duration-seconds-conversion normalizes first computed durations and preserves legacy state", () => {
    for (const [input, expected] of [[250, "250s"], ["250ms", "0.25s"], ["3s", "3s"], ["250ms, 4s", "0.25s"], ["0.0000001", "0.0000001s"], ["0.0000001s", "0.0000001s"], [".5", "0.5s"], [".5ms", "0.0005s"], [0.0000001, "0.0000001s"]] as const) {
      expect(normalizeAutoIndexControlState({ version: 1, targets: { component: { animationDuration: input } } })?.targets.component?.animationDuration).toBe(expected)
    }
    for (const invalid of ["-1s", "bad", Infinity, NaN]) {
      expect(normalizeAutoIndexControlState({ version: 1, targets: { component: { animationDuration: invalid } } })).toBeNull()
    }
    const markup = '<div style="animation-name: pulse; animation-duration: 250ms, 2s">Moving</div>'
    const view = mount(markup)
    const moving = view.root.firstElementChild as HTMLElement
    const duration = view.profile().targets[0]!.controls.find((control) => control.key === "animationDuration")!
    expect(duration.defaultValue).toBe("0.25s")
    view.runtime.update({ version: 1, targets: { component: { animationDuration: 3 } } })
    expect(moving.style.animationDuration).toBe("3s")
    view.runtime.update({ version: 1, targets: { component: { animationDuration: "0.0000001s" } } })
    expect(Number.parseFloat(moving.style.animationDuration)).toBe(0.0000001)
    view.runtime.reset()
    expect(moving.getAttribute("style")).toBe("animation-name: pulse; animation-duration: 250ms, 2s;")
  })

  it("offers 100 curated Google Fonts and loads only the selected font once", () => {
    expect(POPULAR_GOOGLE_FONT_FAMILIES).toHaveLength(100)
    document.body.innerHTML = '<div id="root"><h1>Hello</h1></div>'
    const runtime = installAutoIndexControls(window, { version: 1, targets: { component: { fontFamily: "Poppins" } } }, undefined,
      (family) => loadGoogleFont(document, family), POPULAR_GOOGLE_FONT_FAMILIES, AUTO_INDEX_ANIMATION_PRESETS)
    expect(document.querySelector("h1")!.style.fontFamily).toBe('"Poppins", sans-serif')
    expect(document.head.querySelectorAll('link[data-hb-google-font="Poppins"]')).toHaveLength(1)
    runtime.update({ version: 1, targets: { component: { fontFamily: "Poppins" } } })
    expect(document.head.querySelectorAll('link[data-hb-google-font="Poppins"]')).toHaveLength(1)
    loadGoogleFont(document, "https://fonts.example.invalid/family")
    expect(document.head.querySelectorAll("link[data-hb-google-font]")).toHaveLength(1)
    runtime.dispose()
  })

  it("loads every font specimen before resolving the shared catalog preload", async () => {
    const doc = document.implementation.createHTMLDocument()
    const fontLoad = vi.fn(async () => [{} as FontFace])
    Object.defineProperty(doc, "fonts", { configurable: true, value: { load: fontLoad } })
    const loading = preloadGoogleFontCatalog(doc)
    expect(preloadGoogleFontCatalog(doc)).toBe(loading)
    const link = doc.head.querySelector<HTMLLinkElement>("link[data-hb-google-font-catalog]")!
    expect(link.href).toContain("family=Anton")
    expect(link.href).toContain("family=Source+Sans+3")
    link.dispatchEvent(new Event("load"))
    await expect(loading).resolves.toEqual([])
    expect(fontLoad).toHaveBeenCalledTimes(POPULAR_GOOGLE_FONT_FAMILIES.length)
    expect(link.dataset.hbGoogleFontCatalogReady).toBe("true")
    loadGoogleFont(doc, "Anton")
    expect(doc.head.querySelectorAll('link[data-hb-google-font="Anton"]')).toHaveLength(0)
  })

  it("keeps system and loaded font choices available when one specimen fails", async () => {
    const doc = document.implementation.createHTMLDocument()
    const fontLoad = vi.fn(async (_descriptor: string, text: string) => text === "Anton" ? [] : [{} as FontFace])
    Object.defineProperty(doc, "fonts", { configurable: true, value: { load: fontLoad } })
    const loading = preloadGoogleFontCatalog(doc)
    doc.head.querySelector("link[data-hb-google-font-catalog]")!.dispatchEvent(new Event("load"))
    await expect(loading).resolves.toEqual(["Anton"])
    loadGoogleFont(doc, "Roboto")
    loadGoogleFont(doc, "Anton")
    expect(doc.head.querySelectorAll('link[data-hb-google-font="Roboto"]')).toHaveLength(0)
    expect(doc.head.querySelectorAll('link[data-hb-google-font="Anton"]')).toHaveLength(1)
  })

  it("quotes curated Google font names with trailing numbers so CSS accepts them", () => {
    document.body.innerHTML = '<div id="root"><h1>Hello</h1></div>'
    const runtime = installAutoIndexControls(window, undefined, undefined, undefined, POPULAR_GOOGLE_FONT_FAMILIES, AUTO_INDEX_ANIMATION_PRESETS)
    runtime.update({ version: 1, targets: { component: { fontFamily: "Source Sans 3" } } })
    expect(document.querySelector("h1")!.style.fontFamily).toBe('"Source Sans 3", sans-serif')
    runtime.update({ version: 1, targets: { component: { fontFamily: "Exo 2" } } })
    expect(document.querySelector("h1")!.style.fontFamily).toBe('"Exo 2", sans-serif')
    runtime.dispose()
  })

  it("accepts unitless and CSS length line heights with negative letter spacing", () => {
    expect(normalizeAutoIndexControlState({ version: 1, targets: { component: { lineHeight: "1.5", letterSpacing: "-0.05em" } } })).not.toBeNull()
    expect(normalizeAutoIndexControlState({ version: 1, targets: { component: { lineHeight: "2vw", letterSpacing: "-1px" } } })).not.toBeNull()
  })

  it("preserves original defaults and discovers conditional text and supported recommendations", () => {
    const view = mount('<h1 style="color: red; font-size: 31px !important">Hello</h1><canvas></canvas>')
    const heading = document.querySelector("h1")!
    expect(heading.getAttribute("style")).toBe("color: red; font-size: 31px !important")
    expect(view.root.getAttribute("style")).toBeNull()
    const root = view.profile().targets.find((target) => target.id === "component")!
    expect(root.controls.map((control) => control.key)).toEqual(expect.arrayContaining(["margin", "padding", "width", "height", "align", "theme", "removeBackground", "customClass", "fontFamily", "bold", "italic"]))
    expect(root.controls.some((control) => control.key === "motionPaused")).toBe(false)
    expect(view.profile().targets.find((target) => target.kind === "text")?.controls.find((control) => control.key === "fontSize")?.defaultValue).toBe("31px")
  })

  it("preserves nested markup and independent labels while editing text literally", () => {
    const view = mount('<h1>Hello <em>world</em></h1><button>Keep me</button>')
    const button = document.querySelector("button")!
    const click = vi.fn()
    button.addEventListener("click", click)
    const target = view.profile().targets.find((entry) => entry.controls.some((control) => control.key === "text" && control.defaultValue === "Hello "))!
    view.runtime.update({ version: 1, targets: { [target.id]: { text: '<script>alert(1)</script> ', color: "blue" } } })
    expect(document.querySelector("h1")?.firstChild?.textContent).toBe('<script>alert(1)</script> ')
    expect(document.querySelector("em")?.textContent).toBe("world")
    expect(document.querySelector("script")).toBeNull()
    button.click()
    expect(click).toHaveBeenCalledTimes(1)
    expect(button.textContent).toBe("Keep me")
    view.runtime.reset()
    expect(document.querySelector("h1")?.innerHTML).toBe("Hello <em>world</em>")
  })

  it("restores individual CSS values and priority without losing other edits", () => {
    const view = mount('<p style="font-size: 23px !important; color: red">Text</p>')
    const target = view.profile().targets.find((entry) => entry.kind === "text")!
    const p = document.querySelector("p")!
    view.runtime.update({ version: 1, targets: { [target.id]: { fontSize: "40px", color: "blue" }, component: { width: "80%", customClass: "demo padded" } } })
    expect(p.style.fontSize).toBe("40px")
    view.runtime.update({ version: 1, targets: { [target.id]: { color: "blue" }, component: { width: "80%" } } })
    expect(p.style.fontSize).toBe("23px")
    expect(p.style.getPropertyPriority("font-size")).toBe("important")
    expect(p.style.color).toBe("blue")
    expect(view.root.style.width).toBe("80%")
    expect(view.root.className).toBe("")
    view.runtime.reset()
    expect(p.style.color).toBe("red")
    expect(view.root.getAttribute("style")).toBeNull()
  })

  it("keeps direct text before and after nested markup independently editable", () => {
    const view = mount('<p>Before <strong>important</strong> after</p>')
    const target = view.profile().targets.find((entry) => entry.controls.some((control) => control.key === "text" && control.defaultValue === " after"))!
    view.runtime.update({ version: 1, targets: { [target.id]: { text: " changed" } } })
    expect(document.querySelector("p")?.innerHTML).toBe("Before <strong>important</strong> changed")
    view.runtime.reset()
    expect(document.querySelector("p")?.innerHTML).toBe("Before <strong>important</strong> after")
  })

  it("never rewinds authored interactive text during rediscovery, selection or reset", async () => {
    const view = mount('<button>Count 0</button>')
    const button = document.querySelector("button")!
    button.addEventListener("click", () => { button.firstChild!.textContent = "Count 1" })
    button.click()
    await new Promise((resolve) => setTimeout(resolve, 140))
    view.runtime.select("component")
    view.runtime.reset()
    expect(button.textContent).toBe("Count 1")
    expect(view.profile().targets.some((entry) => entry.label.includes("Count 1"))).toBe(true)
  })

  it("discovers and removes text controls as authored panels become visible or hidden", async () => {
    const view = mount('<style>.collapsed { visibility: hidden }</style><button>Open</button><section hidden><h2>Details title</h2></section>')
    const section = document.querySelector("section")!
    expect(view.profile().targets.some((entry) => entry.label.includes("Details title"))).toBe(false)
    section.hidden = false
    await vi.waitFor(() => expect(view.profile().targets.some((entry) => entry.label.includes("Details title"))).toBe(true))
    section.style.display = "none"
    await vi.waitFor(() => expect(view.profile().targets.some((entry) => entry.label.includes("Details title"))).toBe(false))
    section.style.display = "block"
    await vi.waitFor(() => expect(view.profile().targets.some((entry) => entry.label.includes("Details title"))).toBe(true))
    section.setAttribute("aria-hidden", "true")
    await vi.waitFor(() => expect(view.profile().targets.some((entry) => entry.label.includes("Details title"))).toBe(false))
    section.removeAttribute("aria-hidden")
    await vi.waitFor(() => expect(view.profile().targets.some((entry) => entry.label.includes("Details title"))).toBe(true))
    section.classList.add("collapsed")
    await vi.waitFor(() => expect(view.profile().targets.some((entry) => entry.label.includes("Details title"))).toBe(false))
    section.classList.remove("collapsed")
    await vi.waitFor(() => expect(view.profile().targets.some((entry) => entry.label.includes("Details title"))).toBe(true))
  })

  it("ignores style mutations that only update animation properties", async () => {
    const view = mount('<section><h2>Animated title</h2></section>')
    const getStyle = vi.spyOn(window, "getComputedStyle")
    const section = document.querySelector("section")!
    section.style.transform = "translateX(10px)"
    section.style.opacity = "0.5"
    await new Promise((resolve) => setTimeout(resolve, 140))
    expect(getStyle).not.toHaveBeenCalled()
    section.style.visibility = "hidden"
    await vi.waitFor(() => expect(view.profile().targets.some((entry) => entry.label.includes("Animated title"))).toBe(false))
  })

  it("supports whole-component typography without changing distinct text content", () => {
    const view = mount('<h1 style="color:red">Heading</h1><p style="color:green">Description</p>')
    view.runtime.update({ version: 1, targets: { component: { color: "blue", bold: true } } })
    expect(document.querySelector("h1")?.style.color).toBe("blue")
    expect(document.querySelector("p")?.style.color).toBe("blue")
    expect(document.querySelector("p")?.textContent).toBe("Description")
    view.runtime.reset()
    expect(document.querySelector("h1")?.style.color).toBe("red")
    expect(document.querySelector("p")?.style.color).toBe("green")
  })

  it("rejects unsafe and invalid state without applying arbitrary CSS or classes", () => {
    const view = mount("<p>Safe</p>")
    view.runtime.update({ version: 1, targets: { component: { width: "-10px", padding: "-2px", color: "url(javascript:alert(1))", customClass: 'bad\" onclick=\"evil', position: "fixed", opacity: Infinity }, __proto__: { color: "red" } } })
    expect(view.root.getAttribute("style")).toBeNull()
    expect(view.root.className).toBe("")
    view.runtime.update({ version: 1, targets: { component: { margin: "-2px 4rem", padding: "2px 3%", width: "100%", height: "auto" } } })
    expect(view.root.style.margin).toBe("-2px 4rem")
    expect(view.root.style.padding).toBe("2px 3%")
    expect(view.root.style.width).toBe("100%")
  })

  it("restores theme and outer background while preserving nested artwork", () => {
    document.documentElement.className = "dark authored"
    document.body.style.backgroundColor = "black"
    const view = mount('<article style="background: red">Card</article>')
    view.runtime.update({ version: 1, targets: { component: { theme: "light", removeBackground: true } } })
    expect(document.documentElement.classList.contains("light")).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(document.body.style.backgroundColor).toBe("transparent")
    expect(document.querySelector("article")?.style.background).toBe("red")
    view.runtime.reset()
    expect(document.documentElement.className).toBe("dark authored")
    expect(document.body.style.backgroundColor).toBe("black")
  })

  it("themes exposed text without losing contrast inside unchanged painted cards or authored variants", () => {
    document.body.style.color = "rgb(36, 36, 44)"
    const view = mount('<style>.themed { background: white }.dark .themed { background: black; color: white }</style><main style="min-height:100vh"><p id="exposed">Outer text</p><article style="background:white"><p id="card-text">Description</p><b style="color:blue">Brand</b></article><section class="themed"><p id="authored">Themed text</p></section></main>')
    const cardText = document.getElementById("card-text")!
    const original = window.getComputedStyle(cardText).color
    view.runtime.update({ version: 1, targets: { component: { theme: "dark" } } })
    expect(window.getComputedStyle(document.getElementById("exposed")!).color).toBe("rgb(244, 244, 245)")
    expect(window.getComputedStyle(cardText).color).toBe(original)
    expect(window.getComputedStyle(document.querySelector("article")!).backgroundColor).toBe("rgb(255, 255, 255)")
    expect(window.getComputedStyle(document.querySelector("b")!).color).toBe("rgb(0, 0, 255)")
    expect(window.getComputedStyle(document.getElementById("authored")!).color).toBe("rgb(255, 255, 255)")
    const target = view.profile().targets.find((entry) => entry.controls.some((control) => control.key === "text" && control.defaultValue === "Description"))!
    view.runtime.update({ version: 1, targets: { component: { theme: "dark" }, [target.id]: { color: "red" } } })
    expect(window.getComputedStyle(cardText).color).toBe("rgb(255, 0, 0)")
    view.runtime.reset()
    expect(window.getComputedStyle(cardText).color).toBe(original)
  })

  it("matches the embedding iframe scheme for transparent canvas and restores it exactly", () => {
    const frame = document.createElement("iframe")
    frame.style.setProperty("color-scheme", "light", "important")
    document.body.append(frame)
    frame.contentDocument!.body.innerHTML = '<div id="root"><p>Preview</p></div>'
    const runtime = installAutoIndexControls(frame.contentWindow!, undefined, undefined, undefined, [], AUTO_INDEX_ANIMATION_PRESETS)
    active.push(runtime)
    runtime.update({ version: 1, targets: { component: { theme: "dark", removeBackground: true } } })
    expect(frame.contentDocument!.documentElement.style.colorScheme).toBe("dark")
    expect(frame.style.colorScheme).toBe("dark")
    runtime.update({ version: 1, targets: { component: { theme: "dark" } } })
    expect(frame.style.colorScheme).toBe("light")
    expect(frame.style.getPropertyPriority("color-scheme")).toBe("important")
    runtime.update({ version: 1, targets: { component: { theme: "dark", removeBackground: true } } })
    runtime.dispose()
    expect(frame.style.colorScheme).toBe("light")
    expect(frame.style.getPropertyPriority("color-scheme")).toBe("important")
  })

  it("adjusts the viewport demo shell without clearing the nested component background", () => {
    const view = mount('<main style="min-height:100vh;display:grid;place-items:center;background:black"><article style="background:red;width:200px">Card</article></main>')
    view.runtime.update({ version: 1, targets: { component: { removeBackground: true, align: "end" } } })
    expect(document.querySelector("main")?.style.backgroundColor).toBe("transparent")
    expect(document.querySelector("main")?.style.justifyItems).toBe("end")
    expect(document.querySelector("article")?.style.backgroundColor).toBe("red")
    view.runtime.reset()
    expect(document.querySelector("main")?.style.backgroundColor).toBe("black")
  })

  it("fits viewport-sized shells within explicit component dimensions and restores their sizing", () => {
    const view = mount('<main style="min-height:100vh;width:100vw"><article>Card</article></main>')
    const shell = document.querySelector("main")!
    view.runtime.update({ version: 1, targets: { component: { width: "320px", height: "360px" } } })
    expect(view.root.style.height).toBe("360px")
    expect(shell.style.height).toBe("100%")
    expect(shell.style.minHeight).toBe("0px")
    expect(shell.style.width).toBe("100%")
    view.runtime.reset()
    expect(shell.style.minHeight).toBe("100vh")
    expect(shell.style.width).toBe("100vw")
    expect(shell.style.height).toBe("")
  })

  it("validates server envelopes without a DOM dependency or accepting unknown fields", () => {
    expect(normalizeAutoIndexControlState({ version: 1, targets: { component: { padding: "10px", customClass: "a b" } } })).toEqual({ version: 1, targets: { component: { padding: "10px", customClass: "a b" } } })
    expect(normalizeAutoIndexControlState({ version: 2, targets: {} })).toBeNull()
    expect(normalizeAutoIndexControlState({ version: 1, targets: { component: { position: "fixed" } } })).toBeNull()
    expect(normalizeAutoIndexControlState({ version: 1, targets: { component: { padding: "-2px" } } })).toBeNull()
    expect(normalizeAutoIndexControlState({ version: 1, targets: { component: { color: "url(evil)" } } })).toBeNull()
  })

  it("rebinds replaced semantic targets and discovers delayed content without loops", async () => {
    const view = mount("<h1>Original</h1>")
    const target = view.profile().targets.find((entry) => entry.kind === "text")!
    view.runtime.update({ version: 1, targets: { [target.id]: { text: "Edited" } } })
    view.root.innerHTML = "<h1>Original</h1><button>Late</button>"
    await vi.waitFor(() => expect(document.querySelector("h1")?.textContent).toBe("Edited"))
    expect(view.profile().targets.some((entry) => entry.label.includes("Late"))).toBe(true)
    const count = view.profile().targets.length
    await new Promise((resolve) => setTimeout(resolve, 140))
    expect(view.profile().targets.length).toBe(count)
    view.runtime.dispose()
    expect(document.querySelector("h1")?.textContent).toBe("Original")
  })

  it("preserves surviving repeated target identity and never transfers a removed part's edit", async () => {
    const view = mount("<button>Same</button><button>Same</button>")
    const targets = view.profile().targets.filter((entry) => entry.kind === "text")
    view.runtime.update({ version: 1, targets: { [targets[0]!.id]: { text: "First edited" } } })
    view.root.firstElementChild!.remove()
    await vi.waitFor(() => expect(view.profile().targets.filter((entry) => entry.kind === "text")).toHaveLength(1))
    expect(view.root.textContent).toBe("Same")
    expect(view.profile().targets.find((entry) => entry.kind === "text")!.id).toBe(targets[1]!.id)
    view.root.insertAdjacentHTML("afterbegin", "<button>Same</button>")
    await vi.waitFor(() => expect(view.profile().targets.filter((entry) => entry.kind === "text")).toHaveLength(2))
    expect(view.root.textContent).toBe("SameSame")
    expect(view.profile().targets.filter((entry) => entry.kind === "text").map((entry) => entry.id)).not.toContain(targets[0]!.id)
  })

  it("does not replay ambiguous edits after repeated targets are replaced", async () => {
    const view = mount("<button>Same</button><button>Same</button>")
    const id = view.profile().targets.find((entry) => entry.kind === "text")!.id
    view.runtime.update({ version: 1, targets: { [id]: { text: "Edited" } } })
    view.root.innerHTML = "<button>Same</button><button>Same</button>"
    await new Promise((resolve) => setTimeout(resolve, 140))
    expect(view.root.textContent).toBe("SameSame")
    expect(view.profile().targets.map((entry) => entry.id)).not.toContain(id)
  })

  it("preserves authored class additions and removals when resetting runtime class and theme changes", () => {
    document.documentElement.className = "dark authored"
    const view = mount("<button>Toggle</button>")
    view.root.className = "initial"
    view.runtime.update({ version: 1, targets: { component: { customClass: "custom", theme: "light" } } })
    view.root.classList.add("expanded")
    view.root.classList.remove("initial")
    document.documentElement.classList.add("expanded")
    document.documentElement.classList.remove("authored")
    view.runtime.update({ version: 1, targets: { component: { customClass: "custom", theme: "light", width: "80%" } } })
    view.runtime.reset()
    expect(view.root.className).toBe("expanded")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.classList.contains("expanded")).toBe(true)
    expect(document.documentElement.classList.contains("authored")).toBe(false)
    expect(document.documentElement.classList.contains("light")).toBe(false)
  })

  it("preserves external property and attribute changes made after an override", () => {
    const view = mount("<button>Toggle</button>")
    view.runtime.update({ version: 1, targets: { component: { width: "80%", theme: "light" } } })
    view.root.style.setProperty("width", "320px", "important")
    document.documentElement.setAttribute("data-theme", "custom")
    view.runtime.reset()
    expect(view.root.style.width).toBe("320px")
    expect(view.root.style.getPropertyPriority("width")).toBe("important")
    expect(document.documentElement.getAttribute("data-theme")).toBe("custom")
    view.runtime.update({ version: 1, targets: { component: { width: "80%" } } })
    view.runtime.reset()
    expect(view.root.style.width).toBe("320px")
  })

  it("keeps semantic ids stable in a scoped independently rendered output", () => {
    const view = mount("<h1>Title</h1><p>Description</p>")
    const id = view.profile().targets.find((entry) => entry.kind === "text")!.id
    const exported = document.createElement("section")
    exported.innerHTML = '<div id="different-wrapper"><h1>Title</h1><p>Description</p></div>'
    document.body.append(exported)
    const standalone = new Function(`return (${installAutoIndexControls.toString()})`)() as typeof installAutoIndexControls
    const runtime = standalone(exported, { version: 1, targets: { [id]: { text: "Exported" } } })
    active.push(runtime)
    expect(exported.querySelector("h1")?.textContent).toBe("Exported")
    expect(view.root.querySelector("h1")?.textContent).toBe("Title")
  })

  it("exposes supported motion only and respects reduced motion", () => {
    const listeners = new Set<() => void>()
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: (_: string, fn: () => void) => listeners.add(fn), removeEventListener: (_: string, fn: () => void) => listeners.delete(fn) })))
    const view = mount('<div style="animation-name: pulse; animation-duration: 2s">Moving</div>')
    const moving = view.root.firstElementChild as HTMLElement
    expect(view.profile().targets[0]?.controls.some((control) => control.key === "motionPaused")).toBe(true)
    expect(moving.style.animationPlayState).toBe("paused")
    view.runtime.replay()
    expect(moving.style.animationPlayState).toBe("paused")
    view.runtime.dispose()
    expect(moving.style.animationPlayState).toBe("")
    expect(listeners.size).toBe(0)
    vi.unstubAllGlobals()
  })
})
