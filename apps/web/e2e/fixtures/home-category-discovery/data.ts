// Browser fixture data only. This module never imports the app's data clients.
export const syntheticDemos = Array.from({ length: 26 }, (_, index) => {
  const id = index + 1
  return {
    id,
    demo_slug: "default",
    created_at: new Date(Date.UTC(2026, 9, id)).toISOString(),
    tags: [],
    user: { username: "fixture" },
    component: {
      name: `Synthetic component ${id}`,
      component_slug: `synthetic-component-${id}`,
      likes_count: 26 - index,
    },
  }
})

export async function getCatalogueChipPool() {
  return syntheticDemos
}

export async function getLandingCatalogueRows() {
  return {
    mostLoved: syntheticDemos.slice(0, 12),
    newest: syntheticDemos.slice(-12).reverse(),
  }
}

export function shuffleArray<T>(items: T[]): T[] {
  return [...items]
}

export async function getCachedFeaturedExample() {
  return null
}

export async function getCachedLandingAuthors() {
  return []
}
