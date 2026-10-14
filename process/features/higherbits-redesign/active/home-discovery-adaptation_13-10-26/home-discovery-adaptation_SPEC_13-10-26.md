# HigherBits Home discovery adaptation — product specification

TL;DR: Give visitors a dense, inviting discovery Home inspired by 21st.dev, filled with real HigherBits content and honest availability labels.

## Summary

The HigherBits Home should become a useful place to discover components, creators, collections, gradients, and templates. Visitors should quickly see fresh work, browse meaningful categories, scroll through preview rows, and reach working destinations. The page should carry the compact rhythm of the current 21st.dev Home while retaining HigherBits' identity. Where a relevant experience is planned but unavailable, the page should say “Coming soon” at the precise action or section instead of suggesting it already works.

## User Stories / Jobs To Be Done

- As a developer looking for UI inspiration, I want a fresh set of component previews and clear category paths, so I can find a useful example quickly.
- As a returning visitor, I want distinct discovery areas and working “View all” links, so I can explore beyond the first screen.
- As a visitor considering a collection, library, gradient, or template, I want to know what I can browse now and what is still planned, so I do not hit dead ends.
- As a keyboard, touch, or small-screen visitor, I want the same content and honest availability cues, so discovery remains usable on my device.

## What The User Wants (Behavioral Outcomes)

- Home opens with compact discovery sections, real preview cards, concise headings, and clear routes into the catalog. Its visual hierarchy, horizontal rows, subtle boundaries, and overflow cues closely reflect the observed 21st.dev Home, with HigherBits names, colors, and content.
- Navigation and search remain available. Categories appear in grouped lists with counts derived from available content. A category with no published content is shown honestly or withheld from a claimed count; no count is invented.
- Fresh and popular component rows use actual HigherBits entries. A category recommendation is described as category discovery unless HigherBits has evidence of a personalized recommendation. Component cards, row scrolling, and “View all” take visitors to working previews or browse views.
- Publicly browsable collections, libraries, gradients, and templates appear when their content and destination are verified. Their labels describe what the visitor can actually do; unsupported creation, purchase, editorial curation, or ranking claims are separated from browsing.
- Applicable future capabilities, including public gradient creation and recently viewed content, receive visible “Coming soon” badges and short explanations. Their controls expose unavailability to assistive technology and never open a broken route or pretend to complete an action.
- Loading, empty, and failed content states tell visitors what happened without turning unknown data into zero or leaving endless placeholders.
- The discovery experience works in dark and light themes, across desktop, tablet, and phone sizes, with accessible focus and reduced-motion behavior.

## Flow / State Diagram

```text
Open Home
   |
   +--> See real discovery rows and grouped categories
   |       |
   |       +--> Scroll a row --> Open card --> Working component/collection page
   |       |
   |       +--> View all / category --> Working browse view
   |       |
   |       +--> Search --> Existing search results
   |
   +--> See future feature --> Read Coming soon explanation
   |                            --> No broken navigation or false completion
   |
   +--> Data is loading / empty / failed
           --> Distinct, honest state --> Retry or browse another area where available
```

## Acceptance Criteria (Testable Outcomes)

- AC1: Home presents the agreed discovery sections in a clear reading order, with HigherBits branding and real content wherever available; unsupported sections are clearly identified.
  proven by: Home discovery section-order and content scenario, extending the existing Home catalogue browser gate.
  strategy: Fully-Automated
- AC2: Fresh, popular, and category component cards open a working preview or full page, and their “View all” actions reach the corresponding real browse view.
  proven by: Home card-and-view-all navigation scenario in the existing Playwright browser harness.
  strategy: Fully-Automated
- AC3: Grouped category counts match published HigherBits content, and category links reach matching results without presenting unknown totals as zero.
  proven by: Home category-count integration scenario, paired with the existing sidebar-count regression tests.
  strategy: Fully-Automated
- AC4: Each horizontal preview row can be traversed with mouse, keyboard, and touch without trapping focus or hiding the next-content cue.
  proven by: Home row navigation scenario in Playwright at desktop, tablet, and phone viewports.
  strategy: Fully-Automated
- AC5: Collections, libraries, gradients, and templates shown as available have verified content and working destinations; no unverified popularity or purchase claim appears.
  proven by: Home destination and factual-copy browser scenario; manual evidence review for any editorial wording.
  strategy: Hybrid
- AC6: A future feature shows a visible “Coming soon” badge and explanation, communicates its unavailable state to assistive technology, and cannot navigate to a missing route.
  proven by: Home unavailable-action keyboard and click scenario plus automated accessibility check.
  strategy: Fully-Automated
- AC7: Personalized wording and “Jump back in” appear only with real browsing-history evidence; otherwise the future experience is honestly labeled.
  proven by: Home signed-out and no-history scenario in the browser harness.
  strategy: Fully-Automated
- AC8: Loading, zero-content, and failed-content outcomes are visually distinct; a failed request does not produce false counts or a lasting loading placeholder.
  proven by: Home settled-state and forced-error scenarios using the existing empty/loading browser gate.
  strategy: Fully-Automated
- AC9: Desktop, tablet, and phone layouts keep all sections reachable and readable, support touch scrolling, visible focus, and reduced motion, and show no new accessibility violations in light or dark mode.
  proven by: Home responsive/theme screenshot scenario and the existing Playwright/Axe accessibility gate.
  strategy: Hybrid
