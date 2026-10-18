export type AutoIndexControlKey =
  | "text" | "color" | "fontSize" | "lineHeight" | "letterSpacing" | "fontFamily" | "italic" | "bold"
  | "removeBackground" | "theme" | "margin" | "padding" | "align" | "width" | "height" | "customClass"
  | "backgroundColor" | "borderColor" | "borderWidth" | "borderRadius" | "boxShadow" | "opacity"
  | "aspectRatio" | "perspective" | "motionPaused" | "animationDuration" | "animationPreset"

export type AutoIndexControlValue = string | number | boolean
export interface AutoIndexControlState {
  version: 1
  targets: Record<string, Partial<Record<AutoIndexControlKey, AutoIndexControlValue>>>
}
export interface AutoIndexControlDefinition {
  key: AutoIndexControlKey
  label: string
  group: "content" | "appearance" | "layout" | "motion" | "advanced"
  type: "text" | "color" | "number" | "select" | "boolean"
  defaultValue: AutoIndexControlValue
  description?: string
  options?: { label: string; value: string }[]
  min?: number
  max?: number
  step?: number
  unit?: string
  recommended?: boolean
}
export interface AutoIndexControlTarget {
  id: string
  label: string
  signature: string
  kind: "component" | "text" | "element"
  controls: AutoIndexControlDefinition[]
  recommendations: string[]
}
export interface AutoIndexControlProfile {
  version: 1
  targets: AutoIndexControlTarget[]
}

export interface AutoIndexAnimationPreset {
  label: string
  value: string
  keyframes: Keyframe[]
}

