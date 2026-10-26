# Plan: site-i18n — serve the site and docs in English and Brazilian Portuguese, with a language toggle

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-25
> **Delivery:** confirm
> **Ticket:** 0069B

---

## Objective

[from conversation, no design document]
The public site (landing and the single docs page under `web/`) is served in English at `/` and `/docs/`
exactly as today and in full Brazilian Portuguese at `/pt-br/` and `/pt-br/docs/`, with an `EN | PT-BR`
toggle that keeps the current section, correct `lang`, `hreflang` and canonical on all four URLs, and text
held in two typed strings modules the doc-sync command keeps in step.

**When this build is done:** Astro's built-in i18n routes both locales from the same two page files; every
visible and accessible string of both pages, the layout and `CommandLine` comes from `web/src/i18n/en.ts` or
`web/src/i18n/pt-br.ts`; a key missing from `pt-br.ts`, or a PT value left equal to its EN value outside a
declared list, fails `npm --prefix web run build`; `/add-framework--sync` and its two web analyzers target
the strings modules and propose edits to both languages in one run; and every test that read copy out of
`docs.astro` still finds it.

**Ticket done when:** / and /docs/ are unchanged in English. /pt-br/ and /pt-br/docs/ are fully in Portuguese, except for artefact names, commands and paths. The toggle keeps the current anchor. hreflang, canonical and lang are correct on all four URLs. A missing pt-br key fails the web build. add-framework--sync proposes edits to both language files.

## Context

Virtually all of Maicon's users are Brazilian, and the site is English only (`web/src/layouts/Layout.astro`
carries `<html lang="en">`). `site-ux-polish` (0068B) is merged on `main`: it added
`web/src/components/CommandLine.astro`, `web/src/data/providers.ts`, Pagefind search, the generated graphs
and `scripts/tests/web-site.test.cjs`. This plan builds on those and does not redo them.

**Every decision here was taken and reviewed in the document below. This plan does not re-derive them — it
points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-25T101600-site-i18n-intent.md` | Path `bounded`, the 9 Decided items (routing, toggle, SEO, strings modules, page pattern, what is not translated, Pagefind, doc sync), Acceptance, Out of scope, Risks, `## Open: None` |

## Global Constraints

- `npm --prefix web run build` exits 0 at the end of every phase (invocation; intent Acceptance "`npm run build` green")
- No deploy, rollout, publish, release or production-branch task; no version bump; no CHANGELOG release section (invocation)
- Ticket labels stay `internal` — site, not shipped framework (invocation; ticket 0069B `labels`)
- "`defaultLocale: 'en'`, `locales: ['en', 'pt-br']`, `prefixDefaultLocale: false`" — no new package for routing (intent Decided 2)
- "no automatic redirect from browser language or stored choice on page load" (intent Decided 3)
- "Not translated: command, skill, agent, plugin and feature names, CLI commands and file paths" — Ecosystem Map node descriptions and the Mermaid graph stay English (intent Decided 7)
- "English is the primary text (default locale); the PT-BR entry is written as natural Brazilian Portuguese, not a literal translation" (intent Decided 9)
- "docs stay a single `docs.astro` page. No Starlight, no content collections now." (site-ux-polish intent Decided 10, still in force)
- Every bug fix is red-green: a failing test first, then the fix; every new assertion in this plan is written RED before the F-block it covers (invocation)
- Every edit to an existing file is anchored by quoted text, never by a line number (invocation)
- Tests run through `node scripts/run-tests.js` only (AGENTS.md, `scripts/run-tests.js` header)
- Examples written into artefacts stay stack-agnostic (invocation)

## Problem

1. **The site speaks one language its main audience does not prefer** — every string of `index.astro`, `docs.astro`, `Layout.astro` and `CommandLine.astro` is hard-coded English, and there is no Portuguese route.
2. **There is no place for a second language to live** — text is interleaved with markup across ~2,100 lines, so a translation today means duplicating both pages, which then drift.
3. **Doc sync only knows the page files** — `/add-framework--sync` and its two web analyzers read and edit copy in `docs.astro` and `index.astro`; once copy moves, they would edit nothing or edit the wrong file, and they have no rule for keeping two languages in step.

## Proposal

Four phases on one branch, each leaving the site building green.

**Phase A — the frame.** Turn on Astro i18n, create the two strings modules and the `t()` helper with
build-time guards, make the layout locale-aware (lang, hreflang, canonical, og:locale), add the `pt-br`
routes as thin wrappers over the existing page files, and add the toggle. The `pt-br` pages exist from here
on, still showing English body text — the guard's "PT equals EN" list is empty only once Phase C ends (see
F2 for how the guard is staged).

