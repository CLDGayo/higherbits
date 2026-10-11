export const POPULAR_GOOGLE_FONT_FAMILIES = [
  "Roboto", "Open Sans", "Lato", "Montserrat", "Roboto Condensed", "Oswald", "Poppins", "Source Sans 3", "Roboto Mono", "Raleway",
  "Merriweather", "Playfair Display", "Nunito Sans", "Inter", "Noto Sans", "Ubuntu", "PT Sans", "Lora", "Nunito", "Work Sans",
  "DM Sans", "Rubik", "Fira Sans", "Libre Baskerville", "Manrope", "Mulish", "IBM Plex Sans", "Noto Serif", "Josefin Sans", "Karla",
  "Quicksand", "Cabin", "Arimo", "Bitter", "Barlow", "Bebas Neue", "Inconsolata", "Anton", "Source Code Pro", "Crimson Text",
  "Fira Code", "Libre Franklin", "Heebo", "Space Grotesk", "Archivo", "Cormorant Garamond", "Exo 2", "Yanone Kaffeesatz", "Assistant", "Oxygen",
  "Hind", "Mukta", "Teko", "Titillium Web", "Asap", "Varela Round", "Comfortaa", "Red Hat Display", "Red Hat Text", "Sora",
  "Plus Jakarta Sans", "DM Serif Display", "Fraunces", "Urbanist", "Outfit", "Space Mono", "Bricolage Grotesque", "League Spartan", "Jost", "Prata",
  "Righteous", "Abril Fatface", "Alfa Slab One", "Dancing Script", "Pacifico", "Lobster", "Caveat", "Permanent Marker", "Great Vibes", "Sacramento",
  "Architects Daughter", "Patrick Hand", "Indie Flower", "Shrikhand", "Archivo Black", "Barlow Condensed", "IBM Plex Mono", "Noto Sans JP", "Noto Sans KR", "Noto Sans SC",
  "Noto Sans TC", "Noto Sans Arabic", "Tajawal", "Cairo", "Changa", "El Messiri", "Noto Kufi Arabic", "Amiri", "Almarai", "JetBrains Mono",
] as const

const catalogLoads = new WeakMap<Document, Promise<string[]>>()

export function preloadGoogleFontCatalog(doc: Document) {
  const existing = catalogLoads.get(doc)
  if (existing) return existing
  if (!doc.head || !doc.fonts) return Promise.reject(new Error("Font previews are unavailable in this browser."))

  const link = doc.createElement("link")
  link.rel = "stylesheet"
  const query = new URLSearchParams()
  POPULAR_GOOGLE_FONT_FAMILIES.forEach((family) => query.append("family", family))
  query.set("display", "swap")
  link.href = `https://fonts.googleapis.com/css2?${query}`
  link.dataset.hbGoogleFontCatalog = "true"
  const load = (async () => {
    await new Promise<void>((resolve, reject) => {
      link.addEventListener("load", () => resolve(), { once: true })
      link.addEventListener("error", () => reject(new Error("Google Font previews could not be loaded.")), { once: true })
      doc.head.append(link)
    })
    const faces = await Promise.all(POPULAR_GOOGLE_FONT_FAMILIES.map(async (family) => ({
      family,
      loaded: await doc.fonts.load(`400 16px "${family}"`, family).catch(() => []),
    })))
    const failed = faces.filter(({ loaded }) => loaded.length === 0).map(({ family }) => family)
    link.dataset.hbGoogleFontCatalogFailed = JSON.stringify(failed)
    link.dataset.hbGoogleFontCatalogReady = "true"
    return failed
  })()
  catalogLoads.set(doc, load)
  void load.catch(() => {
    catalogLoads.delete(doc)
    link.remove()
  })
  return load
}

export function loadGoogleFont(doc: Document, family: string) {
  if (!(POPULAR_GOOGLE_FONT_FAMILIES as readonly string[]).includes(family) || !doc.head) return
  const catalog = doc.head.querySelector<HTMLLinkElement>("link[data-hb-google-font-catalog]")
  const failed = JSON.parse(catalog?.dataset.hbGoogleFontCatalogFailed ?? "[]") as string[]
  if (catalog && !failed.includes(family)) return
  if (Array.from(doc.querySelectorAll<HTMLLinkElement>("link[data-hb-google-font]")).some((link) => link.dataset.hbGoogleFont === family)) return
  const link = doc.createElement("link")
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}&display=swap`
  link.dataset.hbGoogleFont = family
  doc.head.append(link)
}
