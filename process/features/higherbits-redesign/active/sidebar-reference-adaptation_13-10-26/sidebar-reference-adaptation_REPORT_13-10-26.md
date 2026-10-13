# Sidebar reference investigation — 2026-10-13

## Scope and ownership
Application repository discovered via vault process/context/all-context.md: /Users/clarencelloydgayo/Gayo Sphere/HigherBits.dev. This vault is not app code. User authorizes investigation, mapping, plan and approval checkpoint; sidebar implementation is not approved yet. Keep local; no deployment or unrelated feature work.

## Live reference directly observed
Authenticated Chrome session at https://21st.dev/ on 2026-10-13. Reference desktop screenshot saved /tmp/higherbits-sidebar-reference/21st-home-desktop.jpg, 1920x980. Existing account session was used; no sign-in, publishing, settings or data mutations.
The current reference has changed relative to the user's older screenshots.
Root items ordered: Home; Explore heading; Components, Themes, Templates, Apps (New), Icons (New), Video (New), Bookmarks; Build heading; Creator Studio, 21st AI, Design Bug Bot (Try free), CLI & MCP. Footer Help and Publish buttons.
Logo top left links home. Search button appears below logo, with Cmd+K hint. Main page header utilities are outside sidebar scope.
Direct DOM measurement: sidebar 239.5px wide; outer horizontal inset 8px; navigation rows 223.5x32px; row left padding2px/right8px; icon cell32px, SVG16px; row radius6px; General Sans14px/20px weight500. Group headings12px/16px weight500, left16px. Main rows have 1px vertical gaps. Home selected aria-current=page, foreground text and foreground/5 background. Other items muted foreground. Reference dusk base visually near black. Keep HigherBits own brand tokens and font, rather than copying logo/font assets.
Scrollable nav element: overflow-y:auto; clientHeight861px, scrollHeight861px in root view; Help/Publish outside nav at bottom. Only structural scroll container confirmed, no actual wheel gesture tested.
Mixed icon sources: lucide-house, lucide-grid2x2, lucide-shapes, lucide-cable confirmed by SVG classes. Other icons have only h-4/w-4 or size-4; exact families not identified. Reuse HigherBits available icons; do not claim all reference icons Lucide.

## Direct verified interaction
Clicked Components link. URL changed to https://21st.dev/community/components. Sidebar root list replaced by component-specific navigation. Observed logo, Close sidebar button, Components button, local search input with '/' hint, Featured/Newest/Authors/Libraries (Updated), Marketing Blocks/UI Components headings and complete category list in reference-items.json. Footer Help/Publish remain.
All category anchor hrefs and order came from live accessibility state. Newest is an anchor; no inline expansion verified. Components button's actual behavior was NOT tested.

## Blocked/partial observations
Before next reference measurements, Chrome reported 'Browser is not available: 3'. Fresh-tab recovery through selected browser failed with same error. Native Chrome fallback timed out and reset browser runtime. Stopped retrying. Therefore mobile/tablet, keyboard/focus, actual scroll behavior, close-sidebar behavior, Help/Publish popovers, Themes/Templates/AI/Studio context panels, component search filtering and Components-switch button are NOT VERIFIED. Do not infer these from older screenshots.
The crawler sees a logged-out marketing page at 21st.dev, different from the authenticated app sidebar; it cannot substitute for browser state. HigherBits live root was inaccessible to web crawler. HigherBits implementation was inspected in source, not visually verified this turn.
No network-trace capability was used. No private responses/HAR/cookies/tokens captured. Stage2 navigation contract consists of observed anchors/routes only; backend transport/response schema uninspected. Sidebar adaptation does not require a new API.

