# Update: the public site renders its fonts, fits a phone, serves keyboard and motion users, and draws generated graphs

## Outcome

The landing page and the docs page (`web/`) now render Syne and JetBrains Mono (self-hosted), no longer scroll sideways at 390 px, have a visible focus ring on every control, honour reduced motion, and show the Ecosystem Map and the artefact graph from files generated out of the build sidecar, with no internal `add-framework--*` node. The docs page has search (Pagefind, `Ctrl+K`), the home page has a terminal session block and light reveal effects, and moving between the two pages uses a client-side transition. Ticket 0068B. Site only: no version bump, nothing shipped to installed projects.

## Changes

- **Fonts (F1).** Tailwind v4 reads `--font-*`; the `@theme` block used the v3 `--font-family-*` names, so Syne and JetBrains Mono never applied. Keys renamed, `tailwind.config.mjs` removed, the Google Fonts import replaced by `@fontsource` packages. Syne is loaded as Latin 600 and 800 with `font-display: optional` and a preload, so the Outfit-to-Syne swap cannot shift layout.
- **Copy command (F2).** One `CommandLine` component for every runnable command: prompt, literal command text, a 24 px copy button with an accessible name, a polite live region and a select fallback. Replaces the clickable hero `div` and 17 `cmd-*`/`copyCmd` pairs.
- **Phone and keyboard (F3, F4).** The hero clips its glow and the docs `main` can shrink, so both pages measure 390 px wide at 390 px. One global `:focus-visible` ring.
- **Contrast and motion (F5, F6).** Muted text reaches 4.5:1 and the 10 px text is gone. A `prefers-reduced-motion` block turns off fade-up, bounce, cursor blink and smooth scroll; the map zooms without animation; hero text never starts at `opacity: 0`.
- **Content (F7, F8).** Copy slips fixed, the "Flows" nav entry that pointed at the "Why" section is now "Why". The six providers come from `web/src/data/providers.ts` and render the home tiles, the docs install tree and the docs table; a test holds the file to `framwork/provider-map.json`.
- **Menus, where-am-I, share preview (F9 to F11).** `aria-controls`/`aria-expanded` and Escape on both menus, the lightbox is a native `<dialog>`, the docs sidebar follows page order and marks the section in view. `og:image` (1200x630), `twitter:card`, canonical link, `color-scheme: dark` and brand Mermaid colours.
- **Generated graphs (F12 to F16).** `toMermaid` gains a `layers` filter and `DOCS_PROFILE` keeps product nodes only. New CLI-only verb `node scripts/graph.js ecosystem [--write]` writes `web/public/ecosystem.json` (15 commands, 42 skills, 22 agents, equal to `scripts/inventory.js`); the docs map fetches it instead of a hand-written literal. `add-artefact-graph` and `AGENTS.md` say so.
- **Search, demo, effects, transition (F17 to F20).** Pagefind indexes the built docs page and results deep-link to section anchors. A static `/add-plan` to `/add-build` session block with a transform-only typing mask. Reveal on the section headings and the Why grid, a pointer spotlight on hover devices. `ClientRouter` between the two pages with every script bound on `astro:page-load`.
- **Sync keeps working (F21 to F23).** `/add-framework--sync` STEP 2.1 regenerates both site graphs; `web-docs-analyzer` and `web-index-analyzer` know that providers live in `providers.ts`, commands are `CommandLine` props, and the two graphs are generated.
- **Tests.** New `scripts/tests/web-site.test.cjs` (static source cases for the site), new `cli/tests/graph-ecosystem.test.js`, extended `cli/tests/graph-mermaid.test.js`. Every bug fix has its failing test committed before the fix.

## Action for installed projects

None. This delivery changes the public website and this repository's internal tooling only.
