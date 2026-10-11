"use client"

import { useEffect, useId, useRef, useState, type FocusEvent, type PointerEvent } from "react"
import { RotateCcw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { loadGoogleFont, POPULAR_GOOGLE_FONT_FAMILIES, preloadGoogleFontCatalog } from "@/lib/google-fonts"
import { AUTO_INDEX_ANIMATION_PRESETS, normalizeAnimationDurationSeconds } from "@/lib/auto-index-controls-runtime"
import type { AutoIndexPanelControls } from "@/hooks/use-auto-index-controls"
import type { AutoIndexControlDefinition } from "@/lib/auto-index-controls-runtime"
import type { ControlSetting } from "@/lib/controls-parser"

const fieldClass = "min-h-11 min-w-0 w-full rounded-lg border border-border bg-muted/50 px-2.5 text-base sm:text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
const labelClass = "text-xs font-medium text-muted-foreground"
const units = ["px", "%", "rem", "em", "vw", "vh"]
const lineHeightUnits = ["", "px", "%", "em", "rem", "vh", "vw"]
const letterSpacingUnits = ["px", "%", "em", "rem", "vh", "vw"]
const lineHeightPresets = [
  { label: "Normal", value: "normal" },
  { label: "Tight (1)", value: "1" },
  { label: "Snug (1.15)", value: "1.15" },
  { label: "Relaxed (1.5)", value: "1.5" },
  { label: "Loose (1.75)", value: "1.75" },
  { label: "Extra loose (2)", value: "2" },
]
const letterSpacingPresets = [
  { label: "Normal", value: "normal" },
  { label: "Tighter", value: "-0.05em" },
  { label: "Tight", value: "-0.025em" },
  { label: "Wide", value: "0.025em" },
  { label: "Wider", value: "0.05em" },
  { label: "Widest", value: "0.1em" },
]

function LengthField({ label, value, onChange, units: unitList = units }: { label: string; value: string; onChange: (value: string) => void; units?: string[] }) {
  const defaultUnit = unitList[0] ?? "px"
  const length = new RegExp(`^(-?(?:\\d+\\.?\\d*|\\.\\d+))(${unitList.filter(Boolean).join("|")})?$`).exec(value)
  return (
    <div className="flex gap-1">
      <input aria-label={label} className={fieldClass} type={length ? "number" : "text"} step="any" value={length?.[1] ?? value}
        onChange={(event) => onChange(length && event.target.value ? `${event.target.value}${length[2] || defaultUnit}` : event.target.value)} />
      {length && <select aria-label={`${label} unit`} className={`${fieldClass} !w-16 shrink-0`} value={length[2] || defaultUnit}
        onChange={(event) => onChange(`${length[1]}${event.target.value}`)}>
        {unitList.map((unit) => <option key={unit || "unitless"} value={unit}>{unit || "unitless"}</option>)}
      </select>}
    </div>
  )
}

function PresetLengthField({ label, value, onChange, presets, units: unitList, customDefault }: {
  label: string
  value: string
  onChange: (value: string) => void
  presets: { label: string; value: string }[]
  units: string[]
  customDefault: string
}) {
  const isPreset = presets.some((preset) => preset.value === value)
  return (
    <div className="space-y-1.5">
      <select className={fieldClass} aria-label={`${label} preset`} value={isPreset ? value : "custom"}
        onChange={(event) => onChange(event.target.value === "custom" ? customDefault : event.target.value)}>
        {presets.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
        <option value="custom">Custom</option>
      </select>
      {!isPreset && <LengthField label={label} value={value} onChange={onChange} units={unitList} />}
    </div>
  )
}

function SpacingField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [linked, setLinked] = useState(true)
  const parts = value.match(/(?:[^\s()]+\([^)]*\)|\S+)/g) ?? ["0px"]
  const sides = [parts[0], parts[1] ?? parts[0], parts[2] ?? parts[0], parts[3] ?? parts[1] ?? parts[0]] as string[]
  return <div className="space-y-1.5">
    <button type="button" aria-pressed={linked} aria-label={`Link ${label.toLowerCase()} sides`} className="min-h-11 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
      onClick={() => { setLinked(!linked); if (!linked) onChange(sides[0]!) }}>
      {linked ? "Linked sides · Unlink" : "Independent sides · Link"}
    </button>
    {linked ? <LengthField label={label} value={value} onChange={onChange} /> : <div className="grid grid-cols-2 gap-2">
      {["Top", "Right", "Bottom", "Left"].map((side, index) => <label key={side} className={`${labelClass} space-y-1`}>
        <span>{side}</span><LengthField label={`${label} ${side.toLowerCase()}`} value={sides[index]!} onChange={(next) => {
          const updated = [...sides]; updated[index] = next; onChange(updated.join(" "))
        }} />
      </label>)}
    </div>}
  </div>
}

