# HigherBits.dev Current Product Rebrand SPEC

TL;DR: Present the current product consistently as HigherBits.dev, with products named HigherBits MCP and HigherBits AI. First-party internal identifiers may adopt HigherBits naming where safe, while old values or names remain accepted or are migrated compatibly; truthful history, required disclosures, third-party identifiers, and working integrations remain protected.

## Summary

Visitors and customers should experience the current product as HigherBits.dev across its pages, product copy, documentation, and branded images. HigherBits MCP and HigherBits AI are the product names. First-party internal identifiers, including analytics and storage keys, environment or configuration names, and waitlist identifiers, may adopt HigherBits naming where safe. Existing values and names must remain accepted or be migrated in a way that preserves current users, configuration, and integrations. Older references may remain where they accurately describe history, attribution, legal or license requirements, vendors, or working compatibility paths; those references must not appear as current product branding. Third-party-owned identifiers are not first-party branding and are not renamed by this SPEC.

## User Stories / Jobs To Be Done

- As a visitor, I want the site and its product pages to consistently identify as HigherBits.dev, so I understand which product I am using.
- As a customer exploring the AI and MCP products, I want them presented as HigherBits AI and HigherBits MCP, so their names are clear and consistent.
- As a returning MCP customer or integration user, I want my existing links and API clients to keep working, so the rebrand does not interrupt my workflow.
- As an existing user or operator, I want saved data, analytics, configuration, and waitlist flows to remain compatible when first-party identifiers change, so the rebrand does not disrupt my account or integrations.
- As a reader of product documentation or company history, I want current product wording alongside accurate history and required attribution, so the rebrand does not mislead me or erase important disclosures.

## What The User Wants (Behavioral Outcomes)

- Current product pages, navigation, pricing, onboarding, console screens, documentation, and product imagery present HigherBits.dev as the umbrella brand.
- The MCP product is presented as HigherBits MCP, with `/higherbits-mcp` remaining its canonical page address. The AI product currently called Magic Chat is presented as HigherBits AI.
- Legacy names do not describe current products in user-facing copy or branded images.
- Existing legacy URLs and API identifiers remain usable. They function as compatibility paths and are not presented to users as product names.
- First-party internal identifiers, including analytics and storage keys, environment or configuration names, and waitlist or audience identifiers, may use canonical HigherBits naming where safe. Old names or values remain accepted or are migrated compatibly so current users, configuration, and integrations continue working.
- Third-party-owned identifiers remain distinct from first-party names and are not renamed by this rebrand. Accurate historical statements, source attribution, required legal and license disclosures, and relevant vendor references remain intact.

## Flow / State Diagram

```
[Visitor opens a current product page]
                  |
                  v
       [Sees HigherBits.dev branding]
                  |
          +-------+-------+
          |               |
          v               v
 [Chooses HigherBits MCP] [Chooses HigherBits AI]
          |               |
          +-------+-------+
                  |
                  v
       [Sees consistent product copy]

[Returning user opens a legacy MCP link] --> [Same destination and query preserved]
[Existing client calls a legacy API] -----> [Same API behavior remains available]
[Existing user or operator has old first-party identifiers] --> [HigherBits experience] --> [Values remain accepted or are compatibly migrated]

[Reader opens history, legal, or vendor information] --> [Truthful references and required disclosures remain]
```

## Acceptance Criteria (Testable Outcomes)

- AC1: Current product pages and shared navigation identify the site as HigherBits.dev and use HigherBits MCP or HigherBits AI for the respective products.
  proven by: Playwright public-route brand assertion matrix, covering the existing public route and product journeys.
  strategy: Fully-Automated
- AC2: Current product documentation, pricing, onboarding and console guidance use the approved product names; old names appear only where their historical, attribution, legal, vendor, or compatibility meaning is accurate.
  proven by: Public copy and attribution inventory, paired with the existing public-route matrix and a human accuracy review of historical and required disclosures.
  strategy: Hybrid
- AC3: The canonical MCP experience remains HigherBits MCP at `/higherbits-mcp`, and legacy MCP page links continue to reach the same destinations with their query information preserved.
  proven by: HigherBits MCP legacy page redirect scenario and public-route matrix.
  strategy: Fully-Automated
- AC4: Existing legacy MCP API identifiers continue to provide the same API behavior, while user-facing product copy identifies the service as HigherBits MCP.
  proven by: Legacy HigherBits MCP API route equivalence scenario and current HigherBits MCP API route tests.
  strategy: Fully-Automated
