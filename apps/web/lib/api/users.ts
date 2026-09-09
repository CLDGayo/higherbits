"use server"

import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { getUsers, checkIsAdmin } from "./server/users"

const getUsersActionSchema = z.object({
  searchQuery: z.string().optional(),
})

export async function getUsersAction(
  input: z.infer<typeof getUsersActionSchema>,
) {
  // "use server" makes every export in this file a browser-callable RPC.
  // getUsers returns unfiltered user rows (email, paypal_email, stripe_id,
  // is_admin), so this is admin-only.
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  const isAdmin = await checkIsAdmin(userId)
  if (!isAdmin) {
    throw new Error("Forbidden")
  }

  const { searchQuery } = getUsersActionSchema.parse(input)
  return getUsers({ searchQuery })
}
