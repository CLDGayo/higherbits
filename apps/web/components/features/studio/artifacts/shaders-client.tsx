"use client"

import type { User } from "@/types/global"

import { ArtifactsClient, type ArtifactRow } from "./artifacts-client"
import { ShaderEditor } from "./shader-editor"
// Side-effect import: registers the shader preview renderer with the registry.
import "./shader-preview"
import { SHADER_DEFAULT_PAYLOAD } from "./registry"

/**
 * The Shaders section (Phase 10c) - the eighth and last nav section.
 *
 * Configuration only, same as `gradients-client.tsx`, `ascii-client.tsx` and
 * `themes-client.tsx`. That a fourth kind still needs no new list behaviour is
 * the strongest evidence yet for D4-R's split, and it is what G9.10 asked to be
 * shown rather than asserted.
 */
export function ShadersClient({
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
      kind="shader"
      label="Shader"
      pluralLabel="shaders"
      heading="Shaders"
      description="Fragment shaders compiled live in the browser"
      newNameBase="New shader"
      newPayload={SHADER_DEFAULT_PAYLOAD}
      renderEditor={({ artifact, onChange, onSaved }) => (
        <ShaderEditor artifact={artifact} onChange={onChange} onSaved={onSaved} />
      )}
    />
  )
}
