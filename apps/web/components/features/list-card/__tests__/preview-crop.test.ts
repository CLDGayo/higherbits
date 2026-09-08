import { describe, expect, it } from "vitest"

import { getPreviewCropScale } from "../preview-crop"

describe("getPreviewCropScale", () => {
  it("zooms shadcn's whitespace-heavy screenshot canvases", () => {
    expect(getPreviewCropScale(true)).toBe(2)
  })

  it("does not crop creator previews", () => {
    expect(getPreviewCropScale(false)).toBe(1)
  })
})