function DimensionField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const mode = value === "auto" ? "auto" : label === "Width" && value === "100%" ? "fill" : "custom"
  return <div className="space-y-1.5">
    <select className={fieldClass} aria-label={`${label} mode`} value={mode} onChange={(event) => onChange(event.target.value === "auto" ? "auto" : event.target.value === "fill" ? "100%" : "320px")}>
      <option value="auto">Auto</option>{label === "Width" && <option value="fill">Fill</option>}<option value="custom">Custom</option>
    </select>
    {mode === "custom" && <LengthField label={label} value={value} onChange={onChange} />}
  </div>
}

function fontFamilyValue(family: string) {
  return (POPULAR_GOOGLE_FONT_FAMILIES as readonly string[]).includes(family) ? `"${family}", sans-serif` : family
}

function FontFamilySample({ family, label }: { family: string; label: string }) {
  return <span className="block truncate" style={{ fontFamily: fontFamilyValue(family) }}>{label}</span>
}

function FontFamilyField({ control, value, onChange }: { control: AutoIndexControlDefinition; value: string | number | boolean; onChange: (value: string | number | boolean) => void }) {
  const family = String(value)
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const prepareFonts = () => {
    setLoading(true)
    setError(false)
    return preloadGoogleFontCatalog(document).then((failed) => {
      setReady(true)
      setError(failed.length > 0)
    }).catch(() => setError(true)).finally(() => setLoading(false))
  }
  const handleOpenChange = (next: boolean) => {
    if (!next) { setOpen(false); return }
    if (ready) { setOpen(true); return }
    void prepareFonts().finally(() => setOpen(true))
  }
  return <div className="space-y-1.5">
    <Select open={open} onOpenChange={handleOpenChange} value={family} onValueChange={onChange}>
      <SelectTrigger className={fieldClass} aria-label={control.label} aria-busy={loading || undefined} onFocus={() => { if (!ready) void prepareFonts() }} onMouseEnter={() => { if (!ready) void prepareFonts() }} style={{ fontFamily: fontFamilyValue(family) }}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="[&_[data-radix-select-viewport]]:!h-auto [&_[data-radix-select-viewport]]:max-h-[min(24rem,var(--radix-select-content-available-height))] [&_[data-radix-select-viewport]]:overflow-y-auto">
        {control.options?.map((option) => <SelectItem key={option.value} value={option.value} className="min-h-10 py-2 text-base"
          onFocus={() => loadGoogleFont(document, option.value)} onMouseEnter={() => loadGoogleFont(document, option.value)}>
          <FontFamilySample family={option.value} label={option.label} />
        </SelectItem>)}
      </SelectContent>
    </Select>
    {loading && <p role="status" className="text-[11px] text-muted-foreground">Preparing font previews…</p>}
    {error && <p role="status" className="text-[11px] text-destructive">Some font previews could not load; system fonts remain available.</p>}
  </div>
}

function durationSeconds(value: string | number | boolean) {
  return normalizeAnimationDurationSeconds(value)?.slice(0, -1) ?? "1"
}

function AnimationDurationField({ value, onChange }: { value: string | number | boolean; onChange: (value: string | number | boolean) => void }) {
  const [draft, setDraft] = useState(() => durationSeconds(value))
  useEffect(() => setDraft(durationSeconds(value)), [value])
  return <div className="flex items-center gap-2">
    <input aria-label="Animation duration" className={fieldClass} type="number" min="0" step="any" value={draft} onChange={(event) => {
      const next = event.target.value
      setDraft(next)
      if (next === "") return
      const seconds = normalizeAnimationDurationSeconds(next)
      if (seconds) onChange(seconds)
    }} />
    <span className="shrink-0 text-xs text-muted-foreground">seconds</span>
  </div>
}