- AC10: Existing sidebar navigation and search still reach their working destinations after the Home changes.
  proven by: Home sidebar/search regression scenario using the existing sidebar and browser tests.
  strategy: Fully-Automated

## Out Of Scope

- Build new collection curation, personalized recommendations, view-history storage, gradient creation, or template purchase infrastructure.
- Copy 21st.dev branding, copy, assets, user metrics, creator identities, or site-specific tools without a meaningful HigherBits equivalent.
- Redesign the marketing landing page, component detail pages, admin tools, or the already-adapted sidebar beyond integration needed for Home.
- Deploy to production; this task ends with a verified local implementation.

## Constraints

- The live 21st.dev Home is the visual and interaction reference. The requested screenshots were not present in the current task, and the user selected the live page instead.
- Use HigherBits' existing brand, themes, content, routes, services, and dependencies. Do not hotlink reference assets or invent data.
- Preserve permission checks and distinguish public browsing from creator/admin-only actions.
- Keep unavailable actions explicit, accessible, and non-navigating. Do not state release dates.
- Honor keyboard navigation, visible focus, readable contrast, touch use, reduced motion, and narrow screens.
- Protect unrelated working-tree changes. Follow the repository's plan-validation and explicit execution-approval checkpoint. Production is VPS-only; no deployment is included here.

## Open Questions

None. Any live-content-dependent placement is conditional on verification during implementation: use real eligible content, an honest empty state, or an appropriately labeled future preview.

## Background / Research Findings

The live 21st.dev Home was observed with a compact dark sidebar and top utility strip. Its main order begins with Top today, New & noteworthy, grouped Categories, a featured library, More heroes, Gradients, and Templates; lower areas include ASCII art, promising libraries, several category rails, and Explore everything. Preview rails scroll horizontally; checked “View all” actions reach category or listing pages. At 390 pixels the sidebar collapses with bottom navigation; at 820 pixels it remains visible. Some lazy rails and hover details were not fully inspectable. “Jump back in” and “The best navbars” were in the user's requested coverage list but were not observed on the accessible live state.

HigherBits' current Home has three populated component rails: Featured, Newest, and Popular. The adapted sidebar already offers search and category navigation. Public collections and libraries can be browsed, although library metrics include hardcoded data and no editorial curation marker has been verified. The live gradient category shows nine real component cards; public creation is unsupported. The live public template catalog shows one visible card, “template test” by Cozy Downloads, priced at $20, but its card destination and purchase flow were not established. No persisted recently viewed source was found. The current Home browser test explicitly assumes only the three existing section headings, so it must be updated when the approved page changes.

**Design read:** Product discovery for developers and UI creators; compact, editorial, dark-first browsing in HigherBits' visual language. Keep variance and motion restrained and density higher than the current Home, while preserving a readable light theme.

### Reference-to-HigherBits feature mapping

“Implement now” means an existing public capability can supply honest content. “Coming soon” means a relevant future capability needs an explicit unavailable state. Conditional items must be checked against live content and destination behavior before being presented as working.

| Reference section or interaction | HigherBits equivalent | Evidence and limit | Decision |
| --- | --- | --- | --- |
| Sidebar navigation and search | Existing adapted sidebar and search | Existing product surface; source routes and keyboard search observed in research | Implement now by preserving integration |
| Top today | Popular component browse row | Popular data exists, but a true daily ranking was not verified | Implement now as **Popular**, without “today” claim |
| New & noteworthy | Newest component browse row | Existing newest feed and real cards | Implement now as **New additions** or equivalent factual label |
| Grouped Categories and counts | Published component categories and sidebar counts | Category routes and count service exist; counts must match published content | Implement now |
| Curated collection such as “The best navbars” | Public HigherBits collections | Collection browse exists; that named curated record was not verified | Show real eligible collection if found; otherwise Coming soon for editorial curation |
| Featured library / creator collection | Public libraries and creator pages | Browse exists; library popularity metrics are hardcoded, featured designation unverified | Implement factual browsing; no invented featured/popularity claim |
| More heroes | Hero category components | Category browsing exists; no personalized feed evidence | Implement as **More heroes** without “because you browsed” |
| Gradients browse | Gradient category results | Live public page shows nine real cards, including Hover Border Gradient and Shiny Button | Implement now with real results |
| Create a gradient | Public gradient editor | Only owner/admin Studio route found | Coming soon for public creation action |
| Templates | Public template catalog | Live public page shows one card; its destination and purchase remain unverified | Implement real browsing; present card actions as working only after destination verification |
| ASCII art, Hero, Avatars, Tabs, AI chats and other lower rails | Existing matching HigherBits categories | Tag routes exist; category inventory may be sparse or empty | Implement eligible populated rails; honest empty/Coming soon preview for relevant gaps |
| New & promising libraries | Public library browse | Libraries exist; “new/promising” ranking not evidenced | Show factual library discovery, no ranking assertion |
| Explore everything | Category/listing links | Existing catalog and category routes | Implement now |
| Jump back in / recently viewed | No verified history source | Research found no persisted recently viewed data | Coming soon, no personalized claim |
| Reference-only brands and tools | No meaningful HigherBits equivalent | Site-specific identities and tooling do not transfer | Not applicable; omit |

Observed reference behavior is limited to the accessible live state. No backend implementation or authenticated personalization is inferred from its appearance.
