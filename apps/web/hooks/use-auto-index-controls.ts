"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { useSetAtom } from "jotai"
import {
  activeDemoControlsAtom,
  extractControlsSettings,
  getDefaultControlValues,
} from "@/lib/controls-parser"
import {
  createAutoIndexPreviewDocument,
  AUTO_INDEX_ANIMATION_PRESETS,
  type AutoIndexControlKey,
  type AutoIndexControlProfile,
  type AutoIndexControlState,
} from "@/lib/auto-index-controls-runtime"
import { POPULAR_GOOGLE_FONT_FAMILIES } from "@/lib/google-fonts"

const emptyState: AutoIndexControlState = { version: 1, targets: {} }
const previewSessions = new Map<symbol, Record<string, unknown>>()
export type PreviewSize = "desktop" | "tablet" | "mobile"

export interface AutoIndexPanelControls {
  profile: AutoIndexControlProfile
  state: AutoIndexControlState
  selectedTarget: string
  onSelect: (target: string) => void
  onChange: (target: string, key: AutoIndexControlKey, value: string | number | boolean) => void
  onResetControl: (target: string, key: AutoIndexControlKey) => void
  onReplay: () => void
  previewSize: PreviewSize
  onPreviewSizeChange: (size: PreviewSize) => void
}

const autoIndexPath = /^\/auto-index\/[a-zA-Z0-9_-]+\.html$/
const localHostnames = new Set(["localhost", "127.0.0.1", "[::1]"])
const controlKeys = new Set<AutoIndexControlKey>(["text", "color", "fontSize", "lineHeight", "letterSpacing", "fontFamily", "italic", "bold", "removeBackground", "theme", "margin", "padding", "align", "width", "height", "customClass", "backgroundColor", "borderColor", "borderWidth", "borderRadius", "boxShadow", "opacity", "aspectRatio", "perspective", "motionPaused", "animationDuration", "animationPreset"])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

export function isAutoIndexControlProfile(value: unknown): value is AutoIndexControlProfile {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.targets) || value.targets.length < 1 || value.targets.length > 64) return false
  const ids = new Set<string>()
  let hasComponent = false
  for (const target of value.targets) {
    if (!isRecord(target) || typeof target.id !== "string" || typeof target.label !== "string" || !target.label.trim() || target.label.length > 120 || typeof target.signature !== "string" || target.signature.length > 300 || !["component", "text", "element"].includes(String(target.kind)) || !Array.isArray(target.controls) || target.controls.length > 32 || !Array.isArray(target.recommendations) || target.recommendations.length > 32) return false
    if (!/^(?:component|text-[a-z0-9]+-\d+|element-[a-z0-9]+-\d+)$/.test(target.id) || ids.has(target.id)) return false
    ids.add(target.id)
    if ((target.id === "component") !== (target.kind === "component") || (target.kind === "text" && !target.id.startsWith("text-")) || (target.kind === "element" && !target.id.startsWith("element-"))) return false
    hasComponent ||= target.kind === "component"
    const keys = new Set<string>()
    for (const control of target.controls) {
      if (!isRecord(control) || typeof control.key !== "string" || !controlKeys.has(control.key as AutoIndexControlKey) || keys.has(control.key) || typeof control.label !== "string" || !control.label.trim() || control.label.length > 100 || !["content", "appearance", "layout", "motion", "advanced"].includes(String(control.group)) || !["text", "color", "number", "select", "boolean"].includes(String(control.type))) return false
      keys.add(control.key)
      const defaultValue = control.defaultValue
      if (!["string", "number", "boolean"].includes(typeof defaultValue) || (typeof defaultValue === "number" && !Number.isFinite(defaultValue)) || (typeof defaultValue === "string" && defaultValue.length > (control.key === "text" ? 10000 : 512))) return false
      if (control.description !== undefined && (typeof control.description !== "string" || control.description.length > 240)) return false
      if (control.recommended !== undefined && typeof control.recommended !== "boolean") return false
      for (const field of ["min", "max", "step"]) if (control[field] !== undefined && (typeof control[field] !== "number" || !Number.isFinite(control[field]))) return false
      if (typeof control.min === "number" && typeof control.max === "number" && control.min > control.max) return false
      if (control.unit !== undefined && (typeof control.unit !== "string" || control.unit.length > 12)) return false
      if (control.options !== undefined && (!Array.isArray(control.options) || control.options.length > 128 || control.options.some((option) => !isRecord(option) || typeof option.label !== "string" || option.label.length > 160 || typeof option.value !== "string" || option.value.length > 512))) return false
    }
    if (target.recommendations.some((key) => typeof key !== "string" || !keys.has(key))) return false
  }
  return hasComponent
}

