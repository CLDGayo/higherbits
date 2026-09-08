import { GRADIENT_FORMS, type GradientPayload } from "../../registry"

/**
 * Deterministic parameter randomizers for Inspire / Recolour / Restyle
 * (Phase 10b, §10b.5) - ruled at §7.0: mechanical randomisers, no LLM.
 * "Deterministic" here means algorithmic, not reproducible from a seed - the
 * property that matters is that each function only ever touches its
 * documented field group, checked below and in the test file with
 * before/after payloads (G10b.11).
 *
 * Pure and DOM-free: each function takes a payload and returns a new one, so
 * `GradientActionBar` is a thin wrapper calling `setPayload(recolour)`.
 */

const randomInRange = (min: number, max: number) => min + Math.random() * (max - min)

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** HSL rather than raw RGB so a randomised colour is not muddy or unreadable. */
function randomHex(): string {
  const hue = Math.floor(Math.random() * 360)
  const saturation = 45 + Math.random() * 40
  const lightness = 35 + Math.random() * 35
  return hslToHex(hue, saturation, lightness)
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const light = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(light, 1 - light)
  const f = (n: number) =>
    light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (n: number) =>
    Math.round(f(n) * 255)
      .toString(16)
      .padStart(2, "0")
  return `#${toHex(0)}${toHex(8)}${toHex(4)}`
}

/** Palette only: every stop's hex plus the base colour. */
export function recolour(payload: GradientPayload): GradientPayload {
  return {
    ...payload,
    baseColour: randomHex(),
    stops: payload.stops.map((stop) => ({ ...stop, hex: randomHex() })),
  }
}

/** Form and geometry only: which form renders, and its scale/distortion. */
export function restyle(payload: GradientPayload): GradientPayload {
  const form = GRADIENT_FORMS[Math.floor(Math.random() * GRADIENT_FORMS.length)]
  // GRADIENT_FORMS is a non-empty const tuple; the fallback below only
  // satisfies noUncheckedIndexedAccess, it is not a reachable default.
  const formId = form?.id ?? payload.formId
  return {
    ...payload,
    formId,
    geometry: {
      scale: round(randomInRange(0.5, 3), 2),
      distortion: round(randomInRange(0, 1), 2),
    },
  }
}

/**
 * Fisher-Yates shuffle of stop order, backing the Form panel's "Rearrange"
 * button. Order-only: no stop's name or hex changes, only which position in
 * the array it occupies - which is visible because it changes the gradient's
 * colour sequence without touching any other control.
 */
export function shuffleStops(payload: GradientPayload): GradientPayload {
  const stops = [...payload.stops]
  for (let i = stops.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = stops[i]
    const b = stops[j]
    if (a === undefined || b === undefined) continue
    stops[i] = b
    stops[j] = a
  }
  return { ...payload, stops }
}

/** Backs the Form panel's "Reset" button - geometry only, back to the default. */
export function resetGeometry(payload: GradientPayload): GradientPayload {
  return { ...payload, geometry: { scale: 1, distortion: 0.5 } }
}

/** Everything: form bar's documented "changes everything" action. */
export function inspire(payload: GradientPayload): GradientPayload {
  const restyled = restyle(payload)
  const recoloured = recolour(payload)
  return {
    formId: restyled.formId,
    geometry: restyled.geometry,
    stops: recoloured.stops,
    baseColour: recoloured.baseColour,
    surface: {
      blur: Math.floor(randomInRange(0, 64)),
      grain: Math.floor(randomInRange(0, 100)),
      edgeShade: Math.floor(randomInRange(0, 100)),
    },
    motion: { animate: Math.random() < 0.5 },
  }
}
