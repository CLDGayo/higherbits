"use server"

import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import prisma from "../prisma"
import { checkIsAdmin } from "../admin"
import ShortUUID from "short-uuid"

const shortUUID = ShortUUID()

const deleteSandboxSchema = z.object({
  sandboxId: z.string(),
})

export const deleteSandboxAction = async (
  input: z.infer<typeof deleteSandboxSchema>,
) => {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }

  const { sandboxId } = deleteSandboxSchema.parse(input)
  let fullUuid: string
  try {
    fullUuid = sandboxId.includes("-") ? sandboxId : shortUUID.toUUID(sandboxId)
  } catch {
    fullUuid = sandboxId
  }

  const sandbox = await prisma.sandboxes.findUnique({
    where: { id: fullUuid },
  })

  if (!sandbox) {
    throw new Error("Sandbox not found")
  }

  const { isAdmin } = await checkIsAdmin(userId)

  if (sandbox.user_id !== userId && !isAdmin) {
    throw new Error("Unauthorized to delete this sandbox")
  }

  // Disassociate from any components referencing this sandbox_id to avoid foreign key constraint failure
  await prisma.components.updateMany({
    where: { sandbox_id: fullUuid },
    data: { sandbox_id: null },
  })

  await prisma.sandboxes.delete({
    where: { id: fullUuid },
  })

  return { success: true }
}
