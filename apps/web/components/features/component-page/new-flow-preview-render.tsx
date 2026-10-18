import { Demo, Tag } from "@/types/global"
import { useTheme } from "next-themes"
import { FullScreenButton } from "../../ui/full-screen-button"
import { LoadingSpinner } from "../../ui/loading-spinner"
import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  useResolvedDemoCode,
} from "@/lib/controls-parser"
import { useAutoIndexControls } from "@/hooks/use-auto-index-controls"
import { FloatingControlsDrawer } from "../controls/floating-controls-drawer"
import { cn } from "@/lib/utils"

export function NewFlowPreviewRender({ demo, componentTags = [] }: { demo: Demo; componentTags?: Tag[] }) {
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
  const bundleUrl = (demo as any).bundle_html_url || (demo as any).bundle_url?.html
  const editor = useAutoIndexControls({ demoId: demo.id, bundleUrl, rawCode, iframeRef, tags: [...((demo as any).tags ?? []), ...componentTags] })
  const { controls, activeControls, hasControls } = editor

  const sendThemeToIframe = useCallback(() => {
    if (editor.isAutoIndex) return
    if (iframeRef.current?.contentWindow && resolvedTheme) {
      iframeRef.current.contentWindow.postMessage(
        { type: "theme-change", theme: resolvedTheme },
        "*",
      )
    }
  }, [resolvedTheme, editor.isAutoIndex])

  const sendControlsToIframe = useCallback(() => {
    if (
      iframeRef.current?.contentWindow &&
      Object.keys(activeControls).length > 0
    ) {
      iframeRef.current.contentWindow.postMessage(
        { type: "controls-change", controls: editor.authoredValues },
        "*",
      )
    }
  }, [editor.authoredValues])

  const centerPreviewContent = useCallback(() => {
    try {
      const previewDocument = iframeRef.current?.contentDocument
      if (
        !previewDocument?.head ||
        previewDocument.getElementById("higherbits-preview-centering")
      ) {
        return
      }

      const style = previewDocument.createElement("style")
      style.id = "higherbits-preview-centering"
      style.textContent = `
        html, body, #root, #__next { width: 100%; height: 100%; min-height: 100%; margin: 0; }
        #root, #__next { display: flex !important; align-items: safe center !important; justify-content: safe center !important; }
        #root > div, #__next > div { display: flex !important; align-items: safe center !important; justify-content: safe center !important; min-height: 100%; }
      `
      previewDocument.head.appendChild(style)
    } catch {
      // Cross-origin bundle iframes cannot be adjusted by the parent page.
    }
  }, [])

  useEffect(() => {
    sendThemeToIframe()
  }, [sendThemeToIframe])

  useEffect(() => {
    sendControlsToIframe()
  }, [sendControlsToIframe])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return
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
      <div className={cn(
        "relative flex min-h-0 flex-1 h-full flex-col overflow-hidden rounded-xl border border-border/50 transition-colors duration-300",
        resolvedTheme === "dark" ? "bg-zinc-950" : "bg-background"
      )}>
        <FullScreenButton
          className={cn(
            "transition-all duration-300",
            hasControls && isControlsExpanded
              ? "right-[304px]"
              : hasControls
              ? "right-14"
              : "right-4",
          )}
        />
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center h-full gap-3 bg-background/80">
            <LoadingSpinner />
            <p className="text-muted-foreground text-sm">Loading preview...</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          sandbox={editor.isAutoIndex ? "allow-scripts" : undefined}
          src={editor.useInjectedPreviewDocument ? undefined : `${bundleUrl}?theme=${resolvedTheme}`}
          srcDoc={editor.isAutoIndex ? editor.previewDocument ?? undefined : undefined}
          title="Component preview"
          style={editor.previewStyle}
          className="w-full h-full border-0"
          onLoad={() => {
            setIsLoading(false)
            editor.onFrameLoad()
            if (!editor.isAutoIndex) centerPreviewContent()
            sendThemeToIframe()
            sendControlsToIframe()
          }}
          onError={() => setIsLoading(false)}
        />
      </div>
      {hasControls && (
        <FloatingControlsDrawer
          controls={controls}
          values={activeControls}
          onChange={editor.onChange}
          onReset={editor.onReset}
          onResetControl={editor.onResetControl}
          autoControls={editor.autoControls}
          unavailableReason={editor.unavailableReason}
          isExpanded={isControlsExpanded}
          onExpandedChange={setIsControlsExpanded}
        />
      )}
    </div>
  )
}
