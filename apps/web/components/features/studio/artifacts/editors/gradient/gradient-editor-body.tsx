"use client"

import { useEffect, useState } from "react"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { getArtifactAction, listArtifactsAction } from "@/lib/api/artifacts"
import { cn } from "@/lib/utils"

import type { ArtifactBodyProps } from "../../editor-shell"
import { GRADIENT_FORMS, type GradientPayload } from "../../registry"
import { contrastRatio, wcagRating } from "./gradient-color"
import {
  downloadBlob,
  exportGradientPng,
  GRADIENT_EXPORT_HEIGHT,
  GRADIENT_EXPORT_WIDTH,
} from "./gradient-export"
import { resetGeometry, shuffleStops } from "./gradient-randomizers"

/**
 * The Gradient editor body (Phase 10b, §10b.4). Four panels - Form, Palette,
 * Surface, Motion - per the body contract (G10a.12): a controlled component
 * that receives `payload` / `setPayload`, never talks to the server for the
 * artifact itself, and never knows about slugs, publishing or visibility.
 *
 * `getArtifactAction` / `listArtifactsAction` below are the one exception,
 * used only for "Start from a theme" (§10b.6) reading a *different*
 * artifact than the one this body edits - not a violation of the contract,
 * which is about this artifact's own chrome.
 *
 * No Library panel, no Community tab - ruled out at §7.0b decisions 2 and 3.
 */

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/
const MAX_STOPS = 8

export function GradientEditorBody({
  payload,
  setPayload,
}: ArtifactBodyProps<GradientPayload>) {
  const set = <K extends keyof GradientPayload>(
    key: K,
    value: GradientPayload[K],
  ) => setPayload((prev) => ({ ...prev, [key]: value }))

  return (
    <>
      <FormPanel payload={payload} setPayload={setPayload} />
      <PalettePanel payload={payload} setPayload={setPayload} />
      <SurfacePanel payload={payload} set={set} />
      <MotionPanel payload={payload} set={set} />
      <ExportSection payload={payload} />
    </>
  )
}

