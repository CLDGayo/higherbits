"use client"

import { ArtifactEditorShell } from "./editor-shell"
import { GradientActionBar } from "./editors/gradient/gradient-action-bar"
import { GradientEditorBody } from "./editors/gradient/gradient-editor-body"
import { GradientPreview } from "./gradient-preview"
import { GRADIENT_DEFAULT_PAYLOAD, type GradientPayload } from "./registry"

/**
 * Gradients composed onto the shared editor shell (Phase 10b).
 *
 * Mirrors `ascii-editor.tsx` and `theme-editor.tsx`: read the stored payload
 * into this kind's shape, hand the shell a body, a preview, and - new in
 * this phase - the action bar through the shell's `actions` render-prop
 * slot (§10b.5).
 */
export function GradientEditor({
  artifact,
  onSaved,
  onChange,
}: {
  artifact: {
    id: string
    name: string
    slug: string
    payload: unknown
    is_public: boolean
    status: "draft" | "published"
  }
  onSaved?: () => void
  onChange?: (patch: {
    name?: string
    slug?: string
    status?: "draft" | "published"
    is_public?: boolean
  }) => void
}) {
  // Defaults merged in rather than assumed present, matching ASCII's
  // approach: a row created before a field existed still opens, and the
  // schema rejects it on save if it is genuinely malformed.
  const initialPayload: GradientPayload = {
    ...GRADIENT_DEFAULT_PAYLOAD,
    ...((artifact.payload ?? {}) as Partial<GradientPayload>),
  }

  return (
    <ArtifactEditorShell<GradientPayload>
      artifact={artifact}
      kind="gradient"
      label="Gradient"
      initialPayload={initialPayload}
      renderBody={(props) => <GradientEditorBody {...props} />}
      renderPreview={(payload) => <GradientPreview payload={payload} />}
      actions={(props) => <GradientActionBar {...props} />}
      onSaved={onSaved}
      onChange={onChange}
    />
  )
}
