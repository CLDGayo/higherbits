import { SandboxSession, ReaddirEntry } from "@codesandbox/sdk"
import { useState, useEffect, useRef, RefObject } from "react"
import { toast } from "sonner"

const ROOT_PATH = "/project/sandbox"

const ALWAYS_HIDDEN_FILES = [
  "node_modules",
  "dist",
  "yarn.lock",
  "vite-env.d.ts",
  "public",
  "pnpm-lock.yaml",
  "vite.config.ts",
  "tsconfig.json",
  "tsconfig.node.json",
  "index.html",
  "main.tsx",
  "README.md",
  "components.json",
  "app.tsx",
  "scripts",
  "registry.json",
  "next",
  "21st-registry.json",
]
const ADVANCED_VIEW_HIDDEN_FILES = [
  "package.json",
  "app.tsx",
  "lib",
  // "components",
]

export interface FileEntry {
  path: string
  type: "file" | "dir"
  name: string
  isSymlink: boolean
  children?: FileEntry[]
  isFromRegistry?: boolean
}

const normalizePath = (path: string) => {
  if (!path.startsWith(ROOT_PATH)) {
    const combined = `${ROOT_PATH}${path.startsWith("/") ? path : `/${path}`}`
    return combined === `${ROOT_PATH}/` ? ROOT_PATH : combined
  }
  return path === `${ROOT_PATH}/` ? ROOT_PATH : path
}

const mapReaddirEntryToFileEntry = (
  entry: ReaddirEntry,
  parentPath: string,
  registryComponentPaths: string[],
): FileEntry => {
  const fullPath = `${parentPath === ROOT_PATH ? "" : parentPath}/${entry.name}`
  // Check if the current entry's path (or any of its parent paths up to /src/components/ui/)
  // matches a path derived from a registry component.
  // A component from registry might be /src/components/ui/my-component.tsx
  // or a directory /src/components/ui/my-component/
  let isFromRegistry = false
  if (fullPath.startsWith("/src/components/ui/")) {
    isFromRegistry = registryComponentPaths.some((registryPath) => {
      // A registry component path is like 'my-component'
      // We need to check if fullPath is '/src/components/ui/my-component.tsx'
      // or '/src/components/ui/my-component/...'
      const baseRegistryPath = `/src/components/ui/${registryPath}`
      return (
        fullPath === `${baseRegistryPath}.tsx` || // for files like my-component.tsx
        fullPath.startsWith(`${baseRegistryPath}/`) // for directories like my-component/
      )
    })
  }

  return {
    name: entry.name,
    path: fullPath,
    type: entry.type === "directory" ? "dir" : "file",
    isSymlink: entry.isSymlink,
    isFromRegistry,
  }
}

const loadDirectoryRecursively = async (
  sandbox: SandboxSession,
  path: string,
  showAdvancedView: boolean,
  registryComponentPaths: string[],
): Promise<FileEntry[]> => {
  const entries = await sandbox.fs.readdir(normalizePath(path))

  const filteredEntries = entries.filter((entry) => {
    // Always filter out certain files
    if (
      ALWAYS_HIDDEN_FILES.includes(entry.name) ||
      entry.name.startsWith(".")
    ) {
      return false
    }

    // Filter out advanced view files only if not in advanced mode
    if (!showAdvancedView && ADVANCED_VIEW_HIDDEN_FILES.includes(entry.name)) {
      return false
    }

    return true
  })
  const fileEntries = filteredEntries.map((entry) =>
    mapReaddirEntryToFileEntry(entry, path, registryComponentPaths),
  )

  for (const entry of fileEntries) {
    if (entry.type === "dir") {
      entry.children = await loadDirectoryRecursively(
        sandbox,
        entry.path,
        showAdvancedView,
        registryComponentPaths,
      )
      // If any child is from registry, the parent dir (if under /src/components/ui/) should also be considered as part of it for UI purposes
      if (
        entry.path.startsWith("/src/components/ui/") &&
        entry.children?.some((child) => child.isFromRegistry)
      ) {
        entry.isFromRegistry = true
      }
    }
  }

  return fileEntries
}

