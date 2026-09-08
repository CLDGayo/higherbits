import { describe, it, expect } from "vitest"
import { HOMEPAGE_FAQ, faqPageJsonLd } from "../faq"
import { SITE_DESCRIPTION } from "@/lib/constants"

// Google treats FAQPage markup whose answers are not visible on the page as a
// structured-data policy violation, and the usual cause is the visible copy and
// the JSON-LD drifting apart. <FaqSection> and faqPageJsonLd() both read
// HOMEPAGE_FAQ; this asserts the mapping stays lossless.
describe("homepage FAQ structured data", () => {
  it("emits one Question per visible FAQ entry, with matching text", () => {
    const jsonLd = faqPageJsonLd()

    expect(jsonLd["@type"]).toBe("FAQPage")
    expect(jsonLd.mainEntity).toHaveLength(HOMEPAGE_FAQ.length)

    expect(jsonLd.mainEntity.map((e) => e["@type"])).toEqual(
      HOMEPAGE_FAQ.map(() => "Question"),
    )
    expect(jsonLd.mainEntity.map((e) => e.name)).toEqual(
      HOMEPAGE_FAQ.map((entry) => entry.question),
    )
    expect(jsonLd.mainEntity.map((e) => e.acceptedAnswer.text)).toEqual(
      HOMEPAGE_FAQ.map((entry) => entry.answer),
    )
  })

  it("leads with the canonical entity sentence", () => {
    expect(HOMEPAGE_FAQ[0]?.answer).toBe(SITE_DESCRIPTION)
  })
})
