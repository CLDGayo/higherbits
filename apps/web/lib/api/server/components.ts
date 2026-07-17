import "server-only"
import prisma from "../../prisma"
import { getPurchasesWithBundles, isComponentPaid } from "./bundle_purchases"

export const hasUserComponentAccess = async (
  userId: string | null,
  componentId: number,
) => {
  const isPaid = await isComponentPaid(componentId)
  if (!isPaid) {
    return true
  }

  if (!userId) {
    return false
  }

  const userPlan = await prisma.users_to_plans.findUnique({ where: { user_id: userId } })
  if (userPlan?.status === "active") {
    return true
  }

  const bundles = await prisma.bundles.findMany({
    where: {
      bundle_items: {
        some: { component_id: componentId },
      },
    },
  })

  const isAuthor = bundles.some((bundle) => bundle.user_id === userId)
  if (isAuthor) {
    return true
  }

  const purchases = await getPurchasesWithBundles(userId)
  return purchases.some(
    (purchase) =>
      purchase.status === "paid" &&
      purchase.bundles.bundle_items.some(
        (item) => item.component_id === componentId,
      ),
  )
}

export const getComponentBundles = async (componentId: number) => {
  const bundles = await prisma.bundles.findMany({
    where: {
      bundle_items: { some: { component_id: componentId } },
    },
    include: {
      bundle_plans: true,
      users: true,
    },
  })

  return bundles
}

export const transferOwnership = async (
  componentId: number,
  userId: string,
) => {
  const demos = await prisma.demos.findMany({
    where: {
      component_id: componentId,
    },
  })

  const promises = []

  promises.push(
    prisma.components.update({
      where: { id: componentId },
      data: { user_id: userId },
    }),
  )

  for (const demo of demos) {
    promises.push(
      prisma.demos.update({
        where: { id: demo.id },
        data: { user_id: userId },
      }),
    )
  }

  await Promise.all(promises).catch((err) => {
    console.error(err)
    throw new Error("Failed to transfer ownership")
  })
}

export const deleteComponent = async (componentId: number, userId: string) => {
  const component = await prisma.components.findUnique({
    where: { id: componentId }
  });

  if (!component) {
    throw new Error("Component not found");
  }

  // Only allow owner or admin to delete
  if (component.user_id !== userId) {
    throw new Error("Unauthorized to delete this component");
  }

  await prisma.components.delete({
    where: { id: componentId }
  });
};
