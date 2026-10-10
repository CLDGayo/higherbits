import prisma from "@/lib/prisma"
import "server-only"
import { hasUserComponentAccess } from "./components"
import { currentApprovedAutoIndexComponentIds } from "./auto-index-admission"

export const hasUserPurchasedDemo = async (
  userId: string | null,
  demoId: number,
) => {
  const demo = await prisma.demos.findUnique({
    where: {
      id: demoId,
    },
    include: {
      components: {
        select: {
          user_id: true,
        },
      },
    },
  })

  if (!demo) {
    return false
  }

  if (userId && (demo.user_id === userId || demo.components?.user_id === userId)) {
    return true
  }

  const hasPurchasedComponent = await hasUserComponentAccess(
    userId,
    demo.component_id,
  )

  return hasPurchasedComponent
}

export const getDemos = async (search?: string) => {
  const demos = await prisma.demos.findMany({
    where: {
      components: {
        is_public: true,
        name: search ? { contains: search, mode: "insensitive" } : undefined,
      },
    },
    include: {
      components: {
        include: {
          users_components_user_idTousers: true,
        },
      },
    },
  })

  const indexedIds = [...new Set(demos
    .filter((demo) => demo.components?.registry === "auto-index")
    .map((demo) => demo.component_id))]
  if (!indexedIds.length) return demos
  const admitted = await currentApprovedAutoIndexComponentIds(indexedIds)
  return demos.filter((demo) =>
    demo.components?.registry !== "auto-index" || admitted.has(demo.component_id),
  )
}
