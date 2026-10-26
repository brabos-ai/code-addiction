---
path: bounded
topic: site-i18n
doc: none
delivery: confirm
ticket: 0069B
depends_on: site-ux-polish
---

<!-- Exported from Notion intent https://app.notion.com/p/404e0000aeae81b09c20fe808675aa90 (card site-i18n, ticket 0069B) on 2026-10-25. Approved by Maicon 2026-10-25 10:13 BRT with English as the default language. Depends on site-ux-polish (0068B, intent docs/brainstorming/2026-10-25T101500-site-ux-polish-intent.md). -->

## Decided

1. Problem: the site (https://code.brabos.ai/ and /docs/) is English only (`web/src/layouts/Layout.astro:14` `lang="en"`), while virtually all of Maicon's users are Brazilian. Add an EN/PT-BR toggle with full Portuguese versions of the landing and the docs. Verified on main `5ef82709`. Paths under `web/` unless stated. Runs after `site-ux-polish`, whose `CommandLine.astro` component and `src/data/providers.ts` remove most duplicated markup first.
2. Routing: Astro built-in i18n (`i18n` in `astro.config.mjs`, no new package), `defaultLocale: 'en'`, `locales: ['en', 'pt-br']`, `prefixDefaultLocale: false`. English stays at `/` and `/docs/` (current URLs unchanged); Portuguese at `/pt-br/` and `/pt-br/docs/`. `<html lang>` follows the locale (`en` / `pt-BR`).
3. Toggle: an `EN | PT-BR` switch in the top nav of both pages (and in the mobile menu), linking to the same page and the same section anchor in the other language. The choice is remembered in `localStorage` only to keep the toggle consistent; no automatic redirect from browser language or stored choice on page load (keeps a static site crawlable and shared links stable).
4. SEO: each page declares `<link rel="alternate" hreflang="en">`, `hreflang="pt-BR"` and `x-default` (= en) plus its own canonical, in `Layout.astro`; `og:locale` per language.
5. Translations: one strings module per language, `src/i18n/en.ts` and `src/i18n/pt-br.ts`, same keys, plus a tiny `t()` helper keyed by `Astro.currentLocale`. Pages and components read text from it; no page duplication. A missing key in `pt-br.ts` is a build/type error (the PT module is typed against the EN keys), so the languages cannot drift silently.
6. Pages: `src/pages/index.astro` and `src/pages/docs.astro` render both locales from the same file (e.g. `src/pages/[...locale]/` or thin `src/pages/pt-br/index.astro` + `pt-br/docs.astro` wrappers that render the shared page body); the Engineer picks the lighter Astro pattern.
7. Not translated: command, skill, agent, plugin and feature names, CLI commands and file paths (that is what users type). Ecosystem Map node descriptions stay English for now (they come from the build sidecar `framwork/.codeadd/artefact-graph.json`). The artefact Mermaid graph stays English.
8. Pagefind (from `site-ux-polish`) indexes per language using the `lang` attribute, so PT-BR searches return PT-BR sections.
9. Doc sync: `workbench/commands/add-framework--sync.md` and its analyzers `workbench/agents/web-docs-analyzer.md` and `web-index-analyzer.md` today target `docs.astro`/`index.astro` text. They change to target `src/i18n/en.ts` and `src/i18n/pt-br.ts`, and every content update edits both languages in the same run. English is the primary text (default locale); the PT-BR entry is written as natural Brazilian Portuguese, not a literal translation.

## Acceptance

- `/` and `/docs/` unchanged in English; `/pt-br/` and `/pt-br/docs/` fully in Portuguese, with no English sentence left outside the decision 7 exceptions.
- Toggle switches language keeping the current section anchor, on desktop and mobile, by keyboard.
- `hreflang`, canonical and `lang` correct on all four URLs.
- Removing a key from `pt-br.ts` fails `npm run build` in `web/`.
- `add-framework--sync` dry run on a sample change proposes edits to both `en.ts` and `pt-br.ts`.
- `npm run build` green; Lighthouse accessibility on `/pt-br/` matches `/`.

## Out of scope

- Other languages.
- Auto-redirect by browser language.
- Translating artefact names or graph node descriptions.

## Risks

- Moving ~1,800 lines of docs text into a strings module is the bulk of the effort (L, 1-2 days); doing it after `site-ux-polish` lowers it.
- The sync analyzers' old→new verbatim-edit contract must now cover two files; a half-applied update leaves the languages out of step (decision 5 catches missing keys, not stale wording).

## Open

None
