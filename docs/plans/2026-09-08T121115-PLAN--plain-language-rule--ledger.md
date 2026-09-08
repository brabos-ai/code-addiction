# Build ledger — plan: docs/plans/2026-09-08T121115-PLAN--plain-language-rule.md

F7: Ruling: L2.3 asserts a STANDALONE HTML-comment marker line, not the plan's literal "in any form" — add-claude-md-style quotes `<!-- codeadd-wiki:start -->` mid-sentence to document why that form is banned, so the plan's wording would forbid documenting its own rule — costs a missed marker only if someone embeds one mid-line, which the build would not strip anyway
F7: complete (commits 9592756..df7064e, 16 RED / 5 guards GREEN)
F1: complete (commits df7064e..77738b2, L4.1 GREEN, build.js exit 0 clean)
F2: Ruling: made the test helper `section()` fence-aware — both files embed fenced templates carrying their own H2s (`## Project Knowledge Base`, `## ROLE`), so a naive `^## ` scan returned a fragment and every assertion below it passed by measuring nothing — costs nothing if wrong; the alternative was L1.1 and all of L3 asserting against truncated text
F2: complete (commits 77738b2..b4846d5, L1.1-L1.7 GREEN, build.js exit 0 clean)
F3: complete (commits b4846d5..de45bb2, L1.8-L1.9 GREEN, build.js exit 0 clean)
F4: complete (commits de45bb2..0bd649e, L2.2 + L3.1-L3.3 GREEN, build.js exit 0 clean)
F5: Ruling: L3.4 asserts an explicit `⛔ DO NOT:` prohibition naming Architecture Contract and Technical Spec, replacing the plan's proxy of asserting those names are ABSENT — name-absence forbade the clearest instruction available and the framework's own command-authoring rules require imperative tool-specific prohibitions — costs a weaker guard only if someone names the sections in update mode without a prohibition, which the ⛔ form now catches
F5: complete (commits 0bd649e..fe095a4, L3.4 GREEN, build.js exit 0 clean)
F6: complete (commits fe095a4..df60fd6, L4.4 GREEN — full matrix 21/21, cli suite 38 files / 855 tests all pass, build.js exit 0 clean)
DOCS: complete (changelog, plan status implemented, CLAUDE.md tracking policy; Project Anatomy counts unchanged 16/41/22 and verified against provider-map.json)
