"use client"
import { Loader2Icon, Info, X, Globe, PanelRightOpen } from "lucide-react"
import Editor, { useMonaco, Monaco } from "@monaco-editor/react"
import { getMonacoLanguage } from "../utils"
import { useTheme } from "next-themes"
// import parse from "@babel/parser"
// import traverse from "@babel/traverse"

import dynamic from "next/dynamic"
import { useEffect, useState, useRef } from "react"

const activateMonacoJSXHighlighter = async (
  monacoEditor: typeof Editor,
  monaco: Monaco,
) => {
  // monaco-jsx-highlighter depends on these in addition to Monaco and an instance of a Monaco Editor.
  const { default: traverse } = await import("@babel/traverse")
  const { parse } = await import("@babel/parser")
  // >>> The star of the show =P >>>
  const {
    default: MonacoJSXHighlighter,
    JSXTypes,
    makeBabelParse, //By @HaimCandiTech
  } = await import(
    // @ts-ignore
    "monaco-jsx-highlighter" // Note: there is a polyfilled version alongside the regular version.
  ) // For example, starting with 2.0.2, 2.0.2-polyfilled is also available.

  const parseJSX = makeBabelParse(parse, true) // param0:Babel's parse, param1: default config for JSX syntax (false), TSX (true).
  // Instantiate the highlighter
  const monacoJSXHighlighter = new MonacoJSXHighlighter(
    monaco, // references Range and other APIs
    parseJSX, // obtains an AST, internally passes to parse options: {...options, sourceType: "module",plugins: ["jsx"],errorRecovery: true}
    traverse, // helps collecting the JSX expressions within the AST
    monacoEditor, // highlights the content of that editor via decorations
  )
  // Start the JSX highlighting and get the dispose function
  let disposeJSXHighlighting =
    monacoJSXHighlighter.highlightOnDidChangeModelContent()
  // Enhance monaco's editor.action.commentLine with JSX commenting and get its disposer
  let disposeJSXCommenting = monacoJSXHighlighter.addJSXCommentCommand()
  // <<< You are all set. >>>

  // Optional: customize the color font in JSX texts (style class JSXElement.JSXText.tastyPizza from ./index.css)
  JSXTypes.JSXText.options.inlineClassName = "JSXElement.JSXText.tastyPizza"
  // more details here: https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IModelDecorationOptions.html
  console.log(
    "Customize each JSX expression type's options, they must match monaco.editor.IModelDecorationOptions:",
    JSXTypes,
  )

  // This example's shorthands for toggling actions
  const toggleJSXHighlighting = () => {
    if (disposeJSXHighlighting) {
      disposeJSXHighlighting()
      disposeJSXHighlighting = null
      return false
    }

    disposeJSXHighlighting =
      monacoJSXHighlighter.highlightOnDidChangeModelContent()
    return true
  }

  const toggleJSXCommenting = () => {
    if (disposeJSXCommenting) {
      disposeJSXCommenting()
      disposeJSXCommenting = null
      return false
    }

    disposeJSXCommenting = monacoJSXHighlighter.addJSXCommentCommand()
    return true
  }

  const isToggleJSXHighlightingOn = () => !!disposeJSXHighlighting
  const isToggleJSXCommentingOn = () => !!disposeJSXCommenting

  return {
    monacoJSXHighlighter,
    toggleJSXHighlighting,
    toggleJSXCommenting,
    isToggleJSXHighlightingOn,
    isToggleJSXCommentingOn,
  }
}

interface EditorPaneProps {
  selectedFile: { path: string; type: string; isFromRegistry?: boolean } | null
  code: string
  onCodeChange: (value: string) => void
  isLoading: boolean
  showPreview?: boolean
  onTogglePreview?: () => void
}

