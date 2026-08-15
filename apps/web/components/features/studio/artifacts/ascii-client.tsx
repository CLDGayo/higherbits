"use client"

import type { User } from "@/types/global"

import { AsciiEditor } from "./ascii-editor"
import { ArtifactsClient, type ArtifactRow } from "./artifacts-client"
import { ASCII_DEFAULT_PAYLOAD } from "./registry"
// Side-effect import: registers the ascii preview renderer with the registry.
import "./ascii-preview"

/**
 * The ASCII art section (Phase 10a).
 *
 * Configuration only, same as `themes-client.tsx`. That the second kind needed
 * no new list behaviour is the evidence G10.9 asks for - recorded here because
 * it is easy to lose once it looks obvious.
 */
export function AsciiClient({
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
      kind="ascii"
      label="ASCII art"
      pluralLabel="ASCII art"
      heading="ASCII art"
      description="Photos rendered as character grids"
      newNameBase="New ASCII art"
      newPayload={ASCII_DEFAULT_PAYLOAD}
      renderEditor={({ artifact, onChange, onSaved }) => (
        <AsciiEditor artifact={artifact} onChange={onChange} onSaved={onSaved} />
      )}
    />
  )
}
