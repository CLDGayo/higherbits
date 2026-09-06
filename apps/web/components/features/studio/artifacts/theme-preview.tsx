"use client"

import type React from "react"

import { cn } from "@/lib/utils"

import { registerPreviewRenderer } from "./registry"

/**
 * Theme preview renderer (Phase 09, §6.5).
 *
 * Applies a theme's tokens as CSS custom properties on a scoped container and
 * renders a small specimen inside it. Nothing is injected into a stylesheet and
 * no <style> tag is written: the tokens go through React's `style` prop, so
 * values are set as properties rather than parsed as CSS text. A value cannot
 * escape into a new declaration even if the schema's guard were loosened later.
 *
 * The specimen deliberately uses the same token names shadcn components consume
 * (--background, --foreground, --primary, …), so what renders here is what the
 * component library would do with the theme.
 */

export interface ThemePayload {
  light: Record<string, string>
  dark: Record<string, string>
  radius?: string
}

/** Narrows the JSONB blob without trusting it. */
const asThemePayload = (payload: unknown): ThemePayload => {
  const value = (payload ?? {}) as Partial<ThemePayload>
  return {
    light: value.light ?? {},
    dark: value.dark ?? {},
    radius: value.radius,
  }
}

export const toCssVars = (
  tokens: Record<string, string>,
  radius?: string,
): React.CSSProperties => {
  const style: Record<string, string> = {}
  for (const [key, value] of Object.entries(tokens)) {
    // Belt and braces against a row written before the schema was tightened, or
    // by any future path that skips validatePayload.
    if (!/^--[a-z0-9-]+$/.test(key)) continue
    style[key] = value
  }
  if (radius) style["--radius"] = radius
  return style as React.CSSProperties
}

export function ThemePreview({
  payload,
  scheme = "light",
  className,
}: {
  payload: unknown
  scheme?: "light" | "dark"
  className?: string
}) {
  const theme = asThemePayload(payload)
  const tokens = scheme === "dark" ? theme.dark : theme.light
  const isEmpty = Object.keys(tokens).length === 0

  return (
    <div
      style={toCssVars(tokens, theme.radius)}
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4",
        // Falls back to the app's own tokens when the theme does not define
        // them, so an empty or partial theme still renders something legible
        // rather than collapsing to unstyled text.
        "border-[var(--border,theme(colors.border))] bg-[var(--background,theme(colors.background))] text-[var(--foreground,theme(colors.foreground))]",
        className,
      )}
      data-scheme={scheme}
    >
      {isEmpty ? (
        <p className="text-sm text-muted-foreground">
          No {scheme} tokens defined yet.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-8 items-center rounded-[var(--radius,0.5rem)] px-3 text-sm font-medium"
              style={{
                background: "var(--primary, #7c3aed)",
                color: "var(--primary-foreground, white)",
              }}
            >
              Primary
            </span>
            <span
              className="inline-flex h-8 items-center rounded-[var(--radius,0.5rem)] border px-3 text-sm"
              style={{
                borderColor: "var(--border, currentColor)",
                color: "var(--foreground, inherit)",
              }}
            >
              Outline
            </span>
          </div>

          <p className="text-sm" style={{ color: "var(--foreground, inherit)" }}>
            The quick brown fox.
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--muted-foreground, #6b7280)" }}
          >
            Muted supporting copy.
          </p>

          <div className="flex flex-wrap gap-1.5">
            {Object.entries(tokens)
              .slice(0, 12)
              .map(([token, value]) => (
                <span
                  key={token}
                  title={`${token}: ${value}`}
                  className="h-5 w-5 rounded border border-black/10"
                  style={{ background: value }}
                />
              ))}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Both schemes side by side - what the list card and the editor's preview pane
 * show, since a theme that only works in one scheme is the common failure.
 */
export function ThemePreviewPair({
  payload,
  className,
}: {
  payload: unknown
  className?: string
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <ThemePreview payload={payload} scheme="light" />
      <ThemePreview payload={payload} scheme="dark" />
    </div>
  )
}

registerPreviewRenderer("theme", ({ payload, className }) => (
  <ThemePreviewPair payload={payload} className={className} />
))
