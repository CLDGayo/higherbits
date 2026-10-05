"use client"

import { getCopySource } from "@/lib/copy-client"
import { isReviewOnlyCopy, withCopyNotice } from "@/lib/copy-notice"

import { useState, useEffect } from "react"
import { useSandpack } from "@codesandbox/sandpack-react"
import { toast } from "sonner"
import { CheckIcon, Clipboard } from "lucide-react"
import { trackEvent, AMPLITUDE_EVENTS } from "../../lib/amplitude"
import { useSupabaseAnalytics } from "@/hooks/use-analytics"
import { AnalyticsActivityType } from "@/types/global"
import { isMac } from "@/lib/utils"

export const CopyCodeButton = ({
  component_id,
  demo_id,
  user_id,
  exportableFiles,
}: {
  component_id: number
  demo_id?: number
  user_id?: string
  exportableFiles: string[]
}) => {
  const [codeCopied, setCodeCopied] = useState(false)
  const [hasSelection, setHasSelection] = useState(false)
  const { sandpack } = useSandpack()
  const { capture } = useSupabaseAnalytics()

  const copyCode = async (source: "button" | "shortcut") => {
    const activeFile = sandpack.activeFile
    const fileContent = sandpack.files[activeFile]?.code
    const knownFile = exportableFiles.some(file => file.replace(/^\//, "") === activeFile.replace(/^\//, ""))
    if (!knownFile || typeof fileContent !== "string") {
      toast.error("This preview file is not available for export.")
      return
    }
    if (!navigator.clipboard?.writeText) {
      toast.error("Clipboard access is unavailable.")
      return
    }
    {
      try {
        const { notice } = await getCopySource({ componentId: component_id, demoId: demo_id })
        // Admission authorizes this component closure; copy the captured visible tab,
        // including local preview transforms (the explicit preview-source ceiling).
        const content = withCopyNotice(fileContent, notice, activeFile)
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(content)
        }
        setCodeCopied(true)
        toast(isReviewOnlyCopy(activeFile) ? "Review text copied with attribution" : "Code copied with attribution")
        trackEvent(AMPLITUDE_EVENTS.COPY_CODE, {
          fileName: activeFile,
          fileExtension: activeFile.split(".").pop(),
          copySource: source,
        })
        capture(component_id, AnalyticsActivityType.COMPONENT_CODE_COPY, user_id)
        setTimeout(() => setCodeCopied(false), 2000)
      } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to copy code") }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.keyCode === 67) {
        const commandMenu = document.querySelector("[cmdk-root]")
        if (commandMenu) return

        const selectedText = window.getSelection()?.toString()
        if (!selectedText) {
          e.preventDefault()
          copyCode("shortcut")
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [sandpack, component_id, demo_id, exportableFiles])

  useEffect(() => {
    const handleSelectionChange = () => {
      const selectedText = window.getSelection()?.toString()
      setHasSelection(!!selectedText)
    }

    document.addEventListener("selectionchange", handleSelectionChange)
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange)
  }, [])

  return (
    <button
      onClick={() => copyCode("button")}
      className="absolute flex items-center gap-1 top-12 right-2 md:right-4 z-10 p-1 px-2 bg-background text-foreground border border-border rounded-md hover:bg-accent transition-colors md:flex h-8"
    >
      {codeCopied ? (
        <>
          <CheckIcon size={14} className="text-green-500" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Clipboard size={14} className="text-muted-foreground/70" />
          {isReviewOnlyCopy(sandpack.activeFile) ? "Copy with attribution (review text)" : "Copy Code"}{" "}
          <kbd
            className={`hidden md:inline-flex h-5 max-h-full items-center rounded border border-border px-1 ml-1 -mr-1 font-[inherit] text-[0.625rem] font-medium ${
              hasSelection
                ? "text-muted-foreground/40"
                : "text-muted-foreground/70"
            }`}
          >
            {isMac ? "⌘C" : "Ctrl+C"}
          </kbd>
        </>
      )}
    </button>
  )
}
