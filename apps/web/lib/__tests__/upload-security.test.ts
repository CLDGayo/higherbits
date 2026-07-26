import { describe, it, expect } from "vitest"
import {
  detectMagicBytes,
  sanitizeSvgBuffer,
  processUploadBuffer,
} from "../upload-security"

describe("upload-security module", () => {
  describe("detectMagicBytes", () => {
    it("detects PNG magic bytes correctly", () => {
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      expect(detectMagicBytes(pngHeader)).toBe("image/png")
    })

    it("detects JPEG magic bytes correctly", () => {
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0])
      expect(detectMagicBytes(jpegHeader)).toBe("image/jpeg")
    })

    it("detects GIF magic bytes correctly", () => {
      const gifHeader = Buffer.from("GIF89a", "utf-8")
      expect(detectMagicBytes(gifHeader)).toBe("image/gif")
    })

    it("detects WebP magic bytes correctly", () => {
      const webpHeader = Buffer.alloc(12)
      webpHeader.write("RIFF", 0)
      webpHeader.write("WEBP", 8)
      expect(detectMagicBytes(webpHeader)).toBe("image/webp")
    })

    it("detects MP4 magic bytes correctly", () => {
      const mp4Header = Buffer.alloc(12)
      mp4Header.write("ftypisom", 4)
      expect(detectMagicBytes(mp4Header)).toBe("video/mp4")
    })

    it("detects WebM magic bytes correctly", () => {
      const webmHeader = Buffer.from([0x1a, 0x45, 0xdf, 0xa3])
      expect(detectMagicBytes(webmHeader)).toBe("video/webm")
    })

    it("detects SVG magic content correctly", () => {
      const svgContent = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><path/></svg>')
      expect(detectMagicBytes(svgContent)).toBe("image/svg+xml")
    })
  })

  describe("sanitizeSvgBuffer", () => {
    it("strips script tags and inline event handlers from SVG", () => {
      const maliciousSvg = Buffer.from(
        '<svg onload="alert(1)"><script>alert("xss")</script><a href="javascript:alert(2)">Click</a></svg>'
      )
      const sanitized = sanitizeSvgBuffer(maliciousSvg).toString("utf-8")
      expect(sanitized).not.toContain("<script>")
      expect(sanitized).not.toContain("onload=")
      expect(sanitized).not.toContain("javascript:")
      expect(sanitized).toContain("<svg")
    })
  })

  describe("processUploadBuffer security rules", () => {
    it("rejects empty buffers", async () => {
      await expect(
        processUploadBuffer({
          buffer: Buffer.alloc(0),
          fileName: "test.png",
        })
      ).rejects.toThrow("Upload buffer is empty")
    })

    it("rejects files exceeding maximum size bounds", async () => {
      const oversizedImage = Buffer.alloc(11 * 1024 * 1024)
      oversizedImage[0] = 0x89
      oversizedImage[1] = 0x50
      oversizedImage[2] = 0x4e
      oversizedImage[3] = 0x47

      await expect(
        processUploadBuffer({
          buffer: oversizedImage,
          fileName: "huge.png",
          declaredContentType: "image/png",
        })
      ).rejects.toThrow("exceeds maximum allowed limit")
    })

    it("detects fake extension / mismatched content type attacks", async () => {
      // Fake PNG containing EXE header
      const exeHeaderInPng = Buffer.from("MZ\x90\x00\x03\x00\x00\x00", "ascii")

      await expect(
        processUploadBuffer({
          buffer: exeHeaderInPng,
          fileName: "malware.png",
          declaredContentType: "image/png",
        })
      ).rejects.toThrow("Security Error")
    })
  })
})
