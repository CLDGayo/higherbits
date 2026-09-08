import type { ShaderPayload } from "../../registry"

/**
 * Starting points (Phase 10c, §10c.3).
 *
 * Every one of these is compiled by `__tests__/shader-harness.test.ts` against
 * the harness template, so a preset cannot ship broken - G10c.3. Keep them
 * short: a preset is a thing to read and then edit, not a finished artwork.
 */
export interface ShaderPreset {
  id: string
  label: string
  payload: ShaderPayload
}

export const SHADER_PRESETS: ShaderPreset[] = [
  {
    id: "ribbon",
    label: "Ribbon",
    payload: {
      body: `vec3 a = colorA;
vec3 b = colorB;
float w = 0.5 + 0.5 * sin(uv.x * 6.2831 * frequency + t);
return mix(a, b, w * uv.y);`,
      uniforms: [
        { name: "colorA", label: "Colour A", type: "color", value: "#7c3aed" },
        { name: "colorB", label: "Colour B", type: "color", value: "#f472b6" },
        { name: "frequency", label: "Frequency", type: "float", value: 1, min: 0, max: 8 },
      ],
      motion: { animate: true, speed: 1 },
    },
  },
  {
    id: "drift",
    label: "Drift",
    payload: {
      body: `vec2 p = uv * scale;
float n = fbm(p + vec2(t * 0.15, 0.0));
return mix(colorA, colorB, smoothstep(0.25, 0.75, n));`,
      uniforms: [
        { name: "colorA", label: "Low", type: "color", value: "#0b1026" },
        { name: "colorB", label: "High", type: "color", value: "#60a5fa" },
        { name: "scale", label: "Scale", type: "float", value: 3, min: 0.5, max: 12 },
      ],
      motion: { animate: true, speed: 0.6 },
    },
  },
  {
    id: "rings",
    label: "Rings",
    payload: {
      body: `vec2 p = uv - 0.5;
float d = length(p);
float band = fract(d * rings - t * 0.25);
float edge = smoothstep(0.45, 0.5, band) * smoothstep(0.55, 0.5, band);
return mix(colorA, colorB, edge);`,
      uniforms: [
        { name: "colorA", label: "Field", type: "color", value: "#0b0b12" },
        { name: "colorB", label: "Ring", type: "color", value: "#fbbf24" },
        { name: "rings", label: "Rings", type: "float", value: 8, min: 1, max: 40 },
      ],
      motion: { animate: true, speed: 1 },
    },
  },
  {
    id: "still",
    label: "Still gradient",
    payload: {
      // Deliberately time-independent, and shipped with animate off, so the
      // section has one example proving a static shader does no per-frame work.
      body: `return palette(uv.x, colorA, colorB, vec3(1.0), vec3(0.0, 0.33, 0.67));`,
      uniforms: [
        { name: "colorA", label: "Base", type: "color", value: "#1e1b4b" },
        { name: "colorB", label: "Range", type: "color", value: "#a78bfa" },
      ],
      motion: { animate: false, speed: 0 },
    },
  },
]
