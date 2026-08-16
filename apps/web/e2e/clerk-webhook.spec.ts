import { expect, test } from "@playwright/test"

/**
 * The Clerk user-creation webhook rejects unsigned payloads.
 *
 * This is the one durable assertion rescued from the old `fixes.spec.ts`
 * during the §8.1 triage. It survives because it asserts a **contract** - an
 * unauthenticated caller cannot create a user by POSTing a plausible body -
 * rather than the markup of a page that has since been replaced.
 *
 * Its three siblings were deleted. They asserted a header, a sidebar trigger
 * and a `w-[400px]` search container on `/`, all identified by Tailwind class
 * and `data-sidebar` attribute, and were named after annotations on a
 * screenshot ("black circle", "orange circle"). Measured at triage: `/` now
 * renders zero `<header>`, zero `[data-sidebar]`, zero `[data-state]` and zero
 * `.w-[400px]` elements - it is a marketing landing page. They were not
 * catching a regression; the surface they described no longer exists. They
 * also hardcoded `http://localhost:3000` in a cookie URL, so they silently did
 * nothing whenever the suite ran on its default port.
 */
test("the Clerk webhook refuses an unsigned user.created payload", async ({
  request,
}) => {
  const response = await request.post("/api/webhooks/clerk", {
    data: {
      data: {
        id: `user_test_${Date.now()}`,
        email_addresses: [{ email_address: "testuser123@example.com" }],
        first_name: "Test",
        last_name: "User",
        image_url: "https://example.com/image.png",
      },
      type: "user.created",
    },
  })

  expect(response.status()).toBe(400)
  const body = await response.json()
  expect(["Missing required headers", "Invalid webhook signature"]).toContain(
    body.error,
  )
})
