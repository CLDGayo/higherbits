"use client"

import type { CSSProperties, Ref } from "react"
import {
  GrainGradient,
  MeshGradient,
  StaticRadialGradient,
  Waves,
  type GrainGradientProps,
  type MeshGradientProps,
  type PaperShaderElement,
  type StaticRadialGradientProps,
  type WavesProps,
} from "@paper-design/shaders-react"

import { resolveGradientRender } from "./gradient-form-props"
import type { GradientPayload } from "./registry"

/**
 * The runtime wrapper (Phase 10b, §10b.1) - the shared seam 10c also
 * imports. Mapping decisions live in `gradient-form-props.ts`; this file is
 * the thin part that actually mounts `@paper-design/shaders-react`,
 * `0.0.80`, exact-pinned.
 *
 * The seam exists because the library is pre-1.0 and ships breaking changes
 * under `0.0.x` (its own README says so). One module absorbing an upgrade
 * beats reconciling every call site that imported the library directly.
 */

export interface GradientRuntimeProps {
  payload: GradientPayload
  className?: string
  style?: CSSProperties
  /**
   * Pass-through to the mounted shader component. PNG export (§10b.7) uses
   * these to render off-screen at exact export dimensions rather than
   * upscaling the on-screen preview.
   */
  width?: number
  height?: number
  minPixelRatio?: number
  ref?: Ref<PaperShaderElement>
}

export function GradientRuntime({
  payload,
  ...passthrough
}: GradientRuntimeProps) {
  const { component, props } = resolveGradientRender(payload)

  switch (component) {
    case "MeshGradient":
      return (
        <MeshGradient {...(props as MeshGradientProps)} {...passthrough} />
      )
    case "StaticRadialGradient":
      return (
        <StaticRadialGradient
          {...(props as StaticRadialGradientProps)}
          {...passthrough}
        />
      )
    case "GrainGradient":
      return (
        <GrainGradient {...(props as GrainGradientProps)} {...passthrough} />
      )
    case "Waves":
      return <Waves {...(props as WavesProps)} {...passthrough} />
  }
}