function AnimationField({ control, value, onChange }: { control: AutoIndexControlDefinition; value: string | number | boolean; onChange: (value: string | number | boolean) => void }) {
  const animation = useRef<Animation | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => {
      setReducedMotion(preference.matches)
      if (preference.matches) { animation.current?.cancel(); animation.current = null }
    }
    update()
    preference.addEventListener("change", update)
    return () => { preference.removeEventListener("change", update); animation.current?.cancel() }
  }, [])
  const stopPreview = () => { animation.current?.cancel(); animation.current = null }
  const preview = (event: PointerEvent<HTMLDivElement> | FocusEvent<HTMLDivElement>, preset: string) => {
    stopPreview()
    if (reducedMotion || preset === "original") return
    const label = event.currentTarget.querySelector<HTMLElement>("[data-animation-option-label]")
    const definition = AUTO_INDEX_ANIMATION_PRESETS.find((item) => item.value === preset)
    if (label && definition) animation.current = label.animate(definition.keyframes, { duration: 650, easing: "ease-out", fill: "both" })
  }
  return <Select value={String(value)} onValueChange={onChange}>
    <SelectTrigger className={fieldClass} aria-label={control.label}><SelectValue /></SelectTrigger>
    <SelectContent className="[&_[data-radix-select-viewport]]:!h-auto [&_[data-radix-select-viewport]]:max-h-[min(24rem,var(--radix-select-content-available-height))] [&_[data-radix-select-viewport]]:overflow-y-auto">
      {control.options?.map((option) => <SelectItem key={option.value} value={option.value} className="min-h-11 py-2 text-sm"
        onPointerEnter={(event) => preview(event, option.value)} onPointerLeave={stopPreview}
        onFocus={(event) => preview(event, option.value)} onBlur={stopPreview}>
        <span data-animation-option-label>{option.label}</span>
      </SelectItem>)}
    </SelectContent>
  </Select>
}

