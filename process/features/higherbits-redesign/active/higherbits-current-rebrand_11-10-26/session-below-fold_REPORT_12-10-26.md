# Supplemental below-fold pixel review — 12-10-26

TL;DR: Eight route/theme/viewport combinations captured successfully in 34.023s, exit 0, without changing layout/auth/consent. Each has preview and bottom views: 16 supplemental PNGs, all inspected at original resolution. These expose genuine nested-scroll content but do not establish strict full-page pixel coverage: middle MCP sections and overlay-obscured portions remain unreviewed.

## Scope and safeguards

The preceding public-only Axe run had already completed ten PASS before this work; it was not interrupted. Graphify queried first, read session-exit-review_REPORT_12-10-26.md, used vc-web-testing and its Playwright reference. Existing final eight header screenshots and all previous reports/evidence preserved.

Current-checkout http://localhost:3101 only. Authorized existing state consumed exclusively through Playwright storageState, never read/printed. Same Desktop Chrome device settings as harness, with 1280×900 desktop or 375×812 mobile viewport; mobile remains desktop Chromium with a narrow viewport, matching existing visual spec rather than mobile-device emulation. Light/dark theme initialization follows existing harness. No app CSS/layout/auth changes, stylesheet injection, forms submitted, consent decisions changed, account-menu interactions, direct provider probes, source edits, restarts or retries. Screenshots contain public product/legal content only; no credentials or private email visible.

## Rendered DOM observation and method

Both protected routes expose one visible scrolling DIV with observed class:

```text
absolute inset-0 min-h-screen w-full overflow-auto bg-background text-foreground
```

Its computed overflowY is auto, clientHeight equals viewport height, and scrollHeight exceeds it. Desktop inspection found MCP scrollHeight 4327 and AI 1677, explaining why document fullPage:true produced viewport-height captures. Actual nested DIV scrolled via scrollTo; app CSS untouched.

Before any scroll, each context reached its exact route URL and visibly proved Introducing HigherBits MCP or Introducing HigherBits AI. Before each screenshot, exact final URL and identity-node existence rechecked. Preview image decoded successfully, naturalWidth 1440. Preview image position determined from actual element/container rectangles plus scrollTop. The DIV then scrolled near preview top and separately to its actual maximum scrollTop. Bottom-position equality asserted. A 300000ms global deadline would close the browser; it did not expire. No automatic retry.

Eight combinations each need two normal viewport images to show preview and distant lower content; therefore 16 supplemental PNGs rather than eight overloaded full-page claims. AI mobile preview and bottom positions coincide at maxTop, so those paired files intentionally cover the same view. Existing header PNGs remain the top-of-page evidence.

Executed temporary out-of-repository script:

```sh
node /private/tmp/higherbits-below-fold-12-10-26.cjs > /private/tmp/higherbits-below-fold-12-10-26.log 2>&1
```

Resolved installed @playwright/test from current checkout apps/web, no dependency install. One initial bounded DOM inspection of both desktop routes preceded the capture script; no screenshots taken in that inspection. It identified actual scrollability and lower headings/images, without cookie/session inspection. Capture script has assert-based checks for final URL, identity, single actual scrolling container, loaded preview, nonzero scroll, bottom position, eight combinations and 16 files. No source-code tests were added.

## Exact dimensions and scroll positions

Both preview/bottom PNGs in each row have the listed dimensions. Values are actual measured CSS pixels; preview/max positions identical across themes at each viewport.

| Route | Theme | Viewport / PNG dimensions | Nested scrollHeight | Preview scrollTop | Bottom scrollTop = maxTop |
|---|---|---|---:|---:|---:|
| /higherbits-mcp | light | desktop 1280×900 | 4327 | 650 | 3427 |
| /higherbits-mcp | dark | desktop 1280×900 | 4327 | 650 | 3427 |
| /higherbits-mcp | light | mobile 375×812 | 5318 | 546 | 4506 |
| /higherbits-mcp | dark | mobile 375×812 | 5318 | 546 | 4506 |
| /magic-chat | light | desktop 1280×900 | 1677 | 588 | 777 |
| /magic-chat | dark | desktop 1280×900 | 1677 | 588 | 777 |
| /magic-chat | light | mobile 375×812 | 1100 | 288 | 288 |
| /magic-chat | dark | mobile 375×812 | 1100 | 288 | 288 |

