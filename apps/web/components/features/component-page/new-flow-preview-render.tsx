import { Demo } from "@/types/global"
import { useTheme } from "next-themes"
import { motion } from "motion/react"
import { FullScreenButton } from "../../ui/full-screen-button"
import { LoadingSpinner } from "../../ui/loading-spinner"
import React, { useState, useRef, useMemo, useEffect, useCallback } from "react"
import {
  extractControlsSettings,
  getDefaultControlValues,
} from "@/lib/controls-parser"
import { FloatingControlsDrawer } from "../controls/floating-controls-drawer"

export function NewFlowPreviewRender({ demo }: { demo: Demo }) {
  const { resolvedTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const controls = useMemo(() => {
    return extractControlsSettings(demo.demo_code || "")
  }, [demo.demo_code])

  const [activeControls, setActiveControls] = useState<Record<string, any>>(() =>
    getDefaultControlValues(controls),
  )

  // Reset or update active controls when demo changes
  useEffect(() => {
    setActiveControls(getDefaultControlValues(controls))
  }, [controls])

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
    sendControlsToIframe()
  }, [sendControlsToIframe])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "preview-ready") {
        sendControlsToIframe()
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [sendControlsToIframe])

  return (
    <motion.div className="relative flex-grow h-full rounded-lg overflow-hidden">
      <FullScreenButton />
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center h-full gap-3 bg-background/80">
          <LoadingSpinner />
          <p className="text-muted-foreground text-sm">Loading preview...</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={`${demo.bundle_html_url}?theme=${resolvedTheme}`}
        className="w-full h-full"
        onLoad={() => {
          setIsLoading(false)
          sendControlsToIframe()
        }}
        onError={() => setIsLoading(false)}
      />
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
        />
      )}
    </motion.div>
  )
}
