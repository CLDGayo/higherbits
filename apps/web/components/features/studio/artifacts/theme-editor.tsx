"use client"

import { useMemo, useState } from "react"
import { Editor } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { Globe, Loader2, Lock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { editorOptions, editorThemes } from "@/components/features/publish/config/editor-themes"
import {
  setArtifactStatusAction,
  setArtifactVisibilityAction,
  updateArtifactAction,
} from "@/lib/api/artifacts"
import { cn } from "@/lib/utils"

import { ThemePreviewPair, type ThemePayload } from "./theme-preview"
import { useArtifactSlug } from "./use-artifact-slug"

/**
 * Theme editor (Phase 09, §6.5).
 *
 * **Deviation from the plan, recorded deliberately.** §6.5 says to reuse the
 * Monaco/Sandpack editor infrastructure in `studio/editor/`. That module is
 * bound to Sandpack throughout - `EditorCodePanel` and even `SimpleEditor` call
 * `useActiveCode()` and render `SandpackCodeEditor`, which need a Sandpack
 * provider holding a virtual file system. A theme payload is a token map: no
 * files, no dependencies, nothing to bundle. Mounting a sandbox to edit a JSON
 * object would be the "second editor stack" the plan's blocker list warns
 * against, arrived at from the other direction.
 *
 * So: a token form is the primary editor, because a map of names to values is
 * what a form is for. The raw JSON escape hatch uses `@monaco-editor/react`
 * directly, which is already an established standalone pattern here - see
 * `publish/components/code-editor.tsx` - and shares its `editorThemes` and
 * `editorOptions`. No new dependency and no new stack.
 */

const TOKEN_PRESETS = [
  "--background",
  "--foreground",
  "--primary",
  "--primary-foreground",
  "--muted",
  "--muted-foreground",
  "--border",
] as const

type Scheme = "light" | "dark"

export function ThemeEditor({
  artifact,
  onSaved,
}: {
  artifact: {
    id: string
    name: string
    slug: string
    payload: unknown
    is_public: boolean
    status: "draft" | "published"
  }
  onSaved?: () => void
}) {
  const { resolvedTheme } = useTheme()
  const [name, setName] = useState(artifact.name)
  const [payload, setPayload] = useState<ThemePayload>(() => {
    const value = (artifact.payload ?? {}) as Partial<ThemePayload>
    return { light: value.light ?? {}, dark: value.dark ?? {}, radius: value.radius }
  })
  const [scheme, setScheme] = useState<Scheme>("light")
  const [showJson, setShowJson] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState(artifact.status)
  const [isPublic, setIsPublic] = useState(artifact.is_public)

  const slug = useArtifactSlug({
    kind: "theme",
    name,
    initialSlug: artifact.slug,
    excludeId: artifact.id,
  })

  const tokens = payload[scheme]

  const rows = useMemo(() => {
    // Presets first so a new theme has obvious starting points, then whatever
    // else the theme already defines.
    const extra = Object.keys(tokens).filter(
      (token) => !TOKEN_PRESETS.includes(token as (typeof TOKEN_PRESETS)[number]),
    )
    return [...TOKEN_PRESETS, ...extra]
  }, [tokens])

  const setToken = (token: string, value: string) => {
    setPayload((prev) => {
      const next = { ...prev[scheme] }
      // An emptied field removes the token rather than storing "", which would
      // resolve to an empty custom property and override a fallback with nothing.
      if (value.trim() === "") delete next[token]
      else next[token] = value
      return { ...prev, [scheme]: next }
    })
  }

  const applyJson = (raw: string | undefined) => {
    if (raw === undefined) return
    try {
      setPayload(JSON.parse(raw))
      setJsonError(null)
    } catch (error) {
      // Kept local: the server would reject it anyway, but failing here means
      // the preview never renders a half-typed object.
      setJsonError(error instanceof Error ? error.message : "Invalid JSON")
    }
  }

  const save = async () => {
    if (!slug.canSubmit) {
      toast.error(
        slug.status === "taken"
          ? "That slug is already used by one of your themes"
          : "Pick a valid slug before saving",
      )
      return
    }

    setIsSaving(true)
    try {
      const result = await updateArtifactAction({
        id: artifact.id,
        name,
        slug: slug.slug,
        payload,
      })

      if (!result.ok) {
        // Server-side validation is authoritative; surface exactly what it said
        // rather than a generic failure.
        toast.error(result.issues.join("; "))
        return
      }

      toast.success("Theme saved")
      onSaved?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save")
    } finally {
      setIsSaving(false)
    }
  }

  const togglePublished = async () => {
    const next = status === "published" ? "draft" : "published"
    try {
      await setArtifactStatusAction({ id: artifact.id, status: next })
      setStatus(next)
      toast.success(next === "published" ? "Theme published" : "Moved to drafts")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update")
    }
  }

  const toggleVisibility = async () => {
    const next = !isPublic
    try {
      await setArtifactVisibilityAction({ id: artifact.id, isPublic: next })
      setIsPublic(next)
      toast.success(next ? "Theme is public" : "Theme is private")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update")
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:max-w-sm">
        <div className="space-y-2">
          <Label htmlFor="theme-name">Name</Label>
          <Input
            id="theme-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme-slug">Slug</Label>
          <Input
            id="theme-slug"
            value={slug.slug}
            onChange={(event) => slug.setSlug(event.target.value)}
            aria-invalid={slug.status === "invalid" || slug.status === "taken"}
          />
          <p
            className={cn(
              "text-xs",
              slug.status === "taken" || slug.status === "invalid"
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {slug.status === "checking" && "Checking…"}
            {slug.status === "available" && "Available"}
            {slug.status === "taken" && "You already have a theme with this slug"}
            {slug.status === "invalid" &&
              "Lowercase letters, numbers and hyphens only"}
            {slug.status === "idle" && "Generated from the name"}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {(["light", "dark"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setScheme(value)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm capitalize transition-colors",
                scheme === value
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>

        {showJson ? (
          <div className="space-y-2">
            <div className="h-72 overflow-hidden rounded-lg border border-border">
              <Editor
                height="100%"
                language="json"
                theme={resolvedTheme === "dark" ? "github-dark" : "github-light"}
                beforeMount={(monaco) => {
                  monaco.editor.defineTheme("github-dark", editorThemes.dark)
                  monaco.editor.defineTheme("github-light", editorThemes.light)
                }}
                options={{ ...editorOptions, minimap: { enabled: false } }}
                value={JSON.stringify(payload, null, 2)}
                onChange={applyJson}
              />
            </div>
            {jsonError && (
              <p className="text-xs text-destructive">{jsonError}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((token) => (
              <div key={token} className="flex items-center gap-2">
                <Label
                  htmlFor={`token-${token}`}
                  className="w-40 shrink-0 font-mono text-xs"
                >
                  {token}
                </Label>
                <Input
                  id={`token-${token}`}
                  value={tokens[token] ?? ""}
                  placeholder="unset"
                  onChange={(event) => setToken(token, event.target.value)}
                  className="font-mono text-xs"
                />
                <span
                  aria-hidden
                  className="h-8 w-8 shrink-0 rounded border border-border"
                  style={{ background: tokens[token] || "transparent" }}
                />
              </div>
            ))}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowJson((prev) => !prev)}
        >
          {showJson ? "Back to token fields" : "Edit as JSON"}
        </Button>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button onClick={save} disabled={isSaving || !slug.canSubmit}>
            {isSaving && <Loader2 size={16} className="mr-1.5 animate-spin" />}
            Save
          </Button>
          <Button variant="outline" onClick={togglePublished}>
            {status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button variant="outline" onClick={toggleVisibility} className="gap-1.5">
            {isPublic ? <Globe size={16} /> : <Lock size={16} />}
            {isPublic ? "Public" : "Private"}
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <ThemePreviewPair payload={payload} />
      </div>
    </div>
  )
}
