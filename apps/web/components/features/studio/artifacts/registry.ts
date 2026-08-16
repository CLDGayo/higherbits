import type React from "react"
import { Palette, Sparkles, Type, Waves } from "lucide-react"
import { z } from "zod"

/**
 * The kind registry (Phase 09, §6.2).
 *
 * Themes, ASCII art, gradients and shaders are the same object: a user-authored
 * artifact with a payload, a preview, a visibility flag and a draft/published
 * status. They differ only in payload shape, preview renderer and label copy.
 * Everything downstream - the list surface, the CRUD layer, the routes - reads
 * this file and is otherwise kind-agnostic.
 *
 * Adding a kind is a config change here plus a preview renderer. It must not
 * require touching the list, the CRUD layer or the table. That is gate G9.10.
 */

export const ARTIFACT_KINDS = ["theme", "ascii", "gradient", "shader"] as const

export type ArtifactKind = (typeof ARTIFACT_KINDS)[number]

export const ARTIFACT_STATUSES = ["draft", "published"] as const

export type ArtifactStatus = (typeof ARTIFACT_STATUSES)[number]

/**
 * Tab sets differ per kind by product decision, not by accident: Themes filters
 * on publication state, the other three on visibility. The list reads whichever
 * set the kind declares and never hardcodes either.
 */
export type ArtifactTabId =
  | "all"
  | "published"
  | "drafts"
  | "public"
  | "private"

export interface ArtifactTab {
  id: ArtifactTabId
  label: string
}

const PUBLICATION_TABS: readonly ArtifactTab[] = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "drafts", label: "Drafts" },
] as const

const VISIBILITY_TABS: readonly ArtifactTab[] = [
  { id: "all", label: "All" },
  { id: "public", label: "Public" },
  { id: "private", label: "Private" },
] as const

/** A row as the list surface sees it, independent of how it was loaded. */
export interface ArtifactSummary {
  id: string
  kind: ArtifactKind
  name: string
  slug: string
  preview_url: string | null
  is_public: boolean
  status: ArtifactStatus
  created_at: string | Date
  updated_at: string | Date
  /**
   * Carried on the summary so the list can render a live preview per row
   * (P11-D8). Optional because a caller that does not select it is still a
   * valid summary - the card falls back to `preview_url`, then to an empty
   * frame, in that order.
   */
  payload?: unknown
}

/**
 * Whether a row belongs in a tab. Kept here rather than in the list so the
 * meaning of "Published" lives beside the tab that declares it, and so the
 * server can reuse the same predicate for counts.
 */
export const matchesTab = (
  artifact: Pick<ArtifactSummary, "is_public" | "status">,
  tab: ArtifactTabId,
): boolean => {
  switch (tab) {
    case "all":
      return true
    case "published":
      return artifact.status === "published"
    case "drafts":
      return artifact.status === "draft"
    case "public":
      return artifact.is_public
    case "private":
      return !artifact.is_public
  }
}

// --- payload schemas -------------------------------------------------------

/**
 * A theme is a token set: CSS custom property names mapped to values, split by
 * colour scheme. Deliberately a record rather than a fixed key list - shadcn
 * token sets differ between projects and a closed enum would reject valid
 * themes.
 *
 * Keys are constrained because this lands in a JSONB column that is later
 * interpolated into a stylesheet: a key carrying `:` or `}` could break out of
 * the declaration it is written into.
 */
const cssTokenKey = z
  .string()
  .regex(
    /^--[a-z0-9-]+$/,
    "Token names must look like --foo-bar (lowercase, digits, hyphens)",
  )

const cssTokenValue = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .refine(
    (value) => !/[;{}<>]/.test(value),
    "Token values cannot contain ; { } < or >",
  )

const themePayloadSchema = z.object({
  light: z.record(cssTokenKey, cssTokenValue).default({}),
  dark: z.record(cssTokenKey, cssTokenValue).default({}),
  radius: z.string().trim().max(32).optional(),
})
  // .strict(): with light/dark defaulted and radius optional, a non-strict
  // object accepts ANY input - a gradient payload parsed cleanly as a theme.
  // Rejecting unknown keys is what makes cross-kind payloads fail.
  .strict()

