import { describe, expect, it } from "vitest"
import { collectFormErrors } from "../config/utils"

describe("collectFormErrors", () => {
  it("returns nothing for an empty error tree", () => {
    expect(collectFormErrors({})).toEqual([])
    expect(collectFormErrors(undefined)).toEqual([])
  })

  it("labels a top-level field error", () => {
    const errors = {
      description: {
        type: "too_small",
        message: "Description must be at least 10 characters.",
      },
    }

    expect(collectFormErrors(errors)).toEqual([
      "Description: Description must be at least 10 characters.",
    ])
  })

  it("reaches leaves inside the demos field array", () => {
    // The shape react-hook-form produces for `demos.0.tags` — the case a plain
    // Object.keys() flattened to the useless label "demos".
    const errors = {
      demos: [
        {
          tags: {
            type: "too_small",
            message: "At least one tag is required.",
            ref: { name: "demos.0.tags" },
          },
          preview_image_data_url: {
            type: "too_small",
            message: "Cover image is required.",
          },
        },
      ],
    }

    expect(collectFormErrors(errors)).toEqual([
      "Demos → Tags: At least one tag is required.",
      "Demos → Cover image: Cover image is required.",
    ])
  })

  it("ignores the ref node rather than walking into it", () => {
    const errors = {
      name: {
        message: "Name must be at least 2 characters.",
        ref: { name: "name", message: "should not be collected" },
      },
    }

    expect(collectFormErrors(errors)).toEqual([
      "Name: Name must be at least 2 characters.",
    ])
  })
})
