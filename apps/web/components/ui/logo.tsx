"use client"

import React, { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BrandAssetsMenu, useBrandAssetsMenu } from "./brand-assets-menu"
import { createPortal } from "react-dom"
import dynamic from "next/dynamic"
const Lottie = dynamic(() => import("lottie-react"), { ssr: false })
import { useTheme } from "next-themes"
import { Hexagon } from "lucide-react"

// Animation cache to prevent multiple fetches of the same file
const animationCache = new Map<string, any>()

// Preload the default animation
if (typeof window !== "undefined") {
  fetch("/loading.json")
    .then((response) => response.json())
    .then((data) => {
      animationCache.set("/loading.json", data)
    })
    .catch((error) => console.error("Error preloading animation:", error))
}

interface LogoProps {
  fill?: string
  className?: string
  position?: "fixed" | "flex"
  hasLink?: boolean
  animationFile?: string
  showWordmark?: boolean
}

export function Logo({
  fill = "currentColor",
  className,
  position = "flex",
  hasLink = true,
  animationFile = "/loading.json",
  showWordmark,
}: LogoProps) {
  const { isVisible, setIsVisible, toggleMenu } = useBrandAssetsMenu()
  const logoRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [animationData, setAnimationData] = useState<any>(
    animationCache.get(animationFile) || null,
  )
  const [lottieReady, setLottieReady] = useState(false)
  const hasFetchedRef = useRef(false)
  const { resolvedTheme } = useTheme()

  // Only render portal on client-side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Skip fetch if we already have the animation in cache
    if (animationCache.has(animationFile)) {
      setAnimationData(animationCache.get(animationFile))
      return
    }

    // Skip duplicate fetches
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    // We'll use the JSON file as default
    if (animationFile && animationFile.endsWith(".json")) {
      fetch(animationFile)
        .then((response) => response.json())
        .then((data) => {
          // Cache the animation data
          animationCache.set(animationFile, data)
          setAnimationData(data)
        })
        .catch((error) =>
          console.error("Error loading Lottie animation:", error),
        )
    }
  }, [animationFile])

  // Set lottieReady to true after a small delay when animation data is available
  useEffect(() => {
    if (animationData) {
      const timer = setTimeout(() => {
        setLottieReady(true)
      }, 300) // Small delay to ensure Lottie is rendered before fading in
      return () => clearTimeout(timer)
    }
  }, [animationData])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsVisible(true)
  }

  const shouldShowWordmark = showWordmark ?? position === "fixed"

  const renderLogo = () => (
    <div
      className="flex items-center gap-2 h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Hexagon
        className={cn(
          "shrink-0 text-[#147070] dark:text-primary",
          shouldShowWordmark ? "h-7 w-7" : "h-full w-auto",
        )}
      />
      {shouldShowWordmark && (
        <span className="text-xl">
          <span className="font-bold text-foreground">Higher</span>
          <span className="font-bold text-[#147070] dark:text-primary">
            Bits
          </span>
        </span>
      )}
    </div>
  )

  const renderMenu = () => {
    if (!isVisible) return null

    // Use portal to render menu at document root
    if (isMounted) {
      return createPortal(
        <BrandAssetsMenu isVisible={isVisible} setIsVisible={setIsVisible} />,
        document.body,
      )
    }

    return null
  }

  if (!hasLink) {
    return (
      <div
        ref={logoRef}
        className={cn(
          `${position === "fixed" ? position : ""} h-7 flex items-center ${position === "fixed" ? "left-4 top-3" : ""} rounded-full group cursor-pointer relative`,
          className,
        )}
        onClick={toggleMenu}
        onContextMenu={handleContextMenu}
        title="Right-click for brand assets menu"
      >
        {renderLogo()}
        {renderMenu()}
        <span
          id="brand-tooltip"
          role="tooltip"
          className="opacity-0 hidden bg-white w-max group-focus-within:block text-[13px] text-slate-600 absolute shadow-md left-1/2 px-1 -translate-x-1/2 rounded-md transition-opacity top-full mt-1 dark:bg-neutral-900 dark:text-indigo-100 dark:outline dark:outline-1 dark:outline-neutral-700/50"
          style={{ animationDelay: "1000ms" }}
        >
          ⌘ + Click or Right-Click to open brand menu
        </span>
      </div>
    )
  }

  return (
    <div ref={logoRef} className="relative">
      <Link
        href="/?tab=home"
        className={cn(
          `${position === "fixed" ? position : ""} h-7 flex items-center ${position === "fixed" ? "left-4 top-3" : ""} rounded-full group cursor-pointer`,
          className,
        )}
        onClick={toggleMenu}
        onContextMenu={handleContextMenu}
        title="Right-click for brand assets menu"
      >
        {renderLogo()}
        <span
          id="brand-tooltip"
          role="tooltip"
          className="opacity-0 hidden bg-white w-max group-focus-within:block text-[13px] text-slate-600 absolute shadow-md left-1/2 px-1 -translate-x-1/2 rounded-md transition-opacity top-full mt-1 dark:bg-neutral-900 dark:text-indigo-100 dark:outline dark:outline-1 dark:outline-neutral-700/50"
          style={{ animationDelay: "1000ms" }}
        >
          ⌘ + Click or Right-Click to open brand menu
        </span>
      </Link>
      {renderMenu()}
    </div>
  )
}
