import { useState } from "react"
// Remove import of old FileEntry type
// import { FileEntry } from "../api"
// Define or import the correct FileEntry type if not globally available
// Assuming FileEntry is defined in page.tsx or a shared types file
// If not, define it here:
// Remove the local definition if FileEntry is imported from useFileSystem
/*
interface FileEntry {
  name: string
  type: "file" | "dir"
  path: string
  isSymlink: boolean
  children?: FileEntry[]
}
*/
import { FileEntry } from "../hooks/use-file-system"
import { FolderIcon, FolderOpenIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileTree } from "./file-tree"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { AddRegistryModal } from "./add-registry-modal"

interface FileExplorerProps {
  entries: FileEntry[]
  onSelect: (entry: FileEntry) => void
  selectedPath: string | null
  onDelete: (filePath: string) => void
  onCreateFile: (fileName: string) => void
  onCreateDirectory: (dirName: string) => void
  onRename: (oldPath: string, newName: string) => Promise<string>
  onRefresh: () => void
  isLoading: boolean
  advancedView: boolean
  onToggleAdvancedView: () => void
  onAddFrom21Registry: (jsonUrl: string, demoCode?: string) => Promise<void>
  onNewDemo?: () => void
}

export function FileExplorer({
  entries,
  onSelect,
  selectedPath,
  onDelete,
  onCreateFile,
  onCreateDirectory,
  onRename,
  onRefresh,
  isLoading,
  advancedView,
  onToggleAdvancedView,
  onAddFrom21Registry,
  onNewDemo,
}: FileExplorerProps) {
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [isCreatingDirectory, setIsCreatingDirectory] = useState(false)
  const [newDirectoryName, setNewDirectoryName] = useState("")
  const [isAddRegistryModalOpen, setIsAddRegistryModalOpen] = useState(false)

  const handleCreateFile = () => {
    if (newFileName) {
      onCreateFile(newFileName)
      setNewFileName("")
      setIsCreatingFile(false)
    }
  }

  const handleCreateDirectory = () => {
    if (newDirectoryName) {
      onCreateDirectory(newDirectoryName)
      setNewDirectoryName("")
      setIsCreatingDirectory(false)
    }
  }

  const handleCancel = () => {
    setIsCreatingFile(false)
    setNewFileName("")
    setIsCreatingDirectory(false)
    setNewDirectoryName("")
  }

  return (
    <div className="h-full flex flex-col relative px-1">
      {isCreatingFile && (
        <div className="p-2 border-b">
          <div className="flex gap-2">
            <Input
              placeholder="filename.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFile()
                if (e.key === "Escape") handleCancel()
              }}
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleCreateFile}
              disabled={!newFileName}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      {isCreatingDirectory && (
        <div className="p-2 border-b">
          <div className="flex gap-2">
            <Input
              placeholder="folder-name"
              value={newDirectoryName}
              onChange={(e) => setNewDirectoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateDirectory()
                if (e.key === "Escape") handleCancel()
              }}
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleCreateDirectory}
              disabled={!newDirectoryName}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-y-auto flex-1">
        <FileTree
          entries={entries}
          onSelect={(entry) => {
            if (entry.path === 'ACTION_ADD_DEPENDENCY') {
              setIsAddRegistryModalOpen(true);
            } else {
              onSelect(entry);
            }
          }}
          selectedPath={selectedPath}
          onDelete={onDelete}
          isLoading={isLoading}
          onCreateFile={onCreateFile}
          onCreateDirectory={onCreateDirectory}
          onRename={onRename}
          onNewDemo={onNewDemo}
        />
      </div>

      {isAddRegistryModalOpen && (
        <AddRegistryModal
          onAddFrom21Registry={onAddFrom21Registry}
          isOpen={isAddRegistryModalOpen}
          onClose={() => setIsAddRegistryModalOpen(false)}
        />
      )}
    </div>
  )
}
