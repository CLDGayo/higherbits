import { LibrariesClient } from "@/components/features/studio/libraries/libraries-client"
import { listUserLibraries } from "@/lib/api/server/collections"
import prisma from "@/lib/prisma"
import { authUsernameOrRedirect } from "@/lib/user"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `Libraries | Studio | HigherBits.dev`,
    description: `Libraries for @${username}`,
  }
}

/**
 * Server component on purpose. `public.collections` has no grants for the
 * `authenticated` role, so the same reads from the browser would return 42501 -
 * see the note in lib/api/server/collections.ts.
 */
export default async function StudioLibrariesPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { user, isOwnProfile, isAdmin } = await authUsernameOrRedirect(
    (await params).username,
    "/studio",
  )

  const libraries = await listUserLibraries(user.id)

  // Components the owner can put in a library, plus current membership so the
  // manage dialog opens populated rather than fetching on open.
  const [components, memberships] = await Promise.all([
    prisma.components.findMany({
      where: { user_id: user.id },
      select: { id: true, name: true },
      orderBy: { created_at: "desc" },
    }),
    prisma.components_to_collections.findMany({
      where: { collection_id: { in: libraries.map((l) => l.id) } },
      select: { collection_id: true, component_id: true },
    }),
  ])

  const membersByLibrary: Record<string, number[]> = {}
  for (const library of libraries) {
    membersByLibrary[library.id] = []
  }
  for (const row of memberships) {
    membersByLibrary[row.collection_id]?.push(row.component_id)
  }

  return (
    <LibrariesClient
      user={user}
      initialLibraries={libraries}
      components={components}
      membersByLibrary={membersByLibrary}
      isOwnProfile={isOwnProfile || isAdmin}
    />
  )
}
