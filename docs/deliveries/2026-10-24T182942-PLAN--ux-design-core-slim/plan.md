# Plan: ux-design-core-slim — drop the bundled library docs from add--ux-design, keep the design core

> **Status:** implemented
> **Layers:** both
> **Type:** product
> **Created:** 2026-10-24
> **Delivery:** confirm
> **Ticket:** 0061B

---

## Objective

[from conversation, no design document] `framwork/.codeadd/skills/add--ux-design/` stops bundling
~1.51MB of third-party library docs (shadcn, Tailwind v3, motion, recharts, TanStack query/router/table)
and keeps only its ~84KB design core; every artefact that pointed at those docs points component and
library APIs at the project's own conventions (`wiki/conventions.md` / `AGENTS.md`) instead.

**When this build is done:** the skill ships the eight design-core files and nothing else; no source,
test or web page names a removed file; the three places that told an agent to read bundled library docs
(`ux-layout-agent`, `add-ux`, `add-build`) tell it to read the project's own components and docs; a
read-only test keeps it that way; the delivery's changelog warns users that `codeadd update` deletes the
bundled docs.

**Ticket done when:** the seven library-doc files (shadcn, tailwind-v3, motion-dev, recharts, tanstack-query/router/table) are gone from add--ux-design; the eight design-core files stay; SKILL.md uses-block and Docs Lookup, ux-layout-agent, add-ux, add-build, resource-path-convention, build.test, ecosystem index and docs.astro no longer reference them; component APIs point to the project's conventions (wiki/conventions.md / AGENTS.md); build and test:all pass; the release note warns that update removes the bundled docs.

## Context

The skill is the largest in the framework (1,594,836 bytes) and the bundled docs tie the UX layer to one
stack. Ticket 0061B is card 2 of 6 in the `2026-10-24T18300*` set; it blocks `design-plugin` (0065B).

**Every decision here was taken and approved in the document below. This plan does not re-derive them —
it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-24T183002-ux-design-core-slim-intent.md` | `path: bounded`; decisions 1–16 (keep/remove lists, every edit site, no migration, scope-out list, acceptance criteria, risks); `## Open` = None |

## Global Constraints

- Anchor every edit by quoted text, never by line number — card 0063B (agnostic-dev-skills) edits lines neighbouring these (ticket 0061B notes: "Edits lines neighbouring agnostic-dev-skills: locate by text, not line numbers")
- Keep (design core, 84,160 bytes): `SKILL.md`, `design-contract.md`, `critique-rubric.md`, `ux-laws-principles.md`, `modern-patterns.md`, `ux-writing.md`, `design-direction.md`, `saas-patterns.md` (intent decision 2)
- Remove: `shadcn-docs.md`, `tailwind-v3-docs.md`, `motion-dev-docs.md`, `tanstack-router-docs.md`, `recharts-docs.md`, `tanstack-table-docs.md`, `tanstack-query-docs.md` (intent decision 3)
- No rename of the skill or of any STEP id (intent decision 13)
- `rg --hidden "shadcn-docs|tailwind-v3-docs|motion-dev-docs|recharts-docs|tanstack-(query|router|table)-docs" framwork/ cli/ web/ workbench/ scripts/` returns nothing (intent decision 15b)
- Stack-flavoured wording that is not a reference to a removed file stays — card `agnostic-dev-skills` owns it (intent decision 13)
- No migration script; `framwork/provider-map.json` `"add--ux-design": {}` stays (intent decision 11)
- No deploy, publish, rollout or release task — the update warning is changelog text only (invocation)
- The plan is stack-agnostic: no edit adds a library, framework or stack name (ticket 0061B objective: the bundled docs "tie the UX layer to one stack")

## Problem

1. **1.51MB of one stack's docs inside a design skill** — every install of any provider carries shadcn,
   Tailwind v3, motion, recharts and TanStack docs, and three artefacts tell agents to read them even in a
   project that uses none of those libraries.

## Proposal

Delete the seven files, cut every pointer to them, and replace the three "read the bundled docs"
instructions with one rule: component and library APIs come from the project itself — the component
inventory in `design-context.md`, then the project's own sources/docs as named in
`{{addpath:wiki/conventions.md}}` / `{{addpath:wiki/domains/frontend.md}}` when present, else `AGENTS.md`.
A read-only test lands first and is RED today; the edits drive it GREEN.

## Scope

### Includes

