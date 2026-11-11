# Build ledger — plan: docs/plans/2026-10-25T194930-PLAN--site-i18n.md

F7: complete (commits 220a1d9..47b89f4, 5 cli tests green via run-tests.js cli)
F1: complete (commits 47b89f4..61314b7, web build exit 0, web-site.test.cjs green, L1 RED observed first)
F2: complete (commits 61314b7..f3d6c13, web build exit 0, web-site.test.cjs green, L1 RED observed first)
F3: complete (commits f3d6c13..c68ff1a, web build exit 0, web-site.test.cjs green, L1 RED observed first)
F4: complete (commits c68ff1a..712f556, web build exit 0, web-site.test.cjs green, L1 RED observed first)
F5: complete (commits 712f556..ee99eeb, web build exit 0, web-site.test.cjs green; L1.6 RED confirmed against HEAD literals)
F6: Ruling: the session demo's last line (Build complete … /add-review) is translated with the command kept intact — the plan keeps only command lines and output lines that are commands literal; this line is prose around a command — costs one key moved to SAME_IN_BOTH-style literal if wrong
F6: Ruling: layout.titleSuffix not created — Layout has no title suffix today, so the key would be unused — none
F6: Ruling: the four Why cards stay hand-written markup reading home.why.cards.N.* — the existing F19 test counts why-card occurrences in index.astro, a loop would break what it pins — costs nothing
F6: complete (commits ee99eeb..bdf8554, web build exit 0 with home out of UNMIGRATED, web-site.test.cjs green after retarget)
F8: Ruling: executed by a delegated sonnet agent against .codeadd/.temp/i18n-brief.md; EN visible text of the whole page diffed identical before/after — costs a re-read of docs.* if the diff missed markup
F8: Ruling: the PT setup reply examples ("1 sim, 2 não", "tudo recomendado") are translated — they are illustrations of a chat answer, not a command contract — costs a revert of two values if the command expects the English words
F8: complete (commits bdf8554..ead34a9, web build exit 0, web-site.test.cjs 48/48, 5 cli tests green, EN text diff identical)
F9: Ruling: scenario steps use the field name cmd instead of name — the parity guard forces every name field to be identical in both languages, and scenario 4 has a translatable step label — costs a rename if a later guard wants name
F9: Ruling: loop-only styling data (badge/step colours, feature-to-command lists) stays as constants in docs.astro frontmatter, not in the modules — they are not copy — none
F9: complete (commits ead34a9..33a28e9, web build exit 0, web-site.test.cjs green, 5 cli tests green, EN visible text identical; L1.8 added)
F10: Ruling: the #eco-search aria-label assertion accepts the literal attribute or the t("docs.ecosystem.filterAria") call and separately pins a non-empty filterAria in en.ts — same fact pinned, label now comes from a key — costs a tighter regex if a reviewer wants the call form only
F10: Ruling: console.warn/console.error dev messages in the inline scripts stay English — not user-visible copy — none
F10: Ruling: the close button of the ecosystem panel keeps no accessible name — adding one would change EN output beyond this plan — a follow-up ticket if wanted
F10: complete (commits 33a28e9..ab73e96, web build exit 0, web-site.test.cjs green, 5 cli tests green; L3.2 and L3.3 proven by the delegated agent: build exits non-zero naming the key, restored exits 0)
F11: complete (commits ab73e96..56dda6e, build-workbench exit 0, build.js no graph warning, L5.1 dry run paired en/pt-br objects, no docs.astro copy edit)
F12: complete (commits 56dda6e..c2c6d1f, L5.2 dry run: install command edit targets index.astro only)
F13: complete (commits c2c6d1f..edd432e, build-workbench exit 0, built agents carry the new targets, build.js clean)
F14: complete (commits edd432e..508cbf2, inventory.js --check current)
GRAPH: add-framework--sync — add-framework--build (HANDS_OFF_TO, named in plan); no entry
GRAPH: web-docs-analyzer — add-framework--sync (DISPATCHES, named in plan); no entry
GRAPH: web-index-analyzer — add-framework--sync (DISPATCHES, named in plan); no entry
Ruling: review finding "SAME_IN_BOTH holds a sentence fragment (steps.5.text)" accepted — PT now reads "changelog, docs e merge" and the entry is removed — none
Ruling: review finding "docs.ecosystem.agents/typeSkill/typeAgent and docs.providers.provider are translatable" rejected — they label ecosystem node types and the providers column that match English node ids and provider names (Decided 7) — costs a PT value + removal of 4 SAME_IN_BOTH entries if wrong
Ruling: review finding "same-value guard skips every leaf called name" rejected — the plan states name fields are exempt (F2 Guard rules) and parity forces them equal to EN — none
Ruling: review finding "graph-mermaid added assertion is a tautology" rejected — the plan prescribes exactly that window check (F7); the empty-window assertion is the real guard — a stricter test if wanted
Ruling: review findings "PT caveat/claims not pinned by cli tests" rejected — plan F7 retargets the tests to docs.astro + en.ts only — PT copy relies on the parity guard
Ruling: review finding "Pagefind bundle loaded once may keep the first page's language index" rejected without a browser run — each mountUi builds a new PagefindUI instance after before-swap destroy, and Pagefind reads html lang at instance init — costs a fix if L4.5/L4.8 show EN results on /pt-br/docs/ after a swap; L4 was NOT run (no headless browser in this session)
Ruling: review findings on console messages, README link without slash, localStorage never read, ecosystem.json and SVGs staying English — rejected/out of scope per plan (Decided 7, intent Out of scope, F4 writes the choice and never redirects) — none
Ruling: review finding "web-docs-analyzer ALWAYS lines restate L31/L33" rejected — reinforcement at the report-writing point where an unpaired edit is tempting — none
Ruling: review findings on web-index-analyzer schema example (array), coordinator wording, sync 5.2 "each other target file", 5.3 half-skip, pair match rule and rerun wording accepted and applied — none
REVIEW: complete (24 findings, 9 applied, 15 rejected)
