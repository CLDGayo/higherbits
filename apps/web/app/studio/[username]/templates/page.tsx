import { TemplatesClient } from "@/components/features/studio/templates/templates-client"
import { listUserTemplates } from "@/lib/api/server/templates"
import { authUsernameOrRedirect } from "@/lib/user"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `Templates | Studio | HigherBits.dev`,
    description: `Templates for @${username}`,
  }
}

/**
 * Server component on purpose.
 *
 * `templates`' live grant state was never version-controlled, so a browser read
 * may or may not work - and `get_templates_v3` must not be used for an owner's
 * own list regardless. See lib/api/server/templates.ts.
 */
export default async function StudioTemplatesPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { user, isOwnProfile, isAdmin } = await authUsernameOrRedirect(
    (await params).username,
    "/studio",
  )

  const templates = await listUserTemplates(user.id)

  return (
    <TemplatesClient
      user={user}
      initialTemplates={templates}
      isOwnProfile={isOwnProfile || isAdmin}
    />
  )
}