Runtime: 34023ms. Eight captured records; 16 PNGs; expired=false; exitCode=0. Actual PNG IHDR dimensions recorded in capture-results.json, not inferred from filenames. Preview render heights: desktop approximately 689.484px, mobile 206.875px. Container classes, height, scroll ranges, preview dimensions, visible headings/images/footer rectangles and capture paths recorded per combination.

## Native pixel findings

All 16 PNGs inspected through view_image(detail=original), covering all eight combinations and both positions.

- Shared preview in both protected consumers visibly uses HigherBits.dev, Illustrative Examples, three component studies, and illustration-only disclosure; no Magic/21st branding observed in the inspected preview pixels. No new claim about uninspected assets or all page strings.
- Sticky header correctly shows HigherBits MCP on MCP and HigherBits AI on AI, both themes and viewports. Headers remain over the scrolled content: MCP mobile preview top is partly overlapped; AI mobile header overlays hero descriptive text at the bottom position. This is visible overlap, not an inferred authentication defect.
- Desktop preview exposes the three study cards and bottom illustration disclosure. Existing light/dark fades dim the lower art; AI light disclosure is especially pale. Mobile scales the complete three-column artwork to roughly 207px tall, making small labels/disclosure difficult to read, with additional fade. Image decode succeeded; this is presentation/readability evidence, not a missing image.
- MCP mobile preview also exposes Supported IDEs and some vendor icon content. MCP bottom exposes lower FAQ questions and footer links. Some MCP FAQ questions refer to HigherBits AI while the header is MCP; record cross-product wording for owner review, without assuming it is incorrect or new.
- AI desktop bottom exposes lower artwork and footer; AI mobile bottom exposes preview, footer top and still-empty waitlist field above. No submissions or interactive controls activated. Preview artwork contains illustrated controls only.
- Existing cookie consent remains open in every image. Its fixed overlay masks the lowest footer/legal text, particularly on mobile; sticky navigation masks some upper pixels. No consent click, DOM removal or CSS hiding used to make the images look cleaner. Next development UI is visible. Footer company label wraps into short stacked lines on mobile; visible link rows wrap within available width.

These observations are visual concerns/coverage limits, not new automated Axe findings. The earlier final ten public and four admin zero-violation scans remain separate evidence.

## Coverage limits — no strict full-page claim

MCP desktop preview spans approximately scroll-coordinate 650–1550 and bottom 3427–4327; middle 1550–3427 remains uncaptured in this supplement. MCP mobile spans 546–1358 and 4506–5318; middle 1358–4506 remains uncaptured. Supported IDEs, features, How It Works and upper FAQ therefore lack complete pixel review; DOM discovery alone does not prove them visually. Existing header shots fill only the initial viewport, not those middle ranges.

AI top/header evidence plus overlapping preview/bottom captures spans its scroll range geometrically, but fixed overlays/fades obscure portions and footer text. It is not strict unoccluded full-content proof. Neither reaching maxTop nor 16 successful captures closes the reviewer's full-page requirement. This bounded task improves actionable pixel evidence while preserving those honest gaps. No additional retry or broad capture run follows.

Missing fresh pre-edit public baseline remains missing. The completed late public ten-case capture must not be relabeled as historical baseline. No phase VERIFIED/EVL closeout or risk-packet completeness claim.

## Exact evidence paths

Repository-relative supplemental root:

```text
process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/evidence/phase-01/session-below-fold-4be8086e-9dd3-4e75-910d-b9c66887fe89/
```

Files relative to that root:

