"use client"

import { useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import type { ArtifactBodyProps } from "../../editor-shell"
import {
  ASCII_BACKGROUND_MODES,
  ASCII_BLEND_MODES,
  ASCII_CHARSETS,
  ASCII_STYLES,
  type AsciiPayload,
} from "../../registry"

/**
 * The ASCII art editor body (Phase 10a, §10a.5).
 *
 * Ships the reference's **Style** panel only. `Adjust`, `Effects`, `Motion`,
 * `Mask` and `Lights` were cut at entry research: the capture has one
 * screenshot of each and no behavioural evidence, and guessing five panels is
 * how a phase turns into three. The cut is recorded in the phase plan rather
 * than left implicit here.
 *
 * Six of the reference's 25 styles ship, chosen to be visually distinct and all
 * expressible as pure character mapping so no style needs a bespoke render path.
 */

const ACCEPT = "image/png,image/jpeg,image/webp"

/** Matches the route's allowlist; the server re-checks by magic bytes. */
const CLIENT_ALLOWED = ["image/png", "image/jpeg", "image/webp"]

const CHARSET_LABELS: Record<(typeof ASCII_CHARSETS)[number], string> = {
  style: "From style",
  binary: "Binary",
  hex: "Hex",
  alpha: "Alphanumeric",
}

const BACKGROUND_LABELS: Record<(typeof ASCII_BACKGROUND_MODES)[number], string> = {
  "solid-black": "Solid black",
  "solid-white": "Solid white",
  transparent: "Transparent",
}

const readAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Could not read that file"))
    reader.onload = () => {
      const result = String(reader.result ?? "")
      // strip the `data:image/png;base64,` prefix the API does not want
      resolve(result.slice(result.indexOf(",") + 1))
    }
    reader.readAsDataURL(file)
  })

export function AsciiEditorBody({
  payload,
  setPayload,
  artifactId,
}: ArtifactBodyProps<AsciiPayload> & { artifactId: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const upload = async (file: File) => {
    // A client-side type check is a courtesy, not a control: the route sniffs
    // magic bytes and does not trust anything sent with the request.
    if (!CLIENT_ALLOWED.includes(file.type)) {
      toast.error("Pick a PNG, JPEG or WebP")
      return
    }

    setIsUploading(true)
    try {
      const encodedContent = await readAsBase64(file)
      const response = await fetch("/api/studio/ascii/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artifactId,
          contentType: file.type,
          encodedContent,
        }),
      })

      const result = (await response.json()) as { key?: string; error?: string }
      if (!response.ok || !result.key) {
        toast.error(result.error ?? "Upload failed")
        return
      }

      // The server's key, never a locally guessed one.
      setPayload((prev) => ({ ...prev, sourceKey: result.key }))
      toast.success("Photo uploaded")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const set = <K extends keyof AsciiPayload>(key: K, value: AsciiPayload[K]) =>
    setPayload((prev) => ({ ...prev, [key]: value }))

  return (
    <>
      <div className="space-y-2">
        <Label>Source</Label>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
            // Reset so re-picking the same file fires change again.
            event.target.value = ""
          }}
        />
        <Button
          variant="outline"
          className="w-full"
          disabled={isUploading}
          onClick={() => fileRef.current?.click()}
        >
          {isUploading && <Loader2 size={16} className="mr-1.5 animate-spin" />}
          {payload.sourceKey ? "Replace photo" : "Upload a photo"}
        </Button>
        {!payload.sourceKey && (
          <p className="text-xs text-muted-foreground">
            PNG, JPEG or WebP, up to 10MB
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Style</Label>
        <div className="grid grid-cols-3 gap-2">
          {ASCII_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => set("styleId", style.id)}
              className={cn(
                "rounded-md border px-2 py-2 text-xs transition-colors",
                payload.styleId === style.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="block truncate font-mono text-[10px] leading-none">
                {style.ramp.trim().slice(0, 6)}
              </span>
              <span className="mt-1 block truncate">{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ascii-cell-size">Cell size — {payload.cellSize}px</Label>
        <input
          id="ascii-cell-size"
          type="range"
          min={4}
          max={64}
          step={1}
          value={payload.cellSize}
          onChange={(event) => set("cellSize", Number(event.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ascii-coverage">Coverage — {payload.coverage}%</Label>
        <input
          id="ascii-coverage"
          type="range"
          min={1}
          max={100}
          step={1}
          value={payload.coverage}
          onChange={(event) => set("coverage", Number(event.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="ascii-invert">Invert</Label>
        <input
          id="ascii-invert"
          type="checkbox"
          checked={payload.invert}
          onChange={(event) => set("invert", event.target.checked)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ascii-charset">Character set</Label>
        <select
          id="ascii-charset"
          value={payload.charset}
          onChange={(event) =>
            set("charset", event.target.value as AsciiPayload["charset"])
          }
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          {ASCII_CHARSETS.map((value) => (
            <option key={value} value={value}>
              {CHARSET_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ascii-blend">Blend mode</Label>
        <select
          id="ascii-blend"
          value={payload.blendMode}
          onChange={(event) =>
            set("blendMode", event.target.value as AsciiPayload["blendMode"])
          }
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          {ASCII_BLEND_MODES.map((value) => (
            <option key={value} value={value} className="capitalize">
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ascii-background">Background</Label>
        <select
          id="ascii-background"
          value={payload.background.mode}
          onChange={(event) =>
            set("background", {
              ...payload.background,
              mode: event.target.value as AsciiPayload["background"]["mode"],
            })
          }
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          {ASCII_BACKGROUND_MODES.map((value) => (
            <option key={value} value={value}>
              {BACKGROUND_LABELS[value]}
            </option>
          ))}
        </select>
        <Label htmlFor="ascii-bg-opacity" className="text-xs text-muted-foreground">
          Opacity — {payload.background.opacity}%
        </Label>
        <input
          id="ascii-bg-opacity"
          type="range"
          min={0}
          max={100}
          step={1}
          value={payload.background.opacity}
          onChange={(event) =>
            set("background", {
              ...payload.background,
              opacity: Number(event.target.value),
            })
          }
          className="w-full"
        />
      </div>
    </>
  )
}