## HigherBits source diff
Graphify query Sidebar executed against product graph, confirmed MainSidebar in apps/web/components/features/main-page/sidebar-layout.tsx. Existing main/components/libraries views, Sidebar provider, focus ring/Sheet, live useCategoryTagCounts and native modified-click behavior should be reused.
Product context router missing docs/01-architecture-and-stack.md; current source overrides stale historical descriptions.
Source regex count verified 75 category items (29 marketing+46 UI); researcher first said73, superseded by exact count.
Reference component categories78 (29+49); missing nav entries Profiles/Progress/Search Bars lack tag rows as well.
Category page apps/web/app/s/[tag_slug]/page.tsx:84-86 calls notFound when tags row absent. Production read-only query shows missing tag rows for27 current links:
announcement, ascii, avatar, bento-grid, call-to-action, carousel, chip-tag, faq, footer, gallery, hook, icons, image, link, map, notification, onboarding, pagination, radio-group, registration-signup, slider, stepper, team-section, textarea, toast, upload-download, video.
Verified existing semantic aliases: avatar->avatars; bento-grid->grid; registration-signup->registration; team-section->team; carousel->3d-carousel (narrower available carousel subset, label accordingly or document page title).
Other unsupported category rows remain Coming soon; zero-count categories with a real tag row remain real working links (not Coming soon). No DB/category seeding is authorized by sidebar-only scope.

## Feature truth and permission boundaries
Home is /?tab=home; / is marketing landing. Components /?tab=components&sort=recommended. Creators /?tab=authors, Collections /?tab=collections, Libraries /?tab=libraries. Bookmarks signed-in profile path with existing username fallback.
Templates/Bundles/Premium Stores have data-backed source but current sidebar admin-only. Preserve gates; non-admin visibility must remain hidden. AI generation not shipped: /magic-chat is admin-gated waitlist. MCP route family /higherbits-mcp admin server-gated. Contest server/admin-gated. Don't grant public access or imply active generation/CLI.
Themes public catalog unsupported; theme authoring exists only in owned Studio. Apps, Icons, Video standalone catalogs absent.
Creator Studio /studio exists; resolves signed-in user to /studio/{username}/components. Current Add new reuses studioHardNavigate and ?new=true to open creation dialog; preserve it (modal interception makes plain three-segment router.push unsafe). Use existing signed-in guard; no account or component creation during research.
Purchased Bundles is incomplete renderer; mark unavailable even to admin. Preserve active Bundles/Templates/Pro/Contest/admin/profile/help/pricing/navigation needed by users in supplemental groups.
Local admin pink Unlock everything/Support Us card remains in dirty sidebar code but previous user requested removal and production overlay removed it. Do not reintroduce; include removal of this local residual within sidebar patch.
Exact reference Design Bug Bot is a proprietary GitHub design-review service with no meaningful existing HigherBits equivalent/approved roadmap; propose omission, no invented promise. CLI portion similarly unsupported; label MCP accurately and do not advertise npx higherbits.


## Evidence coverage ledger

| Surface | Evidence | Coverage / limit |
|---|---|---|
| Authenticated reference root | Direct Chrome DOM + screenshot | Desktop at 1920×980; item order, typography, geometry and active row measured |
| Reference Components | Direct click + URL + accessibility anchors | Context replacement and 78-category order verified |
| HigherBits implementation | Current source + graph query | Routes, UI structure, auth guards; not a live visual inspection |
| HigherBits category availability | Root-provided read-only production tags query | 27 missing existing tag slugs; 5 verified aliases; zero counts do not imply missing tags |
| Reference mobile, keyboard, scroll gestures, menus | Unverified | Browser connection lost; no claimed parity |
| API/backend | Observed anchors only | No network payload/HAR capture; no new backend required |

## Per-item reference mapping

Status evidence below is intentionally source-backed or live-DB-backed unless explicitly described as direct browser verification. HigherBits destination pages still need runtime verification after implementation approval.

