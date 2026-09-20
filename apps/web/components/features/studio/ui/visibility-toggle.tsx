"use client"

import { useState } from "react"
import { useId } from "react"
import { CheckIcon, ChevronDownIcon, Globe, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface VisibilityToggleProps {
  isPrivate: boolean
  onToggle?: (isPrivate: boolean) => Promise<void>
  disabled?: boolean
  readonly?: boolean
}

const visibilityOptions = [
  {
    value: "public",
    label: "Public",
    icon: Globe,
    className: "text-green-500",
  },
  {
    value: "private",
    label: "Private",
    icon: Lock,
    className: "",
  },
]

export function VisibilityToggle({
  isPrivate,
  onToggle,
  disabled = false,
  readonly = false,
}: VisibilityToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [open, setOpen] = useState(false)
  const id = useId()

  const handleVisibilityChange = async (value: string) => {
    if (!onToggle || readonly) return

    try {
      setIsUpdating(true)
      await onToggle(value === "private")
    } catch (error) {
      console.error("Failed to update visibility:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Read-only view
  if (readonly) {
    return (
      <div className="flex items-center">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[2px] text-xs font-normal select-none",
            isPrivate
              ? "border-border bg-muted text-muted-foreground"
              : "border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
          )}
        >
          {isPrivate ? (
            <Lock size={12} className="min-w-3 min-h-3" />
          ) : (
            <Globe size={12} className="min-w-3 min-h-3" />
          )}
          <span>{isPrivate ? "Private" : "Public"}</span>
        </div>
      </div>
    )
  }

  const currentValue = isPrivate ? "private" : "public"

  // Editable dropdown
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isUpdating}
          className={cn(
            "inline-flex items-center justify-between gap-1.5 rounded-full border h-6 px-2.5 text-xs font-normal shadow-none transition-colors",
            isPrivate
              ? "border-border bg-muted/60 hover:bg-muted text-muted-foreground"
              : "border-emerald-500/25 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300",
          )}
        >
          <div className="flex items-center gap-1.5">
            {isPrivate ? (
              <Lock size={12} className="min-w-3 min-h-3" />
            ) : (
              <Globe size={12} className="min-w-3 min-h-3" />
            )}
            <span>{isPrivate ? "Private" : "Public"}</span>
          </div>
          <ChevronDownIcon
            size={12}
            className="opacity-60 shrink-0 ml-0.5"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="bg-popover text-popover-foreground border-border w-[130px] p-1 shadow-md"
        align="start"
      >
        <Command className="text-xs">
          <CommandList>
            <CommandGroup>
              {visibilityOptions.map((option) => {
                const Icon = option.icon
                const isSelected = currentValue === option.value
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(value) => {
                      handleVisibilityChange(value)
                      setOpen(false)
                    }}
                    className={cn(
                      "cursor-pointer text-xs py-1.5 px-2 flex items-center justify-between rounded-sm",
                      option.value === "public"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon size={12} className="min-w-3 min-h-3" />
                      <span>{option.label}</span>
                    </div>
                    {isSelected && (
                      <CheckIcon size={14} className="ml-auto opacity-80" />
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