- **F1** [product] — NEW `cli/tests/ux-design-core.test.js` (vitest, reads the source tree only, writes
  nothing). Checks, none of which spells a removed filename (criterion 15b covers `cli/`):
  1. `framwork/.codeadd/skills/add--ux-design/` holds exactly the eight Global-Constraints files, no more
     and no fewer. *RED today: 15 files.*
  2. Every `{{skill:add--ux-design/<file>}}` token in `framwork/.codeadd/**/*.md` resolves to a file that
     exists in that folder. *GREEN today; it is the guard that goes RED in the window F2→F6 (the
     `add--resource-path-convention` example still points at a deleted file) — the build records that.*
  3. No `*-docs.md` filename appears in `add--ux-design/SKILL.md`, `agents/ux-layout-agent.md`,
     `commands/add-ux.md`, `commands/add-build.md` (regex `[a-z0-9-]+-docs\.md`; verified today that every
     match in those files is one of the seven). *RED today.*
  4. `ux-layout-agent.md` contains `wiki/conventions.md` and `design-context.md`; the section of
     `add-ux.md` from the heading `## STEP add-ux.docs` to the next `## STEP` contains `wiki/conventions.md`
     and `AGENTS.md`; the section of `add-build.md` from `## MANDATORY: Load Development Skill` to the next
     `## ` heading contains `wiki/conventions.md` and `AGENTS.md`. *RED today: none of the three spots has
     them.*
  5. The `add--ux-design` description in `skills/add--ecosystem/SKILL.md` (row starting `| add--ux-design |`)
     equals the `desc` of `{ name: "ux-design",` in `web/src/pages/docs.astro`, and neither contains
     `shadcn`. *RED today: both contain it.*
  - **Produces:** `ux-design-core.test.js` (the RED suite F2–F9 drive GREEN)
- **F2** [product] — `framwork/.codeadd/skills/add--ux-design/` (intent decisions 3, 4): delete the seven
  files; in `SKILL.md` remove the seven `- skill: add--ux-design/<removed>.md` rows from the `<!-- uses:`
  block (anchor: each row's own text) and replace the `### Docs Lookup` heading and its table with a short
  rule — component and library APIs come from the project's installed components and its own docs, as
  named in `{{addpath:wiki/conventions.md}}` / `{{addpath:wiki/domains/frontend.md}}` when present, else
  `AGENTS.md`; the skill bundles no library docs. Must NOT lose: the `## Support Files` table,
  `### Recommended Libraries` verbatim (the `@ux-flow-agent` Step 0.5 fallback), the frontmatter, every
  other `uses:` row. The build must pass at this boundary (a dangling `uses:` row fails
  `assertArtefactGraph`, which is why rows and files go in one commit).
  - **Consumes:** `ux-design-core.test.js` (F1)
- **F3** [product] — `framwork/.codeadd/agents/ux-layout-agent.md` (intent decision 5): replace the
  sentence starting `Load skill \`add--ux-design\` files \`shadcn-docs.md\`` with: use the component
  inventory in `design-context.md` (from `@ux-flow-agent` Step 0.3); when a component's API matters, read
  the project's own component sources/docs as pointed by `{{addpath:wiki/conventions.md}}`
  (+ `{{addpath:wiki/domains/frontend.md}}`) if they exist, else `AGENTS.md`; never assume a library the
  inventory does not show. The sentence starting `Follow skill \`add--ux-design\` file \`design-contract.md\``
  stays verbatim. Card 0065B anchors its `design.layout` slot on this rewritten line (see Execution
  Order) — no F-block in this plan reads it.
  - **Consumes:** `ux-design-core.test.js` (F1)
- **F4** [product] — `framwork/.codeadd/commands/add-ux.md` STEP `add-ux.docs` (intent decision 6): remove
  the seven table rows starting `| \`shadcn-docs.md\``, `| \`tailwind-v3-docs.md\``, `| \`motion-dev-docs.md\``,
  `| \`recharts-docs.md\``, `| \`tanstack-table-docs.md\``, `| \`tanstack-query-docs.md\``,
  `| \`tanstack-router-docs.md\``; keep the three design-core rows; add one line: for component/library
  APIs, read the project's own docs per `{{addpath:wiki/conventions.md}}` / `AGENTS.md`. The STEP id and
  the index line `STEP add-ux.docs → Load complementary skill docs` stay — the label still reads true for
  the design-core docs (decided: no reword). STEP `add-ux.discover` is not touched (0063B edits it).
  - **Consumes:** `ux-design-core.test.js` (F1)
- **F5** [product] — `framwork/.codeadd/commands/add-build.md` (intent decision 7): replace the line
  `- Reference component docs as needed: shadcn, tailwind-v3, motion, recharts, tanstack` with
  `- Component/library APIs: follow the project's own docs per {{addpath:wiki/conventions.md}} / AGENTS.md`.
  Nothing else in the file changes (0063B and 0064B edit or cite other lines).
  - **Consumes:** `ux-design-core.test.js` (F1)
- **F6** [product] — `framwork/.codeadd/skills/add--resource-path-convention/SKILL.md` (intent decision 8):
  in the `### Correct` example, `4. For components, Grep {{skill:add--ux-design/shadcn-docs.md}}` becomes
  `4. For layout notation, Read {{skill:add--ux-design/design-contract.md}}`.
  - **Consumes:** `ux-design-core.test.js` (F1)
- **F7** [product] — `cli/tests/build.test.js` (intent decision 9): in the test
  `resolves {{skill:NAME/SUBFILE}} for non-SKILL.md files`, swap `shadcn-docs.md` for `design-contract.md`
  in both the input and the expected string. The test's verb and shape stay.
- **F8** [product] — `framwork/.codeadd/skills/add--ecosystem/SKILL.md` (intent decision 10): in the row
  starting `| add--ux-design |`, the description `Components, mobile-first, SaaS patterns, shadcn, Tailwind`
  becomes `Design direction, UX laws, layout contract, critique rubric, SaaS patterns, mobile-first`. The
  "loads" column and every other row stay (0060B, 0063B, 0064B, 0065B edit other rows).
  - **Consumes:** `ux-design-core.test.js` (F1)
- **F9** [internal] — `web/src/pages/docs.astro` (intent decision 10): the entry `{ name: "ux-design", desc: "…" }`
  gets the same description as F8, byte for byte. The graph edges and every other entry stay.
  - **Consumes:** `ux-design-core.test.js` (F1)
- **F10** [internal] — the delivery's changelog under `docs/changelog/` (written at build STEP 8; name per
  `add-plan-authoring`, verb `remove`, slug `ux-design-core-slim`): a user-facing warning (intent decision
  16) — `codeadd update` removes the seven bundled library docs from `add--ux-design`; agents now read
  component APIs from the project's own components and docs (`wiki/conventions.md` / `AGENTS.md`); local
  edits inside those seven files are deleted with them by `pruneObsolete`. Text only — no tag, no release,
  no publish.

