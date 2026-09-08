"use client"

import { Shuffle, Palette as PaletteIcon, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { ArtifactBodyProps } from "../../editor-shell"
import type { GradientPayload } from "../../registry"
import { inspire, recolour, restyle } from "./gradient-randomizers"

/**
 * Inspire / Recolour / Restyle (Phase 10b, §10b.5).
 *
 * Mounted through the shell's `actions` render-prop slot (see
 * `editor-shell.tsx`), which is why this component takes the same
 * `payload` / `setPayload` shape a body does - the shell hands it the same
 * pair. Every button below only calls a pure function from
 * `gradient-randomizers.ts`; this file owns no randomisation logic itself,
 * so its determinism is exactly what that module's tests already prove.
 *
 * Every parameter these actions touch is already a control in
 * `gradient-editor-body.tsx` - the Form / Palette / Surface / Motion panels
 * - which is the test §10b.5 sets for whether an action is honest.
 */
export function GradientActionBar({
  payload,
  setPayload,
}: ArtifactBodyProps<GradientPayload>) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-border pt-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setPayload(inspire)}
      >
        <Wand2 size={14} />
        Inspire
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setPayload(recolour)}
      >
        <PaletteIcon size={14} />
        Recolour
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setPayload(restyle)}
      >
        <Shuffle size={14} />
        Restyle
      </Button>
    </div>
  )
}
