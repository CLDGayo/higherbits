"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import type { ArtifactBodyProps } from "../../editor-shell"
import type { ShaderPayload, ShaderUniform } from "../../registry"
import type { ValidationResult } from "../../shader-harness"
import { SHADER_PRESETS } from "./shader-presets"

/**
 * The Shaders editor body (Phase 10c, §10c.3).
 *
 * Controlled, per the shell's contract: it edits `payload` through `setPayload`
 * and never touches the server, the slug, publishing or visibility.
 *
 * `validation` comes down from the editor rather than being computed here,
 * because the preview is what actually compiles - reporting a second, separate
 * compile would let the panel and the canvas disagree.
 */
export function ShaderEditorBody({
  payload,
  setPayload,
  validation,
}: ArtifactBodyProps<ShaderPayload> & { validation: ValidationResult | null }) {
  const [newName, setNewName] = useState("")

  const patch = (next: Partial<ShaderPayload>) =>
    setPayload((prev) => ({ ...prev, ...next }))

  const setUniform = (index: number, next: Partial<ShaderUniform>) =>
    setPayload((prev) => ({
      ...prev,
      uniforms: prev.uniforms.map((u, i) => (i === index ? { ...u, ...next } : u)),
    }))

  const removeUniform = (index: number) =>
    setPayload((prev) => ({
      ...prev,
      uniforms: prev.uniforms.filter((_, i) => i !== index),
    }))

  const addUniform = (type: ShaderUniform["type"]) => {
    const name = newName.trim()
    if (!name) return
    setPayload((prev) => ({
      ...prev,
      uniforms: [
        ...prev.uniforms,
        type === "color"
          ? { name, label: name, type: "color", value: "#8b5cf6" }
          : { name, label: name, type: "float", value: 1, min: 0, max: 4 },
      ],
    }))
    setNewName("")
  }

  // Mirrors the schema so the field can refuse a name before a save does. The
  // schema stays the authority; this is the earlier, kinder copy of it.
  const nameError = (() => {
    const name = newName.trim()
    if (!name) return null
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,23}$/.test(name)) {
      return "Letters, digits and underscore; must start with a letter"
    }
    if (name.startsWith("u_")) return "u_ is reserved for the harness"
    if (payload.uniforms.some((u) => u.name === name)) return "Already declared"
    return null
  })()

  const atLimit = payload.uniforms.length >= 8

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="shader-body">Shader</Label>
          <div className="flex flex-wrap gap-1.5">
            {SHADER_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPayload(preset.payload)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          The body of <code>vec3 shade(vec2 uv, float t)</code>. Return a colour.
          <code className="ml-1">uv</code> is 0–1 across the canvas with y up,
          <code className="ml-1">t</code> is seconds. Helpers:{" "}
          <code>hash</code>, <code>noise</code>, <code>fbm</code>,{" "}
          <code>rotate</code>, <code>palette</code>.
        </p>

        <textarea
          id="shader-body"
          value={payload.body}
          onChange={(e) => patch({ body: e.target.value })}
          spellCheck={false}
          rows={14}
          className={cn(
            "w-full resize-y rounded-lg border bg-background p-3 font-mono text-xs leading-relaxed",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            validation && !validation.ok ? "border-destructive" : "border-border",
          )}
        />

        {validation && !validation.ok && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3"
          >
            <p className="text-xs font-medium text-destructive">
              {validation.line
                ? `Line ${validation.line} of your shader`
                : "This shader does not compile"}
            </p>
            <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-[11px] text-destructive/90">
              {validation.log}
            </pre>
            <p className="mt-2 text-[11px] text-muted-foreground">
              The preview is still showing your last working version.
            </p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <Label>Uniforms</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {payload.uniforms.length} / 8
          </span>
        </div>

        {payload.uniforms.length === 0 && (
          <p className="text-xs text-muted-foreground">
            None declared. A shader can be pure maths.
          </p>
        )}

        {payload.uniforms.map((uniform, index) => (
          <div
            key={`${uniform.name}-${index}`}
            className="flex flex-col gap-2 rounded-lg border border-border p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <code className="truncate font-mono text-xs">{uniform.name}</code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${uniform.name}`}
                onClick={() => removeUniform(index)}
              >
                <Trash2 size={14} />
              </Button>
            </div>

            <Input
              value={uniform.label}
              aria-label={`${uniform.name} label`}
              onChange={(e) => setUniform(index, { label: e.target.value })}
              className="h-8 text-xs"
            />

            {uniform.type === "color" ? (
              <input
                type="color"
                aria-label={`${uniform.name} colour`}
                value={String(uniform.value)}
                onChange={(e) => setUniform(index, { value: e.target.value })}
                className="h-8 w-full cursor-pointer rounded border border-border bg-background"
              />
            ) : (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  aria-label={`${uniform.name} value`}
                  value={Number(uniform.value) || 0}
                  min={uniform.min ?? 0}
                  max={uniform.max ?? 4}
                  step={0.01}
                  onChange={(e) =>
                    setUniform(index, { value: Number(e.target.value) })
                  }
                  className="flex-1"
                />
                <span className="w-12 text-right font-mono text-xs tabular-nums">
                  {(Number(uniform.value) || 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        ))}

        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="newUniform"
              aria-label="New uniform name"
              disabled={atLimit}
              className="h-8 font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={atLimit || !newName.trim() || !!nameError}
              onClick={() => addUniform("float")}
            >
              <Plus size={14} /> Float
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={atLimit || !newName.trim() || !!nameError}
              onClick={() => addUniform("color")}
            >
              <Plus size={14} /> Colour
            </Button>
          </div>
          {nameError && (
            <p className="text-xs text-destructive">{nameError}</p>
          )}
          {atLimit && (
            <p className="text-xs text-muted-foreground">
              Eight is the limit. Fold two controls into one expression instead.
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <Label>Motion</Label>
        <div className="flex items-center gap-2">
          <input
            id="shader-animate"
            type="checkbox"
            checked={payload.motion.animate}
            onChange={(e) =>
              patch({ motion: { ...payload.motion, animate: e.target.checked } })
            }
          />
          <Label htmlFor="shader-animate">Animate</Label>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            aria-label="Speed"
            value={payload.motion.speed}
            min={0}
            max={4}
            step={0.1}
            disabled={!payload.motion.animate}
            onChange={(e) =>
              patch({
                motion: { ...payload.motion, speed: Number(e.target.value) },
              })
            }
            className="flex-1"
          />
          <span className="w-12 text-right font-mono text-xs tabular-nums">
            {payload.motion.speed.toFixed(1)}
          </span>
        </div>
        {!payload.motion.animate && (
          <p className="text-xs text-muted-foreground">
            Off means <code>t</code> never advances and nothing redraws.
          </p>
        )}
      </section>
    </div>
  )
}
