import { UseFormReturn } from "react-hook-form"
import { z } from "zod"

const demoSchema = z.object({
  name: z.string().min(2, {
    message: "Demo name must be at least 2 characters.",
  }),
  demo_slug: z.string().min(1, {
    message: "Demo slug is required.",
  }),
  preview_image_data_url: z
    .string({
      required_error: "Cover image is required.",
    })
    .min(1, {
      message: "Cover image is required.",
    }),
  preview_video_data_url: z.string().optional(),
  preview_video_file: z.instanceof(File).optional(),
  tags: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string(),
        slug: z.string(),
      }),
    )
    .min(1, {
      message: "At least one tag is required.",
    }),
  demo_direct_registry_dependencies: z.array(z.string()).default([]),
  demo_dependencies: z.record(z.string()).default({}),
  tailwind_config: z.string().optional(),
  global_css: z.string().optional(),
})

export const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  component_slug: z.string().min(2, {
    message: "Slug must be at least 2 characters.",
  }),
  demos: z.array(demoSchema).default([]),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  license: z.string(),
  website_url: z.string().optional(),
  is_public: z.boolean(),
  unknown_dependencies: z.array(z.string()).default([]),
  unknown_dependencies_with_metadata: z
    .array(
      z.object({
        slugWithUsername: z.string(),
        registry: z.string(),
        isDemoDependency: z.boolean(),
      }),
    )
    .default([]),
  direct_registry_dependencies: z.array(z.string()).default([]),
  registry: z.string(),
  publish_as_username: z.string().optional(),
  slug_available: z.boolean().optional(),
  tailwind_config: z.string().optional(),
  globals_css: z.string().optional(),
  library_id: z.string().optional(),
  submit_for_featuring: z.boolean().default(true),
})

export type FormData = {
  name: string
  component_slug: string
  registry: string
  description: string
  license: string
  website_url?: string
  is_public: boolean
  publish_as_username?: string
  code: string
  demos: Demo[]
  unknown_dependencies?: string[]
  direct_registry_dependencies?: string[]
  slug_available?: boolean
  tailwind_config?: string
  globals_css?: string
  library_id?: string
  submit_for_featuring?: boolean
}

export type Demo = {
  name: string
  demo_code: string
  demo_slug: string
  tags: Tag[]
  preview_image_data_url: string
  preview_image_file?: File
  preview_video_data_url?: string
  preview_video_file?: File
  demo_direct_registry_dependencies?: string[]
  demo_dependencies?: Record<string, string>
  tailwind_config?: string
  global_css?: string
}

export type Tag = {
  id?: number
  name: string
  slug: string
}

export type DemoFormData = z.infer<typeof demoSchema>

export interface TagOption {
  value: number
  label: string
  __isNew__?: boolean
}

export const formatComponentName = (name: string): string => {
  return name.replace(/([A-Z])/g, " $1").trim()
}

export const isFormValid = (form: UseFormReturn<FormData>): boolean => {
  const {
    name,
    component_slug,
    code,
    demos,
    registry,
    license,
    unknown_dependencies,
  } = form.getValues()

  return Boolean(
    name?.length >= 2 &&
      component_slug?.length >= 2 &&
      code?.length > 0 &&
      demos?.length > 0 &&
      registry &&
      license &&
      unknown_dependencies?.length === 0,
  )
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  component_slug: "Slug",
  description: "Description",
  license: "License",
  registry: "Registry",
  is_public: "Visibility",
  demos: "Demos",
  tags: "Tags",
  demo_slug: "Demo slug",
  preview_image_data_url: "Cover image",
}

const labelFor = (path: string[]): string =>
  path
    .filter((segment) => !/^\d+$/.test(segment))
    .map((segment) => FIELD_LABELS[segment] ?? segment)
    .join(" → ")

/**
 * Flattens a react-hook-form error tree into readable "Field → message" lines.
 *
 * The studio form is a field array (`demos.0.tags`), so errors arrive nested and
 * a plain Object.keys() only ever reports "demos" — which is what made a failed
 * submit look like nothing happening at all. Walks the tree and keeps the leaves,
 * which are the objects carrying a string `message`.
 */
export const collectFormErrors = (
  errors: unknown,
  path: string[] = [],
): string[] => {
  if (!errors || typeof errors !== "object") return []

  const node = errors as Record<string, unknown>

  if (typeof node.message === "string" && node.message.length > 0) {
    const label = labelFor(path)
    return [label ? `${label}: ${node.message}` : node.message]
  }

  return Object.entries(node)
    .filter(([key]) => key !== "ref" && key !== "type")
    .flatMap(([key, value]) => collectFormErrors(value, [...path, key]))
}
