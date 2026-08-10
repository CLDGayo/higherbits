import { StudioSectionPlaceholder } from "@/components/features/studio/ui/studio-section-placeholder"
import { authUsernameOrRedirect } from "@/lib/user"
import { LayoutTemplate } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return { title: `Templates | Studio | HigherBits.dev`, description: `Templates for @${username}` }
}

export default async function StudioTemplatesPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { user } = await authUsernameOrRedirect(
    (await params).username,
    "/studio",
  )

  return (
    <StudioSectionPlaceholder
      user={user}
      title="Templates"
      description="Full page and site templates you've published."
      icon={LayoutTemplate}
    />
  )
}
