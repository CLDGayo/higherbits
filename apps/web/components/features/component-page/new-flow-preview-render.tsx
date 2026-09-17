import { Demo } from "@/types/global"
import { useTheme } from "next-themes"
import { FullScreenButton } from "../../ui/full-screen-button"
import { LoadingSpinner } from "../../ui/loading-spinner"
import React, { useState, useRef, useMemo, useEffect, useCallback } from "react"
import {
  extractControlsSettings,
  getDefaultControlValues,
  useResolvedDemoCode,
} from "@/lib/controls-parser"
import { FloatingControlsDrawer } from "../controls/floating-controls-drawer"
import { cn } from "@/lib/utils"

export function NewFlowPreviewRender({ demo }: { demo: Demo }) {
  const { resolvedTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [isControlsExpanded, setIsControlsExpanded] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const rawCode = useResolvedDemoCode(
    demo.demo_code,
    (demo as any).component?.code,
    {
      bundleUrl: (demo as any).bundle_html_url || (demo as any).bundle_url?.html,
      demoSlug: demo.demo_slug,
      demoId: demo.id,
    },
  )
  const controls = useMemo(() => {
    return extractControlsSettings(rawCode)
  }, [rawCode])

  const [activeControls, setActiveControls] = useState<Record<string, any>>(() =>
    getDefaultControlValues(controls),
  )

  // Reset or update active controls when demo changes
  useEffect(() => {
    setActiveControls(getDefaultControlValues(controls))
  }, [controls])

  const sendThemeToIframe = useCallback(() => {
    if (iframeRef.current?.contentWindow && resolvedTheme) {
      iframeRef.current.contentWindow.postMessage(
        { type: "theme-change", theme: resolvedTheme },
        "*",
      )
    }
  }, [resolvedTheme])

  const sendControlsToIframe = useCallback(() => {
    if (
      iframeRef.current?.contentWindow &&
      Object.keys(activeControls).length > 0
    ) {
      iframeRef.current.contentWindow.postMessage(
        { type: "controls-change", controls: activeControls },
        "*",
      )
    }
  }, [activeControls])

  useEffect(() => {
    sendThemeToIframe()
  }, [sendThemeToIframe])

  useEffect(() => {
    sendControlsToIframe()
  }, [sendControlsToIframe])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "preview-ready" || event.data?.type === "READY") {
        sendThemeToIframe()
        sendControlsToIframe()
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [sendThemeToIframe, sendControlsToIframe])

  return (
    <div className="relative flex h-full min-h-0 w-full group">
      <div
        className={cn(
          "relative flex min-h-0 flex-1 h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-background transition-[margin-right] duration-300 ease-[cubic-bezier(.32,.72,0,1)]",
          controls.length > 0 && isControlsExpanded ? "mr-[264px]" : "mr-0"
        )}
      >
        <FullScreenButton
          className={
            controls.length > 0 && !isControlsExpanded ? "right-14" : "right-4"
          }
        />
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center h-full gap-3 bg-background/80">
            <LoadingSpinner />
            <p className="text-muted-foreground text-sm">Loading preview...</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={`${demo.bundle_html_url}?theme=${resolvedTheme}`}
          className="w-full h-full border-0"
          onLoad={() => {
            setIsLoading(false)
            sendThemeToIframe()
            sendControlsToIframe()
          }}
          onError={() => setIsLoading(false)}
        />
      </div>
      {controls.length > 0 && (
        <FloatingControlsDrawer
          controls={controls}
          values={activeControls}
          onChange={(key, value) => {
            setActiveControls((prev) => ({ ...prev, [key]: value }))
          }}
          onReset={() => {
            setActiveControls(getDefaultControlValues(controls))
          }}
          isExpanded={isControlsExpanded}
          onExpandedChange={setIsControlsExpanded}
        />
      )}
    </div>
  )
}
