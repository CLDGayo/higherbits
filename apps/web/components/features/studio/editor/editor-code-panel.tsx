import React, { useEffect, useRef, useCallback, useMemo, useState } from "react"
import {
  SandpackCodeEditor,
  useActiveCode,
  useSandpack,
} from "@codesandbox/sandpack-react"
import { useCodeManager, useActionRequired } from "./context/editor-state"
import { Loader2 } from "lucide-react"

// Create a persistent file content cache that survives component remounts
const globalFileContentCache = new Map<string, string>()

// Memoize the SandpackCodeEditor to prevent unnecessary re-renders
const MemoizedSandpackCodeEditor = React.memo(SandpackCodeEditor)

interface EditorCodePanelProps {
  onCodeChange?: (code: string) => void
  componentPath: string
}

// Wrap the EditorCodePanel in React.memo for additional performance
export const EditorCodePanel = React.memo(function EditorCodePanel({
  onCodeChange,
  componentPath,
}: EditorCodePanelProps) {
  const { code } = useActiveCode()
  const { sandpack } = useSandpack()
  const prevCodeRef = useRef<string>(undefined)
  const updatingRef = useRef(false)
  const initialCodeRef = useRef<string | null>(null)
  const { markFileAsResolved, isActionRequired, getActionDetails } =
    useActionRequired()
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Add logging to track component rendering with active path
  console.log("[EditorCodePanel] Rendering with:", {
    componentPath,
    sandpackActiveFile: sandpack.activeFile,
    fileExistsInSandpack: componentPath
      ? !!sandpack.files[componentPath]
      : false,
    hasCode: !!code,
  })

  let codeManager
  try {
    codeManager = useCodeManager()
  } catch (error) {
    codeManager = null
  }

  // Normalize the path - only compute this once per componentPath change
  const normalizedPath = useMemo(
    () => componentPath.replace(/^@\//, "/"),
    [componentPath],
  )

  // Check if this is an unknown component that needs action - memoize this value
  const isUnresolvedDependency = useMemo(
    () => codeManager?.isUnresolvedDependency?.(componentPath) || false,
    [codeManager, componentPath],
  )

  // Store the initial code value for comparison
  useEffect(() => {
    if (code && !initialCodeRef.current) {
      initialCodeRef.current = code
    }
  }, [code])

  // Handle file restoration or creation - use useCallback for better performance
  const handleFileMissing = useCallback(() => {
    if (!normalizedPath || sandpack.files[normalizedPath]) return

    console.log("[EditorCodePanel] File missing check:", {
      normalizedPath,
      fileExists: !!sandpack.files[normalizedPath],
      hasCachedContent: globalFileContentCache.has(normalizedPath),
      isUnresolvedDependency,
      activeFile: sandpack.activeFile,
    })

    // Check if we have cached content for this file
    const cachedContent = globalFileContentCache.get(normalizedPath)

    if (cachedContent) {
      try {
        console.log(
          "[EditorCodePanel] Restoring file from cache:",
          normalizedPath,
        )
        // Restore the file with cached content
        sandpack.addFile(normalizedPath, cachedContent)

        // Set as active file
        sandpack.setActiveFile(normalizedPath)

        // Update the code manager if available
        if (codeManager?.addFile) {
          codeManager.addFile(normalizedPath, cachedContent)
        }
      } catch (error) {
        console.error("[EditorCodePanel] Failed to restore file:", error)
      }
    } else if (codeManager) {
      try {
        console.log("[EditorCodePanel] Creating new file:", normalizedPath)
        // Create the file with placeholder content
        const defaultContent = "// TODO: Implement this component"
        sandpack.addFile(normalizedPath, defaultContent)

        // Set as active file
        sandpack.setActiveFile(normalizedPath)

        // Update the code manager if available
        if (codeManager.addFile) {
          codeManager.addFile(normalizedPath, defaultContent)
        }

        // Add to cache
        globalFileContentCache.set(normalizedPath, defaultContent)
        console.log(
          "[EditorCodePanel] File created and cached:",
          normalizedPath,
        )
      } catch (error) {
        console.error("[EditorCodePanel] Failed to create file:", error)
      }
    }
  }, [normalizedPath, sandpack, codeManager, isUnresolvedDependency])

  useEffect(() => {
    // If the file doesn't exist and we have a valid path, create it or restore it
    handleFileMissing()

    // Create a stable interval that checks for file existence periodically
    // This helps ensure the file is restored if it gets deleted during component lifecycle
    const intervalId = setInterval(() => {
      if (normalizedPath && !sandpack.files[normalizedPath]) {
        handleFileMissing()
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [
    normalizedPath,
    sandpack.activeFile,
    sandpack.files,
    isUnresolvedDependency,
    handleFileMissing,
  ])

  // Handle code updates and cache code
  const handleCodeUpdate = useCallback(() => {
    if (updatingRef.current || prevCodeRef.current === code || !code) {
      return
    }

    prevCodeRef.current = code

    if (sandpack.activeFile === normalizedPath) {
      // Cache the file content to prevent loss on remounts
      globalFileContentCache.set(normalizedPath, code)

      setIsSaving(true)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        setIsSaving(false)
      }, 500)

      // Check both path formats (with and without @/ prefix)
      const pathWithPrefix = `@${normalizedPath}`

      // Automatically resolve any "unresolved_dependencies" action required status
      // when file content changes, regardless of content - check both path formats
      const checkAndResolveActionRequired = (path: string) => {
        if (isActionRequired(path)) {
          const actionDetails = getActionDetails(path)
          if (
            actionDetails &&
            actionDetails.reason === "unresolved_dependencies"
          ) {
            markFileAsResolved(path)
          }
        }
      }

      // Check both path formats
      checkAndResolveActionRequired(normalizedPath)
      checkAndResolveActionRequired(pathWithPrefix)

      if (codeManager && normalizedPath) {
        try {
          updatingRef.current = true
          codeManager.updateFileContent(normalizedPath, code)
          setTimeout(() => {
            updatingRef.current = false
          }, 50)
        } catch (error) {
          console.error("[EditorCodePanel] Error updating file content", error)
          updatingRef.current = false
        }
      }

      if (onCodeChange) {
        onCodeChange(code)
      }
    }
  }, [
    code,
    onCodeChange,
    sandpack.activeFile,
    componentPath,
    normalizedPath,
    codeManager,
    markFileAsResolved,
    isUnresolvedDependency,
    isActionRequired,
    getActionDetails,
  ])

  // Call the update handler when code changes
  useEffect(() => {
    handleCodeUpdate()
  }, [handleCodeUpdate])

  // Memoize props for SandpackCodeEditor to prevent unnecessary re-renders
  const editorProps = useMemo(
    () => ({
      showTabs: false,
      showLineNumbers: true,
      showInlineErrors: true,
      className: "h-full",
      style: { height: "100%" },
      initMode: "immediate" as const,
    }),
    [],
  )

  // Format the path nicely like "project / sandbox / src / components / ui / component.tsx"
  const formatPath = (path: string) => {
    if (!path) return ""
    // Remove leading slash if any
    const cleanPath = path.startsWith('/') ? path.substring(1) : path
    return cleanPath.split('/').join(' / ')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="flex-1 min-h-0">
        <MemoizedSandpackCodeEditor {...editorProps} />
      </div>
      <div className="h-[34px] min-h-[34px] border-t border-border flex items-center px-4 justify-between bg-zinc-950 text-[13px] text-muted-foreground font-medium z-10 shrink-0">
        <div className="flex items-center gap-1.5 opacity-80 truncate">
          <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span className="truncate">{formatPath(sandpack.activeFile || componentPath)}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 pl-4">
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="opacity-80">Saving...</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="opacity-80">Saved</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
})

interface SimpleEditorProps {
  onChange?: (code: string) => void
}

export function SimpleEditor({ onChange }: SimpleEditorProps) {
  const { code } = useActiveCode()

  useEffect(() => {
    if (onChange && code) {
      onChange(code)
    }
  }, [code, onChange])

  return (
    <SandpackCodeEditor
      showTabs={false}
      showLineNumbers={true}
      showInlineErrors={true}
      className="h-full"
      style={{ height: "100%" }}
    />
  )
}
