import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const clayPillButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-pill font-medium transition-[transform,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 shadow-clay-md hover:-translate-y-px active:translate-y-0 hover:shadow-clay-lg active:shadow-clay-pressed",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        accent: "bg-accent text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground",
      },
      size: {
        sm: "h-8 px-4 text-sm",
        default: "h-10 px-6 text-sm",
        lg: "h-12 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ClayPillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof clayPillButtonVariants> {
  asChild?: boolean
}

const ClayPillButton = React.forwardRef<
  HTMLButtonElement,
  ClayPillButtonProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(clayPillButtonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
ClayPillButton.displayName = "ClayPillButton"

export { ClayPillButton, clayPillButtonVariants }