- AC5: Current product logos, preview images, and other branded artwork no longer show legacy product branding and read as part of HigherBits.dev.
  proven by: Visual evidence capture across the relevant product routes, themes, and viewports, followed by review of the branded image assets.
  strategy: Hybrid
- AC6: Historical statements, source attribution, required legal and license disclosures, vendor references, and external integration details remain accurate and usable after the rebrand.
  proven by: Public copy and attribution inventory, legal/history accuracy review, and legacy API compatibility scenarios.
  strategy: Hybrid
- AC7: First-party analytics and storage keys, environment or configuration names, and waitlist identifiers may adopt HigherBits naming where safe; existing values or names remain accepted or are compatibly migrated so current user data, configuration, measurement, and integrations continue working. Third-party-owned identifiers are not renamed as part of this requirement.
  proven by: First-party identifier inventory and compatibility scenarios for existing analytics, stored data, configuration, and waitlist flows, with review of identifier ownership and migration/alias behavior.
  strategy: Hybrid

## Out Of Scope

- Changing product functionality, pricing rules, authentication, API behavior, or data contracts.
- Removing or falsifying accurate history, required attribution, or legal and license disclosures.
- Retiring legacy URLs or API identifiers, or changing vendor-hosted asset locations, registry addresses, or other third-party integration contracts.
- Renaming third-party-owned identifiers, including vendor audience identifiers, or changing their external behavior.
- Removing support for old first-party identifier values or names before compatibility for current users, configuration, and integrations is preserved.
- Rebranding third-party products or vendors referenced by the site.

## Constraints

- Use HigherBits.dev as the umbrella brand, HigherBits MCP for the MCP product, and HigherBits AI for the product currently called Magic Chat.
- Keep `/higherbits-mcp` canonical and preserve existing legacy URLs and API identifiers as working, unbranded compatibility paths.
- First-party analytics and storage keys, environment or configuration names, and waitlist identifiers may adopt HigherBits naming where safe; old values or names must remain accepted or be compatibly migrated. This is an outcome requirement, not a decision about migration mechanics.
- Distinguish first-party identifiers from third-party-owned identifiers. Do not rename third-party identifiers or alter their contracts under this rebrand.
- Preserve accurate historical content, source attribution, required legal and license disclosures, and third-party references.
- Do not confuse a vendor URL, third-party source identifier, registry contract, historical/legal/license reference, or compatibility route with the current product brand.
- Keep existing product behavior and service integrations unchanged.

## Open Questions

None. Product names, historical and disclosure boundaries, legacy URL/API compatibility, and the safe-renaming plus compatibility requirement for first-party internal identifiers are confirmed.

## Background / Research Findings

- The user's request was: “change also the wordings such as 21st.dev, 21st, magic-mcp, magic or anything related to 21st.dev. let's have a complete rebrand to higherbits.dev”. The user confirmed HigherBits AI as the Magic Chat product name, asked to preserve accurate history and required disclosures, and asked that legacy URLs and API identifiers keep working without serving as visible branding. The user further confirmed that first-party internal identifiers should adopt HigherBits naming where safe, with old values or aliases preserved or migrated for compatibility.
- Research found remaining legacy product wording in the MCP and AI experiences, shared navigation and pricing, onboarding and console guidance, public documentation, and preview imagery. It also found older references in historical, privacy, analytics, waitlist, and vendor-related material; these must be distinguished by ownership and role rather than renamed indiscriminately.
- HigherBits MCP and `/higherbits-mcp` are already established as the canonical product name and page address. Legacy MCP page redirects and API compatibility routes exist and must continue to work.
- Some images contain old branding in their pixels, so changing surrounding text or an image filename alone would not satisfy the visual outcome.
- Vendor-hosted `21st.dev` icon URLs, vendor audience identifiers, and sandbox or registry addresses are third-party-owned or integration identifiers, not first-party product branding; changing them could break existing content or integrations. By contrast, first-party analytics/storage keys, environment/configuration names, and waitlist identifiers may be updated where safe, with compatibility for prior values/names retained.
- The repository already has Playwright coverage for public routes and MCP redirects, visual evidence captures across selected routes and display settings, and Vitest coverage for legacy MCP API equivalence. These are the named gates for the relevant acceptance criteria; branding assertions and broad public-copy coverage must be included where those scenarios do not yet check them.
- A previous HigherBits visual redesign and brand sweep is complete. This SPEC covers the current product surfaces and remaining brand references identified by the current research.
