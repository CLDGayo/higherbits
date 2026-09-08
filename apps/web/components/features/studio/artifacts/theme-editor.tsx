"use client"

import { ArtifactEditorShell } from "./editor-shell"
import { ThemeEditorBody } from "./editors/theme/theme-editor-body"
import { ThemePreviewPair, type ThemePayload } from "./theme-preview"

/**
 * Themes composed onto the shared editor shell (Phase 10a, §10a.1).
 *
 * This file used to be the whole editor - 325 lines holding the save / publish /
 * visibility / slug chrome *and* the theme token form. Phase 10a split it,
 * because D4-R's "one shell, per-kind bodies" had never actually been built and
 * G10.12 requires bodies to mount into a shell that does not branch on kind.
 *
 * The export name and props are unchanged on purpose: `themes-client.tsx` is the
 * only caller and did not have to change, which keeps the extraction's blast
 * radius to this directory and lets Phase 09's gates re-run against an identical
 * public surface.
 *
 * Chrome lives in `editor-shell.tsx`; the token form and JSON panel live in
 * `editors/theme/theme-editor-body.tsx`. What is left here is the composition
 * and the one thing only this file knows: how to read a stored payload as a
 * `ThemePayload`.
 */
export function ThemeEditor({
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
  // Parsed here rather than in the shell: the shell is generic over the payload
  // type and must not know that a theme has light/dark/radius. A stored payload
  // that predates a field still opens, which is what the defaults are for.
  const stored = (artifact.payload ?? {}) as Partial<ThemePayload>
  const initialPayload: ThemePayload = {
    light: stored.light ?? {},
    dark: stored.dark ?? {},
    radius: stored.radius,
  }

  return (
    <ArtifactEditorShell<ThemePayload>
      artifact={artifact}
      kind="theme"
      label="Theme"
      initialPayload={initialPayload}
      renderBody={(props) => <ThemeEditorBody {...props} />}
      renderPreview={(payload) => <ThemePreviewPair payload={payload} />}
      onSaved={onSaved}
      onChange={onChange}
    />
  )
}
