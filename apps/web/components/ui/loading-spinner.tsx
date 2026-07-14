"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  animationFile?: string
  logoFill?: string
}

export const LoadingSpinner = ({
  size = "sm",
  className,
  logoFill = "currentColor",
}: LoadingSpinnerProps) => {
  const { resolvedTheme } = useTheme()

  const sizeMap = {
    sm: { className: "w-8 h-8", style: { width: "2rem", height: "2rem" } },
    md: { className: "w-12 h-12", style: { width: "3rem", height: "3rem" } },
    lg: { className: "w-16 h-16", style: { width: "4rem", height: "4rem" } },
  }

  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center",
        className,
      )}
    >
      <div
        className={cn(
          sizeMap[size].className,
          "flex items-center justify-center relative",
        )}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 60 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="HigherBits logo loading"
          className="animate-spin-slow"
        >
          {/* Hexagon outline */}
          <path
            d="M30 5 L53.5 18.5 L53.5 41.5 L30 55 L6.5 41.5 L6.5 18.5 Z"
            stroke={logoFill}
            strokeWidth="4"
            strokeLinejoin="round"
            className="opacity-30"
          />
          {/* Inner pulsing element */}
          <path
            d="M30 18 L43 25 L43 35 L30 42 L17 35 L17 25 Z"
            fill={logoFill}
            className="animate-pulse"
          />
        </svg>
      </div>
    </div>
  )
}

export const LoadingSpinnerPage = ({
  size,
  className,
  animationFile,
  logoFill,
}: LoadingSpinnerProps) => (
  <div
    className={cn(
      "w-full h-screen flex items-center justify-center bg-background",
      className,
    )}
  >
    <LoadingSpinner
      size={size}
      animationFile={animationFile}
      logoFill={logoFill}
    />
  </div>
)

