"use server"

import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import prisma from "../prisma"
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
  const fullUuid = shortUUID.toUUID(sandboxId)

  const sandbox = await prisma.sandboxes.findUnique({
    where: { id: fullUuid },
  })

  if (!sandbox) {
    throw new Error("Sandbox not found")
  }

  if (sandbox.user_id !== userId) {
    throw new Error("Unauthorized to delete this sandbox")
  }

  await prisma.sandboxes.delete({
    where: { id: fullUuid },
  })

  return { success: true }
}
