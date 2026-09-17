"use client"

import React, { useMemo } from "react"
import { ChevronsRight, RotateCcw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { ControlSetting } from "@/lib/controls-parser"
import { cn } from "@/lib/utils"

export interface ControlsPanelProps {
  controls: ControlSetting[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
  onReset: () => void
  onClose?: () => void
  title?: string
  className?: string
  showCloseButton?: boolean
}

export function ControlsPanel({
  controls,
  values,
  onChange,
  onReset,
  onClose,
  title = "Controls",
  className,
  showCloseButton = false,
}: ControlsPanelProps) {
  // Sort controls: non-booleans first, booleans grouped at the bottom matching reference design
  const sortedControls = useMemo(() => {
    const nonBooleans = controls.filter((c) => c.type !== "boolean")
    const booleans = controls.filter((c) => c.type === "boolean")
    return [...nonBooleans, ...booleans]
  }, [controls])

  if (controls.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-zinc-950 text-zinc-100 rounded-lg p-4 font-sans select-none border border-white/10 shadow-2xl",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 shrink-0">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-100">
          {title}
        </h3>
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Collapse controls"
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-white/5 transition-colors"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Control Rows */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
        {sortedControls.map((control) => {
          const val = values[control.key] ?? control.defaultValue

          return (
            <div
              key={control.key}
              className="flex items-center w-full rounded-md bg-zinc-900/90 border border-white/5 overflow-hidden text-xs h-9"
            >
              {/* Left Label */}
              <div
                className="w-28 px-3 py-2 text-zinc-400 bg-zinc-800/40 border-r border-white/5 font-medium shrink-0 select-none truncate"
                title={control.label}
              >
                {control.label}
              </div>

              {/* Right Control Value / Input */}
              <div className="flex-1 h-full flex items-center px-3 min-w-0">
                {control.type === "color" && (
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="font-mono text-zinc-200 text-xs uppercase tracking-wider truncate">
                      {val}
                    </span>
                    <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                      <span
                        className="w-4 h-4 rounded-[3px] border border-white/20 shadow-sm block"
                        style={{ backgroundColor: val }}
                      />
                      <input
                        type="color"
                        value={val || "#ffffff"}
                        onChange={(e) => onChange(control.key, e.target.value)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                )}

                {control.type === "number" && (
                  <input
                    type="number"
                    step={control.step || 1}
                    value={val !== undefined && val !== null ? val : ""}
                    onChange={(e) => {
                      const numVal =
                        e.target.value === "" ? "" : Number(e.target.value)
                      onChange(control.key, numVal)
                    }}
                    className="w-full bg-transparent text-right font-mono text-zinc-200 text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}

                {control.type === "string" && (
                  <input
                    type="text"
                    value={val ?? ""}
                    onChange={(e) => onChange(control.key, e.target.value)}
                    className="w-full bg-transparent text-left text-zinc-200 text-xs focus:outline-none truncate"
                  />
                )}

                {control.type === "boolean" && (
                  <div className="flex items-center justify-end w-full">
                    <Switch
                      checked={Boolean(val)}
                      onCheckedChange={(checked) =>
                        onChange(control.key, checked)
                      }
                      className="data-[state=checked]:bg-blue-600 scale-90"
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Reset Button */}
      <div className="pt-3 border-t border-white/5 mt-3 shrink-0">
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2 px-3 rounded-md border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset all</span>
        </button>
      </div>
    </div>
  )
}
