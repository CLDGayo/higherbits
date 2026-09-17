"use client"

import React, { useMemo, useState, useRef, useCallback } from "react"
import { ChevronsRight, RotateCcw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { ControlSetting, inferNumberRange } from "@/lib/controls-parser"
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

interface NumberScrubberRowProps {
  control: ControlSetting
  value: any
  onChange: (key: string, value: number) => void
}

function NumberScrubberRow({ control, value, onChange }: NumberScrubberRowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const { min, max, step } = useMemo(() => {
    return inferNumberRange(
      control.key,
      control.defaultValue,
      control.min,
      control.max,
      control.step,
    )
  }, [control])

  const currentVal =
    typeof value === "number" && !isNaN(value)
      ? value
      : control.defaultValue ?? 0

  // Calculate percentage fill relative to min/max
  const clampedVal = Math.min(Math.max(currentVal, min), max)
  const range = max - min || 1
  const percent = Math.max(0, Math.min(100, ((clampedVal - min) / range) * 100))

  const precision = useMemo(() => {
    if (step < 1) {
      const parts = step.toString().split(".")
      return parts[1]?.length ?? 2
    }
    return 0
  }, [step])

  const updateFromPointer = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const raw = min + ratio * (max - min)
      const stepped = Math.round(raw / step) * step
      const clean = Number(stepped.toFixed(precision))
      onChange(control.key, clean)
    },
    [min, max, step, precision, control.key, onChange],
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    updateFromPointer(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      updateFromPointer(e.clientX)
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {}
      setIsDragging(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return
    const multiplier = e.shiftKey ? 10 : 1
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault()
      const next = Math.max(min, currentVal - step * multiplier)
      onChange(control.key, Number(next.toFixed(precision)))
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault()
      const next = Math.min(max, currentVal + step * multiplier)
      onChange(control.key, Number(next.toFixed(precision)))
    }
  }

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const num = Number(e.target.value)
    if (!isNaN(num)) {
      const clean = Number(num.toFixed(precision))
      onChange(control.key, clean)
    }
    setIsEditing(false)
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={() => setIsEditing(true)}
      tabIndex={0}
      role="slider"
      aria-valuenow={currentVal}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={control.label}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative flex items-center justify-between w-full h-8 px-2.5 rounded-lg bg-muted/50 hover:bg-muted/70 border border-border/40 overflow-hidden text-xs select-none cursor-ew-resize group focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors",
        isDragging && "ring-1 ring-primary/40",
      )}
    >
      {/* Fill Progress Bar (Image 2 style scroll / scrub bar) */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 bg-foreground/[0.08] pointer-events-none",
          isDragging
            ? "transition-none"
            : "transition-[width] duration-75 ease-out",
        )}
        style={{ width: `${percent}%` }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 flex items-center justify-between w-full h-full pointer-events-none">
        <span className="text-muted-foreground font-medium text-xs truncate mr-2 select-none">
          {control.label}
        </span>

        {isEditing ? (
          <input
            type="number"
            step={step}
            defaultValue={currentVal}
            onBlur={handleInputBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleInputBlur(e as any)
              if (e.key === "Escape") setIsEditing(false)
            }}
            className="pointer-events-auto w-16 bg-background text-right font-mono text-foreground text-xs px-1 py-0.5 rounded border border-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            autoFocus
          />
        ) : (
          <span className="font-mono text-foreground text-xs shrink-0 select-none">
            {currentVal}
          </span>
        )}
      </div>
    </div>
  )
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
        "flex flex-col bg-background text-foreground rounded-xl p-3 font-sans select-none border border-border shadow-xl",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/50 mb-2 shrink-0 px-1">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Collapse controls"
            className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Control Rows */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
        {sortedControls.map((control) => {
          const val = values[control.key] ?? control.defaultValue

          if (control.type === "number") {
            return (
              <NumberScrubberRow
                key={control.key}
                control={control}
                value={val}
                onChange={onChange}
              />
            )
          }

          if (control.type === "color") {
            return (
              <div
                key={control.key}
                className="flex items-center justify-between w-full h-8 px-2.5 rounded-lg bg-muted/50 border border-border/40 text-xs select-none"
              >
                <span className="text-muted-foreground font-medium truncate mr-2">
                  {control.label}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-foreground uppercase text-xs tracking-wider">
                    {val}
                  </span>
                  <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                    <span
                      className="w-4 h-4 rounded-[4px] border border-border shadow-sm block"
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
              </div>
            )
          }

          if (control.type === "string") {
            return (
              <div
                key={control.key}
                className="flex items-center justify-between w-full h-8 px-2.5 rounded-lg bg-muted/50 border border-border/40 text-xs"
              >
                <span className="text-muted-foreground font-medium truncate mr-3 shrink-0 select-none">
                  {control.label}
                </span>
                <input
                  type="text"
                  value={val ?? ""}
                  onChange={(e) => onChange(control.key, e.target.value)}
                  className="bg-transparent text-right text-foreground text-xs focus:outline-none flex-1 truncate min-w-0 font-medium"
                />
              </div>
            )
          }

          if (control.type === "boolean") {
            return (
              <div
                key={control.key}
                className="flex items-center justify-between w-full h-8 px-2.5 rounded-lg bg-muted/50 border border-border/40 text-xs select-none"
              >
                <span className="text-muted-foreground font-medium truncate mr-2">
                  {control.label}
                </span>
                <div className="flex items-center justify-end">
                  <Switch
                    checked={Boolean(val)}
                    onCheckedChange={(checked) =>
                      onChange(control.key, checked)
                    }
                    className="data-[state=checked]:bg-primary scale-90"
                  />
                </div>
              </div>
            )
          }

          return null
        })}
      </div>

      {/* Reset Button */}
      <div className="pt-2 border-t border-border/50 mt-2 shrink-0">
        <button
          type="button"
          onClick={onReset}
          className="w-full py-1.5 px-3 rounded-md border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset all</span>
        </button>
      </div>
    </div>
  )
}