export function getLocalAutoIndexBundleUrl(bundleUrl?: string | null, origin?: string) {
  if (!bundleUrl || !origin) return null
  try {
    const appOrigin = new URL(origin).origin
    const url = new URL(bundleUrl, appOrigin)
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.search || url.hash || !autoIndexPath.test(url.pathname)) return null
    if (url.origin === appOrigin) return url.href
    if (url.origin !== "https://higherbits.dev" || !localHostnames.has(new URL(appOrigin).hostname)) return null
    return new URL(url.pathname, appOrigin).href
  } catch {
    return null
  }
}

export function isLocalAutoIndexBundle(bundleUrl?: string | null, origin?: string) {
  return Boolean(getLocalAutoIndexBundleUrl(bundleUrl, origin))
}

export function useAutoIndexControls({
  demoId,
  bundleUrl,
  rawCode,
  iframeRef,
  enabled = true,
}: {
  demoId: string | number
  bundleUrl?: string | null
  rawCode: string
  iframeRef: RefObject<HTMLIFrameElement | null>
  enabled?: boolean
}) {
  const identity = `${demoId}:${bundleUrl ?? ""}`
  const controls = useMemo(() => extractControlsSettings(rawCode), [rawCode])
  const defaults = useMemo(() => getDefaultControlValues(controls), [controls])
  const [session, setSession] = useState<{ identity: string; values: Record<string, any> }>({ identity, values: {} })
  const [discovered, setDiscovered] = useState<{ identity: string; profile: AutoIndexControlProfile } | null>(null)
  const [selectedTarget, setSelectedTarget] = useState("component")
  const [previewSize, setPreviewSize] = useState<PreviewSize>("desktop")
  const [unavailableReason, setUnavailableReason] = useState<string>()
  const [bundleFetchFailedIdentity, setBundleFetchFailedIdentity] = useState<string | null>(null)
  const bridgeNonce = useRef("")
  const bridgePort = useRef<MessagePort | null>(null)
  const loadedPreviewDocument = useRef<string | null>(null)
  const [previewDocument, setPreviewDocument] = useState<string | null>(null)
  const [frameReady, setFrameReady] = useState(false)
  const owner = useRef(Symbol("preview-controls"))
  const setGlobalControls = useSetAtom(activeDemoControlsAtom)
  const localBundleUrl = getLocalAutoIndexBundleUrl(bundleUrl, typeof window === "undefined" ? undefined : window.location.origin)
  const isAutoIndex = Boolean(localBundleUrl)
  const activeControls = useMemo(() => ({
    ...defaults,
    ...(session.identity === identity ? session.values : {}),
  }), [defaults, session, identity])
  const state: AutoIndexControlState = activeControls.__hbControls ?? emptyState
  const authoredValues = useMemo(() => Object.fromEntries(controls.map((control) => [control.key, activeControls[control.key]])), [controls, activeControls])
  const profile = discovered?.identity === identity ? discovered.profile : null

  // Only the foremost mounted preview publishes controls for the shared copy action.
  useEffect(() => {
    if (!enabled) return
    const token = owner.current
    previewSessions.set(token, activeControls)
    setGlobalControls(activeControls)
    return () => {
      previewSessions.delete(token)
      setGlobalControls(Array.from(previewSessions.values()).at(-1) ?? {})
    }
  }, [identity, enabled, setGlobalControls])

  useEffect(() => {
    if (!enabled || !previewSessions.has(owner.current)) return
    previewSessions.set(owner.current, activeControls)
    if (Array.from(previewSessions.keys()).at(-1) === owner.current) setGlobalControls(activeControls)
  }, [activeControls, enabled, setGlobalControls])

  useEffect(() => {
    bridgePort.current?.close()
    bridgePort.current = null
    setSession({ identity, values: {} })
    setDiscovered(null)
    setSelectedTarget("component")
    setPreviewSize("desktop")
    setUnavailableReason(undefined)
    setBundleFetchFailedIdentity(null)
    setPreviewDocument(null)
    setFrameReady(false)
    loadedPreviewDocument.current = null
    bridgeNonce.current = ""
  }, [identity, enabled])

  useEffect(() => {
    if (!enabled || !localBundleUrl) {
      if (!enabled) setBundleFetchFailedIdentity(null)
      return
    }
    const controller = new AbortController()
    const nonce = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    bridgeNonce.current = nonce
    loadedPreviewDocument.current = null
    setPreviewDocument(null)
    setFrameReady(false)
    fetch(localBundleUrl, { credentials: "same-origin", signal: controller.signal }).then(async (response) => {
      if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) throw new Error("Preview bundle unavailable")
      const size = Number(response.headers.get("content-length"))
      if (Number.isFinite(size) && size > 2 * 1024 * 1024) throw new Error("Preview bundle exceeds the preview limit")
      const html = await response.text()
      const baseUrl = new URL(localBundleUrl)
      baseUrl.search = ""
      baseUrl.hash = ""
      baseUrl.pathname = baseUrl.pathname.slice(0, baseUrl.pathname.lastIndexOf("/") + 1)
      setPreviewDocument(createAutoIndexPreviewDocument(html, nonce, baseUrl.href, POPULAR_GOOGLE_FONT_FAMILIES, AUTO_INDEX_ANIMATION_PRESETS))
    }).catch(() => {
      if (!controller.signal.aborted) {
        setBundleFetchFailedIdentity(identity)
        setUnavailableReason("Extra controls are unavailable for this preview. Reload the preview to try again.")
      }
    })
    return () => controller.abort()
  }, [enabled, localBundleUrl, identity])

  useEffect(() => {
    if (!enabled || !isAutoIndex) return
    const handleMessage = (event: MessageEvent) => {
      if (!bridgeNonce.current || event.source !== iframeRef.current?.contentWindow || event.data?.type !== "hb-auto-index-controls" || event.data?.nonce !== bridgeNonce.current || event.data.action !== "ready" || bridgePort.current || event.ports.length !== 1) return
      const port = event.ports[0]!
      bridgePort.current = port
      port.onmessage = ({ data }: MessageEvent) => {
        if (port !== bridgePort.current || data?.type !== "hb-auto-index-controls" || data.nonce !== bridgeNonce.current || data.action !== "profile" || !isAutoIndexControlProfile(data.profile)) return
        setDiscovered({ identity, profile: data.profile })
        setFrameReady(true)
        setUnavailableReason(undefined)
      }
      port.start()
      try {
        port.postMessage({ type: "hb-auto-index-controls-command", nonce: bridgeNonce.current, action: "connect" })
      } catch {
        port.close()
        bridgePort.current = null
        setUnavailableReason("Extra controls are unavailable for this preview. Reload the preview to try again.")
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [enabled, identity, isAutoIndex, iframeRef])

  const sendCommand = useCallback((action: string, data: Record<string, unknown> = {}) => {
    bridgePort.current?.postMessage({ type: "hb-auto-index-controls-command", nonce: bridgeNonce.current, action, ...data })
  }, [])

  useEffect(() => {
    if (!enabled || !isAutoIndex) return
    return () => {
      sendCommand("dispose")
      bridgePort.current?.close()
      bridgePort.current = null
    }
  }, [enabled, identity, isAutoIndex, sendCommand])

  const onFrameLoad = useCallback(() => {
    if (!enabled || !isAutoIndex || !previewDocument || iframeRef.current?.srcdoc !== previewDocument) return
    if (loadedPreviewDocument.current !== previewDocument) {
      loadedPreviewDocument.current = previewDocument
      return
    }
    bridgePort.current?.close()
    bridgePort.current = null
    bridgeNonce.current = ""
    setFrameReady(false)
    setDiscovered(null)
    setUnavailableReason("The preview navigated. Reopen it to use component controls.")
  }, [enabled, iframeRef, isAutoIndex, previewDocument])

  useEffect(() => { if (frameReady) sendCommand("update", { state }) }, [frameReady, sendCommand, state])
  useEffect(() => {
    const target = profile?.targets.some((item) => item.id === selectedTarget) ? selectedTarget : "component"
    if (frameReady) sendCommand("select", { target })
  }, [selectedTarget, profile, frameReady, sendCommand])

  useEffect(() => {
    const frame = enabled && isAutoIndex ? iframeRef.current : null
    if (!frame || state.targets.component?.removeBackground !== true) return
    const originalColorScheme = frame.style.colorScheme
    const originalBackground = frame.style.backgroundColor
    const colorScheme = state.targets.component.theme === "dark" || state.targets.component.theme === "light"
      ? state.targets.component.theme
      : "normal"
    frame.style.colorScheme = colorScheme
    frame.style.backgroundColor = "transparent"
    return () => {
      if (frame.style.colorScheme === colorScheme) frame.style.colorScheme = originalColorScheme
      if (frame.style.backgroundColor === "transparent") frame.style.backgroundColor = originalBackground
    }
  }, [enabled, iframeRef, isAutoIndex, state.targets.component?.removeBackground, state.targets.component?.theme])

  const onChange = useCallback((key: string, value: any) => {
    setSession((current) => ({ identity, values: { ...(current.identity === identity ? current.values : {}), [key]: value } }))
  }, [identity])

  const updateTarget = useCallback((target: string, key: AutoIndexControlKey, value?: string | number | boolean) => {
    setSession((current) => {
      const values = current.identity === identity ? current.values : {}
      const prior: AutoIndexControlState = values.__hbControls ?? emptyState
      const overrides = { ...prior.targets[target] }
      if (value === undefined) delete overrides[key]
      else overrides[key] = value
      const targets = { ...prior.targets }
      if (Object.keys(overrides).length) targets[target] = overrides
      else delete targets[target]
      const next = { ...values }
      if (Object.keys(targets).length) next.__hbControls = { version: 1, targets }
      else delete next.__hbControls
      return { identity, values: next }
    })
  }, [identity])

  const onReset = useCallback(() => setSession({ identity, values: {} }), [identity])
  const onResetControl = useCallback((key: string) => {
    setSession((current) => {
      const values = { ...(current.identity === identity ? current.values : {}) }
      delete values[key]
      return { identity, values }
    })
  }, [identity])

  const autoControls: AutoIndexPanelControls | undefined = profile ? {
    profile,
    state,
    selectedTarget,
    onSelect: setSelectedTarget,
    onChange: updateTarget,
    onResetControl: (target, key) => updateTarget(target, key),
    onReplay: () => sendCommand("replay"),
    previewSize,
    onPreviewSizeChange: setPreviewSize,
  } : undefined

  return {
    controls,
    activeControls,
    authoredValues,
    onChange,
    onReset,
    onResetControl,
    onFrameLoad,
    onTargetChange: updateTarget,
    autoControls,
    unavailableReason,
    isAutoIndex,
    useInjectedPreviewDocument: isAutoIndex && (!enabled || bundleFetchFailedIdentity !== identity),
    previewDocument,
    hasControls: controls.length > 0 || Boolean(profile?.targets.length) || Boolean(unavailableReason),
    previewStyle: { width: previewSize === "mobile" ? "375px" : previewSize === "tablet" ? "768px" : "100%", maxWidth: "100%", marginInline: "auto" },
  }
}
