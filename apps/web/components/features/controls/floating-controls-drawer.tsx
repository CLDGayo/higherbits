"use client"

import React, { useState } from "react"
import { Sliders } from "lucide-react"
import { ControlSetting } from "@/lib/controls-parser"
import { ControlsPanel } from "./controls-panel"
import { cn } from "@/lib/utils"
import type { AutoIndexPanelControls } from "@/hooks/use-auto-index-controls"

export interface FloatingControlsDrawerProps {
  controls: ControlSetting[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
  onReset: () => void
  onResetControl?: (key: string) => void
  autoControls?: AutoIndexPanelControls
  unavailableReason?: string
  className?: string
  defaultExpanded?: boolean
  isExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
}

export function FloatingControlsDrawer({
  controls,
  values,
  onChange,
  onReset,
  onResetControl,
  autoControls,
  unavailableReason,
  className,
  defaultExpanded = true,
  isExpanded: controlledExpanded,
  onExpandedChange,
}: FloatingControlsDrawerProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isExpanded =
    controlledExpanded !== undefined ? controlledExpanded : internalExpanded

  const handleSetExpanded = (next: boolean) => {
    if (controlledExpanded === undefined) {
      setInternalExpanded(next)
    }
    onExpandedChange?.(next)
  }

  if (controls.length === 0 && !autoControls && !unavailableReason) return null

  return (
    <div
      className={cn(
        "absolute z-30 overflow-hidden text-foreground transition-all duration-300 ease-[cubic-bezier(.32,.72,0,1)] motion-reduce:transition-none",
        isExpanded
          ? "right-3 top-3 bottom-3 w-72 max-w-[calc(100%-1.5rem)] flex flex-col rounded-xl border border-border/60 bg-background/90 backdrop-blur-xl shadow-2xl"
          : "right-3 top-3 size-11 rounded-full bg-background/90 backdrop-blur-md shadow-xl border border-border flex items-center justify-center p-0",
        className,
      )}
    >
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => handleSetExpanded(true)}
          aria-label="Show controls"
          className="w-full h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sliders className="w-4 h-4" />
        </button>
      ) : (
        <ControlsPanel
          controls={controls}
          values={values}
          onChange={onChange}
          onReset={onReset}
          onResetControl={onResetControl}
          autoControls={autoControls}
          unavailableReason={unavailableReason}
          onClose={() => handleSetExpanded(false)}
          showCloseButton={true}
          className="h-full max-h-full border-0 rounded-none bg-transparent shadow-none"
        />
      )}
    </div>
  )
}

