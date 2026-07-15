import * as React from "react"

import { cn } from "@/lib/utils"

export type ClayInputProps = React.InputHTMLAttributes<HTMLInputElement>

const ClayInput = React.forwardRef<HTMLInputElement, ClayInputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full rounded-pill bg-background px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground shadow-clay-pressed focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  ),
)
ClayInput.displayName = "ClayInput"

export { ClayInput }