**Phase B — the landing.** Move every string of `index.astro` and `CommandLine.astro` into the modules,
both languages at once.

**Phase C — the docs.** Move every string of `docs.astro`, section by section, in three F-blocks, including
the client-side strings its inline scripts print. The cli tests that read docs copy are first made to read
`docs.astro` and `en.ts` together, so each move stays green.

**Phase D — doc sync and the map.** Point `/add-framework--sync`, both analyzers, their registry
descriptions and `AGENTS.md` at the strings modules, with the rule that every content edit lands in both
languages in one report.

Decisions this plan takes inside the room the intent left (each argued in Validated Decisions):

- **Page pattern:** `src/pages/index.astro` and `src/pages/docs.astro` stay the full page bodies; new
  `src/pages/pt-br/index.astro` and `src/pages/pt-br/docs.astro` are wrappers that import and render them.
  Existing paths, tests and the sync targets for markup do not move.
- **Strings may carry inline markup.** A value may hold `<code>`, `<a>`, `<strong>`, `<em>` and `<br>` and
  is rendered with `set:html`. A sentence is translated whole, never split around its `<code>` fragments.
- **The missing-key guard runs at build, not in a type checker.** `astro build` does not type-check, so
  "typed against the EN keys" alone would not fail the build. `web/src/i18n/index.ts` walks the EN tree at
  module load and throws when `pt-br` lacks a leaf, has an extra one, or holds an empty value; `t()` throws
  on an unknown key. `pt-br.ts` is also typed `Strings` (derived from `en`) for editor feedback.
- **An untranslated-text guard runs at the same point:** a PT value equal to its EN value throws unless its
  key is listed in `SAME_IN_BOTH` in `index.ts` (brand words, artefact names, "Docs", "GitHub" and similar).
  This is what turns "no English sentence left" from a manual read into a build failure.

## Scope

### Includes

#### Phase A — the frame

- **F1** [internal] — `web/astro.config.mjs`: add
  `i18n: { defaultLocale: "en", locales: ["en", "pt-br"], routing: { prefixDefaultLocale: false } }` —
  `prefixDefaultLocale` sits under `routing`, never flattened. Keep `site` and the Vite plugin untouched.
  Anchor: the `site: "https://code.brabos.ai",` line. **URLs end in `/`:** the build output stays
  `build.format: "directory"`, and every canonical, hreflang and toggle URL is written with a trailing
  slash (`/`, `/docs/`, `/pt-br/`, `/pt-br/docs/`) — `localeHref` appends it when `getRelativeLocaleUrl`
  omits it.

- **F2** [internal] — new `web/src/i18n/en.ts`, `web/src/i18n/pt-br.ts`, `web/src/i18n/index.ts`.
  - `en.ts` exports the EN tree (top-level sections `common`, `layout`, `home`, `docs`) and the type
    `Strings` derived from it; `pt-br.ts` exports a `Strings`-typed PT tree with the same leaves.
  - `index.ts` exports `useT(locale)` returning `t(key)`, a dotted-path lookup that returns the leaf
    (a string, or an array of `{ name, desc }` entries for the docs lists) and throws on an unknown key;
    `localeHref(locale, path)` built on `astro:i18n`'s `getRelativeLocaleUrl`; `alternateUrls(url)`
    returning the absolute EN and PT URLs of the page at `url` (used by the layout's hreflang links and by
    the toggle, each calling it itself); and runs the parity guard and the `SAME_IN_BOTH` guard at module load.
  - **Guard rules.** Leaves are compared by full dotted path, array indexes included (`docs.skills.items.3.desc`).
    Parity: every EN leaf exists in PT and vice versa, no PT leaf is empty, every array has the same length
    in both, and each `name` field equals its EN counterpart (names are not translated, Decided 7).
    Same-value check: `name` fields of `{ name, desc }` entries are exempt; any other PT leaf equal to its
    EN leaf throws unless `SAME_IN_BOTH` lists its path. A `SAME_IN_BOTH` entry is an exact dotted path, with
    `*` allowed for one index segment. The thrown error names the path.
  - **Staging:** while Phases B and C are in flight the untranslated guard reads an `UNMIGRATED` list of
    top-level sections it skips; F2 lands with `home` and `docs` in it, F6 removes `home`, F9 removes
    `docs` and then deletes the list. The parity guard (missing / extra / empty key) is never staged.
  - In F2 the trees hold only `common` (toggle labels, skip text) and `layout` (title suffix, default
    description, og locale) keys, both languages filled.
  - Must not lose: the default description text now in `Layout.astro` — it moves verbatim to `en.ts`.
  - **Produces:** `useT`, `localeHref`, `alternateUrls`, `SAME_IN_BOTH`, `UNMIGRATED` (in `web/src/i18n/index.ts`)

