/** @vitest-environment jsdom */
import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}))
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))
vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className}>{children}</div>
    ),
  },
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: () => 0,
}))

import { LinkPreview } from "../link-preview"

it("waits until the preview opens before requesting a screenshot", async () => {
  render(
    <LinkPreview
      url="https://example.com"
      previewAlt="Website preview for example.com"
    >
      Example
    </LinkPreview>,
  )

  expect(screen.queryByAltText("Website preview for example.com")).toBeNull()

  fireEvent.focus(screen.getByRole("link", { name: "Example" }))

  await waitFor(() => {
    expect(screen.getByAltText("Website preview for example.com")).toBeTruthy()
  })
  expect(
    screen.getByAltText("Website preview for example.com").getAttribute("src"),
  ).toContain("api.microlink.io")
})
