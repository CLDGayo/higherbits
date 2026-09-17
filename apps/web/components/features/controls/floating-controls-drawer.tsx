"use client"

import React, { useState } from "react"
import { Sliders } from "lucide-react"
import { ControlSetting } from "@/lib/controls-parser"
import { ControlsPanel } from "./controls-panel"
import { cn } from "@/lib/utils"

export interface FloatingControlsDrawerProps {
  controls: ControlSetting[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
  onReset: () => void
  className?: string
  defaultExpanded?: boolean
}

export function FloatingControlsDrawer({
  controls,
  values,
  onChange,
  onReset,
  className,
  defaultExpanded = true,
}: FloatingControlsDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (controls.length === 0) return null

  return (
    <div className={cn("pointer-events-none", className)}>
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="pointer-events-auto absolute right-4 top-4 z-30 bg-zinc-950/90 hover:bg-zinc-900 border border-white/15 backdrop-blur-md text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 transition-all"
        >
          <Sliders className="w-3.5 h-3.5 text-zinc-400" />
          <span>Controls</span>
        </button>
      ) : (
        <div className="pointer-events-auto absolute right-4 top-4 bottom-4 z-30 w-72 max-w-[calc(100%-2rem)] flex flex-col">
          <ControlsPanel
            controls={controls}
            values={values}
            onChange={onChange}
            onReset={onReset}
            onClose={() => setIsExpanded(false)}
            showCloseButton={true}
            className="h-full max-h-full"
          />
        </div>
      )}
    </div>
  )
}