- **F3** [internal] — `web/src/layouts/Layout.astro`: read `Astro.currentLocale`; set
  `<html lang>` to `en` or `pt-BR`; keep `<link rel="canonical">` on the page's own URL; add
  `<link rel="alternate" hreflang="en">`, `hreflang="pt-BR"` and `hreflang="x-default"` (= the EN URL) for
  the current page; set `og:locale` (`en_US` / `pt_BR`) and `og:locale:alternate`; take the default
  description from `t('layout.description')`. Anchors: `<html lang="en">`, `<link rel="canonical" href={canonical} />`,
  the `description = "A spec-driven framework` default. Must not lose any meta tag `site-ux-polish` F11
  added (og:image, twitter card, color-scheme) or the `ClientRouter`.
  - **Consumes:** `useT`, `alternateUrls` (F2)

- **F4** [internal] — new `web/src/components/LanguageToggle.astro`, new `web/src/pages/pt-br/index.astro`
  and `web/src/pages/pt-br/docs.astro`; `index.astro` and `docs.astro` render the toggle in the top nav and
  in the mobile menu (home) / sidebar header (docs).
  - The toggle is two links, `EN` and `PT-BR`, the current one marked `aria-current="true"` and not a link
    target of itself; each `href` is the other locale's URL of the same page (works with no JS). A small
    script appends `location.hash` to the target on click and writes the choice to `localStorage`
    (`codeadd-locale`); it never redirects on load. Bound on `astro:page-load`, released before swap, like
    every inline script since `site-ux-polish` F20.
  - The two wrappers render the shared page file and nothing else. **If Astro refuses to render a page
    file as a component**, the build moves the two bodies to `web/src/views/HomePage.astro` and
    `DocsPage.astro` and makes all four route files wrappers — record the switch as a ledger ruling and
    repoint the `HOME()`/`DOCS()` helpers of `web-site.test.cjs`; nothing else in the plan changes.
  - Internal links that point at the other page (`href="/docs"` on home, the home link on docs) go through
    `localeHref`, so a PT reader stays in PT.
  - Anchors: home — `<a href="/docs" class="text-sm text-muted-light` (desktop nav) and
    `<a href="/docs" class="mobile-link` (mobile menu), the toggle placed before the desktop `GitHub` link
    and inside `<div class="flex flex-col px-6 py-4 space-y-4">`; docs — the `<nav` carrying
    `fixed top-0`, beside `id="docs-search-open"`, and the top of `<aside id="docs-sidebar"`.
  - **Consumes:** `useT`, `localeHref`, `alternateUrls` (F2)
  - **Produces:** `LanguageToggle.astro`

#### Phase B — the landing

- **F5** [internal] — `web/src/components/CommandLine.astro`: the button text (`Copy`), its accessible
  name prefix (`Copy: `), and the script's `Copied`, `Copied to clipboard`, `Select`,
  `Selected. Press Ctrl+C to copy` come from `t()`. The script reads them from `data-*` attributes rendered
  on the component, since the client script cannot import the module. The `command` prop stays literal and
  untranslated (Decided 7). Must not lose: the once-per-window binding guard. Anchors: `>Copy</button>`,
  ``aria-label={`Copy: ${command}`}``, `btn.textContent = "Copied";`, `status.textContent = "Selected. Press Ctrl+C to copy";`.
  The script reads the strings from the clicked component's own attributes, so after a `ClientRouter`
  swap to the other locale it prints the new language.
  - **Consumes:** `useT` (F2)

