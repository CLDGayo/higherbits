import { StudioSectionPlaceholder } from "@/components/features/studio/ui/studio-section-placeholder"
import { authUsernameOrRedirect } from "@/lib/user"
import { Library } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return { title: `Libraries | Studio | HigherBits.dev`, description: `Libraries for @${username}` }
}

export default async function StudioLibrariesPage({
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
      title="Libraries"
      description="Group your components into a library others can browse."
      icon={Library}
    />
  )
}
