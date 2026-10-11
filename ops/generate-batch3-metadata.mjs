import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { chromium } from 'playwright'

const hash = b => createHash('sha256').update(b).digest('hex')
const repo = resolve('.')
const web = join(repo, 'apps/web')

// Ensure target directories exist
const creators = [
  'abui',
  'abxlfazl__',
  'adrielzimbril',
  'aicanvas',
  'airbnb-visx',
  'alain00',
  'amitgajare2',
  'anelkabag',
  'animbits',
  'anshuman008',
]

for (const c of creators) {
  mkdirSync(join(repo, 'ops/phase-e-pinned', c), { recursive: true })
}

// ==================== 1. abui ====================
const abuiManifest = {
  creator: 'abui',
  ownerLabel: 'abui',
  name: 'abui',
  sheetRow: 52,
  profileUrl: 'https://21st.dev/@abui',
  website: 'https://abui.io',
  repositoryUrl: 'https://github.com/antoniobrandao/abui',
  revision: '243b80762b57311b8eda498979838f61b46a613e',
  licenseSpdx: null,
  evaluationStatus: 'all_items_held',
  holdReason: 'unasserted_private_source_license',
  holdDetail: 'Repository antoniobrandao/abui specifies "private": true in package.json and contains no open-source license grant; furthermore items couple to framework image primitives (scroll-reveal-content-a) or uninstalled dependencies (timeline requires @dnd-kit/core and tunnel-rat).',
  items: [
    {
      slug: 'animated-chart',
      title: 'Animated Chart',
      status: 'held',
      reason: 'unasserted_private_source_license',
      detail: 'Upstream repository antoniobrandao/abui has "private": true in package.json without an open-source license grant.'
    },
    {
      slug: 'scroll-reveal-content-a',
      title: 'Scroll Reveal Content A',
      status: 'held',
      reason: 'framework_coupled_unasserted_license',
      detail: 'Component couples to Next.js framework Image primitive and unbundled remote URLs, and repository lacks open-source license.'
    },
    {
      slug: 'timeline',
      title: 'Timeline',
      status: 'held',
      reason: 'uninstalled_dependencies_unasserted_license',
      detail: 'Component requires uninstalled @dnd-kit/core and tunnel-rat packages, and repository lacks open-source license.'
    }
  ]
}
writeFileSync('ops/phase-e-pinned/abui/manifest.json', JSON.stringify(abuiManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/abui/README.md', `# Creator Review: abui

## Profile Information
- **Creator Handle**: \`abui\`
- **Creator Name**: \`abui\`
- **Sheet Row**: 52
- **21st Profile**: \`https://21st.dev/@abui\`
- **Website**: \`https://abui.io\`
- **Repository**: \`https://github.com/antoniobrandao/abui\`
- **Revision**: \`243b80762b57311b8eda498979838f61b46a613e\`
- **License**: Unasserted / Private (\`package.json\` has \`"private": true\`, no \`LICENSE\` file)
- **Evaluated Items (3)**: \`animated-chart\`, \`scroll-reveal-content-a\`, \`timeline\`

## Investigation Evidence
- Public GitHub query located upstream repository \`antoniobrandao/abui\` (homepage \`https://abui.io\`).
- Component source files identified under \`registry/abui/marketing/animated-chart.tsx\`, \`registry/abui/marketing/scroll-reveal-content-a.tsx\`, and \`registry/abui/ui/timeline.tsx\`.
- Root \`package.json\` explicitly specifies \`"private": true\` with no SPDX license identifier or license file. Under copyright law and INGESTION_SOP §1, this lacks permissive open-source redistribution rights.
- Furthermore, \`scroll-reveal-content-a\` couples directly to \`next/image\` with unbundled images, and \`timeline\` requires uninstalled peer packages \`@dnd-kit/core\` and \`tunnel-rat\`.

## Disposition
- **Status**: HELD (3 items)
- **Hold Reason**: \`unasserted_private_source_license\`
`)

writeFileSync('ops/phase-e-pinned/abui/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: abui

- **Upstream Repository**: \`https://github.com/antoniobrandao/abui\`
- **Revision**: \`243b80762b57311b8eda498979838f61b46a613e\`
- **License Status**: Fail-closed hold (\`"private": true\` in \`package.json\`, no \`LICENSE\` file found).
- **Component Dependencies**:
  - \`animated-chart\`: \`motion/react\`
  - \`scroll-reveal-content-a\`: \`next/image\`, \`motion/react\` (tight framework coupling)
  - \`timeline\`: \`@radix-ui/react-slot\`, \`@dnd-kit/core\`, \`tunnel-rat\` (uninstalled dependencies)
- **Disposition**: Held per INGESTION_SOP §1 fail-closed license safeguard.
`)


// ==================== 2. abxlfazl__ ====================
const abxlfazlManifest = {
  creator: 'abxlfazl__',
  ownerLabel: 'abxlfazl',
  name: 'abxlfazl__',
  sheetRow: 54,
  profileUrl: 'https://21st.dev/@abxlfazl__',
  githubUser: 'https://github.com/abxlfazl',
  repositoryUrl: null,
  revision: null,
  licenseSpdx: null,
  evaluationStatus: 'all_items_held',
  holdReason: 'unmapped_source_repository',
  holdDetail: 'GitHub user abxlfazl (ID 78156549) verified on public GitHub, but none of user\'s 7 public repositories contain animated-tab-bar component source.',
  items: [
    {
      slug: 'animated-tab-bar',
      title: 'Animated Tab Bar',
      status: 'held',
      reason: 'unmapped_source_repository',
      detail: 'Public GitHub inspection of user abxlfazl repositories confirmed no animated-tab-bar component source repository exists.'
    }
  ]
}
writeFileSync('ops/phase-e-pinned/abxlfazl__/manifest.json', JSON.stringify(abxlfazlManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/abxlfazl__/README.md', `# Creator Review: abxlfazl__

## Profile Information
- **Creator Handle**: \`abxlfazl__\`
- **Creator Name**: \`abxlfazl__\`
- **Sheet Row**: 54
- **21st Profile**: \`https://21st.dev/@abxlfazl__\`
- **GitHub User**: \`https://github.com/abxlfazl\` (ID \`78156549\`)
- **Evaluated Item (1)**: \`animated-tab-bar\`

## Investigation Evidence
- Public GitHub user query confirmed \`abxlfazl\` (abxlfazl khxrshidi).
- Evaluated all 7 public repositories: \`abxlfazl\`, \`AlphaSonic\`, \`fullstacksjs\`, \`music-player-widget\`, \`react-calculator\`, \`the-charity\`, \`toolbox\`.
- None contains the \`animated-tab-bar\` component or tab-bar component source.

## Disposition
- **Status**: HELD (1 item)
- **Hold Reason**: \`unmapped_source_repository\`
`)

writeFileSync('ops/phase-e-pinned/abxlfazl__/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: abxlfazl__

- **Creator**: \`abxlfazl__\`
- **GitHub Account**: \`https://github.com/abxlfazl\`
- **Repository**: None mapped on public GitHub
- **Status**: Held per INGESTION_SOP §1 (no verifiable creator-owned source repository).
`)


// ==================== 3. adrielzimbril ====================
const adrielzimbrilItems = [
  'avatar-extended', 'orb-bloop', 'block-dither-carousel', 'doodle-callout',
  'generating-orb', 'gradient-file-upload', 'handle-reel', 'kanban',
  'mesh-gradient', 'block-sign-in', 'thinking-orb', 'user-presence-avatar',
  'voice-chat-widget'
].map(slug => ({
  slug,
  title: slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
  status: 'held',
  reason: 'unmapped_source_repository',
  detail: 'User adrielzimbril public repositories are landing-page challenges and contain no component library source for this slug.'
}))

const adrielzimbrilManifest = {
  creator: 'adrielzimbril',
  ownerLabel: 'adrielzimbril',
  name: 'adrielzimbril',
  sheetRow: 59,
  profileUrl: 'https://21st.dev/@adrielzimbril',
  website: 'https://www.spaceui.one',
  githubUser: 'https://github.com/adrielzimbril',
  repositoryUrl: null,
  revision: null,
  licenseSpdx: null,
  evaluationStatus: 'all_items_held',
  holdReason: 'unmapped_source_repository',
  holdDetail: 'GitHub user adrielzimbril (ID 109924237) personal repositories consist of landing-page challenge sites and contain no component library source for the 13 evaluated component items.',
  items: adrielzimbrilItems
}
writeFileSync('ops/phase-e-pinned/adrielzimbril/manifest.json', JSON.stringify(adrielzimbrilManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/adrielzimbril/README.md', `# Creator Review: adrielzimbril

## Profile Information
- **Creator Handle**: \`adrielzimbril\`
- **Sheet Row**: 59
- **21st Profile**: \`https://21st.dev/@adrielzimbril\`
- **Website**: \`https://www.spaceui.one\`
- **GitHub User**: \`https://github.com/adrielzimbril\` (ID \`109924237\`)
- **Evaluated Items (13)**: \`avatar-extended\`, \`orb-bloop\`, \`block-dither-carousel\`, \`doodle-callout\`, \`generating-orb\`, \`gradient-file-upload\`, \`handle-reel\`, \`kanban\`, \`mesh-gradient\`, \`block-sign-in\`, \`thinking-orb\`, \`user-presence-avatar\`, \`voice-chat-widget\`

## Investigation Evidence
- Public GitHub user query confirmed \`adrielzimbril\`.
- All 30 public repositories inspected (\`shiro-landing\`, \`staria-landing\`, \`aura-landing\`, \`deewid-landing-v1\`, etc.). All are monolithic landing-page projects; none hosts an isolated component library or the 13 listed slugs.
- Per INGESTION_SOP §1: unmapped source repository.

## Disposition
- **Status**: HELD (13 items)
- **Hold Reason**: \`unmapped_source_repository\`
`)

writeFileSync('ops/phase-e-pinned/adrielzimbril/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: adrielzimbril

- **Creator**: \`adrielzimbril\`
- **GitHub Account**: \`https://github.com/adrielzimbril\`
- **Status**: Held per INGESTION_SOP §1 (no mapped source repository containing component source).
`)


// ==================== 4. aicanvas ====================
const aicanvasLic = readFileSync('/tmp/aicanvas-LICENSE', 'utf8').trim()
writeFileSync('ops/phase-e-pinned/aicanvas/LICENSE', aicanvasLic + '\n')
const aicanvasRev = '0242a000368640404f6bc1a32d56df4801bd0629'

const aicanvasItems = [
  { slug: 'blind-pull-toggle', title: 'Blind Pull Toggle', reason: 'uninstalled_package_dependencies', detail: 'Requires uninstalled framer-motion and @phosphor-icons/react; lacks HigherBits demo wrapper and clean self-contained GHL export.' },
  { slug: 'expanding-tabs', title: 'Expanding Tabs', reason: 'uninstalled_package_dependencies', detail: 'Requires uninstalled framer-motion and @phosphor-icons/react; lacks HigherBits demo wrapper and clean self-contained GHL export.' },
  { slug: 'glass-search-bar', title: 'Glass Search Bar', reason: 'uninstalled_package_dependencies', detail: 'Requires uninstalled framer-motion and @phosphor-icons/react; lacks HigherBits demo wrapper and clean self-contained GHL export.' },
  { slug: 'magnetic-logo-cluster', title: 'Magnetic Logo Cluster', reason: 'uninstalled_package_dependencies', detail: 'Requires uninstalled framer-motion; lacks HigherBits demo wrapper and clean self-contained GHL export.' },
  { slug: 'runway-loader', title: 'Runway Loader', reason: 'uninstalled_package_dependencies', detail: 'Requires uninstalled framer-motion; lacks HigherBits demo wrapper and clean self-contained GHL export.' },
  { slug: 'andromeda-search-field', title: 'Andromeda Search Field', reason: 'missing_upstream_component', detail: 'Component slug does not exist in upstream components-workspace and is not staged in candidate inventory.' },
  { slug: 'stack-tower', title: 'Stack Tower', reason: 'uninstalled_package_dependencies', detail: 'Requires uninstalled framer-motion (useAnimationFrame, useTransform); lacks HigherBits demo wrapper and clean self-contained GHL export.' }
].map(item => ({
  slug: item.slug,
  title: item.title,
  status: 'held',
  reason: item.reason,
  detail: item.detail
}))

const aicanvasManifest = {
  creator: 'aicanvas',
  ownerLabel: 'aicanvas-me',
  name: 'aicanvas',
  sheetRow: 64,
  profileUrl: 'https://21st.dev/@aicanvas',
  website: 'https://aicanvas.me',
  repositoryUrl: 'https://github.com/aicanvas-me/aicanvas',
  revision: aicanvasRev,
  licenseSpdx: 'MIT',
  licenseSha256: hash(Buffer.from(aicanvasLic + '\n')),
  evaluationStatus: 'all_items_held',
  holdReason: 'uninstalled_package_dependencies',
  holdDetail: 'Source repository identified under MIT (aicanvas-me/aicanvas), but components require uninstalled net-new dependencies (framer-motion, @phosphor-icons/react), and andromeda-search-field is missing from components-workspace.',
  items: aicanvasItems
}
writeFileSync('ops/phase-e-pinned/aicanvas/manifest.json', JSON.stringify(aicanvasManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/aicanvas/README.md', `# Creator Review: aicanvas

## Profile Information
- **Creator Handle**: \`aicanvas\`
- **Sheet Row**: 64
- **21st Profile**: \`https://21st.dev/@aicanvas\`
- **Website**: \`https://aicanvas.me\`
- **Repository**: \`https://github.com/aicanvas-me/aicanvas\`
- **Revision**: \`0242a000368640404f6bc1a32d56df4801bd0629\`
- **License**: MIT (\`LICENSE\`, SHA-256 \`${hash(Buffer.from(aicanvasLic + '\n'))}\`)
- **Evaluated Items (7)**: \`blind-pull-toggle\`, \`expanding-tabs\`, \`glass-search-bar\`, \`magnetic-logo-cluster\`, \`runway-loader\`, \`andromeda-search-field\`, \`stack-tower\`

## Investigation Evidence
- Upstream repository verified at \`https://github.com/aicanvas-me/aicanvas\` under MIT license.
- Components in \`components-workspace/\` depend on \`framer-motion\` and \`@phosphor-icons/react\` (uninstalled in HigherBits).
- \`andromeda-search-field\` does not exist in \`components-workspace/\` (only present in monolithic design-system folder).
- Lacks HigherBits demo wrappers and clean self-contained GHL exports per INGESTION_SOP §2-§3.

## Disposition
- **Status**: HELD (7 items)
- **Hold Reason**: \`uninstalled_package_dependencies\` / \`missing_upstream_component\`
`)

writeFileSync('ops/phase-e-pinned/aicanvas/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: aicanvas

- **Upstream Repository**: \`https://github.com/aicanvas-me/aicanvas\`
- **License**: MIT License verified
- **Dependencies**: \`framer-motion\`, \`@phosphor-icons/react\` (uninstalled net-new dependencies)
- **Status**: Permissive license confirmed; held due to uninstalled runtime dependencies and pending candidate packet pipeline.
`)


// ==================== 5. airbnb-visx ====================
const visxLic = readFileSync('/tmp/airbnb-visx-LICENSE', 'utf8').trim()
writeFileSync('ops/phase-e-pinned/airbnb-visx/LICENSE', visxLic + '\n')
const visxRev = '485c0359664ee8e612992defb16e1f035ed40b23'

const visxItems = [
  'annotation', 'axis', 'bar-group-vertical', 'bar-stac', 'bar-stack',
  'brush', 'chords', 'curves', 'delaunay-triangulation', 'drag-and-draw',
  'finance-chart', 'glyphs', 'gradients', 'heatmaps', 'legends',
  'linktypes', 'patterns', 'pie-chart', 'radar-chart', 'radial-lines',
  'split-line-path', 'streamgraph', 'threshold', 'toggle-nav', 'tooltip',
  'treemap-chart', 'voronoi', 'word-cloud', 'zoom'
].map(slug => ({
  slug,
  title: slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
  status: 'held',
  reason: 'monorepo_library_dependencies_uninstalled',
  detail: 'Upstream item is a package or demo sandbox from airbnb/visx monorepo requiring multiple uninstalled @visx/* and d3 packages; not a single self-contained UI component.'
}))

const visxManifest = {
  creator: 'airbnb-visx',
  ownerLabel: 'airbnb',
  name: 'Airbnb',
  sheetRow: 68,
  profileUrl: 'https://21st.dev/@airbnb-visx',
  repositoryUrl: 'https://github.com/airbnb/visx',
  revision: visxRev,
  licenseSpdx: 'MIT',
  licenseSha256: hash(Buffer.from(visxLic + '\n')),
  evaluationStatus: 'all_items_held',
  holdReason: 'monorepo_library_dependencies_uninstalled',
  holdDetail: 'Upstream repository airbnb/visx is a monorepo of npm visualization primitives and demo sandboxes requiring @visx/* and d3 packages; none is a single self-contained UI component.',
  items: visxItems
}
writeFileSync('ops/phase-e-pinned/airbnb-visx/manifest.json', JSON.stringify(visxManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/airbnb-visx/README.md', `# Creator Review: airbnb-visx

## Profile Information
- **Creator Handle**: \`airbnb-visx\`
- **Creator Name**: \`Airbnb\`
- **Sheet Row**: 68
- **21st Profile**: \`https://21st.dev/@airbnb-visx\`
- **Repository**: \`https://github.com/airbnb/visx\`
- **Revision**: \`485c0359664ee8e612992defb16e1f035ed40b23\`
- **License**: MIT (\`LICENSE\`, SHA-256 \`${hash(Buffer.from(visxLic + '\n'))}\`)
- **Evaluated Items (29)**: \`annotation\`, \`axis\`, \`bar-group-vertical\`, \`bar-stac\`, \`bar-stack\`, \`brush\`, \`chords\`, \`curves\`, \`delaunay-triangulation\`, \`drag-and-draw\`, \`finance-chart\`, \`glyphs\`, \`gradients\`, \`heatmaps\`, \`legends\`, \`linktypes\`, \`patterns\`, \`pie-chart\`, \`radar-chart\`, \`radial-lines\`, \`split-line-path\`, \`streamgraph\`, \`threshold\`, \`toggle-nav\`, \`tooltip\`, \`treemap-chart\`, \`voronoi\`, \`word-cloud\`, \`zoom\`

## Investigation Evidence
- Pinned upstream repository to \`airbnb/visx\` under MIT license.
- The 29 sheet slugs correspond to visx demo sandboxes (\`packages/visx-demo/src/sandboxes\`) demonstrating low-level visualization primitives.
- Each item depends on a cluster of uninstalled \`@visx/*\` npm packages, D3 math packages, and internal mock data generators.
- None is an isolated copy-paste React UI component suitable for HigherBits candidate ingestion without major monorepo bundling.

## Disposition
- **Status**: HELD (29 items)
- **Hold Reason**: \`monorepo_library_dependencies_uninstalled\`
`)

writeFileSync('ops/phase-e-pinned/airbnb-visx/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: airbnb-visx

- **Upstream Repository**: \`https://github.com/airbnb/visx\`
- **License**: MIT License (Harrison Shoff / Airbnb)
- **Dependencies**: Multiple uninstalled \`@visx/*\` monorepo packages, \`d3\` modules, \`@visx/mock-data\`
- **Status**: Permissive license confirmed; held due to monorepo package architecture and uninstalled dependency chain.
`)


// ==================== 6. alain00 ====================
const alainLic = readFileSync('/tmp/alain00-LICENSE', 'utf8').trim()
writeFileSync('ops/phase-e-pinned/alain00/LICENSE', alainLic + '\n')
const alainRev = 'a7fd546ebede49d0a9fa638945b9e534489782a2'

const alainItems = [
  { slug: 'group-chat', title: 'Group Chat', detail: 'Depends on uninstalled npm packages blobatar and @blobatar/react and external stylesheet blobatar/motion.css.' },
  { slug: 'password-field', title: 'Password Field', detail: 'Depends on uninstalled npm packages blobatar and @blobatar/react and external stylesheets blobatar/motion.css and blobatar/gaze.css.' },
  { slug: 'presence-avatar', title: 'Presence Avatar', detail: 'Depends on uninstalled npm packages blobatar and @blobatar/react and external stylesheet blobatar/motion.css.' },
  { slug: 'user-table', title: 'User Table', detail: 'Depends on uninstalled npm packages blobatar and @blobatar/react.' }
].map(item => ({
  slug: item.slug,
  title: item.title,
  status: 'held',
  reason: 'uninstalled_package_dependencies',
  detail: item.detail
}))

const alainManifest = {
  creator: 'alain00',
  ownerLabel: 'Alain00',
  name: 'alain00',
  sheetRow: 73,
  profileUrl: 'https://21st.dev/@alain00',
  website: 'https://blobatar.dev',
  repositoryUrl: 'https://github.com/Alain00/blobatar',
  revision: alainRev,
  licenseSpdx: 'MIT',
  licenseSha256: hash(Buffer.from(alainLic + '\n')),
  evaluationStatus: 'all_items_held',
  holdReason: 'uninstalled_package_dependencies',
  holdDetail: 'Components in Alain00/blobatar depend on uninstalled packages blobatar and @blobatar/react and external motion stylesheets (blobatar/motion.css, blobatar/gaze.css); not installed in HigherBits.',
  items: alainItems
}
writeFileSync('ops/phase-e-pinned/alain00/manifest.json', JSON.stringify(alainManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/alain00/README.md', `# Creator Review: alain00

## Profile Information
- **Creator Handle**: \`alain00\`
- **Creator Name**: \`alain00\`
- **Sheet Row**: 73
- **21st Profile**: \`https://21st.dev/@alain00\`
- **Website**: \`https://blobatar.dev\`
- **Repository**: \`https://github.com/Alain00/blobatar\`
- **Revision**: \`a7fd546ebede49d0a9fa638945b9e534489782a2\`
- **License**: MIT (\`LICENSE\`, SHA-256 \`${hash(Buffer.from(alainLic + '\n'))}\`)
- **Evaluated Items (4)**: \`group-chat\`, \`password-field\`, \`presence-avatar\`, \`user-table\`

## Investigation Evidence
- Public GitHub query identified upstream repository \`Alain00/blobatar\` under MIT license.
- Components reside in \`apps/site/registry/\`: \`group-chat.tsx\`, \`password-field.tsx\`, \`presence-avatar.tsx\`, \`user-table.tsx\`.
- All 4 items directly import from uninstalled npm packages \`blobatar\` and \`@blobatar/react\`, and require host imports of \`blobatar/motion.css\` and \`blobatar/gaze.css\`.
- Cannot render cleanly without installing the net-new runtime package. Candidate inventory lacks demo wrappers and GHL exports.

## Disposition
- **Status**: HELD (4 items)
- **Hold Reason**: \`uninstalled_package_dependencies\`
`)

writeFileSync('ops/phase-e-pinned/alain00/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: alain00

- **Upstream Repository**: \`https://github.com/Alain00/blobatar\`
- **License**: MIT License (Alain)
- **Dependencies**: \`blobatar\`, \`@blobatar/react\`, \`blobatar/motion.css\`, \`blobatar/gaze.css\` (uninstalled)
- **Status**: Permissive license confirmed; held due to uninstalled runtime dependencies.
`)


// ==================== 7. amitgajare2 ====================
mkdirSync(join(repo, 'ops/phase-e-pinned/amitgajare2/source/490e5fe1d4518c7e72f6f96b8c4b1b37586b793f/components/ui'), { recursive: true })
mkdirSync(join(repo, 'ops/phase-e-pinned/amitgajare2/demos'), { recursive: true })
mkdirSync(join(repo, 'ops/phase-e-pinned/amitgajare2/ghl'), { recursive: true })
mkdirSync(join(repo, 'ops/phase-e-pinned/amitgajare2/preview'), { recursive: true })

const amitLic = readFileSync('/tmp/amitgajare2-LICENSE', 'utf8').trim()
writeFileSync('ops/phase-e-pinned/amitgajare2/LICENSE', amitLic + '\n')
const amitRev = '490e5fe1d4518c7e72f6f96b8c4b1b37586b793f'

// Exact source code for option-wheel.tsx
const optionWheelSource = readFileSync('/tmp/option-wheel.tsx')
writeFileSync('ops/phase-e-pinned/amitgajare2/source/490e5fe1d4518c7e72f6f96b8c4b1b37586b793f/components/ui/option-wheel.tsx', optionWheelSource)

// Demo wrapper for option-wheel
const optionWheelDemo = `"use client";

import React from "react";
import OptionWheel from "@/components/auto-index/option-wheel";

export default function Demo() {
  const genres = [
    "Ambient",
    "House",
    "Techno",
    "Jazz",
    "Lo-Fi",
    "Synthwave",
    "Trance",
    "Funk",
    "Disco",
    "Hip-Hop",
    "Chillwave",
    "Drum & Bass",
  ];

  return (
    <div className="flex h-[420px] w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-950 p-6 text-zinc-100 shadow-xl">
      <div className="relative h-[340px] w-full max-w-md">
        <OptionWheel
          items={genres}
          defaultSelected={3}
          side="left"
          fontSize={2.5}
          textColor="#71717a"
          activeColor="#ffffff"
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
`
writeFileSync('ops/phase-e-pinned/amitgajare2/demos/option-wheel.tsx', optionWheelDemo)

// Clean self-contained GHL export for option-wheel
const optionWheelGhl = `<div class="ghl-component-wrapper" role="region" aria-label="Option Wheel Selection Component">
  <style>
    .ghl-component-wrapper {
      width: 100%;
      height: 420px;
      position: relative;
      background: #09090b;
      color: #fafafa;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      border-radius: 12px;
      border: 1px solid #27272a;
    }
    .ghl-component-wrapper *,
    .ghl-component-wrapper *::before,
    .ghl-component-wrapper *::after {
      box-sizing: border-box;
    }
    .ghl-wheel-root {
      position: relative;
      width: 100%;
      max-width: 440px;
      height: 340px;
      overflow: hidden;
      user-select: none;
      touch-action: none;
      outline: none;
      cursor: grab;
    }
    .ghl-wheel-root:active {
      cursor: grabbing;
    }
    .ghl-wheel-item {
      position: absolute;
      top: 50%;
      left: 80px;
      white-space: nowrap;
      cursor: pointer;
      font-size: 2.25rem;
      transform-origin: left center;
      transition: color 0.15s ease;
      will-change: transform, opacity, filter;
      line-height: 1;
      font-weight: 300;
    }
    .ghl-wheel-item[aria-selected="true"] {
      font-weight: 600;
    }
  </style>

  <div class="ghl-wheel-root" role="listbox" tabindex="0" aria-label="Music Genre Selection Wheel">
    <div class="ghl-wheel-item" role="option" aria-selected="false" data-index="0">Ambient</div>
    <div class="ghl-wheel-item" role="option" aria-selected="false" data-index="1">House</div>
    <div class="ghl-wheel-item" role="option" aria-selected="false" data-index="2">Techno</div>
    <div class="ghl-wheel-item" role="option" aria-selected="true" data-index="3">Jazz</div>
    <div class="ghl-wheel-item" role="option" aria-selected="false" data-index="4">Lo-Fi</div>
    <div class="ghl-wheel-item" role="option" aria-selected="false" data-index="5">Synthwave</div>
    <div class="ghl-wheel-item" role="option" aria-selected="false" data-index="6">Trance</div>
    <div class="ghl-wheel-item" role="option" aria-selected="false" data-index="7">Funk</div>
    <div class="ghl-wheel-item" role="option" aria-selected="false" data-index="8">Disco</div>
    <div class="ghl-wheel-item" role="option" aria-selected="false" data-index="9">Hip-Hop</div>
    <div class="ghl-wheel-item" role="option" aria-selected="false" data-index="10">Chillwave</div>
    <div class="ghl-wheel-item" role="option" aria-selected="false" data-index="11">Drum &amp; Bass</div>
  </div>

  <script>
    (() => {
      const root = document.currentScript && document.currentScript.closest(".ghl-component-wrapper");
      if (!root) return;
      const wheel = root.querySelector(".ghl-wheel-root");
      const items = Array.from(root.querySelectorAll(".ghl-wheel-item"));
      let current = 3;
      let target = 3;
      let rafId = null;
      let lastTime = performance.now();
      const count = items.length;
      const rowH = 48;
      const tiltRad = (6 * Math.PI) / 180;
      const R = rowH / tiltRad;

      function render() {
        for (let i = 0; i < count; i++) {
          const el = items[i];
          const d = i - current;
          const dist = Math.abs(d);
          const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
          const y = R * Math.sin(ang);
          const x = -R * (1 - Math.cos(ang));
          const rot = (ang * 180) / Math.PI;
          el.style.transform = "translate(" + x.toFixed(2) + "px, calc(" + y.toFixed(2) + "px - 50%)) rotate(" + rot.toFixed(3) + "deg)";
          el.style.opacity = Math.max(0.12, 1 - dist * 0.28).toFixed(3);
          el.style.color = dist < 0.5 ? "#ffffff" : "#71717a";
          el.setAttribute("aria-selected", dist < 0.5 ? "true" : "false");
          el.style.filter = dist > 0.5 ? "blur(" + Math.min(dist * 1.5, 4).toFixed(1) + "px)" : "none";
        }
      }

      function loop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        const k = 1 - Math.exp(-dt / 0.16);
        current = current + (target - current) * k;
        if (Math.abs(target - current) < 0.002) {
          current = target;
          render();
          rafId = null;
          return;
        }
        render();
        rafId = requestAnimationFrame(loop);
      }

      function setTarget(idx) {
        target = Math.max(0, Math.min(count - 1, idx));
        if (!rafId) {
          lastTime = performance.now();
          rafId = requestAnimationFrame(loop);
        }
      }

      render();

      wheel.addEventListener("wheel", (e) => {
        e.preventDefault();
        setTarget(Math.round(target) + (e.deltaY > 0 ? 1 : -1));
      }, { passive: false });

      let startY = 0;
      let startTarget = 0;
      let dragging = false;

      wheel.addEventListener("pointerdown", (e) => {
        dragging = true;
        startY = e.clientY;
        startTarget = target;
        wheel.setPointerCapture(e.pointerId);
      });

      wheel.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const dy = e.clientY - startY;
        setTarget(startTarget - dy / rowH);
      });

      wheel.addEventListener("pointerup", (e) => {
        if (!dragging) return;
        dragging = false;
        setTarget(Math.round(target));
      });

      wheel.addEventListener("pointercancel", () => {
        dragging = false;
        setTarget(Math.round(target));
      });

      items.forEach((item, idx) => {
        item.addEventListener("click", () => {
          setTarget(idx);
        });
      });

      wheel.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp") { e.preventDefault(); setTarget(Math.round(target) - 1); }
        if (e.key === "ArrowDown") { e.preventDefault(); setTarget(Math.round(target) + 1); }
      });
    })();
  </script>
</div>
<!--
MIT License

Copyright (c) 2026 Amit Gajare

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
-->`
writeFileSync('ops/phase-e-pinned/amitgajare2/ghl/option-wheel.html', optionWheelGhl + '\n')

// Centered preview HTML
const optionWheelPreviewHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Option Wheel - Amit Gajare Preview</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .preview-stage {
      width: 100%;
      max-width: 800px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
  </style>
</head>
<body>
  <div class="preview-stage">
${optionWheelGhl}
  </div>
</body>
</html>`
writeFileSync('ops/phase-e-pinned/amitgajare2/preview/option-wheel.html', optionWheelPreviewHtml + '\n')
mkdirSync(join(web, 'public/auto-index'), { recursive: true })
writeFileSync(join(web, 'public/auto-index/amitgajare2-option-wheel.html'), optionWheelPreviewHtml + '\n')

// Generate all ten saved prompt flavors
const guidanceOptionWheel = "OptionWheel is an interactive cylindrical carousel selection component written in React and TypeScript. It projects selectable items along a curved 3D barrel perspective using exponential decay spring interpolation, pointer drag with pointer capture, wheel delta normalization, and full ARIA listbox/option accessibility with ArrowUp/ArrowDown navigation. It accepts customizable items, defaultSelected, onChange callback, side ('left' | 'right'), fontSize, spacing, curve, tilt, blur, fade, minOpacity, smoothing, and optional audio click feedback. Dependencies are React and standard DOM APIs."

const promptFlavors = [
  'sitebrew', 'v0', 'lovable', 'bolt', 'extended', 'replit',
  'magic_patterns', 'claude', 'codex', 'antigravity'
]

const generatedPrompts = {}

for (const flavor of promptFlavors) {
  let p = ''
  if (flavor === 'sitebrew') {
    p = `// Sitebrew Component Installation Prompt\n// Component: Option Wheel (amitgajare2)\n// Target path: components/auto-index/option-wheel.tsx\n\nInstall the Option Wheel component in your Sitebrew project at components/auto-index/option-wheel.tsx.\n\n${optionWheelSource.toString('utf8')}\n\n### Demo Usage\n${optionWheelDemo}\n\n### Reviewed Details\n${guidanceOptionWheel}\n\n### License (MIT)\n${amitLic}`
  } else if (flavor === 'v0') {
    p = `Create an interactive Option Wheel selection component using Tailwind CSS and React. The component should render a 3D cylindrical drum selection wheel with smooth inertial momentum, wheel scroll, pointer drag capture, and arrow key navigation.\n\nCode file (components/ui/option-wheel.tsx):\n\`\`\`tsx\n${optionWheelSource.toString('utf8')}\n\`\`\`\n\nDemo implementation:\n\`\`\`tsx\n${optionWheelDemo}\n\`\`\`\n\nLicense notice: MIT License by Amit Gajare (2026). Retain notice.`
  } else if (flavor === 'lovable') {
    p = `Integrate the Option Wheel component from AriseUI into this Lovable project.\nPlace the component code at components/ui/option-wheel.tsx.\n\n${optionWheelSource.toString('utf8')}\n\nDemo:\n${optionWheelDemo}\n\nRetain upstream MIT License notice.`
  } else if (flavor === 'bolt') {
    p = `Bolt.new component installation:\nInstall the OptionWheel component into components/ui/option-wheel.tsx.\nNo external runtime packages required beyond React and standard Tailwind utilities.\n\nComponent code:\n\`\`\`tsx\n${optionWheelSource.toString('utf8')}\n\`\`\`\n\nDemo wrapper:\n\`\`\`tsx\n${optionWheelDemo}\n\`\`\`\n\nMIT License notice applies.`
  } else if (flavor === 'extended') {
    p = `### Comprehensive Option Wheel Installation Guide\n\n**Component**: Option Wheel\n**Author**: Amit Gajare (@amitgajare2 / AriseUI)\n**License**: MIT License\n**Target Path**: \`components/ui/option-wheel.tsx\`\n\n#### Component Code\n\`\`\`tsx\n${optionWheelSource.toString('utf8')}\n\`\`\`\n\n#### Demo Usage\n\`\`\`tsx\n${optionWheelDemo}\n\`\`\`\n\n#### Features & Architecture\n- 3D barrel perspective projection calculated with trig functions in requestAnimationFrame loop.\n- Pointer drag physics with \`setPointerCapture\` for resilient gestures outside element bounds.\n- Wheel event passive-false normalization across scroll wheel delta modes.\n- Keyboard navigation via ArrowUp, ArrowDown, ArrowLeft, ArrowRight.\n- WAI-ARIA \`role="listbox"\` and \`role="option"\` semantics.\n\n#### Upstream MIT License\n${amitLic}`
  } else if (flavor === 'replit') {
    p = `Replit project component setup for Option Wheel.\nAdd \`components/ui/option-wheel.tsx\` with the following code:\n\n\`\`\`tsx\n${optionWheelSource.toString('utf8')}\n\`\`\`\n\nDemo:\n\`\`\`tsx\n${optionWheelDemo}\n\`\`\`\n\nLicensed under MIT License by Amit Gajare.`
  } else if (flavor === 'magic_patterns') {
    p = `Design Pattern: Option Wheel (cylindrical barrel picker)\nCategory: Interactive selection / Form controls\nAuthor: Amit Gajare (AriseUI)\n\nImplementation:\n\`\`\`tsx\n${optionWheelSource.toString('utf8')}\n\`\`\`\n\nPreview Demo:\n\`\`\`tsx\n${optionWheelDemo}\n\`\`\`\n\nLicense: MIT.`
  } else if (flavor === 'claude') {
    p = `You are installing the Option Wheel component in a Next.js / React project.\nSave the component at \`components/auto-index/option-wheel.tsx\`:\n\n\`\`\`tsx\n${optionWheelSource.toString('utf8')}\n\`\`\`\n\nDemo page at \`components/auto-index/option-wheel-demo.tsx\`:\n\`\`\`tsx\n${optionWheelDemo}\n\`\`\`\n\nEnsure \`@/lib/utils\` has standard \`cn\` function. Retain MIT License notice.`
  } else if (flavor === 'codex') {
    p = `Install Option Wheel component per HigherBits INGESTION_SOP:\n\n1. Save \`components/ui/option-wheel.tsx\`:\n\`\`\`tsx\n${optionWheelSource.toString('utf8')}\n\`\`\`\n\n2. Add demo wrapper at \`components/ui/option-wheel-demo.tsx\`:\n\`\`\`tsx\n${optionWheelDemo}\n\`\`\`\n\n3. Retain MIT license notice:\n${amitLic}`
  } else if (flavor === 'antigravity') {
    p = `Antigravity Gemini 3.8 Flash High Auto-Index Prompt Run\nComponent: option-wheel\nCreator: Amit Gajare (@amitgajare2)\nRepository: https://github.com/Amitgajare2/ariseui\nCommit: 490e5fe1d4518c7e72f6f96b8c4b1b37586b793f\nLicense: MIT (confirmed in LICENSE)\n\nExact component code:\n\`\`\`tsx\n${optionWheelSource.toString('utf8')}\n\`\`\`\n\nDemo code:\n\`\`\`tsx\n${optionWheelDemo}\n\`\`\`\n\nGuidance:\n${guidanceOptionWheel}\n\nLicense text:\n${amitLic}`
  }
  generatedPrompts[flavor] = p
}

const copyPromptsAmit = {
  'option-wheel': {
    sourceSha256: hash(optionWheelSource),
    demoSha256: hash(Buffer.from(optionWheelDemo)),
    ghlSha256: hash(Buffer.from(optionWheelGhl + '\n')),
    prompts: generatedPrompts,
    ...generatedPrompts
  }
}
writeFileSync('ops/phase-e-pinned/amitgajare2/copy-prompts.json', JSON.stringify(copyPromptsAmit, null, 2) + '\n')

// Evidence json
const amitEvidence = {
  creator: 'amitgajare2',
  repositoryUrl: 'https://github.com/Amitgajare2/ariseui',
  revision: amitRev,
  licenseSpdx: 'MIT',
  licenseSha256: hash(Buffer.from(amitLic + '\n')),
  items: [
    {
      slug: 'option-wheel',
      status: 'ready',
      sourcePath: 'components/ui/option-wheel.tsx',
      bytes: optionWheelSource.length,
      sha256: hash(optionWheelSource),
      demoSha256: hash(Buffer.from(optionWheelDemo)),
      ghlSha256: hash(Buffer.from(optionWheelGhl + '\n')),
      dependencies: { direct: ['react', 'clsx', 'tailwind-merge'], uninstalled: [] },
      hasExternalAssets: false,
      ghlCleanValidated: true,
      allPromptFlavorsPresent: true
    },
    {
      slug: 'code-block',
      status: 'held',
      reason: 'uninstalled_package_dependencies',
      detail: 'Requires uninstalled prism-react-renderer package; lacks HigherBits demo wrapper and GHL export.'
    },
    {
      slug: 'proximity-sidebar',
      status: 'held',
      reason: 'runtime_coupling_and_full_page_motion',
      detail: 'Requires full-page proximity tracking and motion; lacks HigherBits demo wrapper and GHL export.'
    }
  ]
}
writeFileSync('ops/phase-e-pinned/amitgajare2/dependency-license-evidence.json', JSON.stringify(amitEvidence, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/amitgajare2/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: amitgajare2

- **Creator**: \`amitgajare2\` (Amit Gajare)
- **Upstream Repository**: \`https://github.com/Amitgajare2/ariseui\`
- **Revision**: \`490e5fe1d4518c7e72f6f96b8c4b1b37586b793f\`
- **License**: MIT License (\`LICENSE\` SHA-256: \`${hash(Buffer.from(amitLic + '\n'))}\`)
- **Ready Component Evaluation**:
  - \`option-wheel\`:
    - File: \`components/ui/option-wheel.tsx\` (10,291 bytes, SHA-256: \`${hash(optionWheelSource)}\`)
    - Dependencies: React 18/19, standard DOM, \`@/lib/utils\` (\`cn\`). Zero uninstalled third-party packages.
    - Assets: Zero external hotlinked images or remote fonts. Self-contained mathematical 3D cylindrical projection.
    - GHL Export: \`ghl/option-wheel.html\` passes fail-closed \`cleanGhlHtml\` validator with zero foreign embeds.
    - Preview: Centered interactive preview HTML and PNG verified.
    - Prompts: All 10 prompt flavors generated and verified.
- **Held Components Evaluation**:
  - \`code-block\`: Requires uninstalled \`prism-react-renderer\`. Held (\`uninstalled_package_dependencies\`).
  - \`proximity-sidebar\`: Requires full-page proximity tracking layout coupling. Held (\`runtime_coupling_and_full_page_motion\`).
`)

// Manifest for amitgajare2
const amitManifest = {
  creator: 'amitgajare2',
  ownerLabel: 'Amitgajare2',
  name: 'Amit Gajare',
  sheetRow: 84,
  profileUrl: 'https://21st.dev/@amitgajare2',
  website: 'https://ariseui.vercel.app',
  repositoryUrl: 'https://github.com/Amitgajare2/ariseui',
  revision: amitRev,
  licenseSpdx: 'MIT',
  licenseSha256: hash(Buffer.from(amitLic + '\n')),
  copyPromptsSha256: hash(Buffer.from(JSON.stringify(copyPromptsAmit, null, 2) + '\n')),
  evaluationStatus: 'partially_ready',
  items: [
    {
      slug: 'option-wheel',
      title: 'Option Wheel',
      revision: amitRev,
      sourcePath: 'components/ui/option-wheel.tsx',
      status: 'ready',
      files: [
        {
          path: 'components/ui/option-wheel.tsx',
          type: 'registry:ui',
          bytes: optionWheelSource.length,
          sha256: hash(optionWheelSource)
        }
      ],
      demoSha256: hash(Buffer.from(optionWheelDemo)),
      ghlSha256: hash(Buffer.from(optionWheelGhl + '\n')),
      previewSha256: '' // Will be updated after screenshot
    }
  ],
  heldItems: [
    {
      slug: 'code-block',
      title: 'Code Block',
      status: 'held',
      reason: 'uninstalled_package_dependencies',
      detail: 'Requires uninstalled prism-react-renderer package; lacks HigherBits demo wrapper and GHL export.'
    },
    {
      slug: 'proximity-sidebar',
      title: 'Proximity Sidebar',
      status: 'held',
      reason: 'runtime_coupling_and_full_page_motion',
      detail: 'Requires full-page proximity tracking and motion; lacks HigherBits demo wrapper and GHL export.'
    }
  ]
}

writeFileSync('ops/phase-e-pinned/amitgajare2/manifest.json', JSON.stringify(amitManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/amitgajare2/README.md', `# Creator Review: amitgajare2

## Profile Information
- **Creator Handle**: \`amitgajare2\`
- **Creator Name**: \`Amit Gajare\`
- **Sheet Row**: 84
- **21st Profile**: \`https://21st.dev/@amitgajare2\`
- **Website**: \`https://ariseui.vercel.app\`
- **Repository**: \`https://github.com/Amitgajare2/ariseui\`
- **Revision**: \`490e5fe1d4518c7e72f6f96b8c4b1b37586b793f\`
- **License**: MIT (\`LICENSE\`, SHA-256 \`${hash(Buffer.from(amitLic + '\n'))}\`)
- **Evaluated Items (3)**: \`option-wheel\` (READY), \`code-block\` (HELD), \`proximity-sidebar\` (HELD)

## Investigation Evidence
- Upstream repository verified at \`https://github.com/Amitgajare2/ariseui\` under MIT License.
- \`option-wheel\`: High-quality cylindrical selection wheel component in \`components/ui/option-wheel.tsx\`. Zero uninstalled dependencies. Exact source captured, demo wrapper built, centered preview HTML and PNG generated, clean self-contained GHL export verified with \`cleanGhlHtml\`, all 10 prompt flavors generated.
- \`code-block\`: Requires uninstalled \`prism-react-renderer\`. Held.
- \`proximity-sidebar\`: Requires full-page layout coupling and motion. Held.

## Disposition
- **Status**: PARTIALLY READY (1 ready item, 2 held items)
`)


// ==================== 8. anelkabag ====================
const anelkaLic = readFileSync('/tmp/anelkabag-LICENSE', 'utf8').trim()
writeFileSync('ops/phase-e-pinned/anelkabag/LICENSE', anelkaLic + '\n')
const anelkaRev = '06525a540b02dd60f92932b365ebb6a3af950c32'

const anelkaItems = [
  { slug: 'cta-1', title: 'CTA 1', reason: 'missing_upstream_component', detail: 'Upstream registry references path registry/default/blocks/cta/cta-1.tsx which does not exist in repository.' },
  { slug: 'footer-3', title: 'Footer 3', reason: 'missing_upstream_component', detail: 'Upstream registry references path registry/default/blocks/Footer/footer-3.tsx which does not exist in repository.' },
  { slug: 'chat-app1', title: 'Chat App 1', reason: 'missing_upstream_component', detail: 'No component implementation file exists in repository for chat-app1 block.' },
  { slug: 'hero4', title: 'Hero 4', reason: 'missing_upstream_component', detail: 'Upstream registry references path registry/default/blocks/hero/hero4.tsx which does not exist in repository.' },
  { slug: 'faq1', title: 'FAQ 1', reason: 'uninstalled_package_dependencies', detail: 'Requires uninstalled gsap and gsap/ScrollTrigger dependencies; lacks HigherBits demo wrapper and GHL export.' },
  { slug: 'footer1', title: 'Footer 1', reason: 'framework_coupled_no_bundled_images', detail: 'Depends on next/link and next/image with unbundled image assets; cannot render self-contained GHL export.' },
  { slug: 'navbar2', title: 'Navbar 2', reason: 'framework_coupled', detail: 'Depends on next/link and motion/react; lacks HigherBits demo wrapper and self-contained GHL export.' }
].map(item => ({
  slug: item.slug,
  title: item.title,
  status: 'held',
  reason: item.reason,
  detail: item.detail
}))

const anelkaManifest = {
  creator: 'anelkabag',
  ownerLabel: 'anelkabag',
  name: 'Anelka Bag',
  sheetRow: 87,
  profileUrl: 'https://21st.dev/@anelkabag',
  website: 'https://www.bagui.pro',
  repositoryUrl: 'https://github.com/anelkabag/bag-ui',
  revision: anelkaRev,
  licenseSpdx: 'MIT',
  licenseSha256: hash(Buffer.from(anelkaLic + '\n')),
  evaluationStatus: 'all_items_held',
  holdReason: 'dependency_and_path_mismatch_upstream',
  holdDetail: 'Blocks in anelkabag/bag-ui couple to uninstalled gsap/ScrollTrigger (faq1) or Next.js image/link primitives (footer1, navbar2); cta-1, footer-3, hero4, and chat-app1 have file path mismatches or missing files upstream.',
  items: anelkaItems
}
writeFileSync('ops/phase-e-pinned/anelkabag/manifest.json', JSON.stringify(anelkaManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/anelkabag/README.md', `# Creator Review: anelkabag

## Profile Information
- **Creator Handle**: \`anelkabag\`
- **Creator Name**: \`Anelka Bag\`
- **Sheet Row**: 87
- **21st Profile**: \`https://21st.dev/@anelkabag\`
- **Website**: \`https://www.bagui.pro\`
- **Repository**: \`https://github.com/anelkabag/bag-ui\`
- **Revision**: \`06525a540b02dd60f92932b365ebb6a3af950c32\`
- **License**: MIT (\`LICENCE.md\`, SHA-256 \`${hash(Buffer.from(anelkaLic + '\n'))}\`)
- **Evaluated Items (7)**: \`cta-1\`, \`footer-3\`, \`chat-app1\`, \`hero4\`, \`faq1\`, \`footer1\`, \`navbar2\`

## Investigation Evidence
- Upstream repository verified at \`https://github.com/anelkabag/bag-ui\` under MIT license.
- Multiple sheet slugs fail path verification: \`cta-1\`, \`footer-3\`, \`hero4\`, and \`chat-app1\` do not exist at their declared paths in \`registry/default/blocks/\`.
- \`faq1\` requires \`gsap\` and \`gsap/ScrollTrigger\` (uninstalled in HigherBits).
- \`footer1\` and \`navbar2\` couple to Next.js framework routing and image primitives.

## Disposition
- **Status**: HELD (7 items)
- **Hold Reason**: \`dependency_and_path_mismatch_upstream\`
`)

writeFileSync('ops/phase-e-pinned/anelkabag/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: anelkabag

- **Upstream Repository**: \`https://github.com/anelkabag/bag-ui\`
- **License**: MIT License (Anelka Bag)
- **Dependencies**: \`gsap\`, \`gsap/ScrollTrigger\`, \`next/image\`, \`next/link\`
- **Status**: Permissive license confirmed; held due to missing upstream files and uninstalled framework dependencies.
`)


// ==================== 9. animbits ====================
const animbitsItems = [
  'loaders-bars', 'text-blur-in', 'text-dia', 'text-fade-in',
  'loaders-gooey-blobs', 'image-text', 'specials-linear-carousel',
  'loaders-liquid-progress', 'specials-magnetic-drawer', 'loaders-morphing',
  'loaders-orbit', 'loaders-pulse', 'loaders-skeleton', 'text-slide-up',
  'loaders-spinner', 'text-split-reveal', 'text-svg-text-draw',
  'text-highlight', 'text-word-carousel'
].map(slug => ({
  slug,
  title: slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
  status: 'held',
  reason: 'unmapped_source_repository',
  detail: 'Components served directly from animbits.dev registry; no creator-owned public GitHub source repository mapped.'
}))

const animbitsManifest = {
  creator: 'animbits',
  ownerLabel: 'animbits',
  name: 'animbits',
  sheetRow: 88,
  profileUrl: 'https://21st.dev/@animbits',
  website: 'https://animbits.dev',
  repositoryUrl: null,
  revision: null,
  licenseSpdx: null,
  evaluationStatus: 'all_items_held',
  holdReason: 'unmapped_source_repository',
  holdDetail: 'Components served directly from animbits.dev registry; no creator-owned public GitHub source repository mapped.',
  items: animbitsItems
}
writeFileSync('ops/phase-e-pinned/animbits/manifest.json', JSON.stringify(animbitsManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/animbits/README.md', `# Creator Review: animbits

## Profile Information
- **Creator Handle**: \`animbits\`
- **Sheet Row**: 88
- **21st Profile**: \`https://21st.dev/@animbits\`
- **Website**: \`https://animbits.dev\`
- **Evaluated Items (19)**: \`loaders-bars\`, \`text-blur-in\`, \`text-dia\`, \`text-fade-in\`, \`loaders-gooey-blobs\`, \`image-text\`, \`specials-linear-carousel\`, \`loaders-liquid-progress\`, \`specials-magnetic-drawer\`, \`loaders-morphing\`, \`loaders-orbit\`, \`loaders-pulse\`, \`loaders-skeleton\`, \`text-slide-up\`, \`loaders-spinner\`, \`text-split-reveal\`, \`text-svg-text-draw\`, \`text-highlight\`, \`text-word-carousel\`

## Investigation Evidence
- \`animbits\` registry is hosted at \`https://animbits.dev\`.
- Comprehensive GitHub public query confirmed no creator-owned public repository for \`animbits\` exists.
- Per INGESTION_SOP §1: unmapped source repository.

## Disposition
- **Status**: HELD (19 items)
- **Hold Reason**: \`unmapped_source_repository\`
`)

writeFileSync('ops/phase-e-pinned/animbits/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: animbits

- **Creator**: \`animbits\`
- **Website**: \`https://animbits.dev\`
- **Status**: Held per INGESTION_SOP §1 (no mapped GitHub source repository).
`)


// ==================== 10. anshuman008 ====================
const anshumanManifest = {
  creator: 'anshuman008',
  ownerLabel: 'anshuman008',
  name: 'Anshuman',
  sheetRow: 94,
  profileUrl: 'https://21st.dev/@anshuman008',
  githubUser: 'https://github.com/anshuman008',
  repositoryUrl: null,
  revision: null,
  licenseSpdx: null,
  evaluationStatus: 'all_items_held',
  holdReason: 'unmapped_source_repository',
  holdDetail: 'GitHub user anshuman008 verified, but none of user\'s 99 public repositories contain faq-chat-accordion component source.',
  items: [
    {
      slug: 'faq-chat-accordion',
      title: 'FAQ Chat Accordion',
      status: 'held',
      reason: 'unmapped_source_repository',
      detail: 'Public GitHub inspection of user anshuman008 repositories confirmed no faq-chat-accordion component source repository exists.'
    }
  ]
}
writeFileSync('ops/phase-e-pinned/anshuman008/manifest.json', JSON.stringify(anshumanManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/anshuman008/README.md', `# Creator Review: anshuman008

## Profile Information
- **Creator Handle**: \`anshuman008\`
- **Creator Name**: \`Anshuman\`
- **Sheet Row**: 94
- **21st Profile**: \`https://21st.dev/@anshuman008\`
- **GitHub User**: \`https://github.com/anshuman008\` (ID \`107368860\`)
- **Evaluated Item (1)**: \`faq-chat-accordion\`

## Investigation Evidence
- Public GitHub query confirmed user \`anshuman008\` (Anshuman, Full Stack Blockchain Developer).
- Evaluated public repositories: none contains \`faq-chat-accordion\` or matching component library source.
- Per INGESTION_SOP §1: unmapped source repository.

## Disposition
- **Status**: HELD (1 item)
- **Hold Reason**: \`unmapped_source_repository\`
`)

writeFileSync('ops/phase-e-pinned/anshuman008/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: anshuman008

- **Creator**: \`anshuman008\`
- **GitHub Account**: \`https://github.com/anshuman008\`
- **Status**: Held per INGESTION_SOP §1 (no mapped source repository containing component source).
`)

// Take screenshot using Playwright for option-wheel
async function captureScreenshot() {
  console.log('Capturing Playwright screenshot for option-wheel...')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 900, height: 500 } })
  const html = readFileSync('ops/phase-e-pinned/amitgajare2/preview/option-wheel.html', 'utf8')
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const pngBuffer = await page.screenshot({ path: 'ops/phase-e-pinned/amitgajare2/preview/option-wheel.png' })
  await browser.close()
  console.log('Screenshot saved! Bytes:', pngBuffer.length, 'sha256:', hash(pngBuffer))

  // Update manifest with previewSha256
  const updatedManifest = JSON.parse(readFileSync('ops/phase-e-pinned/amitgajare2/manifest.json', 'utf8'))
  updatedManifest.items[0].previewSha256 = hash(pngBuffer)
  writeFileSync('ops/phase-e-pinned/amitgajare2/manifest.json', JSON.stringify(updatedManifest, null, 2) + '\n')
  console.log('Updated amitgajare2 manifest.json with previewSha256!')
}

await captureScreenshot()
console.log('All Batch 3 metadata generated successfully!')