### Does NOT Include (important!)

- Stack-flavoured wording that names no removed file: `add-hotfix.md` ("shadcn, Tailwind v3"),
  `ux-agent.md`, `ux-flow-agent.md`, `add-ux.md` STEP `add-ux.discover`, `add-review.md`, `add-plan.md`,
  `frontend-agent.md`, code examples inside the kept files → card 0063B
- `### Recommended Libraries` in `SKILL.md` — kept as the greenfield default
- The ui-ux-pro-max integration → card 0065B
- A migration script, a `provider-map.json` change, a skill or STEP rename
- Any release, tag, publish or deploy

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| All edit sites, keep/remove lists, no migration | As the intent states | Intent decisions 1–16, approved by Maicon |
| Reword the `add-ux.docs` index label? | No | It still reads true for the three design-core docs; intent 6 allows a reword only if stale |
| Add a permanent test, or only one-off greps? | Permanent `ux-design-core.test.js`, RED first | A grep at build time proves nothing next month; the test also covers `cli/` under criterion 15b because it never spells a removed name |
| Layer of `web/src/pages/docs.astro` | `[internal]` | Repo root, not `mcp/`, not shipped in the npm package (`add-plan-authoring` layer table) |
| Where the update warning lives | The delivery's changelog | `add-framework--release` writes notes from the changelog; this plan has no release step (same as sibling plan 0060B) |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/tests/ux-design-core.test.js` | product | create | F1 |
| `framwork/.codeadd/skills/add--ux-design/{shadcn-docs,tailwind-v3-docs,motion-dev-docs,recharts-docs,tanstack-query-docs,tanstack-router-docs,tanstack-table-docs}.md` | product | remove | F2 |
| `framwork/.codeadd/skills/add--ux-design/SKILL.md` | product | modify | F2 — risk HIGH (12 depth-1 dependants; none reads a removed file) |
| `framwork/.codeadd/agents/ux-layout-agent.md` | product | modify | F3 — risk HIGH (3: ux-flow-agent, add-plan, add--ux-design) |
| `framwork/.codeadd/commands/add-ux.md` | product | modify | F4 — risk LOW (0) |
| `framwork/.codeadd/commands/add-build.md` | product | modify | F5 — risk HIGH (26, one line in the subagent prompt) |
| `framwork/.codeadd/skills/add--resource-path-convention/SKILL.md` | product | modify | F6 — risk MEDIUM (1: add--doc-schemas) |
| `cli/tests/build.test.js` | product | modify | F7 |
| `framwork/.codeadd/skills/add--ecosystem/SKILL.md` | product | modify | F8 — risk HIGH (6; description text only) |
| `web/src/pages/docs.astro` | internal | modify | F9 |
| `docs/changelog/<ts>-remove-ux-design-core-slim.md` | internal | create | F10 — written at build STEP 8 |