function EditorPaneOriginal({
  selectedFile,
  code,
  onCodeChange,
  isLoading,
  showPreview,
  onTogglePreview,
}: EditorPaneProps) {
  const { resolvedTheme } = useTheme()
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showDemosBanner, setShowDemosBanner] = useState(true)

  const isDemoFile = selectedFile?.name === "demo.tsx" || selectedFile?.name === "default.tsx" || selectedFile?.path.includes("/demos/") || false

  const handleCodeChange = (value: string) => {
    onCodeChange(value)
    setIsSaving(true)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(false)
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleEditorMount = (editor: any, monaco: Monaco) => {
    const compilerOpts =
      monaco.languages.typescript.typescriptDefaults.getCompilerOptions()

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      ...compilerOpts,
      allowUnreachableCode: true,
      allowUnusedLabels: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
    })

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      ...compilerOpts,
      allowUnreachableCode: true,
      allowUnusedLabels: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
    })

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })

    activateMonacoJSXHighlighter(editor, monaco)
      .then((monacoJSXHighlighterRefCurrent) => {
        // monacoJSXHighlighterRefCurrent.isToggleJSXCommentingOn()
        // monacoJSXHighlighterRefCurrent.isToggleJSXHighlightingOn()
      })
      .catch((e) => console.log(e))
  }

  // const handleEditorMount = (editor: any, monaco: Monaco) => {
  //   const reactTypesURL = fetch(
  //     "https://unpkg.com/@types/react@19/index.d.ts?raw",
  //   ).then((res) => res.text())
  //   const reactDomTypesURL = fetch(
  //     "https://unpkg.com/@types/react-dom@19/index.d.ts?raw",
  //   ).then((res) => res.text())

  //   Promise.all([reactTypesURL, reactDomTypesURL]).then(
  //     ([reactTypes, reactDomTypes]) => {
  //       console.log(reactTypes, reactDomTypes)
  //       monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //         reactTypes,
  //         "file:///node_modules/@types/react/index.d.ts",
  //       )
  //       monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //         reactDomTypes,
  //         "file:///node_modules/@types/react-dom/index.d.ts",
  //       )
  //     },
  //   )

  //   const jsxHighlighter = new MonacoJSXHighlighter(
  //     monaco,
  //     parse,
  //     traverse,
  //     editor,
  //   )
  //   jsxHighlighter.highlightOnDidChangeModelContent()
  // }

  const isReadOnly = selectedFile?.isFromRegistry ?? false

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!selectedFile || selectedFile.type !== "file") {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        {selectedFile && selectedFile.type === "dir"
          ? `Directory: ${selectedFile.path}`
          : "Select a file to start editing"}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {isReadOnly && (
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs text-center">
          This component is from the HigherBits.dev registry and is read-only.
        </div>
      )}
      <Editor
        height="100%"
        language={getMonacoLanguage(selectedFile.path)}
        value={code}
        onChange={(value) => handleCodeChange(value || "")}
        theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
        className="oveflow-hidden grow"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          automaticLayout: true,
          scrollbar: {
            verticalScrollbarSize: 5,
          },
          overviewRulerLanes: 5,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          readOnly: isReadOnly,
        }}
        onMount={handleEditorMount}
        loading={
          <div className="h-full flex items-center justify-center">
            <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
          </div>
        }
      />
      {isDemoFile && showDemosBanner && (
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/80 border-t border-border/50 text-xs text-muted-foreground shrink-0 z-20">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span>Each file in demos is its own demo. Only the default export is rendered in the preview.</span>
          </div>
          <button onClick={() => setShowDemosBanner(false)} className="hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="h-[34px] min-h-[34px] border-t border-border flex items-center px-4 justify-between bg-zinc-950 text-[13px] text-muted-foreground font-medium z-10 shrink-0">
        <div className="flex items-center gap-1.5 opacity-80 truncate">
          <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="truncate">
            {selectedFile.path.startsWith('/') ? selectedFile.path.substring(1).split('/').join(' / ') : selectedFile.path.split('/').join(' / ')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 pl-4">
          {isSaving ? (
            <>
              <Loader2Icon className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="opacity-80">Saving...</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="opacity-80">Saved</span>
            </>
          )}
          
          {!showPreview && onTogglePreview && (
            <button
              onClick={onTogglePreview}
              className="h-7 w-7 ml-2 flex items-center justify-center hover:bg-zinc-800 rounded-md transition-colors text-muted-foreground hover:text-foreground border border-transparent"
              title="Show Preview"
            >
              <PanelRightOpen className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export const EditorPane = dynamic(() => Promise.resolve(EditorPaneOriginal), {
  ssr: false,
})
