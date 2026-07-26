import sharp from "sharp"

export type AllowedMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif"
  | "image/avif"
  | "image/svg+xml"
  | "video/mp4"
  | "video/webm"
  | "text/plain"
  | "text/css"
  | "application/json"

export interface SecurityProcessResult {
  sanitizedBuffer: Buffer
  contentType: AllowedMimeType
  detectedFormat: string
}

const MAX_RASTER_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VECTOR_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_TEXT_SIZE = 2 * 1024 * 1024 // 2MB

/**
 * Inspects raw buffer magic bytes to determine true binary content type.
 */
export function detectMagicBytes(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) {
    return null
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png"
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg"
  }

  // GIF: 47 49 46 ("GIF")
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return "image/gif"
  }

  // WebP: RIFF ... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp"
  }

  // MP4 / AVIF: ftyp box at offset 4
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii")
    if (brand.startsWith("avif") || brand.startsWith("avis")) {
      return "image/avif"
    }
    return "video/mp4"
  }

  // WebM / EBML Header: 1A 45 DF A3
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return "video/webm"
  }

  // SVG / Text Check
  const sample = buffer.subarray(0, 512).toString("utf-8").toLowerCase()
  if (sample.includes("<svg") || sample.includes("<?xml")) {
    if (sample.includes("<svg")) {
      return "image/svg+xml"
    }
  }

  // Plain Text / JSON / CSS check
  if (/^[a-zA-Z0-9\s\{\}\[\]":;,\.\-\/\r\n\t]+$/.test(sample.substring(0, 100))) {
    if (sample.trim().startsWith("{") || sample.trim().startsWith("[")) {
      return "application/json"
    }
    return "text/plain"
  }

  return null
}

/**
 * Sanitizes SVG content by removing script tags, event handlers, and javascript URIs.
 */
export function sanitizeSvgBuffer(buffer: Buffer): Buffer {
  let svg = buffer.toString("utf-8")

  // Remove script tags and contents
  svg = svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")

  // Remove event handlers (e.g. onload, onerror, onclick)
  svg = svg.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")

  // Remove javascript: URIs
  svg = svg.replace(/href\s*=\s*["']?\s*javascript:[^"'>\s]+/gi, 'href="#"')
  svg = svg.replace(/src\s*=\s*["']?\s*javascript:[^"'>\s]+/gi, 'src="#"')

  return Buffer.from(svg, "utf-8")
}

/**
 * Processes, validates, and sanitizes incoming upload buffers before R2 storage.
 */
export async function processUploadBuffer({
  buffer,
  fileName,
  declaredContentType,
}: {
  buffer: Buffer
  fileName: string
  declaredContentType?: string
}): Promise<SecurityProcessResult> {
  if (!buffer || buffer.length === 0) {
    throw new Error("Upload buffer is empty")
  }

  const detectedType = detectMagicBytes(buffer)

  // Enforce Magic Byte / Content Type matching for media declarations
  if (declaredContentType && declaredContentType.includes("/")) {
    const declaredMajor = declaredContentType.split("/")[0]
    if (declaredMajor === "image" || declaredMajor === "video") {
      if (!detectedType) {
        throw new Error(
          `Security Error: File header does not match declared media type (${declaredContentType})`
        )
      }
      const detectedMajor = detectedType.split("/")[0]
      if (detectedMajor !== declaredMajor) {
        throw new Error(
          `Security Error: File contents (${detectedType}) do not match declared content type (${declaredContentType})`
        )
      }
    }
  }

  const effectiveType = (detectedType || declaredContentType || "text/plain") as AllowedMimeType

  // Enforce Max File Size
  if (effectiveType.startsWith("image/")) {
    if (effectiveType === "image/svg+xml") {
      if (buffer.length > MAX_VECTOR_SIZE) {
        throw new Error(`SVG file exceeds maximum allowed limit of ${MAX_VECTOR_SIZE / 1024 / 1024}MB`)
      }
    } else if (buffer.length > MAX_RASTER_SIZE) {
      throw new Error(`Image file exceeds maximum allowed limit of ${MAX_RASTER_SIZE / 1024 / 1024}MB`)
    }
  } else if (effectiveType.startsWith("video/")) {
    if (buffer.length > MAX_VIDEO_SIZE) {
      throw new Error(`Video file exceeds maximum allowed limit of ${MAX_VIDEO_SIZE / 1024 / 1024}MB`)
    }
  } else if (buffer.length > MAX_TEXT_SIZE) {
    throw new Error(`File exceeds maximum allowed limit of ${MAX_TEXT_SIZE / 1024 / 1024}MB`)
  }

  let sanitizedBuffer = buffer

  // Image Re-encoding & Metadata Stripping via Sharp
  if (
    effectiveType === "image/jpeg" ||
    effectiveType === "image/png" ||
    effectiveType === "image/webp" ||
    effectiveType === "image/avif"
  ) {
    try {
      const pipeline = sharp(buffer, { failOn: "none" })

      if (effectiveType === "image/jpeg") {
        sanitizedBuffer = await pipeline.jpeg({ quality: 90 }).toBuffer()
      } else if (effectiveType === "image/png") {
        sanitizedBuffer = await pipeline.png({ compressionLevel: 8 }).toBuffer()
      } else if (effectiveType === "image/webp") {
        sanitizedBuffer = await pipeline.webp({ quality: 90 }).toBuffer()
      } else if (effectiveType === "image/avif") {
        sanitizedBuffer = await pipeline.avif({ quality: 85 }).toBuffer()
      }
    } catch (err) {
      console.warn("Sharp re-encoding warning (using verified raw buffer):", err)
    }
  } else if (effectiveType === "image/svg+xml") {
    sanitizedBuffer = sanitizeSvgBuffer(buffer)
  }

  return {
    sanitizedBuffer,
    contentType: effectiveType,
    detectedFormat: detectedType || "raw",
  }
}
