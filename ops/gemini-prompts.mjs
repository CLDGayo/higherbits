/**
 * gemini-prompts.mjs
 *
 * Static data module for the Phase 2 claymorphism asset-generation pipeline.
 * Duplicates the 3 JSON template blocks from
 *   process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26/gemini-prompt-templates_REF_14-07-26.md
 * directly in code (D4 — static data module, no doc parsing).
 *
 * HEX PALETTE LOCK (E3): the hex values below MUST match the _REF_ doc / globals.css
 * palette exactly — lavender #a490df, soft pink #f6b6c9, peach #fbd29d, sky blue #abd7f7,
 * mint #aae4cf, warm yellow #f9e594, warm cream #ede9f6. A transcription slip here silently
 * desyncs generated assets from the locked palette. Diff byte-for-byte before changing.
 *
 * The `model` field is intentionally ABSENT from these templates — the model id comes from
 * GEMINI_IMAGE_MODEL (or the confirmed default), never from the prompt data.
 */

const SHARED_STYLE_PREFIX =
  "Matte clay 3D render, soft pastel color palette, no gloss, no specular highlights, no reflective surfaces; single soft key light from the upper-left producing gentle self-shading; isometric or 3/4 angle; smooth rounded plasticine/clay forms with subtle surface grain; transparent background; centered subject; consistent scale. Colors restricted to the pastel palette: lavender #a490df, soft pink #f6b6c9, peach #fbd29d, sky blue #abd7f7, mint #aae4cf, warm yellow #f9e594, warm cream #ede9f6."

const PALETTE_HEX = ["#a490df", "#f6b6c9", "#fbd29d", "#abd7f7", "#aae4cf", "#f9e594", "#ede9f6"]

/** Template 1 — Clay UI icons */
export const ICON_TEMPLATE = {
  id: "clay-ui-icon",
  stylePrefix: SHARED_STYLE_PREFIX,
  subjectTemplate:
    "A single clay {icon_subject} icon (e.g. play button, heart, bell, gear, dashboard tile), simple and bold, readable at 48px, one dominant pastel accent color with soft rounded edges.",
  negativePrompt:
    "no baked-in drop shadow, no cast shadow on ground, no floor, no reflection, no gloss, no gl, no text, no watermark, no photorealism, no harsh contrast, no dark background",
  aspectRatio: "1:1",
  paletteHex: PALETTE_HEX,
}

/** Template 2 — 3D illustrations & avatars */
export const ILLUSTRATION_TEMPLATE = {
  id: "clay-illustration-avatar",
  stylePrefix: SHARED_STYLE_PREFIX,
  subjectTemplate:
    "A friendly clay {illustration_subject} (e.g. rounded character, potted plant, abstract blob, mascot), full form, gentle expression, multiple pastel accents combined harmoniously, soft rounded silhouette.",
  negativePrompt:
    "no baked-in drop shadow, no cast shadow on ground, no floor, no reflection, no gloss, no text, no watermark, no photorealism, no harsh contrast, no dark background, no busy detail",
  aspectRatio: "1:1",
  paletteHex: PALETTE_HEX,
}

/** Template 3 — Matte background textures */
export const TEXTURE_TEMPLATE = {
  id: "clay-background-texture",
  stylePrefix: SHARED_STYLE_PREFIX,
  subjectTemplate:
    "A subtle matte clay {texture_subject} background (e.g. soft noise grain, gentle rolling clay hills, scattered rounded pastel shapes), very low contrast, seamless, no focal point, warm cream base.",
  negativePrompt:
    "no baked-in drop shadow, no cast shadow, no reflection, no gloss, no text, no watermark, no photorealism, no harsh contrast, no dark background, no sharp edges, no focal subject",
  aspectRatio: "16:9",
  paletteHex: ["#ede9f6", "#a490df", "#f6b6c9", "#fbd29d", "#abd7f7", "#aae4cf", "#f9e594"],
}

export const TEMPLATES = {
  icon: ICON_TEMPLATE,
  illustration: ILLUSTRATION_TEMPLATE,
  texture: TEXTURE_TEMPLATE,
}