/**
 * ASCII art (Phase 10a, §10a.2).
 *
 * The placeholder this replaced held `source` / `columns` / `charset` - roughly
 * three of the thirty-odd parameters the reference exposes. Rewriting it was
 * free because a read-only probe confirmed zero `ascii` rows existed; because
 * these schemas are `.strict()`, the same change after rows exist would reject
 * every stored payload on read. Do the same check before rewriting the gradient
 * and shader schemas in 10b and 10c.
 *
 * **Every numeric is bounded, and that is a safety property rather than
 * tidiness.** `cellSize` and `coverage` become loop counts in the renderer:
 * an unbounded `cellSize` of 0 or a negative divides the image into infinite
 * cells and hangs the tab. The theme schema's header makes the same argument
 * about unbounded strings interpolated into a stylesheet.
 *
 * `sourceType` is a one-member union rather than an enum with unreachable
 * members. 10a ships the photo source only - the reference's Video, Shader and
 * Gradient sources were cut at entry because the capture never opened those
 * tabs. Widening this later is additive.
 */

/** The six styles 10a ships, of the reference's 25. All pure character mapping. */
export const ASCII_STYLES = [
  { id: "characters", label: "Characters", ramp: " .:-=+*#%@" },
  { id: "braille", label: "Braille", ramp: " ⠁⠃⠇⠧⠷⠿⡿⣿" },
  { id: "matrix", label: "Matrix", ramp: " 01" },
  { id: "dots", label: "Dots", ramp: " ·∙•●" },
  { id: "dither", label: "Dither", ramp: " ░▒▓█" },
  { id: "halfblocks", label: "Half Blocks", ramp: " ▁▂▃▄▅▆▇█" },
] as const

export type AsciiStyleId = (typeof ASCII_STYLES)[number]["id"]

export const ASCII_CHARSETS = ["style", "binary", "hex", "alpha"] as const
export const ASCII_BLEND_MODES = ["normal", "multiply", "screen", "overlay"] as const
export const ASCII_BACKGROUND_MODES = ["solid-black", "solid-white", "transparent"] as const

const asciiStyleId = z.enum(
  ASCII_STYLES.map((style) => style.id) as [AsciiStyleId, ...AsciiStyleId[]],
)

const asciiPayloadSchema = z.object({
  sourceType: z.literal("photo"),
  /**
   * R2 object key, always derived server-side from the authenticated user id.
   * Constrained here as a second line: a key carrying `..` or a leading slash
   * is a path-traversal attempt, and this value is later concatenated into a
   * URL. The upload route is the first line and does not trust the client for
   * this at all.
   */
  sourceKey: z
    .string()
    .trim()
    .min(1)
    .max(400)
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/,
      "Object keys are alphanumerics, slashes, dots, underscores and hyphens",
    )
    .refine((key) => !key.includes(".."), "Object keys cannot traverse")
    // Optional because an artifact is created before a photo is chosen: "+ New"
    // makes the row, the editor uploads into it. A required key would make the
    // create action unable to write its own default payload.
    .optional(),
  styleId: asciiStyleId,
  cellSize: z.number().int().min(4).max(64),
  coverage: z.number().min(1).max(100),
  invert: z.boolean(),
  blendMode: z.enum(ASCII_BLEND_MODES),
  charset: z.enum(ASCII_CHARSETS),
  background: z.object({
    mode: z.enum(ASCII_BACKGROUND_MODES),
    opacity: z.number().min(0).max(100),
  }),
}).strict()

export type AsciiPayload = z.infer<typeof asciiPayloadSchema>