- **F6** [internal] — `web/src/pages/index.astro` + `en.ts`/`pt-br.ts` `home` section: every visible string,
  accessible name (`aria-label`, `alt`, `sr-only`), and the `<Layout title>` move to `home.*` keys; the PT
  text is written in the same commit. Stays literal: artefact names, the session demo's command lines and
  CLI output lines that name commands, provider names from `providers.ts`. Remove `home` from `UNMIGRATED`.
  Retarget the `web-site.test.cjs` assertions that read home copy (F7 hero `delivery. <br …/>`, the Portuguese
  accessible-name check, F18 session) to read `index.astro` plus `en.ts`, keeping what each pins. The
  "no Portuguese accessible names" check (`for (const s of ['Ver imagem', 'ampliar', 'Fechar'])`) keeps
  reading `index.astro` and `en.ts` only — Portuguese is now correct in `pt-br.ts`. Anchors: the hero
  `Structured workflows from discovery to delivery.` paragraph, `<Layout title="Code Addiction — Spec-driven AI development framework">`,
  and each section's `<!-- … -->` comment heading.
  - **Consumes:** `useT` (F2); `UNMIGRATED` (F2)

#### Phase C — the docs

- **F7** [product] — `cli/tests/add-setup.test.js`, `brainstorm-greenfield.test.js`,
  `graph-mermaid.test.js`, `loop-consolidation-0070.test.js`, `ux-design-core.test.js`: each read of
  `web/src/pages/docs.astro` for COPY becomes a read of the docs copy = `docs.astro` followed by
  `web/src/i18n/en.ts` (read when present). Anchors: `const docs = read(path.join(root, 'web/src/pages/docs.astro'));`
  (add-setup), `const DOCS_ASTRO = read(path.join(ROOT, 'web', 'src', 'pages', 'docs.astro'));`
  (brainstorm-greenfield), `const prose = fs.readFileSync(path.join(ROOT, 'web', 'src', 'pages', 'docs.astro'), 'utf8');`
  (graph-mermaid), `expect(read(path.join(ROOT, 'web', 'src', 'pages', 'docs.astro'))).toMatch(/tdd-pipeline/);`
  (loop-consolidation), `const docs = read('web', 'src', 'pages', 'docs.astro');` (ux-design-core).
  - `graph-mermaid`: the window becomes the page slice from `id="graph"` (as today) plus the `en.ts` slice
    from the `graph:` key to the next sibling key of `docs`. Before the `.not.toMatch` checks it asserts
    the combined window is non-empty and contains the section intro (`Artefact graph` in the page, or the
    `graph:` key in `en.ts`), so a mis-cut window fails instead of passing on nothing.
  - `add-setup`: the assertion accepts the literal `<code…>/add-setup</code>` form OR a
    `{ name: "/add-setup"` entry in `en.ts` — it keeps pinning "the docs list `/add-setup`".
  - `ux-design-core` keeps matching `{ name: "ux-design", desc: "…" }` — F9 keeps that entry shape in `en.ts`.
  - Green before and after Phase C; that is its purpose. Tagged `[product]` because the files live in
    `cli/tests/`, as in `site-ux-polish`.
  - **Produces:** the docs-copy read (docs.astro + en.ts) in the five cli tests