function FormPanel({ payload, setPayload }: ArtifactBodyProps<GradientPayload>) {
  return (
    <div className="space-y-3">
      <Label>Form</Label>
      <div className="grid grid-cols-2 gap-2">
        {GRADIENT_FORMS.map((form) => (
          <button
            key={form.id}
            type="button"
            onClick={() => setPayload((prev) => ({ ...prev, formId: form.id }))}
            className={cn(
              "rounded-md border px-2 py-2 text-left text-xs transition-colors",
              payload.formId === form.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="block font-medium">{form.label}</span>
            <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
              {form.family}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="gradient-scale">
          Scale — {payload.geometry.scale.toFixed(2)}
        </Label>
        <input
          id="gradient-scale"
          type="range"
          min={0.1}
          max={4}
          step={0.05}
          value={payload.geometry.scale}
          onChange={(event) =>
            setPayload((prev) => ({
              ...prev,
              geometry: { ...prev.geometry, scale: Number(event.target.value) },
            }))
          }
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gradient-distortion">
          Distortion — {payload.geometry.distortion.toFixed(2)}
        </Label>
        <input
          id="gradient-distortion"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={payload.geometry.distortion}
          onChange={(event) =>
            setPayload((prev) => ({
              ...prev,
              geometry: {
                ...prev.geometry,
                distortion: Number(event.target.value),
              },
            }))
          }
          className="w-full"
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setPayload(shuffleStops)}
        >
          Rearrange
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setPayload(resetGeometry)}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}

function PalettePanel({ payload, setPayload }: ArtifactBodyProps<GradientPayload>) {
  const [themes, setThemes] = useState<{ id: string; name: string }[]>([])
  const [isSeeding, setIsSeeding] = useState(false)

  useEffect(() => {
    let cancelled = false
    listArtifactsAction({ kind: "theme" })
      .then((rows) => {
        if (!cancelled) setThemes(rows.map((row) => ({ id: row.id, name: row.name })))
      })
      .catch(() => {
        if (!cancelled) setThemes([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const startFromTheme = async (themeId: string) => {
    if (!themeId) return
    setIsSeeding(true)
    try {
      // Ownership-scoped for free: `listArtifactsAction` above already
      // filtered to the signed-in user's own themes, so every id offered in
      // the picker already belongs to them (§10b.6).
      const full = await getArtifactAction({ id: themeId })
      const theme = (full.payload ?? {}) as { light?: Record<string, string> }
      const tokens = theme.light ?? {}
      const hexTokens = Object.entries(tokens).filter(([, value]) =>
        HEX_PATTERN.test(value),
      )

      if (hexTokens.length === 0) {
        toast.error("That theme has no hex colours to seed from")
        return
      }

      const background = tokens["--background"]
      setPayload((prev) => ({
        ...prev,
        stops: hexTokens.slice(0, MAX_STOPS).map(([name, hex]) => ({
          name: name.replace(/^--/, ""),
          hex,
        })),
        baseColour:
          background && HEX_PATTERN.test(background) ? background : prev.baseColour,
      }))
      toast.success("Palette seeded from theme")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that theme")
    } finally {
      setIsSeeding(false)
    }
  }

  const addStop = () => {
    if (payload.stops.length >= MAX_STOPS) return
    setPayload((prev) => ({
      ...prev,
      stops: [
        ...prev.stops,
        { name: `Colour ${prev.stops.length + 1}`, hex: "#ffffff" },
      ],
    }))
  }

  const removeStop = (index: number) => {
    if (payload.stops.length <= 1) return
    setPayload((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }))
  }

  const updateStop = (
    index: number,
    patch: Partial<{ name: string; hex: string }>,
  ) => {
    setPayload((prev) => ({
      ...prev,
      stops: prev.stops.map((stop, i) => (i === index ? { ...stop, ...patch } : stop)),
    }))
  }

  return (
    <div className="space-y-3">
      <Label>Palette</Label>

      <div className="space-y-2">
        <Label htmlFor="gradient-base-colour" className="text-xs text-muted-foreground">
          Base colour
        </Label>
        <div className="flex items-center gap-2">
          <input
            id="gradient-base-colour"
            type="color"
            value={payload.baseColour}
            onChange={(event) =>
              setPayload((prev) => ({ ...prev, baseColour: event.target.value }))
            }
            className="h-8 w-10 rounded border border-border bg-transparent p-0"
          />
          <span className="font-mono text-xs text-muted-foreground">
            {payload.baseColour}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {payload.stops.map((stop, index) => {
          const rating = wcagRating(contrastRatio(stop.hex, payload.baseColour))
          return (
            <div key={index} className="flex items-center gap-2">
              <input
                type="color"
                value={stop.hex}
                aria-label={`${stop.name} colour`}
                onChange={(event) => updateStop(index, { hex: event.target.value })}
                className="h-8 w-8 shrink-0 rounded border border-border bg-transparent p-0"
              />
              <input
                type="text"
                value={stop.name}
                aria-label={`${stop.name} label`}
                onChange={(event) => updateStop(index, { name: event.target.value })}
                className="w-24 rounded-md border border-border bg-background px-2 py-1 text-xs"
              />
              <span className="font-mono text-[10px] text-muted-foreground">
                {stop.hex}
              </span>
              <span
                className={cn(
                  "ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium",
                  rating === "Fail"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {rating}
              </span>
              <button
                type="button"
                onClick={() => removeStop(index)}
                disabled={payload.stops.length <= 1}
                className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                aria-label={`Remove ${stop.name}`}
              >
                <X size={12} />
              </button>
            </div>
          )
        })}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={addStop}
        disabled={payload.stops.length >= MAX_STOPS}
      >
        Add colour
      </Button>

      <div className="space-y-1 border-t border-border pt-2">
        <Label
          htmlFor="gradient-start-from-theme"
          className="text-xs text-muted-foreground"
        >
          Start from a theme
        </Label>
        <select
          id="gradient-start-from-theme"
          defaultValue=""
          disabled={isSeeding || themes.length === 0}
          onChange={(event) => {
            const value = event.target.value
            event.target.value = ""
            void startFromTheme(value)
          }}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="" disabled>
            {themes.length === 0 ? "No themes yet" : "Pick a theme…"}
          </option>
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function SurfacePanel({
  payload,
  set,
}: {
  payload: GradientPayload
  set: <K extends keyof GradientPayload>(key: K, value: GradientPayload[K]) => void
}) {
  const setSurface = (patch: Partial<GradientPayload["surface"]>) =>
    set("surface", { ...payload.surface, ...patch })

  return (
    <div className="space-y-2">
      <Label>Surface</Label>
      <div className="space-y-2">
        <Label htmlFor="gradient-blur" className="text-xs text-muted-foreground">
          Blur — {payload.surface.blur}px
        </Label>
        <input
          id="gradient-blur"
          type="range"
          min={0}
          max={64}
          step={1}
          value={payload.surface.blur}
          onChange={(event) => setSurface({ blur: Number(event.target.value) })}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="gradient-grain" className="text-xs text-muted-foreground">
          Grain — {payload.surface.grain}%
        </Label>
        <input
          id="gradient-grain"
          type="range"
          min={0}
          max={100}
          step={1}
          value={payload.surface.grain}
          onChange={(event) => setSurface({ grain: Number(event.target.value) })}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="gradient-edge-shade" className="text-xs text-muted-foreground">
          Edge shade — {payload.surface.edgeShade}%
        </Label>
        <input
          id="gradient-edge-shade"
          type="range"
          min={0}
          max={100}
          step={1}
          value={payload.surface.edgeShade}
          onChange={(event) => setSurface({ edgeShade: Number(event.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  )
}

function MotionPanel({
  payload,
  set,
}: {
  payload: GradientPayload
  set: <K extends keyof GradientPayload>(key: K, value: GradientPayload[K]) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="gradient-animate">Animate</Label>
      <input
        id="gradient-animate"
        type="checkbox"
        checked={payload.motion.animate}
        onChange={(event) => set("motion", { animate: event.target.checked })}
      />
    </div>
  )
}

function ExportSection({ payload }: { payload: GradientPayload }) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const blob = await exportGradientPng(payload)
      downloadBlob(
        blob,
        `gradient-${GRADIENT_EXPORT_WIDTH}x${GRADIENT_EXPORT_HEIGHT}.png`,
      )
      toast.success("Gradient exported")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="border-t border-border pt-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
        className="gap-1.5"
      >
        {isExporting && <Loader2 size={14} className="animate-spin" />}
        Export PNG ({GRADIENT_EXPORT_WIDTH}×{GRADIENT_EXPORT_HEIGHT})
      </Button>
    </div>
  )
}