export const AUTO_INDEX_ANIMATION_PRESETS: AutoIndexAnimationPreset[] = [
  { label: "Fade", value: "fade", keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  { label: "Fade Up", value: "fade-up", keyframes: [{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "translateY(0)" }] },
  { label: "Fade Down", value: "fade-down", keyframes: [{ opacity: 0, transform: "translateY(-24px)" }, { opacity: 1, transform: "translateY(0)" }] },
  { label: "Fade Left", value: "fade-left", keyframes: [{ opacity: 0, transform: "translateX(24px)" }, { opacity: 1, transform: "translateX(0)" }] },
  { label: "Fade Right", value: "fade-right", keyframes: [{ opacity: 0, transform: "translateX(-24px)" }, { opacity: 1, transform: "translateX(0)" }] },
  { label: "Slide Up", value: "slide-up", keyframes: [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }] },
  { label: "Slide Down", value: "slide-down", keyframes: [{ transform: "translateY(-100%)" }, { transform: "translateY(0)" }] },
  { label: "Slide Left", value: "slide-left", keyframes: [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }] },
  { label: "Slide Right", value: "slide-right", keyframes: [{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }] },
  { label: "Zoom In", value: "zoom-in", keyframes: [{ opacity: 0, transform: "scale(.8)" }, { opacity: 1, transform: "scale(1)" }] },
  { label: "Zoom Out", value: "zoom-out", keyframes: [{ opacity: 0, transform: "scale(1.2)" }, { opacity: 1, transform: "scale(1)" }] },
  { label: "Bounce", value: "bounce", keyframes: [{ transform: "translateY(-24px)" }, { transform: "translateY(0)" }, { transform: "translateY(-12px)" }, { transform: "translateY(0)" }] },
  { label: "Pulse", value: "pulse", keyframes: [{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }] },
  { label: "Shake", value: "shake", keyframes: [{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(-6px)" }, { transform: "translateX(0)" }] },
  { label: "Swing", value: "swing", keyframes: [{ transform: "rotate(0deg)" }, { transform: "rotate(12deg)" }, { transform: "rotate(-8deg)" }, { transform: "rotate(4deg)" }, { transform: "rotate(0deg)" }] },
  { label: "Rotate In", value: "rotate-in", keyframes: [{ opacity: 0, transform: "rotate(-45deg) scale(.8)" }, { opacity: 1, transform: "rotate(0) scale(1)" }] },
  { label: "Flip X", value: "flip-x", keyframes: [{ transform: "perspective(400px) rotateX(90deg)", opacity: 0 }, { transform: "perspective(400px) rotateX(0)", opacity: 1 }] },
  { label: "Flip Y", value: "flip-y", keyframes: [{ transform: "perspective(400px) rotateY(90deg)", opacity: 0 }, { transform: "perspective(400px) rotateY(0)", opacity: 1 }] },
  { label: "Rubber Band", value: "rubber-band", keyframes: [{ transform: "scale3d(1,1,1)" }, { transform: "scale3d(1.25,.75,1)" }, { transform: "scale3d(.75,1.25,1)" }, { transform: "scale3d(1.05,.95,1)" }, { transform: "scale3d(1,1,1)" }] },
  { label: "Tada", value: "tada", keyframes: [{ transform: "scale3d(1,1,1)" }, { transform: "scale3d(.9,.9,.9) rotate(-3deg)" }, { transform: "scale3d(1.1,1.1,1.1) rotate(3deg)" }, { transform: "scale3d(1.1,1.1,1.1) rotate(-3deg)" }, { transform: "scale3d(1,1,1)" }] },
]

/** Normalize supported decimal seconds without converting small decimals to exponent notation. */
export function normalizeAnimationDurationSeconds(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined
  if (typeof value === "number" && (!Number.isFinite(value) || value < 0)) return undefined
  const raw = (typeof value === "number" ? String(value).replace(/^((?:\d+)(?:\.\d+)?)[eE]([+-]?\d+)$/, (_match, significand: string, exponent: string) => {
    const [whole = "0", fraction = ""] = significand.split(".")
    const digits = whole + fraction
    const point = whole.length + Number(exponent)
    return point <= 0 ? `0.${"0".repeat(-point)}${digits}` : point >= digits.length ? `${digits}${"0".repeat(point - digits.length)}` : `${digits.slice(0, point)}.${digits.slice(point)}`
  }) : value).trim().split(",", 1)[0]?.trim()
  const match = raw?.match(/^(\d+(?:\.\d+)?|\.\d+)(ms|s)?$/)
  if (!match || !Number.isFinite(Number(match[1])) || Number(match[1]) < 0) return undefined
  let [whole = "0", fraction = ""] = match[1]!.split(".")
  whole = whole.replace(/^0+(?=\d)/, "") || "0"
  if (match[2] === "ms") {
    const digits = whole + fraction
    const point = whole.length - 3
    if (point <= 0) { whole = "0"; fraction = `${"0".repeat(-point)}${digits}` }
    else if (point >= digits.length) { whole = `${digits}${"0".repeat(point - digits.length)}`; fraction = "" }
    else { whole = digits.slice(0, point); fraction = digits.slice(point) }
    whole = whole.replace(/^0+(?=\d)/, "") || "0"
  }
  fraction = fraction.replace(/0+$/, "")
  return `${whole}${fraction ? `.${fraction}` : ""}s`
}

/** Server boundary validation; the runtime additionally checks values with the browser CSS parser. */
export function normalizeAutoIndexControlState(input: unknown): AutoIndexControlState | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null
  const envelope = input as Record<string, unknown>
  if (Object.keys(envelope).some((key) => key !== "version" && key !== "targets") || envelope.version !== 1 || !envelope.targets || typeof envelope.targets !== "object" || Array.isArray(envelope.targets)) return null
  const entries = Object.entries(envelope.targets)
  if (entries.length > 64) return null
  const allowed = new Set(["text", "color", "fontSize", "lineHeight", "letterSpacing", "fontFamily", "italic", "bold", "removeBackground", "theme", "margin", "padding", "align", "width", "height", "customClass", "backgroundColor", "borderColor", "borderWidth", "borderRadius", "boxShadow", "opacity", "aspectRatio", "perspective", "motionPaused", "animationDuration", "animationPreset"])
  const result: AutoIndexControlState = { version: 1, targets: {} }
  for (const [id, raw] of entries) {
    if (!/^(?:component|text-[a-z0-9]+-\d+|element-[a-z0-9]+-\d+)$/.test(id) || !raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).length > 32) return null
    const fields: Partial<Record<AutoIndexControlKey, AutoIndexControlValue>> = {}
    for (const [key, value] of Object.entries(raw)) {
      if (!allowed.has(key) || !["string", "number", "boolean"].includes(typeof value) || (typeof value === "number" && !Number.isFinite(value))) return null
      const text = String(value).trim()
      if (key === "text") {
        if (typeof value !== "string" || value.length > 10000) return null
      } else if (["italic", "bold", "removeBackground", "motionPaused"].includes(key)) {
        if (typeof value !== "boolean") return null
      } else if (key === "animationPreset") {
        if (typeof value !== "string" || (value !== "original" && !AUTO_INDEX_ANIMATION_PRESETS.some((preset) => preset.value === value))) return null
        fields[key as AutoIndexControlKey] = value
        continue
      } else if (key === "animationDuration") {
        const duration = normalizeAnimationDurationSeconds(value)
        if (!duration) return null
        fields[key as AutoIndexControlKey] = duration
        continue
      } else if (key === "customClass") {
        if (typeof value !== "string" || value.length > 500 || !/^(?:[a-zA-Z_][a-zA-Z0-9_-]*\s*)*$/.test(value)) return null
      } else if (key === "theme") {
        if (!["original", "light", "dark"].includes(text)) return null
      } else if (key === "align") {
        if (!["start", "center", "end"].includes(text)) return null
      } else {
        if (typeof value === "boolean" || !text || text.length > 300 || /[;{}<>\\]|url\s*\(|expression\s*\(|var\s*\(|@import/i.test(text)) return null
        if (["margin", "padding", "fontSize", "letterSpacing", "width", "height", "borderWidth", "borderRadius", "perspective"].includes(key)) {
          const parts = text.split(/\s+/)
          if (parts.length > (["margin", "padding", "borderRadius"].includes(key) ? 4 : 1)) return null
          for (const part of parts) {
            if ((key === "margin" && part === "auto") || (["width", "height"].includes(key) && ["auto", "min-content", "max-content", "fit-content"].includes(part)) || (key === "letterSpacing" && part === "normal")) continue
            const match = part.match(/^(-?\d+(?:\.\d+)?)(?:px|rem|em|%|vw|vh|ch)?$/)
            if (!match || Math.abs(Number(match[1])) > 10000 || (Number(match[1]) < 0 && !["margin", "letterSpacing"].includes(key))) return null
          }
        }
        if (key === "lineHeight" && text !== "normal" && !/^\d+(?:\.\d+)?(?:px|rem|em|%|vw|vh)?$/.test(text)) return null
        if (key === "fontFamily" && !/^[\w\s,'"-]+$/.test(text)) return null
        if (key === "opacity" && (!Number.isFinite(Number(text)) || Number(text) < 0 || Number(text) > 1)) return null
        if (key === "aspectRatio" && !/^(?:auto|[1-9]\d{0,3}(?:\.\d+)?(?:\s*\/\s*[1-9]\d{0,3}(?:\.\d+)?)?)$/.test(text)) return null
      }
      fields[key as AutoIndexControlKey] = value as AutoIndexControlValue
    }
    if (Object.keys(fields).length) result.targets[id] = fields
  }
  return result
}

/** Self-contained so copied HTML and React output use the same bindings as the preview. */
export function installAutoIndexControls(
  scope: Window | HTMLElement,
  initialState?: unknown,
  onProfile?: (profile: AutoIndexControlProfile) => void,
  onGoogleFontSelected?: (family: string) => void,
  googleFontFamilies: readonly string[] = [],
  animationPresets: readonly AutoIndexAnimationPreset[] = [],
) {
  const isWindow = "document" in scope
  const doc = isWindow ? scope.document : scope.ownerDocument
  const win = doc.defaultView!
  const host = isWindow ? (doc.getElementById("root") || doc.body) : scope
  const themeHost = isWindow ? doc.documentElement : host
  let surfaces = isWindow ? [doc.documentElement, doc.body, host] : [host]
  let layoutHost = host
  const cssProbe = doc.createElement("span").style
  const typography = ["color", "fontSize", "lineHeight", "letterSpacing", "fontFamily", "italic", "bold"]
  const names: Record<string, string> = {
    color: "Font color", fontSize: "Font size", lineHeight: "Line height", letterSpacing: "Letter spacing",
    fontFamily: "Font family", italic: "Italic", bold: "Bold", margin: "Margin", padding: "Padding",
    width: "Width", height: "Height", backgroundColor: "Background color", borderColor: "Border color",
    borderWidth: "Border width", borderRadius: "Corner radius", boxShadow: "Shadow", opacity: "Opacity",
    aspectRatio: "Aspect ratio", perspective: "Perspective", animationDuration: "Animation duration", animationPreset: "Animation",
  }
  type Binding = { element: HTMLElement; text: { node: Text; original: string }[]; target: AutoIndexControlTarget }
  type StyleOriginal = { value: string; priority: string; appliedValue: string; appliedPriority: string }
  const originalBindings = new WeakMap<Node, Binding>()
  const nextTargetOrdinals = new Map<string, number>()
  const textEdits = new Map<Text, { original: string; applied: string }>()
  const styleEdits = new Map<HTMLElement, { hadAttribute: boolean; values: Map<string, StyleOriginal> }>()
  const attributeEdits = new Map<HTMLElement, Map<string, { original: string | null; applied: string | null }>>()
  const classEdits = new Map<HTMLElement, { hadAttribute: boolean; added: Set<string>; removed: Map<string, number> }>()
  const animationEdits = new Map<Animation, AnimationPlayState>()
  let bindings: Binding[] = []
  let animatedElements: HTMLElement[] = []
  let animations: Animation[] = []
  let presetAnimation: Animation | null = null
  let lastPreset = "original"
  let lastPresetDuration = ""
  let lastPresetElement: HTMLElement | null = null
  let defaultAnimationDuration = "1s"
  let state: AutoIndexControlState = { version: 1, targets: {} }
  let selected: string | null = null
  let disposed = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastProfile = ""
  const reducedMotion = win.matchMedia?.("(prefers-reduced-motion: reduce)")
  const visibilityProbe = doc.createElement("span").style
  const observer = new win.MutationObserver((mutations) => {
    if (timer || disposed) return
    const relevant = mutations.some((mutation) => {
      if (mutation.type !== "attributes" || mutation.attributeName !== "style") return true
      if (!("style" in mutation.target)) return false
      visibilityProbe.cssText = mutation.oldValue || ""
      const current = (mutation.target as HTMLElement).style
      return ["display", "visibility"].some((property) => visibilityProbe.getPropertyValue(property) !== current.getPropertyValue(property) || visibilityProbe.getPropertyPriority(property) !== current.getPropertyPriority(property))
    })
    if (!relevant) return
    timer = setTimeout(() => {
      timer = undefined
      discover()
    }, 80)
  })

  function cssName(key: string) { return key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`) }
  function observe() {
    if (!disposed) observer.observe(host, {
      childList: true, subtree: true, characterData: true, attributes: true,
      attributeFilter: ["hidden", "aria-hidden", "class", "style"], attributeOldValue: true,
    })
  }
  function setStyle(element: HTMLElement, property: string, value: string) {
    let record = styleEdits.get(element)
    if (!record) {
      record = { hadAttribute: element.hasAttribute("style"), values: new Map() }
      styleEdits.set(element, record)
    }
    if (!record.values.has(property)) record.values.set(property, {
      value: element.style.getPropertyValue(property), priority: element.style.getPropertyPriority(property),
      appliedValue: "", appliedPriority: "",
    })
    element.style.setProperty(property, value, "important")
    const edit = record.values.get(property)!
    edit.appliedValue = element.style.getPropertyValue(property)
    edit.appliedPriority = element.style.getPropertyPriority(property)
  }
  function setAttribute(element: HTMLElement, key: string, value: string | null) {
    let record = attributeEdits.get(element)
    if (!record) { record = new Map(); attributeEdits.set(element, record) }
    if (!record.has(key)) record.set(key, { original: element.getAttribute(key), applied: value })
    else record.get(key)!.applied = value
    if (value === null) element.removeAttribute(key)
    else element.setAttribute(key, value)
  }
  function setClasses(element: HTMLElement, tokens: string[]) {
    let record = classEdits.get(element)
    if (!record) {
      record = { hadAttribute: element.hasAttribute("class"), added: new Set(), removed: new Map() }
      classEdits.set(element, record)
    }
    const desired = new Set(tokens)
    const current = Array.from(element.classList)
    current.forEach((token, index) => {
      if (desired.has(token)) return
      if (!record!.added.delete(token)) record!.removed.set(token, index)
      element.classList.remove(token)
    })
    for (const token of desired) {
      if (element.classList.contains(token)) continue
      if (!record.removed.delete(token)) record.added.add(token)
      element.classList.add(token)
    }
  }
  function normalizeDuration(value: unknown) {
    if (typeof value !== "string" && typeof value !== "number") return undefined
    if (typeof value === "number" && (!Number.isFinite(value) || value < 0)) return undefined
    const raw = (typeof value === "number" ? String(value).replace(/^((?:\d+)(?:\.\d+)?)[eE]([+-]?\d+)$/, (_match, significand: string, exponent: string) => {
      const [whole = "0", fraction = ""] = significand.split(".")
      const digits = whole + fraction
      const point = whole.length + Number(exponent)
      return point <= 0 ? `0.${"0".repeat(-point)}${digits}` : point >= digits.length ? `${digits}${"0".repeat(point - digits.length)}` : `${digits.slice(0, point)}.${digits.slice(point)}`
    }) : value).trim().split(",", 1)[0]?.trim()
    const match = raw?.match(/^(\d+(?:\.\d+)?|\.\d+)(ms|s)?$/)
    if (!match || !Number.isFinite(Number(match[1])) || Number(match[1]) < 0) return undefined
    let [whole = "0", fraction = ""] = match[1]!.split(".")
    whole = whole.replace(/^0+(?=\d)/, "") || "0"
    if (match[2] === "ms") {
      const digits = whole + fraction
      const point = whole.length - 3
      if (point <= 0) { whole = "0"; fraction = `${"0".repeat(-point)}${digits}` }
      else if (point >= digits.length) { whole = `${digits}${"0".repeat(point - digits.length)}`; fraction = "" }
      else { whole = digits.slice(0, point); fraction = digits.slice(point) }
      whole = whole.replace(/^0+(?=\d)/, "") || "0"
    }
    fraction = fraction.replace(/0+$/, "")
    return `${whole}${fraction ? `.${fraction}` : ""}s`
  }
  function syncPresetAnimation() {
    const preset = String(state.targets.component?.animationPreset ?? "original")
    const duration = normalizeDuration(state.targets.component?.animationDuration) || defaultAnimationDuration
    const changed = preset !== lastPreset || duration !== lastPresetDuration || layoutHost !== lastPresetElement
    if (changed) {
      presetAnimation?.cancel()
      presetAnimation = null
      lastPreset = preset
      lastPresetDuration = duration
      lastPresetElement = layoutHost
      if (preset !== "original" && !reducedMotion?.matches) {
        const definition = animationPresets.find((entry) => entry.value === preset)
        if (definition && typeof layoutHost.animate === "function") {
          presetAnimation = layoutHost.animate(definition.keyframes, { duration: Number(duration.slice(0, -1)) * 1000, easing: "ease", fill: "both" })
          if (state.targets.component?.motionPaused === true) presetAnimation.pause()
        }
      }
      return
    }
    if (reducedMotion?.matches) {
      presetAnimation?.cancel()
      presetAnimation = null
    } else if (state.targets.component?.motionPaused === true) {
      presetAnimation?.pause()
    } else if (presetAnimation?.playState === "paused") {
      presetAnimation.play()
    }
  }
  function restore() {
    for (const [element, record] of styleEdits) {
      for (const [property, original] of record.values) {
        if (element.style.getPropertyValue(property) !== original.appliedValue || element.style.getPropertyPriority(property) !== original.appliedPriority) continue
        if (original.value) element.style.setProperty(property, original.value, original.priority)
        else element.style.removeProperty(property)
      }
      if (!record.hadAttribute && !element.style.cssText) element.removeAttribute("style")
    }
    styleEdits.clear()
    for (const [element, attributes] of attributeEdits) for (const [key, edit] of attributes) {
      if (element.getAttribute(key) !== edit.applied) continue
      if (edit.original === null) element.removeAttribute(key)
      else element.setAttribute(key, edit.original)
    }
    attributeEdits.clear()
    for (const [element, record] of classEdits) {
      for (const token of record.added) element.classList.remove(token)
      const tokens = Array.from(element.classList)
      for (const [token, index] of record.removed) if (!tokens.includes(token)) tokens.splice(index, 0, token)
      if (record.removed.size) element.setAttribute("class", tokens.join(" "))
      if (!record.hadAttribute && !element.classList.length) element.removeAttribute("class")
    }
    classEdits.clear()
    for (const [node, edit] of textEdits) {
      if (node.data === edit.applied) node.data = edit.original
    }
    textEdits.clear()
    for (const [animation, playState] of animationEdits) {
      if (playState === "running" && animation.playState === "paused") animation.play()
    }
    animationEdits.clear()
  }
  function validValue(key: string, value: unknown): string | number | boolean | undefined {
    if (!["string", "number", "boolean"].includes(typeof value)) return undefined
    if (typeof value === "number" && !Number.isFinite(value)) return undefined
    if (key === "text") return typeof value === "string" && value.length <= 10000 ? value : undefined
    if (["italic", "bold", "removeBackground", "motionPaused"].includes(key)) return typeof value === "boolean" ? value : undefined
    if (key === "animationPreset") return typeof value === "string" && (value === "original" || animationPresets.some((preset) => preset.value === value)) ? value : undefined
    if (key === "animationDuration") return normalizeDuration(value)
    if (key === "theme") return ["original", "light", "dark"].includes(String(value)) ? String(value) : undefined
    if (key === "align") return ["start", "center", "end"].includes(String(value)) ? String(value) : undefined
    if (key === "customClass") return typeof value === "string" && value.length <= 500 && /^(?:[a-zA-Z_][a-zA-Z0-9_-]*\s*)*$/.test(value) ? value.trim() : undefined
    if (!Object.prototype.hasOwnProperty.call(names, key) || typeof value === "boolean") return undefined
    let text = String(value).trim()
    if (!text || text.length > 300 || /[;{}<>\\]|url\s*\(|expression\s*\(|var\s*\(|@import/i.test(text)) return undefined
    const length = /^(-?\d+(?:\.\d+)?)(px|rem|em|%|vw|vh|ch)?$/
    if (["margin", "padding", "fontSize", "letterSpacing", "width", "height", "borderWidth", "borderRadius", "perspective"].includes(key)) {
      if (["width", "height"].includes(key) && ["auto", "min-content", "max-content", "fit-content"].includes(text)) return text
      if (key === "letterSpacing" && text === "normal") return text
      const parts = text.split(/\s+/)
      if (parts.length > (["margin", "padding", "borderRadius"].includes(key) ? 4 : 1)) return undefined
      const normalized: string[] = []
      for (const part of parts) {
        if (key === "margin" && part === "auto") { normalized.push(part); continue }
        const match = part.match(length)
        if (!match || Math.abs(Number(match[1])) > 10000 || (Number(match[1]) < 0 && !["margin", "letterSpacing"].includes(key))) return undefined
        normalized.push(match[2] ? part : `${part}px`)
      }
      text = normalized.join(" ")
    }
    if (key === "lineHeight" && text !== "normal" && !/^(?:\d+(?:\.\d+)?)(?:px|rem|em|%|vw|vh)?$/.test(text)) return undefined
    if (key === "fontFamily" && !/^[\w\s,'"-]+$/.test(text)) return undefined
    if (key === "opacity" && (!Number.isFinite(Number(text)) || Number(text) < 0 || Number(text) > 1)) return undefined
    if (key === "aspectRatio" && !/^(?:auto|[1-9]\d{0,3}(?:\.\d+)?(?:\s*\/\s*[1-9]\d{0,3}(?:\.\d+)?)?)$/.test(text)) return undefined
    cssProbe.removeProperty(cssName(key))
    cssProbe.setProperty(cssName(key), key === "fontFamily" && googleFontFamilies.includes(text) ? `"${text}", sans-serif` : text)
    return cssProbe.getPropertyValue(cssName(key)) ? text : undefined
  }
  function normalize(input: unknown): AutoIndexControlState {
    const clean: AutoIndexControlState = { version: 1, targets: {} }
    if (!input || typeof input !== "object" || Array.isArray(input)) return clean
    const envelope = input as Record<string, unknown>
    if (envelope.version !== 1 || !envelope.targets || typeof envelope.targets !== "object" || Array.isArray(envelope.targets)) return clean
    for (const [id, fields] of Object.entries(envelope.targets).slice(0, 64)) {
      if (!/^(?:component|text-[a-z0-9]+-\d+|element-[a-z0-9]+-\d+)$/.test(id) || !fields || typeof fields !== "object" || Array.isArray(fields)) continue
      const edits: Partial<Record<AutoIndexControlKey, AutoIndexControlValue>> = {}
      for (const [key, raw] of Object.entries(fields).slice(0, 32)) {
        const value = validValue(key, raw)
        if (value !== undefined) edits[key as AutoIndexControlKey] = value
      }
      if (Object.keys(edits).length) clean.targets[id] = edits
    }
    return clean
  }
  function control(key: AutoIndexControlKey, value: AutoIndexControlValue, group: AutoIndexControlDefinition["group"], recommended = false): AutoIndexControlDefinition {
    return { key, label: names[key] || key, group, type: /color/i.test(key) ? "color" : "text", defaultValue: value, recommended }
  }
  function textControls(style: CSSStyleDeclaration): AutoIndexControlDefinition[] {
    const family = style.fontFamily || "system-ui"
    return [
      control("color", style.color || "#000000", "appearance", true),
      control("fontSize", style.fontSize || "16px", "appearance", true),
      control("lineHeight", style.lineHeight || "normal", "appearance"),
      control("letterSpacing", style.letterSpacing || "normal", "appearance"),
      { ...control("fontFamily", family, "appearance"), type: "select", options: Array.from(new Set([family, ...googleFontFamilies, "system-ui", "Arial", "Georgia", "serif", "sans-serif", "monospace"])).map((value) => ({ label: value, value })) },
      { ...control("italic", style.fontStyle === "italic", "appearance"), type: "boolean" },
      { ...control("bold", Number(style.fontWeight) >= 600 || style.fontWeight === "bold", "appearance"), type: "boolean" },
    ]
  }
  function appearanceControls(style: CSSStyleDeclaration): AutoIndexControlDefinition[] {
    const controls: AutoIndexControlDefinition[] = []
    if (style.backgroundColor && !["transparent", "rgba(0, 0, 0, 0)"].includes(style.backgroundColor)) controls.push(control("backgroundColor", style.backgroundColor, "appearance", true))
    if (parseFloat(style.borderWidth) > 0) controls.push(control("borderWidth", style.borderWidth, "appearance", true), control("borderColor", style.borderColor, "appearance"))
    if (parseFloat(style.borderRadius) > 0) controls.push(control("borderRadius", style.borderRadius, "appearance", true))
    if (style.boxShadow && style.boxShadow !== "none") controls.push(control("boxShadow", style.boxShadow, "appearance", true))
    if (style.perspective && style.perspective !== "none") controls.push(control("perspective", style.perspective, "appearance", true))
    controls.push({ ...control("opacity", Number(style.opacity || 1), "appearance"), type: "number", min: 0, max: 1, step: 0.01 })
    return controls
  }
  function hash(text: string) {
    let value = 2166136261
    for (let index = 0; index < text.length; index++) value = Math.imul(value ^ text.charCodeAt(index), 16777619)
    return (value >>> 0).toString(36)
  }
  function hidden(element: HTMLElement) {
    if (element.closest("script,style,template,noscript,svg,input,textarea,select,[hidden],[aria-hidden='true'],[contenteditable='true']")) return true
    for (let current: HTMLElement | null = element; current && host.contains(current); current = current.parentElement) {
      const style = win.getComputedStyle(current)
      if (style.display === "none" || style.visibility === "hidden") return true
    }
    return false
  }
  function discover() {
    if (disposed) return
    observer.disconnect()
    restore()
    surfaces = isWindow ? [doc.documentElement, doc.body, host] : [host]
    layoutHost = host
    for (let depth = 0; depth < 8; depth++) {
      const children = Array.from(layoutHost.children).filter((child) => !/^(SCRIPT|STYLE|TEMPLATE)$/.test(child.tagName))
      if (children.length !== 1 || !("style" in children[0]!)) break
      const child = children[0] as HTMLElement
      const childStyle = win.getComputedStyle(child)
      const fullHeight = [childStyle.height, childStyle.minHeight].some((value) => /^(?:100(?:vh|dvh|svh|%)|(?:[\d.]+)px)$/.test(value) && (value.includes("vh") || value === "100%" || parseFloat(value) >= win.innerHeight * 0.75))
      if (!fullHeight || Array.from(child.childNodes).some((node) => node.nodeType === 3 && node.textContent?.trim())) break
      surfaces.push(child)
      layoutHost = child
    }
    const next: Binding[] = []
    animatedElements = []
    animations = typeof host.getAnimations === "function" ? host.getAnimations({ subtree: true }).filter((animation) => animation !== presetAnimation).slice(0, 200) : []
    const walker = doc.createTreeWalker(host, 1)
    const elements: HTMLElement[] = [host]
    let node: Node | null
    // shortcut: discovery caps at 500 elements and 64 targets; expand with measured large-component demand.
    while (elements.length < 500 && (node = walker.nextNode())) if (node.nodeType === 1 && "style" in node) elements.push(node as HTMLElement)
    for (const element of elements) {
      const style = win.getComputedStyle(element)
      if (style.animationName && style.animationName.split(",").some((name) => name.trim() !== "none")) animatedElements.push(element)
      if (element === host || next.length >= 63 || hidden(element)) continue
      const textNodes = Array.from(element.childNodes).filter((child): child is Text => child.nodeType === 3 && Boolean(child.textContent?.trim()))
      const appearance = appearanceControls(style)
      const relevantElement = appearance.some((entry) => entry.recommended) || /^(IMG|VIDEO|CANVAS)$/.test(element.tagName)
      if (!textNodes.length && !relevantElement) continue
      for (const textNode of textNodes.length ? textNodes : [null]) {
      if (next.length >= 63) break
      const text = textNode ? [{ node: textNode, original: textNode.data }] : []
      const ownText = textNode?.data || ""
      const hasText = Boolean(textNode)
      const previous = originalBindings.get(textNode || element)
      const saved = previous?.text[0]?.original === ownText || (!textNode && previous) ? previous : undefined
      const signature = `${element.tagName.toLowerCase()}|${element.getAttribute("role") || ""}|${ownText}`
      const label = `${/^H[1-6]$/.test(element.tagName) ? "Heading" : element.tagName === "BUTTON" ? "Button" : hasText ? "Text" : element.tagName.toLowerCase()}: ${ownText.trim().slice(0, 44) || element.getAttribute("aria-label") || "Appearance"}`
      const controls = saved?.target.controls || [
        ...(hasText ? [{ key: "text", label: "Text", group: "content", type: "text", defaultValue: ownText, recommended: true } as AutoIndexControlDefinition, ...textControls(style)] : []),
        ...appearance,
      ]
      if (/^(IMG|VIDEO|CANVAS)$/.test(element.tagName) && !controls.some((entry) => entry.key === "aspectRatio")) {
        const rect = element.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) controls.push(control("aspectRatio", `${Math.round(rect.width)} / ${Math.round(rect.height)}`, "layout"))
      }
      const target: AutoIndexControlTarget = { id: "", label: saved?.target.label || label, signature, kind: hasText ? "text" : "element", controls, recommendations: controls.filter((entry) => entry.recommended).map((entry) => entry.key) }
      const binding: Binding = { element, text, target }
      next.push(binding)
      }
    }
    const previousGroups = new Map<string, Binding[]>()
    const nextGroups = new Map<string, Binding[]>()
    for (const binding of bindings) {
      const group = previousGroups.get(binding.target.signature) || []
      group.push(binding)
      previousGroups.set(binding.target.signature, group)
    }
    for (const binding of next) {
      const group = nextGroups.get(binding.target.signature) || []
      group.push(binding)
      nextGroups.set(binding.target.signature, group)
    }
    for (const binding of next) {
      const identity = binding.text[0]?.node || binding.element
      const previous = originalBindings.get(identity)
      const previousGroup = previousGroups.get(binding.target.signature) || []
      if (previous?.target.signature === binding.target.signature) {
        binding.target.id = previous.target.id
      } else if (previousGroup.length === 1 && nextGroups.get(binding.target.signature)?.length === 1 && !host.contains(previousGroup[0]!.text[0]?.node || previousGroup[0]!.element)) {
        binding.target.id = previousGroup[0]!.target.id
      } else {
        // A replaced repeated label has no reliable identity; never transfer its previous edit.
        const prefix = `${binding.target.kind}-${hash(binding.target.signature)}`
        const ordinal = nextTargetOrdinals.get(prefix) || 0
        nextTargetOrdinals.set(prefix, ordinal + 1)
        binding.target.id = `${prefix}-${ordinal}`
      }
      originalBindings.set(identity, binding)
    }
    const style = win.getComputedStyle(host)
    defaultAnimationDuration = (animatedElements[0] && normalizeDuration(win.getComputedStyle(animatedElements[0]).animationDuration)) || "1s"
    const textBinding = next.find((entry) => entry.target.kind === "text")
    const rootControls: AutoIndexControlDefinition[] = [
      { key: "removeBackground", label: "Remove background", group: "appearance", type: "boolean", defaultValue: false },
      { key: "theme", label: "Theme", group: "appearance", type: "select", defaultValue: "original", options: [{ label: "Original", value: "original" }, { label: "Light", value: "light" }, { label: "Dark", value: "dark" }] },
      control("margin", style.margin || "0px", "layout"), control("padding", style.padding || "0px", "layout"),
      { key: "align", label: "Align", group: "layout", type: "select", defaultValue: "start", options: [{ label: "Start", value: "start" }, { label: "Center", value: "center" }, { label: "End", value: "end" }] },
      control("width", style.width || "auto", "layout"), control("height", style.height || "auto", "layout"),
      { key: "customClass", label: "Custom class", group: "advanced", type: "text", defaultValue: "" },
      ...(textBinding ? textControls(win.getComputedStyle(textBinding.element)) : []), ...appearanceControls(style),
    ]
    if (animatedElements.length || animations.length) rootControls.push({ key: "motionPaused", label: "Pause motion", group: "motion", type: "boolean", defaultValue: Boolean(reducedMotion?.matches), recommended: true })
    rootControls.push({ ...control("animationPreset", "original", "motion"), type: "select", options: [{ label: "Original", value: "original" }, ...animationPresets.map(({ label, value }) => ({ label, value }))] })
    rootControls.push(control("animationDuration", defaultAnimationDuration, "motion"))
    const target: AutoIndexControlTarget = { id: "component", label: "Whole component", signature: "component", kind: "component", controls: rootControls, recommendations: rootControls.filter((entry) => entry.recommended).map((entry) => entry.key) }
    bindings = [{ element: host, text: [], target }, ...next]
    const profile: AutoIndexControlProfile = { version: 1, targets: bindings.map((entry) => entry.target) }
    const serialized = JSON.stringify(profile)
    if (serialized !== lastProfile) { lastProfile = serialized; onProfile?.(profile) }
    apply()
  }
  function apply() {
    if (disposed) return
    observer.disconnect()
    restore()
    for (const binding of bindings) {
      const edits = state.targets[binding.target.id]
      if (!edits) continue
      for (const definition of binding.target.controls) {
        const key = definition.key
        const value = edits[key]
        if (value === undefined) continue
        const element = binding.element
        if (key === "text") {
          for (const entry of binding.text) {
            textEdits.set(entry.node, { original: entry.node.data, applied: String(value) })
            entry.node.data = String(value)
          }
        } else if (key === "customClass") {
          setClasses(element, [...Array.from(element.classList), ...String(value).split(/\s+/).filter(Boolean)])
        } else if (key === "theme" && value !== "original") {
          const layoutBefore = win.getComputedStyle(layoutHost)
          const originalForeground = layoutBefore.color
          const originalBackground = layoutBefore.backgroundColor
          const originalImage = layoutBefore.backgroundImage
          const paintedText: { element: HTMLElement; surface: HTMLElement; background: string; image: string; color: string }[] = []
          for (const part of bindings) if (part.target.kind === "text") {
            for (let surface: HTMLElement | null = part.element; surface && surface !== layoutHost && host.contains(surface); surface = surface.parentElement) {
              const paint = win.getComputedStyle(surface)
              if ((!paint.backgroundColor || ["transparent", "rgba(0, 0, 0, 0)"].includes(paint.backgroundColor)) && (!paint.backgroundImage || paint.backgroundImage === "none")) continue
              paintedText.push({ element: part.element, surface, background: paint.backgroundColor, image: paint.backgroundImage, color: win.getComputedStyle(part.element).color })
              break
            }
          }
          const classes = Array.from(themeHost.classList).filter((name) => name !== "light" && name !== "dark")
          setClasses(themeHost, [...classes, String(value)])
          setAttribute(themeHost, "data-theme", String(value))
          setStyle(themeHost, "color-scheme", String(value))
          const unchangedPaint = paintedText.filter((part) => {
            const paint = win.getComputedStyle(part.surface)
            return paint.backgroundColor === part.background && paint.backgroundImage === part.image && win.getComputedStyle(part.element).color === part.color
          })
          const themedLayout = win.getComputedStyle(layoutHost)
          if (themedLayout.color === originalForeground) setStyle(layoutHost, "color", value === "dark" ? "#f4f4f5" : "#18181b")
          if (themedLayout.backgroundColor === originalBackground && themedLayout.backgroundImage === originalImage) setStyle(layoutHost, "background-color", value === "dark" ? "#18181b" : "#ffffff")
          // Outer theme fallback must not reduce contrast inside cards whose paint stayed unchanged.
          for (const part of unchangedPaint) if (win.getComputedStyle(part.element).color !== part.color) setStyle(part.element, "color", part.color)
        } else if (key === "removeBackground") {
          // Applied after theme below so transparency remains independent of theme selection.
        } else if (key === "align") {
          const layout = win.getComputedStyle(layoutHost)
          if (layout.display.includes("flex")) {
            setStyle(layoutHost, layout.flexDirection.startsWith("column") ? "align-items" : "justify-content", value === "center" ? "center" : `flex-${value}`)
          } else if (layout.display.includes("grid")) {
            setStyle(layoutHost, "justify-items", String(value))
          } else {
            for (const child of Array.from(layoutHost.children)) if ("style" in child) {
              setStyle(child as HTMLElement, "margin-left", value === "start" ? "0px" : "auto")
              setStyle(child as HTMLElement, "margin-right", value === "end" ? "0px" : "auto")
            }
            setStyle(layoutHost, "text-align", value === "start" ? "left" : value === "end" ? "right" : "center")
          }
        } else if (key === "motionPaused") {
          // Motion inspection is applied once after all target styles.
        } else if (key === "animationDuration") {
          for (const animated of animatedElements) setStyle(animated, "animation-duration", String(value))
        } else if (key === "animationPreset") {
          // The allowlisted Web Animation is synchronized after all control values are applied.
        } else {
          if (key === "fontFamily") onGoogleFontSelected?.(String(value))
          const targets = binding.target.id === "component" && typography.includes(key) ? bindings.filter((entry) => entry.target.kind === "text").map((entry) => entry.element) : [element]
          const property = key === "bold" ? "font-weight" : key === "italic" ? "font-style" : cssName(key)
          const cssValue = key === "bold" ? value ? "700" : "400" : key === "italic" ? value ? "italic" : "normal" : key === "fontFamily" && googleFontFamilies.includes(String(value)) ? `"${value}", sans-serif` : String(value)
          for (const target of targets) setStyle(target, property, cssValue)
          if (binding.target.id === "component" && (key === "width" || key === "height") && value !== "auto") {
            for (const surface of surfaces) if (surface !== host && host.contains(surface)) {
              setStyle(surface, property, "100%")
              setStyle(surface, `min-${property}`, "0px")
            }
          }
        }
      }
    }
    if (state.targets.component?.removeBackground === true) {
      for (const surface of surfaces) {
        setStyle(surface, "background-color", "transparent")
        setStyle(surface, "background-image", "none")
      }
      const frame = isWindow ? scope.frameElement : null
      // Browsers make mismatched iframe color schemes opaque even with transparent document backgrounds.
      if (frame && "style" in frame) setStyle(frame as HTMLElement, "color-scheme", win.getComputedStyle(doc.documentElement).colorScheme || "normal")
    }
    if (reducedMotion?.matches || state.targets.component?.motionPaused === true) {
      for (const element of animatedElements) setStyle(element, "animation-play-state", "paused")
      for (const animation of animations) {
        if (animation.playState !== "running") continue
        animationEdits.set(animation, animation.playState)
        animation.pause()
      }
    }
    syncPresetAnimation()
    const highlighted = bindings.find((entry) => entry.target.id === selected)
    if (highlighted) { setStyle(highlighted.element, "outline", "2px solid #a78bfa"); setStyle(highlighted.element, "outline-offset", "3px") }
    observe()
  }
  function update(input: unknown) { if (!disposed) { state = normalize(input); apply() } }
  function reset() { update({ version: 1, targets: {} }) }
  function select(id: string | null) { selected = id; apply() }
  function replay() {
    if (disposed || reducedMotion?.matches) return
    if (presetAnimation) {
      presetAnimation.currentTime = 0
      if (state.targets.component?.motionPaused !== true) presetAnimation.play()
    }
    for (const animation of animations) {
      animation.currentTime = 0
      if (state.targets.component?.motionPaused !== true) animation.play()
    }
    observer.disconnect()
    for (const element of animatedElements) {
      const name = element.style.getPropertyValue("animation-name")
      const priority = element.style.getPropertyPriority("animation-name")
      const hadStyle = element.hasAttribute("style")
      element.style.setProperty("animation-name", "none", "important")
      void element.offsetWidth
      if (name) element.style.setProperty("animation-name", name, priority)
      else element.style.removeProperty("animation-name")
      if (!hadStyle && !element.style.cssText) element.removeAttribute("style")
    }
    observe()
  }
  function dispose() {
    if (disposed) return
    disposed = true
    observer.disconnect()
    if (timer) clearTimeout(timer)
    reducedMotion?.removeEventListener?.("change", apply)
    presetAnimation?.cancel()
    restore()
  }
  state = normalize(initialState)
  discover()
  reducedMotion?.addEventListener?.("change", apply)
  return { update, reset, select, replay, dispose }
}

export type AutoIndexPreviewTag = { slug?: string | null; name?: string | null; tag_slug?: string | null; tag_name?: string | null }
export type AutoIndexPreviewLayout = "centered" | "background"

export function getAutoIndexPreviewLayout(tags: readonly AutoIndexPreviewTag[] = []): AutoIndexPreviewLayout {
  return tags.some((tag) => [tag.slug, tag.name, tag.tag_slug, tag.tag_name].some((value) =>
    typeof value === "string" && /^(?:backgrounds?|shaders?)$/i.test(value.trim()),
  )) ? "background" : "centered"
}

export function createAutoIndexPreviewDocument(html: string, nonce: string, baseUrl: string, googleFonts: readonly string[] = [], animationPresets: readonly AutoIndexAnimationPreset[] = [], layout: AutoIndexPreviewLayout = "centered"): string {
  if (!/^[a-zA-Z0-9-]{16,128}$/.test(nonce) || new TextEncoder().encode(html).byteLength > 2 * 1024 * 1024) {
    throw new Error("Auto-index preview is invalid or exceeds the preview limit.")
  }
  const json = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e")
  const runtime = `(() => {
    const nonce = ${json(nonce)}, fonts = ${json(googleFonts)}, presets = ${json(animationPresets)};
    let commandPort = null, currentProfile = null;
    const send = (action, data = {}) => { if (commandPort) commandPort.postMessage({ type: "hb-auto-index-controls", nonce, action, ...data }); };
    const loadFont = family => {
      if (!fonts.includes(family) || Array.from(document.querySelectorAll("link[data-hb-google-font]")).some(link => link.dataset.hbGoogleFont === family)) return;
      const link = document.createElement("link"); link.rel = "stylesheet"; link.dataset.hbGoogleFont = family;
      link.href = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(family).replace(/%20/g, "+") + "&display=swap"; document.head.append(link);
    };
    const runtime = (${installAutoIndexControls.toString()})(window, { version: 1, targets: {} }, profile => { currentProfile = profile; send("profile", { profile }); }, loadFont, fonts, presets);
    const announceReady = () => {
      if (commandPort) return;
      const channel = new MessageChannel();
      commandPort = channel.port1;
      commandPort.onmessage = message => {
        if (message.data?.type !== "hb-auto-index-controls-command" || message.data?.nonce !== nonce) return;
        if (message.data.action === "connect") { if (currentProfile) send("profile", { profile: currentProfile }); }
        else if (message.data.action === "update") runtime.update(message.data.state);
        else if (message.data.action === "select") runtime.select(message.data.target === "component" ? null : message.data.target);
        else if (message.data.action === "replay") runtime.replay();
        else if (message.data.action === "dispose") { runtime.dispose(); commandPort.close(); commandPort = null; }
      };
      commandPort.start?.();
      window.parent.postMessage({ type: "hb-auto-index-controls", nonce, action: "ready" }, "*", [channel.port2]);
    };
    window.addEventListener("load", announceReady, { once: true });
  })();`
  const layoutStyle = `<style id="higherbits-preview-layout">html,body{width:100%;min-height:100%;margin:0!important;padding:0!important}${layout === "background"
    ? `html,body,#root,#__next{height:100%!important;min-height:100%!important;overflow:hidden!important}body,#root,#__next{display:block!important;height:100vh!important;min-height:100vh!important}.ghl-component-wrapper{box-sizing:border-box!important;width:100%!important;height:100%!important;min-height:100vh!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;display:block!important}.ghl-component-wrapper>*{width:100%!important;height:100%!important;min-height:100vh!important}#root>*,#__next>*{width:100%!important;height:100%!important;min-height:100vh!important;margin:0!important}`
    : `body{min-height:100vh;display:grid!important;place-items:center!important}#root,#__next{width:100%;min-height:100vh;display:grid!important;place-items:center!important}.ghl-component-wrapper{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-height:100vh!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;display:grid!important;place-items:center!important}#root>*,#__next>*{margin-inline:auto!important}`}</style>`
  const base = `<base href="${baseUrl.replace(/[&\"<>]/g, "")}">`
  let output = html
  const head = output.match(/<head\b[^>]*>/i)
  if (head) {
    const insertion = head.index! + head[0].length
    const headContent = output.slice(insertion, output.indexOf("</head>", insertion))
    const additions = `${/<base\b/i.test(headContent) ? "" : base}${/<style\b[^>]*id=["']higherbits-preview-layout["']/i.test(headContent) ? "" : layoutStyle}`
    if (additions) output = output.slice(0, insertion) + additions + output.slice(insertion)
  } else {
    const htmlTag = output.match(/<html\b[^>]*>/i)
    const insertion = htmlTag ? htmlTag.index! + htmlTag[0].length : 0
    output = output.slice(0, insertion) + `<head>${base}${layoutStyle}</head>` + output.slice(insertion)
  }
  const script = `<script>${runtime}</script>`
  const bodyEnd = output.toLowerCase().lastIndexOf("</body>")
  return bodyEnd >= 0 ? output.slice(0, bodyEnd) + script + output.slice(bodyEnd) : output + script
}
