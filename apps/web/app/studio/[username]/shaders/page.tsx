import { ShadersClient } from "@/components/features/studio/artifacts/shaders-client"
import { listArtifacts } from "@/lib/api/server/artifacts"
import { authUsernameOrRedirect } from "@/lib/user"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `Shaders | Studio | HigherBits.dev`,
    description: `Shaders for @${username}`,
  }
}

/**
 * Server component, mirroring the Gradients, ASCII art and Themes pages beside
 * it. Reading here keeps the owner's list on the server path, where
 * `listArtifacts` scopes by user id directly rather than relying on RLS to do
 * the filtering. RLS is the second line, not the first.
 */
export default async function StudioShadersPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { user, isOwnProfile, isAdmin } = await authUsernameOrRedirect(
    (await params).username,
    "/studio",
  )

  const artifacts = await listArtifacts(user.id, "shader")

  return (
    <ShadersClient
      user={user}
      initialArtifacts={artifacts}
      canEdit={isOwnProfile || isAdmin}
    />
  )
}
