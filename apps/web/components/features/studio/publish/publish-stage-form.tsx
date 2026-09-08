"use client"

import { useState, useEffect } from "react"
import { UseFormReturn } from "react-hook-form"
import { useUser } from "@clerk/nextjs"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { CreateLibraryDialog } from "@/components/features/studio/libraries/create-library-dialog"
import { listLibrariesAction } from "@/lib/api/collections"
import { usePublishAs } from "@/components/features/publish/hooks/use-publish-as"
import { FormData } from "@/components/features/studio/publish/config/utils"
import type { LibrarySummary } from "@/lib/api/server/collections"

export function PublishStageForm({
  form,
  onSubmit,
  isSubmitting,
}: {
  form: UseFormReturn<FormData>
  onSubmit: () => void
  isSubmitting: boolean
}) {
  const { user } = useUser()
  const [libraries, setLibraries] = useState<LibrarySummary[]>([])
  const [isCreateLibraryOpen, setIsCreateLibraryOpen] = useState(false)
  const username = user?.username || ""

  const { isAdmin } = usePublishAs({ username: form.watch("publish_as_username") || username })

  useEffect(() => {
    listLibrariesAction()
      .then((res) => {
        setLibraries(res)
      })
      .catch(console.error)
  }, [])

  return (
    <div className="p-6 h-full flex flex-col justify-center max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Ready to publish</h3>
        <p className="text-sm text-muted-foreground">
          Review your component details and configure visibility.
        </p>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        {/* Publish As */}
        <FormField
          control={form.control}
          name="publish_as_username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Publish As</FormLabel>
              <Select
                value={field.value || username}
                onValueChange={(val) => {
                  if (val === "personal") {
                    field.onChange(username)
                  } else {
                    field.onChange(val)
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select profile" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={username}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Personal</span>
                      <span className="text-muted-foreground">@{username}</span>
                    </div>
                  </SelectItem>
                  {isAdmin && (
                    <>
                      <SelectSeparator />
                      <div className="p-2">
                        <Input
                          placeholder="Admin: target username"
                          value={field.value !== username ? field.value : ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-8"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Who this component will be published under.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Library */}
        <FormField
          control={form.control}
          name="library_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Library (Optional)</FormLabel>
              <Select
                value={field.value || "none"}
                onValueChange={(val) => {
                  if (val === "create_new") {
                    setIsCreateLibraryOpen(true)
                  } else if (val === "none") {
                    field.onChange(undefined)
                  } else {
                    field.onChange(val)
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Add to a library" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No Library</SelectItem>
                  {libraries.map((lib) => (
                    <SelectItem key={lib.id} value={lib.id}>
                      {lib.name}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value="create_new" className="text-primary focus:text-primary focus:bg-primary/10 cursor-pointer">
                    <div className="flex items-center gap-2 font-medium">
                      <Plus className="h-4 w-4" />
                      <span>Create library...</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Add this component to one of your libraries.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Visibility */}
        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-background/50">
              <div className="space-y-0.5 mr-4">
                <FormLabel className="text-base font-medium">Public</FormLabel>
                <FormDescription className="text-xs">
                  {field.value
                    ? "Anyone with the link can install it, and it shows on your profile"
                    : "Only you can see and install it"}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Submit for featuring */}
        <FormField
          control={form.control}
          name="submit_for_featuring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-background/50">
              <div className="space-y-0.5 mr-4">
                <FormLabel className="text-base font-medium">Submit for featuring</FormLabel>
                <FormDescription className="text-xs">
                  Send it to the catalog for review so people can discover it. It stays public either way.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <Button
        size="lg"
        className="w-full rounded-full"
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Publishing..." : "Publish Component"}
      </Button>

      <CreateLibraryDialog
        open={isCreateLibraryOpen}
        onOpenChange={setIsCreateLibraryOpen}
        namespace={username}
        onCreated={(library) => {
          setLibraries((prev) => [...prev, library])
          form.setValue("library_id", library.id)
          setIsCreateLibraryOpen(false)
        }}
      />
    </div>
  )
}