export const useFileSystem = ({
  sandboxRef,
  reconnectSandbox,
  sandboxConnectionHash,
}: {
  sandboxRef: RefObject<SandboxSession | null>
  reconnectSandbox: () => Promise<void>
  sandboxConnectionHash: string | null
}) => {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [isTreeLoading, setIsTreeLoading] = useState(false)
  const [isFileLoading, setIsFileLoading] = useState(false)
  const [advancedView, setAdvancedView] = useState(false)
  const [registryComponents, setRegistryComponents] = useState<string[]>([])
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const sbWrapper = async <T>(
    operation: (sandbox: SandboxSession) => Promise<T>,
  ): Promise<T | undefined> => {
    if (!sandboxRef.current) {
      setTimeout(() => {
        sbWrapper(operation)
      }, 400)
      return
    }

    try {
      try {
        await sandboxRef.current.fs.readdir("/project/sandbox")
        console.log("SUCCESSFULLY READ /project/sandbox")
      } catch (e1: any) {
        console.log("FAILED /project/sandbox", e1)
        try {
          await sandboxRef.current.fs.readdir("/workspace")
          console.log("SUCCESSFULLY READ /workspace")
        } catch (e2: any) {
          console.log("FAILED /workspace", e2)
          try {
            await sandboxRef.current.fs.readdir("/")
            console.log("SUCCESSFULLY READ /")
          } catch (e3: any) {
            console.log("FAILED /", e3)
            // Log to backend
            fetch("/api/sandbox/error-log", {
              method: "POST",
              body: JSON.stringify({ message: "All paths failed", e1: String(e1), e2: String(e2), e3: String(e3) }),
            })
            throw new Error("All root paths failed")
          }
        }
      }

      // We don't throw from basic operation anymore so the loop continues
    } catch (error: any) {
      console.error("Failed to read root directory:", error)
      await reconnectSandbox()
      return
    }

    return await operation(sandboxRef.current)
  }

  const loadRootDirectory = async () => {
    setIsTreeLoading(true)
    let currentRegistryComponents: string[] = []
    try {
      try {
        const hasRegistry = await sbWrapper<boolean>(async (sandbox) => {
          try {
            await sandbox.fs.stat(normalizePath("/21st-registry.json"))
            return true
          } catch {
            return false
          }
        })
        const registryContent = hasRegistry
          ? await sbWrapper<string | null>((sandbox) => {
              return sandbox.fs.readTextFile(
                normalizePath("/21st-registry.json"),
              )
            })
          : null
        if (registryContent) {
          const parsedRegistry = JSON.parse(registryContent)
          if (Array.isArray(parsedRegistry)) {
            currentRegistryComponents = parsedRegistry.map(
              (item: any) => item.name,
            )
            setRegistryComponents(currentRegistryComponents)
          } else {
            setRegistryComponents([])
          }
        } else {
          setRegistryComponents([])
        }
      } catch (error) {
        console.error("Failed to read 21st-registry.json:", error)
        setRegistryComponents([])
      }

      const rootEntries = await sbWrapper((sandbox) =>
        loadDirectoryRecursively(
          sandbox,
          ROOT_PATH,
          advancedView,
          currentRegistryComponents,
        ),
      )

      if (rootEntries) {
        if (advancedView) {
          setFiles(rootEntries)
        } else {
          const flattenEntries = (entries: FileEntry[]): FileEntry[] => {
            let flat: FileEntry[] = []
            for (const e of entries) {
              flat.push(e)
              if (e.children) flat = flat.concat(flattenEntries(e.children))
            }
            return flat
          }
          const allFiles = flattenEntries(rootEntries)
          
          const componentFiles = allFiles.filter(f => f.path.startsWith('/project/sandbox/src/components/ui/') && f.type === 'file' && !f.isFromRegistry)
          const indexCssFile = allFiles.find(f => f.name === 'index.css' && f.path === '/project/sandbox/src/index.css')
          const demoFiles = allFiles.filter(f => f.path.startsWith('/project/sandbox/src/') && (f.name === 'demo.tsx' || f.name === 'default.tsx'))
          
          const virtualEntries: FileEntry[] = [
            {
              name: "Component",
              type: "dir",
              path: "/project/sandbox/src/components/ui",
              isSymlink: false,
              children: [
                ...componentFiles,
                ...(indexCssFile ? [indexCssFile] : []),
                { name: "Add dependency", type: "file", path: "ACTION_ADD_DEPENDENCY", isSymlink: false }
              ]
            },
            {
              name: "Demos",
              type: "dir",
              path: "/project/sandbox/src",
              isSymlink: false,
              children: [
                ...demoFiles
              ]
            }
          ]
          
          setFiles(virtualEntries)
        }
      }
    } catch (error: any) {
      console.error("Failed to load root directory:", error)
      fetch("/api/sandbox/error-log", {
        method: "POST",
        body: JSON.stringify({ message: error.message, stack: error.stack }),
      }).catch(() => {})
      toast.error(`Failed to load project files: ${error.message || "Unknown error"}`)
      setFiles([])
    } finally {
      setIsTreeLoading(false)
    }
  }

  useEffect(() => {
    loadRootDirectory()
  }, [sandboxConnectionHash, advancedView])

  const loadFileContent = async (filePath: string): Promise<string> => {
    setIsFileLoading(true)
    try {
      const content = await sbWrapper((sandbox) =>
        sandbox.fs.readTextFile(normalizePath(filePath)),
      )
      if (content === undefined || content === null) throw new Error("Failed to load file content")
      return content
    } catch (error) {
      console.error(`Failed to load file content for ${filePath}:`, error)
      toast.error(`Failed to load file`)
      throw error
    } finally {
      setIsFileLoading(false)
    }
  }

  const saveFileContent = (filePath: string, value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        await sbWrapper((sandbox) =>
          sandbox.fs.writeTextFile(normalizePath(filePath), value),
        )
      } catch (error) {
        console.error("Failed to save file:", error)
        toast.error(`Failed to save ${filePath.split("/").pop()}`)
      }
    }, 800)
  }

  const createFile = async (filePath: string) => {
    try {
      await sbWrapper((sandbox) =>
        sandbox.fs.writeTextFile(normalizePath(filePath), "// TODO: Add code"),
      )
      await loadRootDirectory()
    } catch (error) {
      console.error(`Failed to create file ${filePath}:`, error)
      toast.error(`Failed to create ${filePath.split("/").pop()}`)
      throw error
    }
  }

  const createDirectory = async (dirPath: string) => {
    try {
      await sbWrapper((sandbox) => sandbox.fs.mkdir(normalizePath(dirPath)))
      await loadRootDirectory()
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}:`, error)
      toast.error(`Failed to create directory ${dirPath.split("/").pop()}`)
      throw error
    }
  }

  const deleteEntry = async (entryPath: string) => {
    try {
      await sbWrapper(async (sandbox) => {
        let isDir = false
        try {
          const statResult = await sandbox.fs.stat(normalizePath(entryPath))
          isDir = statResult.type === "directory"
        } catch (statError) {
          console.warn(`Stat failed for ${entryPath} during delete:`, statError)
        }

        return sandbox.fs.remove(normalizePath(entryPath), isDir)
      })
      await loadRootDirectory()
    } catch (error) {
      console.error(`Failed to delete ${entryPath}:`, error)
      toast.error(`Failed to delete ${entryPath.split("/").pop()}`)
      throw error
    }
  }

  const renameEntry = async (oldPath: string, newName: string) => {
    try {
      const pathParts = oldPath.split("/")
      const parentPath = pathParts.slice(0, -1).join("/")
      const newPath = `${parentPath ? parentPath + "/" : ""}${newName}`

      await sbWrapper((sandbox) =>
        sandbox.fs.rename(normalizePath(oldPath), normalizePath(newPath)),
      )

      await loadRootDirectory()
      return newPath
    } catch (error) {
      console.error(`Failed to rename ${oldPath} to ${newName}:`, error)
      toast.error(`Failed to rename to ${newName}`)
      throw error
    }
  }

  const addDependencyToPackageJson = async (
    packageName: string,
    version: string,
  ) => {
    try {
      const packageJsonPath = normalizePath("/package.json")
      const content = await sbWrapper((sandbox) =>
        sandbox.fs.readTextFile(packageJsonPath),
      )

      if (!content) throw new Error("Failed to read package.json")

      const packageJson = JSON.parse(content)
      if (!packageJson.dependencies) {
        packageJson.dependencies = {}
      }

      packageJson.dependencies[packageName] = `^${version}`

      await sbWrapper((sandbox) =>
        sandbox.fs.writeTextFile(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2),
        ),
      )

      toast.success(`Added ${packageName}@${version} to dependencies`)
      await loadRootDirectory()
    } catch (error) {
      console.error(`Failed to add dependency ${packageName}:`, error)
      toast.error(`Failed to add ${packageName} to dependencies`)
      throw error
    }
  }

  const toggleAdvancedView = () => {
    setAdvancedView((prev) => !prev)
  }

  // Helper function to run a task, wait for specific output, and execute a callback
  const _runTaskAndWaitForOutput = async <T>(
    taskName: string,
    completionMap: Record<
      string,
      (shell: any, sandbox: SandboxSession) => Promise<T | undefined> | void
    >,
  ): Promise<T | undefined> => {
    // Guranties that the sandbox is connected
    if (!sandboxConnectionHash) {
      return new Promise((resolve, reject) => {
        let counter = 0
        const interval = setInterval(() => {
          if (sandboxConnectionHash) {
            clearInterval(interval)
            _runTaskAndWaitForOutput(taskName, completionMap)
              .then(resolve)
              .catch(reject)
          }
          counter++
          if (counter > 50) {
            clearInterval(interval)
            reject(new Error("Timeout waiting for sandbox connection"))
          }
        }, 1000)
      })
    }

    console.log(`Starting ${taskName} task...`)
    if (!sandboxRef.current) {
      throw new Error("Sandbox not available")
    }
    const task = await sandboxRef.current.tasks.runTask(taskName)

    if (!task) {
      throw new Error(`Failed to start ${taskName} task`)
    }

    console.log(`${taskName} Task:`, task)

    return new Promise<T | undefined>((resolve, reject) => {
      let counter = 0
      const interval = setInterval(async () => {
        if (!task?.shellId) {
          counter++
          if (counter > 50) {
            clearInterval(interval)
            reject(new Error(`Timeout waiting for ${taskName} shellId`))
          }
          return
        }

        let connectedShell
        try {
          if (!sandboxRef.current) {
            throw new Error("Sandbox disconnected while waiting for shell")
          }
          connectedShell = await sandboxRef.current.shells.open(task.shellId)
        } catch (error) {
          console.error(`Failed to open shell for ${taskName}:`, error)
          counter++
          if (counter > 50) {
            clearInterval(interval)
            reject(new Error(`Timeout connecting to ${taskName} shell`))
          }
          return
        }

        if (connectedShell) {
          clearInterval(interval)

          let outputTimeout: NodeJS.Timeout | null = null
          const disposeShellAndClearTimeout = () => {
            if (outputTimeout) clearTimeout(outputTimeout)
            connectedShell?.dispose()
          }

          connectedShell.onOutput(async (data) => {
            console.log(`${taskName} Output:`, data)
            // Iterate through the completion map keys and values to find a match
            for (const [completionString, completionCallback] of Object.entries(
              completionMap,
            )) {
              if (
                Object.prototype.hasOwnProperty.call(
                  completionMap,
                  completionString,
                )
              ) {
                // listening for finsih word and not echo (to prevent return from first stateng)
                //  eg: npm run build && echo "FINISH"
                if (data.includes(completionString) && !data.includes("echo")) {
                  console.log(
                    `${taskName} finished with output '${completionString}', executing callback...`,
                  )
                  try {
                    if (!sandboxRef.current) {
                      throw new Error("Sandbox disconnected before callback")
                    }
                    // Execute the callback and handle its potential return value
                    const result = await completionCallback(
                      connectedShell,
                      sandboxRef.current,
                    )
                    console.log(
                      `Callback for '${completionString}' finished successfully.`,
                    )
                    // Resolve with the result if the callback returned one
                    // Dispose and clear timeout before resolving
                    disposeShellAndClearTimeout()
                    resolve(result as T | undefined) // Cast needed as void callbacks don't return T
                    return // Stop processing further output and callbacks for this task
                  } catch (error) {
                    console.error(
                      `Error during callback for '${completionString}':`,
                      error,
                    )
                    // Dispose and clear timeout before rejecting
                    disposeShellAndClearTimeout()
                    reject(error)
                    return // Stop processing further output
                  }
                }
              }
            }
          })

          outputTimeout = setTimeout(() => {
            console.error(
              `Timeout waiting for any of the specified output patterns: ${Object.keys(
                completionMap,
              )
                .map((str) => `'${str}'`)
                .join(", ")}.`,
            )
            disposeShellAndClearTimeout()
            reject(
              new Error(`${taskName}: Timeout waiting for specified output`),
            )
          }, 300000) // Increased timeout to 300 seconds

          // Wrap resolve/reject to clear timeout
          const originalResolve = resolve
          resolve = (value) => {
            disposeShellAndClearTimeout()
            originalResolve(value)
          }
          const originalReject = reject
          reject = (reason) => {
            disposeShellAndClearTimeout()
            originalReject(reason)
          }
        } else {
          counter++
          if (counter > 50) {
            clearInterval(interval)
            reject(new Error(`Timeout connecting to ${taskName} shell`))
          }
        }
      }, 1000)
    })
  }

  const bundleDemo = async (): Promise<string | undefined> => {
    // Patch package.json to skip strict TypeScript checking during build
    await sbWrapper(async (sandbox) => {
      try {
        const pkgStr = await sandbox.fs.readTextFile(normalizePath("package.json"))
        if (pkgStr) {
           const pkg = JSON.parse(pkgStr)
           if (pkg.scripts && pkg.scripts.build && pkg.scripts.build.includes("tsc ")) {
              pkg.scripts.build = "vite build"
              await sandbox.fs.writeTextFile(normalizePath("package.json"), JSON.stringify(pkg, null, 2))
           }
        }
      } catch (e) {
         console.warn("Could not patch package.json before build", e)
      }
    })

    return _runTaskAndWaitForOutput<string>("build", {
      "built in": async (shell, sandbox) => {
        const content = await getContentOfBundleIndexHTML(sandbox)
        if (!content) {
          throw new Error("Failed to read dist/index.html")
        }
        return content
      },
      "error during build": (shell, sandbox) => {
        console.error("Build failed with error during build output.")
        throw new Error("Failed during build.")
      },
      "build error": (shell, sandbox) => {
        console.error("Build failed with build error output.")
        throw new Error("Failed during build.")
      },
      "failed to build": (shell, sandbox) => {
        console.error("Build failed with failed to build output.")
        throw new Error("Failed during build.")
      },
      "Command failed": (shell, sandbox) => {
        console.error("Build failed: Command failed.")
        throw new Error("Failed during build: Build command exited with error.")
      },
    })
  }

  // clean comments from component and demo
  const optimizeComponentAndDemo = async (componentSlug: string) => {
    const demoPath = normalizePath("src/demo.tsx")
    const componentPath = normalizePath(
      `src/components/ui/${componentSlug}.tsx`,
    )

    const commentsToRemoveDemo = [
      "// This is a demo of a preview",
      "// That's what users will see in the preview",
    ]

    const commentsToRemoveComponent = [
      "// This is file of your component",
      "// You can use any dependencies from npm; we import them automatically in package.json",
    ]

    const cleanFileContent = async (
      filePath: string,
      commentsToRemove: string[],
    ) => {
      try {
        let content = await sbWrapper((sandbox) =>
          sandbox.fs.readTextFile(filePath),
        )
        if (content) {
          let updated = false
          commentsToRemove.forEach((comment) => {
            // Replace comment plus newline character
            if (content!.includes(comment)) {
              content = content!.replace(comment + "\n", "")
              // Also try without newline in case it's the last line
              content = content!.replace(comment, "")
              updated = true
            }
          })
          // Remove any leading blank lines
          content = content!.replace(/^\s*\n+/g, "")
          if (updated) {
            await sbWrapper((sandbox) =>
              sandbox.fs.writeTextFile(filePath, content!),
            )
            console.log(`Cleaned comments from ${filePath}`)
          }
        }
      } catch (error) {
        console.warn(
          `Could not clean comments from ${filePath}: ${(error as Error).message}`,
        )
      }
    }

    await cleanFileContent(demoPath, commentsToRemoveDemo)
    await cleanFileContent(componentPath, commentsToRemoveComponent)

  }

  // Function to compile the project into a shadcn registry
  const generateRegistry = async (
    slug?: string,
  ): Promise<
    | {
        componentRegistryJSON: string
        demoRegistryJSON: string
      }
    | undefined
  > => {
    return _runTaskAndWaitForOutput<
      | {
          componentRegistryJSON: string
          demoRegistryJSON: string
        }
      | undefined
    >("generate:registry", {
      FINISH: async (shell, sandbox) => {
        const componentRegistryJSON = await getContentOfComponentRegistryJSON(
          sandbox,
          slug,
        )
        const demoRegistryJSON = await getContentOfDemoRegistryJSON(sandbox)
        if (!componentRegistryJSON || !demoRegistryJSON) {
          throw new Error("Failed to read generated registry files")
        }
        return { componentRegistryJSON, demoRegistryJSON }
      },
      "error during generate:registry": (shell, sandbox) => {
        throw new Error("Failed to generate registry")
      },
    })
  }

  const getContentOfBundleIndexHTML = async (sandbox: SandboxSession) => {
    const indexPath = normalizePath("dist/index.html")
    const content = await sandbox.fs.readTextFile(indexPath)
    return content
  }

  const getContentOfComponentRegistryJSON = async (
    sandbox: SandboxSession,
    slug?: string,
  ) => {
    const filename = slug ? `${slug}.json` : "component.json"
    const registryJsonPath = normalizePath(`public/r/${filename}`)
    const content = await sandbox.fs.readTextFile(registryJsonPath)
    return content
  }

  const getContentOfDemoRegistryJSON = async (sandbox: SandboxSession) => {
    const registryJsonPath = normalizePath("public/r/demo.json")
    const content = await sandbox.fs.readTextFile(registryJsonPath)
    return content
  }

  const updateComponentNameAndImport = async (newSlug: string) => {
    await sbWrapper(async (sandbox) => {
      let oldComponentPath = normalizePath("src/components/ui/component.tsx")
      const newComponentPath = normalizePath(`src/components/ui/${newSlug}.tsx`)
      const demoPath = normalizePath("src/demo.tsx")

      // Check if the new component path already exists
      try {
        await sandbox.fs.stat(newComponentPath)
        console.warn(
          `Component file ${newComponentPath} already exists. Skipping rename.`,
        )
        return
      } catch (error) {
        console.log(
          `New component path ${newComponentPath} does not exist. Proceeding.`,
        )
      }

      // Check if the default old component path exists, if not, find the first .tsx file
      try {
        await sandbox.fs.stat(oldComponentPath)
        console.log(`Default old component path ${oldComponentPath} exists.`)
      } catch (error) {
        console.warn(
          `Default old component path ${oldComponentPath} not found. Attempting to find another .tsx file.`,
        )
        try {
          const uiDirEntries = await sandbox.fs.readdir(
            normalizePath("src/components/ui"),
          )
          const firstTsxFile = uiDirEntries.find(
            (entry) =>
              entry.name.endsWith(".tsx") &&
              !registryComponents.includes(entry.name.replace(/\.tsx$/, "")),
          )

          if (firstTsxFile) {
            oldComponentPath = normalizePath(
              `src/components/ui/${firstTsxFile.name}`,
            )
            console.log(`Using ${oldComponentPath} as the old component path.`)
          } else {
            console.error(
              "No .tsx files found in src/components/ui/ that are not part of the registry",
            )
            toast.error(
              "No component file found to rename in src/components/ui/ (excluding registry components)",
            )
            return
          }
        } catch (readDirError) {
          console.error(
            "Failed to read src/components/ui/ directory:",
            readDirError,
          )
          toast.error("Failed to access component directory.")
          return
        }
      }

      // Rename the component file
      try {
        await sandbox.fs.rename(oldComponentPath, newComponentPath)
        console.log(`Renamed ${oldComponentPath} to ${newComponentPath}`)
      } catch (error) {
        console.error(`Failed to rename component file: ${error}`)
        toast.error(`Failed to rename component file to ${newSlug}.tsx`)
        // If renaming fails, we might not want to proceed with updating the import
        throw new Error(`Failed to rename component file to ${newSlug}.tsx`)
      }

      // Read, update, and write the demo file's import statement
      try {
        const demoContent = await sandbox.fs.readTextFile(demoPath)
        const oldComponentName = oldComponentPath
          .split("/")
          .pop()
          ?.replace(".tsx", "")
        if (!oldComponentName) {
          console.error(
            "Could not determine old component name from path:",
            oldComponentPath,
          )
          toast.error(
            "Failed to update demo import: could not determine old component name.",
          )
          throw new Error("Could not determine old component name.")
        }
        const oldImportPattern = new RegExp(
          `from\\s+(['"])@\\/components\\/ui\\/${oldComponentName}(['"])`,
          "g",
        )
        const newImportString = `from $1@/components/ui/${newSlug}$2`
        const updatedDemoContent = demoContent.replace(
          oldImportPattern,
          newImportString,
        )

        if (demoContent !== updatedDemoContent) {
          await sandbox.fs.writeTextFile(demoPath, updatedDemoContent)
          console.log(`Updated import in ${demoPath}`)
        } else {
          console.warn(`Import pattern not found in ${demoPath}`)
          // Decide if this is an error or just a warning
          // toast.warn(`Could not update import path in demo file.`);
        }
      } catch (error) {
        console.error(`Failed to update demo import: ${error}`)
        toast.error("Failed to update demo import path.")
        // Consider if this error should halt the process
        throw new Error("Failed to update demo import.")
      }
    })
    // Reload the file tree to reflect changes
    await loadRootDirectory()
  }

  const addFrom21Registry = async (jsonUrl: string, demoCode?: string): Promise<string | undefined> => {
    return await sbWrapper(async (sandbox) => {
      let expectedPath: string | undefined;

      try {
        // Fetch the component JSON directly instead of using the CLI to avoid npm hangs in the sandbox
        const response = await fetch(jsonUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch component registry: ${response.statusText}`);
        }
        const registryData = await response.json();
        
        // Write component files directly
        if (registryData.files && Array.isArray(registryData.files)) {
          for (const file of registryData.files) {
            let filePath = file.path;
            // Clean up path if it includes registry/ui/
            if (filePath.startsWith('registry/ui/')) {
              filePath = filePath.replace('registry/ui/', '');
            }
            if (filePath.startsWith('registry/components/')) {
              filePath = filePath.replace('registry/components/', '');
            }
            
            const filename = filePath.split('/').pop() || 'component.tsx';
            const fullPath = normalizePath(`src/components/ui/${filename}`);
            
            await sandbox.fs.writeTextFile(fullPath, file.content || "");
            console.log(`Successfully wrote component file to ${fullPath}`);
            
            // Store the expected path of the main component file
            if (!expectedPath && filename.endsWith('.tsx')) {
               expectedPath = `/src/components/ui/${filename}`;
            }
          }
        }
        
        // Add dependencies to package.json if present
        if (registryData.dependencies && Array.isArray(registryData.dependencies)) {
           for (const dep of registryData.dependencies) {
              await addDependencyToPackageJson(dep, "latest");
           }
        }
        
      } catch (error) {
         console.error("Failed to fetch and write registry component:", error);
         throw error;
      }

      // Ensure demo.tsx is updated so the preview doesn't break
      if (demoCode && demoCode !== "N/A") {
        try {
          // Extract component slug from the jsonUrl (e.g., http://.../r/shadcn/tooltip)
          const urlParts = jsonUrl.split('/')
          const componentSlug = urlParts[urlParts.length - 1]
          
          if (componentSlug) {
            // Write a wrapper component to render the primitive
            const demoPath = `/src/components/ui/${componentSlug}-demo.tsx`
            await sandbox.fs.writeTextFile(normalizePath(demoPath), demoCode)
            console.log(`Successfully injected demo code for ${componentSlug} at ${demoPath}`)
            
            // Try to find the exported component name from the demo code
            const exportMatch = demoCode.match(/export default function ([a-zA-Z0-9_]+)/) || demoCode.match(/export function ([a-zA-Z0-9_]+)/)
            const demoExportName = exportMatch ? exportMatch[1] : null

            let newDemoTsx = ""
            if (demoExportName) {
              const isDefaultExport = demoCode.includes(`export default function ${demoExportName}`) || demoCode.includes(`export default ${demoExportName}`)
              const importStatement = isDefaultExport 
                ? `import ${demoExportName} from "./components/ui/${componentSlug}-demo";`
                : `import { ${demoExportName} } from "./components/ui/${componentSlug}-demo";`
              
              newDemoTsx = `${importStatement}\n\nconst Demo = () => (\n  <div className="flex items-center justify-center min-h-screen p-4">\n    <${demoExportName} />\n  </div>\n);\n\nexport default { Demo };\n`
            } else {
              // fallback if we couldn't parse the name but it's likely a default export
              newDemoTsx = `import Component from "./components/ui/${componentSlug}-demo";\n\nconst Demo = () => (\n  <div className="flex items-center justify-center min-h-screen p-4">\n    <Component />\n  </div>\n);\n\nexport default { Demo };\n`
            }
            
            await sandbox.fs.writeTextFile(normalizePath("src/demo.tsx"), newDemoTsx)
            console.log(`Updated src/demo.tsx to render ${demoExportName || "Component"}`)
          }
        } catch (error) {
          console.error("Failed to write demo code:", error)
        }
      } else if (expectedPath) {
        // If there's no demo code, we should still update demo.tsx to point to the newly installed component
        // This prevents "export named Component not found" errors when component.tsx is overwritten
        try {
           const compContent = await sandbox.fs.readTextFile(normalizePath(expectedPath));
           // Try to find default export or named export
           const defaultExportMatch = compContent.match(/export default function ([a-zA-Z0-9_]+)/) || compContent.match(/export default ([a-zA-Z0-9_]+)/);
           const namedExportMatch = compContent.match(/export function ([a-zA-Z0-9_]+)/) || compContent.match(/export const ([a-zA-Z0-9_]+)/);
           
           const compFileName = expectedPath.split('/').pop()?.replace('.tsx', '');
           
           let newDemoTsx = "";
           if (defaultExportMatch) {
              const name = defaultExportMatch[1];
              newDemoTsx = `import ${name} from "./components/ui/${compFileName}";\n\nconst Demo = () => (\n  <div className="flex items-center justify-center min-h-screen p-4">\n    <${name} />\n  </div>\n);\n\nexport default { Demo };\n`;
           } else if (namedExportMatch) {
              const name = namedExportMatch[1];
              newDemoTsx = `import { ${name} } from "./components/ui/${compFileName}";\n\nconst Demo = () => (\n  <div className="flex items-center justify-center min-h-screen p-4">\n    <${name} />\n  </div>\n);\n\nexport default { Demo };\n`;
           } else {
              // Generic fallback
              newDemoTsx = `import { Component } from "./components/ui/${compFileName}";\n\nconst Demo = () => (\n  <div className="flex items-center justify-center min-h-screen p-4">\n    <Component />\n  </div>\n);\n\nexport default { Demo };\n`;
           }
           
           await sandbox.fs.writeTextFile(normalizePath("src/demo.tsx"), newDemoTsx);
           console.log(`Updated src/demo.tsx fallback for ${compFileName}`);
        } catch(e) {
           console.error("Failed to update fallback demo.tsx:", e);
        }
      }
      
      // Reload the file tree to reflect new files
      await loadRootDirectory()
      
      return expectedPath
    })
  }

  return {
    files,
    isTreeLoading,
    isFileLoading,
    advancedView,
    toggleAdvancedView,
    loadRootDirectory,
    loadFileContent,
    saveFileContent,
    createFile,
    createDirectory,
    deleteEntry,
    renameEntry,
    addDependencyToPackageJson,
    // component name update
    updateComponentNameAndImport,
    // registry
    generateRegistry,
    bundleDemo,
    optimizeComponentAndDemo,
    // getContentOfComponentRegistryJSON, // Keep these private
    // getContentOfDemoRegistryJSON,
    addFrom21Registry,
  }
}
