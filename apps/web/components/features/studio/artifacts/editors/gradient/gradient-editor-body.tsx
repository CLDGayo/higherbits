"use client"

import { useEffect, useState } from "react"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { getArtifactAction, listArtifactsAction } from "@/lib/api/artifacts"
import { cn } from "@/lib/utils"

import type { ArtifactBodyProps } from "../../editor-shell"
import { GRADIENT_FORM_SUPPORT } from "../../gradient-form-props"
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
/**
 * Mirrors `gradientColourStop.name.max(40)` in the registry schema. Enforced
 * here, at both places a name is authored, because the bound used to surface
 * only at save time as a raw zod path - `stops.0.name: String must contain at
 * most 40 character(s)` - which names a schema field rather than a control
 * (P11-D7).
 */
const STOP_NAME_MAX = 40

/** The form the payload currently selects, and what it actually supports. */
function useFormContext(payload: GradientPayload) {
  const support = GRADIENT_FORM_SUPPORT[payload.formId]
  const label =
    GRADIENT_FORMS.find((form) => form.id === payload.formId)?.label ??
    payload.formId
  return { support, label }
}

/**
 * Marks a control the resolver will silently drop for the selected form.
 * Seven of these shipped enabled and inert (P11-D4); the truth now comes from
 * `GRADIENT_FORM_SUPPORT` rather than from a hand-maintained comment.
 */
function InertNote({ formLabel }: { formLabel: string }) {
  return (
    <p className="text-[10px] leading-tight text-muted-foreground/70">
      Not used by {formLabel}
    </p>
  )
}

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
  const { support, label } = useFormContext(payload)

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

      <div
        className={cn("space-y-2", !support.supports.distortion && "opacity-50")}
      >
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
          disabled={!support.supports.distortion}
          onChange={(event) =>
            setPayload((prev) => ({
              ...prev,
              geometry: {
                ...prev.geometry,
                distortion: Number(event.target.value),
              },
            }))
          }
          className="w-full disabled:cursor-not-allowed"
        />
        {!support.supports.distortion && <InertNote formLabel={label} />}
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
  const { support, label } = useFormContext(payload)
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
          // `cssTokenKey` has no length bound, `gradientColourStop.name` caps
          // at 40, so an unclamped token key seeds a payload the server will
          // reject on save (P11-D7).
          name: name.replace(/^--/, "").slice(0, STOP_NAME_MAX),
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

  // Capped by what the selected form can actually render as well as by the
  // schema, so the panel cannot offer a stop that will never reach a uniform
  // (P11-D3). Existing stops are never removed on a form switch - they come
  // back when the user switches to a form with more room - they are just
  // marked as unused below.
  const renderableStops = Math.min(MAX_STOPS, support.maxColors)

  const addStop = () => {
    if (payload.stops.length >= renderableStops) return
    setPayload((prev) => ({
      ...prev,
      stops: [
        ...prev.stops,
        {
          name: `Colour ${prev.stops.length + 1}`.slice(0, STOP_NAME_MAX),
          hex: "#ffffff",
        },
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

      <div
        className={cn("space-y-2", !support.supports.baseColour && "opacity-50")}
      >
        <Label htmlFor="gradient-base-colour" className="text-xs text-muted-foreground">
          Base colour
        </Label>
        <div className="flex items-center gap-2">
          <input
            id="gradient-base-colour"
            type="color"
            value={payload.baseColour}
            disabled={!support.supports.baseColour}
            onChange={(event) =>
              setPayload((prev) => ({ ...prev, baseColour: event.target.value }))
            }
            className="h-8 w-10 rounded border border-border bg-transparent p-0 disabled:cursor-not-allowed"
          />
          <span className="font-mono text-xs text-muted-foreground">
            {payload.baseColour}
          </span>
        </div>
        {/* Still used for the WCAG contrast ratings below even when it does
            not reach a uniform, so it is dimmed rather than hidden. */}
        {!support.supports.baseColour && <InertNote formLabel={label} />}
      </div>

      <div className="space-y-2">
        {payload.stops.map((stop, index) => {
          const rating = wcagRating(contrastRatio(stop.hex, payload.baseColour))
          // Beyond the selected form's `maxColorCount`. Kept in the payload
          // and shown, because switching form brings it back - but it does
          // not reach a uniform right now, so say so (P11-D3).
          const unusedHere = index >= support.maxColors
          return (
            <div
              key={index}
              className={cn("flex items-center gap-2", unusedHere && "opacity-50")}
            >
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
                maxLength={STOP_NAME_MAX}
                onChange={(event) =>
                  updateStop(index, {
                    name: event.target.value.slice(0, STOP_NAME_MAX),
                  })
                }
                className="w-24 rounded-md border border-border bg-background px-2 py-1 text-xs"
              />
              <span className="font-mono text-[10px] text-muted-foreground">
                {stop.hex}
              </span>
              <span
                className={cn(
                  "ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium",
                  unusedHere
                    ? "bg-muted text-muted-foreground"
                    : rating === "Fail"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {unusedHere ? "Unused" : rating}
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

      <div className="space-y-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addStop}
          disabled={payload.stops.length >= renderableStops}
        >
          Add colour
        </Button>
        {payload.stops.length >= renderableStops && (
          <p className="text-[10px] leading-tight text-muted-foreground/70">
            {label} renders{" "}
            {support.maxColors === 1
              ? "one colour"
              : `up to ${support.maxColors} colours`}
          </p>
        )}
      </div>

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
  const { support, label } = useFormContext(payload)
  const setSurface = (patch: Partial<GradientPayload["surface"]>) =>
    set("surface", { ...payload.surface, ...patch })

  return (
    <div className="space-y-2">
      <Label>Surface</Label>
      <div className={cn("space-y-2", !support.supports.blur && "opacity-50")}>
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
          disabled={!support.supports.blur}
          onChange={(event) => setSurface({ blur: Number(event.target.value) })}
          className="w-full disabled:cursor-not-allowed"
        />
        {!support.supports.blur && <InertNote formLabel={label} />}
      </div>
      <div className={cn("space-y-2", !support.supports.grain && "opacity-50")}>
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
          disabled={!support.supports.grain}
          onChange={(event) => setSurface({ grain: Number(event.target.value) })}
          className="w-full disabled:cursor-not-allowed"
        />
        {!support.supports.grain && <InertNote formLabel={label} />}
      </div>
      <div
        className={cn("space-y-2", !support.supports.edgeShade && "opacity-50")}
      >
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
          disabled={!support.supports.edgeShade}
          onChange={(event) => setSurface({ edgeShade: Number(event.target.value) })}
          className="w-full disabled:cursor-not-allowed"
        />
        {!support.supports.edgeShade && <InertNote formLabel={label} />}
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
  const { support, label } = useFormContext(payload)

  return (
    <div className={cn("space-y-1", !support.supports.animate && "opacity-50")}>
      <div className="flex items-center justify-between">
        <Label htmlFor="gradient-animate">Animate</Label>
        <input
          id="gradient-animate"
          type="checkbox"
          checked={payload.motion.animate}
          disabled={!support.supports.animate}
          onChange={(event) => set("motion", { animate: event.target.checked })}
          className="disabled:cursor-not-allowed"
        />
      </div>
      {/* Two of the four shipped forms have no `u_time` at all (P11-D5). */}
      {!support.supports.animate && (
        <p className="text-[10px] leading-tight text-muted-foreground/70">
          {label} does not animate
        </p>
      )}
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