- **F8** [internal] — `web/src/pages/docs.astro` + `docs` section of both modules, sections `about`,
  `install`, `quickstart`, `setup`, `commands`, plus the nav, sidebar labels and the `<Layout title>`.
  **Commands grid:** the hand-written group cards (anchor `<!-- Commands Map -->`, groups headed
  `<h3 …>Discovery</h3>`, `Planning`, …) become `docs.commands.groups: [{ title, items: [{ name, desc }] }]`
  in both modules, rendered by one loop in the page, the way the skills list already is. The command name
  then lives only in the modules (equal in both, enforced by F2's `name` rule), and adding a command is an
  `en.ts` + `pt-br.ts` pair with no page edit. A `desc` holding inline markup (e.g. `→ <code>about.md</code>`)
  is rendered with `set:html`. `CommandLine` props stay literal. Anchors for the sections: each
  `<section id="about"`, `id="install"`, `id="quickstart"`, `id="setup"`, `id="commands"` opening tag, and
  `<Layout title="Docs — Code Addiction">`.
  - **Consumes:** `useT` (F2); the docs-copy read (docs.astro + en.ts) in the five cli tests (F7)

- **F9** [internal] — `web/src/pages/docs.astro` + both modules, sections `graph`, `flows`, `scenarios`,
  `skills`, `features`, `agent-mode`. Skills list moves to `docs.skills.items` as `{ name: "<skill>", desc: "…" }`
  entries in that exact textual shape (the `ux-design-core` test reads it); anchor `{ name: "backend-development", desc:`.
  The Mermaid graph itself and its node labels stay English (Decided 7); only the text around it is
  translated. Anchors: each `<section id="graph"`, `id="flows"`, `id="scenarios"`, `id="skills"`,
  `id="features"`, `id="agent-mode"` opening tag.
  - **Consumes:** `useT` (F2); the docs-copy read (docs.astro + en.ts) in the five cli tests (F7)

- **F10** [internal] — `web/src/pages/docs.astro` + both modules, sections `plugins`, `providers`,
  `structure`, `ecosystem`, the search dialog, and every string the inline scripts print or set (search
  fallback, `Loading diagram…`, map controls' `title`s, `Filter nodes...`, the empty state, panel labels,
  group headers). Client strings reach the inline scripts through `data-*` attributes or one
  `<script type="application/json" id="docs-i18n">` block rendered from `t()`. Node ids and node
  descriptions from `ecosystem.json` stay English. The client strings are re-read on every
  `astro:page-load`, so a `ClientRouter` swap between `/docs/` and `/pt-br/docs/` shows the new language in
  the map, the search dialog and the fallback; the Pagefind UI is re-created on swap so it loads the
  index of the new `lang`. Anchors: each `<section id="plugins"`, `id="providers"`, `id="structure"`,
  `id="ecosystem"` opening tag, `<dialog id="docs-search"`, `<p id="docs-search-fallback"`,
  `<input id="eco-search"`, `<p id="eco-empty"`, `Loading diagram&hellip;`. Then remove `docs` from
  `UNMIGRATED` and delete the `UNMIGRATED` list. Retarget the `web-site.test.cjs` assertions that read docs copy (F8 caveat text,
  Lighthouse search label) to read `docs.astro` plus `en.ts`, keeping what each pins.
  - **Consumes:** `useT` (F2); `UNMIGRATED` (F2); the docs-copy read (docs.astro + en.ts) in the five cli tests (F7)

#### Phase D — doc sync and the map

- **F11** [internal] — `workbench/agents/web-docs-analyzer.md`: it reads `docs.astro` for structure and
  literal command props, and `web/src/i18n/en.ts` + `pt-br.ts` for copy; it owns the `docs.*` keys of both
  modules and nothing else in them. Every copy edit is reported as a pair — one report object targeting
  `en.ts`, one targeting `pt-br.ts` — with the PT `new` written as natural Brazilian Portuguese. A new,
  removed or renamed command or skill is an edit to `docs.commands.groups` / `docs.skills.items` in both
  modules, never to `docs.astro`. A `CommandLine` prop edit still targets `docs.astro`. Its schema example and its DO-NOT list name the three targets.
  Anchors: `2. Read \`web/src/pages/docs.astro\``, the `"target": "web/src/pages/docs.astro",` example, the
  `docs.astro Section` table header. Update its frontmatter `description`.
  - **Produces:** the analyzer report contract "one copy edit = an `en.ts` object and a `pt-br.ts` object"

- **F12** [internal] — `workbench/agents/web-index-analyzer.md`: same rule for the `home.*`, `common.*` and
  `layout.*` keys; keeps sole ownership of `web/src/data/providers.ts`. Its "One target or two" paragraph
  becomes "one to four targets" (`index.astro`, `providers.ts`, `en.ts`, `pt-br.ts`). Anchors: the
  `**One target or two.**` paragraph, `2. Read \`web/src/pages/index.astro\``. Update its frontmatter
  `description`.
  - **Consumes:** the analyzer report contract "one copy edit = an `en.ts` object and a `pt-br.ts` object" (F11)

- **F13** [internal] — `workbench/commands/add-framework--sync.md`: the two dispatch prompts name the
  strings modules; the edit-prohibition lists (the `⛔ DO NOT USE: Edit on README.md, docs.astro, …` and
  `Write on` lines and the NEVER rule) add `web/src/i18n/en.ts` and `pt-br.ts`; the report-array note names
  the new targets; 5.2 rejects a report whose `en.ts` copy edits and `pt-br.ts` copy edits do not pair up
  (stop and report it, never apply half); the summary lists both modules. Then
  `workbench/provider-map.json`: the two analyzer `description` values match F11/F12. Run
  `node scripts/build-workbench.js`.
  - **Consumes:** the analyzer report contract "one copy edit = an `en.ts` object and a `pt-br.ts` object" (F11)

- **F14** [internal] — `AGENTS.md` → `## Web / Documentation` table: add one row for
  `web/src/i18n/en.ts`, `web/src/i18n/pt-br.ts` ("Site copy per locale — EN default at `/`, PT-BR at
  `/pt-br/`; edited by `add-framework--sync`, both in one run"). Anchor: the
  `| \`web/src/pages/docs.astro\` | Documentation page |` row.

### Does NOT Include (important!)

- Other languages; auto-redirect by browser language or stored choice; translating artefact names, node descriptions or the Mermaid graph (intent Out of scope, Decided 7)
- README, SVGs (`web/public/*.svg`) and `og.png` in Portuguese — the intent scopes the two pages
- Any change under `framwork/`, `mcp/` or `cli/src/` — the site ships in no package
- A rule for how future feature plans assert docs copy — they now find it in `en.ts`; a test that reads only `docs.astro` will fail loudly and be retargeted by that plan
- Deploy, publish, release, a version bump or a CHANGELOG release section (Global Constraints)

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Routing, URLs, toggle, SEO, modules, Pagefind, doc sync | As the intent decided | Intent Decided 2–9; not re-opened |
| Page pattern | `pt-br/*.astro` wrappers import the existing page files; fallback to `src/views/` only if Astro refuses | Keeps the two page paths that tests and sync point at; the fallback costs one ruling and one helper change |
| How a missing PT key fails the build | Runtime parity guard at module load + `t()` throwing on unknown key; `Strings` type for the editor | `astro build` does not type-check; adding `astro check` needs `@astrojs/check` + `typescript` packages for a guard a 20-line walk gives |
| How "no English left on /pt-br/" is checked | `SAME_IN_BOTH` allowlist guard at build | Turns an acceptance read into a build failure; a manual read misses one sentence in 1,700 lines |
| Inline markup in strings | Allowed (`code`, `a`, `strong`, `em`, `br`), rendered with `set:html` | A sentence split around its `<code>` cannot be translated naturally; content is authored, not user input |
| One key tree or per-page files | One file per language (`en.ts`, `pt-br.ts`) with `common`/`layout`/`home`/`docs` sections, each owned by one analyzer | File names fixed by intent Decided 5; section ownership keeps the "one writer per region" rule from `site-ux-polish` |
| Toggle with no JS | Plain links to the other locale's page top; JS adds the anchor | Works everywhere, keyboard included; the anchor is an enhancement |
| `AGENTS.md` | One row added | It maps `web/` files; a new copy location it omits is a stale map |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `web/astro.config.mjs` | internal | modify | i18n block (F1) |
| `web/src/i18n/en.ts` | internal | create | EN copy, `Strings` type (F2, F6, F8–F10) |
| `web/src/i18n/pt-br.ts` | internal | create | PT-BR copy (F2, F6, F8–F10) |
| `web/src/i18n/index.ts` | internal | create | `useT`, `localeHref`, guards (F2, F6, F10) |
| `web/src/layouts/Layout.astro` | internal | modify | lang, hreflang, canonical, og:locale (F3) |
| `web/src/components/LanguageToggle.astro` | internal | create | toggle (F4) |
| `web/src/pages/pt-br/index.astro`, `web/src/pages/pt-br/docs.astro` | internal | create | PT routes (F4) |
| `web/src/pages/index.astro` | internal | modify | toggle, locale links (F4); copy to keys (F6) |
| `web/src/pages/docs.astro` | internal | modify | toggle, locale links (F4); copy to keys (F8–F10) |
| `web/src/components/CommandLine.astro` | internal | modify | strings (F5) |
| `scripts/tests/web-site.test.cjs` | internal | modify | new i18n assertions (L1); retargeted copy reads (F6, F10) |
| `cli/tests/add-setup.test.js`, `brainstorm-greenfield.test.js`, `graph-mermaid.test.js`, `loop-consolidation-0070.test.js`, `ux-design-core.test.js` | product | modify | docs-copy read (F7) |
| `workbench/agents/web-docs-analyzer.md` | internal | modify | targets and pairing rule (F11) |
| `workbench/agents/web-index-analyzer.md` | internal | modify | targets and pairing rule (F12) |
| `workbench/commands/add-framework--sync.md` | internal | modify | prompts, prohibitions, pairing check (F13) |
| `workbench/provider-map.json` | internal | modify | analyzer descriptions (F13) |
| `AGENTS.md` | internal | modify | Web / Documentation row (F14) |

**Graph gate (STEP 3.2), depth 1:** `add-framework--sync` ← `add-framework--build` (HANDS_OFF_TO) — MEDIUM;
`web-docs-analyzer` ← `add-framework--sync` (DISPATCHES) — MEDIUM; `web-index-analyzer` ←
`add-framework--sync` (DISPATCHES) — MEDIUM. The `web/` files, the tests and `AGENTS.md` are not graph
nodes (not artefacts) — NOT VERIFIED by the graph; their readers were found by text search and are listed
in this table. **Delivery index (3.3), internal layer:** no delivery recorded for any of the three nodes;
the last change to them is `site-ux-polish` (Phase E), merged.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every L1 item BEFORE the F-block it covers lands and verify it fails
against the tree at that point. Then drive it GREEN.

### L1 — Source assertions in `scripts/tests/web-site.test.cjs` (RED → GREEN)

1. (F1) `astro.config.mjs` has `defaultLocale: 'en'` (either quote style), `locales` equal to `en` and `pt-br`, `prefixDefaultLocale: false`. *RED: no i18n block.*
2. (F2) `src/i18n/en.ts`, `pt-br.ts`, `index.ts` exist; `pt-br.ts` is typed `Strings`; `index.ts` exports `useT` and `localeHref`, declares `SAME_IN_BOTH`, and calls its parity and same-value guards at top level (not inside a function only pages call). *RED: no directory.*
3. (F3) `Layout.astro` carries no literal `lang="en"`, sets `lang` from the locale, and emits `hreflang="en"`, `hreflang="pt-BR"`, `hreflang="x-default"`, a canonical link and `og:locale`. *RED: literal `lang="en"`, no hreflang.*
4. (F4) `pages/pt-br/index.astro` and `pages/pt-br/docs.astro` exist and import the shared page (or view); both pages render `LanguageToggle` in the nav and in the mobile menu / sidebar; the toggle script reads `location.hash`, writes `localStorage`, binds on `astro:page-load`, and contains no `location.replace`/`location.href =` on load. *RED: no files.*
5. (F4) Neither page keeps a literal `href="/docs"` or `href="/"` for the cross-page link — both go through `localeHref`. *RED: literal hrefs today.*
6. (F5) `CommandLine.astro` holds none of the literals `>Copy<`, `"Copied"`, `"Selected. Press Ctrl+C to copy"`. *RED: all present.*
7. (F10) `index.ts` has no `UNMIGRATED` identifier once F10 lands; the behaviour is L3.3. *RED until F10.*
8. (F9) `en.ts` holds a `{ name: "ux-design", desc: "` entry. *RED until F9.*
9. Every existing `web-site.test.cjs` assertion still passes after its retarget (F6, F10) — each one keeps the property it pinned; none is deleted. A removed test name needs a `Test-Removed:` trailer, which this plan does not expect to use.

### L2 — Existing suites

1. The five cli tests (F7) pass before F8 and after F10: `node scripts/run-tests.js cli <file>` for each of `cli/tests/add-setup.test.js`, `brainstorm-greenfield.test.js`, `graph-mermaid.test.js`, `loop-consolidation-0070.test.js`, `ux-design-core.test.js`.
2. `node scripts/run-tests.js scripts scripts/tests/web-site.test.cjs` green after each phase.
3. `node scripts/build-workbench.js` exits 0 after F13; the built `.claude/agents/web-docs-analyzer.md` and `web-index-analyzer.md` carry the new targets.

### L3 — Build guards (behavioural, recorded in the ledger)

1. `npm --prefix web run build` exits 0 at the end of every phase.
2. Delete one leaf from `pt-br.ts` → the build exits non-zero naming the key; restore → exits 0. (Acceptance "Removing a key from `pt-br.ts` fails `npm run build`".)
3. Set one PT value equal to its EN value on a key not in `SAME_IN_BOTH` → the build exits non-zero naming the key; restore → exits 0. Run after F10.
4. Call `t('no.such.key')` in a page → build fails; remove → green.

### L4 — Rendered behaviour on `npm --prefix web run preview` (headless browser, recorded in the ledger)

1. `/` and `/docs/` HTML equal to the pre-change build except for the toggle, the hreflang/og:locale tags and attribute moves — the visible English text is unchanged (diff the text content of the two builds).
2. `/pt-br/` and `/pt-br/docs/`: `<html lang="pt-BR">`; text content contains no EN sentence outside Decided 7 items (spot list recorded).
3. On all four URLs: canonical = own URL; three `hreflang` links with the right targets; `x-default` = EN.
4. Toggle on desktop and at 390 px (mobile menu), by mouse and by keyboard (Tab + Enter): from `/docs/#plugins` lands on `/pt-br/docs/#plugins` and back; with JS off, lands on the page top.
5. Pagefind: a PT query on `/pt-br/docs/` returns PT sections; an EN query on `/docs/` returns EN sections.
6. Lighthouse accessibility on `/pt-br/` equals the score on `/` (and `/pt-br/docs/` equals `/docs/`).
7. `scrollWidth` at 390 px stays 390 on all four URLs (PT text is longer; `site-ux-polish` F3 must still hold).
8. Client-router swap: from `/docs/` use the toggle (JS on), then open search, filter the map to no match, and click a Copy button — the search UI, the map's empty state and the copy feedback are all in Portuguese, and the reverse swap brings English back.
9. Canonical, hreflang and toggle URLs all end in `/` (F1).

### L5 — Doc-sync acceptance (F11–F13)

1. Write a sample `.tmp/sync/change-payload.json` (one skill description changed, one command added — the new command appears as a pair of `docs.commands.groups` edits, per F8/F11). Dispatch a general-purpose agent whose prompt is the BUILT `web-docs-analyzer` body (a session's agent registry is loaded at start, so the edited agent may not be dispatchable by name in the same session). The report holds paired objects targeting `web/src/i18n/en.ts` and `web/src/i18n/pt-br.ts`, with PT `new` in Portuguese, and no copy edit targeting `docs.astro`. Delete the scratch files after.
2. Same for `web-index-analyzer` with a payload changing the install command line: the edit targets `index.astro` (a literal prop), not the modules.

**RED expectations against the current tree:** L1.1–L1.8 fail today (no i18n code); L2.1 passes today and must keep passing; L3 and L4 cannot run before F4.
**GREEN = all levels pass after F1–F14.**

---

## Execution Order

F7 [product] → F1 [internal] → F2 [internal] → F3 [internal] → F4 [internal] → F5 [internal] → F6 [internal] → F8 [internal] → F9 [internal] → F10 [internal] → F11 [internal] → F12 [internal] → F13 [internal] → F14 [internal]

- **F7 first** because it is green on today's tree and keeps the cli suite green through every docs move.
- **F1 → F4** build the frame in dependency order: config, modules, layout, routes + toggle. After F4 the site builds and serves four URLs (PT bodies still English, allowed by `UNMIGRATED`).
- **F5, F6** finish the landing; **F8 → F10** finish the docs; F10 deletes `UNMIGRATED`, so the untranslated guard is fully on only after the last copy move.
- **F11 → F13** after the modules exist, so the analyzers describe a real shape; F12 and F13 consume F11's contract.
- **F14** last: it documents what is now true.

Safe stopping points: after F4, after F6, after F10, after F13 — each builds green.

Per-F-block validation beyond the layer default: `npm --prefix web run build` after every `web/` F-block; L3 after F2 (parity) and after F10 (same-value); L4 at F4 (routes, toggle, SEO) and at F10 (full).

## Reviewer Handoff

For each F-block the ledger records what changed, which validation levels cover it and their state, and any
decision altered (the page-pattern fallback is the one foreseen).

Gaps a reviewer must actively hunt:

1. An F-block marked done whose L1 item was never RED — a test written after the change proves nothing.
2. An English string left hard-coded in a page or inline script that the `SAME_IN_BOTH` guard cannot see because it never went through `t()` — compare L4.2's text dump of `/pt-br/docs/` against the EN one.
3. A retargeted test (F6, F7, F10) that no longer pins what it pinned — e.g. a regex loosened until it matches anything.
4. `SAME_IN_BOTH` grown to silence the guard: every entry must be a brand word, an artefact name or a word Portuguese borrows as is.
5. The sync coordinator applying the `en.ts` half of a report when the `pt-br.ts` half fails to match.
6. At the safe stops after F4 and F6, `/pt-br/docs/` still shows English body text (allowed by `UNMIGRATED`). That is only acceptable mid-branch — the PR must not open before F10.
7. A client string that reads its text once at script start instead of on every `astro:page-load` — it keeps the old language after a router swap (L4.8).

---

## Next Steps

/add-framework--build docs/plans/2026-10-25T194930-PLAN--site-i18n.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-25 | Initial creation |
| 2026-10-25 | Review fix-then-ok applied: `alternateUrls` moved to `index.ts` (B1); guard rules for arrays and `SAME_IN_BOTH` path format (B2); commands grid as `docs.commands.groups` rendered by a loop (B3); quoted anchors for F4–F10 and F7 (A1); `graph-mermaid` window must be non-empty (A2); full `run-tests.js cli` commands (A3); router-swap and mid-branch English risks added to L4.8 and handoff gaps 6–7 instead of a Risks section, which the bounded shape omits (A4); L1.7 reworded (A5); `routing.prefixDefaultLocale` nesting and trailing-slash URLs (N1, N2) |
