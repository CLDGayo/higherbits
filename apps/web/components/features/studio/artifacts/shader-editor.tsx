"use client"

import { useCallback, useState } from "react"

import { ArtifactEditorShell } from "./editor-shell"
import { ShaderEditorBody } from "./editors/shader/shader-editor-body"
import { ShaderPreview } from "./shader-preview"
import { SHADER_DEFAULT_PAYLOAD, type ShaderPayload } from "./registry"
import type { ValidationResult } from "./shader-harness"

/**
 * Shaders composed onto the shared editor shell (Phase 10c).
 *
 * Mirrors `gradient-editor.tsx` and `ascii-editor.tsx`, with one addition: the
 * compile result is held **here** rather than in either render prop.
 *
 * The shell calls `renderBody` and `renderPreview` separately, so the only
 * place that can see both is their common parent. The preview is what actually
 * compiles - it owns the canvas - and the body is what has to show the error.
 * Recomputing the compile in the body would give two answers that can disagree,
 * which is exactly the class of bug this program has shipped before.
 */
export function ShaderEditor({
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
  const [validation, setValidation] = useState<ValidationResult | null>(null)

  // Identity-stable: ShaderRuntime reports on every recompile, and a new
  // function each render would make that effect fire on every keystroke.
  const handleValidation = useCallback((next: ValidationResult) => {
    setValidation(next)
  }, [])

  // Defaults merged in rather than assumed present, matching ASCII and
  // gradients: a row created before a field existed still opens, and the schema
  // rejects it on save if it is genuinely malformed.
  const initialPayload: ShaderPayload = {
    ...SHADER_DEFAULT_PAYLOAD,
    ...((artifact.payload ?? {}) as Partial<ShaderPayload>),
  }

  return (
    <ArtifactEditorShell<ShaderPayload>
      artifact={artifact}
      kind="shader"
      label="Shader"
      initialPayload={initialPayload}
      renderBody={(props) => (
        <ShaderEditorBody {...props} validation={validation} />
      )}
      renderPreview={(payload) => (
        <ShaderPreview payload={payload} onValidation={handleValidation} />
      )}
      onSaved={onSaved}
      onChange={onChange}
    />
  )
}
