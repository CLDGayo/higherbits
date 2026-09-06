"use client"

import { useMemo, useState } from "react"
import { Editor } from "@monaco-editor/react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  editorOptions,
  editorThemes,
} from "@/components/features/publish/config/editor-themes"

import type { ArtifactBodyProps } from "../../editor-shell"
import type { ThemePayload } from "../../theme-preview"

/**
 * The Themes editor body (Phase 09 §6.5, extracted to a body in Phase 10a §10a.1).
 *
 * Moved out of `theme-editor.tsx` without behaviour change. Everything the shell
 * now owns - name, slug, Save, Publish, visibility, the server calls - left this
 * file; everything that knows what a theme *is* stayed.
 *
 * **Phase 09's deviation note, preserved because it still applies and the next
 * body will face the same choice.** §6.5 said to reuse the Monaco/Sandpack
 * infrastructure in `studio/editor/`. That module is bound to Sandpack
 * throughout - `EditorCodePanel` and even `SimpleEditor` call `useActiveCode()`
 * and render `SandpackCodeEditor`, which need a Sandpack provider holding a
 * virtual file system. A theme payload is a token map: no files, no
 * dependencies, nothing to bundle. Mounting a sandbox to edit a JSON object
 * would be the "second editor stack" the plan's blocker list warns against,
 * arrived at from the other direction.
 *
 * So: a token form is the primary editor, because a map of names to values is
 * what a form is for. The raw JSON escape hatch uses `@monaco-editor/react`
 * directly, which is already an established standalone pattern here - see
 * `publish/components/code-editor.tsx` - and shares its `editorThemes` and
 * `editorOptions`. No new dependency and no new stack.
 *
 * (For the record: `studio/editor/` has had zero importers since `29544e0`
 * deleted `app/test-dead-code/page.tsx`. It could not have been reused.)
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

export function ThemeEditorBody({
  payload,
  setPayload,
}: ArtifactBodyProps<ThemePayload>) {
  const { resolvedTheme } = useTheme()
  const [scheme, setScheme] = useState<Scheme>("light")
  const [showJson, setShowJson] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)

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

  return (
    <>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {(["light", "dark"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setScheme(value)}
            className={
              scheme === value
                ? "flex-1 rounded-md bg-background px-3 py-1.5 text-sm capitalize shadow-sm transition-colors"
                : "flex-1 rounded-md px-3 py-1.5 text-sm capitalize text-muted-foreground transition-colors hover:text-foreground"
            }
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
          {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
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

      <Button variant="ghost" size="sm" onClick={() => setShowJson((prev) => !prev)}>
        {showJson ? "Back to token fields" : "Edit as JSON"}
      </Button>
    </>
  )
}