`AGENTS.md` is not changed. Delivery index: `history add--ux-design --layer product` → no delivery recorded;
the seven files have no graph node of their own.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F1 lands before any edit and is run against the current tree.

### L1 — Unit (RED → GREEN)

1. `ux-design-core.test.js` checks 1, 3, 4 and 5 fail on the current tree; check 2 passes. *RED today as
   stated per check in F1.* GREEN after F2–F9. Covers F1–F6, F8, F9.
2. `cli/tests/build.test.js` `resolves {{skill:NAME/SUBFILE}} for non-SKILL.md files` passes with
   `design-contract.md`. Covers F7.

### L2 — Integration

1. `npm run build` exits 0 with no new warning — no dangling `uses:` row. Covers F2.
2. The rg in Global Constraints returns nothing. Covers F2–F7, F9.
3. The built `add--ux-design` folder for one provider (e.g. `framwork/.claude/skills/add--ux-design/`)
   holds eight files totalling ~84KB (source core is 84,160 bytes; path resolution changes a few bytes).
4. `npm run test:all` passes, run per `scripts/run-tests.js` policy (container). Includes
   `qa-reachability.smoke.test.js`, which checks only kept files.

### L3 — Behavioural acceptance

1. Reading `ux-layout-agent.md`, `add-ux.md` STEP `add-ux.docs` and the `add-build.md` subagent prompt, an
   agent is sent to the project's own components/docs (`wiki/conventions.md` / `AGENTS.md`), never to a
   bundled file. Covers F3–F5.
2. The changelog carries the update warning naming the seven files and the `pruneObsolete` deletion of local
   edits. Covers F10.

**RED expectations against the current tree:** L1.1 checks 1, 3, 4, 5 fail.
**GREEN = all levels pass after F1–F10.**

---

## Execution Order

F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9 → F10. One commit per F-block.

- **F1 first** so the RED state is recorded before any edit.
- **F2 deletes files and `uses:` rows in one commit** so `npm run build` passes at every boundary from F2 on.
- Between F2 and F6, L1.1 check 2 is RED (the resource-path example points at a deleted file); expected,
  record it in the ledger.
- F10 is the build's STEP 8 changelog.

**Cross-card order (anchor by text):** this card lands before 0065B, which slots `design.layout` on the
`ux-layout-agent.md` line F3 rewrites — 0065B must anchor on the new text. 0063B edits neighbouring lines
of `add-ux.md` (STEP `add-ux.discover`) and `add-build.md`; 0060B, 0063B, 0064B, 0065B edit other rows of
`add--ecosystem/SKILL.md` / `docs.astro`. Whichever lands second rebases by quoted text. `ux-design-core.test.js` check 1 pins the folder to eight files: a later card that adds a file to `add--ux-design/` updates that list in the same commit (0065B puts its files under `plugins/design/`, so none does today).

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, the validation level and its pass state,
and any departure from the intent with the decision number.

Gaps to hunt:

1. L1.1 never shown RED before F2 — a test written after the fix proves nothing.
2. `### Recommended Libraries` or the Support Files table changed in F2 (must be verbatim).
3. The `design-contract.md` sentence in `ux-layout-agent.md` reworded (must be verbatim).
4. F8 and F9 descriptions not byte-identical.
5. Any stack-wording edit outside the removed-file pointers (belongs to 0063B).

---

## Next Steps

/add-framework--build docs/plans/2026-10-24T182942-PLAN--ux-design-core-slim.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-24 | Initial creation |
| 2026-10-24 | Review ok: Global Constraints sources cited from ticket 0061B (N2); cross-card note on the eight-file pin (N3). N1 not applied — the template requires the no-design-document marker |
