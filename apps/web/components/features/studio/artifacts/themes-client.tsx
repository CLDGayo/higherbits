"use client"

import type { User } from "@/types/global"

import { ArtifactsClient, type ArtifactRow } from "./artifacts-client"
import { ThemeEditor } from "./theme-editor"
// Side-effect import: registers the theme preview renderer with the registry.
import "./theme-preview"

/**
 * The Themes section (Phase 09 §6.5, reduced to configuration in Phase 10a).
 *
 * Everything this file used to do - the list/editor switch, optimistic updates,
 * the create-with-unique-slug loop - moved to `artifacts-client.tsx` when ASCII
 * needed the same behaviour. What is left is the configuration that genuinely
 * differs between kinds, which is what D4-R predicted the list half would
 * reduce to.
 */
export function ThemesClient({
  user,
  initialThemes,
  canEdit,
}: {
  user: User
  initialThemes: ArtifactRow[]
  canEdit: boolean
}) {
  return (
    <ArtifactsClient
      user={user}
      initialArtifacts={initialThemes}
      canEdit={canEdit}
      kind="theme"
      label="Theme"
      pluralLabel="themes"
      heading="Themes"
      description="Design token sets you can apply to any component"
      newNameBase="New theme"
      newPayload={{ light: {}, dark: {} }}
      renderEditor={({ artifact, onChange, onSaved }) => (
        <ThemeEditor artifact={artifact} onChange={onChange} onSaved={onSaved} />
      )}
    />
  )
}
