"use client"

import type { User } from "@/types/global"

import { ArtifactsClient, type ArtifactRow } from "./artifacts-client"
import { GradientEditor } from "./gradient-editor"
// Side-effect import: registers the gradient preview renderer with the registry.
import "./gradient-preview"
import { GRADIENT_DEFAULT_PAYLOAD } from "./registry"

/**
 * The Gradients section (Phase 10b).
 *
 * Configuration only, same as `ascii-client.tsx` and `themes-client.tsx` -
 * the third kind needing no new list behaviour, which is the evidence
 * G10.9 / G10b.6 ask for.
 */
export function GradientsClient({
  user,
  initialArtifacts,
  canEdit,
}: {
  user: User
  initialArtifacts: ArtifactRow[]
  canEdit: boolean
}) {
  return (
    <ArtifactsClient
      user={user}
      initialArtifacts={initialArtifacts}
      canEdit={canEdit}
      kind="gradient"
      label="Gradient"
      pluralLabel="gradients"
      heading="Gradients"
      description="Procedural backgrounds you can drop behind any component"
      newNameBase="New gradient"
      newPayload={GRADIENT_DEFAULT_PAYLOAD}
      renderEditor={({ artifact, onChange, onSaved }) => (
        <GradientEditor artifact={artifact} onChange={onChange} onSaved={onSaved} />
      )}
    />
  )
}
