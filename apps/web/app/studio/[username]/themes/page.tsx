import { ThemesClient } from "@/components/features/studio/artifacts/themes-client"
import { listArtifacts } from "@/lib/api/server/artifacts"
import { authUsernameOrRedirect } from "@/lib/user"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `Themes | Studio | HigherBits.dev`,
    description: `Themes for @${username}`,
  }
}

/**
 * Server component, like the Templates page beside it.
 *
 * `studio_artifacts` grants `authenticated` the four DML verbs, so a browser
 * read would work — but reading here keeps the owner's list on the server path,
 * where `listArtifacts` scopes by user id directly rather than relying on RLS
 * to do the filtering. RLS is the second line, not the first.
 */
export default async function StudioThemesPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { user, isOwnProfile, isAdmin } = await authUsernameOrRedirect(
    (await params).username,
    "/studio",
  )

  const themes = await listArtifacts(user.id, "theme")

  return (
    <ThemesClient
      user={user}
      initialThemes={themes}
      canEdit={isOwnProfile || isAdmin}
    />
  )
}