```text
capture-results.json
capture-script.cjs
command.log
higherbits-mcp-light-desktop-preview.png
higherbits-mcp-light-desktop-bottom.png
higherbits-mcp-dark-desktop-preview.png
higherbits-mcp-dark-desktop-bottom.png
higherbits-mcp-light-mobile-preview.png
higherbits-mcp-light-mobile-bottom.png
higherbits-mcp-dark-mobile-preview.png
higherbits-mcp-dark-mobile-bottom.png
magic-chat-light-desktop-preview.png
magic-chat-light-desktop-bottom.png
magic-chat-dark-desktop-preview.png
magic-chat-dark-desktop-bottom.png
magic-chat-light-mobile-preview.png
magic-chat-light-mobile-bottom.png
magic-chat-dark-mobile-preview.png
magic-chat-dark-mobile-bottom.png
```

Script copy and raw log preserved for reproducibility; script contains only state-file path, not credentials. Private state never copied into evidence. This custom capture uses capture-results.json, not the reused Playwright test reporter; existing test-results/results.json and final-header evidence were not overwritten. Previous session-final-runtime_REPORT_12-10-26.md and session-public-final_REPORT_12-10-26.md remain saved: combined 20 PASS and late public Axe ten PASS respectively.

Unresolved questions: complete MCP middle-section pixel coverage; overlay-obscured/footer pixels; small/faded mobile artwork readability; cross-product FAQ wording; missing historical public baseline. Further product decisions/verification belong to parent.

**Status:** DONE_WITH_CONCERNS
**Summary:** Eight combinations successfully captured in 16 supplemental preview/bottom PNGs and all reviewed natively; source/auth/layout/consent preserved.
**Concerns/Blockers:** Middle MCP sections and overlay-obscured pixels prevent strict full-page review; missing public pre-edit baseline remains unresolved.

## Follow-up: MCP overlapping middle tiles — 12-10-26

TL;DR: Four MCP combinations successfully tiled top through actual nested-scroll bottom in 24.732s, exit 0. All 38 new PNGs inspected at original resolution. This supersedes the earlier missing-middle-section coverage gap for the current collapsed page state. Consent-obscured footer pixels and other overlay/mobile presentation limits remain. Newly reviewed artwork visibly contains the identifier 21st_magic_component_builder; owner classification required before asserting all consumer pixels are rebranded.

### Capture scope and exact coverage

Graphify queried first. MCP only, light/dark × desktop/mobile. No AI, final 20-case or public ten-case rerun. Existing authorized Playwright storageState used without content access; same Desktop Chrome configuration as preceding capture. Exact /higherbits-mcp URL and visible Introducing HigherBits MCP identity established before scrolling, with URL/identity-node guards before each tile. Actual single nested scrolling DIV asserted; its actual scrollTop checked at every requested position. First tile top=0, last tile top=maxTop, and adjacent viewport ranges overlap by assert-based self-checks.

Only native nested scroll positions and screenshots changed during capture. No app CSS, auth, cookie-consent, cache, server or source changes; no accordion/form/account-menu interaction or direct provider probe. 300000ms deadline retained, expired=false; no retries. Browser closed on completion. Prior screenshots, reports and historical baseline provenance preserved.

```sh
node /private/tmp/higherbits-mcp-scroll-tiles-12-10-26.cjs > /private/tmp/higherbits-mcp-scroll-tiles-12-10-26.log 2>&1
```

| Theme | Viewport / each PNG | ScrollHeight | Tile count | Actual scrollTop sequence |
|---|---|---:|---:|---|
| light | desktop 1280×900 | 4327 | 7 | 0, 650, 1300, 1950, 2600, 3250, 3427 |
| dark | desktop 1280×900 | 4327 | 7 | 0, 650, 1300, 1950, 2600, 3250, 3427 |
| light | mobile 375×812 | 5318 | 12 | 0, 450, 900, 1350, 1800, 2250, 2700, 3150, 3600, 4050, 4500, 4506 |
| dark | mobile 375×812 | 5318 | 12 | 0, 450, 900, 1350, 1800, 2250, 2700, 3150, 3600, 4050, 4500, 4506 |

