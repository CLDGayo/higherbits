"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, RefreshCw, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { Icons } from "@/components/icons"
import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

// Preserve the existing local-storage key for returning users.
export const higherbitsMcpOnboardingCompletedAtom = atomWithStorage<boolean>(
  "magic_agent_used",
  false,
)

interface CreateComponentStepProps {
  hasCreatedComponent: boolean
  onComplete: (action?: "next" | "troubleshooting") => void
}

export function CreateComponentStep({
  hasCreatedComponent,
  onComplete,
}: CreateComponentStepProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [localHasCreated, setLocalHasCreated] = useState(hasCreatedComponent)
  const [, setHigherBitsMcpOnboardingCompleted] = useAtom(
    higherbitsMcpOnboardingCompletedAtom,
  )

  // Effect to simulate checking for component creation
  useEffect(() => {
    setLocalHasCreated(hasCreatedComponent)
    if (hasCreatedComponent) {
      setHigherBitsMcpOnboardingCompleted(true)
    }
  }, [hasCreatedComponent, setHigherBitsMcpOnboardingCompleted])

  // Add keyboard shortcut for Enter key and Help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        onComplete("next")
      } else if (
        e.code === "KeyH" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey
      ) {
        e.preventDefault()
        onComplete("troubleshooting")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onComplete])

  // Add focus tracking to trigger check status
  useEffect(() => {
    const handleFocus = () => {
      if (!localHasCreated && !isChecking) {
        handleCheckStatus()
      }
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [localHasCreated, isChecking])

  const handleCheckStatus = () => {
    if (isChecking) return
    setIsChecking(true)
    // Simulate checking - in reality this is handled by the parent component's query
    setTimeout(() => {
      setIsChecking(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col space-y-8 px-4 max-w-[700px] mx-auto w-full z-10">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">
          Create Your First Component
        </h1>
        <p className="text-lg text-muted-foreground">
          Let's create your first UI component with HigherBits AI
        </p>
      </div>

      <div className="bg-card rounded-lg max-w-3xl">
        {localHasCreated ? (
          <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-green-800 dark:text-green-400">
                Component Created!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                You've successfully created your first component with HigherBits AI.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {/* Step 1 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                1
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="font-medium">Tell Agent What You Need</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Describe the component you need in your coding assistant's chat;
                    available commands depend on your IDE.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="rounded-md bg-primary/10 p-1.5 text-primary h-7 w-7 flex items-center justify-center shrink-0">
                2
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="font-medium">Retrieve a component</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Ask your coding assistant to use HigherBits MCP to search for a
                    matching component, then retrieve its source.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleCheckStatus}
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check Status
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-5 w-full pt-8 pb-4">
        <div className="flex justify-center w-full gap-2">
          <Button
            variant="outline"
            className="pr-1.5"
            onClick={() => onComplete("troubleshooting")}
          >
            Need help?
            <kbd className="pointer-events-none h-5 w-5 justify-center select-none items-center gap-1 rounded border-muted-foreground/40 bg-foreground/10 px-1.5 ml-1.5 font-sans text-[11px] text-foreground leading-none opacity-100 flex">
              H
            </kbd>
          </Button>
          <Button className="pr-1.5" onClick={() => onComplete("next")}>
            Continue
            <kbd className="pointer-events-none h-5 w-5 justify-center select-none items-center gap-1 rounded border-muted-foreground/40 bg-muted-foreground/20 px-1.5 ml-1.5 font-sans text-[11px] text-kbd leading-none opacity-100 flex">
              <Icons.enter className="h-2.5 w-2.5" />
            </kbd>
          </Button>
        </div>
      </div>
    </div>
  )
}