| 21st.dev item | HigherBits equivalent | Implementation status and evidence | Proposed behavior |
|---|---|---|---|
| Home | Home — `/?tab=home` | Source-backed: atoms.ts; page.client.tsx tab renderer | Native link; active only for Home, bare `/` remains landing. |
| Explore: Components | Components — `/?tab=components&sort=recommended` | Source-backed: MainSidebar; recommended component browser | Link and enter component context; no fake expansion arrow. |
| Themes | Themes | Unsupported public catalog; owned Studio theme authoring is different | Disabled Coming soon row. |
| Templates | Templates — `/?tab=templates` | Data-backed source renderer; MainSidebar currently admin-only | Admin real link; retain current hidden state for non-admins. Restriction is not a missing feature. |
| Apps | Apps | No standalone catalog located | Disabled Coming soon; omit reference New badge. |
| Icons (root catalog) | Icons | No standalone icon catalog located | Disabled Coming soon; distinct from component category. |
| Video (root catalog) | Video | No standalone video catalog located | Disabled Coming soon; distinct from component category. |
| Bookmarks | Bookmarks — `/{resolvedUsername}?tab=bookmarks` | Source-backed: MainSidebar:1060–1083 username resolution and signed-in gate | Signed-in only; native profile link with existing identity fallbacks. No href if identity unresolved. |
| Build: Creator Studio | Creator Studio — `/studio` or resolved user components path | Source-backed: Studio entry in `apps/web/app/studio/page.tsx:165–192` | Reuse Studio hard-navigation helper and existing authentication flow. |
| 21st AI | HigherBits AI | Generation unavailable; `/magic-chat` is admin waitlist only | Public Coming soon. Preserve admin HigherBits AI Waitlist as separately labelled link. |
| Design Bug Bot | Omitted | Proprietary reference service; no HigherBits equivalent or approved roadmap | Do not invent HigherBits bug bot or roadmap promise. |
| CLI & MCP | HigherBits MCP | Server/admin-gated `/higherbits-mcp` route family; CLI unsupported | Retain admin-only visibility and real MCP link/Onboarding/Console. Hide for non-admins; omit CLI claim. |
| Brand home | Existing HigherBits header brand | Existing app header owns branding | Preserve existing brand/header; avoid duplicated logo in sidebar. |
| Search + Cmd+K | Search components | header.client.tsx:348 dispatches existing command shortcut; command-menu.tsx consumes it | Sidebar button invokes same current search action; accessible name Search components. |
| Help | Help | Existing main-page/help.tsx and helpOpen state | Keep current Help panel action in persistent footer; verify opening and closing. |
| Publish | Publish component | header.client.tsx:287–300 Add new; existing Studio consumes `new=true` | Signed-in only; reuse studioHardNavigate `/studio/{username}/components?new=true`; existing `/studio?new=true` fallback. |
| Close sidebar | Close navigation | Existing useSidebar setOpen/setOpenMobile and Sheet | Labelled icon button; desktop collapse/mobile close; Escape retained by Sheet. |
| Components context button | Back to main navigation | Existing sidebarView main/components/libraries | Button switches context without adding browser-history entry; verified reference button purpose is untested. |
| Category search + / | Search categories | Existing searchQuery/ref filter + slash handler | Label input; retain case-insensitive category filtering and editable-target shortcut guard. |
| Featured | Featured — `/?tab=components&sort=recommended` | Existing recommended sort; reference route differs | Link, one URL transition; aria-current on active route. |
| Newest | Newest — `/?tab=components&sort=date` | Existing date sort; reference anchor observed | Link, not invented expandable menu; aria-current on active route. |
| Authors | Creators — `/?tab=authors` | Existing authors renderer and main Creators label | Preserve HigherBits term Creators; enter correct view and active state. |
| Libraries | Libraries — `/?tab=libraries` | Existing library list and sidebar library context | Keep current library controls/filters and contextual view; no invented New/Updated claim. |
| Explore heading | Explore | Live reference heading; grouping change only | 12px/16px heading; root reference order retained, Creators and Collections appended. |
| Build heading | Build | Live reference heading; grouping change only | Creator Studio, HigherBits AI, HigherBits MCP followed by gated admin tools. |
| Marketing Blocks heading | Marketing Blocks | Both current source and live reference | Retain visible heading; do not invent accordion. |
| UI Components heading | UI Components | Both current source and live reference | Retain visible heading; do not invent accordion. |
| Marketing Blocks: Announcements | Announcements — No active route | Live DB: `announcement` tag absent; category server page:84–86 returns notFound. Current source has `/s/announcement`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| Marketing Blocks: ASCII Art | ASCII Art — No active route | Live DB: `ascii` tag absent; category server page:84–86 returns notFound. Current source has `/s/ascii`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| Marketing Blocks: Backgrounds | Backgrounds — /s/background | Source navigation.ts `/s/background`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Borders | Borders — /s/border | Source navigation.ts `/s/border`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Calls to Action | Calls to Action — No active route | Live DB: `call-to-action` tag absent; category server page:84–86 returns notFound. Current source has `/s/call-to-action`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| Marketing Blocks: Clients | Clients — /s/clients | Source navigation.ts `/s/clients`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Comparisons | Comparisons — /s/comparison | Source navigation.ts `/s/comparison`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Docks | Docks — /s/dock | Source navigation.ts `/s/dock`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: FAQs | FAQs — No active route | Live DB: `faq` tag absent; category server page:84–86 returns notFound. Current source has `/s/faq`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| Marketing Blocks: Features | Features — /s/features | Source navigation.ts `/s/features`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Footers | Footers — No active route | Live DB: `footer` tag absent; category server page:84–86 returns notFound. Current source has `/s/footer`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| Marketing Blocks: Galleries | Galleries — No active route | Live DB: `gallery` tag absent; category server page:84–86 returns notFound. Current source has `/s/gallery`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| Marketing Blocks: Gradients | Gradients — /s/gradients | Source navigation.ts `/s/gradients`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Heroes | Heroes — /s/hero | Source navigation.ts `/s/hero`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Hooks | Hooks — No active route | Live DB: `hook` tag absent; category server page:84–86 returns notFound. Current source has `/s/hook`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| Marketing Blocks: Images | Images — No active route | Live DB: `image` tag absent; category server page:84–86 returns notFound. Current source has `/s/image`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| Marketing Blocks: Maps | Maps — No active route | Live DB: `map` tag absent; category server page:84–86 returns notFound. Current source has `/s/map`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| Marketing Blocks: Marquees | Marquees — /s/marquee | Source navigation.ts `/s/marquee`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Navigation Menus | Navigation Menus — /s/navbar-navigation | Source navigation.ts `/s/navbar-navigation`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Pricing Sections | Pricing Sections — /s/pricing-section | Source navigation.ts `/s/pricing-section`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Scroll Areas | Scroll Areas — /s/scroll-area | Source navigation.ts `/s/scroll-area`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Shaders | Shaders — /s/shaders | Source navigation.ts `/s/shaders`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Stats & KPIs | Stats & KPIs — /s/stats-kpi | Source navigation.ts `/s/stats-kpi`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Steppers | Steppers — No active route | Live DB: `stepper` tag absent; category server page:84–86 returns notFound. Current source has `/s/stepper`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| Marketing Blocks: Team Sections | Team Sections — /s/team | Source configured `/s/team-section` lacks tag; live DB verified `team` exists. | Link `/s/team`; use resolved slug for active state and live count. |
| Marketing Blocks: Testimonials | Testimonials — /s/testimonials | Source navigation.ts `/s/testimonials`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Texts | Texts — /s/text | Source navigation.ts `/s/text`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Timelines | Timelines — /s/timeline | Source navigation.ts `/s/timeline`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| Marketing Blocks: Videos | Videos — No active route | Live DB: `video` tag absent; category server page:84–86 returns notFound. Current source has `/s/video`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Accordions | Accordions — /s/accordion | Source navigation.ts `/s/accordion`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: AI Chats | AI Chats — /s/ai-chat | Source navigation.ts `/s/ai-chat`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Alerts | Alerts — /s/alert | Source navigation.ts `/s/alert`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Avatars | Avatars — /s/avatars | Source configured `/s/avatar` lacks tag; live DB verified `avatars` exists. | Link `/s/avatars`; use resolved slug for active state and live count. |
| UI Components: Badges | Badges — /s/badge | Source navigation.ts `/s/badge`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Buttons | Buttons — /s/button | Source navigation.ts `/s/button`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Calendars | Calendars — /s/calendar | Source navigation.ts `/s/calendar`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Cards | Cards — /s/card | Source navigation.ts `/s/card`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Carousels | 3D Carousels — /s/3d-carousel | Source configured `/s/carousel` lacks tag; live DB verified `3d-carousel` exists. | Link `/s/3d-carousel`; use resolved slug for active state and live count. Label 3D Carousels to disclose narrower subset. |
| UI Components: Charts & Data Viz | Charts & Data Viz — /s/charts | Source navigation.ts `/s/charts`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Checkboxes | Checkboxes — /s/checkbox | Source navigation.ts `/s/checkbox`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Cursors | Cursors — /s/cursor | Source navigation.ts `/s/cursor`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Dashboards | Dashboards — /s/dashboard | Source navigation.ts `/s/dashboard`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Date Pickers | Date Pickers — /s/date-picker | Source navigation.ts `/s/date-picker`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Dialogs / Modals | Dialogs / Modals — /s/modal-dialog | Source navigation.ts `/s/modal-dialog`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Dropdowns | Dropdowns — /s/dropdown | Source navigation.ts `/s/dropdown`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Empty States | Empty States — /s/empty-state | Source navigation.ts `/s/empty-state`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: File Trees | File Trees — /s/file-tree | Source navigation.ts `/s/file-tree`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: File Uploads | File Uploads — No active route | Live DB: `upload-download` tag absent; category server page:84–86 returns notFound. Current source has `/s/upload-download`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Forms | Forms — /s/form | Source navigation.ts `/s/form`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Globes | Globes — /s/globe | Source navigation.ts `/s/globe`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Grids & Bento | Grids & Bento — /s/grid | Source configured `/s/bento-grid` lacks tag; live DB verified `grid` exists. | Link `/s/grid`; use resolved slug for active state and live count. |
| UI Components: Icons | Icons — No active route | Live DB: `icons` tag absent; category server page:84–86 returns notFound. Current source has `/s/icons`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Inputs | Inputs — /s/input | Source navigation.ts `/s/input`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Links | Links — No active route | Live DB: `link` tag absent; category server page:84–86 returns notFound. Current source has `/s/link`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Lists | Lists — /s/list | Source navigation.ts `/s/list`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Menus | Menus — /s/menu | Source navigation.ts `/s/menu`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Notifications | Notifications — No active route | Live DB: `notification` tag absent; category server page:84–86 returns notFound. Current source has `/s/notification`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Numbers | Numbers — /s/number | Source navigation.ts `/s/number`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Onboarding | Onboarding — No active route | Live DB: `onboarding` tag absent; category server page:84–86 returns notFound. Current source has `/s/onboarding`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Paginations | Paginations — No active route | Live DB: `pagination` tag absent; category server page:84–86 returns notFound. Current source has `/s/pagination`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Popovers | Popovers — /s/popover | Source navigation.ts `/s/popover`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Profiles | Profiles — No active route | Live DB: `profile` tag absent; category server page:84–86 returns notFound. Reference-only category absent in current nav. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Progress | Progress — No active route | Live DB: `progress` tag absent; category server page:84–86 returns notFound. Reference-only category absent in current nav. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Radio Groups | Radio Groups — No active route | Live DB: `radio-group` tag absent; category server page:84–86 returns notFound. Current source has `/s/radio-group`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Search Bars | Search Bars — No active route | Live DB: `search` tag absent; category server page:84–86 returns notFound. Reference-only category absent in current nav. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Selects | Selects — /s/select | Source navigation.ts `/s/select`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Sidebars | Sidebars — /s/sidebar | Source navigation.ts `/s/sidebar`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Sign Ins | Sign Ins — /s/sign-in | Source navigation.ts `/s/sign-in`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Sign ups | Sign ups — /s/registration | Source configured `/s/registration-signup` lacks tag; live DB verified `registration` exists. | Link `/s/registration`; use resolved slug for active state and live count. |
| UI Components: Sliders | Sliders — No active route | Live DB: `slider` tag absent; category server page:84–86 returns notFound. Current source has `/s/slider`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Spinner Loaders | Spinner Loaders — /s/spinner-loader | Source navigation.ts `/s/spinner-loader`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Tables | Tables — /s/table | Source navigation.ts `/s/table`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Tabs | Tabs — /s/tabs | Source navigation.ts `/s/tabs`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Tags | Tags — No active route | Live DB: `chip-tag` tag absent; category server page:84–86 returns notFound. Current source has `/s/chip-tag`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Text Areas | Text Areas — No active route | Live DB: `textarea` tag absent; category server page:84–86 returns notFound. Current source has `/s/textarea`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Toasts | Toasts — No active route | Live DB: `toast` tag absent; category server page:84–86 returns notFound. Current source has `/s/toast`. | Disabled Coming soon row, no href/handler/count. Do not seed data. |
| UI Components: Toggles | Toggles — /s/toggle | Source navigation.ts `/s/toggle`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |
| UI Components: Tooltips | Tooltips — /s/tooltip | Source navigation.ts `/s/tooltip`; live DB tag exists; generic category renderer supported (not browser-verified). | Real native link, resolved live count, aria-current. Keep available even if count is zero. |