/** Reference defaults, used for a newly created artifact that has no photo yet. */
export const ASCII_DEFAULT_PAYLOAD: AsciiPayload = {
  sourceType: "photo",
  styleId: "characters",
  cellSize: 14,
  coverage: 96,
  invert: false,
  blendMode: "normal",
  charset: "style",
  background: { mode: "solid-black", opacity: 90 },
}

/**
 * Gradients (Phase 10b, §10b.2).
 *
 * The placeholder this replaces was wrong three ways: `css` as required
 * source-of-truth (CSS is a derived approximation, never stored - nobody
 * exports a CSS gradient as a 1080p PNG), stops carrying a numeric
 * `position` (dropped per §7.0b decision 7 - positions belong to a form's
 * own geometry, because Bloom Field treats stops as independent 2D points,
 * not offsets along a 1D axis), and `editorMode: "css"` (corrected below;
 * the runtime is WebGL, not a stylesheet).
 *
 * Rewriting was free because the §10b.0 probe confirmed zero `gradient` rows
 * before this schema changed - `.strict()` means the rewrite is a rejection
 * of every stored payload the moment one exists.
 *
 * **Every numeric is bounded** for the same reason `asciiPayloadSchema`
 * bounds its numerics: these values reach a GPU uniform and a canvas sizer,
 * not just a rendering quirk if they are wrong.
 */

/**
 * §7.0b chose one form per family before the runtime was known. Checked
 * against the adopted library (§10b.0 step 4): Bloom Field and Core Glow map
 * directly onto `MeshGradient` and `StaticRadialGradient`. Axis Blend and
 * Pulse Bars have no native match; they render through `GrainGradient`
 * (shape "wave") and `Waves` respectively - the closest same-family effect
 * the library ships. The swap is recorded here because this list is the
 * schema's source of truth for what a stored `formId` may be; the runtime
 * mapping itself lives in `gradient-form-props.ts`.
 */
export const GRADIENT_FORMS = [
  { id: "bloom-field", label: "Bloom Field", family: "Atmosphere" },
  { id: "core-glow", label: "Core Glow", family: "Focus" },
  { id: "axis-blend", label: "Axis Blend", family: "Direction" },
  { id: "pulse-bars", label: "Pulse Bars", family: "Pattern" },
] as const

export type GradientFormId = (typeof GRADIENT_FORMS)[number]["id"]

const gradientFormIdSchema = z.enum(
  GRADIENT_FORMS.map((form) => form.id) as [GradientFormId, ...GradientFormId[]],
)

/**
 * Six hex digits only - no `#fff` shorthand, no `transparent`, no CSS colour
 * keywords. This value reaches `getShaderColorFromString` in the runtime
 * wrapper and a stray keyword there is a runtime failure, not a rendering
 * quirk.
 */
const hexColour = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Colours must be a 6-digit hex value like #7c3aed")

const gradientColourStop = z.object({
  name: z.string().trim().min(1).max(40),
  hex: hexColour,
}).strict()

const gradientPayloadSchema = z.object({
  formId: gradientFormIdSchema,
  geometry: z.object({
    scale: z.number().min(0.1).max(4),
    distortion: z.number().min(0).max(1),
  }).strict(),
  // At least one stop so a runtime mapping is never handed an empty colour
  // list; capped so the Palette panel and the stored payload cannot grow
  // without bound.
  stops: z.array(gradientColourStop).min(1).max(8),
  baseColour: hexColour,
  surface: z.object({
    blur: z.number().int().min(0).max(64),
    grain: z.number().min(0).max(100),
    edgeShade: z.number().min(0).max(100),
  }).strict(),
  // Motion is one boolean (§7.0b Finding 5): the reference's Motion panel has
  // no parameters at all, because movement is baked per form.
  motion: z.object({
    animate: z.boolean(),
  }).strict(),
}).strict()

export type GradientPayload = z.infer<typeof gradientPayloadSchema>

export const GRADIENT_DEFAULT_PAYLOAD: GradientPayload = {
  formId: "bloom-field",
  geometry: { scale: 1, distortion: 0.5 },
  stops: [
    { name: "Start", hex: "#7c3aed" },
    { name: "End", hex: "#f472b6" },
  ],
  baseColour: "#0b0b12",
  surface: { blur: 0, grain: 0, edgeShade: 0 },
  motion: { animate: false },
}

