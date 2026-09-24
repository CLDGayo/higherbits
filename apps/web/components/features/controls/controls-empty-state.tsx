"use client"

import React, { useState } from "react"
import { Check, Copy, Sliders } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

const SAMPLE_SETTINGS_CODE = `// Add this to your demo.tsx file:
const settings = {
  speed: 500,
  color: "#6366f1",
  interactive: true,
  headline: "Signals, not noise.",
}

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props }
  // Use s.speed, s.color, s.interactive, etc.
  return <YourComponent {...s} />
}`

export function ControlsEmptyState() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SAMPLE_SETTINGS_CODE)
      }
      setCopied(true)
      toast.success("Copied settings snippet to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy snippet")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center h-full max-w-sm mx-auto select-none">
      <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-white/10 flex items-center justify-center mb-3 text-zinc-300">
        <Sliders className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-zinc-100 mb-1.5">
        No Controls Configured
      </h4>
      <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
        Define a module-level <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded font-mono">settings</code> object in <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded font-mono">demo.tsx</code> to automatically generate interactive knobs here and in published previews.
      </p>

      <div className="w-full bg-zinc-900 border border-white/5 rounded-lg p-3 text-left font-mono text-[11px] text-zinc-300 relative group overflow-hidden mb-3">
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy settings snippet"
          className="absolute right-2 top-2 p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
        <pre className="overflow-x-auto pr-8 custom-scrollbar">
          <code>{`const settings = {
  speed: 500,
  color: "#6366f1",
  interactive: true,
}

export default function Demo(
  props: Partial<typeof settings>
) {
  const s = { ...settings, ...props }
  // ...
}`}</code>
        </pre>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="text-xs h-8 gap-1.5 border-white/10 hover:bg-white/5"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span>Copied snippet</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy snippet</span>
          </>
        )}
      </Button>
    </div>
  )
}