## HigherBits supplemental navigation retained

Creators and Collections follow Bookmarks in Explore. Signed-in Bookmarks retains its auth gate and username fallbacks. Admin-only Bundles, Templates and Premium Stores retain current real tab destinations and restrictions; Templates/MCP and implemented gated features remain hidden for non-admins; only unsupported catalogs show Coming soon. Contest Overview/Leaderboard and existing admin entry links remain under an admin-only group with unchanged hrefs. Purchased Bundles is an unavailable Coming soon row even for admins because the destination renderer is incomplete. Preserve the current Help contents, pricing/support links reachable there, and existing profile/header controls. Remove the residual local pink Upgrade/Support promotion previously rejected by the user; do not move it elsewhere.

## Navigation contract and visual adaptation

No API contract is invented from an anchor. Main sidebar link activation uses real hrefs and native modified-click behavior; normal click updates current app state consistently and closes only the mobile sheet. Studio/Publish use the existing hard-navigation path to avoid intercepted component-modal routing. Availability comes from the reviewed mapping, never from count > 0. The existing live count hook remains the count source. Coming-soon buttons have no href or navigation handler, native disabled state and visible readable Coming soon text; no tooltip-only explanation.

Adaptation intentionally keeps HigherBits 256px desktop/288px mobile widths and existing 768px breakpoint, brand font, lavender active token and theme colors. Reference rows guide compact 32px desktop rhythm, 16px icons, 14px/20px medium type, 12px/16px headings, 8px outer inset, 6px corners and 1px row gaps. Allow unavailable badge rows to grow without clipping; mobile targets are at least 44px. Footer is outside the independent nav scroll region. Reference mobile specifics are unknown; HigherBits Sheet behavior is the proposed implementation.

