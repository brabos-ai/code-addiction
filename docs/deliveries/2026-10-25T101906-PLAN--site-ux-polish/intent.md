---
path: bounded
topic: site-ux-polish
doc: none
delivery: confirm
ticket: 0068B
---

<!-- Exported from Notion intent https://app.notion.com/p/404e0000aeae811b8450ca084ac5971b (card site-ux-polish, ticket 0068B) on 2026-10-25. Approved by Maicon 2026-10-25 10:09 BRT. Full review report copied in Appendix A below (source: C:\github\xmaiconx\code-addiction-pm\.tmp\ux-review.md, main 5ef82709). -->

## Decided

1. Problem: the public site (https://code.brabos.ai/ landing and https://code.brabos.ai/docs/) has the right visual direction (OLED dark, single neon-green accent, terminal look, no framework JS, CLS ~0) but carries two bugs every visitor sees (brand fonts never apply; both pages scroll sideways on phones), several accessibility blockers, a stale hand-maintained ecosystem map, and no docs navigation aids. Source: a read-only review run with the ui-ux-pro-max skill by Claude Opus on Maicon's notebook on 2026-10-25, full report at `C:\github\xmaiconx\code-addiction-pm\.tmp\ux-review.md` (screenshots in `C:\tmp\ux-shots\`). Item ids below (P1.x, P2.x, P3.x, Qx) refer to that report; line numbers are from it. Verified on main `5ef82709`. All paths under `web/` unless stated. Stack: Astro 7, Tailwind v4 via `@tailwindcss/vite`, no UI framework.
2. Scope is one card, labels `internal` (site, not shipped framework). Everything below is in; nothing in "Out of scope" is.
3. Bugs and accessibility (report P1.1-P1.7, all S, no package):
   - Fonts: `src/styles/global.css:5-16` declares `--font-family-display/-body/-mono` (Tailwind v3 naming) inside `@theme`; rename to `--font-display`, `--font-body`, `--font-mono`. Delete `tailwind.config.mjs` (v3 syntax, never loaded). Syne only on `h1`/`h2`; JetBrains Mono for code/mono labels.
   - Mobile horizontal overflow: `overflow-hidden` on the hero `<section>` (`src/pages/index.astro:46-48`, glow `w-[600px]`); `min-w-0` on docs `<main>` (`src/pages/docs.astro:82`) and `min-w-0 break-all` on every `id="cmd-*"` command span (e.g. `:984`). Acceptance: `scrollWidth` equals the 390 px viewport on both pages.
   - Global `:focus-visible` ring in the accent color in `global.css`; remove `focus:outline-none` from `#eco-search` (`docs.astro:1091`).
   - Hero install copy (`index.astro:65-70`) becomes a real `<button>` with "copied" feedback, `aria-live`, and a fallback when clipboard is unavailable.
   - `--color-muted` raised from `#666666` to about `#8a8a8a` (AA for small text); no informative text below 12 px (replace `text-[10px]`).
   - `prefers-reduced-motion: reduce` disables fade-up, bounce, cursor blink, smooth scroll and Cytoscape animations; hero text never starts at `opacity:0` (also improves desktop LCP, measured ~4 s).
4. Fonts self-hosted (Q2 + P3.1): replace the Google Fonts `@import` (`global.css:1`) with `@fontsource` packages (`@fontsource-variable/outfit`, `@fontsource/syne` weights 600/800, `@fontsource-variable/jetbrains-mono`). Guard the Outfit→Syne swap against layout shift (`font-display: optional` or a `size-adjust` fallback) and re-check CLS.
5. Docs and landing correctness (report P2.3-P2.8, S each):
   - Providers from one source: new `src/data/providers.ts` imported by `index.astro:177-206` and `docs.astro:128-136, 1026-1055`; 6 providers, each with the directories it writes (fixes the duplicated Codex tile and the ZCode mismatch).
   - Scroll-spy: one `IntersectionObserver` sets `aria-current` + accent on the active sidebar link; sidebar order matches page order (`docs.astro:39-79`).
   - Mobile menus: `aria-expanded`/`aria-controls`, Esc closes; home lightbox becomes a native `<dialog>` (`index.astro:104-133`).
   - New `src/components/CommandLine.astro` (prompt, command, copy button ≥24×24 with label and "copied" feedback) used for every runnable command on both pages, replacing the near-duplicate blocks.
   - Copy fixes: missing space before `<br>` (`index.astro:59`), nav "Flows"/`#flows` renamed to "Why"/`#why`, Portuguese accessible names translated to English (`:107, 114, 128`).
   - Share preview: `public/og.png` 1200×630, `og:image`, `twitter:card=summary_large_image`, canonical in `src/layouts/Layout.astro`; `site` set in `astro.config.mjs`. Also `color-scheme: dark` and Mermaid `themeVariables` with brand tokens.
6. Graphs (Q4, Q5):
   - Public artefact graph hides internal `add-framework--*` commands: filter in the `mermaid` output of `scripts/graph.js` (feeds `web/public/artefact-graph.mmd`), extending its existing test.
   - Ecosystem Map is generated, not hand-written: a new `scripts/graph.js` output writes `web/public/ecosystem.json` from the build sidecar `framwork/.codeadd/artefact-graph.json` (same filter: product artefacts only), `docs.astro` fetches it instead of the ~500-line inline literal (`:1206-1780`), command nodes labeled by default, map height `h-[60vh] lg:h-[720px]` with the node list shown below the map on mobile.
7. Docs search (Q6): Pagefind as a post-build step (`astro build && pagefind --site dist`, `pagefind` as devDependency), `Ctrl/⌘ K` trigger in the docs nav, results deep-link to section anchors. `#eco-search` gets an `aria-label` and an empty state.
8. Landing demo (Q3, P3.2): one static terminal-session block right after the hero, with a real `/add-plan` → `/add-build` excerpt, styled like the install block. Text is in the HTML; typing is a visual mask only. No video.
9. Effects (report section 3), max 1-2 animated elements per view, `transform`/`opacity` only, all off under reduced motion, content visible without JS:
   - Subtle scroll reveal of section headers and the "Why" cards (CSS `animation-timeline: view()` with `@supports`, or a small `IntersectionObserver`; hidden class added only by JS).
   - Copy "copied" micro-interaction (from decision 5).
   - Terminal typing on the demo block (decision 8).
   - Pointer-following green spotlight on the "Why" cards (CSS variables on `pointermove`; off on `hover:none`).
   - Home↔docs page transition with Astro `<ClientRouter />` (`astro:transitions`); inline scripts re-bind on `astro:page-load`.
   - No GSAP, particles, WebGL, parallax, Lottie, carousels or glitch text.
10. Structure (Q1): docs stay a single `docs.astro` page. No Starlight, no content collections now.
11. `add-framework--sync` web analyzers (`workbench/commands/add-framework--sync.md`, `web-docs-analyzer`, `web-index-analyzer`) keep working: after `CommandLine.astro` and `providers.ts`, their instructions point at the new component/data file where they used to expect inline markup. The Engineer checks and adjusts their text in this card.

## Acceptance

- Live computed style: `h1` renders Syne, `.font-mono` renders JetBrains Mono; no request to fonts.googleapis.com.
- At 390 px, home and docs `scrollWidth` = 390.
- Keyboard: every control reachable with a visible focus ring; hero copy works by keyboard with feedback; Esc closes menus and the lightbox.
- Reduced-motion emulation: no animation runs, all content visible.
- Ecosystem Map and artefact graph come from generated files and list no `add-framework--*` node; counts match the shipped inventory; `scripts/graph.js` tests green.
- Pagefind search returns sections of the docs page.
- Lighthouse (mobile and desktop) on the preview: Accessibility ≥ 95, CLS ≤ 0.1, LCP better than the pre-change run.
- `npm run build` in `web/` green.

## Out of scope

- Social proof (GitHub stars, npm downloads, testimonials): Maicon declined on 2026-10-25, a low star count hurts credibility.
- Light theme (dark only; add `color-scheme: dark`).
- Starlight or splitting docs into pages.
- Flowchart draw-in animation; noise overlay change (P3.4) only if measured as a problem.

## Risks

- Syne at `font-extrabold` is wider than Outfit; the `text-8xl` hero reflows. Check both widths after the font fix.
- `ClientRouter` makes inline scripts run once; any handler not re-bound on `astro:page-load` breaks after navigation.
- The sync analyzers edit `docs.astro`/`index.astro` text; moving markup into a component can make them miss content (decision 11).

## Open

None

## Appendix A: UX review report (copy of ux-review.md)

Copied verbatim from C:\github\xmaiconx\code-addiction-pm\.tmp\ux-review.md (headings demoted one level). Screenshots stay at C:\tmp\ux-shots\.

## UX Review — code.brabos.ai (landing + docs)

Date: 2026-10-25 · Scope: `web/` source (Astro 7, Tailwind v4 via `@tailwindcss/vite`, no UI framework) and the live pages
https://code.brabos.ai/ and https://code.brabos.ai/docs/.

**Method**
- Read `web/src/layouts/Layout.astro`, `web/src/pages/index.astro`, `web/src/pages/docs.astro` (1,834 lines),
  `web/src/styles/global.css`, `web/tailwind.config.mjs`, `web/astro.config.mjs`, `web/public/*`.
- Drove the live site with headless Chromium (Playwright 1.61, global install): screenshots at 1440×900 and 390×844,
  computed styles, overflow, keyboard tab order, reduced-motion emulation, LCP/CLS observers, network requests.
  Screenshots are in `C:\tmp\ux-shots\` (outside the repo). The metrics come from one unthrottled headless run.
  They show direction, not lab-grade numbers.
- Design guidance comes from the `ui-ux-pro-max` skill (`--design-system`, plus `typography`, `gsap`, `ux` and the `astro`
  stack searches). The skill's recommended style is **Dark Mode (OLED)**, "terminal dark + success green", for developer tools.
  That is what the site already does. Its suggested *landing pattern* ("Hero + Testimonials + CTA") does not fit:
  there are no verified testimonials, and the skill itself says to use only verified ones. I used its "Product Demo + Features"
  pattern instead (Hero > product mockup > feature breakdown > CTA).

---

### 1) Verdict — what already works

- **The direction is right for the product.** A near-black surface, one neon-green accent, mono labels and a terminal install
  snippet. That matches the skill's top match for developer tools (Dark Mode OLED, accent green, minimal glow). Don't re-theme.
- **Contrast of the main colors is good.** `#00ff88` on `#050505` is about 15:1. `#999` (`muted-light`, used for most body text)
  is about 7:1. `#e8e8e8` is far above AA.
- **Layout is stable.** Measured CLS was 0.000–0.003 on both pages at both widths.
- **Weight is low.** No framework JS ships. The home page made 7 requests (one CSS file, one SVG, fonts, the Cloudflare beacon).
- **The heavy docs parts load lazily and are pinned.** Cytoscape (about 130 KB over 4 scripts) and Mermaid (about 230 KB in chunks)
  load only via `IntersectionObserver` near their sections (`docs.astro:1758-1777`, `1787-1830`). Versions are pinned, and there is
  a visible error fallback ("Diagram unavailable (...)").
- **Docs basics are in place.** Anchored sections with `scroll-margin-top` (`docs.astro:1831`), a grouped sidebar, an off-canvas
  sidebar on mobile with a backdrop, copy buttons on plugin and agent-mode commands, and a single `h1` with a mostly clean h2/h3 order.
- **Images have alt text** (0 `<img>` without `alt` on either page). Icon-only footer links have `aria-label`.

The issues below are mostly polish and correctness. Two are real bugs that users see today:
**the brand fonts never apply** and **both pages scroll sideways on phones**.

---

### 2) Prioritized improvements

Effort: S = under 1 h, M = half a day, L = 1–2 days. "Pkg" = whether a new npm package is needed.

#### P1 — fix now (visible bugs, accessibility blockers)

| # | Problem seen | Proposed change | Files | Effort | Pkg |
|---|---|---|---|---|---|
| P1.1 | **Syne and JetBrains Mono never render.** Live computed style: `h1` uses `Outfit`, `.font-mono` uses `ui-monospace, SFMono-Regular, …`. No `.font-display` rule exists in the built CSS. Cause: Tailwind v4 reads `--font-*` theme keys, but `global.css` declares `--font-family-display/-body/-mono` (v3 naming). `web/tailwind.config.mjs` is v3 syntax and is never loaded (no `@config`). Google Fonts still downloads Syne 600 and JetBrains Mono 500 on docs, only because the hand-written `.flow-node` and `.flow-cmd` rules use them. | Rename to `--font-display`, `--font-body`, `--font-mono` inside `@theme`. Then either delete `tailwind.config.mjs` or add `@config`. Deleting is simpler, since `@theme` already holds the same tokens. Check the headings after the fix, because Syne at `font-extrabold` (800) is much wider than Outfit and the `text-8xl` hero will reflow. | `web/src/styles/global.css:5-16`, `web/tailwind.config.mjs` | S | No |
| P1.2 | **Home scrolls sideways on mobile.** At 390 px the layout viewport grows to 495 px. Cause: the hero glow `div` is `w-[600px]` (`index.astro:48`) and the hero `section` does not clip it. `body{overflow-x:hidden}` does not stop the mobile viewport from widening. Verified: adding `overflow:hidden` to the hero section brings `scrollWidth` back to 390. | Add `overflow-hidden` to the hero `<section>` (`index.astro:46`). Optionally size the glow `w-[min(600px,100vw)]`. | `web/src/pages/index.astro:46-48` | S | No |
| P1.3 | **Docs scrolls sideways on mobile (561 px wide at 390).** Text is cut off on the right (see `docs-mobile-fold.png`). There are two causes. (a) `<main class="flex-1 …">` has no `min-w-0`, so the `<pre class="mermaid">` (478 px) and the `whitespace-nowrap` codes stretch it. (b) After (a) is fixed, the `uipro init --ai <claude\|codex\|…>` span still overflows, because it lacks the `break-all` that `cmd-am-install` already has (`docs.astro:716`). | Add `min-w-0` to `<main>`. Add `break-all` (or `min-w-0 overflow-x-auto`) to the span at `docs.astro:984`. Better: give every `flex-1` command span `min-w-0 break-all` in one pass (all `id="cmd-*"` spans). | `web/src/pages/docs.astro:82`, `:984` and the other `cmd-*` spans | S | No |
| P1.4 | **Keyboard focus is invisible.** There are no `focus-visible` styles anywhere. Chromium's default ring shows as `auto 1px rgb(16,16,16)` on a `#050505` background, which you can't see. The eco search input goes further and sets `focus:outline-none` (`docs.astro:1091`). | One global rule in `global.css`: `:focus-visible{outline:2px solid #00ff88;outline-offset:2px;border-radius:4px}`. Remove `focus:outline-none` from the eco search input, or keep it and add `focus-visible:ring-2 ring-accent`. | `web/src/styles/global.css`, `web/src/pages/docs.astro:1091` | S | No |
| P1.5 | **The primary CTA (hero install copy) can't be used by keyboard and gives no feedback.** It is a `<div onclick=…>` (`index.astro:65-70`). In the live tab order it is skipped: `…Docs → GitHub → View on GitHub → ampliar`. Clicking copies silently, with no "copied" state and no `.catch` when clipboard access is denied. | Make it a `<button type="button" aria-label="Copy install command">`. Reuse the `copyCmd()` pattern from docs (`docs.astro:1014-1021`): swap the label to "copied", plus an `aria-live="polite"` region. Add a fallback text selection when `navigator.clipboard` is missing. | `web/src/pages/index.astro:65-70` | S | No |
| P1.6 | **`text-muted` (#666) fails AA for small text.** It is about 3.55:1 on `#050505`, and it is used 95 times in docs, mostly with `text-xs`/`text-[10px]`: feature "Injected into:", plugin "Used by:", copy buttons, install-tree comments, the footer. On `bg-white/[0.02]` cards it is slightly worse. | Raise the token: `--color-muted: #8a8a8a` (about 5.5:1). Nothing else changes visually in hierarchy, because `muted-light` stays `#999`. Also stop using `text-[10px]` for informative text (7× in docs). 12 px is the floor. | `web/src/styles/global.css:9` (`--color-muted`), `web/src/pages/docs.astro` (`text-[10px]` uses) | S | No |
| P1.7 | **No `prefers-reduced-motion` support.** Emulating reduce on the live site still runs `fadeUp 0.6s` on the hero, `animate-bounce` on the scroll hint, the infinite cursor blink and `scroll-behavior:smooth`. Hero text also starts at `opacity:0`, so it stays invisible if CSS animations are off or delayed. | Add `@media (prefers-reduced-motion: reduce){ .fade-up{animation:none;opacity:1} .animate-bounce,.cursor-blink::after{animation:none} html{scroll-behavior:auto} }`. Pass `animate: false` to the Cytoscape animations when the same media query matches (`docs.astro` `zoomBy`, `eco-fit`). | `web/src/styles/global.css:18-20, 55-88`, `web/src/pages/index.astro:87`, `web/src/pages/docs.astro` (eco controls) | S | No |

#### P2 — next (correctness of content, docs usability)

| # | Problem seen | Proposed change | Files | Effort | Pkg |
|---|---|---|---|---|---|
| P2.1 | **The Ecosystem Map is stale and hand-maintained.** It has a node `add` that is not a command (no `add-help`). It shows Skills 29 and Agents 17, while the shipped inventory (AGENTS.md) has 42 skills and 22 agents. Nodes are unlabeled dots at default zoom (`docs-desktop-ecosystem.png`). The data is a 500-line literal inside an inline script (`docs.astro:1225+`). | Generate the node/edge data from the build sidecar `framwork/.codeadd/artefact-graph.json` into `web/public/ecosystem.json`. `scripts/graph.js` already emits `artefact-graph.mmd` and a test guards it, so add a sibling verb and extend the same test. Then `fetch()` it as the Mermaid block does. Show labels for command nodes by default. | `web/src/pages/docs.astro:1206-1780`, `scripts/graph.js`, new `web/public/ecosystem.json` | M | No |
| P2.2 | **Internal workbench commands leak into public docs.** The Artefact graph (`web/public/artefact-graph.mmd`) has 3 `add-framework--*` nodes (backlog, sync, release). Users can't install these. Mermaid node labels are also about 7 px tall at 1440 (`docs-desktop-graph.png`), so they can't be read. | Filter `add-framework--*` out in the `mermaid` verb of `scripts/graph.js`, or decide otherwise (see Q4). Make the graph clickable to open full size, reusing the lightbox from home, or render with `flowchart LR` and a larger `fontSize` in `mermaid.initialize`. | `web/public/artefact-graph.mmd` (generated), `scripts/graph.js`, `web/src/pages/docs.astro:1811-1813` | S–M | No |
| P2.3 | **Provider facts disagree between the pages.** Home lists 7 tiles for "six providers", with Codex shown twice (`.agents/` "Codex (OpenAI)" and `.codex/` "Codex") and ZCode as `.zcode/` (`index.astro:177-206`). Docs say ZCode reads from `.agents/` and only keeps agents in `.zcode/` (`docs.astro:1052`). The docs "What gets installed" tree (`docs.astro:128-136`) has no `.zcode/` or `.codex/`. | Make one source of truth. An Astro frontmatter array (`const providers = [...]`) in a tiny `web/src/data/providers.ts`, imported by both pages, is enough. Show 6 tiles: name + the directories it writes. | `web/src/pages/index.astro:177-206`, `web/src/pages/docs.astro:128-136, 1026-1055`, new `web/src/data/providers.ts` | S | No |
| P2.4 | **Docs have no "where am I" state.** No active link in the sidebar while scrolling (no scroll-spy script exists). The sidebar order does not match the page order: "Ecosystem Map" is listed first under Deep Dive but is the last section on the page. Skills is listed before it but appears earlier. The page is about 17,000 px tall on desktop and 21,000 px on mobile. | ~25 lines of inline JS: one `IntersectionObserver` over `section[id]` that sets `aria-current="true"` plus `text-accent` on the matching sidebar link. Reorder the sidebar `<li>`s to page order (or move the section). | `web/src/pages/docs.astro:39-79`, `:1145-1175` | S | No |
| P2.5 | **Mobile nav has no state or escape.** `#mobile-menu-toggle` and `#docs-sidebar-toggle` have no `aria-expanded` or `aria-controls`. Escape does not close them. Focus does not move into the opened panel. The home lightbox is a plain `div`: no `role="dialog"`, no Esc, no focus return. | Set `aria-expanded` in the existing toggle handlers. Add one `keydown` Escape listener per page. For the lightbox, use a native `<dialog>` with `showModal()`. That gives Esc, focus trapping and the backdrop for free, with less code than today. | `web/src/pages/index.astro:11, 35-42, 104-133, 284-300`, `web/src/pages/docs.astro:11, 1145-1175` | S | No |
| P2.6 | **Copy is missing where users copy most.** The install blocks in docs (`docs.astro:117-125`), the home "Get started" block (`index.astro:218-225`) and the Quickstart command list (`docs.astro:147-195`) have no copy button. Existing copy buttons are 27×16 px, below the WCAG 2.2 24×24 target size. | Extract one `CommandLine.astro` component (`$` prompt, command text, copy button) and use it everywhere a command is shown. Give the button `min-h-6 min-w-6 px-2` and `aria-label="Copy: <cmd>"`. This also replaces about 20 near-duplicate blocks in the plugins section. | new `web/src/components/CommandLine.astro`, `web/src/pages/docs.astro` (plugins, agent-mode, install), `web/src/pages/index.astro:65-70, 218-225` | M | No |
| P2.7 | **Small copy and language slips.** On mobile the hero reads "delivery.Installed" with no space, because `<br class="hidden sm:block"/>` replaces the only separator (`index.astro:59`). The home nav "Flows" points to `#flows`, which is the "Why teams get addicted" section, not flows (`index.astro:20, 138`). Some accessible names are in Portuguese on an English page: "Ver imagem em tamanho completo", "ampliar", "Fechar" (`index.astro:107, 114, 128`). | Add a space before the `<br>`. Rename the anchor to `#why` and the label to "Why". Translate the three strings. | `web/src/pages/index.astro:20, 59, 107, 114, 128, 138` | S | No |
| P2.8 | **No share preview.** `Layout.astro` sets `og:title` and `og:description` but has no `og:image`, `twitter:card` or `canonical`. Links shared in Slack or X show no image. | Add a static 1200×630 `web/public/og.png` (the hero, exported once) plus `og:image`, `twitter:card=summary_large_image` and `<link rel="canonical" href={Astro.url}>`. Set `site` in `astro.config.mjs` so `Astro.url` is absolute. | `web/src/layouts/Layout.astro`, `web/astro.config.mjs`, new `web/public/og.png` | S | No |

#### P3 — later (nice to have)

| # | Problem seen | Proposed change | Files | Effort | Pkg |
|---|---|---|---|---|---|
| P3.1 | Fonts load through a CSS `@import` to Google Fonts. That is a chained, render-blocking request (HTML → CSS → Google CSS → woff2), and it asks for 11 weights over 3 families. | Self-host with `@fontsource-variable/outfit`, `@fontsource/syne` (600, 800 only) and `@fontsource-variable/jetbrains-mono`, imported in `global.css`. One origin, no third-party request, `font-display: swap` stays. Alternative with no package: keep Google, but move it to `<link rel="preconnect">` + `<link rel="stylesheet">` in `Layout.astro` and cut the weights to the ones used. | `web/src/styles/global.css:1`, `web/src/layouts/Layout.astro` | S | Optional: `@fontsource/*` |
| P3.2 | The landing has no product proof between the hero and the flowchart. There is no picture of what running a command looks like. The skill's "Product Demo + Features" pattern puts a product mockup right after the hero. | Add one static "terminal session" block after the hero: a real `/add-plan` → `/add-build` transcript excerpt, styled like the existing install block, with an optional typing effect (see §3). No video, no autoplay. | `web/src/pages/index.astro` (between `:90` and `:92`) | M | No |
| P3.3 | The docs are one 1,834-line page with hand-written HTML. Each content edit means touching markup, and the `add-framework--sync` analyzers have to diff HTML. | Only if the docs keep growing: move to Astro content collections (`src/content/docs/*.md`) rendered by one layout, or to Starlight (see Q1). Not needed for the fixes above. | `web/src/pages/docs.astro` | L | Optional: `@astrojs/starlight` |
| P3.4 | The noise overlay is a `position:fixed; z-index:9999` pseudo-element with an SVG turbulence filter over the whole viewport (`global.css:30-38`). At 3 % opacity it adds a composited full-screen layer for an effect that can barely be seen. | Keep it but drop `z-index` below interactive layers, or remove it. Measure scroll FPS on a low-end Android before deciding. | `web/src/styles/global.css:30-38` | S | No |

---

### 3) Visual effects and animations worth adding

Budget rule (skill `excessive-motion`): **1–2 animated elements per view**. Use `transform`/`opacity` only. Every effect is
gated by `prefers-reduced-motion: reduce`, where content renders in its final state. No effect may block input or hide content
from no-JS crawlers.

| Effect | Where | How (least effort first) | Library options | Cost |
|---|---|---|---|---|
| **Scroll reveal, subtle** — fade + 12 px rise when a section enters | Section headers and the 4 "Why" cards on home (stagger 40 ms) | CSS only: `animation-timeline: view()` with `@supports`, falling back to always visible. Or ~15 lines of `IntersectionObserver` that add a class. Start visible, add the hidden class only from JS, so no-JS and crawlers see content. | None (CSS/IO). If GSAP is already wanted: skill preset `gsap.from(el,{opacity:0,y:12,duration:.35,ease:'power1.out',scrollTrigger:{start:'top 90%'}})` | 0 KB (CSS/IO) vs about 45 KB gz (`gsap` + ScrollTrigger) |
| **Terminal typing** of the install command / demo transcript (P3.2) | Hero install box, or the new demo block | Pure CSS `steps()` width animation on a mono line, or 20 lines of JS that write characters. Show the full text at once under reduced motion. Must not delay LCP: render the text in HTML, animate only a mask over it. | None. `typed.js` if you want backspacing (about 4 KB) | ~0 KB |
| **Copy feedback micro-interaction** | Every copy button (P1.5/P2.6) | Swap the icon to a check plus "copied" for 1.5 s, with a 150 ms opacity crossfade. Announce through `aria-live`. | None | 0 KB |
| **Cursor-tracking spotlight on cards** — a soft green radial glow following the pointer inside each "Why" card | Home "Why" grid | A CSS variable set on `pointermove` (`--x`, `--y`) plus `background: radial-gradient(...)`. Pointer-only, no layout change. Off under reduced motion and on `hover:none` devices. | None | 0 KB |
| **Page transition home ↔ docs** | Nav logo and header | Astro `<ClientRouter />` from `astro:transitions` in `Layout.astro`, with `transition:name="header"` on the nav (skill `astro` stack guideline; `<ViewTransitions />` is removed in current Astro). Astro respects reduced motion by default. Watch the inline scripts: they run once, so re-bind on `astro:page-load`. | Built into Astro | ~3 KB |
| **Flowchart "draw-in"** | `flowchart.svg` on home | Skip for now. It needs the SVG inlined with stroke-dash animation per path. Too much effort for the gain, and the SVG is generated by `add-framework--sync`. | — | — |

Not recommended: particles or WebGL backgrounds, parallax, Lottie, auto-rotating carousels, glitch effects on text. They cost
bundle and attention, and none of them explains the product.

---

### 4) Docs-specific improvements

**Navigation**
- Scroll-spy with `aria-current` and sidebar order matching page order (P2.4).
- On ≥1280 px the content is `max-w-4xl`, left-aligned, and leaves about 340 px empty on the right (see `docs-desktop-plugins.png`).
  An "On this page" list of the current section's h3s fits there. Skip it unless the page stays one long file. Scroll-spy gives
  most of the value.
- The top nav repeats 3 of the sidebar links (Commands, Graph, Flows). On docs, replace them with a search trigger (below) and keep
  only Home + GitHub.
- "Back to Home" exists only in the mobile sidebar. That is fine, because the logo links home.

**Search**
- Today the only search is the Ecosystem Map's node filter (`#eco-search`, no label).
- Least effort: **Pagefind** (`pagefind` npm package, run as a post-build step: `astro build && npx pagefind --site dist`). It indexes
  the static HTML, ships about 10 KB of JS on first use and needs no server. A `Ctrl/⌘ K` button opens its default UI. Because docs
  is one page, also tag sections with `data-pagefind-body` and headings with ids so results deep-link to anchors.
- No-package alternative: a client-side filter over the sidebar links plus the h2/h3 text, about 40 lines. Fine at today's size.
- Give `#eco-search` a visible or `aria-label` label, and an empty state ("No nodes match 'x' — try a command name like add-plan").

**Readability**
- Long single-paragraph descriptions inside the Commands list (`/add-review` is about 90 words in `text-xs` `#666`, `docs.astro:297`).
  Cut each to one line and link to more detail, or raise to `text-sm` + `muted-light`.
- The Skills grid (`docs.astro:597-648`) mixes `add--` prefixed names with unprefixed ones (`backend-development` vs `add--tdd`),
  and `whitespace-nowrap` names squeeze descriptions on mobile. Use the real installed names (all `add--*`), and let names wrap
  (`break-all`) on small screens.
- Body measure is fine (`max-w-4xl` at 16–18 px). Keep body text at `text-sm` minimum. Don't use `text-xs` for paragraphs.

**Code blocks and copy buttons**
- One `CommandLine.astro` component for every runnable command, with a copy button that is ≥24×24, labelled, keyboard-reachable,
  with "copied" feedback and a clipboard-denied fallback (P2.6).
- Mark prompts and comments `select-none` (already done) so a manual select copies only the command.
- Syntax highlighting is not needed: the blocks are one-line shell commands. If multi-line config blocks appear later, Astro's
  built-in Shiki (`<Code />` from `astro:components`) has no extra package and zero client JS.

**Dark mode**
- The site is dark-only, and the skill rates "Dark Mode (OLED)" as light-mode-not-recommended for this category. No toggle is needed.
- `<meta name="theme-color" content="#050505">` is set. Add `<meta name="color-scheme" content="dark">` (and `color-scheme: dark`
  on `:root`). Then native form controls and scrollbars follow the dark theme. Today `::-webkit-scrollbar` styling covers only
  Chromium/Safari, and `color-scheme` fixes Firefox too.
- The Mermaid theme is `dark`. Its default node fill is grey on the `#050505` panel. Pass `themeVariables` using the brand tokens
  (`primaryColor:'#0a0a0f', primaryBorderColor:'#00ff88', lineColor:'#555', fontSize:'14px'`) so the graph matches the page.

---

### 5) Accessibility and performance issues found

**Accessibility**

| Issue | Evidence | Fix ref |
|---|---|---|
| Focus ring invisible | Live: default `outline: auto 1px rgb(16,16,16)` on `#050505`. No `:focus-visible` rule in CSS. `focus:outline-none` on `#eco-search` | P1.4 |
| Primary CTA not keyboard-operable | `div onclick` at `index.astro:65`. Skipped in the live tab order | P1.5 |
| Low-contrast small text | `#666` ≈ 3.55:1 for `text-xs`/`text-[10px]` (95 uses in docs). `text-muted-light/70` at 10 px for the eco hint (`docs.astro:1110-1112`) | P1.6 |
| No reduced-motion handling | Live emulation: `fadeUp 0.6s` still runs. Bounce, blink and smooth scroll are unconditional | P1.7 |
| Horizontal scroll on mobile | Live: home 495 px, docs 561 px layout width at a 390 px viewport. That breaks WCAG 1.4.10 Reflow | P1.2, P1.3 |
| Disclosure state missing | Menu/sidebar toggles have no `aria-expanded`/`aria-controls`. No Esc | P2.5 |
| Lightbox not a dialog | No `role="dialog"`, no Esc, no focus trap or return (`index.astro:120-133`) | P2.5 |
| Mixed-language accessible names | "Ver imagem em tamanho completo", "ampliar", "Fechar" on a `lang="en"` page | P2.7 |
| Unlabeled input | `#eco-search` has only a placeholder | §4 Search |
| Small targets | Copy buttons are 27×16 px. Eco controls are 28×28 (OK). Live count of interactive elements under 24 px on one axis: 47 on docs desktop, 7 on home. Most are inline text links (exempt) | P2.6 |
| Graph is visual-only | The Cytoscape map has a keyboardable list sidebar on `lg` only (`#eco-sidebar` is `hidden lg:flex`). Below 1024 px, the map is drag-only and 720 px tall in a 844 px viewport | Make `#eco-cy` `h-[60vh] lg:h-[720px]` and show the list below the map on mobile |
| Color-only legend | Commands/skills/agents told apart by dot color only | Fine with the list sidebar. On mobile, add the type label in the inspect panel (already there) |
| Headings | One `h1` per page. Sequence h1→h2→h3 with no skips (live). The Commands group labels are `h3` styled as `text-xs` caps, which is acceptable | — |
| Alt text | All `<img>` have alt. The flowchart alt "Code Addiction Development Trail Flowchart" names it but doesn't describe it. Add a one-sentence summary of the trails, or `aria-describedby` to the paragraph above | small |

**Performance** (single headless run, no throttling, from Brazil to Cloudflare. Use the numbers as direction)

| Metric | Home 1440 | Home 390 | Docs 1440 | Docs 390 |
|---|---|---|---|---|
| LCP | 4.0 s (element: `flowchart.svg`) | 0.54 s (h1) | 3.8 s (install `<div>`) | 2.9 s |
| CLS | 0.003 | 0.000 | 0.002 | 0.000 |
| Requests at load | 7 | — | 8 | — |

- **LCP on desktop is high for a static page.** Two likely causes. (1) The hero text starts at `opacity:0` and fades in over
  0.6 s + 0.1–0.5 s delays (`global.css:67-74`), so Chrome picks a later element. (2) The fonts come from a chained, render-blocking
  `@import` (`global.css:1`). Fix: do not animate the `h1` from `opacity:0` (animate only `transform`, or start at `opacity:.01`
  after first paint). Plus P3.1 (preconnect or self-host). Re-measure with Lighthouse/PageSpeed after, because the headless numbers are noisy.
- **CLS risk after P1.1.** Once Syne actually loads, swapping Outfit → Syne on an `8xl` heading will shift layout. Use
  `font-display: optional` for Syne, or a `size-adjust` fallback `@font-face`, and re-check CLS.
- **Third-party JS on docs:** Cytoscape + 3 layout plugins (about 130 KB transferred) from two CDNs (cdnjs + jsdelivr), and Mermaid
  (about 230 KB in about 25 chunks) from jsdelivr. Both lazy, both pinned. Fine for now. If you want one origin and SRI: install
  `cytoscape`, `cytoscape-cose-bilkent` and `mermaid` as npm deps and dynamic-`import()` them from an Astro `<script>`. Vite then
  hashes and bundles them. No bundle size change, but no CDN dependency.
- **Bundle size:** no framework JS. The inline scripts on docs are about 600 lines, most of it the hard-coded ecosystem data.
  Moving it to `ecosystem.json` (P2.1) takes it off the HTML critical path.
- `flowchart.svg` (9.8 KB) has no `width`/`height`. CLS is fine today because it's below the fold. Add the intrinsic size anyway
  (`width="..." height="..."`) to be safe.

---

### 6) Open questions — need a product decision

| # | Question | Recommendation |
|---|---|---|
| Q1 | **Keep the hand-written single-page docs, or move to Starlight / content collections?** | **Keep it for now.** Do the P1/P2 fixes (about 1–2 days in total). Move to content collections only when docs pass about 2,500 lines or need versioning. Starlight would bring search, sidebar, scroll-spy and a11y for free, but it would mean re-skinning its theme to this brand and rewriting the `add-framework--sync` web-docs analyzer, which edits `docs.astro` directly. |
| Q2 | **Brand fonts: fix Syne + JetBrains Mono (as designed) or accept Outfit everywhere (as shipped)?** | **Fix them (P1.1).** Syne for display and JetBrains Mono for code is a distinctive, on-category pairing. The skill's "Terminal CLI Monospace" pairing confirms JetBrains Mono for developer tools. The current look is an accident of a v3→v4 token rename. Use Syne for `h1`/`h2` only, to limit the CLS risk. |
| Q3 | **Add a product demo (terminal transcript or short video) to the landing?** | **Yes, a static transcript block (P3.2)**, not video. It is cheap, can be read with JS off, and it shows the one thing the page doesn't: what a run looks like. Video means autoplay rules, captions and hosting. |
| Q4 | **Should the public Artefact graph show internal `add-framework--*` commands?** | **No.** Filter them in `scripts/graph.js mermaid` (P2.2). They don't ship to users, and AGENTS.md says the workbench "reaches no user". Showing them invites "how do I run add-framework--release?" questions. |
| Q5 | **Is the Ecosystem Map worth maintaining?** It is stale today (P2.1). | **Keep it only if it is generated from the sidecar.** If generation is out of scope, remove the section and keep the generated Mermaid graph plus the Skills list. A wrong map is worse than no map. |
| Q6 | **Add site search?** | **Yes, Pagefind, after the ecosystem decision.** It is a post-build step with no server and about 10 KB lazy, and it scales if docs split into pages later. Until then, a 40-line sidebar filter is acceptable. |
| Q7 | **Light theme?** | **No.** The audience works in dark terminals. The skill marks light mode not recommended for this style. Add `color-scheme: dark` instead. |
| Q8 | **Social proof (stars, npm downloads, testimonials)?** | **Live GitHub stars + npm weekly downloads as small badges** under the hero CTAs, fetched at build time (no client JS). No testimonials until real, attributable ones exist. The skill's testimonial pattern requires verified quotes. |

---

#### Suggested order of work
1. P1.1–P1.7 in one PR. All are S, there is no new package, and they are mostly CSS plus small markup changes.
2. P2.3, P2.4, P2.5, P2.7, P2.8, the remaining S items.
3. P2.6 `CommandLine.astro`, then P2.1/P2.2 (graph generation).
4. Q-decisions, then P3 items and the §3 effects (scroll reveal and copy feedback first).
