---
name: report:claymorphism-3d-redesign-gemini-prompt-templates
description: "Gemini prompt template library for matte-clay 3D asset generation (Phase 2 input)"
date: 14-07-26
metadata:
  node_type: memory
  type: references
  feature: claymorphism-3d-redesign
  phase: phase-01
---

# Gemini Prompt Template Library — Matte-Clay 3D Assets

**Program:** claymorphism-3d-redesign · **Phase:** 01 (architecture only — no generation runs here)
**Consumed by:** Phase 2 asset-generation pipeline.

## TL;DR

Three per-asset-type prompt templates (clay UI icons / 3D illustrations & avatars / matte
background textures). Each pairs human-readable prose with a machine-parseable JSON block of shape
`{id, model, stylePrefix, subjectTemplate, negativePrompt, aspectRatio, paletteHex[]}`. A single
shared `stylePrefix` locks the matte-clay look. Every `negativePrompt` bans baked-in drop shadows —
CSS supplies the real shadow via `.clay-surface`. The `model` field is the literal placeholder
`"CONFIRM AT PHASE 2"` and MUST NOT be replaced with a real model id in this doc.

---

## Palette lock (hex — derived from `apps/web/app/globals.css` cozy-daylight `:root` tokens)

These hex values are the sRGB conversions of the HSL custom properties shipped in
`apps/web/app/globals.css`. They MUST stay in sync with that file (Agent-Probe cross-check gate).

| Token | globals.css HSL | Hex |
|---|---|---|
| background (warm cream) | `258 42% 94%` | `#ede9f6` |
| foreground (soft ink) | `25 25% 20%` | `#403126` |
| primary (lavender) | `255 55% 72%` | `#a490df` |
| `--accent-pink` | `342 78% 84%` | `#f6b6c9` |
| `--accent-peach` | `34 92% 80%` | `#fbd29d` |
| `--accent-blue` | `205 82% 82%` | `#abd7f7` |
| `--accent-mint` | `158 52% 78%` | `#aae4cf` |
| `--accent-yellow` (new, Phase 1) | `48 90% 78%` | `#f9e594` |

The shared `paletteHex[]` array below uses these exact codes.

---

## Shared style prefix (reused by all three templates)

> Matte clay 3D render, soft pastel color palette, no gloss, no specular highlights, no reflective
> surfaces; single soft key light from the upper-left producing gentle self-shading; isometric or
> 3/4 angle; smooth rounded plasticine/clay forms with subtle surface grain; transparent
> background; centered subject; consistent scale. Colors restricted to the pastel palette:
> lavender #a490df, soft pink #f6b6c9, peach #fbd29d, sky blue #abd7f7, mint #aae4cf,
> warm yellow #f9e594, warm cream #ede9f6.

---

## Template 1 — Clay UI icons

Small nav / feature / interaction icons (play button, heart, dashboard tile, bell, gear). Compact,
single-subject, high legibility at small sizes.

```json
{
  "id": "clay-ui-icon",
  "model": "CONFIRM AT PHASE 2",
  "stylePrefix": "Matte clay 3D render, soft pastel color palette, no gloss, no specular highlights, no reflective surfaces; single soft key light from the upper-left producing gentle self-shading; isometric or 3/4 angle; smooth rounded plasticine/clay forms with subtle surface grain; transparent background; centered subject; consistent scale. Colors restricted to the pastel palette: lavender #a490df, soft pink #f6b6c9, peach #fbd29d, sky blue #abd7f7, mint #aae4cf, warm yellow #f9e594, warm cream #ede9f6.",
  "subjectTemplate": "A single clay {icon_subject} icon (e.g. play button, heart, bell, gear, dashboard tile), simple and bold, readable at 48px, one dominant pastel accent color with soft rounded edges.",
  "negativePrompt": "no baked-in drop shadow, no cast shadow on ground, no floor, no reflection, no gloss, no gl, no text, no watermark, no photorealism, no harsh contrast, no dark background",
  "aspectRatio": "1:1",
  "paletteHex": ["#a490df", "#f6b6c9", "#fbd29d", "#abd7f7", "#aae4cf", "#f9e594", "#ede9f6"]
}
```

## Template 2 — 3D illustrations & avatars

Larger hero/feature illustrations: characters, plants, abstract shapes, mascots. More detail,
still matte-clay and palette-locked.

```json
{
  "id": "clay-illustration-avatar",
  "model": "CONFIRM AT PHASE 2",
  "stylePrefix": "Matte clay 3D render, soft pastel color palette, no gloss, no specular highlights, no reflective surfaces; single soft key light from the upper-left producing gentle self-shading; isometric or 3/4 angle; smooth rounded plasticine/clay forms with subtle surface grain; transparent background; centered subject; consistent scale. Colors restricted to the pastel palette: lavender #a490df, soft pink #f6b6c9, peach #fbd29d, sky blue #abd7f7, mint #aae4cf, warm yellow #f9e594, warm cream #ede9f6.",
  "subjectTemplate": "A friendly clay {illustration_subject} (e.g. rounded character, potted plant, abstract blob, mascot), full form, gentle expression, multiple pastel accents combined harmoniously, soft rounded silhouette.",
  "negativePrompt": "no baked-in drop shadow, no cast shadow on ground, no floor, no reflection, no gloss, no text, no watermark, no photorealism, no harsh contrast, no dark background, no busy detail",
  "aspectRatio": "1:1",
  "paletteHex": ["#a490df", "#f6b6c9", "#fbd29d", "#abd7f7", "#aae4cf", "#f9e594", "#ede9f6"]
}
```

## Template 3 — Matte background textures

Subtle full-bleed background/soft-noise textures for panels and hero sections. Low-contrast, tiling
or full-frame, no focal subject.

```json
{
  "id": "clay-background-texture",
  "model": "CONFIRM AT PHASE 2",
  "stylePrefix": "Matte clay 3D render, soft pastel color palette, no gloss, no specular highlights, no reflective surfaces; single soft key light from the upper-left producing gentle self-shading; isometric or 3/4 angle; smooth rounded plasticine/clay forms with subtle surface grain; transparent background; centered subject; consistent scale. Colors restricted to the pastel palette: lavender #a490df, soft pink #f6b6c9, peach #fbd29d, sky blue #abd7f7, mint #aae4cf, warm yellow #f9e594, warm cream #ede9f6.",
  "subjectTemplate": "A subtle matte clay {texture_subject} background (e.g. soft noise grain, gentle rolling clay hills, scattered rounded pastel shapes), very low contrast, seamless, no focal point, warm cream base.",
  "negativePrompt": "no baked-in drop shadow, no cast shadow, no reflection, no gloss, no text, no watermark, no photorealism, no harsh contrast, no dark background, no sharp edges, no focal subject",
  "aspectRatio": "16:9",
  "paletteHex": ["#ede9f6", "#a490df", "#f6b6c9", "#fbd29d", "#abd7f7", "#aae4cf", "#f9e594"]
}
```

---

## Notes for Phase 2

- The `model` field is a deliberate placeholder. Phase 2 confirms the exact Gemini image model id
  (via `vc-docs-seeker`) before wiring it into the ops generation script.
- `GEMINI_API_KEY` is present in `apps/web/.env.local` but plain Node `ops/` scripts do NOT
  auto-load that file (Next.js-only runtime behavior). Phase 2's pipeline must explicitly load env
  from `apps/web/.env.local` or the user duplicates the key to a root env file.
- Generated assets must ship WITHOUT their own shadows; `.clay-surface` in `globals.css` provides
  the real light-TL / dark-BR / outer clay depth at render time.
