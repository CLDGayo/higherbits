"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  libraryIdentifier,
  libraryInstallCommand,
  libraryNamespace,
  type LibraryOwner,
} from "@/lib/utils/library-identity"

/**
 * The install line for a library, derived rather than stored (umbrella D2-R).
 *
 * Renders nothing when the owner has no handle - `@null/slug` would be worse
 * than showing no command at all.
 */
export function LibraryInstallCommand({
  slug,
  owner,
}: {
  slug: string
  owner: LibraryOwner | null
}) {
  const [copied, setCopied] = useState(false)

  const namespace = libraryNamespace(owner)
  if (!namespace) return null

  const command = libraryInstallCommand(libraryIdentifier(namespace, slug))

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    toast.success("Install command copied")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-4 flex max-w-md items-center gap-2">
      <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 font-mono text-xs">
        {command}
      </code>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleCopy}
        aria-label="Copy install command"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </Button>
    </div>
  )
}