function ControlField({ control, value, onChange }: { control: AutoIndexControlDefinition; value: string | number | boolean; onChange: (value: string | number | boolean) => void }) {
  if (control.key === "margin" || control.key === "padding") return <SpacingField label={control.label} value={String(value)} onChange={onChange} />
  if (control.key === "width" || control.key === "height") return <DimensionField label={control.label} value={String(value)} onChange={onChange} />
  if (control.key === "aspectRatio") return <div className="space-y-1.5">
    <label className="flex min-h-11 items-center justify-between gap-2 text-xs"><span>Lock aspect ratio</span>
      <Switch aria-label="Lock aspect ratio" checked={value !== "auto"} onCheckedChange={(checked) => onChange(checked ? (control.defaultValue !== "auto" ? control.defaultValue : "1 / 1") : "auto")} />
    </label>
    {value !== "auto" && <input className={fieldClass} aria-label={control.label} value={String(value)} onChange={(event) => onChange(event.target.value)} />}
  </div>
  if (control.type === "boolean") return <div className="flex min-h-11 items-center justify-end"><Switch aria-label={control.label} checked={Boolean(value)} onCheckedChange={onChange} /></div>
  if (control.key === "fontFamily" && control.type === "select") return <FontFamilyField control={control} value={value} onChange={onChange} />
  if (control.key === "animationPreset" && control.type === "select") return <AnimationField control={control} value={value} onChange={onChange} />
  if (control.key === "animationDuration") return <AnimationDurationField value={value} onChange={onChange} />
  if (control.type === "select") return <select className={fieldClass} aria-label={control.label} value={String(value)} onChange={(event) => onChange(event.target.value)}>
    {control.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select>
  if (control.key === "text") return <textarea className={`${fieldClass} min-h-20 py-2`} aria-label={control.label} value={String(value)} onChange={(event) => onChange(event.target.value)} />
  if (control.type === "color") return <div className="flex items-center gap-2">
    <input className={fieldClass} aria-label={control.label} value={String(value)} onChange={(event) => onChange(event.target.value)} />
    <input className="h-11 w-11 shrink-0 cursor-pointer rounded border border-border bg-transparent focus-visible:ring-2 focus-visible:ring-primary" type="color" aria-label={`${control.label} picker`} value={/^#[\da-f]{6}$/i.test(String(value)) ? String(value) : "#000000"} onChange={(event) => onChange(event.target.value)} />
  </div>
  if (control.type === "number") return <input className={fieldClass} aria-label={control.label} type="number" min={control.min} max={control.max} step={control.step ?? "any"} value={Number(value)} onChange={(event) => {
    if (event.target.value === "") return
    const next = Number(event.target.value)
    if (Number.isFinite(next)) onChange(Math.min(control.max ?? Infinity, Math.max(control.min ?? -Infinity, next)))
  }} />
  if (control.key === "lineHeight") return <PresetLengthField label={control.label} value={String(value)} onChange={onChange} presets={lineHeightPresets} units={lineHeightUnits} customDefault="1.4" />
  if (control.key === "letterSpacing") return <PresetLengthField label={control.label} value={String(value)} onChange={onChange} presets={letterSpacingPresets} units={letterSpacingUnits} customDefault="0px" />
  if (["fontSize", "borderWidth", "borderRadius"].includes(control.key)) return <LengthField label={control.label} value={String(value)} onChange={onChange} />
  return <input className={fieldClass} aria-label={control.label} value={String(value)} onChange={(event) => onChange(event.target.value)} />
}

function normalizedKey(value: string) { return value.toLowerCase().replace(/[^a-z]/g, "").replace("fontcolor", "color").replace("fontstyle", "fontfamily").replace(/^dark$/, "theme") }

export function AutoIndexControls({ controls, authoredControls = [] }: { controls: AutoIndexPanelControls; authoredControls?: ControlSetting[] }) {
  const id = useId()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const target = controls.profile.targets.find((item) => item.id === controls.selectedTarget) ?? controls.profile.targets[0]
  if (!target) return null
  const overrides = controls.state.targets[target.id] ?? {}
  const authoredKeys = new Set(authoredControls.flatMap((control) => [normalizedKey(control.key), normalizedKey(control.label)]))
  const definitions = target.controls.filter((control) => {
    if (target.kind === "component" && authoredKeys.has(normalizedKey(control.key))) return false
    if (overrides.removeBackground && control.key === "backgroundColor") return false
    return true
  })
  const groups = [
    ["motion", "Motion"], ["recommended", "Recommended"], ["content", "Content"], ["appearance", "Appearance"], ["layout", "Layout"], ["advanced", "Advanced"],
  ] as const

  return <div className="space-y-3" data-testid="auto-index-controls">
    <div className="space-y-1.5">
      <label htmlFor={`${id}-target`} className={labelClass}>Edit part</label>
      <select id={`${id}-target`} className={fieldClass} value={target.id} onChange={(event) => controls.onSelect(event.target.value)}>
        {controls.profile.targets.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </div>
    <div className="space-y-1.5">
      <label htmlFor={`${id}-viewport`} className={labelClass}>Preview width</label>
      <select id={`${id}-viewport`} className={fieldClass} value={controls.previewSize} onChange={(event) => controls.onPreviewSizeChange(event.target.value as AutoIndexPanelControls["previewSize"])}>
        <option value="desktop">Desktop · Full width</option><option value="tablet">Tablet · 768px</option><option value="mobile">Mobile · 375px</option>
      </select>
      <p className="text-[11px] text-muted-foreground">Preview only. Component sizing is below.</p>
    </div>
    {groups.map(([group, label]) => {
      const items = definitions.filter((control) => group === "recommended" ? control.recommended : !control.recommended && control.group === group)
      if (!items.length) return null
      const sectionKey = `${target.id}:${group}`
      const initiallyOpen = group === "recommended" || group === "content" || group === "layout" || group === "motion"
      return <details key={`${target.id}-${group}`} open={openSections[sectionKey] ?? initiallyOpen} onToggle={(event) => {
        const isOpen = event.currentTarget.open
        setOpenSections((current) => current[sectionKey] === isOpen ? current : { ...current, [sectionKey]: isOpen })
      }} className="group/section border-t border-border/50 pt-1">
        <summary className="min-h-11 cursor-pointer content-center rounded text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{label}</summary>
        <div className="space-y-3 pb-2">
          {items.map((control) => {
            const changed = Object.prototype.hasOwnProperty.call(overrides, control.key)
            return <div key={control.key} className="space-y-1">
              <div className="flex min-h-6 items-center justify-between gap-1">
                <span className={labelClass}>{control.label}{changed && <span className="ml-1 text-primary" aria-label="Changed">· Changed</span>}</span>
                {changed && <button type="button" className="flex size-11 shrink-0 items-center justify-center rounded hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Reset ${control.label}`} onClick={() => controls.onResetControl(target.id, control.key)}><RotateCcw className="size-3.5" /></button>}
              </div>
              {control.description && <p className="text-[11px] leading-relaxed text-muted-foreground">{control.description}</p>}
              <ControlField control={control} value={overrides[control.key] ?? control.defaultValue} onChange={(value) => controls.onChange(target.id, control.key, value)} />
            </div>
          })}
          {items.some((control) => control.key === "motionPaused") && <button type="button" className={`${fieldClass} hover:bg-muted`} onClick={controls.onReplay}>Replay animation</button>}
        </div>
      </details>
    })}
  </div>
}