## Decision summary

**Chosen approach:** Adapt existing MainSidebar and sidebar-only navigation metadata; retain three current views and permissions.
**Why this over alternatives:** Reusing current primitives/handlers avoids replacing working Studio/sidebar behavior or adding routes. Global navigation arrays also feed homepage surfaces, so sidebar-only availability/order must not accidentally disable those surfaces.
**Risk predictions:** Dirty source overlaps; missing tags create 404s; alias count mismatches; route atoms can produce two-history-entry navigation; disabled badges can clip on narrow screens; auth-gated source does not prove public availability.
**Key constraints accepted:** No missing feature, database change, route creation, dependency, commit or deployment; preserve HigherBits brand and necessary navigation; reference mobile parity unverified.

## Anonymous HTTP follow-up

Home/components/authors/collections/libraries tab URLs returned200. Alias routes avatars/grid/registration/team/3d-carousel returned200 with expected category titles and without Next redirect/404 markers. This is HTTP/server identity evidence, not visual verification. `/s/ascii` streamed200 with `NEXT_HTTP_ERROR_FALLBACK;404`; a200 status is not sufficient route-health proof. `/higherbits-mcp` contains Next redirect/refresh markers anonymously, consistent with its permission boundary. Generic fallback text serialized in a successful response must not be mistaken for a visible404.

## Artifact recovery note — 13-10-26

The original investigation and exhaustive mapping were restored from the preserved planning-stage packet after the original report filename was unintentionally overwritten during execution. The execution report was preserved without modification as [sidebar-reference-adaptation-execution_REPORT_13-10-26.md](sidebar-reference-adaptation-execution_REPORT_13-10-26.md). Mapping implementation status describes the investigation-time baseline; subsequent changes and verification results belong to that separate execution report. Reference interaction limitations remain unchanged.
