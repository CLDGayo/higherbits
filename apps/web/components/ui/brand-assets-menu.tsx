"use client"

import React, { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { motion } from "motion/react"

interface AssetCardProps {
  title: string
  logoColor: "white" | "black"
  background?: string
  className?: string
  style?: React.CSSProperties
  index?: number
}

// HigherBits brand mark — hexagon wordmark, matching logo.tsx's renderLogo() pattern.
const HigherBitsLogoSVG = ({
  color = "currentColor",
  width = 124,
  height = 24,
}: {
  color?: string
  width?: number
  height?: number
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 84 84"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M42 6 L72 24 V60 L42 78 L12 60 V24 Z"
      fill="none"
      stroke={color}
      strokeWidth="6"
      strokeLinejoin="round"
    />
  </svg>
)

const AssetCard = ({
  title,
  logoColor,
  background,
  className,
  style,
  index = 0,
}: AssetCardProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const svgElement = document.querySelector(
      `[data-asset="${title}"] svg`,
    ) as SVGElement
    if (svgElement) {
      const svgString = new XMLSerializer().serializeToString(svgElement)
      navigator.clipboard.writeText(svgString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <motion.li
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, delay: index * 0.1 }}
      className={cn(
        "w-[184px] bg-white shadow-md dark:bg-[#181818] dark:outline dark:outline-1 dark:outline-[#2a2a2a] p-1 flex flex-col gap-1 rounded-lg",
        className,
      )}
      style={style}
    >
      <h3 className="sr-only">{title}</h3>
      <div
        data-asset={title}
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center h-16 rounded-lg bg-foreground/10",
        )}
      >
        <HigherBitsLogoSVG
          color={logoColor === "white" ? "#ffffff" : "#147070"}
          width={40}
          height={40}
        />
      </div>
      <div className="flex justify-stretch">
        <button
          className="py-[5px] group relative flex flex-1 items-center justify-center text-muted-foreground text-[13px] font-medium hover:bg-slate-100 dark:hover:bg-[#202020] rounded-md first:rounded-l-[20px] last:rounded-r-2xl transition-colors uppercase"
          onClick={handleCopy}
        >
          <div
            aria-hidden="true"
            className={cn(
              "absolute transition-opacity",
              copied ? "opacity-100" : "opacity-0",
            )}
          >
            <Icons.check className="h-4 w-4" />
          </div>
          <div
            className={cn(
              "flex items-center justify-center gap-0.5 transition-opacity",
              copied ? "opacity-0" : "opacity-100",
            )}
          >
            <Icons.copy className="h-4 w-4 mr-1" />
            copy svg
          </div>
        </button>
      </div>
    </motion.li>
  )
}

interface BrandAssetsMenuProps {
  isVisible: boolean
  setIsVisible: (isVisible: boolean) => void
}

export function BrandAssetsMenu({
  isVisible,
  setIsVisible,
}: BrandAssetsMenuProps) {
  const menuRef = useRef<HTMLUListElement>(null)

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsVisible(false)
    }
  }

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault()
    setIsVisible(false)
  }

  useEffect(() => {
    if (isVisible) {
      document.addEventListener("click", handleClickOutside)
      document.addEventListener("contextmenu", handleContextMenu)
      return () => {
        document.removeEventListener("click", handleClickOutside)
        document.removeEventListener("contextmenu", handleContextMenu)
      }
    }
  }, [isVisible, setIsVisible])

  if (!isVisible) return null

  return (
    <motion.ul
      ref={menuRef}
      className="fixed top-16 left-4 z-[100] flex flex-col gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <AssetCard
        title="Logo Dark (Black BG)"
        logoColor="white"
        background="black"
        index={0}
      />
      <AssetCard
        title="Logo White (White BG)"
        logoColor="black"
        background="white"
        index={1}
      />
    </motion.ul>
  )
}

export const useBrandAssetsMenu = () => {
  const [isVisible, setIsVisible] = useState(false)

  const toggleMenu = (e: React.MouseEvent) => {
    // Handle both right-click and Command/Ctrl key
    if (e.button === 2 || e.metaKey || e.ctrlKey) {
      e.preventDefault()
      setIsVisible(!isVisible)
    }
  }

  return {
    isVisible,
    setIsVisible,
    toggleMenu,
  }
}
