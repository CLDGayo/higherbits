import { AsciiClient } from "@/components/features/studio/artifacts/ascii-client"
import { listArtifacts } from "@/lib/api/server/artifacts"
import { authUsernameOrRedirect } from "@/lib/user"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `ASCII art | Studio | HigherBits.dev`,
    description: `ASCII art for @${username}`,
  }
}

/**
 * Server component, mirroring the Themes page beside it.
 *
 * `studio_artifacts` grants `authenticated` the four DML verbs, so a browser
 * read would work - but reading here keeps the owner's list on the server path,
 * where `listArtifacts` scopes by user id directly rather than relying on RLS
 * to do the filtering. RLS is the second line, not the first.
 */
export default async function StudioAsciiPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { user, isOwnProfile, isAdmin } = await authUsernameOrRedirect(
    (await params).username,
    "/studio",
  )

  const artifacts = await listArtifacts(user.id, "ascii")

  return (
    <AsciiClient
      user={user}
      initialArtifacts={artifacts}
      canEdit={isOwnProfile || isAdmin}
    />
  )
}
