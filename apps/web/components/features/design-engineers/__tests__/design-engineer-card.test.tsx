/** @vitest-environment jsdom */
import React from "react"
import { render } from "@testing-library/react"
import { expect, it, vi } from "vitest"

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <img alt={alt} src={src} />
  ),
}))
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className}>{children}</div>
    ),
  },
}))

import { DesignEngineerCard } from "../design-engineer-card"

it("renders a top component when its nested author is absent", () => {
  const author: any = {
    username: "creator",
    total_views: 0,
    total_usages: 0,
    total_downloads: 0,
    top_components: [
      {
        id: 1,
        name: "Example demo",
        demo_slug: "default",
        component_slug: "example",
        component: {
          name: "Example component",
          component_slug: "example",
          user: null,
        },
      },
    ],
  }

  const { container } = render(<DesignEngineerCard author={author} />)
  const componentLink = container.querySelector('a[href="/creator/example/default"]')

  expect(componentLink).not.toBeNull()
})
