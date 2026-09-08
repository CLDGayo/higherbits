"use server"

import { auth } from "@clerk/nextjs/server"
import { z } from "zod"

import {
  deleteTemplate,
  listUserTemplates,
  setTemplateVisibility,
  updateTemplate,
} from "./server/templates"

/**
 * Template mutations, following the shape established by ./collections.ts:
 * Clerk auth, zod parse, delegate to a server-only module that re-checks
 * ownership against the loaded row.
 *
 * The ownership check lives there rather than here because Prisma bypasses RLS
 * entirely - there is no second line of defence.
 */

const requireUserId = async () => {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}

const templateIdSchema = z.number().int().positive()

export const listTemplatesAction = async () => {
  const userId = await requireUserId()
  return listUserTemplates(userId)
}

const updateTemplateSchema = z.object({
  templateId: templateIdSchema,
  name: z.string().trim().min(1, "Name is required").max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  // Matches the column's Decimal(10,2): two decimal places, and a price that
  // cannot be negative.
  price: z.number().min(0).max(99_999_999).optional(),
  payment_url: z.string().url().optional().nullable().or(z.literal("")),
  website_preview_url: z.string().url().optional(),
})

export const updateTemplateAction = async (
  input: z.infer<typeof updateTemplateSchema>,
) => {
  const userId = await requireUserId()
  const { templateId, ...rest } = updateTemplateSchema.parse(input)

  return updateTemplate(templateId, userId, {
    ...rest,
    // An emptied optional URL field means "clear it", not "set empty string" -
    // payment_url is nullable and an empty string would fail a later URL parse.
    payment_url: rest.payment_url === "" ? null : rest.payment_url,
  })
}

const setVisibilitySchema = z.object({
  templateId: templateIdSchema,
  isPublic: z.boolean(),
})

export const setTemplateVisibilityAction = async (
  input: z.infer<typeof setVisibilitySchema>,
) => {
  const userId = await requireUserId()
  const { templateId, isPublic } = setVisibilitySchema.parse(input)
  return setTemplateVisibility(templateId, userId, isPublic)
}

const deleteTemplateSchema = z.object({ templateId: templateIdSchema })

export const deleteTemplateAction = async (
  input: z.infer<typeof deleteTemplateSchema>,
) => {
  const userId = await requireUserId()
  const { templateId } = deleteTemplateSchema.parse(input)
  await deleteTemplate(templateId, userId)
  return { success: true }
}
