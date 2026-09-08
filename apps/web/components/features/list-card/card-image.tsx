"use client"

import { useState, useEffect } from "react"

interface ComponentPreviewImageProps {
  src: string
  lightSrc?: string
  alt: string
  fallbackSrc: string
  className?: string
  scale?: number
}

export default function ComponentPreviewImage({
  src,
  lightSrc,
  alt,
  fallbackSrc,
  className,
  scale = 1,
}: ComponentPreviewImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [lightImgSrc, setLightImgSrc] = useState(lightSrc)
  const [isPlaceholder, setIsPlaceholder] = useState(src === fallbackSrc)
  const [isLightPlaceholder, setIsLightPlaceholder] = useState(lightSrc === fallbackSrc)

  useEffect(() => {
    setImgSrc(src)
    setIsPlaceholder(src === fallbackSrc)
    if (lightSrc) {
      setLightImgSrc(lightSrc)
      setIsLightPlaceholder(lightSrc === fallbackSrc)
    }
  }, [src, lightSrc, fallbackSrc])

  if (lightSrc) {
    return (
      <>
        <img
          src={imgSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`${className || ""} hidden dark:block`}
          onError={() => {
            setImgSrc(fallbackSrc)
            setIsPlaceholder(true)
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
            backgroundColor: isPlaceholder ? "transparent" : "",
          }}
        />
        <img
          src={lightImgSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`${className || ""} block dark:hidden`}
          onError={() => {
            setLightImgSrc(fallbackSrc)
            setIsLightPlaceholder(true)
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
            backgroundColor: isLightPlaceholder ? "transparent" : "",
          }}
        />
      </>
    )
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => {
        setImgSrc(fallbackSrc)
        setIsPlaceholder(true)
      }}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: `scale(${scale})`,
        backgroundColor: isPlaceholder ? "transparent" : "",
      }}
    />
  )
}
