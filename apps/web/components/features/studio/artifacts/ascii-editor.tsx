"use client"

import { AsciiPreview } from "./ascii-preview"
import { ArtifactEditorShell } from "./editor-shell"
import { AsciiEditorBody } from "./editors/ascii/ascii-editor-body"
import { ASCII_DEFAULT_PAYLOAD, type AsciiPayload } from "./registry"

/**
 * ASCII art composed onto the shared editor shell (Phase 10a).
 *
 * Mirrors `theme-editor.tsx` exactly: read the stored payload into this kind's
 * shape, hand the shell a body and a preview. The shell was extracted in §10a.1
 * and has no idea either kind exists - which is the D4-R claim this phase
 * exists to test, and so far it holds.
 */
export function AsciiEditor({
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
  // Defaults merged in rather than assumed present: a row created before a
  // field existed still opens, and the schema rejects it on save if it is
  // genuinely malformed.
  const initialPayload: AsciiPayload = {
    ...ASCII_DEFAULT_PAYLOAD,
    ...((artifact.payload ?? {}) as Partial<AsciiPayload>),
  }

  return (
    <ArtifactEditorShell<AsciiPayload>
      artifact={artifact}
      kind="ascii"
      label="ASCII art"
      initialPayload={initialPayload}
      renderBody={(props) => (
        <AsciiEditorBody {...props} artifactId={artifact.id} />
      )}
      renderPreview={(payload) => <AsciiPreview payload={payload} />}
      onSaved={onSaved}
      onChange={onChange}
    />
  )
}