Desktop nominal overlap 250px; mobile nominal overlap 362px; final tiles overlap more. Native review used view_image(detail=original) on every one of the 38 tiles, including repeated top/bottom images. Adjacent views expose content masked by the sticky header or consent at a previous intermediate position. Thus Supported IDEs, all three Powerful Features cards, all three How It Works cards, FAQ heading and all collapsed question labels now have visual evidence in both themes/viewports. No FAQ answer-panel proof, because accordions were not expanded.

### Newly visible issues and remaining limits

- **Visible legacy identifier in lower artwork:** How It Works → Choose from Options contains Calling MCP tool 21st_magic_component_builder inside its illustration. Confirmed in light/dark desktop tile index 04 at scrollTop 2600 and light/dark mobile tile index 06 at scrollTop 2700. This is a pixel finding, not a failed automated test or evidence of a live tool call. Earlier preview-only statements apply only to the shared illustrative preview, not this lower consumer. Determine whether this is an intentional truthful integration identifier or outdated illustrative product branding; no assumption or source fix made by tester.
- MCP FAQ subtitle/questions still refer to HigherBits AI while MCP header remains MCP. Cross-product wording remains a reported owner-review question, not automatically classified as wrong. Vendor names/logos Cursor, Windsurf, VS Code + Cline and SVGL are visible; no recommendation to erase truthful vendor attribution.
- Mobile header floats over scrolling body text/headings/cards, notably Powerful Features and How It Works positions. Overlap captures let those body areas be read in adjacent tiles, but the live overlap is still visible. Main artwork remains scaled/faded; small text is not made publication-legible merely by adding tiles. Light hero header contrast is weak against its dark background; dark header becomes weak over bright background. No new quantitative accessibility audit run.
- Cookie banner remains open at every position. At absolute bottom it masks approximately the final 58 desktop CSS pixels (footer coordinates roughly 4269–4327) and 170 mobile pixels (roughly 5148–5318), including lower footer/legal/link content. Further scrolling cannot expose these at maxTop under the unchanged layout/consent constraint. Consent was not removed or accepted. Development UI masks a small additional corner; light desktop top has a one-issue indicator, cause uninvestigated.
- This is overlapping native viewport evidence of all sections in their current collapsed state, not a stitched full-page image or an unobstructed full-content acceptance claim. The prior large MCP middle gaps are filled; consent-obscured footer, small/faded artwork, closed FAQ answers and product-label classification remain limitations. Historical public pre-edit baseline remains missing.

### Exact follow-up evidence paths

Repository-relative new root:

```text
process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/evidence/phase-01/session-mcp-middle-838c831e-2048-43da-84c1-6bdaac969ee5/
```

Contains capture-results.json, command.log and capture-script.cjs. JSON enumerates every exact PNG path, dimensions, actual scroll coordinates and visible headings; raw log confirms four completed combinations and exit 0. File naming inside root:

```text
higherbits-mcp-{light|dark}-desktop-{00..06}-scroll-{actualScrollTop}.png
higherbits-mcp-{light|dark}-mobile-{00..11}-scroll-{actualScrollTop}.png
```

Index corresponds in order to the sequences above. Exact key finding paths:

```text
higherbits-mcp-light-desktop-04-scroll-2600.png
higherbits-mcp-dark-desktop-04-scroll-2600.png
higherbits-mcp-light-mobile-06-scroll-2700.png
higherbits-mcp-dark-mobile-06-scroll-2700.png
```

No reused test reporter touched; custom capture-results.json keeps this evidence separate from prior 20-PASS/runtime and ten-PASS/public results. Original 16 supplemental and eight final header images remain intact. This append records follow-up completion without rewriting historical observations.

Unresolved questions: classification of lower legacy tool-label pixels and MCP/AI FAQ wording; footer pixels hidden by unchanged consent; mobile/header presentation limits; absent historical public baseline. No further automatic browser runs.

**Status:** DONE_WITH_CONCERNS
**Summary:** All four MCP combinations tiled and all 38 PNGs reviewed; skipped middle sections now covered with preserved artifacts.
**Concerns/Blockers:** Visible 21st_magic_component_builder artwork needs classification; consent still prevents unobscured footer review, and historical public baseline remains missing.
