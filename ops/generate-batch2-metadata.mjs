import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const hash = b => createHash('sha256').update(b).digest('hex')

// ==================== 2. ElevenLabs ====================
const elevenLicBytes = readFileSync('ops/phase-e-pinned/elevenlabs/LICENSE')
const elevenRev = '23c31bd3088814215a8b5d0bfb56b327cad1a578'
const elevenItems = [
  { slug: 'audio-player', title: 'Audio Player', file: 'audio-player.tsx', detail: 'Component depends on custom media controls; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'bar-visualizer', title: 'Bar Visualizer', file: 'bar-visualizer.tsx', detail: 'Component requires MediaStream audio analyzer runtime; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'live-waveform', title: 'Live Waveform', file: 'live-waveform.tsx', detail: 'Component requires real-time audio input stream; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'orb', title: 'Orb', file: 'orb.tsx', detail: 'Component requires heavy WebGL runtime (@react-three/drei, @react-three/fiber, three); candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'response', title: 'Response', file: 'response.tsx', detail: 'Candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'shimmering-text', title: 'Shimmering Text', file: 'shimmering-text.tsx', detail: 'Component depends on motion/react; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'voice-picker', title: 'Voice Picker', file: 'voice-picker.tsx', detail: 'Candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'waveform', title: 'Waveform', file: 'waveform.tsx', detail: 'Candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
].map(item => {
  const relPath = `apps/www/registry/elevenlabs-ui/ui/${item.file}`
  const bytes = readFileSync(`ops/phase-e-pinned/elevenlabs/source/${elevenRev}/${relPath}`)
  return {
    slug: item.slug,
    title: item.title,
    revision: elevenRev,
    sourcePath: relPath,
    bytes: bytes.length,
    sha256: hash(bytes),
    status: 'held',
    reason: 'uncaptured_source_item',
    detail: item.detail,
    files: [{ path: relPath, type: 'registry:ui', bytes: bytes.length, sha256: hash(bytes) }]
  }
})

const elevenManifest = {
  creator: 'ElevenLabs-crawled',
  ownerLabel: 'elevenlabs',
  name: 'ElevenLabs',
  sheetRow: 26,
  profileUrl: 'https://21st.dev/@ElevenLabs-crawled',
  repositoryUrl: 'https://github.com/elevenlabs/ui',
  revision: elevenRev,
  licenseSpdx: 'MIT',
  licenseSha256: hash(elevenLicBytes),
  evaluationStatus: 'all_items_held',
  holdReason: 'uncaptured_source_item',
  holdDetail: 'Upstream repository identified under MIT, but component items lack HigherBits demo wrappers, self-contained GHL exports, and deployed HTTPS preview assets per INGESTION_SOP §2-§3.',
  items: elevenItems
}
writeFileSync('ops/phase-e-pinned/elevenlabs/manifest.json', JSON.stringify(elevenManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/elevenlabs/README.md', `# Creator Review: ElevenLabs-crawled

## Profile Information
- **Creator Handle**: \`ElevenLabs-crawled\`
- **Creator Name**: \`ElevenLabs\`
- **Sheet Row**: 26
- **21st Profile**: \`https://21st.dev/@ElevenLabs-crawled\`
- **Repository**: \`https://github.com/elevenlabs/ui\`
- **Revision**: \`23c31bd3088814215a8b5d0bfb56b327cad1a578\`
- **License**: MIT (\`LICENSE.md\`, SHA-256 \`${hash(elevenLicBytes)}\`)
- **Evaluated Items (8)**: \`audio-player\`, \`bar-visualizer\`, \`live-waveform\`, \`orb\`, \`response\`, \`shimmering-text\`, \`voice-picker\`, \`waveform\`

## Investigation & Disposition
- Exact source files captured under \`ops/phase-e-pinned/elevenlabs/source/23c31bd3088814215a8b5d0bfb56b327cad1a578/\`.
- Ten prompt variants (\`sitebrew\`, \`v0\`, \`lovable\`, \`bolt\`, \`extended\`, \`replit\`, \`magic_patterns\`, \`claude\`, \`codex\`, \`antigravity\`) generated and saved in \`copy-prompts.json\`.
- All 8 items are HELD (\`uncaptured_source_item\`) pending completion of HigherBits demo wrappers, self-contained GHL exports, and deployed HTTPS preview assets per INGESTION_SOP §2-§3.
`)

writeFileSync('ops/phase-e-pinned/elevenlabs/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: ElevenLabs-crawled

- Upstream Repository: \`https://github.com/elevenlabs/ui\`
- Revision: \`23c31bd3088814215a8b5d0bfb56b327cad1a578\`
- License: MIT License (confirmed in \`LICENSE.md\`, SHA-256 \`${hash(elevenLicBytes)}\`)
- Dependencies:
  - \`audio-player\`: React, lucide-react, custom audio controls
  - \`bar-visualizer\`: HTML5 AudioContext, MediaStream API
  - \`live-waveform\`: HTML5 AudioContext, MediaStream API
  - \`orb\`: \`@react-three/fiber\`, \`@react-three/drei\`, \`three\` (heavy 3D WebGL runtime)
  - \`response\`: React, Tailwind CSS
  - \`shimmering-text\`: \`motion/react\`
  - \`voice-picker\`: React, lucide-react
  - \`waveform\`: React, canvas/audio scrubbing
- Status: Permissive license passes; hold applied due to runtime prerequisites and pending demo/preview pipeline assets.
`)

// ==================== 3. JurreHoutkamp ====================
const jurreManifest = {
  creator: 'JurreHoutkamp',
  ownerLabel: 'JurreHoutkamp',
  name: 'JurreHoutkamp',
  sheetRow: 27,
  profileUrl: 'https://21st.dev/@JurreHoutkamp',
  githubUser: 'https://github.com/jurrehoutkamp',
  website: 'https://www.jurrehoutkamp.com/',
  repositoryUrl: null,
  revision: null,
  licenseSpdx: null,
  evaluationStatus: 'all_items_held',
  holdReason: 'unmapped_source_repository',
  holdDetail: 'GitHub user jurrehoutkamp (ID 22095598) verified on GitHub, but personal repositories contain no component libraries or source code for hover-zoom, text-glow-hover, or tilt-card.',
  items: [
    { slug: 'hover-zoom', title: 'Hover Zoom', status: 'held', reason: 'unmapped_source_repository', detail: 'No public upstream repository containing hover-zoom component source mapped.' },
    { slug: 'text-glow-hover', title: 'Text Glow Hover', status: 'held', reason: 'unmapped_source_repository', detail: 'No public upstream repository containing text-glow-hover component source mapped.' },
    { slug: 'tilt-card', title: 'Tilt Card', status: 'held', reason: 'unmapped_source_repository', detail: 'No public upstream repository containing tilt-card component source mapped.' },
  ]
}
writeFileSync('ops/phase-e-pinned/jurrehoutkamp/manifest.json', JSON.stringify(jurreManifest, null, 2) + '\n')
writeFileSync('ops/phase-e-pinned/jurrehoutkamp/README.md', `# Creator Review: JurreHoutkamp

## Profile Information
- **Creator Handle**: \`JurreHoutkamp\`
- **Creator Name**: \`JurreHoutkamp\`
- **Sheet Row**: 27
- **21st Profile**: \`https://21st.dev/@JurreHoutkamp\`
- **Website**: \`https://www.jurrehoutkamp.com/\`
- **Evaluated Items (3)**: \`hover-zoom\`, \`text-glow-hover\`, \`tilt-card\`

## Investigation Evidence
- Public GitHub user query confirmed user \`jurrehoutkamp\` (ID \`22095598\`, designer @framer).
- User repositories list contains 5 repositories (\`assets\`, \`framer-seo-writer\`, \`framer-x-dashboard\`, \`sa\`, \`script-commands\`).
- Code search across GitHub confirmed 0 source repositories containing component code for \`hover-zoom\`, \`text-glow-hover\`, or \`tilt-card\`.
- Per INGESTION_SOP §1: exact repository mapping is absent.

## Disposition
- **Status**: HELD (3 items)
- **Held Reason**: \`unmapped_source_repository\`
`)

// ==================== 4. KarrixLee ====================
const karrixLicBytes = readFileSync('ops/phase-e-pinned/karrixlee/LICENSE')
const karrixRev = 'e70ab612716f5bb73795f713a4b3c50157234164'
const karrixItems = [
  { slug: 'info-card', title: 'Info Card', file: 'info-card/info-card.tsx', demoFile: 'info-card/info-card-demo.tsx', detail: 'Component requires framer-motion; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'unsave-popup', title: 'Unsave Popup', file: 'unsave-popup/unsave-popup.tsx', demoFile: 'unsave-popup/unsave-popup-demo.tsx', detail: 'Component requires motion/react; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
].map(item => {
  const relPath = `registry/kl-ui/${item.file}`
  const bytes = readFileSync(`ops/phase-e-pinned/karrixlee/source/${karrixRev}/${relPath}`)
  return {
    slug: item.slug,
    title: item.title,
    revision: karrixRev,
    sourcePath: relPath,
    bytes: bytes.length,
    sha256: hash(bytes),
    status: 'held',
    reason: 'uncaptured_source_item',
    detail: item.detail,
    files: [{ path: relPath, type: 'registry:ui', bytes: bytes.length, sha256: hash(bytes) }]
  }
})

const karrixManifest = {
  creator: 'KarrixLee',
  ownerLabel: 'KarrixLee',
  name: 'KarrixLee',
  sheetRow: 28,
  profileUrl: 'https://21st.dev/@KarrixLee',
  repositoryUrl: 'https://github.com/KarrixLee/KL-ui',
  revision: karrixRev,
  licenseSpdx: 'MIT',
  licenseSha256: hash(karrixLicBytes),
  evaluationStatus: 'all_items_held',
  holdReason: 'uncaptured_source_item',
  holdDetail: 'Upstream repository identified under MIT, but component items lack HigherBits demo wrappers, self-contained GHL exports, and deployed HTTPS preview assets per INGESTION_SOP §2-§3.',
  items: karrixItems
}
writeFileSync('ops/phase-e-pinned/karrixlee/manifest.json', JSON.stringify(karrixManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/karrixlee/README.md', `# Creator Review: KarrixLee

## Profile Information
- **Creator Handle**: \`KarrixLee\`
- **Sheet Row**: 28
- **21st Profile**: \`https://21st.dev/@KarrixLee\`
- **Repository**: \`https://github.com/KarrixLee/KL-ui\`
- **Revision**: \`e70ab612716f5bb73795f713a4b3c50157234164\`
- **License**: MIT (\`LICENSE\`, SHA-256 \`${hash(karrixLicBytes)}\`)
- **Evaluated Items (2)**: \`info-card\`, \`unsave-popup\`

## Investigation & Disposition
- Exact source files and upstream demos captured under \`ops/phase-e-pinned/karrixlee/source/e70ab612716f5bb73795f713a4b3c50157234164/\`.
- Ten prompt variants generated and saved in \`copy-prompts.json\`.
- Both items are HELD (\`uncaptured_source_item\`) pending completion of HigherBits demo wrappers, self-contained GHL exports, and deployed HTTPS preview assets per INGESTION_SOP §2-§3.
`)

writeFileSync('ops/phase-e-pinned/karrixlee/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: KarrixLee

- Upstream Repository: \`https://github.com/KarrixLee/KL-ui\`
- Revision: \`e70ab612716f5bb73795f713a4b3c50157234164\`
- License: MIT License (confirmed in \`LICENSE\`, SHA-256 \`${hash(karrixLicBytes)}\`)
- Dependencies:
  - \`info-card\`: React, \`framer-motion\`, Tailwind CSS
  - \`unsave-popup\`: React, \`motion/react\`, \`lucide-react\`, shadcn/ui Button
- Status: Permissive license passes; hold applied due to uninstalled framer-motion dependency and pending demo/preview pipeline assets.
`)

// ==================== 5. LegionWebDev ====================
const legionLicBytes = readFileSync('ops/phase-e-pinned/legionwebdev/LICENSE')
const legionRev = 'ecbd6a5db7b25f9a7e070c02b2ef728c378eeb5c'
const legionSheetItems = [
  'allocation-echarts-sankey-chart', 'area-chart', 'bar-chart', 'cache-tiers-echarts-radial-chart',
  'background', 'cpu-architecture', 'database-with-rest-api', 'echarts-sankey-chart',
  'grid-bar-chart', 'hover-trace-bar-chart', 'legion-web-dev', 'line-chart',
  'monospace-bar-chart', 'pie-chart', 'pipeline-echarts-sankey-chart', 'radar-chart'
]
const legionCapturedBlocks = {
  'allocation-echarts-sankey-chart': 'src/registry/blocks/echarts/b-allocation-echarts-sankey-chart.tsx',
  'pipeline-echarts-sankey-chart': 'src/registry/blocks/echarts/b-pipeline-echarts-sankey-chart.tsx',
  'cache-tiers-echarts-radial-chart': 'src/registry/blocks/echarts/b-cache-tiers-echarts-radial-chart.tsx',
  'grid-bar-chart': 'src/registry/blocks/recharts/b-grid-bar-chart.tsx',
  'hover-trace-bar-chart': 'src/registry/blocks/recharts/b-hover-trace-bar-chart.tsx',
  'monospace-bar-chart': 'src/registry/blocks/recharts/b-monospace-bar-chart.tsx',
}

const legionItems = legionSheetItems.map(slug => {
  const capturedPath = legionCapturedBlocks[slug]
  if (capturedPath) {
    const bytes = readFileSync(`ops/phase-e-pinned/legionwebdev/source/${legionRev}/${capturedPath}`)
    return {
      slug,
      title: slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
      revision: legionRev,
      sourcePath: capturedPath,
      bytes: bytes.length,
      sha256: hash(bytes),
      status: 'held',
      reason: 'uncaptured_source_item',
      detail: 'Component block captured under MIT, but requires echarts/recharts/motion runtimes and lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.',
      files: [{ path: capturedPath, type: 'registry:block', bytes: bytes.length, sha256: hash(bytes) }]
    }
  } else {
    return {
      slug,
      title: slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
      revision: null,
      sourcePath: null,
      bytes: 0,
      sha256: null,
      status: 'held',
      reason: 'unmapped_source_repository',
      detail: 'Slug corresponds to generic showcase or doc layout; no discrete 1:1 reusable block found in upstream repository.',
      files: []
    }
  }
})

const legionManifest = {
  creator: 'LegionWebDev',
  ownerLabel: 'legions-developer',
  name: 'Legion Dev',
  sheetRow: 30,
  profileUrl: 'https://21st.dev/@LegionWebDev',
  website: 'https://evilcharts.com',
  repositoryUrl: 'https://github.com/legions-developer/evilcharts',
  revision: legionRev,
  licenseSpdx: 'MIT',
  licenseSha256: hash(legionLicBytes),
  evaluationStatus: 'all_items_held',
  holdReason: 'uncaptured_source_item',
  holdDetail: 'Upstream repository identified under MIT (EvilCharts), 6 block components captured, but items require chart runtime dependencies and lack HigherBits demo wrappers, self-contained GHL exports, and deployed HTTPS preview assets.',
  items: legionItems
}
writeFileSync('ops/phase-e-pinned/legionwebdev/manifest.json', JSON.stringify(legionManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/legionwebdev/README.md', `# Creator Review: LegionWebDev

## Profile Information
- **Creator Handle**: \`LegionWebDev\`
- **Creator Name**: \`Legion Dev\`
- **Sheet Row**: 30
- **21st Profile**: \`https://21st.dev/@LegionWebDev\`
- **Website**: \`https://evilcharts.com\`
- **Repository**: \`https://github.com/legions-developer/evilcharts\`
- **Revision**: \`ecbd6a5db7b25f9a7e070c02b2ef728c378eeb5c\`
- **License**: MIT (\`LICENSE\`, SHA-256 \`${hash(legionLicBytes)}\`)
- **Evaluated Items (16)**: \`allocation-echarts-sankey-chart\`, \`area-chart\`, \`bar-chart\`, \`cache-tiers-echarts-radial-chart\`, \`background\`, \`cpu-architecture\`, \`database-with-rest-api\`, \`echarts-sankey-chart\`, \`grid-bar-chart\`, \`hover-trace-bar-chart\`, \`legion-web-dev\`, \`line-chart\`, \`monospace-bar-chart\`, \`pie-chart\`, \`pipeline-echarts-sankey-chart\`, \`radar-chart\`

## Investigation & Disposition
- Exact upstream repository \`legions-developer/evilcharts\` mapped and verified under MIT.
- 6 discrete reusable blocks mapped and captured under \`ops/phase-e-pinned/legionwebdev/source/\`.
- 10 generic category or showcase slugs held as unmapped discrete blocks.
- Ten prompt variants generated for captured blocks in \`copy-prompts.json\`.
- All 16 items are HELD (\`uncaptured_source_item\` / \`unmapped_source_repository\`) pending chart runtime dependency review and complete candidate packet staging.
`)

writeFileSync('ops/phase-e-pinned/legionwebdev/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: LegionWebDev

- Upstream Repository: \`https://github.com/legions-developer/evilcharts\`
- Revision: \`ecbd6a5db7b25f9a7e070c02b2ef728c378eeb5c\`
- License: MIT License (confirmed in \`LICENSE\`, SHA-256 \`${hash(legionLicBytes)}\`)
- Dependencies:
  - ECharts blocks (\`allocation-echarts-sankey-chart\`, \`pipeline-echarts-sankey-chart\`, \`cache-tiers-echarts-radial-chart\`): \`echarts\`, \`motion\`
  - Recharts blocks (\`grid-bar-chart\`, \`hover-trace-bar-chart\`, \`monospace-bar-chart\`): \`recharts\`
- Status: Permissive license passes; hold applied due to chart runtime dependencies and pending demo/preview pipeline assets.
`)

// ==================== 6. OrcDev ====================
const orcLicBytes = readFileSync('ops/phase-e-pinned/orcdev/LICENSE')
const orcRev = 'da3c0722b110d7bb99a7b7d7e2ee53251f2151e1'
const orcBytes = readFileSync(`ops/phase-e-pinned/orcdev/source/${orcRev}/components/ui/8bit/menubar.tsx`)
const orcCssBytes = readFileSync(`ops/phase-e-pinned/orcdev/source/${orcRev}/components/ui/8bit/styles/retro.css`)

const orcManifest = {
  creator: 'OrcDev',
  ownerLabel: 'TheOrcDev',
  name: 'OrcDev',
  sheetRow: 34,
  profileUrl: 'https://21st.dev/@OrcDev',
  repositoryUrl: 'https://github.com/TheOrcDev/8bitcn-ui',
  revision: orcRev,
  licenseSpdx: 'MIT',
  licenseSha256: hash(orcLicBytes),
  evaluationStatus: 'all_items_held',
  holdReason: 'uncaptured_source_item',
  holdDetail: 'Upstream repository identified under MIT (TheOrcDev/8bitcn-ui), source captured, but component requires custom retro.css stylesheet and radix menubar primitives, and lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.',
  items: [
    {
      slug: '8bit-menubar',
      title: '8bit Menubar',
      revision: orcRev,
      sourcePath: 'components/ui/8bit/menubar.tsx',
      bytes: orcBytes.length,
      sha256: hash(orcBytes),
      status: 'held',
      reason: 'uncaptured_source_item',
      detail: 'Component source captured under MIT, but requires custom retro.css and radix menubar primitives; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.',
      files: [
        { path: 'components/ui/8bit/menubar.tsx', type: 'registry:ui', bytes: orcBytes.length, sha256: hash(orcBytes) },
        { path: 'components/ui/8bit/styles/retro.css', type: 'registry:file', bytes: orcCssBytes.length, sha256: hash(orcCssBytes) }
      ]
    }
  ]
}
writeFileSync('ops/phase-e-pinned/orcdev/manifest.json', JSON.stringify(orcManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/orcdev/README.md', `# Creator Review: OrcDev

## Profile Information
- **Creator Handle**: \`OrcDev\`
- **Creator Name**: \`OrcDev\`
- **Sheet Row**: 34
- **21st Profile**: \`https://21st.dev/@OrcDev\`
- **Repository**: \`https://github.com/TheOrcDev/8bitcn-ui\`
- **Revision**: \`da3c0722b110d7bb99a7b7d7e2ee53251f2151e1\`
- **License**: MIT (\`license.md\`, SHA-256 \`${hash(orcLicBytes)}\`)
- **Evaluated Item (1)**: \`8bit-menubar\`

## Investigation & Disposition
- Exact upstream repository \`TheOrcDev/8bitcn-ui\` identified under MIT.
- Exact source files (\`components/ui/8bit/menubar.tsx\` and \`retro.css\`) captured under \`ops/phase-e-pinned/orcdev/source/\`.
- Ten prompt variants generated in \`copy-prompts.json\`.
- Item is HELD (\`uncaptured_source_item\`) pending completion of HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets per INGESTION_SOP §2-§3.
`)

writeFileSync('ops/phase-e-pinned/orcdev/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: OrcDev

- Upstream Repository: \`https://github.com/TheOrcDev/8bitcn-ui\`
- Revision: \`da3c0722b110d7bb99a7b7d7e2ee53251f2151e1\`
- License: MIT License (confirmed in \`license.md\`, SHA-256 \`${hash(orcLicBytes)}\`)
- Dependencies:
  - \`8bit-menubar\`: React, \`@radix-ui/react-menubar\`, \`class-variance-authority\`, \`lucide-react\`, local retro.css
- Status: Permissive license passes; hold applied due to radix-menubar peer dependency and pending demo/preview pipeline assets.
`)

// ==================== 7. RayMethula ====================
const rayManifest = {
  creator: 'RayMethula',
  ownerLabel: 'RayMethula',
  name: 'Ray Methula',
  sheetRow: 35,
  profileUrl: 'https://21st.dev/@RayMethula',
  githubUser: 'https://github.com/xrmethula',
  website: 'https://rapidui.dev/#blocks',
  repositoryUrl: null,
  revision: null,
  licenseSpdx: null,
  evaluationStatus: 'all_items_held',
  holdReason: 'unmapped_source_repository',
  holdDetail: 'GitHub user xrmethula ("Ray Methula", ID 91151418) verified on GitHub, but repositories contain no component library or source code for brands, footer, testimonial, or testimonial-carousel.',
  items: [
    { slug: 'brands', title: 'Brands', status: 'held', reason: 'unmapped_source_repository', detail: 'No public upstream repository containing brands component source mapped.' },
    { slug: 'footer', title: 'Footer', status: 'held', reason: 'unmapped_source_repository', detail: 'No public upstream repository containing footer component source mapped.' },
    { slug: 'testimonial', title: 'Testimonial', status: 'held', reason: 'unmapped_source_repository', detail: 'No public upstream repository containing testimonial component source mapped.' },
    { slug: 'testimonial-carousel', title: 'Testimonial Carousel', status: 'held', reason: 'unmapped_source_repository', detail: 'No public upstream repository containing testimonial-carousel component source mapped.' },
  ]
}
writeFileSync('ops/phase-e-pinned/raymethula/manifest.json', JSON.stringify(rayManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/raymethula/README.md', `# Creator Review: RayMethula

## Profile Information
- **Creator Handle**: \`RayMethula\`
- **Creator Name**: \`Ray Methula\`
- **Sheet Row**: 35
- **21st Profile**: \`https://21st.dev/@RayMethula\`
- **Website**: \`https://rapidui.dev/#blocks\`
- **Evaluated Items (4)**: \`brands\`, \`footer\`, \`testimonial\`, \`testimonial-carousel\`

## Investigation Evidence
- Public GitHub user query confirmed user \`xrmethula\` (ID \`91151418\`, name \`Ray Methula\`).
- Repositories inspected (\`airbnb-sanity-frontend\`, \`docs\`, \`express_crash_course\`, \`i_am_rich\`, \`sanityxtrainfo\`, \`screen_snap\`, \`taxonomy\`). None contain component libraries for rapidui blocks.
- Per INGESTION_SOP §1: exact repository mapping is absent.

## Disposition
- **Status**: HELD (4 items)
- **Held Reason**: \`unmapped_source_repository\`
`)

// ==================== 8. Shatlyk1011 ====================
const shatlykLicBytes = readFileSync('ops/phase-e-pinned/shatlyk1011/LICENSE')
const shatlykRev = 'ca2a6f309f59d517f70235fc3d4a04368486956d'
const shatlykItemDefs = [
  { slug: '3d-marquee', title: '3D Marquee', file: '3d-marquee.tsx', detail: 'Component requires CSS 3D transforms; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'animated-dropdown', title: 'Animated Dropdown', file: 'animated-dropdown.tsx', detail: 'Component requires lucide-react; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'button-colorful', title: 'Button Colorful', file: 'buttons/button-colorful.tsx', detail: 'Candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'fancy-text-hover', title: 'Fancy Text Hover', file: 'gsap-components/fancy-text-hover.tsx', detail: 'Component requires GSAP animation runtime; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'gradient-borders-button', title: 'Gradient Borders Button', file: 'buttons/gradient-borders-button.tsx', detail: 'Candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'hover-border-gradient', title: 'Hover Border Gradient', file: 'buttons/hover-border-gradient.tsx', detail: 'Component requires framer-motion; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'interactive-hover-button', title: 'Interactive Hover Button', file: 'buttons/interactive-hover-button.tsx', detail: 'Component requires lucide-react; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'link-hover', title: 'Link Hover', file: 'gsap-components/link-hover.tsx', detail: 'Component requires GSAP animation runtime; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'motion-button', title: 'Motion Button', file: 'buttons/motion-button.tsx', detail: 'Component requires framer-motion; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'shimmer-button', title: 'Shimmer Button', file: 'buttons/shimmer-button.tsx', detail: 'Candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'shiny-button', title: 'Shiny Button', file: 'buttons/shiny-button.tsx', detail: 'Candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'social-button', title: 'Social Button', file: 'buttons/social-button.tsx', detail: 'Component requires lucide-react; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'team-member-card', title: 'Team Member Card', file: 'cards/team-member-card.tsx', detail: 'Component requires lucide-react; candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
  { slug: 'typing-effect', title: 'Typing Effect', file: 'texts/text-typing-effect.tsx', detail: 'Candidate inventory lacks HigherBits demo wrapper, self-contained GHL export, and deployed HTTPS preview assets.' },
]

const shatlykItems = shatlykItemDefs.map(item => {
  const relPath = `src/components/emerald-ui-components/${item.file}`
  const bytes = readFileSync(`ops/phase-e-pinned/shatlyk1011/source/${shatlykRev}/${relPath}`)
  return {
    slug: item.slug,
    title: item.title,
    revision: shatlykRev,
    sourcePath: relPath,
    bytes: bytes.length,
    sha256: hash(bytes),
    status: 'held',
    reason: 'uncaptured_source_item',
    detail: item.detail,
    files: [{ path: relPath, type: 'registry:ui', bytes: bytes.length, sha256: hash(bytes) }]
  }
})

const shatlykManifest = {
  creator: 'Shatlyk1011',
  ownerLabel: 'Shatlyk1011',
  name: 'Shatlyk1011',
  sheetRow: 36,
  profileUrl: 'https://21st.dev/@Shatlyk1011',
  repositoryUrl: 'https://github.com/Shatlyk1011/emerald-ui',
  revision: shatlykRev,
  licenseSpdx: 'MIT',
  licenseSha256: hash(shatlykLicBytes),
  evaluationStatus: 'all_items_held',
  holdReason: 'uncaptured_source_item',
  holdDetail: 'Upstream repository identified under MIT (Emerald UI), all 14 source files captured, but components require GSAP/framer-motion and lack HigherBits demo wrappers, self-contained GHL exports, and deployed HTTPS preview assets per INGESTION_SOP §2-§3.',
  items: shatlykItems
}
writeFileSync('ops/phase-e-pinned/shatlyk1011/manifest.json', JSON.stringify(shatlykManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/shatlyk1011/README.md', `# Creator Review: Shatlyk1011

## Profile Information
- **Creator Handle**: \`Shatlyk1011\`
- **Creator Name**: \`Shatlyk1011\`
- **Sheet Row**: 36
- **21st Profile**: \`https://21st.dev/@Shatlyk1011\`
- **Repository**: \`https://github.com/Shatlyk1011/emerald-ui\`
- **Revision**: \`ca2a6f309f59d517f70235fc3d4a04368486956d\`
- **License**: MIT (\`licence.md\`, SHA-256 \`${hash(shatlykLicBytes)}\`)
- **Evaluated Items (14)**: \`3d-marquee\`, \`animated-dropdown\`, \`button-colorful\`, \`fancy-text-hover\`, \`gradient-borders-button\`, \`hover-border-gradient\`, \`interactive-hover-button\`, \`link-hover\`, \`motion-button\`, \`shimmer-button\`, \`shiny-button\`, \`social-button\`, \`team-member-card\`, \`typing-effect\`

## Investigation & Disposition
- Exact upstream repository \`Shatlyk1011/emerald-ui\` identified under MIT.
- All 14 exact component source files captured under \`ops/phase-e-pinned/shatlyk1011/source/\`.
- Ten prompt variants generated in \`copy-prompts.json\`.
- All 14 items are HELD (\`uncaptured_source_item\`) pending GSAP/motion dependency review and completion of HigherBits demo wrappers, self-contained GHL exports, and deployed HTTPS preview assets per INGESTION_SOP §2-§3.
`)

writeFileSync('ops/phase-e-pinned/shatlyk1011/DEPENDENCY_LICENSE_REVIEW.md', `# Dependency & License Review: Shatlyk1011

- Upstream Repository: \`https://github.com/Shatlyk1011/emerald-ui\`
- Revision: \`ca2a6f309f59d517f70235fc3d4a04368486956d\`
- License: MIT License (confirmed in \`licence.md\`, SHA-256 \`${hash(shatlykLicBytes)}\`)
- Dependencies:
  - GSAP components (\`fancy-text-hover\`, \`link-hover\`): \`gsap\`
  - Motion components (\`hover-border-gradient\`, \`motion-button\`): \`framer-motion\`
  - UI components (\`interactive-hover-button\`, \`social-button\`, \`team-member-card\`, \`animated-dropdown\`): \`lucide-react\`
- Status: Permissive license passes; hold applied due to external GSAP/framer-motion dependencies and pending demo/preview pipeline assets.
`)

// ==================== 9. Smit-Prajapati ====================
const smitManifest = {
  creator: 'Smit-Prajapati',
  ownerLabel: 'Smit-Prajapati',
  name: 'Smit Prajapati',
  sheetRow: 37,
  profileUrl: 'https://21st.dev/@Smit-Prajapati',
  githubUser: 'https://github.com/Smit-Prajapati',
  repositoryUrl: 'https://github.com/Smit-Prajapati/css-cards',
  revision: null,
  licenseSpdx: null,
  evaluationStatus: 'all_items_held',
  holdReason: 'unmapped_permissive_source_component',
  holdDetail: 'Repository Smit-Prajapati/css-cards contains raw HTML/SCSS card snippets without component isolation or permissive license file; fails permissive license safeguard.',
  items: [
    { slug: 'glass-card', title: 'Glass Card', status: 'held', reason: 'unmapped_permissive_source_component', detail: 'Repository Smit-Prajapati/css-cards has no permissive license file and contains monolithic HTML/SCSS demo rather than isolated reusable component.' }
  ]
}
writeFileSync('ops/phase-e-pinned/smitprajapati/manifest.json', JSON.stringify(smitManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/smitprajapati/README.md', `# Creator Review: Smit-Prajapati

## Profile Information
- **Creator Handle**: \`Smit-Prajapati\`
- **Creator Name**: \`Smit Prajapati\`
- **Sheet Row**: 37
- **21st Profile**: \`https://21st.dev/@Smit-Prajapati\`
- **Evaluated Item (1)**: \`glass-card\`

## Investigation Evidence
- Public GitHub user query confirmed user \`Smit-Prajapati\` (ID \`103880321\`).
- Repository \`Smit-Prajapati/css-cards\` inspected. Contains monolithic \`index.html\`, \`style.css\`, and \`style.scss\`.
- Repository lacks any open-source license file (LICENSE / LICENSE.md returned HTTP 404).
- Does not contain a discrete reusable React/TypeScript component file.

## Disposition
- **Status**: HELD (1 item)
- **Held Reason**: \`unmapped_permissive_source_component\`
`)

// ==================== 10. SubframeApp ====================
const subframeManifest = {
  creator: 'SubframeApp',
  ownerLabel: 'SubframeApp',
  name: 'SubframeApp',
  sheetRow: 38,
  profileUrl: 'https://21st.dev/@SubframeApp',
  githubUser: 'https://github.com/SubframeApp',
  website: 'https://subframe.com',
  repositoryUrl: null,
  revision: null,
  licenseSpdx: null,
  evaluationStatus: 'all_items_held',
  holdReason: 'unmapped_source_repository',
  holdDetail: 'SubframeApp organization repositories host core developer tools and CLI, but sheet items correspond to proprietary Subframe design-to-code exports not published in open-source repositories.',
  items: [
    'accordion-1', 'area-chart', 'avatar-2', 'breadcrumb', 'calendar-1',
    'checkbox-1', 'checkbox-card', 'checkbox-group-1', 'context-menu-1'
  ].map(slug => ({
    slug,
    title: slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
    status: 'held',
    reason: 'unmapped_source_repository',
    detail: 'Item is a proprietary Subframe platform export; no public open-source component repository exists.'
  }))
}
writeFileSync('ops/phase-e-pinned/subframeapp/manifest.json', JSON.stringify(subframeManifest, null, 2) + '\n')

writeFileSync('ops/phase-e-pinned/subframeapp/README.md', `# Creator Review: SubframeApp

## Profile Information
- **Creator Handle**: \`SubframeApp\`
- **Creator Name**: \`SubframeApp\`
- **Sheet Row**: 38
- **21st Profile**: \`https://21st.dev/@SubframeApp\`
- **Website**: \`https://subframe.com\`
- **Evaluated Items (9)**: \`accordion-1\`, \`area-chart\`, \`avatar-2\`, \`breadcrumb\`, \`calendar-1\`, \`checkbox-1\`, \`checkbox-card\`, \`checkbox-group-1\`, \`context-menu-1\`

## Investigation Evidence
- GitHub organization \`SubframeApp\` (ID \`132867832\`) inspected.
- Repositories include \`subframe\` (CLI and Radix wrapper primitives), \`subframe-nextjs-starter-kit\`, \`subframe-vite-starter-kit\`.
- The specific numbered component blocks (\`accordion-1\`, \`avatar-2\`, \`checkbox-group-1\`, etc.) are user-generated or proprietary exports from the Subframe web application and do not exist in public open-source repositories.
- Per INGESTION_SOP §1: exact repository mapping is absent.

## Disposition
- **Status**: HELD (9 items)
- **Held Reason**: \`unmapped_source_repository\`
`)

console.log('All manifests and READMEs written successfully!')