const shaderPayloadSchema = z.object({
  fragment: z.string().max(50_000),
  vertex: z.string().max(50_000).optional(),
  uniforms: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
}).strict()

// --- the registry ----------------------------------------------------------

/**
 * A kind's preview renderer. Receives the already-validated payload, so a
 * renderer never has to defend against a shape its schema would have rejected.
 *
 * Registered lazily by kind rather than imported here, so the registry stays a
 * plain config module that server code can import without pulling React
 * components into a server bundle.
 */
export type ArtifactPreviewRenderer = (props: {
  payload: unknown
  className?: string
}) => React.ReactNode

export interface ArtifactKindConfig {
  kind: ArtifactKind
  label: string
  pluralLabel: string
  icon: typeof Palette
  emptyState: { title: string; description: string }
  tabs: readonly ArtifactTab[]
  payloadSchema: z.ZodTypeAny
  /** Which editor shell §6.5 mounts for this kind. */
  editorMode: "tokens" | "text" | "webgl" | "glsl"
}

const previewRenderers = new Map<ArtifactKind, ArtifactPreviewRenderer>()

/**
 * Registered from the client bundle at module load (see theme-preview.tsx).
 * Kinds without a renderer fall back to their preview image, which is what a
 * newly added kind gets for free before its renderer is written.
 */
export const registerPreviewRenderer = (
  kind: ArtifactKind,
  renderer: ArtifactPreviewRenderer,
) => {
  previewRenderers.set(kind, renderer)
}

export const getPreviewRenderer = (
  kind: ArtifactKind,
): ArtifactPreviewRenderer | undefined => previewRenderers.get(kind)

export const ARTIFACT_REGISTRY: Record<ArtifactKind, ArtifactKindConfig> = {
  theme: {
    kind: "theme",
    label: "Theme",
    pluralLabel: "Themes",
    icon: Palette,
    emptyState: {
      title: "No themes yet",
      description:
        "A theme is a set of design tokens you can apply to any component.",
    },
    tabs: PUBLICATION_TABS,
    payloadSchema: themePayloadSchema,
    editorMode: "tokens",
  },
  ascii: {
    kind: "ascii",
    label: "ASCII art",
    pluralLabel: "ASCII art",
    icon: Type,
    emptyState: {
      title: "No ASCII art yet",
      description: "Turn text and images into character art.",
    },
    tabs: VISIBILITY_TABS,
    payloadSchema: asciiPayloadSchema,
    editorMode: "text",
  },
  gradient: {
    kind: "gradient",
    label: "Gradient",
    pluralLabel: "Gradients",
    icon: Waves,
    emptyState: {
      title: "No gradients yet",
      description: "Create a gradient in the editor and save it here.",
    },
    tabs: VISIBILITY_TABS,
    payloadSchema: gradientPayloadSchema,
    editorMode: "webgl",
  },
  shader: {
    kind: "shader",
    label: "Shader",
    pluralLabel: "Shaders",
    icon: Sparkles,
    emptyState: {
      title: "No shaders yet",
      description: "Write GLSL and preview it live.",
    },
    tabs: VISIBILITY_TABS,
    payloadSchema: shaderPayloadSchema,
    editorMode: "glsl",
  },
}

export const getKindConfig = (kind: ArtifactKind): ArtifactKindConfig => {
  const config = ARTIFACT_REGISTRY[kind]
  if (!config) {
    // Reachable from a URL segment or a database row, neither of which the type
    // system constrains, so this is a real guard rather than an assertion.
    throw new Error(`Unknown artifact kind: ${kind}`)
  }
  return config
}

export const isArtifactKind = (value: unknown): value is ArtifactKind =>
  typeof value === "string" &&
  (ARTIFACT_KINDS as readonly string[]).includes(value)
